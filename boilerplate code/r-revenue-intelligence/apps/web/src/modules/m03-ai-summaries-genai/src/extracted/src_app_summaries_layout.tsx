import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";

export default function SummariesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen overflow-hidden bg-(--bg) text-(--text)">
      <Sidebar />
      {/* Main area — offset by sidebar width */}
      <div className="flex-1 ml-[240px] flex flex-col min-w-0 overflow-hidden">
        <TopBar />
        {/* Content fills remaining height, no padding — workspace manages its own layout */}
        <main className="flex-1 overflow-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
