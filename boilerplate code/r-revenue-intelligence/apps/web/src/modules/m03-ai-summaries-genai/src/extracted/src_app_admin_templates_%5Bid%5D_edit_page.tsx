import { TopBar } from "@/components/layout/TopBar";
import { Sidebar } from "@/components/layout/Sidebar";
import { TemplateBuilder } from "@/components/admin/TemplateBuilder";
import { getSupabaseServerClient } from "@/supabase/server";
import { notFound } from "next/navigation";

export default async function EditTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = getSupabaseServerClient();
  
  const { data: template } = await supabase
    .from("brief_templates")
    .select("*")
    .eq("id", id)
    .single();

  if (!template) {
    notFound();
  }

  const { data: sections } = await supabase
    .from("brief_template_sections")
    .select("*")
    .eq("template_id", id)
    .order("section_order", { ascending: true });

  const fullTemplate = { ...(template as any), sections: sections || [] };

  return (
    <div className="flex h-screen bg-[var(--background)] overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-8">
          <TemplateBuilder initialData={fullTemplate} />
        </main>
      </div>
    </div>
  );
}
