"""
FastAPI router for AI extraction endpoints (US-12, US-13, US-14).

Coding Standards §5.2:
  - Internal-only: never exposed to the public internet.
  - All endpoints return confidence_score + flagged_for_review (LLM endpoints).
  - All route functions are async def.
  - No business logic here — delegates entirely to extraction_service.
"""

from fastapi import APIRouter, HTTPException
import logging

from app.models.extraction_models import (
    SummarizeRequest,        SummarizeResponse,
    ExtractHighlightsRequest, ExtractHighlightsResponse,
    TalkRatioRequest,        TalkRatioResponse,
)
from app.services.extraction_service import (
    summarize_call,
    extract_highlights,
    compute_talk_ratio,
)

logger = logging.getLogger(__name__)
router = APIRouter()


# ── US-12: POST /v1/extract/summarize ─────────────────────────────────────────
@router.post("/extract/summarize", response_model=SummarizeResponse)
async def summarize(request: SummarizeRequest) -> SummarizeResponse:
    """
    Generates a 3–5 line call summary and extracts next steps.
    Triggered by the NestJS AI extraction subscriber on transcription.completed.
    Temperature: 0.2 (summarisation).
    """
    try:
        return await summarize_call(request)
    except Exception as exc:
        logger.exception("[/extract/summarize] Unhandled error: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc))


# ── US-13: POST /v1/extract/highlights ───────────────────────────────────────
@router.post("/extract/highlights", response_model=ExtractHighlightsResponse)
async def highlights(request: ExtractHighlightsRequest) -> ExtractHighlightsResponse:
    """
    Extracts tagged key moments (pricing, objections, competitors, risks).
    Each highlight carries a timestamp_ms for audio player seek integration.
    Temperature: 0.0 (extraction).
    """
    try:
        return await extract_highlights(request)
    except Exception as exc:
        logger.exception("[/extract/highlights] Unhandled error: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc))


# ── US-14: POST /v1/extract/talk-ratio ───────────────────────────────────────
@router.post("/extract/talk-ratio", response_model=TalkRatioResponse)
async def talk_ratio(request: TalkRatioRequest) -> TalkRatioResponse:
    """
    Computes speaking time percentage per speaker from utterance timestamps.
    Pure arithmetic — no LLM involved. No confidence_score on response.
    """
    try:
        return compute_talk_ratio(request)
    except Exception as exc:
        logger.exception("[/extract/talk-ratio] Unhandled error: %s", exc)
        raise HTTPException(status_code=500, detail=str(exc))
