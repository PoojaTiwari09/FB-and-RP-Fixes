import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/supabase/server";
import { generateBriefRAG, type SourceRecord } from "@/ai/rag.service";
import { saveToHistory } from "@/services/history.service";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: dealId } = await params;
  console.log("[deal-brief] dealId:", dealId);

  try {
    const supabase = getSupabaseServerClient();

    // 1. Fetch active template for 'deal'
    const { data: templateData } = await supabase
      .from("brief_templates")
      .select("*, sections:brief_template_sections(*)")
      .eq("entity_type", "deal")
      .eq("is_active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    const template = templateData || { sections: [] };
    const sections = Array.isArray(template.sections) 
      ? template.sections.sort((a: any, b: any) => a.section_order - b.section_order) 
      : [];
    const activeSections = sections.filter((s: any) => s.enabled);

    // Collect global allowed data sources from sections
    const allowedSources = {
      calls: activeSections.some((s: any) => s.data_sources?.calls),
      emails: activeSections.some((s: any) => s.data_sources?.emails),
      activities: activeSections.some((s: any) => s.data_sources?.activities),
      notes: activeSections.some((s: any) => s.data_sources?.notes),
    };

    const { data: dealRaw, error: dealErr } = await supabase
      .from("deals")
      .select("*, accounts(id, account_name, industry, relationship_status)")
      .eq("id", dealId)
      .single();

    if (dealErr || !dealRaw) {
      return NextResponse.json({ success: false, error: `Deal not found: ${dealErr?.message}` }, { status: 404 });
    }
    const deal = dealRaw as any;

    const [callsRes, emailsRes, activitiesRes, notesRes] = await Promise.all([
      allowedSources.calls ? supabase.from("calls").select("id, title, meeting_date, duration, source_platform").eq("deal_id", dealId).limit(5) : Promise.resolve({ data: [] }),
      allowedSources.emails ? supabase.from("emails").select("id, subject, body, sentiment, sent_at").eq("deal_id", dealId).limit(8) : Promise.resolve({ data: [] }),
      allowedSources.activities ? supabase.from("activities").select("id, activity_type, description, status, due_date").eq("deal_id", dealId).limit(8) : Promise.resolve({ data: [] }),
      allowedSources.notes ? supabase.from("notes").select("id, note_text, created_by, created_at").eq("deal_id", dealId).limit(5) : Promise.resolve({ data: [] }),
    ]);

    const calls      = (callsRes.data      ?? []) as any[];
    const emails     = (emailsRes.data     ?? []) as any[];
    const activities = (activitiesRes.data ?? []) as any[];
    const notes      = (notesRes.data      ?? []) as any[];

    const sources: SourceRecord[] = [];

    for (const e of emails) {
      const text = (e.body ?? e.subject ?? "").trim();
      if (!text) continue;
      sources.push({ sourceId: e.id, sourceType: "email", speaker: "Email", excerpt: text.slice(0, 300), entityName: e.subject ?? "Email" });
    }
    for (const a of activities) {
      if (!a.description?.trim()) continue;
      sources.push({ sourceId: a.id, sourceType: "activity", speaker: a.activity_type, excerpt: a.description.slice(0, 300), entityName: `${a.activity_type} — ${a.status ?? ""}` });
    }
    for (const n of notes) {
      if (!n.note_text?.trim()) continue;
      sources.push({ sourceId: n.id, sourceType: "note", speaker: n.created_by ?? "Rep", excerpt: n.note_text.slice(0, 300), entityName: "Note" });
    }
    for (const c of calls) {
      sources.push({ sourceId: c.id, sourceType: "call", speaker: "CRM", excerpt: `Call: "${c.title ?? "Untitled"}" on ${c.meeting_date ?? "?"}`, entityName: c.title ?? "Call" });
    }
    sources.push({
      sourceId:   deal.id,
      sourceType: "crm",
      speaker:    "CRM",
      excerpt:    `Deal: "${deal.deal_name}", Stage: ${deal.stage ?? "?"}, Value: $${deal.value ?? "?"}, Risk: ${deal.risk_level ?? "?"}, Close: ${deal.close_date ?? "?"}`,
      entityName: deal.deal_name,
    });

    const context = {
      deal: { deal_name: deal.deal_name, stage: deal.stage, value: deal.value, risk_level: deal.risk_level, status: deal.status, next_step: deal.next_step, close_date: deal.close_date },
      account:     deal.accounts,
      call_count:  calls.length,
      email_count: emails.length,
    };

    let instructions = activeSections.length > 0
      ? activeSections.map((s: any, i: number) => 
          `[SECTION ${i + 1}]: ${s.section_name}\nQuestion: ${s.ai_question}\nInstructions: ${s.instructions || 'N/A'}\nAllowed Sources: ${Object.keys(s.data_sources || {}).filter(k => s.data_sources[k]).join(', ')}`
        ).join("\n\n")
      : `
- Deal Health & Stage
- Deal Value & Timeline
- Champion & Key Stakeholders
- Risks & Blockers (cite evidence)
- Buying Signals (cite evidence)
- Objections (cite exact quotes)
- Next Steps (cite commitments)
- Engagement Summary`;

    const generatedSummary = await generateBriefRAG("Deal", context, instructions, sources);

    const [savedResult] = await Promise.all([
      supabase
        .from("ai_briefs")
        .insert({ brief_type: "deal", entity_id: dealId, generated_summary: generatedSummary as any, source_references: sources.map(s => s.sourceId) as any, llm_model: "llama-3.3-70b-versatile", generation_status: "completed" } as any)
        .select().single(),
      saveToHistory({
        supabase, entityType: "deal", entityId: dealId,
        generatedSummary, sourceIds: sources.map(s => s.sourceId),
        metadata: { deal_name: deal.deal_name, stage: deal.stage, value: deal.value },
      }),
    ]);

    const { data: saved, error: saveErr } = savedResult;
    if (saveErr) return NextResponse.json({ success: true, data: generatedSummary, saved: false });
    return NextResponse.json({ success: true, data: saved });

  } catch (err: any) {
    console.error("[deal-brief] Error:", err?.message);
    return NextResponse.json({ success: false, error: err?.message ?? String(err) }, { status: 500 });
  }
}
