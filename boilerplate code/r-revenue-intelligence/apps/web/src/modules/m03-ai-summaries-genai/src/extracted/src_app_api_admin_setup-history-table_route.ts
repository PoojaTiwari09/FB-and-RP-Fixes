import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/supabase/server";

/**
 * One-time setup endpoint — creates the brief_history table.
 * Call: POST /api/admin/setup-history-table
 * Remove this file after running once.
 */
export async function POST() {
  try {
    const supabase = getSupabaseServerClient();

    // Use rpc to run raw SQL via pg_query (available in Supabase)
    // We'll insert a test row to verify the table exists, and if it fails,
    // we know we need to create it via the Supabase dashboard.

    // First, try to query the table
    const { error: checkErr } = await supabase
      .from("brief_history" as any)
      .select("id")
      .limit(1);

    if (!checkErr) {
      return NextResponse.json({ success: true, message: "brief_history table already exists" });
    }

    // Table doesn't exist — return the SQL to run manually
    const sql = `
-- Run this in Supabase Dashboard → SQL Editor
CREATE TABLE IF NOT EXISTS brief_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  brief_type TEXT NOT NULL,
  version_number INTEGER NOT NULL DEFAULT 1,
  generated_summary JSONB NOT NULL,
  source_ids JSONB,
  model_used TEXT,
  prompt_version TEXT DEFAULT '1.0',
  generated_by TEXT DEFAULT 'system',
  session_id TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_brief_history_entity ON brief_history(entity_id, brief_type);
CREATE INDEX IF NOT EXISTS idx_brief_history_created ON brief_history(created_at DESC);

ALTER TABLE brief_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anon_read_brief_history" ON brief_history FOR SELECT TO anon USING (true);
CREATE POLICY "service_write_brief_history" ON brief_history FOR INSERT TO service_role WITH CHECK (true);
    `.trim();

    return NextResponse.json({
      success: false,
      message: "brief_history table does not exist. Run the SQL below in Supabase Dashboard → SQL Editor.",
      sql,
    });

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
