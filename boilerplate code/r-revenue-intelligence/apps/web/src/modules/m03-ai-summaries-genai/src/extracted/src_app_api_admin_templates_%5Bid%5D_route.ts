import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/supabase/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = getSupabaseServerClient();

    const { data: template, error: templateError } = await supabase
      .from("brief_templates")
      .select("*")
      .eq("id", id)
      .single();

    if (templateError) throw templateError;

    const { data: sections, error: sectionsError } = await supabase
      .from("brief_template_sections")
      .select("*")
      .eq("template_id", id)
      .order("section_order", { ascending: true });

    if (sectionsError) throw sectionsError;

    return NextResponse.json({ ...template, sections });
  } catch (error: any) {
    console.error("[Templates API] GET [id] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = getSupabaseServerClient();
    const body = await request.json();

    const {
      template_name,
      entity_type,
      description,
      is_active,
      sections,
    } = body;

    // 1. Update the template
    const { data: template, error: templateError } = await supabase
      .from("brief_templates")
      .update({
        template_name,
        entity_type,
        description,
        is_active,
        updated_at: new Date().toISOString(),
        version_number: body.version_number ? body.version_number + 1 : undefined,
      })
      .eq("id", id)
      .select()
      .single();

    if (templateError) throw templateError;

    // 2. Handle sections (Full replace strategy for simplicity and exact ordering)
    if (sections && Array.isArray(sections)) {
      // Delete existing sections
      const { error: deleteError } = await supabase
        .from("brief_template_sections")
        .delete()
        .eq("template_id", id);

      if (deleteError) throw deleteError;

      // Insert new sections with proper ordering
      const sectionsToInsert = sections.map((s: any, index: number) => ({
        template_id: id,
        section_name: s.section_name,
        ai_question: s.ai_question,
        instructions: s.instructions || null,
        section_order: index + 1,
        enabled: s.enabled ?? true,
        required: s.required ?? false,
        data_sources: s.data_sources || {},
      }));

      if (sectionsToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from("brief_template_sections")
          .insert(sectionsToInsert);

        if (insertError) throw insertError;
      }
    }

    return NextResponse.json({ success: true, template });
  } catch (error: any) {
    console.error("[Templates API] PUT [id] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = getSupabaseServerClient();

    // Cascading delete will handle the sections if foreign key has ON DELETE CASCADE.
    // Let's do it explicitly just in case.
    await supabase.from("brief_template_sections").delete().eq("template_id", id);
    
    const { error } = await supabase
      .from("brief_templates")
      .delete()
      .eq("id", id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[Templates API] DELETE [id] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
