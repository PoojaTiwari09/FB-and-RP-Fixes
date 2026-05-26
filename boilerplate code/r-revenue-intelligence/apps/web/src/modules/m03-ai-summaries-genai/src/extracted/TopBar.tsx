"use client";

import { useTheme } from "@/components/shared/ThemeProvider";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { Moon, Sun, Database } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import clsx from "clsx";

type DbStatus = "checking" | "connected" | "disconnected";

export function TopBar() {
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const [dbStatus, setDbStatus] = useState<DbStatus>("checking");
  const [dbError, setDbError] = useState<string | null>(null);

  const getBreadcrumb = () => {
    if (pathname.includes("call-briefs"))    return "Call Briefs";
    if (pathname.includes("deal-briefs"))    return "Deal Briefs";
    if (pathname.includes("account-briefs")) return "Account Briefs";
    if (pathname.includes("contact-briefs")) return "Contact Briefs";
    return "Overview";
  };

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        // Lightweight ping — single row from a small table
        const { error } = await supabase
          .from("accounts")
          .select("id")
          .limit(1);

        if (!cancelled) {
          if (error) {
            console.error("[Supabase health check]", error.message);
            setDbError(error.message);
            setDbStatus("disconnected");
          } else {
            setDbError(null);
            setDbStatus("connected");
          }
        }
      } catch (err: any) {
        if (!cancelled) {
          console.error("[Supabase health check exception]", err?.message);
          setDbError(err?.message ?? "Unknown error");
          setDbStatus("disconnected");
        }
      }
    };

    check();
    const interval = setInterval(check, 30_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const dotClass = {
    checking:     "bg-amber-400 animate-pulse",
    connected:    "bg-emerald-400",
    disconnected: "bg-red-400",
  }[dbStatus];

  const statusText = {
    checking:     "Checking…",
    connected:    "Supabase Connected",
    disconnected: "Supabase Disconnected",
  }[dbStatus];

  return (
    <header className="h-12 flex items-center justify-between px-5 border-b border-(--border) bg-(--bg2)/80 backdrop-blur-md sticky top-0 z-30 shrink-0">
      {/* Breadcrumb */}
      <div className="flex items-center gap-1.5 text-sm">
        <span className="text-(--text-muted)">Smart Summaries</span>
        <span className="text-(--text-muted)">/</span>
        <span className="text-(--text) font-medium">{getBreadcrumb()}</span>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-3">
        {/* DB status pill */}
        <div
          title={dbError ?? statusText}
          className={clsx(
            "flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium transition-colors cursor-default",
            dbStatus === "connected"    && "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
            dbStatus === "disconnected" && "border-red-500/30 bg-red-500/10 text-red-400",
            dbStatus === "checking"     && "border-(--border) bg-(--surface) text-(--text-muted)"
          )}
        >
          <span className={clsx("w-1.5 h-1.5 rounded-full shrink-0", dotClass)} />
          <span>{statusText}</span>
          <Database size={11} className="ml-0.5 opacity-60" />
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="w-8 h-8 rounded-full flex items-center justify-center border border-(--border) bg-(--surface) text-(--text-muted) hover:text-(--accent) hover:border-(--accent) transition-all"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
        </button>
      </div>
    </header>
  );
}
