from pydantic import BaseModel, Field
from typing import Optional


# ── Shared base ────────────────────────────────────────────────────────────────

class BaseAIResponse(BaseModel):
    """Every AI endpoint response must include these two fields (Coding Standards §5.2)."""
    confidence_score:   float = Field(ge=0.0, le=1.0, description="Model confidence 0-1")
    flagged_for_review: bool  = Field(description="True when confidence < 0.70 — hold for human review")


# ── Utterance shape shared by all extraction endpoints ─────────────────────────

class UtteranceInput(BaseModel):
    speaker:       str
    text:          str
    start_ms:      int
    end_ms:        int
    sequence_index: int


# ══════════════════════════════════════════════════════════════════════════════
# US-12 — Call Summarizer
# ══════════════════════════════════════════════════════════════════════════════

class SummarizeRequest(BaseModel):
    tenant_id:  str
    call_id:    str
    full_text:  str
    utterances: list[UtteranceInput]


class SummarizeResponse(BaseAIResponse):
    summary:    str  = Field(description="3–5 line summary of the call")
    next_steps: list[str] = Field(default_factory=list, description="AI-extracted follow-up actions")


# ══════════════════════════════════════════════════════════════════════════════
# US-13 — Key Highlights Extractor
# ══════════════════════════════════════════════════════════════════════════════

class ExtractHighlightsRequest(BaseModel):
    tenant_id:  str
    call_id:    str
    full_text:  str
    utterances: list[UtteranceInput]


class Highlight(BaseModel):
    label:        str  = Field(description="Category: pricing | objection | competitor | next_step | risk")
    text:         str  = Field(description="Verbatim or condensed highlight text")
    timestamp_ms: int  = Field(description="startMs of the matching utterance for audio seek")
    speaker:      str  = Field(description="Speaker label of the utterance")


class ExtractHighlightsResponse(BaseAIResponse):
    highlights: list[Highlight] = Field(default_factory=list)


# ══════════════════════════════════════════════════════════════════════════════
# US-14 — Talk Ratio Calculator  (pure math — no LLM needed)
# ══════════════════════════════════════════════════════════════════════════════

class TalkRatioRequest(BaseModel):
    tenant_id:  str
    call_id:    str
    utterances: list[UtteranceInput]


class SpeakerRatio(BaseModel):
    speaker:     str
    duration_ms: int
    percentage:  float = Field(ge=0.0, le=1.0)


class TalkRatioResponse(BaseModel):
    """Talk ratio has no LLM involved — no confidence_score needed."""
    speakers: list[SpeakerRatio]
    total_duration_ms: int
