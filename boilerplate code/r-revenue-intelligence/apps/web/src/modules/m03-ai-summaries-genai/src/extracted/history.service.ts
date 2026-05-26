import { SupabaseClient } from "@supabase/supabase-js";
import type { AIGeneratedSummary, BriefType } from "@/types/database";

export interface SaveHistoryParams {
  supabase: SupabaseClient<any>;
  entityType: BriefType;
  entityId: string;
  generatedSummary: AIGeneratedSummary;
  sourceIds: string[];
  modelUsed?: string;
  sessionId?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Saves a generated brief to brief_history with auto-incremented version number.
 * Gracefully no-ops if the table doesn't exist yet.
 */
export async function saveToHistory(params: SaveHistoryParams): Promise<number> {
  const {
    supabase, entityType, entityId,
    generatedSummary, sourceIds,
    modelUsed = "llama-3.3-70b-versatile",
    sessionId, metadata,
  } = params;

  try {
    // 1. Get current max version for this entity
    const { data: existing, error: fetchErr } = await supabase
      .from("brief_history")
      .select("version_number")
      .eq("entity_id", entityId)
      .eq("brief_type", entityType)
      .order("version_number", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchErr) {
      // Table likely doesn't exist yet — log and skip silently
      console.warn("[history] brief_history table not ready:", fetchErr.message);
      return 0;
    }

    const nextVersion = ((existing as any)?.version_number ?? 0) + 1;

    // 2. Insert new version
    const { error: insertErr } = await supabase
      .from("brief_history")
      .insert({
        entity_type:       entityType,
        entity_id:         entityId,
        brief_type:        entityType,
        version_number:    nextVersion,
        generated_summary: generatedSummary as any,
        source_ids:        sourceIds as any,
        model_used:        modelUsed,
        prompt_version:    "2.0",
        generated_by:      "system",
        session_id:        sessionId ?? null,
        metadata:          metadata ?? null,
      } as any);

    if (insertErr) {
      console.warn("[history] Insert failed:", insertErr.message);
      return 0;
    }

    console.log(`[history] Saved v${nextVersion} for ${entityType}:${entityId}`);
    return nextVersion;

  } catch (err: any) {
    console.warn("[history] Unexpected error:", err?.message);
    return 0;
  }
}

/**
 * Fetches all history versions for an entity, newest first.
 */
export async function getHistory(
  supabase: SupabaseClient<any>,
  entityId: string,
  briefType: BriefType,
  limit = 20
) {
  try {
    const { data, error } = await supabase
      .from("brief_history")
      .select("id, version_number, model_used, prompt_version, generated_by, created_at, metadata, generated_summary")
      .eq("entity_id", entityId)
      .eq("brief_type", briefType)
      .order("version_number", { ascending: false })
      .limit(limit);

    if (error) {
      console.warn("[history] getHistory error:", error.message);
      return [];
    }
    return (data ?? []) as any[];
  } catch {
    return [];
  }
}
