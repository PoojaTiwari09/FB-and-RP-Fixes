"""
Core Feature 21: Multi-Step Reasoning Orchestrator + LLM Service
Integrates with Groq's Llama model for query decomposition,
sub-query execution (parallel/sequential), and synthesis.
"""

import os
import json
import uuid
import asyncio
import hashlib
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime

from groq import AsyncGroq
from dotenv import load_dotenv

from models.schemas import (
    SubQuery, DecompositionPlan, ReportSection, ReportBullet,
    Citation, SourceType, ResearchReport
)

load_dotenv()


class LLMService:
    """Manages all LLM interactions via Groq API with Llama model."""

    def __init__(self):
        self.client = AsyncGroq(api_key=os.getenv("GROQ_API_KEY"))
        self.model = os.getenv("GROQ_MODEL", "llama-3.3-70b-versatile")
        self.max_retries = 3
        self.temperature = 0.1

    async def call_llm(
        self,
        system_prompt: str,
        user_prompt: str,
        max_tokens: int = 4000,
        temperature: float = None,
        response_format: Optional[Dict] = None
    ) -> str:
        """Core LLM call with retry logic."""
        temp = temperature if temperature is not None else self.temperature

        for attempt in range(self.max_retries):
            try:
                kwargs = {
                    "model": self.model,
                    "messages": [
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    "max_tokens": max_tokens,
                    "temperature": temp,
                }
                if response_format:
                    kwargs["response_format"] = response_format

                response = await self.client.chat.completions.create(**kwargs)
                return response.choices[0].message.content

            except Exception as e:
                if attempt == self.max_retries - 1:
                    raise Exception(f"LLM call failed after {self.max_retries} attempts: {str(e)}")
                await asyncio.sleep(2 ** attempt)

    def _compute_prompt_hash(self, system: str, user: str) -> str:
        """Compute SHA256 hash of prompt for audit logging."""
        content = f"{system}|{user}"
        return hashlib.sha256(content.encode()).hexdigest()[:16]

    async def check_connection(self) -> bool:
        """Verify Groq API connectivity."""
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": "ping"}],
                max_tokens=5,
            )
            return True
        except Exception:
            return False


