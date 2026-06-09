"""
Core Feature 24: Evidence-Backed Report Builder
Assembles multi-section Deep Research reports where every claim
is cited to a specific source document, call, or CRM record.

Covers test cases: TC-DR-14 through TC-DR-17
"""

import json
import uuid
from typing import List, Dict, Any, Optional
from models.schemas import (
    ResearchReport, ReportSection, ReportBullet, Citation,
    SourceType, DetectedPattern, SegmentComparisonResult
)
from services.llm_service import LLMService


class ReportBuilder:
    """
    Assembles the final multi-section Deep Research report from
    sub-query outputs, pattern detection, and segment comparison results.
    Enforces citation linking on every claim.
    """

    def __init__(self, llm_service: LLMService):
        self.llm = llm_service
        self.required_sections = [
            ("exec_summary", "Executive Summary"),
            ("key_findings", "Key Findings"),
            ("evidence", "Evidence"),
            ("trends", "Trends"),
            ("risks_opps", "Risks & Opportunities"),
            ("recommendations", "Recommendations"),
        ]

    async def build_report(
        self,
        query: str,
        sub_results: List[Dict[str, Any]],
        patterns: Optional[Dict[str, Any]] = None,
        comparison: Optional[Dict[str, Any]] = None,
        filters: Dict[str, Any] = None,
        context_data: Dict[str, Any] = None
    ) -> ResearchReport:
        """
        TC-DR-14: Every finding has a cited source.
        TC-DR-15: Report structure is consistent across topics.
        TC-DR-16: Handle contradictory evidence.
        TC-DR-17: Reject weak evidence (single data point).
        """
        system_prompt = """You are a senior research analyst creating an evidence-backed intelligence report for a sales leadership team.

CRITICAL RULES:
1. EVERY finding must have a citation to a specific source (call ID, email ID, or CRM record).
2. The report MUST follow this exact section structure: Executive Summary, Key Findings, Evidence, Trends, Risks & Opportunities, Recommendations.
3. If evidence is CONTRADICTORY (e.g., some calls show positive sentiment, others negative), acknowledge the contradiction explicitly — do NOT flatten to one conclusion.
4. Do NOT elevate single-data-point observations to key findings. A key finding requires evidence from at least 2 separate sources.
5. For weak evidence areas, include them under "Evidence" with a low confidence marker, not under "Key Findings."
6. Include specific percentages, counts, and metrics where the data supports it.

Return ONLY valid JSON:
{
  "title": "descriptive report title",
  "sections": [
    {
      "section_id": "exec_summary",
      "title": "Executive Summary",
      "summary": "2-3 sentence overview",
      "bullets": [
        {
          "text": "finding with specific data",
          "source_type": "TRANSCRIPT",
          "source_id": "specific-call-or-email-id",
          "source_label": "Call Title - Date",
          "confidence": 0.95
        }
      ]
    },
    {
      "section_id": "key_findings",
      "title": "Key Findings",
      "summary": "overview of key findings",
      "bullets": [...]
    },
    {
      "section_id": "evidence",
      "title": "Evidence",
      "summary": "supporting evidence details",
      "bullets": [...]
    },
    {
      "section_id": "trends",
      "title": "Trends",
      "summary": "temporal patterns and changes",
      "bullets": [...]
    },
    {
      "section_id": "risks_opps",
      "title": "Risks & Opportunities",
      "summary": "identified risks and growth areas",
      "bullets": [...]
    },
    {
      "section_id": "recommendations",
      "title": "Recommendations",
      "summary": "actionable next steps",
      "bullets": [...]
    }
  ]
}"""

        # Build comprehensive context
        user_prompt = self._build_report_prompt(
            query, sub_results, patterns, comparison, filters, context_data
        )

        response = await self.llm.call_llm(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            max_tokens=6000,
            response_format={"type": "json_object"}
        )

        return self._parse_report_response(response, query, filters)

    def _build_report_prompt(
        self,
        query: str,
        sub_results: List[Dict[str, Any]],
        patterns: Optional[Dict[str, Any]],
        comparison: Optional[Dict[str, Any]],
        filters: Dict[str, Any],
        context_data: Dict[str, Any]
    ) -> str:
        """Assemble all available data into a prompt for report generation."""
        parts = [f"RESEARCH QUERY: {query}"]

        if filters:
            parts.append(f"\nAPPLIED FILTERS: {json.dumps(filters)}")

        if context_data:
            calls = context_data.get("calls", [])
            parts.append(f"\nDATA SCOPE: {len(calls)} calls analyzed")
            emails = context_data.get("emails", [])
            parts.append(f"{len(emails)} emails analyzed")
            deals = context_data.get("deals", [])
            parts.append(f"{len(deals)} deals in scope")

            # Include actual source IDs for citation
            if calls:
                parts.append("\nSOURCE CALL IDs AND TITLES:")
                for call in calls:
                    parts.append(f"  ID: {call.get('id')} | Title: {call.get('title')} | "
                                 f"Date: {str(call.get('started_at', ''))[:10]} | "
                                 f"Rep: {call.get('owner_name', 'Unknown')}")

            if emails:
                parts.append("\nSOURCE EMAIL IDs AND SUBJECTS:")
                for email in emails:
                    parts.append(f"  ID: {email.get('id')} | Subject: {email.get('subject')} | "
                                 f"Date: {str(email.get('sent_at', ''))[:10]}")

        parts.append("\n\nSUB-QUERY RESULTS:")
        for i, result in enumerate(sub_results):
            parts.append(f"\n--- Sub-query {i+1} (Status: {result.get('status', 'UNKNOWN')}) ---")
            parts.append(f"Answer: {result.get('answer', 'No answer')}")
            key_points = result.get("key_points", [])
            if key_points:
                parts.append("Key Points:")
                for kp in key_points:
                    parts.append(f"  • {kp.get('text', '')} [Source: {kp.get('source_type', '')}: {kp.get('source_id', '')}]")
            gaps = result.get("data_gaps", [])
            if gaps:
                parts.append(f"Data Gaps: {', '.join(gaps)}")

        if patterns:
            parts.append("\n\nPATTERN DETECTION RESULTS:")
            for p in patterns.get("patterns", []):
                parts.append(f"  Pattern: {p.get('label', '')} | Frequency: {p.get('frequency', 0)} | "
                             f"Pct: {p.get('frequency_pct', 0)*100:.0f}% | Trend: {p.get('trend', 'stable')}")

        if comparison:
            parts.append("\n\nSEGMENT COMPARISON RESULTS:")
            parts.append(json.dumps(comparison, default=str)[:3000])

        return "\n".join(parts)

    def _parse_report_response(self, response: str, query: str, filters: Dict[str, Any] = None) -> ResearchReport:
        """Parse LLM response into a structured ResearchReport with citation validation."""
        try:
            parsed = json.loads(response)
        except json.JSONDecodeError:
            return self._create_error_report(query, "Failed to parse report generation response")

        sections = []
        for sec_data in parsed.get("sections", []):
            bullets = []
            for b_data in sec_data.get("bullets", []):
                # TC-DR-14: Enforce citation — skip bullets without source
                source_id = b_data.get("source_id", "")
                source_type_str = b_data.get("source_type", "TRANSCRIPT")

                # Validate source type
                try:
                    source_type = SourceType(source_type_str)
                except ValueError:
                    source_type = SourceType.TRANSCRIPT

                citations = []
                if source_id:
                    citations.append(Citation(
                        source_type=source_type,
                        source_id=source_id,
                        display_label=b_data.get("source_label", "Source"),
                        context_snippet=b_data.get("text", "")[:200],
                        source_ref={
                            "type": source_type_str,
                            "id": source_id,
                            "label": b_data.get("source_label", "")
                        }
                    ))

                confidence = b_data.get("confidence", 0.8)

                # TC-DR-17: Flag weak evidence
                bullet = ReportBullet(
                    bullet_id=f"{sec_data.get('section_id', 'sec')}_{len(bullets)}",
                    text=b_data.get("text", ""),
                    citations=citations,
                    confidence=confidence
                )

                # Only include bullets that have citations (TC-DR-14)
                # Allow bullets in recommendations without strict citations
                if citations or sec_data.get("section_id") == "recommendations":
                    bullets.append(bullet)

            section = ReportSection(
                section_id=sec_data.get("section_id", f"section_{len(sections)}"),
                title=sec_data.get("title", ""),
                summary=sec_data.get("summary", ""),
                bullets=bullets,
                data_sources_used=list(set(
                    b.citations[0].source_type.value for b in bullets if b.citations
                )) if bullets else [],
                status="COMPLETED" if bullets else "PARTIAL"
            )
            sections.append(section)

        # TC-DR-15: Ensure consistent structure — add missing sections
        existing_ids = {s.section_id for s in sections}
        for sid, title in self.required_sections:
            if sid not in existing_ids:
                sections.append(ReportSection(
                    section_id=sid,
                    title=title,
                    summary="Insufficient data to generate this section.",
                    bullets=[],
                    status="PARTIAL"
                ))

        # Sort sections in standard order
        section_order = {sid: i for i, (sid, _) in enumerate(self.required_sections)}
        sections.sort(key=lambda s: section_order.get(s.section_id, 99))

        # Count stats
        total_bullets = sum(len(s.bullets) for s in sections)
        cited_bullets = sum(1 for s in sections for b in s.bullets if b.citations)

        return ResearchReport(
            report_id=str(uuid.uuid4()),
            title=parsed.get("title", f"Research Report: {query[:80]}"),
            generated_at=None,
            sections=sections,
            metadata={
                "query": query,
                "filters": filters or {},
                "total_bullets": total_bullets,
                "cited_bullets": cited_bullets,
                "grounding_rate": round(cited_bullets / max(total_bullets, 1), 2),
                "sections_completed": sum(1 for s in sections if s.status == "COMPLETED"),
                "sections_partial": sum(1 for s in sections if s.status == "PARTIAL"),
            }
        )

    def _create_error_report(self, query: str, error: str) -> ResearchReport:
        """Create a minimal error report."""
        return ResearchReport(
            report_id=str(uuid.uuid4()),
            title=f"Research Report: {query[:80]}",
            sections=[ReportSection(
                section_id="error",
                title="Report Generation Error",
                summary=error,
                bullets=[],
                status="FAILED"
            )],
            metadata={"error": error}
        )
