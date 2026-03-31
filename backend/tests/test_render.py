"""렌더링 파이프라인 API 통합 테스트."""
import uuid
from unittest.mock import patch, AsyncMock, MagicMock

import pytest

from app.models.video_render import VideoRender, RenderStatus
from tests.conftest import make_auth_header


# ── 렌더링 요청 ──────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_create_render_request(client, professor, lecture):
    with patch("app.services.pipeline.subscription.check_limit", new_callable=AsyncMock), \
         patch("app.tasks.render.render_slide") as mock_task:
        mock_task.delay = MagicMock()
        resp = await client.post(
            "/api/v1/render",
            params={"lecture_id": str(lecture.id)},
            json=[
                {"script": "안녕하세요", "slide_number": 1},
                {"script": "감사합니다", "slide_number": 2},
            ],
            headers=make_auth_header(professor),
        )
    assert resp.status_code == 200
    data = resp.json()
    assert len(data["render_ids"]) == 2
    assert "message" in data


@pytest.mark.asyncio
async def test_create_render_plan_limit_exceeded(client, professor, lecture):
    with patch("app.services.pipeline.subscription.check_limit", new_callable=AsyncMock) as mock_limit:
        from app.services.pipeline.subscription import PlanLimitExceeded
        mock_limit.side_effect = PlanLimitExceeded("FREE", 2, 2)
        resp = await client.post(
            "/api/v1/render",
            params={"lecture_id": str(lecture.id)},
            json=[{"script": "테스트", "slide_number": 1}],
            headers=make_auth_header(professor),
        )
    assert resp.status_code == 429


@pytest.mark.asyncio
async def test_create_render_student_forbidden(client, student, lecture):
    resp = await client.post(
        "/api/v1/render",
        params={"lecture_id": str(lecture.id)},
        json=[{"script": "테스트", "slide_number": 1}],
        headers=make_auth_header(student),
    )
    assert resp.status_code == 403


# ── 렌더 상태 조회 ───────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_get_lecture_render_status_empty(client, professor, lecture):
    resp = await client.get(
        f"/api/v1/render/lecture/{lecture.id}",
        headers=make_auth_header(professor),
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 0
    assert data["completed"] == 0
    assert data["failed"] == 0


@pytest.mark.asyncio
async def test_get_lecture_render_status_with_renders(client, professor, lecture, db):
    for i, status in enumerate([RenderStatus.ready, RenderStatus.failed, RenderStatus.pending]):
        db.add(VideoRender(
            id=uuid.uuid4(),
            lecture_id=lecture.id,
            instructor_id=professor.id,
            avatar_id="test-avatar",
            tts_provider="elevenlabs",
            slide_number=i + 1,
            status=status,
        ))
    await db.flush()

    resp = await client.get(
        f"/api/v1/render/lecture/{lecture.id}",
        headers=make_auth_header(professor),
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 3
    assert data["completed"] == 1
    assert data["failed"] == 1


# ── PPT 업로드 ───────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_upload_ppt_no_file(client, professor, lecture):
    resp = await client.post(
        "/api/v1/render/upload",
        data={"lecture_id": str(lecture.id)},
        headers=make_auth_header(professor),
    )
    assert resp.status_code == 422


@pytest.mark.asyncio
async def test_upload_ppt_invalid_extension(client, professor, lecture):
    resp = await client.post(
        "/api/v1/render/upload",
        params={"lecture_id": str(lecture.id)},
        files={"file": ("test.pdf", b"fake-content", "application/pdf")},
        headers=make_auth_header(professor),
    )
    assert resp.status_code == 400
    assert ".pptx" in resp.json()["detail"]


@pytest.mark.asyncio
async def test_upload_ppt_success_s3(client, professor, lecture):
    with patch("app.services.pipeline.s3.upload_ppt", return_value=("https://s3.amazonaws.com/ppt/test.pptx", "ppt/test.pptx")), \
         patch("app.tasks.pipeline.start_pipeline") as mock_pipeline:
        mock_pipeline.return_value = MagicMock(id="celery-task-123")
        resp = await client.post(
            "/api/v1/render/upload",
            params={"lecture_id": str(lecture.id)},
            files={"file": ("lecture.pptx", b"fake-pptx-content", "application/vnd.openxmlformats-officedocument.presentationml.presentation")},
            headers=make_auth_header(professor),
        )
    assert resp.status_code == 200
    data = resp.json()
    assert "task_id" in data
    assert data["s3_url"] == "https://s3.amazonaws.com/ppt/test.pptx"
    assert data["celery_task_id"] == "celery-task-123"
    mock_pipeline.assert_called_once()


@pytest.mark.asyncio
async def test_upload_ppt_student_forbidden(client, student, lecture):
    resp = await client.post(
        "/api/v1/render/upload",
        params={"lecture_id": str(lecture.id)},
        files={"file": ("lecture.pptx", b"fake-content", "application/octet-stream")},
        headers=make_auth_header(student),
    )
    assert resp.status_code == 403
