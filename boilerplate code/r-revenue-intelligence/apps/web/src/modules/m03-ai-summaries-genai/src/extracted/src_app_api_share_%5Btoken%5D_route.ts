import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/supabase/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  if (!token || token.length < 32) {
    return NextResponse.json({ success: false, error: "Invalid share token" }, { status: 400 });
  }

  try {
    const supabase = getSupabaseServerClient();

    const { data, error } = await supabase
      .from("shared_briefs")
      .select("id, entity_type, entity_id, brief_type, access_type, expires_at, is_active, snapshot_summary, created_at, metadata")
      .eq("share_token", token)
      .maybeSingle();

    if (error) {
      console.error("[share/token] DB error:", error.message);
      return NextResponse.json({ success: false, error: "Failed to validate link" }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ success: false, error: "Invalid or inaccessible share link" }, { status: 404 });
    }

    const share = data as any;

    // Check revocation
    if (!share.is_active) {
      return NextResponse.json({ success: false, error: "This shared link has been revoked" }, { status: 403 });
    }

    // Check expiration
    if (share.expires_at && new Date(share.expires_at) < new Date()) {
      return NextResponse.json({ success: false, error: "This shared link has expired" }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      data: {
        entityType:      share.entity_type,
        entityId:        share.entity_id,
        briefType:       share.brief_type,
        accessType:      share.access_type,
        expiresAt:       share.expires_at,
        createdAt:       share.created_at,
        summary:         share.snapshot_summary,
      },
    });

  } catch (err: any) {
    console.error("[share/token] Error:", err?.message);
    return NextResponse.json({ success: false, error: err?.message ?? String(err) }, { status: 500 });
  }
}
