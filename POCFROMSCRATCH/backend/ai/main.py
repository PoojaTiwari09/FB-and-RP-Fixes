"""
Revenue Intelligence Dashboard — FastAPI AI Service
====================================================
Endpoints:
  POST /ai/summary  — Generate structured account brief using Groq
  POST /ai/chat     — Conversational Q&A about an account
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List
import os
import json
import httpx
from datetime import datetime, timedelta
from supabase import create_client, Client
from dotenv import load_dotenv

# Load env from project root
from pathlib import Path
env_path = Path(__file__).parent.parent.parent / ".env.local"
load_dotenv(env_path)

app = FastAPI(
    title="Revenue Intelligence AI Service",
    description="Groq-powered account briefs and Q&A",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001"],
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
    allow_credentials=True,
)

# ── Clients ────────────────────────────────────────────────────────────
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_MODEL = "llama-3.3-70b-versatile"
GROQ_BASE_URL = "https://api.groq.com/openai/v1/chat/completions"

SUPABASE_URL = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


# ── Request/Response Models ────────────────────────────────────────────
class SummaryRequest(BaseModel):
    company_hubspot_id: str
    scope: str = "entire_account"       # entire_account | deals_only
    period_days: int = 90               # 90 | 180 | 0 (all time)
    force_refresh: bool = False
    brief_type: str = "full"   # NEW: full | summary | risk_only


class ChatRequest(BaseModel):
    company_hubspot_id: str
    message: str
    conversation_history: Optional[List[dict]] = []


# ── Context Builder ────────────────────────────────────────────────────
def build_context(company_hubspot_id: str, scope: str, period_days: int) -> dict:
    """Pull account context from Supabase for Groq prompt."""

    # Company
    company_res = supabase.table("crm_companies") \
        .select("*") \
        .eq("hubspot_id", company_hubspot_id) \
        .single() \
        .execute()
    company = company_res.data

    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    # Contacts
    contacts_res = supabase.table("crm_contacts") \
        .select("first_name, last_name, job_title, is_primary") \
        .eq("company_hubspot_id", company_hubspot_id) \
        .execute()
    contacts = contacts_res.data or []

    # Deals
    deals_res = supabase.table("crm_deals") \
        .select("name, stage, amount, adjusted_amount, deal_type, close_date") \
        .eq("company_hubspot_id", company_hubspot_id) \
        .execute()
    all_deals = deals_res.data or []

    open_deals = [d for d in all_deals if d["stage"] not in ("Closed Won", "Closed Lost")]
    closed_deals = [d for d in all_deals if d["stage"] in ("Closed Won", "Closed Lost")]

    # Activities (filter by period)
    activities_query = supabase.table("crm_activities") \
        .select("type, direction, timestamp, body, rep_talk_pct, client_talk_pct, call_outcome, subject, title, duration_seconds") \
        .eq("company_hubspot_id", company_hubspot_id) \
        .order("timestamp", desc=True)

    if period_days > 0:
        cutoff = (datetime.utcnow() - timedelta(days=period_days)).isoformat()
        activities_query = activities_query.gte("timestamp", cutoff)

    activities_res = activities_query.limit(50).execute()
    activities = activities_res.data or []

    # Supplementary
    supp_res = supabase.table("supplementary_accounts") \
        .select("manager_note, ai_risk_score, risk_label, next_qbr_date, strategic_priority") \
        .eq("company_hubspot_id", company_hubspot_id) \
        .single() \
        .execute()
    supp = supp_res.data or {}

    return {
        "company": company,
        "contacts": contacts,
        "open_deals": open_deals if scope != "deals_only" else all_deals,
        "closed_deals": [] if scope == "deals_only" else closed_deals,
        "activities": activities,
        "supplementary": supp,
        "scope": scope,
        "period_days": period_days,
    }


def format_context_for_prompt(ctx: dict) -> str:
    """Format context dict into a readable prompt string."""
    c = ctx["company"]
    lines = [
        f"ACCOUNT: {c.get('name', 'Unknown')}",
        f"Industry: {c.get('industry', 'N/A')} | Segment: {c.get('segment', 'N/A')} | Type: {c.get('type', 'N/A')}",
        f"Exit ARR: ${c.get('exit_arr', 0):,.0f} | Employees: {c.get('employee_count', 'N/A')}",
        f"AI Risk Score: {ctx['supplementary'].get('ai_risk_score', 0)} ({ctx['supplementary'].get('risk_label', 'N/A')})",
        "",
        "CONTACTS:",
    ]
    for contact in ctx["contacts"][:5]:
        primary = "(Primary)" if contact.get("is_primary") else ""
        lines.append(f"  - {contact.get('first_name', '')} {contact.get('last_name', '')} — {contact.get('job_title', 'N/A')} {primary}")

    lines.append("")
    lines.append(f"OPEN DEALS ({len(ctx['open_deals'])}):")
    for deal in ctx['open_deals'][:5]:
        lines.append(f"  - {deal.get('name', 'N/A')} | Stage: {deal.get('stage', 'N/A')} | ${deal.get('amount', 0):,.0f} | Close: {deal.get('close_date', 'N/A')}")

    lines.append("")
    period_label = f"Last {ctx['period_days']} days" if ctx["period_days"] > 0 else "All time"
    lines.append(f"ACTIVITIES ({len(ctx['activities'])} in {period_label}):")
    for act in ctx["activities"][:15]:
        ts = act.get("timestamp", "")[:10]
        act_type = act.get("type", "")
        direction = act.get("direction", "")
        body = (act.get("body") or act.get("subject") or "")[:200]
        detail = ""
        if act_type == "CALL":
            rep_pct = act.get("rep_talk_pct")
            client_pct = act.get("client_talk_pct")
            outcome = act.get("call_outcome", "")
            if rep_pct:
                detail = f" | Rep {rep_pct}% / Client {client_pct}% | Outcome: {outcome}"
        lines.append(f"  [{ts}] {act_type} ({direction}){detail}: {body}")

    manager_note = ctx["supplementary"].get("manager_note", "")
    if manager_note:
        lines.append("")
        lines.append(f"MANAGER NOTE: {manager_note}")

    return "\n".join(lines)


def extract_citations(reply: str, activities: list) -> list:
    """Cross-reference reply text with activity list to extract citations."""
    citations = []
    seen_dates = set()
    for act in activities[:30]:
        ts = (act.get("timestamp") or "")[:10]   # YYYY-MM-DD
        if not ts or ts in seen_dates:
            continue
        subject = act.get("subject") or act.get("title") or ""
        if ts in reply or (subject and subject in reply):
            seen_dates.add(ts)
            citations.append({
                "type": act.get("type", ""),
                "date": ts,
                "summary": (act.get("body") or subject or "")[:120],
            })
        if len(citations) >= 5:
            break
    return citations


# ── Groq Client ────────────────────────────────────────────────────────
async def call_groq(messages: list) -> str:
    """Call Groq API with the given messages list."""
    if not GROQ_API_KEY:
        return "AI service not configured. Please set GROQ_API_KEY in .env.local."

    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            GROQ_BASE_URL,
            headers={
                "Authorization": f"Bearer {GROQ_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": GROQ_MODEL,
                "messages": messages,
                "max_tokens": 1024,
                "temperature": 0.3,
            },
        )
        response.raise_for_status()
        data = response.json()
        return data["choices"][0]["message"]["content"]


SUMMARY_SYSTEM_PROMPT = """You are a Revenue Intelligence analyst for a B2B SaaS company.
Given account context data, produce a structured JSON brief.

