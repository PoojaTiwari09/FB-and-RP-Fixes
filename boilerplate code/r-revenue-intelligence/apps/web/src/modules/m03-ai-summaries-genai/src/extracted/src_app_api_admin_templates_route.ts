import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/supabase/server";

export async function GET(request: Request) {
  try {
    const supabase = getSupabaseServerClient();

    const { data: templates, error } = await supabase
      .from("brief_templates")
      .select(`
        *,
        sections:brief_template_sections(count)
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json(templates);
  } catch (error: any) {
    console.error("[Templates API] GET Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabase = getSupabaseServerClient();
    const body = await request.json();

    const { template_name, entity_type, description, is_active } = body;

    if (!template_name || !entity_type) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("brief_templates")
      .insert([
        {
          template_name,
          entity_type,
          description,
          is_active: is_active ?? true,
        },
      ])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[Templates API] POST Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
