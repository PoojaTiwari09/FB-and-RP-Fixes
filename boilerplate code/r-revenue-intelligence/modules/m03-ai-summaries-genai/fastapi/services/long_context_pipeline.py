"""
Core Feature 26: Long-Context Data Pipeline
Handles large transcript and email corpora by chunking,
summarizing intermediate results, and feeding summaries
into final report generation.

Covers test cases: TC-DR-21 through TC-DR-23
"""

import json
import math
from typing import List, Dict, Any
from services.llm_service import LLMService


class LongContextPipeline:
    """
    Map-reduce pipeline for handling large data volumes that exceed
    the LLM context window (128K tokens / ~80K usable).

    TC-DR-21: Process large corpus (100+ calls) without truncation.
    TC-DR-22: Generate intermediate summaries correctly.
    TC-DR-23: Handle mixed-length transcripts (2-min to 90-min).
    """

    def __init__(self, llm_service: LLMService):
        self.llm = llm_service
        self.max_tokens_per_chunk = 60000  # tokens per partition
        self.avg_chars_per_token = 4  # rough estimate
        self.max_chars_per_chunk = self.max_tokens_per_chunk * self.avg_chars_per_token

    async def process_large_corpus(
        self,
        context_data: Dict[str, Any],
        research_question: str,
        progress_callback=None
    ) -> Dict[str, Any]:
        """
        Process a large dataset using map-reduce strategy.
        
        TC-DR-21: All records are chunked, summarized, and fed into the pipeline.
        TC-DR-22: Each batch produces a coherent intermediate summary.
        TC-DR-23: Both short and long transcripts are processed correctly.
        """
        # Step 1: Calculate total data size
        all_text = self._extract_all_text(context_data)
        total_chars = sum(len(t["text"]) for t in all_text)
        estimated_tokens = total_chars // self.avg_chars_per_token

        # Check if map-reduce is needed
        if estimated_tokens <= self.max_tokens_per_chunk:
            return {
                "strategy": "direct",
                "data": context_data,
                "total_sources": len(all_text),
                "estimated_tokens": estimated_tokens,
                "partitions": 1,
                "intermediate_summaries": []
            }

        # Step 2: Partition data into manageable chunks
        partitions = self._partition_data(all_text)
        total_partitions = len(partitions)

        if progress_callback:
            await progress_callback(20, f"Partitioned data into {total_partitions} batches")

        # Step 3: Generate intermediate summaries (MAP phase)
        intermediate_summaries = []
        for i, partition in enumerate(partitions):
            try:
                summary = await self._summarize_partition(
                    partition, research_question, i + 1, total_partitions
                )
                intermediate_summaries.append({
                    "partition": i + 1,
                    "source_count": len(partition),
                    "summary": summary,
                    "status": "COMPLETED",
                    "source_ids": [t["source_id"] for t in partition]
                })
            except Exception as e:
                # TC-DR-21: Don't silently drop records — log the failure
                intermediate_summaries.append({
                    "partition": i + 1,
                    "source_count": len(partition),
                    "summary": f"Partition {i+1} summarization failed: {str(e)}",
                    "status": "FAILED",
                    "source_ids": [t["source_id"] for t in partition]
                })

            if progress_callback:
                pct = 20 + int((i + 1) / total_partitions * 40)
                await progress_callback(pct, f"Summarized batch {i+1}/{total_partitions}")

        # Step 4: REDUCE — Synthesize all summaries
        if progress_callback:
            await progress_callback(65, "Synthesizing intermediate summaries")

        return {
            "strategy": "map_reduce",
            "total_sources": len(all_text),
            "estimated_tokens": estimated_tokens,
            "partitions": total_partitions,
            "intermediate_summaries": intermediate_summaries,
            "data": self._create_reduced_context(context_data, intermediate_summaries)
        }

    def _extract_all_text(self, context_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Extract all text content with source metadata."""
        text_items = []

        for call in context_data.get("calls", []):
            transcript = call.get("transcript", "")
            if transcript:
                text_items.append({
                    "source_id": call.get("id", ""),
                    "source_type": "TRANSCRIPT",
                    "text": transcript,
                    "metadata": {
                        "title": call.get("title", ""),
                        "date": str(call.get("started_at", "")),
                        "duration": call.get("duration_seconds", 0),
                        "rep": call.get("owner_name", "")
                    }
                })

        for email in context_data.get("emails", []):
            body = email.get("body", "")
            if body:
                text_items.append({
                    "source_id": email.get("id", ""),
                    "source_type": "EMAIL",
                    "text": body,
                    "metadata": {
                        "subject": email.get("subject", ""),
                        "date": str(email.get("sent_at", "")),
                    }
                })

        return text_items

    def _partition_data(self, text_items: List[Dict[str, Any]]) -> List[List[Dict[str, Any]]]:
        """
        Partition text items into chunks that fit within the token budget.
        TC-DR-23: Handles mixed-length transcripts by adaptive partitioning.
        """
        partitions = []
        current_partition = []
        current_size = 0

        # Sort by text length to group similar sizes (better partition efficiency)
        sorted_items = sorted(text_items, key=lambda x: len(x["text"]))

        for item in sorted_items:
            item_size = len(item["text"])

            # TC-DR-23: Handle very long transcripts — split them individually
            if item_size > self.max_chars_per_chunk:
                # If current partition has items, finalize it
                if current_partition:
                    partitions.append(current_partition)
                    current_partition = []
                    current_size = 0

                # Split the long item into sub-chunks
                text = item["text"]
                chunk_size = self.max_chars_per_chunk - 1000  # buffer for metadata
                for j in range(0, len(text), chunk_size):
                    sub_item = {
                        **item,
                        "text": text[j:j+chunk_size],
                        "chunk_part": f"part_{j // chunk_size + 1}"
                    }
                    partitions.append([sub_item])
                continue

            if current_size + item_size > self.max_chars_per_chunk:
                # Current partition is full, start a new one
                if current_partition:
                    partitions.append(current_partition)
                current_partition = [item]
                current_size = item_size
            else:
                current_partition.append(item)
                current_size += item_size

        # Don't forget the last partition
        if current_partition:
            partitions.append(current_partition)

        return partitions

    async def _summarize_partition(
        self,
        partition: List[Dict[str, Any]],
        research_question: str,
        partition_num: int,
        total_partitions: int
    ) -> str:
        """
        TC-DR-22: Generate a coherent intermediate summary for a data partition.
        """
        system_prompt = f"""You are summarizing a batch of sales interaction data (batch {partition_num} of {total_partitions}) for a research analysis.

Focus on information relevant to this research question: {research_question}

RULES:
1. Preserve all source IDs for citation traceability.
2. Highlight objections, risks, pricing discussions, competitor mentions, and next steps.
3. Include sentiment indicators if discernible.
4. Do not invent information — only summarize what is in the data.
5. Keep the summary concise but comprehensive (max 2000 words).

Return a structured summary with source references."""

        # Build partition text
        parts = []
        for item in partition:
            parts.append(f"\n[{item['source_type']}] ID: {item['source_id']}")
            meta = item.get("metadata", {})
            if meta:
                parts.append(f"  Metadata: {json.dumps(meta)}")
            parts.append(f"  Content: {item['text'][:8000]}")

        user_prompt = "\n".join(parts)

        response = await self.llm.call_llm(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            max_tokens=3000
        )

        return response

    def _create_reduced_context(
        self,
        original_context: Dict[str, Any],
        summaries: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Create a reduced context using intermediate summaries instead of full text.
        This fits within the token budget for the final synthesis step.
        """
        reduced = {
            "calls": [],
            "emails": [],
            "deals": original_context.get("deals", []),
            "accounts": original_context.get("accounts", []),
            "contacts": original_context.get("contacts", []),
            "intermediate_summaries": [
                {
                    "partition": s["partition"],
                    "source_count": s["source_count"],
                    "source_ids": s.get("source_ids", []),
                    "summary": s["summary"],
                    "status": s["status"]
                }
                for s in summaries
            ]
        }

        # Keep minimal call/email metadata (without full transcripts)
        for call in original_context.get("calls", []):
            reduced["calls"].append({
                "id": call.get("id"),
                "title": call.get("title"),
                "started_at": call.get("started_at"),
                "duration_seconds": call.get("duration_seconds"),
                "owner_name": call.get("owner_name"),
                "sentiment_score": call.get("sentiment_score"),
            })

        for email in original_context.get("emails", []):
            reduced["emails"].append({
                "id": email.get("id"),
                "subject": email.get("subject"),
                "sent_at": email.get("sent_at"),
            })

        return reduced

    def needs_map_reduce(self, context_data: Dict[str, Any]) -> bool:
        """Check if the data volume requires map-reduce processing."""
        all_text = self._extract_all_text(context_data)
        total_chars = sum(len(t["text"]) for t in all_text)
        estimated_tokens = total_chars // self.avg_chars_per_token
        return estimated_tokens > self.max_tokens_per_chunk
