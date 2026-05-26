import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/supabase/server";
import crypto from "crypto";
import type { ShareExpiry } from "@/types/database";

function expiresAt(expiry: ShareExpiry): string | null {
  if (expiry === "never") return null;
  const ms = { "24h": 86400000, "7d": 604800000, "30d": 2592000000 }[expiry];
  return new Date(Date.now() + ms).toISOString();
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { entityId, entityType, briefType, expiry = "7d", summary } = body;

    if (!entityId || !entityType || !briefType || !summary) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();

    // Generate cryptographically secure token
    const token = crypto.randomBytes(32).toString("hex");

    const { data, error } = await supabase
      .from("shared_briefs")
      .insert({
        entity_type:      entityType,
        entity_id:        entityId,
        brief_type:       briefType,
        share_token:      token,
        access_type:      "read_only",
        expires_at:       expiresAt(expiry as ShareExpiry),
        is_active:        true,
        snapshot_summary: summary,
        metadata: {
          created_at_ms: Date.now(),
          expiry_setting: expiry,
        },
      } as any)
      .select("id, share_token, expires_at, created_at")
      .single();

    if (error) {
      console.error("[share/create] DB error:", error.message);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const shareUrl = `${baseUrl}/shared/${token}`;

    return NextResponse.json({
      success: true,
      token,
      shareUrl,
      expiresAt: (data as any).expires_at,
      id: (data as any).id,
    });

  } catch (err: any) {
    console.error("[share/create] Error:", err?.message);
    return NextResponse.json({ success: false, error: err?.message ?? String(err) }, { status: 500 });
  }
}
