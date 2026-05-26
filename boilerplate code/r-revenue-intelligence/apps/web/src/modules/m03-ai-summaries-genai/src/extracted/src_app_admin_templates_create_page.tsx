import { TopBar } from "@/components/layout/TopBar";
import { Sidebar } from "@/components/layout/Sidebar";
import { TemplateBuilder } from "@/components/admin/TemplateBuilder";

export default function CreateTemplatePage() {
  return (
    <div className="flex h-screen bg-[var(--background)] overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-8">
          <TemplateBuilder />
        </main>
      </div>
    </div>
  );
}
