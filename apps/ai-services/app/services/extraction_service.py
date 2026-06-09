"""
AI Extraction Service — Call Summarizer, Highlights Extractor, Talk Ratio Calculator

Coding Standards compliance:
  §5.1  — Python 3.12, async def, full type hints, Pydantic v2
  §5.2  — No business logic here; inference only. Every LLM response includes
           confidence_score and flagged_for_review.
  §5.3  — LLM calls via LiteLLM only (never direct OpenAI SDK).
           Prompts loaded from Jinja2 versioned templates.
  §5.2  — Internal-only service; never exposed to the public internet.
"""

import os
import json
import logging
from collections import defaultdict

import litellm
from jinja2 import Environment, FileSystemLoader, select_autoescape

from app.models.extraction_models import (
    SummarizeRequest,  SummarizeResponse,
    ExtractHighlightsRequest, ExtractHighlightsResponse, Highlight,
    TalkRatioRequest,  TalkRatioResponse, SpeakerRatio,
    UtteranceInput,
)

logger = logging.getLogger(__name__)

# ── Jinja2 template environment ───────────────────────────────────────────────
# Templates live at: apps/ai-services/prompts/<task>/v<n>.jinja2
_PROMPTS_DIR = os.path.join(os.path.dirname(__file__), "..", "prompts")
_env = Environment(
    loader=FileSystemLoader(_PROMPTS_DIR),
    autoescape=select_autoescape([]),  # plain text prompts — no HTML escaping
    trim_blocks=True,
    lstrip_blocks=True,
)

# ── LLM model config ──────────────────────────────────────────────────────────
_PRIMARY_MODEL    = os.getenv("PRIMARY_MODEL", "openai/gpt-4o")
_SUMMARIZE_TEMP   = 0.2   # §5.3 — summarisation tasks
_EXTRACTION_TEMP  = 0.0   # §5.3 — extraction / classification tasks
_CONFIDENCE_GATE  = 0.70  # flag for human review when below this


def _load_prompt(task: str, version: int, **kwargs: str) -> str:
    """Load a versioned Jinja2 prompt template and render it with the given vars."""
    template = _env.get_template(f"{task}/v{version}.jinja2")
    return template.render(**kwargs)


def _compute_confidence(raw_text: str) -> float:
    """
    Heuristic confidence scorer for LLM JSON responses.
    A real implementation would use logprobs; this approximates it from
    the presence of null/empty fields in the response.
    """
    null_count = raw_text.lower().count("null") + raw_text.count('""')
    total_fields = max(raw_text.count(":"), 1)
    penalty = null_count / total_fields
    return round(max(0.0, 1.0 - penalty), 3)


# ══════════════════════════════════════════════════════════════════════════════
# US-12 — Call Summarizer
# ══════════════════════════════════════════════════════════════════════════════

async def summarize_call(req: SummarizeRequest) -> SummarizeResponse:
    """
    Generates a 3–5 line call summary and extracts next steps.
    Temperature: 0.2 (summarisation — §5.3)
    """
    logger.info("[Summarizer] call_id=%s tenant_id=%s", req.call_id, req.tenant_id)

    prompt = _load_prompt(
        "summarize", version=1,
        full_text=req.full_text,
        call_id=req.call_id,
    )

    response = await litellm.acompletion(
        model=_PRIMARY_MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=_SUMMARIZE_TEMP,
        response_format={"type": "json_object"},
    )

    raw = response.choices[0].message.content or "{}"
    logger.debug("[Summarizer] raw LLM output: %s", raw[:300])

    try:
        data = json.loads(raw)
    except json.JSONDecodeError:
        logger.error("[Summarizer] JSON parse failed — raw: %s", raw)
        data = {}

    confidence = _compute_confidence(raw)

    return SummarizeResponse(
        summary=data.get("summary", "Summary unavailable."),
        next_steps=data.get("next_steps", []),
        confidence_score=confidence,
        flagged_for_review=confidence < _CONFIDENCE_GATE,
    )


# ══════════════════════════════════════════════════════════════════════════════
# US-13 — Key Highlights Extractor
# ══════════════════════════════════════════════════════════════════════════════

async def extract_highlights(req: ExtractHighlightsRequest) -> ExtractHighlightsResponse:
    """
    Extracts tagged moments (pricing, objections, competitors, risks) from the
    transcript. Maps each moment to the utterance startMs for audio seeking.
    Temperature: 0.0 (extraction — §5.3)
    """
    logger.info("[Highlights] call_id=%s", req.call_id)

    # Build an utterance map for timestamp lookup: text snippet → startMs
    utterance_map: dict[str, tuple[int, str]] = {
        u.text[:80]: (u.start_ms, u.speaker) for u in req.utterances
    }

    # Flatten transcript for the prompt
    transcript_lines = "\n".join(
        f"[{u.speaker} @ {u.start_ms}ms] {u.text}" for u in req.utterances
    )

    prompt = _load_prompt(
        "extract_highlights", version=1,
        transcript=transcript_lines,
        call_id=req.call_id,
    )

    response = await litellm.acompletion(
        model=_PRIMARY_MODEL,
        messages=[{"role": "user", "content": prompt}],
        temperature=_EXTRACTION_TEMP,
        response_format={"type": "json_object"},
    )

    raw = response.choices[0].message.content or "{}"
    confidence = _compute_confidence(raw)

    try:
        data = json.loads(raw)
        items = data.get("highlights", [])
    except json.JSONDecodeError:
        logger.error("[Highlights] JSON parse failed — raw: %s", raw)
        items = []

    highlights: list[Highlight] = []
    for item in items:
        text_key = str(item.get("text", ""))[:80]
        ts, speaker = utterance_map.get(text_key, (0, "Unknown"))
        highlights.append(Highlight(
            label=item.get("label", "general"),
            text=item.get("text", ""),
            timestamp_ms=item.get("timestamp_ms", ts),
            speaker=item.get("speaker", speaker),
        ))

    return ExtractHighlightsResponse(
        highlights=highlights,
        confidence_score=confidence,
        flagged_for_review=confidence < _CONFIDENCE_GATE,
    )


# ══════════════════════════════════════════════════════════════════════════════
# US-14 — Talk Ratio Calculator  (pure arithmetic — no LLM)
# ══════════════════════════════════════════════════════════════════════════════

def compute_talk_ratio(req: TalkRatioRequest) -> TalkRatioResponse:
    """
    Computes speaking time per speaker from utterance start/end timestamps.
    No LLM involved — pure math. No confidence_score needed.
    """
    logger.info("[TalkRatio] call_id=%s utterances=%d", req.call_id, len(req.utterances))

    speaker_ms: dict[str, int] = defaultdict(int)

    for u in req.utterances:
        duration = max(0, u.end_ms - u.start_ms)
        speaker_ms[u.speaker] += duration

    total_ms = sum(speaker_ms.values()) or 1  # guard against zero division

    speakers = [
        SpeakerRatio(
            speaker=spk,
            duration_ms=ms,
            percentage=round(ms / total_ms, 4),
        )
        for spk, ms in sorted(speaker_ms.items(), key=lambda x: -x[1])
    ]

    return TalkRatioResponse(speakers=speakers, total_duration_ms=total_ms)
