"""IFL Pipeline — FastAPI 애플리케이션 진입점."""

from fastapi import FastAPI

from app.api.routes import router

app = FastAPI(
    title="IFL Pipeline",
    description="PPT 업로드 → 파싱 → 발화 스크립트 생성 파이프라인",
    version="0.1.0",
)

app.include_router(router)


@app.get("/health")
async def health():
    return {"status": "ok"}
