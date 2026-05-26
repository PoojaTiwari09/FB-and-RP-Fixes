import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X, Share2, Link, Copy, Check, Trash2,
  Clock, ShieldCheck, Loader2, AlertCircle, Lock,
} from "lucide-react";

// ── Expiry options ────────────────────────────────────────────────────────────

const EXPIRY_OPTIONS = [
  { value: "24h",   label: "24 Hours",  sub: "Expires tomorrow" },
  { value: "7d",    label: "7 Days",    sub: "Expires next week" },
  { value: "30d",   label: "30 Days",   sub: "Expires next month" },
  { value: "never", label: "No Expiry", sub: "Link never expires" },
];

function formatExpiry(iso) {
  if (!iso) return "Never expires";
  const d = new Date(iso);
  return `Expires ${d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
}

// ── Expiry Card ───────────────────────────────────────────────────────────────

function ExpiryCard({ opt, selected, onClick }) {
  const [hovered, setHovered] = useState(false);
  const isSelected = selected === opt.value;

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        padding: "12px 14px",
        borderRadius: 12,
        border: isSelected ? "2px solid #4f46e5" : "1px solid #e5e7eb",
        background: isSelected ? "#f5f3ff" : hovered ? "#fafafa" : "#fff",
        cursor: "pointer",
        textAlign: "left",
        transition: "all 0.15s",
        boxShadow: isSelected ? "0 0 0 1px #4f46e5" : "none",
      }}
    >
      <span style={{
        fontSize: 14,
        fontWeight: 600,
        color: isSelected ? "#4f46e5" : "#111827",
        marginBottom: 2,
      }}>
        {opt.label}
      </span>
      <span style={{ fontSize: 11, color: "#6b7280" }}>{opt.sub}</span>
    </button>
  );
}

// ── Modal content ─────────────────────────────────────────────────────────────

function ModalContent({ briefType, entityId, summary, onClose }) {
  const [expiry,     setExpiry]     = useState("7d");
  const [generating, setGenerating] = useState(false);
  const [revoking,   setRevoking]   = useState(false);
  const [copied,     setCopied]     = useState(false);
  const [error,      setError]      = useState(null);
  const [shareUrl,   setShareUrl]   = useState(null);
  const [token,      setToken]      = useState(null);
  const [expiresAt,  setExpiresAt]  = useState(null);
  const [revoked,    setRevoked]    = useState(false);

  const generate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/share/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entityId, entityType: briefType, briefType, expiry, summary }),
      });
      const body = await res.json();
      if (!res.ok || !body.success) throw new Error(body.error || "Failed to generate link");
      const origin = typeof window !== "undefined" ? window.location.origin : "http://localhost:5173";
      setShareUrl(`${origin}/smart-summaries/shared/${body.token}`);
      setToken(body.token);
      setExpiresAt(body.expiresAt);
      setRevoked(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const copy = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const revoke = async () => {
    if (!token) return;
    setRevoking(true);
    try {
      const res = await fetch("/api/share/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const body = await res.json();
      if (!res.ok || !body.success) throw new Error(body.error || "Failed to revoke");
      setRevoked(true);
      setShareUrl(null);
      setToken(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setRevoking(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", maxHeight: "90vh" }}>

      {/* ── Header ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "20px 24px 16px",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {/* Share icon box */}
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: "#ede9fe",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Share2 size={18} style={{ color: "#4f46e5" }} />
          </div>
          <div>
            <p style={{ fontSize: 16, fontWeight: 700, color: "#111827", marginBottom: 2 }}>Share Brief</p>
            <p style={{ fontSize: 12, color: "#6b7280" }}>Generate a secure read-only link</p>
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            width: 28, height: 28, borderRadius: 8,
            border: "1px solid #e5e7eb", background: "#f9fafb",
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", color: "#6b7280",
          }}
        >
          <X size={14} />
        </button>
      </div>

      {/* ── Scrollable body ── */}
      <div style={{
        padding: "0 24px 20px",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}>

        {/* Brief preview card */}
        <div style={{
          padding: "14px 16px",
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 12,
        }}>
          <p style={{
            fontSize: 10, fontWeight: 700, color: "#9ca3af",
            textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6,
          }}>
            Sharing
          </p>
          <p style={{
            fontSize: 15, fontWeight: 700, color: "#111827",
            marginBottom: 3,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {summary?.title ?? "Untitled Brief"}
          </p>
          <p style={{ fontSize: 12, color: "#6b7280", textTransform: "capitalize" }}>
            {briefType} Brief
          </p>
        </div>

        {/* Read-only access notice */}
        <div style={{
          padding: "14px 16px",
          background: "#f0fdf4",
          border: "1px solid #bbf7d0",
          borderRadius: 12,
          display: "flex",
          alignItems: "flex-start",
          gap: 12,
        }}>
          <ShieldCheck size={17} style={{ color: "#16a34a", flexShrink: 0, marginTop: 1 }} />
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#16a34a", marginBottom: 4 }}>
              Read Only Access
            </p>
            <p style={{ fontSize: 12, color: "#374151", lineHeight: 1.55 }}>
              Recipients can view summaries and evidence — cannot edit, regenerate, or access other records
            </p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            padding: "12px 14px", background: "#fef2f2", border: "1px solid #fecaca",
            borderRadius: 10, display: "flex", alignItems: "flex-start", gap: 8,
          }}>
            <AlertCircle size={14} style={{ color: "#ef4444", flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 12, color: "#dc2626" }}>{error}</p>
          </div>
        )}

        {/* Revoked notice */}
        {revoked && (
          <div style={{
            padding: "12px 14px", background: "#fffbeb", border: "1px solid #fde68a",
            borderRadius: 10, display: "flex", alignItems: "center", gap: 8,
          }}>
            <Lock size={13} style={{ color: "#f59e0b", flexShrink: 0 }} />
            <p style={{ fontSize: 12, color: "#92400e", fontWeight: 500 }}>
              Link has been revoked. Generate a new one if needed.
            </p>
          </div>
        )}

        {/* Expiry selector — shown before link is generated */}
        {!shareUrl && !revoked && (
          <div>
            <p style={{
              fontSize: 13, fontWeight: 600, color: "#111827",
              display: "flex", alignItems: "center", gap: 6, marginBottom: 10,
            }}>
              <Clock size={13} style={{ color: "#6b7280" }} />
              Link Expiration
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {EXPIRY_OPTIONS.map(opt => (
                <ExpiryCard
                  key={opt.value}
                  opt={opt}
                  selected={expiry}
                  onClick={() => setExpiry(opt.value)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Generated link UI */}
        {shareUrl && !revoked && (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Label */}
            <p style={{
              fontSize: 13, fontWeight: 600, color: "#111827",
              display: "flex", alignItems: "center", gap: 6,
            }}>
              <Link size={13} style={{ color: "#6b7280" }} />
              Share Link
            </p>

            {/* Link box with copy button */}
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "10px 14px",
              background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: 10,
            }}>
              <p style={{
                flex: 1, fontSize: 11, color: "#6b7280",
                fontFamily: "monospace", overflow: "hidden",
                textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {shareUrl}
              </p>
              <button
                onClick={copy}
                style={{
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "5px 12px", borderRadius: 7, fontSize: 12, fontWeight: 600,
                  border: copied ? "1px solid #bbf7d0" : "1px solid #c7d2fe",
                  background: copied ? "#f0fdf4" : "#eff6ff",
                  color: copied ? "#16a34a" : "#4f46e5",
                  cursor: "pointer", flexShrink: 0, transition: "all 0.15s",
                }}
              >
                {copied ? <><Check size={11} /> Copied!</> : <><Copy size={11} /> Copy</>}
              </button>
            </div>

            {/* Expiry + Read-only meta */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              fontSize: 11, color: "#6b7280",
            }}>
              <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <Clock size={10} />
                {formatExpiry(expiresAt)}
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 4, color: "#16a34a" }}>
                <ShieldCheck size={10} />
                Read Only
              </span>
            </div>

            {/* Revoke button */}
            <button
              onClick={revoke}
              disabled={revoking}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                width: "100%", padding: "10px 0",
                fontSize: 12, fontWeight: 600, color: "#dc2626",
                background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 10,
                cursor: revoking ? "not-allowed" : "pointer",
                opacity: revoking ? 0.6 : 1, transition: "all 0.15s",
              }}
            >
              {revoking
                ? <><Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> Revoking…</>
                : <><Trash2 size={12} /> Revoke Access</>
              }
            </button>
          </div>
        )}
      </div>

      {/* ── Footer — Generate button ── */}
      {!shareUrl && !revoked && (
        <div style={{ padding: "4px 24px 24px", flexShrink: 0 }}>
          <button
            onClick={generate}
            disabled={generating}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              width: "100%", padding: "14px 0",
              fontSize: 14, fontWeight: 700, color: "#fff",
              background: generating
                ? "linear-gradient(135deg, #6366f1, #4f46e5)"
                : "linear-gradient(135deg, #6366f1, #4338ca)",
              border: "none", borderRadius: 12,
              cursor: generating ? "not-allowed" : "pointer",
              opacity: generating ? 0.8 : 1,
              boxShadow: "0 4px 16px rgba(79,70,229,0.35)",
              transition: "all 0.2s",
            }}
            onMouseEnter={e => { if (!generating) e.currentTarget.style.boxShadow = "0 6px 24px rgba(79,70,229,0.5)"; }}
            onMouseLeave={e => { e.currentTarget.style.boxShadow = "0 4px 16px rgba(79,70,229,0.35)"; }}
          >
            {generating
              ? <><Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> Generating Link…</>
              : <><Share2 size={15} /> Generate Share Link</>
            }
          </button>
        </div>
      )}
    </div>
  );
}

// ── Portal wrapper ────────────────────────────────────────────────────────────

export function ShareModal(props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        onClick={props.onClose}
        style={{
          position: "fixed", inset: 0,
          background: "rgba(15,23,42,0.5)",
          backdropFilter: "blur(4px)",
          zIndex: 9990,
        }}
      />

      {/* Centered modal container */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 9991,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 16, pointerEvents: "none",
      }}>
        <div
          onClick={e => e.stopPropagation()}
          style={{
            width: "100%", maxWidth: 480,
            background: "#fff",
            borderRadius: 20,
            boxShadow: "0 24px 80px rgba(0,0,0,0.22), 0 4px 20px rgba(0,0,0,0.1)",
            pointerEvents: "auto",
            animation: "fadeInUp 0.22s ease-out forwards",
            overflow: "hidden",
          }}
        >
          <ModalContent {...props} />
        </div>
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0)    scale(1); }
        }
      `}</style>
    </>,
    document.body
  );
}
