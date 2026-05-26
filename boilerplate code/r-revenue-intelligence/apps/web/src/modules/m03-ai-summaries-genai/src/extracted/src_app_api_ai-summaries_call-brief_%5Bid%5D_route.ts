import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/supabase/server";
import { generateBriefRAG, type SourceRecord } from "@/ai/rag.service";
import { saveToHistory } from "@/services/history.service";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: callId } = await params;
  console.log("[call-brief] callId:", callId, "| GROQ key:", !!process.env.GROQ_API_KEY);

  try {
    const supabase = getSupabaseServerClient();

    // 1. Fetch active template for 'call'
    const { data: templateData } = await supabase
      .from("brief_templates")
      .select("*, sections:brief_template_sections(*)")
      .eq("entity_type", "call")
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
      transcripts: activeSections.some((s: any) => s.data_sources?.transcripts || s.data_sources?.calls),
    };

    // 2. Fetch call
    const { data: callRaw, error: callErr } = await supabase
      .from("calls")
      .select("id, title, meeting_date, duration, source_platform, account_id, deal_id")
      .eq("id", callId)
      .single();

    if (callErr || !callRaw) {
      return NextResponse.json({ success: false, error: `Call not found: ${callErr?.message}` }, { status: 404 });
    }
    const call = callRaw as any;

    // 3. Conditionally Fetch Transcripts
    let transcripts: any[] = [];
    if (allowedSources.transcripts) {
      const { data } = await supabase
        .from("transcripts")
        .select("id, transcript_text, speaker, timestamp_ms, sentiment")
        .eq("call_id", callId)
        .order("timestamp_ms", { ascending: true })
        .limit(20);
      transcripts = (data ?? []) as any[];
    }

    // 4. Fetch account (always for context)
    let account: any = null;
    if (call.account_id) {
      const { data } = await supabase
        .from("accounts")
        .select("id, account_name, industry, relationship_status")
        .eq("id", call.account_id)
        .single();
      account = data as any;
    }

    // 5. Fetch contacts (always for context)
    let contacts: any[] = [];
    if (call.account_id) {
      const { data } = await supabase
        .from("contacts")
        .select("id, full_name, role, influence_level, sentiment_score")
        .eq("account_id", call.account_id)
        .limit(5);
      contacts = (data ?? []) as any[];
    }

    // 6. Conditionally Fetch Emails
    let emails: any[] = [];
    if (allowedSources.emails && call.account_id) {
      const { data } = await supabase
        .from("emails")
        .select("id, subject, body, sentiment, sent_at")
        .eq("account_id", call.account_id)
        .limit(5);
      emails = (data ?? []) as any[];
    }

    console.log("[call-brief] transcripts:", transcripts.length, "| emails:", emails.length);

    // 7. Build source registry
    const sources: SourceRecord[] = [];

    for (const t of transcripts) {
      if (!t.transcript_text?.trim()) continue;
      sources.push({
        sourceId:     t.id,
        sourceType:   "transcript",
        speaker:      t.speaker ?? "Unknown Speaker",
        excerpt:      t.transcript_text.slice(0, 400),
        timestamp_ms: t.timestamp_ms ?? undefined,
        entityName:   call.title ?? "Call",
      });
    }

    for (const e of emails) {
      const text = (e.body ?? e.subject ?? "").trim();
      if (!text) continue;
      sources.push({
        sourceId:   e.id,
        sourceType: "email",
        speaker:    "Email",
        excerpt:    text.slice(0, 300),
        entityName: e.subject ?? "Email",
      });
    }

    // CRM call record as fallback source
    sources.push({
      sourceId:   call.id,
      sourceType: "call",
      speaker:    "CRM",
      excerpt:    `Call: "${call.title ?? "Untitled"}" on ${call.meeting_date ?? "unknown date"}, ${call.duration ?? "?"} min via ${call.source_platform ?? "unknown platform"}.`,
      entityName: call.title ?? "Call",
    });

    // 8. Context for LLM
    const context = {
      call: {
        title:        call.title,
        meeting_date: call.meeting_date,
        duration_min: call.duration,
        platform:     call.source_platform,
      },
      account,
      participants:     contacts.map((c: any) => ({ name: c.full_name, role: c.role })),
      transcript_count: transcripts.length,
    };

    // 9. Generate dynamic instructions
    let instructions = activeSections.length > 0
      ? activeSections.map((s: any, i: number) => 
          `[SECTION ${i + 1}]: ${s.section_name}\nQuestion: ${s.ai_question}\nInstructions: ${s.instructions || 'N/A'}\nAllowed Sources: ${Object.keys(s.data_sources || {}).filter(k => s.data_sources[k]).join(', ')}`
        ).join("\n\n")
      : `
- Key Discussion Points (cite transcript excerpts)
- Objections Raised (cite exact quotes)
- Pricing Discussions (cite any pricing mentions)
- Competitor Mentions (cite exact quotes)
- Next Steps & Action Items (cite commitments made)
- Sentiment Analysis (cite evidence)`;

    const generatedSummary = await generateBriefRAG("Call", context, instructions, sources);

    // 9. Persist to ai_briefs + history
    const [savedResult] = await Promise.all([
      supabase
        .from("ai_briefs")
        .insert({
          brief_type:        "call",
          entity_id:         callId,
          generated_summary: generatedSummary as any,
          source_references: sources.map(s => s.sourceId) as any,
          llm_model:         "llama-3.3-70b-versatile",
          generation_status: "completed",
        } as any)
        .select()
        .single(),
      saveToHistory({
        supabase,
        entityType: "call",
        entityId:   callId,
        generatedSummary,
        sourceIds:  sources.map(s => s.sourceId),
        metadata:   { call_title: call.title, transcript_count: transcripts.length },
      }),
    ]);

    const { data: saved, error: saveErr } = savedResult;

    if (saveErr) {
      console.error("[call-brief] Save error:", saveErr.message);
      return NextResponse.json({ success: true, data: generatedSummary, saved: false });
    }

    return NextResponse.json({ success: true, data: saved });

  } catch (err: any) {
    console.error("[call-brief] Error:", err?.message);
    return NextResponse.json(
      { success: false, error: err?.message ?? String(err), ...(process.env.NODE_ENV === "development" && { stack: err?.stack }) },
      { status: 500 }
    );
  }
}
