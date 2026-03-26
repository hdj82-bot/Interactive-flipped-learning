"""FastAPI 라우터 — PPT 업로드 및 태스크 상태 조회."""

from __future__ import annotations

import shutil
import uuid
from pathlib import Path

from fastapi import APIRouter, HTTPException, UploadFile

from app.config import settings
from app.models.schemas import TaskStatus, TaskStatusResponse, UploadResponse
from app.tasks.pipeline import process_pptx

router = APIRouter(prefix="/api/v1", tags=["pipeline"])

ALLOWED_CONTENT_TYPES = {
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
}


@router.post("/upload", response_model=UploadResponse)
async def upload_pptx(file: UploadFile):
    """PPTX 파일을 업로드하고 파싱+스크립트 생성 파이프라인을 시작한다."""

    # 확장자 검증
    if not file.filename or not file.filename.lower().endswith(".pptx"):
        raise HTTPException(status_code=400, detail=".pptx 파일만 업로드 가능합니다.")

    # 파일 크기 검증
    contents = await file.read()
    max_bytes = settings.max_file_size_mb * 1024 * 1024
    if len(contents) > max_bytes:
        raise HTTPException(
            status_code=400,
            detail=f"파일 크기가 {settings.max_file_size_mb}MB를 초과합니다.",
        )

    # 저장
    job_id = uuid.uuid4().hex
    job_dir = settings.upload_dir / job_id
    job_dir.mkdir(parents=True, exist_ok=True)

    file_path = job_dir / file.filename
    file_path.write_bytes(contents)

    output_dir = job_dir / "output"
    output_dir.mkdir(exist_ok=True)

    # Celery 태스크 실행
    task = process_pptx.apply_async(
        args=[str(file_path), str(output_dir)],
        task_id=job_id,
    )

    return UploadResponse(task_id=task.id)


@router.get("/tasks/{task_id}", response_model=TaskStatusResponse)
async def get_task_status(task_id: str):
    """Celery 태스크 상태를 조회한다."""
    from app.celery_app import celery

    result = celery.AsyncResult(task_id)

    if result.state == "PENDING":
        return TaskStatusResponse(task_id=task_id, status=TaskStatus.PENDING)

    if result.state == "PROCESSING":
        meta = result.info or {}
        return TaskStatusResponse(
            task_id=task_id,
            status=TaskStatus.PROCESSING,
            progress=meta.get("progress"),
        )

    if result.state == "SUCCESS":
        return TaskStatusResponse(
            task_id=task_id,
            status=TaskStatus.COMPLETED,
            result=result.result,
        )

    # FAILURE
    error_msg = str(result.info) if result.info else "알 수 없는 오류"
    return TaskStatusResponse(
        task_id=task_id,
        status=TaskStatus.FAILED,
        progress=error_msg,
    )
