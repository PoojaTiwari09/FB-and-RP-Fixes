import os
from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from app.routers import transcription, extraction

app = FastAPI(
    title="R-Revenue AI Services",
    version="1.0.0",
    description="Internal AI services for transcription, summarization, and analysis.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Mount routers ─────────────────────────────────────────────────────────────
app.include_router(transcription.router, prefix="/v1", tags=["transcription"])
app.include_router(extraction.router,    prefix="/v1", tags=["extraction"])


@app.get("/health")
def health():
    return {"status": "healthy", "service": "ai-services"}


@app.get("/internal/health")
def internal_health():
    return {"status": "ok"}