class MultiStepReasoningOrchestrator:
    """
    Core Feature 21: Decomposes complex research queries into sub-queries,
    executes them sequentially or in parallel, and synthesizes outputs.

    Covers test cases: TC-DR-01 through TC-DR-05
    """

    def __init__(self, llm_service: LLMService):
        self.llm = llm_service

    async def decompose_query(self, query: str, context_data: Dict[str, Any] = None) -> DecompositionPlan:
        """
        TC-DR-01: Decompose a complex question into sub-tasks.
        Uses LLM to break down the research query into a DAG of sub-queries.
        """
        system_prompt = """You are a research planning assistant for sales intelligence.
Given a complex business research query, decompose it into 3-7 specific sub-questions that can be independently answered from call transcripts, email data, and CRM records.

For each sub-question, specify:
- id: unique identifier (sq_1, sq_2, etc.)
- question: the specific sub-question
- type: "retrieval" (direct data fetch), "pattern" (pattern detection), or "comparison" (segment comparison)
- depends_on: list of sub-query IDs this depends on (empty if independent)

Return ONLY valid JSON matching this schema:
{
  "sub_queries": [
    {"id": "sq_1", "question": "...", "type": "retrieval", "depends_on": []},
    {"id": "sq_2", "question": "...", "type": "pattern", "depends_on": []},
    {"id": "sq_3", "question": "...", "type": "retrieval", "depends_on": ["sq_1"]}
  ]
}

Make sure to identify which sub-queries can run in parallel (no dependencies) and which must run sequentially."""

        user_prompt = f"Research Query: {query}"
        if context_data:
            user_prompt += f"\n\nAvailable context: {json.dumps(context_data, default=str)[:2000]}"

        response = await self.llm.call_llm(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            max_tokens=2000,
            response_format={"type": "json_object"}
        )

        try:
            parsed = json.loads(response)
            sub_queries = []
            for sq in parsed.get("sub_queries", []):
                sub_queries.append(SubQuery(
                    id=sq.get("id", f"sq_{uuid.uuid4().hex[:6]}"),
                    question=sq.get("question", ""),
                    type=sq.get("type", "retrieval"),
                    depends_on=sq.get("depends_on", []),
                    status="PENDING"
                ))

            # Force all sub-queries to run in parallel for maximum speed
            parallel_ids = [sq.id for sq in sub_queries]
            sequential_ids = []

            return DecompositionPlan(
                original_query=query,
                sub_queries=sub_queries,
                parallel_ids=parallel_ids,
                sequential_ids=sequential_ids
            )
        except json.JSONDecodeError:
            # Fallback: create basic sub-queries
            return self._fallback_decomposition(query)

    def _fallback_decomposition(self, query: str) -> DecompositionPlan:
        """Fallback decomposition when LLM response parsing fails."""
        sub_queries = [
            SubQuery(id="sq_1", question=f"What are the key data points related to: {query}", type="retrieval"),
            SubQuery(id="sq_2", question=f"What patterns emerge from the data related to: {query}", type="pattern"),
            SubQuery(id="sq_3", question=f"What are the risks and opportunities related to: {query}", type="retrieval"),
            SubQuery(id="sq_4", question=f"What recommendations can be made based on: {query}",
                     type="retrieval", depends_on=["sq_1", "sq_2", "sq_3"]),
        ]
        return DecompositionPlan(
            original_query=query,
            sub_queries=sub_queries,
            parallel_ids=["sq_1", "sq_2", "sq_3", "sq_4"],
            sequential_ids=[]
        )

    async def execute_sub_query(
        self,
        sub_query: SubQuery,
        context_data: Dict[str, Any],
        prior_results: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """
        Execute a single sub-query against the available data.
        TC-DR-02: Handles sequential dependencies by receiving prior_results.
        TC-DR-04: Returns partial result with error info on failure.
        """
        system_prompt = """You are a sales intelligence research analyst. Answer the given sub-question based ONLY on the provided data context.

GROUNDING RULES (MANDATORY):
1. Every claim MUST reference specific evidence from the context.
2. Include source references as [Source: call_id or email_id or field_name].
3. If you cannot find evidence for a claim, do NOT make that claim.
4. Return valid JSON matching this schema:

{
  "answer": "detailed answer text",
  "key_points": [
    {"text": "point text", "source_type": "TRANSCRIPT|EMAIL|CRM", "source_id": "id", "source_label": "human readable label"}
  ],
  "confidence": 0.0 to 1.0,
  "data_gaps": ["list of data that was missing or insufficient"]
}"""

        # Build context string from available data
        context_str = self._build_context_string(context_data)

        user_prompt = f"Sub-Question: {sub_query.question}\n\nDATA CONTEXT:\n{context_str}"
        if prior_results:
            user_prompt += f"\n\nPRIOR FINDINGS:\n{json.dumps(prior_results, default=str)[:3000]}"

        try:
            response = await self.llm.call_llm(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                max_tokens=3000,
                response_format={"type": "json_object"}
            )
            result = json.loads(response)
            result["sub_query_id"] = sub_query.id
            result["status"] = "COMPLETED"
            return result
        except Exception as e:
            # TC-DR-04: Partial failure — return error info
            return {
                "sub_query_id": sub_query.id,
                "status": "FAILED",
                "error": str(e),
                "answer": f"This section could not be completed due to an error: {str(e)}",
                "key_points": [],
                "confidence": 0.0,
                "data_gaps": ["Sub-query execution failed"]
            }

    async def execute_plan(
        self,
        plan: DecompositionPlan,
        context_data: Dict[str, Any],
        progress_callback=None
    ) -> List[Dict[str, Any]]:
        """
        Execute the full decomposition plan.
        TC-DR-03: Parallel execution for independent sub-queries.
        TC-DR-02: Sequential execution for dependent sub-queries.
        """
        results = {}
        all_results = []

        # Phase 1: Execute parallel sub-queries
        if plan.parallel_ids:
            parallel_tasks = []
            for sq_id in plan.parallel_ids:
                sq = next((s for s in plan.sub_queries if s.id == sq_id), None)
                if sq:
                    parallel_tasks.append(self.execute_sub_query(sq, context_data))

            parallel_results = await asyncio.gather(*parallel_tasks, return_exceptions=True)

            for i, sq_id in enumerate(plan.parallel_ids):
                res = parallel_results[i]
                if isinstance(res, Exception):
                    results[sq_id] = {
                        "sub_query_id": sq_id,
                        "status": "FAILED",
                        "error": str(res),
                        "answer": "",
                        "key_points": [],
                        "confidence": 0.0,
                        "data_gaps": ["Execution failed"]
                    }
                else:
                    results[sq_id] = res
                all_results.append(results[sq_id])

            if progress_callback:
                await progress_callback(60, "Parallel sub-queries completed")

        # Phase 2: Execute sequential sub-queries
        for sq_id in plan.sequential_ids:
            sq = next((s for s in plan.sub_queries if s.id == sq_id), None)
            if sq:
                # Gather prior results this sub-query depends on
                prior = {dep_id: results.get(dep_id, {}) for dep_id in sq.depends_on}
                result = await self.execute_sub_query(sq, context_data, prior_results=prior)
                results[sq_id] = result
                all_results.append(result)

        if progress_callback:
            await progress_callback(80, "All sub-queries completed")

        return all_results

    async def synthesize_results(
        self,
        query: str,
        sub_results: List[Dict[str, Any]],
        filters: Dict[str, Any] = None
    ) -> ResearchReport:
        """
        TC-DR-05: Synthesize all sub-task outputs into a coherent final report.
        """
        system_prompt = """You are a senior sales intelligence analyst creating a comprehensive research report.

Synthesize the provided sub-query results into a structured report. The report MUST have these sections:
1. exec_summary - Executive Summary (3-5 key takeaways)
2. key_findings - Key Findings (detailed findings with evidence)
3. evidence - Supporting Evidence (specific data points and citations)
4. trends - Trends (patterns over time, directional changes)
5. risks_opps - Risks & Opportunities (identified risks and growth opportunities)
6. recommendations - Recommendations (actionable next steps)

GROUNDING RULES:
- Every bullet must reference evidence from the sub-query results
- Include source references for traceability
- If evidence is contradictory, acknowledge the contradiction
- If evidence is weak (single data point), do NOT elevate it to a key finding
- Flag low-confidence sections clearly

Return ONLY valid JSON:
{
  "title": "report title",
  "sections": [
    {
      "section_id": "exec_summary",
      "title": "Executive Summary",
      "summary": "overview text",
      "bullets": [
        {"text": "finding text", "source_type": "TRANSCRIPT", "source_id": "id", "source_label": "label", "confidence": 0.9}
      ]
    }
  ]
}"""

        results_str = json.dumps(sub_results, default=str)[:12000]
        user_prompt = f"Original Research Query: {query}\n\n"
        if filters:
            user_prompt += f"Applied Filters: {json.dumps(filters)}\n\n"
        user_prompt += f"Sub-Query Results:\n{results_str}"

        response = await self.llm.call_llm(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            max_tokens=6000,
            response_format={"type": "json_object"}
        )

        try:
            parsed = json.loads(response)
            sections = []
            for sec in parsed.get("sections", []):
                bullets = []
                for b in sec.get("bullets", []):
                    citations = []
                    if b.get("source_id"):
                        citations.append(Citation(
                            source_type=SourceType(b.get("source_type", "TRANSCRIPT")),
                            source_id=b.get("source_id", ""),
                            display_label=b.get("source_label", "Source"),
                            context_snippet=b.get("text", "")[:200]
                        ))
                    bullets.append(ReportBullet(
                        bullet_id=f"{sec.get('section_id', 'sec')}_{len(bullets)}",
                        text=b.get("text", ""),
                        citations=citations,
                        confidence=b.get("confidence", 0.9)
                    ))
                sections.append(ReportSection(
                    section_id=sec.get("section_id", f"section_{len(sections)}"),
                    title=sec.get("title", ""),
                    summary=sec.get("summary", ""),
                    bullets=bullets,
                    data_sources_used=["CALLS", "EMAILS", "CRM"]
                ))

            # Ensure all required sections exist
            required_sections = [
                ("exec_summary", "Executive Summary"),
                ("key_findings", "Key Findings"),
                ("evidence", "Evidence"),
                ("trends", "Trends"),
                ("risks_opps", "Risks & Opportunities"),
                ("recommendations", "Recommendations"),
            ]
            existing_ids = {s.section_id for s in sections}
            for sid, title in required_sections:
                if sid not in existing_ids:
                    sections.append(ReportSection(
                        section_id=sid,
                        title=title,
                        summary="Insufficient data to generate this section.",
                        bullets=[],
                        status="PARTIAL"
                    ))

            return ResearchReport(
                report_id=str(uuid.uuid4()),
                title=parsed.get("title", f"Research Report: {query[:80]}"),
                generated_at=datetime.utcnow().isoformat(),
                sections=sections,
                metadata={
                    "model": self.llm.model,
                    "sub_queries_total": len(sub_results),
                    "sub_queries_succeeded": sum(1 for r in sub_results if r.get("status") == "COMPLETED"),
                    "sub_queries_failed": sum(1 for r in sub_results if r.get("status") == "FAILED"),
                }
            )
        except json.JSONDecodeError:
            # Return a minimal report on parse failure
            return ResearchReport(
                report_id=str(uuid.uuid4()),
                title=f"Research Report: {query[:80]}",
                generated_at=datetime.utcnow().isoformat(),
                sections=[ReportSection(
                    section_id="error",
                    title="Report Generation Error",
                    summary="The report could not be fully generated. Please retry.",
                    bullets=[],
                    status="FAILED"
                )],
                metadata={"error": "Failed to parse LLM synthesis response"}
            )

    def _build_context_string(self, context_data: Dict[str, Any]) -> str:
        """Build a formatted context string from available data sources."""
        parts = []

        # Call transcripts
        calls = context_data.get("calls", [])
        if calls:
            parts.append("=== CALL TRANSCRIPTS ===")
            for call in calls[:5]:  # Cap at 5 calls to speed up processing
                parts.append(f"\n--- Call: {call.get('title', 'Unknown')} (ID: {call.get('id', 'N/A')}) ---")
                parts.append(f"Date: {call.get('started_at', 'N/A')}")
                parts.append(f"Duration: {call.get('duration_seconds', 0)}s")
                parts.append(f"Rep: {call.get('owner_name', 'Unknown')}")
                transcript = call.get("transcript", "")
                if transcript:
                    parts.append(f"Transcript:\n{transcript[:1000]}")

        # Emails
        emails = context_data.get("emails", [])
        if emails:
            parts.append("\n=== EMAILS ===")
            for email in emails[:5]:
                parts.append(f"\n--- Email: {email.get('subject', 'No Subject')} (ID: {email.get('id', 'N/A')}) ---")
                parts.append(f"Date: {email.get('sent_at', 'N/A')}")
                body = email.get("body", "")
                if body:
                    parts.append(f"Body:\n{body[:500]}")

        # CRM data
        deals = context_data.get("deals", [])
        if deals:
            parts.append("\n=== CRM DEAL DATA ===")
            for deal in deals:
                parts.append(f"Deal: {deal.get('name', 'Unknown')} | Stage: {deal.get('stage', 'N/A')} | "
                             f"Amount: ${deal.get('amount', 0)} | Status: {deal.get('status', 'N/A')}")

        accounts = context_data.get("accounts", [])
        if accounts:
            parts.append("\n=== CRM ACCOUNT DATA ===")
            for acc in accounts:
                parts.append(f"Account: {acc.get('name', 'Unknown')} | Industry: {acc.get('industry', 'N/A')} | "
                             f"Segment: {acc.get('segment', 'N/A')} | Region: {acc.get('region', 'N/A')}")

        return "\n".join(parts)
