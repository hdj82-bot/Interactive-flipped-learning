"""Video, Slide, Script SQLAlchemy 모델."""

from __future__ import annotations

from datetime import datetime
from enum import Enum as PyEnum

from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database import Base


class VideoStatus(str, PyEnum):
    UPLOADING = "UPLOADING"
    PARSING = "PARSING"
    EMBEDDING = "EMBEDDING"
    GENERATING_SCRIPT = "GENERATING_SCRIPT"
    PENDING_REVIEW = "PENDING_REVIEW"
    APPROVED = "APPROVED"
    FAILED = "FAILED"


class Video(Base):
    __tablename__ = "videos"

    id = Column(Integer, primary_key=True, autoincrement=True)
    task_id = Column(String(64), unique=True, nullable=False, index=True)
    filename = Column(String(255), nullable=False)
    file_path = Column(Text, nullable=False)
    status = Column(Enum(VideoStatus), nullable=False, default=VideoStatus.UPLOADING)
    total_slides = Column(Integer, default=0)
    error_message = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    slides = relationship("Slide", back_populates="video", cascade="all, delete-orphan")


class Slide(Base):
    __tablename__ = "slides"

    id = Column(Integer, primary_key=True, autoincrement=True)
    video_id = Column(Integer, ForeignKey("videos.id", ondelete="CASCADE"), nullable=False)
    slide_number = Column(Integer, nullable=False)
    text_content = Column(Text, default="")
    speaker_notes = Column(Text, default="")
    image_paths = Column(Text, default="")  # JSON 직렬화된 리스트
    created_at = Column(DateTime, default=datetime.utcnow)

    video = relationship("Video", back_populates="slides")
    script = relationship("Script", back_populates="slide", uselist=False, cascade="all, delete-orphan")


class Script(Base):
    __tablename__ = "scripts"

    id = Column(Integer, primary_key=True, autoincrement=True)
    slide_id = Column(Integer, ForeignKey("slides.id", ondelete="CASCADE"), nullable=False, unique=True)
    content = Column(Text, nullable=False)
    is_approved = Column(Integer, default=0)  # 0: 미검토, 1: 승인
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    slide = relationship("Slide", back_populates="script")
