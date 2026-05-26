import { useEffect, useState } from "react";
import { getSupabaseClient } from "../../lib/supabase";
import { Phone, Briefcase, Building2, UserCircle, AlertCircle, RefreshCw } from "lucide-react";

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getBadgeClass(value) {
  if (!value) return "";
  const v = value.toLowerCase();
  if (v.includes("active"))    return "ss-badge ss-badge-active";
  if (v.includes("at risk") || v.includes("atrisk")) return "ss-badge ss-badge-atrisk";
  if (v.includes("new"))       return "ss-badge ss-badge-new";
  if (v.includes("expanding")) return "ss-badge ss-badge-expanding";
  if (v.includes("won"))       return "ss-badge ss-badge-active";
  if (v.includes("lost"))      return "ss-badge ss-badge-atrisk";
  if (v.includes("negotiation") || v.includes("proposal")) return "ss-badge ss-badge-expanding";
  return "ss-badge ss-badge-new";
}

function formatSize(size) {
  if (!size) return null;
  const s = String(size);
  // convert number ranges to readable format
  if (s.match(/^\d+$/)) {
    const n = parseInt(s);
    if (n >= 5000) return "5000+";
    if (n >= 1000) return `${Math.round(n/1000)}k+`;
    return `${n}+`;
  }
  return s;
}

// ── Skeleton ─────────────────────────────────────────────────────────────────

