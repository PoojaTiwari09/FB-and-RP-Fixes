import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/supabase/server";

export async function POST(req: Request) {
  try {
    const { token } = await req.json();

    if (!token) {
      return NextResponse.json({ success: false, error: "Token required" }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();

    const { error } = await (supabase as any)
      .from("shared_briefs")
      .update({ is_active: false })
      .eq("share_token", token);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message ?? String(err) }, { status: 500 });
  }
}
