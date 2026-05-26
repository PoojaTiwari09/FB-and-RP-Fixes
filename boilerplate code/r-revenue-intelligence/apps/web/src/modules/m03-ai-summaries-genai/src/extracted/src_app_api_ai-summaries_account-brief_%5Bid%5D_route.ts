import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/supabase/server";
import { generateBriefRAG, type SourceRecord } from "@/ai/rag.service";
import { saveToHistory } from "@/services/history.service";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: accountId } = await params;
  console.log("[account-brief] accountId:", accountId);

  try {
    const supabase = getSupabaseServerClient();

    const { data: accountRaw, error: accErr } = await supabase
      .from("accounts")
      .select("*")
      .eq("id", accountId)
      .single();

    if (accErr || !accountRaw) {
      return NextResponse.json({ success: false, error: `Account not found: ${accErr?.message}` }, { status: 404 });
    }
    const account = accountRaw as any;

    const [dealsRes, contactsRes, callsRes, emailsRes, notesRes, activitiesRes] = await Promise.all([
      supabase.from("deals").select("id, deal_name, stage, value, risk_level, status, close_date").eq("account_id", accountId).limit(10),
      supabase.from("contacts").select("id, full_name, role, influence_level, sentiment_score").eq("account_id", accountId).limit(10),
      supabase.from("calls").select("id, title, meeting_date, duration, source_platform").eq("account_id", accountId).limit(5),
      supabase.from("emails").select("id, subject, body, sentiment, sent_at").eq("account_id", accountId).limit(8),
      supabase.from("notes").select("id, note_text, created_by, created_at").eq("account_id", accountId).limit(5),
      supabase.from("activities").select("id, activity_type, description, status, due_date").eq("account_id", accountId).limit(8),
    ]);

    const deals      = (dealsRes.data      ?? []) as any[];
    const contacts   = (contactsRes.data   ?? []) as any[];
    const calls      = (callsRes.data      ?? []) as any[];
    const emails     = (emailsRes.data     ?? []) as any[];
    const notes      = (notesRes.data      ?? []) as any[];
    const activities = (activitiesRes.data ?? []) as any[];

    const sources: SourceRecord[] = [];

    for (const e of emails) {
      const text = (e.body ?? e.subject ?? "").trim();
      if (!text) continue;
      sources.push({ sourceId: e.id, sourceType: "email", speaker: "Email", excerpt: text.slice(0, 300), entityName: e.subject ?? "Email" });
    }
    for (const n of notes) {
      if (!n.note_text?.trim()) continue;
      sources.push({ sourceId: n.id, sourceType: "note", speaker: n.created_by ?? "Rep", excerpt: n.note_text.slice(0, 300), entityName: "Note" });
    }
    for (const a of activities) {
      if (!a.description?.trim()) continue;
      sources.push({ sourceId: a.id, sourceType: "activity", speaker: a.activity_type, excerpt: a.description.slice(0, 300), entityName: a.activity_type });
    }
    for (const c of calls) {
      sources.push({ sourceId: c.id, sourceType: "call", speaker: "CRM", excerpt: `Call: "${c.title ?? "Untitled"}" on ${c.meeting_date ?? "?"}`, entityName: c.title ?? "Call" });
    }
    sources.push({
      sourceId:   account.id,
      sourceType: "crm",
      speaker:    "CRM",
      excerpt:    `Account: "${account.account_name}", Industry: ${account.industry ?? "?"}, Size: ${account.company_size ?? "?"}, Status: ${account.relationship_status ?? "?"}`,
      entityName: account.account_name,
    });

    const context = { account, deals, contacts, call_count: calls.length, email_count: emails.length };

    const instructions = `
- Account Relationship Status (cite CRM data)
- Strategic Priorities (cite notes/emails)
- Open Risks (cite evidence)
- Active Deals Summary
- Stakeholder Mapping (cite contacts)
- Engagement Trends (cite activity patterns)
- Communication Health
- Expansion Opportunities`;

    const generatedSummary = await generateBriefRAG("Account", context, instructions, sources);

    const [savedResult] = await Promise.all([
      supabase
        .from("ai_briefs")
        .insert({ brief_type: "account", entity_id: accountId, generated_summary: generatedSummary as any, source_references: sources.map(s => s.sourceId) as any, llm_model: "llama-3.3-70b-versatile", generation_status: "completed" } as any)
        .select().single(),
      saveToHistory({
        supabase, entityType: "account", entityId: accountId,
        generatedSummary, sourceIds: sources.map(s => s.sourceId),
        metadata: { account_name: account.account_name, industry: account.industry },
      }),
    ]);

    const { data: saved, error: saveErr } = savedResult;
    if (saveErr) return NextResponse.json({ success: true, data: generatedSummary, saved: false });
    return NextResponse.json({ success: true, data: saved });

  } catch (err: any) {
    console.error("[account-brief] Error:", err?.message);
    return NextResponse.json({ success: false, error: err?.message ?? String(err) }, { status: 500 });
  }
}
