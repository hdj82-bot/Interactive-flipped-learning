#!/bin/bash
# ══════════════════════════════════════════════════════════════════════════════
# IFL Platform — 프로덕션 배포 스크립트
#
# 사용법:
#   # 최초 배포
#   DOMAIN=ifl-platform.com EMAIL=admin@ifl-platform.com ./scripts/deploy.sh init
#
#   # 업데이트 배포
#   ./scripts/deploy.sh update
#
#   # 상태 확인
#   ./scripts/deploy.sh status
#
#   # 롤백
#   ./scripts/deploy.sh rollback
# ══════════════════════════════════════════════════════════════════════════════
set -euo pipefail

COMPOSE_FILE="docker-compose.prod.yml"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

# 색상
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()   { echo -e "${GREEN}[DEPLOY]${NC} $*"; }
warn()  { echo -e "${YELLOW}[WARN]${NC} $*"; }
error() { echo -e "${RED}[ERROR]${NC} $*" >&2; }

# ── 환경변수 검증 ─────────────────────────────────────────────────────────
validate_env() {
    log "환경변수 검증 중..."
    if [ ! -f .env ]; then
        error ".env 파일이 없습니다. .env.production을 복사하세요:"
        error "  cp .env.production .env && vi .env"
        exit 1
    fi

    local required_vars=(
        "DATABASE_URL" "JWT_SECRET_KEY" "POSTGRES_PASSWORD"
        "GOOGLE_OAUTH_CLIENT_ID" "GOOGLE_OAUTH_CLIENT_SECRET"
        "ANTHROPIC_API_KEY" "AWS_ACCESS_KEY_ID" "AWS_SECRET_ACCESS_KEY"
        "S3_BUCKET" "HEYGEN_API_KEY" "ELEVENLABS_API_KEY"
        "STRIPE_SECRET_KEY" "STRIPE_WEBHOOK_SECRET"
    )

    local missing=()
    for var in "${required_vars[@]}"; do
        val=$(grep "^${var}=" .env | cut -d'=' -f2-)
        if [ -z "$val" ] || [[ "$val" == *"CHANGE_ME"* ]]; then
            missing+=("$var")
        fi
    done

    if [ ${#missing[@]} -gt 0 ]; then
        error "다음 환경변수가 설정되지 않았습니다:"
        for v in "${missing[@]}"; do
            error "  - $v"
        done
        exit 1
    fi

    log "환경변수 검증 완료 ✓"
}

# ── 최초 배포 ─────────────────────────────────────────────────────────────
cmd_init() {
    log "=== IFL Platform 최초 배포 ==="

    validate_env

    DOMAIN=${DOMAIN:?'DOMAIN 환경변수를 설정하세요'}
    EMAIL=${EMAIL:?'EMAIL 환경변수를 설정하세요'}

    # 1. Docker 이미지 빌드
    log "Docker 이미지 빌드 중..."
    docker compose -f "$COMPOSE_FILE" build

    # 2. DB + Redis 먼저 시작
    log "DB, Redis 시작 중..."
    docker compose -f "$COMPOSE_FILE" up -d db redis
    sleep 10

    # 3. DB 마이그레이션
    log "DB 마이그레이션 실행 중..."
    docker compose -f "$COMPOSE_FILE" run --rm backend alembic upgrade head

    # 4. SSL 인증서 발급
    log "SSL 인증서 발급 중..."
    DOMAIN="$DOMAIN" EMAIL="$EMAIL" ./scripts/init-ssl.sh

    # 5. 전체 서비스 시작
    log "전체 서비스 시작 중..."
    docker compose -f "$COMPOSE_FILE" up -d

    # 6. 헬스체크
    sleep 15
    cmd_status

    log "=== 배포 완료 ==="
    log "프론트엔드: https://$DOMAIN"
    log "백엔드 API: https://api.$DOMAIN"
    log "Swagger UI: https://api.$DOMAIN/docs"
}

# ── 업데이트 배포 ─────────────────────────────────────────────────────────
cmd_update() {
    log "=== IFL Platform 업데이트 배포 ==="

    validate_env

    # 현재 이미지 태그 저장 (롤백용)
    local current_backend=$(docker inspect --format='{{.Image}}' ifl_backend 2>/dev/null || echo "none")
    echo "$current_backend" > /tmp/ifl_rollback_image

    # 1. 최신 코드 pull
    log "최신 코드 Pull..."
    git pull origin main

    # 2. 이미지 다시 빌드
    log "Docker 이미지 빌드 중..."
    docker compose -f "$COMPOSE_FILE" build

    # 3. DB 마이그레이션
    log "DB 마이그레이션 확인 중..."
    docker compose -f "$COMPOSE_FILE" run --rm backend alembic upgrade head

    # 4. 서비스 순차 재시작 (무중단에 가깝게)
    log "백엔드 서비스 재시작..."
    docker compose -f "$COMPOSE_FILE" up -d --no-deps backend worker beat

    # 5. 프론트엔드 재시작
    log "프론트엔드 재시작..."
    docker compose -f "$COMPOSE_FILE" up -d --no-deps frontend

    # 6. nginx 리로드
    docker compose -f "$COMPOSE_FILE" exec nginx nginx -s reload 2>/dev/null || true

    # 7. 헬스체크
    sleep 10
    cmd_status

    log "=== 업데이트 완료 ==="
}

# ── 롤백 ──────────────────────────────────────────────────────────────────
cmd_rollback() {
    log "=== 롤백 실행 ==="
    warn "직전 커밋으로 롤백합니다."

    git checkout HEAD~1

    docker compose -f "$COMPOSE_FILE" build
    docker compose -f "$COMPOSE_FILE" up -d --no-deps backend worker beat frontend
    docker compose -f "$COMPOSE_FILE" exec nginx nginx -s reload 2>/dev/null || true

    sleep 10
    cmd_status

    log "=== 롤백 완료 ==="
    warn "문제가 해결되면 git checkout main으로 복귀하세요."
}

# ── 상태 확인 ─────────────────────────────────────────────────────────────
cmd_status() {
    log "=== 서비스 상태 확인 ==="

    echo ""
    docker compose -f "$COMPOSE_FILE" ps
    echo ""

    # 헬스체크
    local health_url="http://localhost:8000/health"
    if curl -sf "$health_url" > /dev/null 2>&1; then
        local health=$(curl -sf "$health_url")
        log "헬스체크: $health"
    else
        warn "백엔드 헬스체크 실패 (아직 시작 중일 수 있습니다)"
    fi
}

# ── 로그 조회 ─────────────────────────────────────────────────────────────
cmd_logs() {
    local service="${1:-}"
    if [ -n "$service" ]; then
        docker compose -f "$COMPOSE_FILE" logs -f --tail=100 "$service"
    else
        docker compose -f "$COMPOSE_FILE" logs -f --tail=50
    fi
}

# ── 메인 ──────────────────────────────────────────────────────────────────
case "${1:-help}" in
    init)     cmd_init ;;
    update)   cmd_update ;;
    rollback) cmd_rollback ;;
    status)   cmd_status ;;
    logs)     cmd_logs "${2:-}" ;;
    help|*)
        echo "사용법: $0 {init|update|rollback|status|logs [service]}"
        echo ""
        echo "  init      최초 배포 (SSL 포함)"
        echo "  update    업데이트 배포"
        echo "  rollback  직전 버전으로 롤백"
        echo "  status    서비스 상태 확인"
        echo "  logs      로그 조회 (예: $0 logs backend)"
        ;;
esac
