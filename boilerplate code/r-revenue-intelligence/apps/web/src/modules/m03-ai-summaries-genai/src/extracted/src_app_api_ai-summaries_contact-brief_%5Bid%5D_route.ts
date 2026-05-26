import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/supabase/server";
import { generateBriefRAG, type SourceRecord } from "@/ai/rag.service";
import { saveToHistory } from "@/services/history.service";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: contactId } = await params;
  console.log("[contact-brief] contactId:", contactId);

  try {
    const supabase = getSupabaseServerClient();

    const { data: contactRaw, error: contErr } = await supabase
      .from("contacts")
      .select("*, accounts(account_name, industry)")
      .eq("id", contactId)
      .single();

    if (contErr || !contactRaw) {
      return NextResponse.json({ success: false, error: `Contact not found: ${contErr?.message}` }, { status: 404 });
    }
    const contact = contactRaw as any;

    const [emailsRes, notesRes, activitiesRes] = await Promise.all([
      supabase.from("emails").select("id, subject, body, sentiment, sent_at").eq("contact_id", contactId).limit(8),
      supabase.from("notes").select("id, note_text, created_by, created_at").eq("contact_id", contactId).limit(5),
      supabase.from("activities").select("id, activity_type, description, status, due_date").eq("contact_id", contactId).limit(8),
    ]);

    const emails     = (emailsRes.data     ?? []) as any[];
    const notes      = (notesRes.data      ?? []) as any[];
    const activities = (activitiesRes.data ?? []) as any[];

    const sources: SourceRecord[] = [];

    for (const e of emails) {
      const text = (e.body ?? e.subject ?? "").trim();
      if (!text) continue;
      sources.push({ sourceId: e.id, sourceType: "email", speaker: contact.full_name, excerpt: text.slice(0, 300), entityName: e.subject ?? "Email" });
    }
    for (const n of notes) {
      if (!n.note_text?.trim()) continue;
      sources.push({ sourceId: n.id, sourceType: "note", speaker: n.created_by ?? "Rep", excerpt: n.note_text.slice(0, 300), entityName: "Note" });
    }
    for (const a of activities) {
      if (!a.description?.trim()) continue;
      sources.push({ sourceId: a.id, sourceType: "activity", speaker: a.activity_type, excerpt: a.description.slice(0, 300), entityName: a.activity_type });
    }
    sources.push({
      sourceId:   contact.id,
      sourceType: "crm",
      speaker:    "CRM",
      excerpt:    `Contact: "${contact.full_name}", Role: ${contact.role ?? "?"}, Influence: ${contact.influence_level ?? "?"}, Sentiment: ${contact.sentiment_score ?? "?"}`,
      entityName: contact.full_name,
    });

    const context = {
      contact: { full_name: contact.full_name, role: contact.role, influence_level: contact.influence_level, sentiment_score: contact.sentiment_score },
      account: contact.accounts,
      email_count: emails.length,
    };

    const instructions = `
- Personality & Communication Style (cite emails/notes)
- Key Concerns & Objections (cite exact quotes)
- Priorities & Goals
- Influence Level & Decision Power (cite CRM)
- Commitments Made (cite activities)
- Sentiment Trends (cite evidence)
- Relationship Strength
- Recommended Engagement Approach`;

    const generatedSummary = await generateBriefRAG("Contact", context, instructions, sources);

    const [savedResult] = await Promise.all([
      supabase
        .from("ai_briefs")
        .insert({ brief_type: "contact", entity_id: contactId, generated_summary: generatedSummary as any, source_references: sources.map(s => s.sourceId) as any, llm_model: "llama-3.3-70b-versatile", generation_status: "completed" } as any)
        .select().single(),
      saveToHistory({
        supabase, entityType: "contact", entityId: contactId,
        generatedSummary, sourceIds: sources.map(s => s.sourceId),
        metadata: { contact_name: contact.full_name, role: contact.role },
      }),
    ]);

    const { data: saved, error: saveErr } = savedResult;
    if (saveErr) return NextResponse.json({ success: true, data: generatedSummary, saved: false });
    return NextResponse.json({ success: true, data: saved });

  } catch (err: any) {
    console.error("[contact-brief] Error:", err?.message);
    return NextResponse.json({ success: false, error: err?.message ?? String(err) }, { status: 500 });
  }
}