function ListSkeleton() {
  return (
    <div>
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          style={{
            padding: "12px 16px 10px 16px",
            borderBottom: "1px solid #f1f5f9",
            animation: "pulse 1.5s cubic-bezier(0.4,0,0.6,1) infinite",
          }}
        >
          <div style={{ height: 14, background: "#e2e8f0", borderRadius: 4, width: "70%", marginBottom: 8 }} />
          <div style={{ display: "flex", gap: 6 }}>
            <div style={{ height: 10, background: "#f1f5f9", borderRadius: 4, width: 60 }} />
            <div style={{ height: 10, background: "#f1f5f9", borderRadius: 4, width: 80 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Row Components ────────────────────────────────────────────────────────────

function CallRow({ item, selected, onClick }) {
  return (
    <button onClick={onClick} className={`ss-row${selected ? " ss-row-selected" : ""}`}>
      <div className="ss-row-name">{item.title || "Untitled Call"}</div>
      <div className="ss-row-meta">
        {item.account_name && <span className="ss-meta-text">{item.account_name}</span>}
        {item.source_platform && (
          <span className="ss-badge ss-badge-new">{item.source_platform}</span>
        )}
        {item.duration && (
          <span className="ss-meta-text">{item.duration} min</span>
        )}
        {item.meeting_date && (
          <span className="ss-meta-text">{formatDate(item.meeting_date)}</span>
        )}
      </div>
    </button>
  );
}

function DealRow({ item, selected, onClick }) {
  const stageBadgeClass = getBadgeClass(item.stage || item.status);
  return (
    <button onClick={onClick} className={`ss-row${selected ? " ss-row-selected" : ""}`}>
      <div className="ss-row-name">{item.deal_name}</div>
      <div className="ss-row-meta">
        {item.account_name && <span className="ss-meta-text">{item.account_name}</span>}
        {item.stage && <span className={stageBadgeClass}>{item.stage}</span>}
        {item.value != null && (
          <span className="ss-meta-text">${item.value.toLocaleString()}</span>
        )}
      </div>
    </button>
  );
}

function AccountRow({ item, selected, onClick }) {
  const statusClass = getBadgeClass(item.relationship_status);
  return (
    <button onClick={onClick} className={`ss-row${selected ? " ss-row-selected" : ""}`}>
      <div className="ss-row-name">{item.account_name}</div>
      <div className="ss-row-meta">
        {item.industry && <span className="ss-meta-text">{item.industry}</span>}
        {item.relationship_status && (
          <span className={statusClass}>{item.relationship_status}</span>
        )}
        {item.company_size && (
          <span className="ss-meta-text">{formatSize(item.company_size)}</span>
        )}
      </div>
    </button>
  );
}

function ContactRow({ item, selected, onClick }) {
  const sentimentClass = item.sentiment_score >= 0.6
    ? "ss-badge ss-badge-active"
    : item.sentiment_score >= 0.3
    ? "ss-badge ss-badge-expanding"
    : "ss-badge ss-badge-atrisk";
  const sentimentLabel = item.sentiment_score >= 0.6 ? "Positive" : item.sentiment_score >= 0.3 ? "Neutral" : "Negative";

  return (
    <button onClick={onClick} className={`ss-row${selected ? " ss-row-selected" : ""}`}>
      <div className="ss-row-name">{item.full_name}</div>
      <div className="ss-row-meta">
        {item.role && <span className="ss-badge ss-badge-new">{item.role}</span>}
        {item.account_name && <span className="ss-meta-text">{item.account_name}</span>}
        {item.sentiment_score != null && (
          <span className={sentimentClass}>{sentimentLabel}</span>
        )}
      </div>
    </button>
  );
}

// ── Config ────────────────────────────────────────────────────────────────────

const ICONS = { call: Phone, deal: Briefcase, account: Building2, contact: UserCircle };
const LABELS = { call: "Calls", deal: "Deals", account: "Accounts", contact: "Contacts" };

// ── Main Component ────────────────────────────────────────────────────────────

export function EntityListPanel({ briefType, selectedId, onSelect }) {
  const [entities, setEntities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const Icon = ICONS[briefType] || Phone;

  const fetchEntities = async () => {
    setLoading(true);
    setError(null);

    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        throw new Error("Supabase is not configured yet. Configure Supabase credentials to access CRM records.");
      }

      if (briefType === "call") {
        const { data, error: err } = await supabase
          .from("calls")
          .select("id, title, meeting_date:started_at, duration:duration_seconds, account_id, accounts(account_name:name)")
          .order("started_at", { ascending: false })
          .limit(100);

        if (err) throw err;
        const mapped = (data ?? []).map((r) => ({
          id: r.id,
          title: r.title,
          meeting_date: r.meeting_date,
          duration: r.duration ? Math.round(r.duration / 60) : null,
          source_platform: "CRM",
          account_id: r.account_id,
          account_name: r.accounts?.account_name ?? null,
        }));
        setEntities(mapped);

      } else if (briefType === "deal") {
        const { data, error: err } = await supabase
          .from("deals")
          .select("id, deal_name:name, stage, value:amount, status, account_id, accounts(account_name:name)")
          .order("created_at", { ascending: false })
          .limit(100);

        if (err) throw err;
        const mapped = (data ?? []).map((r) => ({
          id: r.id,
          deal_name: r.deal_name,
          stage: r.stage,
          value: r.value ? parseFloat(r.value) : null,
          status: r.status,
          account_id: r.account_id,
          account_name: r.accounts?.account_name ?? null,
        }));
        setEntities(mapped);

      } else if (briefType === "account") {
        const { data, error: err } = await supabase
          .from("accounts")
          .select("id, account_name:name, industry, company_size:segment")
          .order("name", { ascending: true })
          .limit(100);

        if (err) throw err;
        const mapped = (data ?? []).map((r) => ({
          id: r.id,
          account_name: r.account_name,
          industry: r.industry,
          relationship_status: "Active",
          company_size: r.company_size || "Mid-Market",
        }));
        setEntities(mapped);

      } else {
        const { data, error: err } = await supabase
          .from("contacts")
          .select("id, full_name:name, role:role_title, account_id, accounts(account_name:name)")
          .order("name", { ascending: true })
          .limit(100);

        if (err) throw err;
        const mapped = (data ?? []).map((r) => ({
          id: r.id,
          full_name: r.full_name,
          role: r.role,
          account_id: r.account_id,
          account_name: r.accounts?.account_name ?? null,
          influence_level: "Medium",
          sentiment_score: 0.8,
        }));
        setEntities(mapped);
      }

    } catch (err) {
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
    <div className="ss-list-panel">
      {/* Header */}
      <div className="ss-list-header">
        <div className="ss-list-header-title">
          <Icon size={14} style={{ color: "#3b82f6" }} />
          <span>{LABELS[briefType] || "CRM"}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {!loading && !error && (
            <span className="ss-list-header-count">{entities.length}</span>
          )}
          <button
            onClick={fetchEntities}
            disabled={loading}
            title="Refresh"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 26,
              height: 26,
              border: "1px solid #e2e8f0",
              borderRadius: 6,
              background: "#f8fafc",
              color: "#64748b",
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.5 : 1,
              transition: "all 0.12s",
            }}
          >
            <RefreshCw
              size={12}
              style={{ animation: loading ? "spin 0.8s linear infinite" : "none" }}
            />
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {loading && <ListSkeleton />}

        {!loading && error && (
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "48px 24px",
            textAlign: "center",
            gap: 12,
          }}>
            <AlertCircle size={22} style={{ color: "#ef4444", opacity: 0.7 }} />
            <p style={{ fontSize: 13, color: "#64748b" }}>{error}</p>
            <button
              onClick={fetchEntities}
              style={{
                fontSize: 12,
                color: "#3b82f6",
                background: "none",
                border: "none",
                cursor: "pointer",
                textDecoration: "underline",
              }}
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && entities.length === 0 && (
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "48px 24px",
            textAlign: "center",
            gap: 10,
          }}>
            <Icon size={22} style={{ color: "#94a3b8", opacity: 0.4 }} />
            <p style={{ fontSize: 13, color: "#64748b" }}>
              No {(LABELS[briefType] || "").toLowerCase()} found
            </p>
            <p style={{ fontSize: 11, color: "#94a3b8" }}>
              Add records in Supabase to see them here
            </p>
          </div>
        )}

        {!loading && !error && entities.length > 0 && (
          <>
            {briefType === "call"    && entities.map(item => (
              <CallRow    key={item.id} item={item} selected={selectedId === item.id} onClick={() => onSelect(item.id)} />
            ))}
            {briefType === "deal"    && entities.map(item => (
              <DealRow    key={item.id} item={item} selected={selectedId === item.id} onClick={() => onSelect(item.id)} />
            ))}
            {briefType === "account" && entities.map(item => (
              <AccountRow key={item.id} item={item} selected={selectedId === item.id} onClick={() => onSelect(item.id)} />
            ))}
            {briefType === "contact" && entities.map(item => (
              <ContactRow key={item.id} item={item} selected={selectedId === item.id} onClick={() => onSelect(item.id)} />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
