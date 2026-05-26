"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Phone, Briefcase, Building2, UserCircle, Settings, BarChart3 } from "lucide-react";
import clsx from "clsx";

const NAV_ITEMS = [
  { href: "/summaries/call-briefs",    label: "Call Briefs",    icon: Phone,       briefType: "call" },
  { href: "/summaries/deal-briefs",    label: "Deal Briefs",    icon: Briefcase,   briefType: "deal" },
  { href: "/summaries/account-briefs", label: "Account Briefs", icon: Building2,   briefType: "account" },
  { href: "/summaries/contact-briefs", label: "Contact Briefs", icon: UserCircle,  briefType: "contact" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[240px] h-screen fixed left-0 top-0 flex flex-col border-r border-(--border) bg-(--bg2) z-40">
      {/* Brand */}
      <div className="h-14 flex items-center px-5 border-b border-(--border) shrink-0">
        <div className="w-7 h-7 rounded-lg bg-linear-to-tr from-(--accent) to-(--accent2) flex items-center justify-center mr-2.5 shadow-md shadow-(--accent)/20">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="white" />
            <path d="M2 17L12 22L22 17" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M2 12L12 17L22 12" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <span className="font-mono font-bold text-sm tracking-widest text-(--text)">SMARTSUMMARY</span>
        <span className="ml-1.5 text-[9px] font-bold bg-(--accent)/15 text-(--accent) px-1.5 py-0.5 rounded">AI</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 overflow-y-auto">
        <p className="px-2 text-[10px] font-semibold text-(--text-muted) uppercase tracking-widest mb-2">
          Briefs
        </p>
        <div className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  "flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm transition-all duration-150 group relative",
                  isActive
                    ? "bg-(--accent)/10 text-(--accent) font-medium"
                    : "text-(--text-muted) hover:text-(--text) hover:bg-(--surface)"
                )}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-(--accent) rounded-r-full" />
                )}
                <Icon
                  size={15}
                  className={clsx(
                    "shrink-0 transition-colors",
                    isActive ? "text-(--accent)" : "text-(--text-muted) group-hover:text-(--text)"
                  )}
                />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-(--border) shrink-0 space-y-0.5">
        <Link
          href="/admin/feedback"
          className={clsx(
            "flex items-center gap-2.5 px-2.5 py-2 w-full text-sm rounded-md transition-all duration-150",
            pathname.startsWith("/admin/feedback")
              ? "bg-(--accent)/10 text-(--accent) font-medium"
              : "text-(--text-muted) hover:text-(--text) hover:bg-(--surface)"
          )}
        >
          <BarChart3 size={15} className="shrink-0" />
          <span>AI Feedback</span>
        </Link>
        <button className="flex items-center gap-2.5 px-2.5 py-2 w-full text-sm text-(--text-muted) hover:text-(--text) hover:bg-(--surface) rounded-md transition-all duration-150">
          <Settings size={15} className="shrink-0" />
          <span>Settings</span>
        </button>
      </div>
    </aside>
  );
}
