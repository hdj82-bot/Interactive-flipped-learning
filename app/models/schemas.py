from __future__ import annotations

from enum import Enum

from pydantic import BaseModel, Field


class TaskStatus(str, Enum):
    PENDING = "PENDING"
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


class SlideContent(BaseModel):
    slide_number: int
    texts: list[str] = Field(default_factory=list, description="슬라이드 내 텍스트")
    speaker_notes: str = Field(default="", description="발표자 노트")
    image_paths: list[str] = Field(default_factory=list, description="추출된 이미지 경로")


class SlideScript(BaseModel):
    slide_number: int
    script: str = Field(description="생성된 발화 스크립트")


class PipelineResult(BaseModel):
    task_id: str
    status: TaskStatus
    total_slides: int = 0
    slides: list[SlideContent] = Field(default_factory=list)
    scripts: list[SlideScript] = Field(default_factory=list)
    error: str | None = None


class UploadResponse(BaseModel):
    task_id: str
    message: str = "파이프라인이 시작되었습니다."


class TaskStatusResponse(BaseModel):
    task_id: str
    status: TaskStatus
    progress: str | None = None
    result: PipelineResult | None = None
