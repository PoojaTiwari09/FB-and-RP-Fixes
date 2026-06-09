"""
Core Feature 23: Segment Comparison Service
Compares data across deals, accounts, reps, or time periods
to surface win/loss patterns and performance differences.

Covers test cases: TC-DR-10 through TC-DR-13
"""

import json
import uuid
from typing import List, Dict, Any
from models.schemas import SegmentComparisonResult, SegmentData, ComparisonDimension, Citation, SourceType
from services.llm_service import LLMService


class SegmentComparisonService:
    """
    Compares two or more segments (regions, time periods, rep cohorts, etc.)
    to identify performance differentiators and patterns.
    """

    def __init__(self, llm_service: LLMService):
        self.llm = llm_service

    async def compare_segments(
        self,
        segments: List[Dict[str, Any]],
        comparison_dimensions: List[str] = None,
        context_data: Dict[str, Any] = None
    ) -> SegmentComparisonResult:
        """
        TC-DR-10: Compare two regional teams.
        TC-DR-11: Compare two time periods.
        TC-DR-12: Compare more than two segments.
        TC-DR-13: Handle unequal data volumes with confidence adjustment.
        """
        if comparison_dimensions is None:
            comparison_dimensions = [
                "win rate",
                "common objections",
                "deal velocity",
                "pricing discussions",
                "next steps quality"
            ]

        # Check for data imbalance (TC-DR-13)
        data_counts = [s.get("data_count", 0) for s in segments]
        max_count = max(data_counts) if data_counts else 0
        min_count = min(data_counts) if data_counts else 0
        has_imbalance = max_count > 0 and min_count > 0 and (max_count / max(min_count, 1)) > 5

        system_prompt = f"""You are a sales intelligence analyst performing a segment comparison.
Compare the provided segments across these dimensions: {', '.join(comparison_dimensions)}.

COMPARISON RULES:
1. Analyze each segment's data independently before comparing.
2. For each dimension, provide a clear comparison with evidence.
3. Note any data imbalances between segments and adjust confidence accordingly.
4. If a segment has significantly less data, flag lower confidence for that segment.
5. Cover ALL segments provided — do not drop any from the analysis.
6. Provide evidence-backed differentiators with source references.

Return ONLY valid JSON:
{{
  "segments": [
    {{"label": "segment name", "data_count": N, "metrics": {{"key": "value"}}}}
  ],
  "dimensions": [
    {{
      "dimension": "dimension name",
      "segments": [
        {{"label": "segment A", "value": "metric or insight", "evidence": "supporting data"}}
      ],
      "insight": "comparative insight across segments",
      "winner": "which segment performs better (or 'mixed')"
    }}
  ],
  "summary": "overall comparison summary",
  "data_imbalance_note": "note about data volume differences if applicable, null if balanced"
}}"""

        # Build comparison context
        context_str = self._build_comparison_context(segments, context_data)

        user_prompt = f"Compare the following segments:\n\n{context_str}"
        if has_imbalance:
            user_prompt += f"\n\nNOTE: Significant data imbalance detected. Segment data counts: {data_counts}. Adjust confidence accordingly."

        response = await self.llm.call_llm(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            max_tokens=5000,
            response_format={"type": "json_object"}
        )

        try:
            parsed = json.loads(response)

            segment_data = [
                SegmentData(
                    label=s.get("label", f"Segment {i+1}"),
                    filter=s.get("filter", {}),
                    data_count=s.get("data_count", 0),
                    metrics=s.get("metrics", {})
                )
                for i, s in enumerate(parsed.get("segments", segments))
            ]

            dimensions = [
                ComparisonDimension(
                    dimension=d.get("dimension", ""),
                    segments=d.get("segments", []),
                    insight=d.get("insight", "")
                )
                for d in parsed.get("dimensions", [])
            ]

            return SegmentComparisonResult(
                segments=segment_data,
                dimensions=dimensions,
                summary=parsed.get("summary", ""),
                data_imbalance_note=parsed.get("data_imbalance_note")
            )

        except json.JSONDecodeError:
            return SegmentComparisonResult(
                segments=[SegmentData(label=s.get("label", "Unknown")) for s in segments],
                dimensions=[],
                summary="Comparison could not be completed due to a processing error.",
                data_imbalance_note="Unable to assess data balance."
            )

    def _build_comparison_context(
        self,
        segments: List[Dict[str, Any]],
        context_data: Dict[str, Any] = None
    ) -> str:
        """Build formatted context for segment comparison."""
        parts = []

        for i, segment in enumerate(segments):
            parts.append(f"\n{'='*50}")
            parts.append(f"SEGMENT {i+1}: {segment.get('label', f'Segment {i+1}')}")
            parts.append(f"Filter: {json.dumps(segment.get('filter', {}))}")
            parts.append(f"Data points: {segment.get('data_count', 'unknown')}")
            parts.append(f"{'='*50}")

            # Include segment-specific data
            segment_data = segment.get("data", {})

            calls = segment_data.get("calls", [])
            if calls:
                parts.append(f"\nCalls ({len(calls)}):")
                for call in calls[:10]:
                    parts.append(f"  - {call.get('title', 'Unknown')} | "
                                 f"Date: {call.get('started_at', 'N/A')} | "
                                 f"Sentiment: {call.get('sentiment_score', 'N/A')}")
                    transcript = call.get("transcript", "")
                    if transcript:
                        parts.append(f"    Transcript excerpt: {transcript[:1000]}")

            deals = segment_data.get("deals", [])
            if deals:
                parts.append(f"\nDeals ({len(deals)}):")
                for deal in deals:
                    parts.append(f"  - {deal.get('name', 'Unknown')} | Stage: {deal.get('stage', 'N/A')} | "
                                 f"Amount: ${deal.get('amount', 0)} | Status: {deal.get('status', 'N/A')}")

        # Add general context if available
        if context_data:
            accounts = context_data.get("accounts", [])
            if accounts:
                parts.append("\n\nGENERAL ACCOUNT CONTEXT:")
                for acc in accounts:
                    parts.append(f"  {acc.get('name', '')} | {acc.get('segment', '')} | {acc.get('region', '')}")

        return "\n".join(parts)
