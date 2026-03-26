"""PPT 파싱 + 스크립트 생성 Celery 파이프라인 태스크."""

from __future__ import annotations

import json
import logging
from pathlib import Path

from celery import Task

from app.celery_app import celery
from app.models.schemas import PipelineResult, TaskStatus
from app.services.parser import parse_pptx
from app.services.script_generator import generate_scripts

logger = logging.getLogger(__name__)


class PipelineTask(Task):
    """상태 메타 업데이트를 지원하는 베이스 태스크."""

    def on_failure(self, exc, task_id, args, kwargs, einfo):
        logger.error("태스크 %s 실패: %s", task_id, exc)


@celery.task(bind=True, base=PipelineTask, name="pipeline.process_pptx")
def process_pptx(self, file_path: str, output_dir: str) -> dict:
    """PPTX 파일을 파싱하고 슬라이드별 발화 스크립트를 생성한다.

    Parameters
    ----------
    file_path : 업로드된 .pptx 파일 경로
    output_dir : 결과물 저장 디렉토리
    """
    task_id = self.request.id

    try:
        # Step 1: 파싱
        self.update_state(
            state="PROCESSING",
            meta={"progress": "PPTX 파싱 중..."},
        )
        slides = parse_pptx(file_path, output_dir)
        logger.info("태스크 %s: %d개 슬라이드 파싱 완료", task_id, len(slides))

        # Step 2: 스크립트 생성
        self.update_state(
            state="PROCESSING",
            meta={"progress": "스크립트 생성 중...", "total_slides": len(slides)},
        )
        scripts = generate_scripts(slides)

        # 결과 조립
        result = PipelineResult(
            task_id=task_id,
            status=TaskStatus.COMPLETED,
            total_slides=len(slides),
            slides=slides,
            scripts=scripts,
        )

        result_dict = result.model_dump()

        # JSON 파일로도 저장
        result_path = Path(output_dir) / "result.json"
        result_path.write_text(json.dumps(result_dict, ensure_ascii=False, indent=2), encoding="utf-8")

        return result_dict

    except Exception as exc:
        logger.exception("파이프라인 실패: %s", exc)
        error_result = PipelineResult(
            task_id=task_id,
            status=TaskStatus.FAILED,
            error=str(exc),
        )
        self.update_state(state="FAILURE", meta=error_result.model_dump())
        raise
