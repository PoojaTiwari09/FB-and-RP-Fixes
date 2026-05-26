"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { BriefType } from "@/types/database";
import clsx from "clsx";
import { Phone, Briefcase, Building2, UserCircle, AlertCircle, RefreshCw } from "lucide-react";

// ── Entity shapes ─────────────────────────────────────────────────────────────

export interface CallEntity {
  id: string;
  title: string | null;
  meeting_date: string | null;
  duration: number | null;
  source_platform: string | null;
  account_id: string | null;
  account_name?: string | null; // resolved via join
}

export interface DealEntity {
  id: string;
  deal_name: string;
  stage: string | null;
  value: number | null;
  risk_level: string | null;
  status: string | null;
  account_id: string | null;
  account_name?: string | null;
}

export interface AccountEntity {
  id: string;
  account_name: string;
  industry: string | null;
  relationship_status: string | null;
  company_size: string | null;
}

export interface ContactEntity {
  id: string;
  full_name: string;
  role: string | null;
  account_id: string | null;
  account_name?: string | null;
  influence_level: string | null;
  sentiment_score: number | null;
}

export type AnyEntity = CallEntity | DealEntity | AccountEntity | ContactEntity;

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function riskBadge(risk: string | null) {
  if (!risk) return null;
  const r = risk.toLowerCase();
  if (r === "high")   return { label: "High risk",   cls: "text-red-400 bg-red-400/10" };
  if (r === "medium") return { label: "Medium risk", cls: "text-amber-400 bg-amber-400/10" };
  return { label: "Low risk", cls: "text-emerald-400 bg-emerald-400/10" };
}

function sentimentInfo(score: number | null) {
  if (score === null) return { label: "—", cls: "text-(--text-muted)" };
  if (score >= 0.6)  return { label: "Positive", cls: "text-emerald-400" };
  if (score >= 0.3)  return { label: "Neutral",  cls: "text-amber-400" };
  return { label: "Negative", cls: "text-red-400" };
}

