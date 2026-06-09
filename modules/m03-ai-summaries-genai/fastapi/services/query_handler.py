"""
Ask Anything Query Handler
Processes natural-language queries, generates grounded answers
with citations, and supports escalation to Deep Research.
"""

import json
import uuid
from typing import Dict, Any, Optional, List
from models.schemas import QueryResponse, Citation, SourceType
from services.llm_service import LLMService


class QueryHandler:
    """Handles Ask Anything queries with session awareness and follow-up generation."""

    def __init__(self, llm_service: LLMService):
        self.llm = llm_service

    async def process_query(
        self,
        query: str,
        context_data: Dict[str, Any],
        session_history: List[Dict[str, Any]] = None
    ) -> QueryResponse:
        """Process a natural language query and return a grounded answer."""
        system_prompt = """You are a sales intelligence assistant. Answer the user's question based ONLY on the provided data context.

GROUNDING RULES:
1. Every claim MUST reference specific evidence from the provided context.
2. Use numbered findings where appropriate.
3. Include specific percentages and metrics when the data supports it.
4. Bold key terms using **term** syntax.
5. If the question cannot be fully answered from the data, say so clearly.
6. At the end, note if this question would benefit from a deeper analysis.

Return valid JSON:
{
  "answer": "formatted answer text with **bold** terms and numbered findings",
  "citations": [
    {"source_type": "TRANSCRIPT", "source_id": "id", "display_label": "Call Title - Date", "context_snippet": "relevant excerpt"}
  ],
  "follow_up_questions": [
    "suggested follow-up question 1",
    "suggested follow-up question 2",
    "suggested follow-up question 3"
  ],
  "can_escalate": true,
  "escalation_reason": "why deeper analysis would help"
}"""

        # Build context
        context_str = self._build_query_context(context_data)

        user_prompt = f"Question: {query}\n\n"
        if session_history:
            user_prompt += "PREVIOUS CONVERSATION:\n"
            for msg in session_history[-4:]:  # Last 4 messages
                user_prompt += f"{msg.get('role', 'user')}: {msg.get('content', '')}\n"
            user_prompt += "\n"
        user_prompt += f"DATA CONTEXT:\n{context_str}"

        response = await self.llm.call_llm(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            max_tokens=3000,
            response_format={"type": "json_object"}
        )

        try:
            parsed = json.loads(response)

            citations = []
            for c in parsed.get("citations", []):
                try:
                    source_type = SourceType(c.get("source_type", "TRANSCRIPT"))
                except ValueError:
                    source_type = SourceType.TRANSCRIPT

                citations.append(Citation(
                    source_type=source_type,
                    source_id=c.get("source_id", ""),
                    display_label=c.get("display_label", "Source"),
                    context_snippet=c.get("context_snippet", ""),
                    source_ref={"type": c.get("source_type", ""), "id": c.get("source_id", "")}
                ))

            return QueryResponse(
                answer=parsed.get("answer", "I could not generate an answer from the available data."),
                citations=citations,
                follow_up_questions=parsed.get("follow_up_questions", []),
                session_id=str(uuid.uuid4()),
                can_escalate=parsed.get("can_escalate", True)
            )

        except json.JSONDecodeError:
            return QueryResponse(
                answer=response,  # Return raw response as answer
                citations=[],
                follow_up_questions=[],
                session_id=str(uuid.uuid4()),
                can_escalate=True
            )

    def _build_query_context(self, context_data: Dict[str, Any]) -> str:
        """Build context string optimized for query answering."""
        parts = []

        calls = context_data.get("calls", [])
        if calls:
            parts.append(f"=== CALLS ({len(calls)} total) ===")
            for call in calls[:15]:
                parts.append(f"\n[Call] ID: {call.get('id')} | Title: {call.get('title')} | "
                             f"Date: {str(call.get('started_at', ''))[:10]}")
                transcript = call.get("transcript", "")
                if transcript:
                    parts.append(transcript[:3000])

        emails = context_data.get("emails", [])
        if emails:
            parts.append(f"\n=== EMAILS ({len(emails)} total) ===")
            for email in emails[:10]:
                parts.append(f"\n[Email] ID: {email.get('id')} | Subject: {email.get('subject')} | "
                             f"Date: {str(email.get('sent_at', ''))[:10]}")
                body = email.get("body", "")
                if body:
                    parts.append(body[:1500])

        deals = context_data.get("deals", [])
        if deals:
            parts.append(f"\n=== DEALS ({len(deals)} total) ===")
            for deal in deals:
                parts.append(f"Deal: {deal.get('name')} | Stage: {deal.get('stage')} | "
                             f"Amount: ${deal.get('amount', 0)} | Status: {deal.get('status')}")

        return "\n".join(parts)
