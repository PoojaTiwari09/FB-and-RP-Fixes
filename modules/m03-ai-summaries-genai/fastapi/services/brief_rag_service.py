import os
import json
import logging
from typing import List, Dict, Any, Optional
from services.llm_service import LLMService

logger = logging.getLogger(__name__)

class BriefRAGService:
    def __init__(self, llm_service: Optional[LLMService] = None):
        self.llm = llm_service or LLMService()

    def _format_timestamp(self, ms: Optional[int]) -> Optional[str]:
        if not ms:
            return None
        total_sec = int(ms // 1000)
        m = str(total_sec // 60).zfill(2)
        s = str(total_sec % 60).zfill(2)
        return f"{m}:{s}"

    def _truncate_data(self, data: Any, max_chars: int = 5000) -> str:
        s = json.dumps(data, indent=2)
        if len(s) <= max_chars:
            return s
        return s[:max_chars] + "\n...[truncated]"

    def _build_source_index(self, sources: List[Dict[str, Any]]) -> str:
        if not sources:
            return "No source records available."
        lines = []
        for i, s in enumerate(sources):
            ts = self._format_timestamp(s.get("timestamp_ms"))
            block = [
                f"[{i + 1}] sourceId=\"{s.get('sourceId')}\" type={s.get('sourceType')}",
                f"    speaker: {s.get('speaker')}" if s.get("speaker") else None,
                f"    timestamp: {ts}" if ts else None,
                f"    entity: {s.get('entityName')}" if s.get("entityName") else None,
                f"    excerpt: \"{s.get('excerpt', '')[:300]}\"",
            ]
            lines.append("\n".join(filter(None, block)))
        return "\n\n".join(lines)

    async def generate_brief_rag(
        self,
        brief_type: str,
        context_data: Any,
        instructions: str,
        sources: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        source_index = self._build_source_index(sources)

        system_message = (
            "You are an expert Revenue Intelligence AI that generates structured, fully-cited sales briefs.\n\n"
            "RULES:\n"
            "1. ONLY use facts from the provided CONTEXT DATA and SOURCE RECORDS — never hallucinate.\n"
            "2. Every bullet point MUST include at least one citation referencing a source from the SOURCE INDEX.\n"
            "3. Citations must use the exact sourceId from the SOURCE INDEX.\n"
            "4. If no source supports a claim, do not make the claim.\n"
            "5. Respond with valid JSON only — no markdown, no explanation."
        )

        user_message = (
            f"Generate a {brief_type} Brief as a JSON object with this EXACT structure:\n\n"
            "{{\n"
            "  \"title\": \"descriptive title\",\n"
            "  \"summaryPreview\": \"2-3 sentence executive summary\",\n"
            "  \"sentiment\": \"positive | negative | neutral\",\n"
            "  \"health\": \"good | at_risk | poor\",\n"
            "  \"contextLabels\": [\"tag1\", \"tag2\", \"tag3\"],\n"
            "  \"sections\": [\n"
            "    {{\n"
            "      \"title\": \"Section Name\",\n"
            "      \"summary\": \"optional paragraph\",\n"
            "      \"bullets\": [\n"
            "        {{\n"
            "          \"text\": \"The insight or finding\",\n"
            "          \"owner\": \"optional person responsible\",\n"
            "          \"richCitations\": [\n"
            "            {{\n"
            "              \"citation_id\": 1,\n"
            "              \"sourceType\": \"transcript\",\n"
            "              \"sourceId\": \"exact-uuid-from-source-index\",\n"
            "              \"speaker\": \"Speaker Name\",\n"
            "              \"excerpt\": \"Exact verbatim quote from the source\",\n"
            "              \"timestamp_ms\": 120000,\n"
            "              \"entityName\": \"Call or entity name\"\n"
            "            }}\n"
            "          ]\n"
            "        }}\n"
            "      ]\n"
            "    }}\n"
            "  ]\n"
            "}}\n\n"
            "━━━ CONTEXT DATA ━━━\n"
            f"{self._truncate_data(context_data)}\n\n"
            "━━━ SOURCE INDEX (cite these by sourceId) ━━━\n"
            f"{source_index}\n\n"
            "━━━ REQUIRED SECTIONS ━━━\n"
            f"{instructions}\n\n"
            "IMPORTANT: Every bullet must have richCitations. Use sourceId values EXACTLY as shown in the SOURCE INDEX.\n"
            "Respond with ONLY the JSON object."
        )

        logger.info(f"Generating {brief_type} brief with {len(sources)} source records via Groq...")
        raw_response = await self.llm.call_llm(
            system_prompt=system_message,
            user_prompt=user_message,
            max_tokens=3000,
            temperature=0.2,
            response_format={"type": "json_object"}
        )

        if not raw_response or not raw_response.strip():
            raise Exception("Groq returned empty response")

        try:
            parsed = json.loads(raw_response)
        except Exception as e:
            logger.error(f"JSON parse failed: {raw_response[:400]}")
            raise Exception(f"Failed to parse Groq JSON: {str(e)}")

        # Normalize outputs
        parsed["title"] = parsed.get("title") or f"{brief_type.capitalize()} Brief"
        parsed["summaryPreview"] = parsed.get("summaryPreview") or "Summary not available."
        parsed["contextLabels"] = parsed.get("contextLabels") or []
        parsed["sections"] = parsed.get("sections") or []

        source_map = {s["sourceId"]: s for s in sources}
        global_citation_id = 1
        global_bullet_id = 1

        for section in parsed["sections"]:
            for bullet in section.get("bullets", []):
                if "bullet_id" not in bullet:
                    bullet["bullet_id"] = f"bullet_{str(global_bullet_id).zfill(3)}"
                    global_bullet_id += 1

                rich_citations = bullet.get("richCitations", [])
                if rich_citations:
                    bullet["richCitations"] = []
                    for c in rich_citations:
                        source_id = c.get("sourceId", "")
                        reg = source_map.get(source_id, {})
                        bullet["richCitations"].append({
                            "citation_id": global_citation_id,
                            "sourceType": c.get("sourceType") or reg.get("sourceType") or "crm",
                            "sourceId": source_id,
                            "speaker": c.get("speaker") or reg.get("speaker") or "Unknown",
                            "excerpt": c.get("excerpt") or reg.get("excerpt") or "Excerpt not available",
                            "timestamp_ms": c.get("timestamp_ms") if c.get("timestamp_ms") is not None else reg.get("timestamp_ms"),
                            "entityName": c.get("entityName") or reg.get("entityName") or "CRM",
                        })
                        global_citation_id += 1
                else:
                    # Fallback citation
                    fallback = sources[0] if sources else None
                    if fallback:
                        bullet["richCitations"] = [{
                            "citation_id": global_citation_id,
                            "sourceType": fallback.get("sourceType", "crm"),
                            "sourceId": fallback.get("sourceId", ""),
                            "speaker": fallback.get("speaker") or "CRM",
                            "excerpt": fallback.get("excerpt") or "Excerpt not available",
                            "timestamp_ms": fallback.get("timestamp_ms"),
                            "entityName": fallback.get("entityName") or "CRM",
                        }]
                        global_citation_id += 1

        logger.info(f"Brief generation complete: {parsed.get('title')} | {len(parsed['sections'])} sections")
        return parsed