function statusDot(status: string | null) {
  if (!status) return "bg-(--text-muted)";
  const s = status.toLowerCase();
  if (s === "won")    return "bg-emerald-400";
  if (s === "lost")   return "bg-red-400";
  if (s === "open")   return "bg-blue-400";
  return "bg-amber-400";
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function ListSkeleton() {
  return (
    <div className="divide-y divide-(--border)/30">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="px-4 py-3.5 animate-pulse">
          <div className="h-3.5 bg-(--border) rounded w-3/4 mb-2.5" />
          <div className="flex gap-2">
            <div className="h-2.5 bg-(--border)/50 rounded w-16" />
            <div className="h-2.5 bg-(--border)/50 rounded w-20" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Row components ────────────────────────────────────────────────────────────

function RowWrapper({
  selected, onClick, children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        "w-full text-left px-4 py-3.5 border-b border-(--border)/30 transition-colors duration-100 group relative",
        selected
          ? "bg-(--accent)/10 border-l-[3px] border-l-(--accent) pl-[13px]"
          : "hover:bg-(--surface) border-l-[3px] border-l-transparent pl-[13px]"
      )}
    >
      {children}
    </button>
  );
}

function CallRow({ item, selected, onClick }: { item: CallEntity; selected: boolean; onClick: () => void }) {
  return (
    <RowWrapper selected={selected} onClick={onClick}>
      <div className="flex items-start justify-between gap-3 mb-1.5">
        <p className={clsx(
          "text-sm font-medium leading-snug line-clamp-1 flex-1",
          selected ? "text-(--accent)" : "text-(--text) group-hover:text-(--accent) transition-colors"
        )}>
          {item.title || "Untitled Call"}
        </p>
        {item.meeting_date && (
          <span className="text-[11px] text-(--text-muted) shrink-0 tabular-nums">
            {formatDate(item.meeting_date)}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {item.account_name && (
          <span className="text-[11px] text-(--text-muted) font-medium">{item.account_name}</span>
        )}
        {item.source_platform && (
          <span className="text-[11px] text-(--text-muted) bg-(--surface) border border-(--border)/50 px-1.5 py-0.5 rounded">
            {item.source_platform}
          </span>
        )}
        {item.duration && (
          <span className="text-[11px] text-(--text-muted)">{item.duration} min</span>
        )}
      </div>
    </RowWrapper>
  );
}

function DealRow({ item, selected, onClick }: { item: DealEntity; selected: boolean; onClick: () => void }) {
  const risk = riskBadge(item.risk_level);
  return (
    <RowWrapper selected={selected} onClick={onClick}>
      <div className="flex items-start justify-between gap-3 mb-1.5">
        <p className={clsx(
          "text-sm font-medium leading-snug line-clamp-1 flex-1",
          selected ? "text-(--accent)" : "text-(--text) group-hover:text-(--accent) transition-colors"
        )}>
          {item.deal_name}
        </p>
        {item.value != null && (
          <span className="text-[11px] text-(--text-muted) shrink-0 font-mono tabular-nums">
            ${item.value.toLocaleString()}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {item.account_name && (
          <span className="text-[11px] text-(--text-muted) font-medium">{item.account_name}</span>
        )}
        {item.stage && (
          <span className="text-[11px] text-(--text-muted) bg-(--surface) border border-(--border)/50 px-1.5 py-0.5 rounded">
            {item.stage}
          </span>
        )}
        {risk && (
          <span className={clsx("text-[11px] font-medium px-1.5 py-0.5 rounded", risk.cls)}>
            {risk.label}
          </span>
        )}
        {item.status && (
          <span className="flex items-center gap-1 text-[11px] text-(--text-muted)">
            <span className={clsx("w-1.5 h-1.5 rounded-full", statusDot(item.status))} />
            {item.status}
          </span>
        )}
      </div>
    </RowWrapper>
  );
}

function AccountRow({ item, selected, onClick }: { item: AccountEntity; selected: boolean; onClick: () => void }) {
  return (
    <RowWrapper selected={selected} onClick={onClick}>
      <p className={clsx(
        "text-sm font-medium leading-snug mb-1.5",
        selected ? "text-(--accent)" : "text-(--text) group-hover:text-(--accent) transition-colors"
      )}>
        {item.account_name}
      </p>
      <div className="flex items-center gap-2 flex-wrap">
        {item.industry && (
          <span className="text-[11px] text-(--text-muted) bg-(--surface) border border-(--border)/50 px-1.5 py-0.5 rounded">
            {item.industry}
          </span>
        )}
        {item.relationship_status && (
          <span className={clsx(
            "text-[11px] font-medium",
            item.relationship_status.toLowerCase() === "at risk" ? "text-red-400" :
            item.relationship_status.toLowerCase() === "active"  ? "text-emerald-400" :
            "text-(--text-muted)"
          )}>
            {item.relationship_status}
          </span>
        )}
        {item.company_size && (
          <span className="text-[11px] text-(--text-muted)">{item.company_size}</span>
        )}
      </div>
    </RowWrapper>
  );
}

function ContactRow({ item, selected, onClick }: { item: ContactEntity; selected: boolean; onClick: () => void }) {
  const sentiment = sentimentInfo(item.sentiment_score);
  return (
    <RowWrapper selected={selected} onClick={onClick}>
      <div className="flex items-start justify-between gap-3 mb-1.5">
        <p className={clsx(
          "text-sm font-medium leading-snug line-clamp-1 flex-1",
          selected ? "text-(--accent)" : "text-(--text) group-hover:text-(--accent) transition-colors"
        )}>
          {item.full_name}
        </p>
        <span className={clsx("text-[11px] font-medium shrink-0", sentiment.cls)}>
          {sentiment.label}
        </span>
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        {item.role && (
          <span className="text-[11px] text-(--text-muted) bg-(--surface) border border-(--border)/50 px-1.5 py-0.5 rounded">
            {item.role}
          </span>
        )}
        {item.account_name && (
          <span className="text-[11px] text-(--text-muted) font-medium">{item.account_name}</span>
        )}
        {item.influence_level && (
          <span className="text-[11px] text-(--text-muted)">{item.influence_level} influence</span>
        )}
      </div>
    </RowWrapper>
  );
}

// ── Config ────────────────────────────────────────────────────────────────────

const ICONS: Record<BriefType, React.ElementType> = {
  call: Phone, deal: Briefcase, account: Building2, contact: UserCircle,
};

const LABELS: Record<BriefType, string> = {
  call: "Calls", deal: "Deals", account: "Accounts", contact: "Contacts",
};

// ── Main component ────────────────────────────────────────────────────────────

interface EntityListPanelProps {
  briefType: BriefType;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function EntityListPanel({ briefType, selectedId, onSelect }: EntityListPanelProps) {
  const [entities, setEntities] = useState<AnyEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const Icon = ICONS[briefType];

  const fetchEntities = async () => {
    setLoading(true);
    setError(null);

    try {
      const supabase = getSupabaseBrowserClient();

      if (briefType === "call") {
        // Join accounts to get account_name
        const { data, error: err } = await supabase
          .from("calls")
          .select("id, title, meeting_date, duration, source_platform, account_id, accounts(account_name)")
          .order("meeting_date", { ascending: false })
          .limit(100);

        console.log("[EntityListPanel] Fetched calls:", data?.length ?? 0, err ?? "no error");
        if (err) throw err;

        const mapped: CallEntity[] = (data ?? []).map((r: any) => ({
          id: r.id,
          title: r.title,
          meeting_date: r.meeting_date,
          duration: r.duration,
          source_platform: r.source_platform,
          account_id: r.account_id,
          account_name: r.accounts?.account_name ?? null,
        }));
        setEntities(mapped);

      } else if (briefType === "deal") {
        const { data, error: err } = await supabase
          .from("deals")
          .select("id, deal_name, stage, value, risk_level, status, account_id, accounts(account_name)")
          .order("created_at", { ascending: false })
          .limit(100);

        console.log("[EntityListPanel] Fetched deals:", data?.length ?? 0, err ?? "no error");
        if (err) throw err;

        const mapped: DealEntity[] = (data ?? []).map((r: any) => ({
          id: r.id,
          deal_name: r.deal_name,
          stage: r.stage,
          value: r.value,
          risk_level: r.risk_level,
          status: r.status,
          account_id: r.account_id,
          account_name: r.accounts?.account_name ?? null,
        }));
        setEntities(mapped);

      } else if (briefType === "account") {
        const { data, error: err } = await supabase
          .from("accounts")
          .select("id, account_name, industry, relationship_status, company_size")
          .order("account_name", { ascending: true })
          .limit(100);

        console.log("[EntityListPanel] Fetched accounts:", data?.length ?? 0, err ?? "no error");
        if (err) throw err;
        setEntities(data ?? []);

      } else {
        // contacts
        const { data, error: err } = await supabase
          .from("contacts")
          .select("id, full_name, role, account_id, influence_level, sentiment_score, accounts(account_name)")
          .order("full_name", { ascending: true })
          .limit(100);

        console.log("[EntityListPanel] Fetched contacts:", data?.length ?? 0, err ?? "no error");
        if (err) throw err;

        const mapped: ContactEntity[] = (data ?? []).map((r: any) => ({
          id: r.id,
          full_name: r.full_name,
          role: r.role,
          account_id: r.account_id,
          account_name: r.accounts?.account_name ?? null,
          influence_level: r.influence_level,
          sentiment_score: r.sentiment_score,
        }));
        setEntities(mapped);
      }

    } catch (err: any) {
      console.error("[EntityListPanel] Error:", err);
      setError(err?.message ?? "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setEntities([]);
    fetchEntities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [briefType]);

  return (
    <div className="flex flex-col h-full border-r border-(--border) bg-(--bg2)">
      {/* Header */}
      <div className="px-4 py-3 border-b border-(--border) shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon size={14} className="text-(--accent)" />
          <span className="text-sm font-semibold text-(--text)">{LABELS[briefType]}</span>
        </div>
        <div className="flex items-center gap-2">
          {!loading && !error && (
            <span className="text-[11px] text-(--text-muted) font-mono bg-(--surface) px-1.5 py-0.5 rounded">
              {entities.length}
            </span>
          )}
          <button
            onClick={fetchEntities}
            disabled={loading}
            title="Refresh"
            className="p-1 text-(--text-muted) hover:text-(--text) hover:bg-(--surface) rounded transition-colors disabled:opacity-40"
          >
            <RefreshCw size={12} className={clsx(loading && "animate-spin")} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {loading && <ListSkeleton />}

        {!loading && error && (
          <div className="flex flex-col items-center justify-center h-full gap-3 px-6 text-center py-12">
            <AlertCircle size={24} className="text-red-400 opacity-70" />
            <p className="text-sm text-(--text-muted)">{error}</p>
            <button
              onClick={fetchEntities}
              className="text-xs text-(--accent) hover:underline"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && entities.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-3 px-6 text-center py-12">
            <Icon size={24} className="text-(--text-muted) opacity-30" />
            <p className="text-sm text-(--text-muted)">No {LABELS[briefType].toLowerCase()} found</p>
            <p className="text-[11px] text-(--text-muted) opacity-60">
              Add records in Supabase to see them here
            </p>
          </div>
        )}

        {!loading && !error && entities.length > 0 && (
          <>
            {briefType === "call" && (entities as CallEntity[]).map(item => (
              <CallRow key={item.id} item={item} selected={selectedId === item.id} onClick={() => onSelect(item.id)} />
            ))}
            {briefType === "deal" && (entities as DealEntity[]).map(item => (
              <DealRow key={item.id} item={item} selected={selectedId === item.id} onClick={() => onSelect(item.id)} />
            ))}
            {briefType === "account" && (entities as AccountEntity[]).map(item => (
              <AccountRow key={item.id} item={item} selected={selectedId === item.id} onClick={() => onSelect(item.id)} />
            ))}
            {briefType === "contact" && (entities as ContactEntity[]).map(item => (
              <ContactRow key={item.id} item={item} selected={selectedId === item.id} onClick={() => onSelect(item.id)} />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
