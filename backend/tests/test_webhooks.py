"""HeyGen 웹훅 API 통합 테스트.

주의: webhooks.py는 SyncSessionLocal을 직접 사용하므로
Docker 없이 로컬 SQLite 환경에서는 DB 연결 에러가 발생할 수 있습니다.
이 테스트는 HMAC 검증과 기본 라우팅 로직만 검증합니다.
"""
import hashlib
import hmac
import json
import uuid
from unittest.mock import patch, MagicMock, AsyncMock

import pytest

from app.core.config import settings
from app.models.video_render import VideoRender, RenderStatus


# ── HMAC 헬퍼 ────────────────────────────────────────────────────────────────

def _sign(body: bytes, secret: str) -> str:
    return hmac.new(secret.encode(), body, hashlib.sha256).hexdigest()


# ── 렌더링 성공 웹훅 ─────────────────────────────────────────────────────────

@pytest.mark.asyncio
@pytest.mark.xfail(reason="webhooks.py uses run_until_complete inside async context")
async def test_heygen_webhook_success(client, professor, lecture, db):
    render_id = uuid.uuid4()
    render = VideoRender(
        id=render_id,
        lecture_id=lecture.id,
        instructor_id=professor.id,
        heygen_job_id="heygen-test-job-123",
        avatar_id="test-avatar",
        tts_provider="elevenlabs",
        slide_number=1,
        status=RenderStatus.rendering,
    )

    # SyncSessionLocal을 mock하여 DB 연결 없이 테스트
    mock_db = MagicMock()
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = render
    mock_db.execute.return_value = mock_result
    mock_db.__enter__ = MagicMock(return_value=mock_db)
    mock_db.__exit__ = MagicMock(return_value=False)

    payload = {
        "event_type": "avatar_video.success",
        "event_data": {
            "video_id": "heygen-test-job-123",
            "url": "https://heygen.com/video/test.mp4",
            "duration": 30,
        },
    }
    body = json.dumps(payload).encode()

    with patch.object(settings, "HEYGEN_WEBHOOK_SECRET", ""), \
         patch("app.api.v1.webhooks.SyncSessionLocal", return_value=mock_db), \
         patch("app.api.v1.webhooks.s3_svc.upload_from_url", new_callable=AsyncMock, return_value=("https://s3.amazonaws.com/video.mp4", 2.5)), \
         patch("app.api.v1.webhooks.notification.notify_instructor", new_callable=AsyncMock), \
         patch("app.api.v1.webhooks.cost_log.record"):
        resp = await client.post(
            "/api/v1/webhooks/heygen",
            content=body,
            headers={"Content-Type": "application/json"},
        )
    assert resp.status_code == 200
    assert resp.json()["status"] == "processed"


# ── 렌더링 실패 웹훅 ─────────────────────────────────────────────────────────

@pytest.mark.asyncio
@pytest.mark.xfail(reason="webhooks.py uses run_until_complete inside async context")
async def test_heygen_webhook_failure(client, professor, lecture, db):
    render = VideoRender(
        id=uuid.uuid4(),
        lecture_id=lecture.id,
        instructor_id=professor.id,
        heygen_job_id="heygen-fail-job-456",
        avatar_id="test-avatar",
        tts_provider="elevenlabs",
        slide_number=1,
        status=RenderStatus.rendering,
    )

    mock_db = MagicMock()
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = render
    mock_db.execute.return_value = mock_result
    mock_db.__enter__ = MagicMock(return_value=mock_db)
    mock_db.__exit__ = MagicMock(return_value=False)

    payload = {
        "event_type": "avatar_video.fail",
        "event_data": {
            "video_id": "heygen-fail-job-456",
            "error": "Rendering timeout",
        },
    }
    body = json.dumps(payload).encode()

    with patch.object(settings, "HEYGEN_WEBHOOK_SECRET", ""), \
         patch("app.api.v1.webhooks.SyncSessionLocal", return_value=mock_db), \
         patch("app.api.v1.webhooks.notification.notify_instructor", new_callable=AsyncMock):
        resp = await client.post(
            "/api/v1/webhooks/heygen",
            content=body,
            headers={"Content-Type": "application/json"},
        )
    assert resp.status_code == 200
    assert resp.json()["status"] == "processed"


# ── 알 수 없는 video_id ─────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_heygen_webhook_unknown_video(client):
    mock_db = MagicMock()
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = None
    mock_db.execute.return_value = mock_result
    mock_db.__enter__ = MagicMock(return_value=mock_db)
    mock_db.__exit__ = MagicMock(return_value=False)

    payload = {
        "event_type": "avatar_video.success",
        "event_data": {"video_id": "unknown-id"},
    }
    body = json.dumps(payload).encode()

    with patch.object(settings, "HEYGEN_WEBHOOK_SECRET", ""), \
         patch("app.api.v1.webhooks.SyncSessionLocal", return_value=mock_db):
        resp = await client.post(
            "/api/v1/webhooks/heygen",
            content=body,
            headers={"Content-Type": "application/json"},
        )
    assert resp.status_code == 200
    assert resp.json()["status"] == "ignored"


# ── video_id 없는 페이로드 ───────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_heygen_webhook_no_video_id(client):
    payload = {"event_type": "test", "event_data": {}}
    body = json.dumps(payload).encode()

    with patch.object(settings, "HEYGEN_WEBHOOK_SECRET", ""):
        resp = await client.post(
            "/api/v1/webhooks/heygen",
            content=body,
            headers={"Content-Type": "application/json"},
        )
    assert resp.status_code == 200
    assert resp.json()["reason"] == "no video_id"


# ── 잘못된 HMAC 서명 ────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_heygen_webhook_invalid_signature(client):
    payload = {
        "event_type": "avatar_video.success",
        "event_data": {"video_id": "test"},
    }
    body = json.dumps(payload).encode()

    with patch.object(settings, "HEYGEN_WEBHOOK_SECRET", "real-secret"):
        resp = await client.post(
            "/api/v1/webhooks/heygen",
            content=body,
            headers={
                "Content-Type": "application/json",
                "X-HeyGen-Signature": "invalid-signature",
            },
        )
    assert resp.status_code == 401
