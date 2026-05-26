import Link from "next/link";
import { getSupabaseServerClient } from "@/supabase/server";
import { TopBar } from "@/components/layout/TopBar";
import { Sidebar } from "@/components/layout/Sidebar";

export const revalidate = 0; // Ensure fresh data on load

export default async function AdminTemplatesPage() {
  const supabase = getSupabaseServerClient();
  const { data: templates } = await supabase
    .from("brief_templates")
    .select(`*, sections:brief_template_sections(count)`)
    .order("created_at", { ascending: false });

  return (
    <div className="flex h-screen bg-[var(--background)] overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-2xl font-bold text-[var(--text)]">AI Brief Templates</h1>
                <p className="text-[var(--text-muted)] mt-1">
                  Manage dynamic structures and AI instructions for generating briefs.
                </p>
              </div>
              <Link
                href="/admin/templates/create"
                className="bg-[var(--accent)] text-white px-4 py-2 rounded-md hover:bg-opacity-90 font-medium transition-all shadow-[0_0_15px_rgba(var(--accent-rgb),0.3)]"
              >
                + New Template
              </Link>
            </div>

            <div className="bg-[var(--surface)] rounded-lg border border-[var(--border)] overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--background)]/50">
                    <th className="p-4 text-sm font-semibold text-[var(--text-muted)]">Template Name</th>
                    <th className="p-4 text-sm font-semibold text-[var(--text-muted)]">Entity Type</th>
                    <th className="p-4 text-sm font-semibold text-[var(--text-muted)]">Version</th>
                    <th className="p-4 text-sm font-semibold text-[var(--text-muted)]">Sections</th>
                    <th className="p-4 text-sm font-semibold text-[var(--text-muted)]">Status</th>
                    <th className="p-4 text-sm font-semibold text-[var(--text-muted)] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {templates?.length ? (
                    templates.map((t) => (
                      <tr key={t.id} className="hover:bg-[var(--background)]/50 transition-colors">
                        <td className="p-4">
                          <p className="font-medium text-[var(--text)]">{t.template_name}</p>
                          <p className="text-xs text-[var(--text-muted)] truncate max-w-[200px]">
                            {t.description || "No description"}
                          </p>
                        </td>
                        <td className="p-4">
                          <span className="inline-block px-2 py-1 text-xs uppercase font-semibold tracking-wider rounded-md bg-[var(--surface)] border border-[var(--border)]">
                            {t.entity_type}
                          </span>
                        </td>
                        <td className="p-4 text-sm text-[var(--text)]">v{t.version_number}</td>
                        <td className="p-4 text-sm text-[var(--text)]">
                          {t.sections?.[0]?.count || 0} Sections
                        </td>
                        <td className="p-4">
                          {t.is_active ? (
                            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-md">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs text-gray-400 bg-gray-400/10 px-2 py-1 rounded-md">
                              <span className="w-1.5 h-1.5 rounded-full bg-gray-400" /> Inactive
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <Link
                            href={`/admin/templates/${t.id}/edit`}
                            className="text-sm text-[var(--accent)] hover:underline font-medium"
                          >
                            Edit Configuration
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-[var(--text-muted)]">
                        No templates found. Create one to get started.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
