"""S3 업로드/다운로드 서비스."""
from __future__ import annotations

import logging
import time
import uuid

import boto3
from botocore.exceptions import ClientError
import httpx

from app.core.config import settings

logger = logging.getLogger(__name__)


def get_s3_client():
    return boto3.client(
        "s3",
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        region_name=settings.AWS_REGION,
    )


# ── 범용 업로드/다운로드 ─────────────────────────────────────────────────────


def upload_file(data: bytes, s3_key: str, content_type: str = "application/octet-stream") -> str:
    """바이트 데이터를 S3에 업로드하고 URL을 반환."""
    start = time.monotonic()
    s3 = get_s3_client()
    s3.put_object(Bucket=settings.S3_BUCKET, Key=s3_key, Body=data, ContentType=content_type)
    elapsed = time.monotonic() - start
    s3_url = f"https://{settings.S3_BUCKET}.s3.{settings.AWS_REGION}.amazonaws.com/{s3_key}"
    logger.info("S3 업로드 완료: %s (%.1f초, %.1fKB)", s3_key, elapsed, len(data) / 1024)
    return s3_url


def download_file(s3_key: str) -> bytes:
    """S3에서 파일을 다운로드하여 바이트로 반환."""
    start = time.monotonic()
    s3 = get_s3_client()
    resp = s3.get_object(Bucket=settings.S3_BUCKET, Key=s3_key)
    data = resp["Body"].read()
    elapsed = time.monotonic() - start
    logger.info("S3 다운로드 완료: %s (%.1f초, %.1fKB)", s3_key, elapsed, len(data) / 1024)
    return data


def generate_presigned_url(s3_key: str, expiration: int = 3600) -> str:
    """S3 객체에 대한 presigned URL 생성 (기본 1시간)."""
    s3 = get_s3_client()
    url = s3.generate_presigned_url(
        "get_object",
        Params={"Bucket": settings.S3_BUCKET, "Key": s3_key},
        ExpiresIn=expiration,
    )
    return url


def delete_file(s3_key: str) -> bool:
    """S3 객체 삭제. 성공 시 True 반환."""
    try:
        s3 = get_s3_client()
        s3.delete_object(Bucket=settings.S3_BUCKET, Key=s3_key)
        logger.info("S3 삭제 완료: %s", s3_key)
        return True
    except ClientError as e:
        logger.error("S3 삭제 실패: %s — %s", s3_key, e)
        return False


def file_exists(s3_key: str) -> bool:
    """S3 객체 존재 여부 확인."""
    try:
        s3 = get_s3_client()
        s3.head_object(Bucket=settings.S3_BUCKET, Key=s3_key)
        return True
    except ClientError:
        return False


# ── PPT 업로드 ───────────────────────────────────────────────────────────────


def upload_ppt(file_bytes: bytes, lecture_id: str, filename: str) -> tuple[str, str]:
    """PPT 파일을 S3에 업로드. (s3_url, s3_key) 반환."""
    safe_name = filename.replace(" ", "_")
    s3_key = f"{settings.S3_PPT_PREFIX}{lecture_id}/{uuid.uuid4().hex[:8]}_{safe_name}"
    s3_url = upload_file(
        file_bytes, s3_key,
        content_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
    )
    return s3_url, s3_key


# ── 기존 함수 (호환 유지) ────────────────────────────────────────────────────


async def upload_from_url(source_url: str, lecture_id: str, slide_number: int | None = None) -> tuple[str, float]:
    """원격 URL의 비디오를 다운로드하여 S3에 업로드. (s3_url, elapsed) 반환."""
    async with httpx.AsyncClient(timeout=300.0) as client:
        resp = await client.get(source_url)
        resp.raise_for_status()
    video_bytes = resp.content

    suffix = f"_slide{slide_number}" if slide_number else ""
    filename = f"{lecture_id}{suffix}_{uuid.uuid4().hex[:8]}.mp4"
    s3_key = f"{settings.S3_PREFIX}{lecture_id}/{filename}"

    start = time.monotonic()
    s3 = get_s3_client()
    s3.put_object(Bucket=settings.S3_BUCKET, Key=s3_key, Body=video_bytes, ContentType="video/mp4")
    elapsed = time.monotonic() - start

    s3_url = f"https://{settings.S3_BUCKET}.s3.{settings.AWS_REGION}.amazonaws.com/{s3_key}"
    logger.info("S3 업로드 완료: %s (%.1f초)", s3_url, elapsed)
    return s3_url, elapsed


def upload_audio_bytes(audio_bytes: bytes, render_id: str, ext: str = "mp3") -> str:
    """TTS 오디오 바이트를 S3에 업로드."""
    s3_key = f"{settings.S3_PREFIX}audio/{render_id}.{ext}"
    s3 = get_s3_client()
    s3.put_object(Bucket=settings.S3_BUCKET, Key=s3_key, Body=audio_bytes, ContentType=f"audio/{ext}")
    return f"https://{settings.S3_BUCKET}.s3.{settings.AWS_REGION}.amazonaws.com/{s3_key}"


def upload_thumbnail(image_bytes: bytes, s3_key: str) -> str:
    """썸네일 이미지를 S3에 업로드."""
    s3 = get_s3_client()
    s3.put_object(
        Bucket=settings.S3_BUCKET, Key=s3_key, Body=image_bytes,
        ContentType="image/jpeg", CacheControl="public, max-age=86400",
    )
    return f"https://{settings.S3_BUCKET}.s3.{settings.AWS_REGION}.amazonaws.com/{s3_key}"
