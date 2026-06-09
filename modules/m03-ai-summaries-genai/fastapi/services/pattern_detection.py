"""
Core Feature 22: Pattern Detection Engine
Identifies recurring themes, objections, risks, and behaviors
across multiple calls and emails for a deal or account.

Covers test cases: TC-DR-06 through TC-DR-09
"""

import json
import uuid
from typing import List, Dict, Any
from models.schemas import DetectedPattern, PatternDetectionResult, Citation, SourceType
from services.llm_service import LLMService


class PatternDetectionEngine:
    """
    Analyzes call/email data to identify recurring patterns such as
    objections, risk signals, competitive mentions, and buyer behaviors.
    """

    def __init__(self, llm_service: LLMService):
        self.llm = llm_service

    async def detect_patterns(
        self,
        context_data: Dict[str, Any],
        focus_area: str = "objections and recurring themes",
        min_frequency: int = 2
    ) -> PatternDetectionResult:
        """
        TC-DR-06: Detect recurring objections across calls.
        TC-DR-07: Detect risk patterns (declining sentiment).
        TC-DR-08: Avoid false pattern detection when no themes exist.
        TC-DR-09: Detect patterns across both email and call data.
        """
        system_prompt = f"""You are a sales intelligence pattern detection engine. Analyze the provided call transcripts and emails to identify recurring patterns related to: {focus_area}.

DETECTION RULES:
1. A pattern must appear in at least {min_frequency} separate interactions to be considered recurring.
2. Do NOT invent patterns — only report what is explicitly supported by the data.
3. If no strong recurring themes are found, explicitly state that.
4. Count frequency as the number of distinct calls/emails where the pattern appears.
5. Analyze BOTH call transcripts AND email data for cross-modality patterns.
6. For each pattern, provide specific examples with source references.
7. Detect sentiment trends if sentiment scores are available.

Return ONLY valid JSON:
{{
  "patterns": [
    {{
      "label": "pattern label (e.g., 'Integration complexity')",
      "frequency": 5,
      "frequency_pct": 0.45,
      "trend": "increasing|decreasing|stable",
      "category": "objection|risk|opportunity|behavior|competitive",
      "examples": [
        {{"text": "exact quote or paraphrase", "source_type": "TRANSCRIPT", "source_id": "call_id", "source_label": "Call title - Date"}}
      ],
      "insight": "brief analytical insight about this pattern"
    }}
  ],
  "total_sources_analyzed": 10,
  "no_patterns_found": false,
  "analysis_notes": "any caveats about the analysis"
}}

If no recurring patterns meet the minimum frequency threshold, return:
{{"patterns": [], "total_sources_analyzed": N, "no_patterns_found": true, "analysis_notes": "No strong recurring themes found in the analyzed data."}}"""

        # Build data context
        context_str = self._build_pattern_context(context_data)
        user_prompt = f"Analyze the following interaction data for patterns:\n\n{context_str}"

        response = await self.llm.call_llm(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            max_tokens=4000,
            response_format={"type": "json_object"}
        )

        try:
            parsed = json.loads(response)
            patterns = []

            for p in parsed.get("patterns", []):
                citations = []
                for ex in p.get("examples", []):
                    citations.append(Citation(
                        source_type=SourceType(ex.get("source_type", "TRANSCRIPT")),
                        source_id=ex.get("source_id", ""),
                        display_label=ex.get("source_label", "Source"),
                        context_snippet=ex.get("text", "")[:300]
                    ))

                patterns.append(DetectedPattern(
                    pattern_id=f"pat_{uuid.uuid4().hex[:8]}",
                    label=p.get("label", "Unknown Pattern"),
                    frequency=p.get("frequency", 0),
                    frequency_pct=p.get("frequency_pct", 0.0),
                    trend=p.get("trend", "stable"),
                    representative_examples=p.get("examples", []),
                    citations=citations
                ))

            # Sort by frequency (most common first)
            patterns.sort(key=lambda x: x.frequency, reverse=True)

            total_calls = len(context_data.get("calls", []))
            total_emails = len(context_data.get("emails", []))

            return PatternDetectionResult(
                patterns=patterns,
                total_sources_analyzed=parsed.get("total_sources_analyzed", total_calls + total_emails),
                time_range=self._compute_time_range(context_data)
            )

        except json.JSONDecodeError:
            return PatternDetectionResult(
                patterns=[],
                total_sources_analyzed=0,
                time_range=""
            )

    async def detect_sentiment_trends(self, context_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        TC-DR-07: Detect declining sentiment as a risk pattern.
        Analyzes sentiment scores across calls over time.
        """
        calls = context_data.get("calls", [])
        if not calls:
            return {"trend": "insufficient_data", "data_points": []}

        # Extract sentiment data points
        data_points = []
        for call in sorted(calls, key=lambda c: c.get("started_at", "")):
            score = call.get("sentiment_score")
            if score is not None:
                data_points.append({
                    "date": call.get("started_at", ""),
                    "score": float(score),
                    "call_id": call.get("id", ""),
                    "call_title": call.get("title", "")
                })

        if len(data_points) < 2:
            return {"trend": "insufficient_data", "data_points": data_points}

        # Calculate trend direction
        first_half_avg = sum(d["score"] for d in data_points[:len(data_points)//2]) / max(len(data_points)//2, 1)
        second_half_avg = sum(d["score"] for d in data_points[len(data_points)//2:]) / max(len(data_points) - len(data_points)//2, 1)

        if second_half_avg < first_half_avg - 0.05:
            trend = "declining"
        elif second_half_avg > first_half_avg + 0.05:
            trend = "improving"
        else:
            trend = "stable"

        return {
            "trend": trend,
            "first_half_avg": round(first_half_avg, 2),
            "second_half_avg": round(second_half_avg, 2),
            "change": round(second_half_avg - first_half_avg, 2),
            "data_points": data_points
        }

    def _build_pattern_context(self, context_data: Dict[str, Any]) -> str:
        """Build context string optimized for pattern detection."""
        parts = []

        calls = context_data.get("calls", [])
        for i, call in enumerate(calls[:5]):
            parts.append(f"\n[CALL #{i+1}] ID: {call.get('id', 'N/A')} | Title: {call.get('title', 'Unknown')} | "
                         f"Date: {call.get('started_at', 'N/A')} | "
                         f"Sentiment: {call.get('sentiment_score', 'N/A')}")
            transcript = call.get("transcript", "")
            if transcript:
                parts.append(transcript[:1000])

        emails = context_data.get("emails", [])
        for i, email in enumerate(emails[:5]):
            parts.append(f"\n[EMAIL #{i+1}] ID: {email.get('id', 'N/A')} | "
                         f"Subject: {email.get('subject', 'No Subject')} | "
                         f"Date: {email.get('sent_at', 'N/A')}")
            body = email.get("body", "")
            if body:
                parts.append(body[:500])

        return "\n".join(parts)

    def _compute_time_range(self, context_data: Dict[str, Any]) -> str:
        """Compute the time range covered by the data."""
        dates = []
        for call in context_data.get("calls", []):
            if call.get("started_at"):
                dates.append(str(call["started_at"]))
        for email in context_data.get("emails", []):
            if email.get("sent_at"):
                dates.append(str(email["sent_at"]))

        if not dates:
            return "Unknown"

        dates.sort()
        return f"{dates[0][:10]} to {dates[-1][:10]}"
