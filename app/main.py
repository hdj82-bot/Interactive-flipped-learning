"""IFL Pipeline — FastAPI 애플리케이션 진입점."""

from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api.routes import router
from app.database import Base, engine
from app.models.embedding import SlideEmbedding  # noqa: F401


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 시작 시 테이블 생성 (pgvector extension은 Alembic 마이그레이션으로 관리)
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="IFL Pipeline",
    description="PPT 업로드 → 파싱 → 임베딩 → 발화 스크립트 생성 파이프라인",
    version="0.2.0",
    lifespan=lifespan,
)

app.include_router(router)


@app.get("/health")
async def health():
    return {"status": "ok"}
