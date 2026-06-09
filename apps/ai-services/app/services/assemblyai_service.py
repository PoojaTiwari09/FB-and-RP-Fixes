import os
import asyncio
import assemblyai as aai
from typing import List, Dict, Any

aai.settings.api_key = os.environ.get("ASSEMBLYAI_API_KEY", "")

LOW_CONFIDENCE_THRESHOLD = 0.80


def transcribe_audio(audio_url: str) -> Dict[str, Any]:
    """
    Submit audio to AssemblyAI, wait for completion, and return
    structured transcript data ready for storage.

    Implements: CT-02, CT-03, CT-06, CT-12
    """
    config = aai.TranscriptionConfig(
        speaker_labels=True,           # CT-03: speaker diarization (Rep / Customer)
        redact_pii=True,               # CT-06: PII redaction
        redact_pii_policies=[
            aai.PIIRedactionPolicy.credit_card_number,
            aai.PIIRedactionPolicy.phone_number,
            aai.PIIRedactionPolicy.email_address,
        ],
        redact_pii_sub=aai.PIISubstitutionPolicy.hash,
        word_boost=["pricing", "competitor", "objection", "discount", "contract"],
        boost_param="high",
    )

    transcriber = aai.Transcriber()
    transcript  = transcriber.transcribe(audio_url, config=config)

    if transcript.status == aai.TranscriptStatus.error:
        raise RuntimeError(f"AssemblyAI transcription failed: {transcript.error}")

    # ── Build utterances list ─────────────────────────────────────────────
    utterances: List[Dict[str, Any]] = []
    if transcript.utterances:
        for idx, utt in enumerate(transcript.utterances):
            # Average word-level confidence for this utterance
            word_confidences = [
                w.confidence for w in (utt.words or []) if w.confidence is not None
            ]
            avg_confidence = (
                sum(word_confidences) / len(word_confidences)
                if word_confidences
                else (utt.confidence or 1.0)
            )

            utterances.append({
                "speaker":       _map_speaker(utt.speaker),  # "A" → "Rep", "B" → "Customer"
                "text":          utt.text,
                "startMs":       utt.start,
                "endMs":         utt.end,
                "confidence":    round(avg_confidence, 4),
                "sequenceIndex": idx,
            })

    # ── Compute talk ratio (CT-16) ────────────────────────────────────────
    talk_ratio = _compute_talk_ratio(utterances)

    # ── Extract key highlights (CT-15) — pricing / objection / competitor ──
    key_highlights = _extract_highlights(transcript)

    return {
        "jobId":        transcript.id,
        "fullText":     transcript.text or "",
        "utterances":   utterances,
        "talkRatio":    talk_ratio,
        "keyHighlights": key_highlights,
    }


def _map_speaker(label: str | None) -> str:
    """Maps AssemblyAI speaker labels (A/B/C…) to human-readable names."""
    mapping = {"A": "Rep", "B": "Customer"}
    return mapping.get(label or "A", label or "Rep")


def _compute_talk_ratio(utterances: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Calculate duration spoken by each speaker."""
    speaker_ms: Dict[str, int] = {}
    for u in utterances:
        speaker = u["speaker"]
        duration = u["endMs"] - u["startMs"]
        speaker_ms[speaker] = speaker_ms.get(speaker, 0) + duration

    total = sum(speaker_ms.values()) or 1
    return {
        speaker: {
            "durationMs": ms,
            "percentage": round(ms / total, 4),
        }
        for speaker, ms in speaker_ms.items()
    }


def _extract_highlights(transcript: aai.Transcript) -> List[Dict[str, Any]]:
    """Surface pricing, objection, and competitor moments from auto-highlights."""
    highlights = []

    # AssemblyAI auto-highlights if enabled (word_boost already set)
    # We scan utterances for keyword signals
    SIGNAL_KEYWORDS = {
        "pricing":    ["price", "pricing", "cost", "discount", "contract"],
        "objection":  ["but", "however", "concern", "worry", "not sure", "problem"],
        "competitor": ["competitor", "alternative", "instead", "other solution"],
    }

    if not transcript.utterances:
        return highlights

    for utt in transcript.utterances:
        text_lower = utt.text.lower()
        for label, keywords in SIGNAL_KEYWORDS.items():
            if any(kw in text_lower for kw in keywords):
                highlights.append({
                    "label":       label,
                    "text":        utt.text,
                    "timestampMs": utt.start,
                    "speaker":     _map_speaker(utt.speaker),
                })
                break  # one label per utterance

    return highlights
