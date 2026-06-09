from fastapi import APIRouter, HTTPException, Header
from pydantic import BaseModel, HttpUrl
from typing import Optional
from app.services.assemblyai_service import transcribe_audio
import os

router = APIRouter()

INTERNAL_TOKEN = os.environ.get("TRANSCRIPTION_SERVICE_AUTH_TOKEN", "local-dev-token")


def _verify_token(authorization: Optional[str] = Header(None)) -> None:
    """Simple bearer token check for internal service auth."""
    if not authorization or authorization != f"Bearer {INTERNAL_TOKEN}":
        raise HTTPException(status_code=401, detail="Unauthorized")


class TranscribeRequest(BaseModel):
    audioUrl: str
    callId:   str
    tenantId: str


# ── POST /v1/transcribe — submit audio + return full transcript (CT-02/03) ────
@router.post("/transcribe")
def transcribe(req: TranscribeRequest, authorization: Optional[str] = Header(None)):
    _verify_token(authorization)

    if not os.environ.get("ASSEMBLYAI_API_KEY"):
        raise HTTPException(
            status_code=503,
            detail="ASSEMBLYAI_API_KEY not configured. Add it to .env or Doppler.",
        )

    try:
        result = transcribe_audio(req.audioUrl)
        return result
    except RuntimeError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription error: {str(e)}")
