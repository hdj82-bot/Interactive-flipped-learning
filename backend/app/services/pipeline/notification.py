"""교수자 알림 서비스."""
from __future__ import annotations

import asyncio
import logging
import uuid

import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)

MAX_RETRIES = 3
RETRY_DELAYS = [1, 3, 10]  # 초


async def notify_instructor(
    instructor_id: uuid.UUID,
    lecture_id: uuid.UUID,
    status: str,
    video_url: str | None = None,
    error_message: str | None = None,
) -> None:
    payload = {
        "type": "heygen_render",
        "instructor_id": str(instructor_id),
        "lecture_id": str(lecture_id),
        "status": status,
        "video_url": video_url,
        "error_message": error_message,
    }

    if not settings.NOTIFICATION_WEBHOOK_URL:
        logger.info("알림 전송 (webhook 미설정, 로그만): %s", payload)
        return

    last_exc: Exception | None = None
    for attempt in range(MAX_RETRIES):
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                resp = await client.post(settings.NOTIFICATION_WEBHOOK_URL, json=payload)
                resp.raise_for_status()
            logger.info("교수자 알림 전송 완료: instructor_id=%s, status=%s", instructor_id, status)
            return
        except Exception as exc:
            last_exc = exc
            delay = RETRY_DELAYS[attempt] if attempt < len(RETRY_DELAYS) else RETRY_DELAYS[-1]
            logger.warning(
                "교수자 알림 전송 실패 (시도 %d/%d): %s — %d초 후 재시도",
                attempt + 1, MAX_RETRIES, exc, delay,
            )
            if attempt < MAX_RETRIES - 1:
                await asyncio.sleep(delay)

    logger.error("교수자 알림 전송 최종 실패: instructor_id=%s, error=%s", instructor_id, last_exc)