Respond ONLY with valid JSON in this exact schema:
{
  "status": "At Risk | Healthy | Needs Attention",
  "key_risks": ["risk 1", "risk 2"],
  "recommended_steps": ["step 1", "step 2", "step 3"],
  "citations": [
    {"activity_id": "act_01", "type": "CALL", "date": "2025-01-15", "summary": "Rep talked 70%, client engagement was low"}
  ],
  "insufficient_data": false
}

Rules:
- Be concise and data-driven. Every risk must cite a specific activity or data point.
- If there are fewer than 3 activities total, set insufficient_data to true.
- Limit key_risks to 3 items maximum.
- Limit recommended_steps to 3 items maximum.
- Status must be one of: At Risk, Healthy, Needs Attention."""

BRIEF_TYPE_INSTRUCTIONS = {
    "full":      "Generate a comprehensive brief covering status, all risks, and all recommended steps.",
    "summary":   "Generate a concise 2-3 sentence executive summary with the top 1-2 risks only.",
    "risk_only": "Focus exclusively on risks and required actions. Omit any positive framing.",
}


# ── Cache Helpers ────────────────────────────────────────────────────────
def get_cached_brief(company_hubspot_id: str, scope: str, period_days: int) -> Optional[dict]:
    """Check ai_briefs_cache for a recent brief (< 24 hours old)."""
    try:
        res = supabase.table("ai_briefs_cache") \
            .select("brief_json, generated_at") \
            .eq("company_hubspot_id", company_hubspot_id) \
            .eq("scope", scope) \
            .eq("period_days", period_days) \
            .single() \
            .execute()
        if res.data:
            generated_at = datetime.fromisoformat(res.data["generated_at"].replace("Z", "+00:00"))
            if datetime.utcnow().replace(tzinfo=generated_at.tzinfo) - generated_at < timedelta(hours=24):
                return res.data["brief_json"]
    except Exception:
        pass
    return None


def save_brief_cache(company_hubspot_id: str, scope: str, period_days: int, brief: dict):
    """Upsert brief into ai_briefs_cache."""
    try:
        supabase.table("ai_briefs_cache").upsert({
            "company_hubspot_id": company_hubspot_id,
            "scope": scope,
            "period_days": period_days,
            "brief_json": brief,
            "generated_at": datetime.utcnow().isoformat(),
        }, on_conflict="company_hubspot_id,scope,period_days").execute()
    except Exception as e:
        print(f"Cache save error: {e}")


# ── Endpoints ──────────────────────────────────────────────────────────
@app.get("/health")
def health():
    return {"status": "ok", "service": "revenue-intelligence-ai"}


@app.post("/ai/summary")
async def generate_summary(req: SummaryRequest):
    """Generate an AI summary brief using Groq."""
    cache_scope = f"{req.scope}:{req.brief_type}"
    if not req.force_refresh:
        cached = get_cached_brief(req.company_hubspot_id, cache_scope, req.period_days)
        if cached:
            return {
                "brief": cached,
                "generated_at": datetime.utcnow().isoformat(),
                "cached": True,
                "insufficient_data": cached.get("insufficient_data", False),
            }

    # Build context
    ctx = build_context(req.company_hubspot_id, req.scope, req.period_days)
    context_text = format_context_for_prompt(ctx)

    type_instruction = BRIEF_TYPE_INSTRUCTIONS.get(req.brief_type, BRIEF_TYPE_INSTRUCTIONS["full"])
    dynamic_system_prompt = SUMMARY_SYSTEM_PROMPT + f"\n\nBRIEF TYPE: {type_instruction}"

    messages = [
        {"role": "system", "content": dynamic_system_prompt},
        {"role": "user", "content": f"Generate a revenue intelligence brief for this account:\n\n{context_text}"},
    ]

    raw = await call_groq(messages)

    # Parse JSON response
    try:
        # Strip markdown code fences if present
        cleaned = raw.strip().strip("```json").strip("```").strip()
        brief = json.loads(cleaned)
    except json.JSONDecodeError:
        brief = {
            "status": "Needs Attention",
            "key_risks": ["Unable to parse AI response"],
            "recommended_steps": ["Review account manually"],
            "citations": [],
            "insufficient_data": len(ctx["activities"]) < 3,
        }

    # Save to cache
    save_brief_cache(req.company_hubspot_id, cache_scope, req.period_days, brief)

    return {
        "brief": brief,
        "generated_at": datetime.utcnow().isoformat(),
        "cached": False,
        "insufficient_data": brief.get("insufficient_data", False),
    }


CHAT_SYSTEM_PROMPT = """You are a Revenue Intelligence analyst assistant for a B2B SaaS sales team.
You have deep knowledge of the account provided. Answer questions concisely and accurately,
citing specific activities, deals, or data points from the context.
Be direct and actionable — you are talking to a sales rep or manager.
If you don't have enough data to answer confidently, say so clearly."""


@app.post("/ai/chat")
async def chat(req: ChatRequest):
    """Conversational Q&A about an account."""

    # Build context
    ctx = build_context(req.company_hubspot_id, "entire_account", 0)
    context_text = format_context_for_prompt(ctx)

    messages = [
        {"role": "system", "content": f"{CHAT_SYSTEM_PROMPT}\n\nACCOUNT CONTEXT:\n{context_text}"},
    ]

    # Add conversation history (last 6 turns)
    for turn in (req.conversation_history or [])[-6:]:
        messages.append(turn)

    messages.append({"role": "user", "content": req.message})

    reply = await call_groq(messages)

    insufficient_data = len(ctx["activities"]) < 3

    citations = extract_citations(reply, ctx["activities"])
    return {
        "reply": reply,
        "citations": citations,
        "insufficient_data": insufficient_data,
    }
