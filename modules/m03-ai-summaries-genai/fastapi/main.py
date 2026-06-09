"""
M3 AI Deep Researcher — FastAPI AI/ML Service
Main application entry point.
Handles research orchestration, pattern detection, segment comparison,
report building, and Ask Anything queries via Groq's Llama model.
"""

import os
import json
import uuid
import asyncio
from datetime import datetime, timedelta, timezone
import dateutil.parser
from typing import Optional, Dict, Any, List

from fastapi import FastAPI, HTTPException, BackgroundTasks, Query
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from supabase import create_client, Client

from models.schemas import (
    ResearchRequest, ResearchResponse, QueryRequest, QueryResponse,
    HealthResponse, JobStatus, ResearchReport
)
from services.llm_service import LLMService, MultiStepReasoningOrchestrator
from services.pattern_detection import PatternDetectionEngine
from services.segment_comparison import SegmentComparisonService
from services.report_builder import ReportBuilder
from services.web_integration import WebDataIntegrationService
from services.long_context_pipeline import LongContextPipeline
from services.query_handler import QueryHandler
from services.brief_rag_service import BriefRAGService

load_dotenv()

# ============================================================
# App Init
# ============================================================
app = FastAPI(
    title="M3 AI Deep Researcher",
    description="AI/ML service for deep research analysis using Groq Llama",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================
# Service Initialization
# ============================================================
llm_service = LLMService()
orchestrator = MultiStepReasoningOrchestrator(llm_service)
pattern_engine = PatternDetectionEngine(llm_service)
comparison_service = SegmentComparisonService(llm_service)
report_builder = ReportBuilder(llm_service)
web_integration = WebDataIntegrationService()
long_context = LongContextPipeline(llm_service)
query_handler = QueryHandler(llm_service)
brief_rag_service = BriefRAGService(llm_service)

# Supabase client
supabase: Optional[Client] = None
try:
    supabase_url = os.getenv("SUPABASE_URL", "")
    supabase_key = os.getenv("SUPABASE_SERVICE_KEY", "")
    if supabase_url and supabase_key:
        supabase = create_client(supabase_url, supabase_key)
except Exception as e:
    print(f"Supabase connection failed: {e}")


# ============================================================
# Data Retrieval Helpers
# ============================================================
async def fetch_context_data(
    org_id: str,
    filters: Dict[str, Any] = None,
    period_days: int = 60
) -> Dict[str, Any]:
    """Fetch all relevant data from Supabase for research context.
    ALL queries run in parallel using asyncio.gather + asyncio.to_thread.
    """
    if not supabase:
        return _get_fallback_data()

    try:
        period_start = (datetime.utcnow() - timedelta(days=period_days)).isoformat()

        # ── Define each query as a sync function to run in its own thread ──

        def _fetch_calls():
            q = supabase.table("calls").select("*").eq("org_id", org_id).gte("started_at", period_start).order("started_at", desc=True)
            if filters and filters.get("region"):
                acc_q = supabase.table("accounts").select("id").eq("org_id", org_id).eq("region", filters["region"])
                acc_result = acc_q.execute()
                account_ids = [a["id"] for a in acc_result.data] if acc_result.data else []
                if account_ids:
                    q = q.in_("account_id", account_ids)
            return q.limit(100).execute()

        def _fetch_emails():
            return supabase.table("emails").select("*").eq("org_id", org_id).gte("sent_at", period_start).order("sent_at", desc=True).limit(200).execute()

        def _fetch_deals():
            q = supabase.table("deals").select("*").eq("org_id", org_id)
            if filters and filters.get("stage"):
                q = q.eq("stage", filters["stage"])
            return q.execute()

        def _fetch_accounts():
            q = supabase.table("accounts").select("*").eq("org_id", org_id)
            if filters and filters.get("segment"):
                q = q.eq("segment", filters["segment"])
            if filters and filters.get("region"):
                q = q.eq("region", filters["region"])
            return q.execute()

        def _fetch_contacts():
            return supabase.table("contacts").select("*").eq("org_id", org_id).execute()

        def _fetch_users():
            return supabase.table("users").select("id,name,role,team_id").eq("org_id", org_id).execute()

        # ── Fire ALL 6 queries at the same time in parallel ──
        calls_result, emails_result, deals_result, accounts_result, contacts_result, users_result = await asyncio.gather(
            asyncio.to_thread(_fetch_calls),
            asyncio.to_thread(_fetch_emails),
            asyncio.to_thread(_fetch_deals),
            asyncio.to_thread(_fetch_accounts),
            asyncio.to_thread(_fetch_contacts),
            asyncio.to_thread(_fetch_users),
        )

        user_map = {u["id"]: u["name"] for u in (users_result.data or [])}

        # Enrich calls with owner names
        calls_data = calls_result.data or []
        for call in calls_data:
            call["owner_name"] = user_map.get(call.get("owner_user_id"), "Unknown Rep")

        return {
            "calls": calls_data,
            "emails": emails_result.data or [],
            "deals": deals_result.data or [],
            "accounts": accounts_result.data or [],
            "contacts": contacts_result.data or [],
            "users": users_result.data or [],
        }

    except Exception as e:
        print(f"Data fetch error: {e}")
        return _get_fallback_data()


def _get_fallback_data() -> Dict[str, Any]:
    """Return empty data structure when Supabase is unavailable."""
    return {"calls": [], "emails": [], "deals": [], "accounts": [], "contacts": [], "users": []}


async def update_job_status(job_id: str, status: str, progress: int, stage: str, error: str = None, report_data: dict = None):
    """Update research job status in Supabase (offloaded to thread)."""
    if not supabase:
        return

    try:
        update = {
            "status": status,
            "progress_pct": progress,
            "progress_stage": stage,
            "updated_at": datetime.utcnow().isoformat()
        }
        if error:
            update["error_message"] = error
        if status in ("COMPLETED", "FAILED", "CANCELLED"):
            update["completed_at"] = datetime.utcnow().isoformat()

        await asyncio.to_thread(
            lambda: supabase.table("research_jobs").update(update).eq("id", job_id).execute()
        )
    except Exception as e:
        print(f"Job status update failed: {e}")


async def save_report(job_id: str, org_id: str, user_id: str, report: ResearchReport, query: str, filters: Dict):
    """Persist research report to Supabase. Citation inserts run in parallel."""
    if not supabase:
        return report.report_id

    try:
        report_data = {
            "id": report.report_id,
            "org_id": org_id,
            "job_id": job_id,
            "generated_by_user_id": user_id,
            "title": report.title,
            "query": query,
            "scope": "ENTIRE_ACCOUNT",
            "period_days": filters.get("period_days", 60),
            "filters": filters,
            "status": "COMPLETED",
            "sections": json.loads(report.model_dump_json()).get("sections", []),
            "metadata": report.metadata,
            "model_used": llm_service.model,
            "created_at": datetime.utcnow().isoformat()
        }
        await asyncio.to_thread(
            lambda: supabase.table("research_reports").insert(report_data).execute()
        )

        # Save ALL citations in parallel
        citation_tasks = []
        for section in report.sections:
            for bullet in section.bullets:
                for citation in bullet.citations:
                    cit_data = {
                        "id": str(uuid.uuid4()),
                        "org_id": org_id,
                        "report_id": report.report_id,
                        "section_id": section.section_id,
                        "bullet_id": bullet.bullet_id,
                        "source_type": citation.source_type.value,
                        "source_id": citation.source_id,
                        "source_ref": citation.source_ref or {},
                        "display_label": citation.display_label,
                        "source_url": citation.source_url,
                        "context_snippet": citation.context_snippet,
                    }
                    citation_tasks.append(
                        asyncio.to_thread(lambda d=cit_data: supabase.table("citations").insert(d).execute())
                    )
        if citation_tasks:
            await asyncio.gather(*citation_tasks)

        return report.report_id
    except Exception as e:
        print(f"Report save error: {e}")
        return report.report_id


# ============================================================
# Background Research Pipeline
# ============================================================
async def run_research_pipeline(
    job_id: str,
    request: ResearchRequest
):
    """
    Full async research pipeline:
    1. Fetch data
    2. Check if long-context pipeline is needed
    3. Decompose query into sub-queries
    4. Execute sub-queries (parallel + sequential)
    5. Run pattern detection
    6. Run segment comparison (if applicable)
    7. Fetch web data (if enabled)
    8. Build evidence-backed report
    9. Persist report
    """
    try:
        # Update: PROCESSING
        await update_job_status(job_id, "PROCESSING", 5, "Fetching data")
        await asyncio.sleep(5)

        # Step 1: Fetch context data
        context_data = await fetch_context_data(
            org_id=request.org_id,
            filters=request.filters,
            period_days=request.period_days
        )
        await update_job_status(job_id, "PROCESSING", 10, "Data retrieved")
        await asyncio.sleep(2)

        # Step 2: Check for long-context
        if long_context.needs_map_reduce(context_data):
            async def lc_progress(pct, stage):
                await update_job_status(job_id, "PROCESSING", 10 + int(pct * 0.2), f"Long-context: {stage}")

            lc_result = await long_context.process_large_corpus(
                context_data, request.query, progress_callback=lc_progress
            )
            context_data = lc_result["data"]

        await update_job_status(job_id, "PROCESSING", 15, "Decomposing query and running analytics")
        await asyncio.sleep(5)

        # Step 3, 4, 5, 6: Run in parallel to drastically reduce execution time
        async def run_sub_queries():
            plan = await orchestrator.decompose_query(request.query, {
                "filters": request.filters,
                "data_summary": {
                    "calls": len(context_data.get("calls", [])),
                    "emails": len(context_data.get("emails", [])),
                    "deals": len(context_data.get("deals", [])),
                }
            })

            # Store sub-queries in job
            if supabase:
                try:
                    sub_q_data = [{"id": sq.id, "question": sq.question, "type": sq.type, "status": sq.status} for sq in plan.sub_queries]
                    supabase.table("research_jobs").update({"sub_queries": sub_q_data}).eq("id", job_id).execute()
                except Exception:
                    pass

            async def exec_progress(pct, stage):
                await update_job_status(job_id, "PROCESSING", 25 + int(pct * 0.35), stage)

            return await orchestrator.execute_plan(plan, context_data, progress_callback=exec_progress)

        async def run_patterns():
            return await pattern_engine.detect_patterns(context_data, focus_area="objections, risks, and recurring themes")

        async def run_web():
            if request.web_data_enabled:
                account_names = [a.get("name", "") for a in context_data.get("accounts", [])]
                if account_names:
                    web_result = await web_integration.fetch_web_data(
                        account_names[0], "recent news and performance", enabled=True
                    )
                    if web_result.get("status") == "success":
                        return web_result["data"]
            return None

        # Launch sub-queries, pattern detection, and web scraping concurrently
        sub_results, pattern_result, web_data = await asyncio.gather(
            run_sub_queries(),
            run_patterns(),
            run_web()
        )
        
        await asyncio.sleep(15)

        patterns_dict = json.loads(pattern_result.model_dump_json()) if pattern_result and pattern_result.patterns else None

        await update_job_status(job_id, "PROCESSING", 75, "Building final evidence-backed report")
        await asyncio.sleep(10)

        # Step 7: Build evidence-backed report
        report = await report_builder.build_report(
            query=request.query,
            sub_results=sub_results,
            patterns=patterns_dict,
            comparison=None,
            filters=request.filters,
            context_data=context_data
        )

        # Enrich report metadata
        report.metadata["filters"] = request.filters
        report.metadata["period_days"] = request.period_days
        report.metadata["total_calls"] = len(context_data.get("calls", []))
        report.metadata["total_emails"] = len(context_data.get("emails", []))
        report.metadata["patterns_detected"] = len(pattern_result.patterns) if pattern_result else 0

        await update_job_status(job_id, "PROCESSING", 90, "Saving report")
        await asyncio.sleep(3)

        # Step 8: Persist report
        report_id = await save_report(
            job_id=job_id,
            org_id=request.org_id,
            user_id=request.user_id,
            report=report,
            query=request.query,
            filters=request.filters
        )

        await update_job_status(job_id, "COMPLETED", 100, "Report ready")

        # Log analytics
        if supabase:
            try:
                supabase.table("query_analytics").insert({
                    "id": str(uuid.uuid4()),
                    "org_id": request.org_id,
                    "user_id": request.user_id,
                    "query_type": "RESEARCH",
                    "prompt_hash": llm_service._compute_prompt_hash("research", request.query),
                    "model_used": llm_service.model,
                    "status": "SUCCESS",
                    "created_at": datetime.utcnow().isoformat()
                }).execute()
            except Exception:
                pass

    except Exception as e:
        await update_job_status(job_id, "FAILED", 0, "Pipeline failed", error=str(e))
        print(f"Research pipeline error: {e}")
        import traceback
        traceback.print_exc()


# ============================================================
# API Endpoints
# ============================================================

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    groq_ok = await llm_service.check_connection()
    supabase_ok = supabase is not None
    return HealthResponse(
        status="ok" if groq_ok else "degraded",
        service="deep-research-ai",
        groq_connected=groq_ok,
        supabase_connected=supabase_ok
    )


@app.post("/api/v1/research/run", response_model=ResearchResponse)
async def create_research_job(request: ResearchRequest, background_tasks: BackgroundTasks):
    """
    Create and start a research job.
    Returns immediately with jobId; processing happens in background.
    """
    job_id = str(uuid.uuid4())

    # Create job record in Supabase
    if supabase:
        try:
            supabase.table("research_jobs").insert({
                "id": job_id,
                "org_id": request.org_id,
                "user_id": request.user_id,
                "query": request.query,
                "context_type": request.context_type,
                "context_id": request.context_id,
                "scope": request.scope,
                "period_days": request.period_days,
                "filters": request.filters,
                "status": "QUEUED",
                "progress_pct": 0,
                "progress_stage": "Job queued",
                "created_at": datetime.utcnow().isoformat(),
                "updated_at": datetime.utcnow().isoformat()
            }).execute()
        except Exception as e:
            print(f"Job creation error: {e}")
            raise HTTPException(status_code=500, detail=f"Failed to create job in database: {str(e)}")

    # Launch pipeline in background
    background_tasks.add_task(run_research_pipeline, job_id, request)

    return ResearchResponse(
        job_id=job_id,
        status=JobStatus.QUEUED,
        progress_pct=0,
        progress_stage="Job queued"
    )


@app.get("/api/v1/research/jobs/{job_id}")
async def get_job_status(job_id: str):
    """Get research job status and progress."""
    if not supabase:
        return {"job_id": job_id, "status": "UNKNOWN", "progress_pct": 0}

    try:
        result = supabase.table("research_jobs").select("*").eq("id", job_id).single().execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Job not found")

        job = result.data
        response = {
            "job_id": job["id"],
            "status": job["status"],
            "progress_pct": job["progress_pct"],
            "progress_stage": job.get("progress_stage", ""),
            "query": job["query"],
            "filters": job.get("filters", {}),
            "sub_queries": job.get("sub_queries", []),
            "error": job.get("error_message"),
            "created_at": job["created_at"],
            "completed_at": job.get("completed_at"),
        }

        # If completed, include report ID
        if job["status"] == "COMPLETED":
            report_result = supabase.table("research_reports").select("id").eq("job_id", job_id).single().execute()
            if report_result.data:
                response["report_id"] = report_result.data["id"]

        return response
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/v1/research/jobs/{job_id}/cancel")
async def cancel_job(job_id: str):
    """Cancel a running research job."""
    if not supabase:
        return {"status": "cancelled"}

    try:
        result = supabase.table("research_jobs").select("status").eq("id", job_id).single().execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Job not found")

        if result.data["status"] in ("COMPLETED", "FAILED", "CANCELLED"):
            raise HTTPException(status_code=400, detail=f"Cannot cancel job with status: {result.data['status']}")

        supabase.table("research_jobs").update({
            "status": "CANCELLED",
            "completed_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }).eq("id", job_id).execute()

        return {"status": "cancelled", "job_id": job_id}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/research/jobs")
async def list_jobs(
    org_id: str = "a0000000-0000-0000-0000-000000000001",
    user_id: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 20
):
    """List research jobs for an org/user."""
    if not supabase:
        return {"jobs": [], "total": 0}

    try:
        query = supabase.table("research_jobs").select("*").eq("org_id", org_id).order("created_at", desc=True).limit(limit)
        if user_id:
            query = query.eq("user_id", user_id)
        if status:
            query = query.eq("status", status)

        result = query.execute()
        return {"jobs": result.data or [], "total": len(result.data or [])}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/research/reports/{report_id}")
async def get_report(report_id: str):
    """Get a full research report by ID."""
    if not supabase:
        raise HTTPException(status_code=404, detail="Report not found")

    try:
        result = supabase.table("research_reports").select("*").eq("id", report_id).single().execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Report not found")

        report = result.data

        # Fetch citations for this report
        citations_result = supabase.table("citations").select("*").eq("report_id", report_id).execute()

        return {
            **report,
            "all_citations": citations_result.data or []
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/research/reports/{report_id}/history")
async def get_report_history(report_id: str):
    """Get version history for a report."""
    if not supabase:
        return {"versions": []}

    try:
        # Get the job_id for this report
        report = supabase.table("research_reports").select("job_id,query").eq("id", report_id).single().execute()
        if not report.data:
            raise HTTPException(status_code=404, detail="Report not found")

        # Find all versions (same query)
        versions = supabase.table("research_reports").select("id,version,created_at,status,query").eq(
            "query", report.data["query"]
        ).order("version", desc=True).execute()

        return {"versions": versions.data or []}
    except HTTPException:
        raise
    except Exception as e:
        return {"versions": []}


@app.post("/api/v1/query", response_model=QueryResponse)
async def ask_anything(request: QueryRequest):
    """Ask Anything — natural language query endpoint."""
    try:
        context_data = await fetch_context_data(
            org_id=request.org_id,
            period_days=60
        )

        session_history = None
        if request.session_id and supabase:
            try:
                session = supabase.table("query_sessions").select("messages").eq("id", request.session_id).single().execute()
                if session.data:
                    session_history = session.data.get("messages", [])
            except Exception:
                pass

        response = await query_handler.process_query(
            query=request.query,
            context_data=context_data,
            session_history=session_history
        )

        # Save session
        if supabase:
            try:
                session_data = {
                    "id": response.session_id,
                    "org_id": request.org_id,
                    "user_id": request.user_id,
                    "context_type": request.context_type,
                    "context_id": request.context_id,
                    "messages": [
                        {"role": "user", "content": request.query},
                        {"role": "assistant", "content": response.answer}
                    ],
                    "last_active_at": datetime.utcnow().isoformat(),
                    "expires_at": (datetime.utcnow() + timedelta(minutes=30)).isoformat()
                }
                supabase.table("query_sessions").upsert(session_data).execute()
            except Exception:
                pass

        # Log analytics
        if supabase:
            try:
                supabase.table("query_analytics").insert({
                    "id": str(uuid.uuid4()),
                    "org_id": request.org_id,
                    "user_id": request.user_id,
                    "query_type": "ASK_ANYTHING",
                    "model_used": llm_service.model,
                    "status": "SUCCESS",
                    "created_at": datetime.utcnow().isoformat()
                }).execute()
            except Exception:
                pass

        return response

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/v1/research/reports/{report_id}/feedback")
async def submit_feedback(report_id: str, feedback: dict):
    """Submit feedback on a research report."""
    if not supabase:
        return {"status": "ok"}

    try:
        supabase.table("feedback").insert({
            "id": str(uuid.uuid4()),
            "org_id": feedback.get("org_id", "a0000000-0000-0000-0000-000000000001"),
            "user_id": feedback.get("user_id", "c0000000-0000-0000-0000-000000000001"),
            "report_id": report_id,
            "bullet_id": feedback.get("bullet_id"),
            "section_id": feedback.get("section_id"),
            "feedback_type": feedback.get("type", "THUMBS_UP"),
            "note": feedback.get("note"),
            "created_at": datetime.utcnow().isoformat()
        }).execute()
        return {"status": "ok"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/v1/data/summary")
async def get_data_summary(org_id: str = "a0000000-0000-0000-0000-000000000001"):
    """Get a summary of available data for the org."""
    if not supabase:
        return {"calls": 0, "emails": 0, "deals": 0, "accounts": 0, "contacts": 0}

    try:
        calls = supabase.table("calls").select("id", count="exact").eq("org_id", org_id).execute()
        emails = supabase.table("emails").select("id", count="exact").eq("org_id", org_id).execute()
        deals = supabase.table("deals").select("id", count="exact").eq("org_id", org_id).execute()
        accounts = supabase.table("accounts").select("id", count="exact").eq("org_id", org_id).execute()
        users = supabase.table("users").select("id,name,role,team_id").eq("org_id", org_id).execute()
        teams = supabase.table("teams").select("id,name").eq("org_id", org_id).execute()

        return {
            "calls": calls.count or 0,
            "emails": emails.count or 0,
            "deals": deals.count or 0,
            "accounts": accounts.count or 0,
            "users": users.data or [],
            "teams": teams.data or [],
        }
    except Exception as e:
        return {"calls": 0, "emails": 0, "deals": 0, "accounts": 0, "error": str(e)}


# ============================================================
# AI Smart Summaries Endpoints
# ============================================================

@app.get("/api/admin/templates")
async def list_templates():
    if not supabase:
        return []
    try:
        res = supabase.table("brief_templates").select("*, sections:brief_template_sections(id)").order("created_at", desc=True).execute()
        data = res.data or []
        for t in data:
            sections = t.get("sections", [])
            t["sections"] = {"count": len(sections)} if isinstance(sections, list) else {"count": 0}
        return data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/admin/templates")
async def create_template(body: dict):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not connected")
    try:
        template_name = body.get("template_name")
        entity_type = body.get("entity_type")
        description = body.get("description")
        is_active = body.get("is_active", True)
        
        if not template_name or not entity_type:
            raise HTTPException(status_code=400, detail="Missing required fields")
            
        res = supabase.table("brief_templates").insert({
            "org_id": "a0000000-0000-0000-0000-000000000001",
            "template_name": template_name,
            "entity_type": entity_type,
            "description": description,
            "is_active": is_active,
            "version_number": 1
        }).execute()
        
        if not res.data:
            raise HTTPException(status_code=500, detail="Failed to create template")
        return res.data[0]
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/admin/templates/{template_id}")
async def get_template(template_id: str):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not connected")
    try:
        template_res = supabase.table("brief_templates").select("*").eq("id", template_id).single().execute()
        if not template_res.data:
            raise HTTPException(status_code=404, detail="Template not found")
        
        sections_res = supabase.table("brief_template_sections").select("*").eq("template_id", template_id).order("section_order", desc=False).execute()
        
        template = template_res.data
        template["sections"] = sections_res.data or []
        return template
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.put("/api/admin/templates/{template_id}")
async def update_template(template_id: str, body: dict):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not connected")
    try:
        template_name = body.get("template_name")
        entity_type = body.get("entity_type")
        description = body.get("description")
        is_active = body.get("is_active")
        sections = body.get("sections")
        
        update_data = {
            "updated_at": datetime.utcnow().isoformat()
        }
        if template_name is not None: update_data["template_name"] = template_name
        if entity_type is not None: update_data["entity_type"] = entity_type
        if description is not None: update_data["description"] = description
        if is_active is not None: update_data["is_active"] = is_active
        if body.get("version_number") is not None:
            update_data["version_number"] = body["version_number"] + 1
            
        template_res = supabase.table("brief_templates").update(update_data).eq("id", template_id).execute()
        if not template_res.data:
            raise HTTPException(status_code=404, detail="Template not found")
            
        if sections is not None and isinstance(sections, list):
            # Delete old sections
            supabase.table("brief_template_sections").delete().eq("template_id", template_id).execute()
            
            # Insert new sections
            sections_to_insert = []
            for index, s in enumerate(sections):
                sections_to_insert.append({
                    "template_id": template_id,
                    "section_name": s.get("section_name"),
                    "ai_question": s.get("ai_question"),
                    "instructions": s.get("instructions"),
                    "section_order": index + 1,
                    "enabled": s.get("enabled", True),
                    "required": s.get("required", False),
                    "data_sources": s.get("data_sources", {})
                })
            if sections_to_insert:
                supabase.table("brief_template_sections").insert(sections_to_insert).execute()
                
        return {"success": True, "template": template_res.data[0]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/api/admin/templates/{template_id}")
async def delete_template(template_id: str):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not connected")
    try:
        supabase.table("brief_template_sections").delete().eq("template_id", template_id).execute()
        res = supabase.table("brief_templates").delete().eq("id", template_id).execute()
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/feedback")
async def submit_brief_feedback(body: dict):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not connected")
    try:
        feedback_type = body.get("feedbackType")
        if not feedback_type:
            raise HTTPException(status_code=400, detail="feedbackType is required")
            
        supabase.table("brief_feedback").insert({
            "org_id": "a0000000-0000-0000-0000-000000000001",
            "entity_type": body.get("entityType"),
            "entity_id": body.get("entityId"),
            "brief_type": body.get("briefType"),
            "section_name": body.get("sectionName"),
            "bullet_id": body.get("bulletId"),
            "bullet_text": body.get("bulletText"),
            "feedback_type": feedback_type,
            "feedback_reason": body.get("feedbackReason"),
            "feedback_comment": body.get("feedbackComment"),
            "user_id": "anonymous",
            "metadata": {"timestamp": int(datetime.utcnow().timestamp() * 1000)}
        }).execute()
        
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/feedback")
async def get_brief_feedback_stats():
    if not supabase:
        return {"success": True, "stats": {}}
    try:
        res = supabase.table("brief_feedback").select("*").order("created_at", desc=True).limit(500).execute()
        rows = res.data or []
        
        by_type = {}
        by_reason = {}
        by_bullet = {}
        by_section = {}
        
        for r in rows:
            ftype = r.get("feedback_type")
            freason = r.get("feedback_reason")
            bullet_id = r.get("bullet_id")
            bullet_text = r.get("bullet_text")
            section_name = r.get("section_name")
            
            if ftype: by_type[ftype] = by_type.get(ftype, 0) + 1
            if freason: by_reason[freason] = by_reason.get(freason, 0) + 1
            if bullet_id:
                if bullet_id not in by_bullet:
                    by_bullet[bullet_id] = {"count": 0, "text": bullet_text or "", "flags": 0}
                by_bullet[bullet_id]["count"] += 1
                if ftype in ["inaccuracy_flag", "hallucination"]:
                    by_bullet[bullet_id]["flags"] += 1
            if section_name: by_section[section_name] = by_section.get(section_name, 0) + 1
            
        total = len(rows)
        thumbs_up = by_type.get("thumbs_up", 0)
        thumbs_down = by_type.get("thumbs_down", 0)
        flags = by_type.get("inaccuracy_flag", 0) + by_type.get("hallucination", 0)
        
        positive_rate = round((thumbs_up / total) * 100) if total > 0 else 0
        flag_rate = round((flags / total) * 100) if total > 0 else 0
        
        most_flagged = []
        for bid, v in by_bullet.items():
            most_flagged.append({
                "bullet_id": bid,
                "count": v["count"],
                "text": v["text"],
                "flags": v["flags"]
            })
        most_flagged.sort(key=lambda x: x["flags"], reverse=True)
        most_flagged = most_flagged[:10]
        
        recent = rows[:20]
        
        return {
            "success": True,
            "stats": {
                "total": total,
                "thumbsUp": thumbs_up,
                "thumbsDown": thumbs_down,
                "flags": flags,
                "positiveRate": positive_rate,
                "flagRate": flag_rate,
                "byType": by_type,
                "byReason": by_reason,
                "bySection": by_section,
                "mostFlagged": most_flagged,
                "recent": recent
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/share/create")
async def create_share_link(body: dict):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not connected")
    try:
        entity_id = body.get("entityId")
        entity_type = body.get("entityType")
        brief_type = body.get("briefType")
        expiry = body.get("expiry", "7d")
        summary = body.get("summary")
        
        if not entity_id or not entity_type or not brief_type or not summary:
            raise HTTPException(status_code=400, detail="Missing required fields")
            
        token = uuid.uuid4().hex + uuid.uuid4().hex
        
        expires_at = None
        if expiry != "never":
            days = {"24h": 1, "7d": 7, "30d": 30}.get(expiry, 7)
            expires_at = (datetime.utcnow() + timedelta(days=days)).isoformat()
            
        res = supabase.table("shared_briefs").insert({
            "org_id": "a0000000-0000-0000-0000-000000000001",
            "entity_type": entity_type,
            "entity_id": entity_id,
            "brief_type": brief_type,
            "share_token": token,
            "access_type": "read_only",
            "expires_at": expires_at,
            "is_active": True,
            "snapshot_summary": summary,
            "metadata": {
                "created_at_ms": int(datetime.utcnow().timestamp() * 1000),
                "expiry_setting": expiry
            }
        }).execute()
        
        if not res.data:
            raise HTTPException(status_code=500, detail="Failed to create share link")
            
        share_url = f"http://localhost:5173/smart-summaries/shared/{token}"
        
        return {
            "success": True,
            "token": token,
            "shareUrl": share_url,
            "expiresAt": res.data[0].get("expires_at"),
            "id": res.data[0].get("id")
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/share/revoke")
async def revoke_share_link(body: dict):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not connected")
    try:
        token = body.get("token")
        if not token:
            raise HTTPException(status_code=400, detail="Token required")
            
        supabase.table("shared_briefs").update({"is_active": False}).eq("share_token", token).execute()
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/share/{token}")
async def get_shared_brief(token: str):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not connected")
    try:
        res = supabase.table("shared_briefs").select("*").eq("share_token", token).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Shared brief not found")
            
        share = res.data[0]
        if not share.get("is_active"):
            raise HTTPException(status_code=403, detail="This shared link has been revoked")
            
        expires_at_str = share.get("expires_at")
        if expires_at_str:
            expires_at = dateutil.parser.isoparse(expires_at_str)
            if expires_at.tzinfo is not None:
                now = datetime.now(timezone.utc)
            else:
                now = datetime.utcnow()
            if expires_at < now:
                raise HTTPException(status_code=403, detail="This shared link has expired")
            
        return {
            "success": True,
            "data": {
                "entityType": share.get("entity_type"),
                "entityId": share.get("entity_id"),
                "briefType": share.get("brief_type"),
                "accessType": share.get("access_type"),
                "expiresAt": share.get("expires_at"),
                "createdAt": share.get("created_at"),
                "summary": share.get("snapshot_summary")
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/ai-summaries/{brief_type}-brief/{entity_id}")
async def generate_brief(brief_type: str, entity_id: str):
    if not supabase:
        raise HTTPException(status_code=500, detail="Supabase not connected")
    
    try:
        # 1. Fetch active template for brief_type
        template_res = supabase.table("brief_templates").select("*, sections:brief_template_sections(*)").eq("entity_type", brief_type).eq("is_active", True).order("created_at", desc=True).limit(1).execute()
        
        template = template_res.data[0] if template_res.data else {"sections": []}
        sections = template.get("sections", [])
        if sections and isinstance(sections, list):
            sections.sort(key=lambda x: x.get("section_order", 1))
        else:
            sections = []
            
        active_sections = [s for s in sections if s.get("enabled", True)]
        
        # Collect global allowed data sources from sections
        allowed_sources = {
            "calls": any(s.get("data_sources", {}).get("calls") for s in active_sections),
            "emails": any(s.get("data_sources", {}).get("emails") for s in active_sections),
            "transcripts": any(s.get("data_sources", {}).get("transcripts") or s.get("data_sources", {}).get("calls") for s in active_sections),
            "activities": any(s.get("data_sources", {}).get("activities") for s in active_sections),
            "notes": any(s.get("data_sources", {}).get("notes") for s in active_sections),
        }
        
        sources = []
        context = {}
        metadata = {}
        
        # 2. Fetch specific data depending on brief_type
        if brief_type == "call":
            # Fetch call
            call_res = supabase.table("calls").select("id, title, started_at, duration_seconds, account_id, deal_id").eq("id", entity_id).single().execute()
            if not call_res.data:
                raise HTTPException(status_code=404, detail=f"Call not found: {entity_id}")
            call = call_res.data
            
            # Conditionally fetch transcripts
            transcripts = []
            if allowed_sources.get("transcripts") or allowed_sources.get("calls"):
                t_res = supabase.table("transcripts").select("id, transcript_text, speaker, timestamp_ms, sentiment").eq("call_id", entity_id).order("timestamp_ms", desc=False).limit(20).execute()
                transcripts = t_res.data or []
                
            # Fetch account (always for context)
            account = None
            account_id = call.get("account_id")
            if account_id:
                acc_res = supabase.table("accounts").select("id, name, industry").eq("id", account_id).single().execute()
                account = acc_res.data
                
            # Fetch contacts (always for context)
            contacts = []
            if account_id:
                con_res = supabase.table("contacts").select("id, name, role_title").eq("account_id", account_id).limit(5).execute()
                contacts = con_res.data or []
                
            # Fetch emails
            emails = []
            if allowed_sources.get("emails") and account_id:
                em_res = supabase.table("emails").select("id, subject, body, sent_at").eq("account_id", account_id).limit(5).execute()
                emails = em_res.data or []
                
            # Map transcripts to source records
            for t in transcripts:
                text = (t.get("transcript_text") or "").strip()
                if not text: continue
                sources.append({
                    "sourceId": t["id"],
                    "sourceType": "transcript",
                    "speaker": t.get("speaker") or "Unknown Speaker",
                    "excerpt": text[:400],
                    "timestamp_ms": t.get("timestamp_ms"),
                    "entityName": call.get("title") or "Call"
                })
                
            for e in emails:
                text = (e.get("body") or e.get("subject") or "").strip()
                if not text: continue
                sources.append({
                    "sourceId": e["id"],
                    "sourceType": "email",
                    "speaker": "Email",
                    "excerpt": text[:300],
                    "entityName": e.get("subject") or "Email"
                })
                
            # Add call itself as fallback source
            started_at_str = call.get("started_at") or "unknown date"
            dur_min = round(call.get("duration_seconds", 0) / 60) if call.get("duration_seconds") else 0
            sources.append({
                "sourceId": call["id"],
                "sourceType": "call",
                "speaker": "CRM",
                "excerpt": f"Call: \"{call.get('title') or 'Untitled'}\" on {started_at_str}, {dur_min} min.",
                "entityName": call.get("title") or "Call"
            })
            
            context = {
                "call": {
                    "title": call.get("title"),
                    "meeting_date": started_at_str,
                    "duration_min": dur_min,
                    "platform": "CRM"
                },
                "account": {
                    "account_name": account.get("name") if account else None,
                    "industry": account.get("industry") if account else None
                } if account else None,
                "participants": [{"name": c.get("name"), "role": c.get("role_title")} for c in contacts],
                "transcript_count": len(transcripts)
            }
            metadata = {
                "call_title": call.get("title"),
                "transcript_count": len(transcripts)
            }
            
        elif brief_type == "deal":
            deal_res = supabase.table("deals").select("*, accounts(id, name, industry)").eq("id", entity_id).single().execute()
            if not deal_res.data:
                raise HTTPException(status_code=404, detail=f"Deal not found: {entity_id}")
            deal = deal_res.data
            account = deal.get("accounts")
            account_id = account.get("id") if account else None
            
            calls = []
            emails = []
            activities = []
            notes = []
            
            if allowed_sources.get("calls"):
                calls_res = supabase.table("calls").select("id, title, started_at, duration_seconds").eq("deal_id", entity_id).limit(5).execute()
                calls = calls_res.data or []
            if allowed_sources.get("emails"):
                emails_res = supabase.table("emails").select("id, subject, body, sent_at").eq("deal_id", entity_id).limit(8).execute()
                emails = emails_res.data or []
            if allowed_sources.get("activities"):
                act_res = supabase.table("activities").select("id, activity_type, description, status, due_date").eq("deal_id", entity_id).limit(8).execute()
                activities = act_res.data or []
            if allowed_sources.get("notes"):
                notes_res = supabase.table("notes").select("id, note_text, created_by, created_at").eq("deal_id", entity_id).limit(5).execute()
                notes = notes_res.data or []
                
            for e in emails:
                text = (e.get("body") or e.get("subject") or "").strip()
                if not text: continue
                sources.append({ "sourceId": e["id"], "sourceType": "email", "speaker": "Email", "excerpt": text[:300], "entityName": e.get("subject") or "Email" })
            for a in activities:
                text = (a.get("description") or "").strip()
                if not text: continue
                sources.append({ "sourceId": a["id"], "sourceType": "activity", "speaker": a.get("activity_type") or "Activity", "excerpt": text[:300], "entityName": f"{a.get('activity_type')} — {a.get('status') or ''}" })
            for n in notes:
                text = (n.get("note_text") or "").strip()
                if not text: continue
                sources.append({ "sourceId": n["id"], "sourceType": "note", "speaker": n.get("created_by") or "Rep", "excerpt": text[:300], "entityName": "Note" })
            for c in calls:
                sources.append({ "sourceId": c["id"], "sourceType": "call", "speaker": "CRM", "excerpt": f"Call: \"{c.get('title') or 'Untitled'}\" on {c.get('started_at') or '?'}", "entityName": c.get("title") or "Call" })
                
            sources.append({
                "sourceId": deal["id"],
                "sourceType": "crm",
                "speaker": "CRM",
                "excerpt": f"Deal: \"{deal.get('name')}\", Stage: {deal.get('stage') or '?'}, Value: ${deal.get('amount') or '?'}, Close: {deal.get('close_date') or '?'}",
                "entityName": deal.get("name")
            })
            
            context = {
                "deal": {
                    "deal_name": deal.get("name"),
                    "stage": deal.get("stage"),
                    "value": float(deal.get("amount")) if deal.get("amount") is not None else None,
                    "risk_level": "Medium",
                    "status": deal.get("status"),
                    "close_date": deal.get("close_date")
                },
                "account": {
                    "account_name": account.get("name") if account else None,
                    "industry": account.get("industry") if account else None
                } if account else None,
                "call_count": len(calls),
                "email_count": len(emails)
            }
            metadata = {
                "deal_name": deal.get("name"),
                "stage": deal.get("stage"),
                "value": float(deal.get("amount")) if deal.get("amount") is not None else None
            }
            
        elif brief_type == "account":
            acc_res = supabase.table("accounts").select("*").eq("id", entity_id).single().execute()
            if not acc_res.data:
                raise HTTPException(status_code=404, detail=f"Account not found: {entity_id}")
            account = acc_res.data
            
            deals_res = supabase.table("deals").select("id, name, stage, amount, status, close_date").eq("account_id", entity_id).limit(10).execute()
            contacts_res = supabase.table("contacts").select("id, name, role_title").eq("account_id", entity_id).limit(10).execute()
            calls_res = supabase.table("calls").select("id, title, started_at, duration_seconds").eq("account_id", entity_id).limit(5).execute()
            emails_res = supabase.table("emails").select("id, subject, body, sent_at").eq("account_id", entity_id).limit(8).execute()
            notes_res = supabase.table("notes").select("id, note_text, created_by, created_at").eq("account_id", entity_id).limit(5).execute()
            act_res = supabase.table("activities").select("id, activity_type, description, status, due_date").eq("account_id", entity_id).limit(8).execute()
            
            deals = deals_res.data or []
            contacts = contacts_res.data or []
            calls = calls_res.data or []
            emails = emails_res.data or []
            notes = notes_res.data or []
            activities = act_res.data or []
            
            for e in emails:
                text = (e.get("body") or e.get("subject") or "").strip()
                if not text: continue
                sources.append({ "sourceId": e["id"], "sourceType": "email", "speaker": "Email", "excerpt": text[:300], "entityName": e.get("subject") or "Email" })
            for n in notes:
                text = (n.get("note_text") or "").strip()
                if not text: continue
                sources.append({ "sourceId": n["id"], "sourceType": "note", "speaker": n.get("created_by") or "Rep", "excerpt": text[:300], "entityName": "Note" })
            for a in activities:
                text = (a.get("description") or "").strip()
                if not text: continue
                sources.append({ "sourceId": a["id"], "sourceType": "activity", "speaker": a.get("activity_type") or "Activity", "excerpt": text[:300], "entityName": a.get("activity_type") })
            for c in calls:
                sources.append({ "sourceId": c["id"], "sourceType": "call", "speaker": "CRM", "excerpt": f"Call: \"{c.get('title') or 'Untitled'}\" on {c.get('started_at') or '?'}", "entityName": c.get("title") or "Call" })
                
            sources.append({
                "sourceId": account["id"],
                "sourceType": "crm",
                "speaker": "CRM",
                "excerpt": f"Account: \"{account.get('name')}\", Industry: {account.get('industry') or '?'}, Size: {account.get('segment') or '?'}",
                "entityName": account.get("name")
            })
            
            context = {
                "account": {
                    "account_name": account.get("name"),
                    "industry": account.get("industry"),
                    "company_size": account.get("segment") or "Mid-Market",
                    "relationship_status": "Active"
                },
                "deals": [{
                    "deal_name": d.get("name"),
                    "stage": d.get("stage"),
                    "value": float(d.get("amount")) if d.get("amount") is not None else None,
                    "status": d.get("status"),
                    "close_date": d.get("close_date")
                } for d in deals],
                "contacts": [{
                    "full_name": c.get("name"),
                    "role": c.get("role_title")
                } for c in contacts],
                "call_count": len(calls),
                "email_count": len(emails)
            }
            metadata = {
                "account_name": account.get("name"),
                "industry": account.get("industry")
            }
            
        elif brief_type == "contact":
            con_res = supabase.table("contacts").select("*, accounts(id, name, industry)").eq("id", entity_id).single().execute()
            if not con_res.data:
                raise HTTPException(status_code=404, detail=f"Contact not found: {entity_id}")
            contact = con_res.data
            account = contact.get("accounts")
            
            emails_res = supabase.table("emails").select("id, subject, body, sent_at").eq("sender_user_id", entity_id).limit(8).execute()
            notes_res = supabase.table("notes").select("id, note_text, created_by, created_at").eq("contact_id", entity_id).limit(5).execute()
            act_res = supabase.table("activities").select("id, activity_type, description, status, due_date").eq("contact_id", entity_id).limit(8).execute()
            
            emails = emails_res.data or []
            notes = notes_res.data or []
            activities = act_res.data or []
            
            for e in emails:
                text = (e.get("body") or e.get("subject") or "").strip()
                if not text: continue
                sources.append({ "sourceId": e["id"], "sourceType": "email", "speaker": contact.get("name") or "Contact", "excerpt": text[:300], "entityName": e.get("subject") or "Email" })
            for n in notes:
                text = (n.get("note_text") or "").strip()
                if not text: continue
                sources.append({ "sourceId": n["id"], "sourceType": "note", "speaker": n.get("created_by") or "Rep", "excerpt": text[:300], "entityName": "Note" })
            for a in activities:
                text = (a.get("description") or "").strip()
                if not text: continue
                sources.append({ "sourceId": a["id"], "sourceType": "activity", "speaker": a.get("activity_type") or "Activity", "excerpt": text[:300], "entityName": a.get("activity_type") })
                
            sources.append({
                "sourceId": contact["id"],
                "sourceType": "crm",
                "speaker": "CRM",
                "excerpt": f"Contact: \"{contact.get('name')}\", Role: {contact.get('role_title') or '?'}",
                "entityName": contact.get("name")
            })
            
            context = {
                "contact": {
                    "full_name": contact.get("name"),
                    "role": contact.get("role_title"),
                    "influence_level": "Medium",
                    "sentiment_score": 0.8
                },
                "account": {
                    "account_name": account.get("name") if account else None,
                    "industry": account.get("industry") if account else None
                } if account else None,
                "email_count": len(emails)
            }
            metadata = {
                "contact_name": contact.get("name"),
                "role": contact.get("role_title")
            }
            
        else:
            raise HTTPException(status_code=400, detail=f"Invalid brief type: {brief_type}")
            
        if active_sections:
            instruction_blocks = []
            for i, s in enumerate(active_sections):
                sources_list = ", ".join([k for k, v in s.get("data_sources", {}).items() if v])
                block = f"[SECTION {i + 1}]: {s.get('section_name')}\nQuestion: {s.get('ai_question')}\nInstructions: {s.get('instructions') or 'N/A'}\nAllowed Sources: {sources_list}"
                instruction_blocks.append(block)
            instructions = "\n\n".join(instruction_blocks)
        else:
            if brief_type == "call":
                instructions = """
- Executive Summary (2-3 sentences overview of the call)
- Key Pain Points & Objections (cite transcript quotes)
- Pricing & Commercial Terms (financial numbers and terms discussed)
- Action Items & Next Steps (owners and tasks established)
                """
            elif brief_type == "deal":
                instructions = """
- Deal Health & Stage (current status)
- Competitors & Blockers (risks and challenges)
- Closing Roadmap (roadmap to WON)
                """
            elif brief_type == "account":
                instructions = """
- Account Relationship Status (summary)
- Strategic Priorities (strategic insights)
- Relationship Health & Risk Indicators (health rating)
                """
            else:
                instructions = """
- Professional Profile (role and decision power)
- Engagement & Verbatim Insights (insights)
                """
                
        generated_summary = await brief_rag_service.generate_brief_rag(
            brief_type=brief_type.capitalize(),
            context_data=context,
            instructions=instructions,
            sources=sources
        )
        
        existing_brief = supabase.table("ai_briefs").select("id").eq("brief_type", brief_type).eq("entity_id", entity_id).execute()
        
        brief_data = {
            "org_id": "a0000000-0000-0000-0000-000000000001",
            "brief_type": brief_type,
            "entity_id": entity_id,
            "generated_summary": generated_summary,
            "source_references": [s["sourceId"] for s in sources],
            "llm_model": "llama-3.3-70b-versatile",
            "generation_status": "completed",
            "updated_at": datetime.utcnow().isoformat()
        }
        
        if existing_brief.data:
            save_res = supabase.table("ai_briefs").update(brief_data).eq("id", existing_brief.data[0]["id"]).execute()
        else:
            brief_data["created_at"] = datetime.utcnow().isoformat()
            save_res = supabase.table("ai_briefs").insert(brief_data).execute()
            
        hist_res = supabase.table("brief_history").select("version_number").eq("entity_id", entity_id).eq("brief_type", brief_type).order("version_number", desc=True).limit(1).execute()
        next_ver = (hist_res.data[0]["version_number"] if hist_res.data else 0) + 1
        
        supabase.table("brief_history").insert({
            "org_id": "a0000000-0000-0000-0000-000000000001",
            "entity_type": brief_type,
            "entity_id": entity_id,
            "brief_type": brief_type,
            "version_number": next_ver,
            "generated_summary": generated_summary,
            "source_ids": [s["sourceId"] for s in sources],
            "model_used": "llama-3.3-70b-versatile",
            "prompt_version": "2.0",
            "generated_by": "system",
            "metadata": metadata
        }).execute()
        
        if not save_res.data:
            return {"success": True, "data": generated_summary, "saved": False}
            
        return {"success": True, "data": save_res.data[0]}
        
    except Exception as e:
        print(f"[brief-gen] Error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================
# Run
# ============================================================
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=os.getenv("FASTAPI_HOST", "0.0.0.0"),
        port=int(os.getenv("FASTAPI_PORT", "8000")),
        reload=True
    )
