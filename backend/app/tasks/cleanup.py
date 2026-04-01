"""세션 자동 정리/아카이빙 스케줄 태스크."""
from __future__ import annotations

import logging
from datetime import datetime, timedelta, timezone

from sqlalchemy import update

from app.celery_app import celery
from app.db.session import SyncSessionLocal
from app.models.session import LearningSession, SessionStatus

logger = logging.getLogger(__name__)

# 24시간 이상 in_progress 상태로 방치된 세션을 완료 처리
STALE_SESSION_HOURS = 24


@celery.task
def cleanup_stale_sessions() -> dict:
    """방치된 세션을 자동 완료 처리."""
    db = SyncSessionLocal()
    try:
        cutoff = datetime.now(timezone.utc) - timedelta(hours=STALE_SESSION_HOURS)

        # in_progress + 마지막 활동이 cutoff 이전인 세션을 completed로 전이
        result = db.execute(
            update(LearningSession)
            .where(
                LearningSession.status == SessionStatus.in_progress,
                LearningSession.last_active_at < cutoff,
            )
            .values(
                status=SessionStatus.completed,
                completed_at=datetime.now(timezone.utc),
            )
        )
        completed_count = result.rowcount

        # paused 상태도 동일하게 처리
        result2 = db.execute(
            update(LearningSession)
            .where(
                LearningSession.status == SessionStatus.paused,
                LearningSession.last_active_at < cutoff,
            )
            .values(
                status=SessionStatus.completed,
                completed_at=datetime.now(timezone.utc),
                is_paused=False,
            )
        )
        paused_count = result2.rowcount

        db.commit()

        total = completed_count + paused_count
        if total > 0:
            logger.info(
                "세션 정리 완료: in_progress→completed %d건, paused→completed %d건",
                completed_count, paused_count,
            )
        return {
            "cleaned_in_progress": completed_count,
            "cleaned_paused": paused_count,
            "total": total,
        }
    except Exception as exc:
        db.rollback()
        logger.error("세션 정리 실패: %s", exc)
        return {"error": str(exc)}
    finally:
        db.close()
