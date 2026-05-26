import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/supabase/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      entityId, entityType, briefType,
      sectionName, bulletId, bulletText,
      feedbackType, feedbackReason, feedbackComment,
    } = body;

    if (!feedbackType) {
      return NextResponse.json({ success: false, error: "feedbackType is required" }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();

    const { error } = await supabase
      .from("brief_feedback")
      .insert({
        entity_type:      entityType ?? null,
        entity_id:        entityId   ?? null,
        brief_type:       briefType  ?? null,
        section_name:     sectionName ?? null,
        bullet_id:        bulletId   ?? null,
        bullet_text:      bulletText ?? null,
        feedback_type:    feedbackType,
        feedback_reason:  feedbackReason  ?? null,
        feedback_comment: feedbackComment ?? null,
        user_id:          "anonymous",
        metadata: { timestamp: Date.now() },
      } as any);

    if (error) {
      console.error("[feedback] Insert error:", error.message);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (err: any) {
    console.error("[feedback] Error:", err?.message);
    return NextResponse.json({ success: false, error: err?.message ?? String(err) }, { status: 500 });
  }
}

// GET — aggregate stats for admin dashboard
export async function GET() {
  try {
    const supabase = getSupabaseServerClient();

    const { data, error } = await supabase
      .from("brief_feedback")
      .select("feedback_type, feedback_reason, entity_type, brief_type, bullet_id, bullet_text, section_name, created_at")
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) throw error;

    const rows = (data ?? []) as any[];

    // Aggregate counts
    const byType: Record<string, number> = {};
    const byReason: Record<string, number> = {};
    const byBullet: Record<string, { count: number; text: string; flags: number }> = {};
    const bySection: Record<string, number> = {};

    for (const r of rows) {
      byType[r.feedback_type] = (byType[r.feedback_type] ?? 0) + 1;
      if (r.feedback_reason) byReason[r.feedback_reason] = (byReason[r.feedback_reason] ?? 0) + 1;
      if (r.bullet_id) {
        if (!byBullet[r.bullet_id]) byBullet[r.bullet_id] = { count: 0, text: r.bullet_text ?? "", flags: 0 };
        byBullet[r.bullet_id].count++;
        if (["inaccuracy_flag", "hallucination"].includes(r.feedback_type)) byBullet[r.bullet_id].flags++;
      }
      if (r.section_name) bySection[r.section_name] = (bySection[r.section_name] ?? 0) + 1;
    }

    const total      = rows.length;
    const thumbsUp   = byType["thumbs_up"]   ?? 0;
    const thumbsDown = byType["thumbs_down"] ?? 0;
    const flags      = (byType["inaccuracy_flag"] ?? 0) + (byType["hallucination"] ?? 0);
    const positiveRate = total > 0 ? Math.round((thumbsUp / total) * 100) : 0;
    const flagRate     = total > 0 ? Math.round((flags    / total) * 100) : 0;

    // Most flagged bullets
    const mostFlagged = Object.entries(byBullet)
      .sort((a, b) => b[1].flags - a[1].flags)
      .slice(0, 10)
      .map(([id, v]) => ({ bullet_id: id, ...v }));

    // Recent feedback
    const recent = rows.slice(0, 20);

    return NextResponse.json({
      success: true,
      stats: {
        total, thumbsUp, thumbsDown, flags,
        positiveRate, flagRate,
        byType, byReason, bySection,
        mostFlagged, recent,
      },
    });

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message ?? String(err) }, { status: 500 });
  }
}
