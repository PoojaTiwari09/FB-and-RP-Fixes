"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import type { AIGeneratedSummary, BriefType, ShareExpiry } from "@/types/database";
import clsx from "clsx";
import {
  X, Share2, Link, Copy, Check, Trash2,
  Clock, Lock, Loader2, ShieldCheck, AlertCircle,
} from "lucide-react";

// ── Expiry options ────────────────────────────────────────────────────────────

const EXPIRY_OPTIONS: { value: ShareExpiry; label: string; sub: string }[] = [
  { value: "24h",   label: "24 Hours",  sub: "Expires tomorrow" },
  { value: "7d",    label: "7 Days",    sub: "Expires next week" },
  { value: "30d",   label: "30 Days",   sub: "Expires next month" },
  { value: "never", label: "No Expiry", sub: "Link never expires" },
];

function formatExpiry(iso: string | null): string {
  if (!iso) return "Never expires";
  const d = new Date(iso);
  return `Expires ${d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
}

// ── Modal content ─────────────────────────────────────────────────────────────

interface ShareModalProps {
  briefType: BriefType;
  entityId: string;
  summary: AIGeneratedSummary;
  onClose: () => void;
}

function ModalContent({ briefType, entityId, summary, onClose }: ShareModalProps) {
  const [expiry,     setExpiry]     = useState<ShareExpiry>("7d");
  const [generating, setGenerating] = useState(false);
  const [revoking,   setRevoking]   = useState(false);
  const [copied,     setCopied]     = useState(false);
  const [error,      setError]      = useState<string | null>(null);

  // Generated link state
  const [shareUrl,   setShareUrl]   = useState<string | null>(null);
  const [token,      setToken]      = useState<string | null>(null);
  const [expiresAt,  setExpiresAt]  = useState<string | null>(null);
  const [revoked,    setRevoked]    = useState(false);

  const generate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res  = await fetch("/api/share/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityId,
          entityType: briefType,
          briefType,
          expiry,
          summary,
        }),
      });
      const body = await res.json();
      if (!res.ok || !body.success) throw new Error(body.error || "Failed to generate link");
      setShareUrl(body.shareUrl);
      setToken(body.token);
      setExpiresAt(body.expiresAt);
      setRevoked(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  };

  const copy = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const revoke = async () => {
    if (!token) return;
    setRevoking(true);
    try {
      const res  = await fetch("/api/share/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const body = await res.json();
      if (!res.ok || !body.success) throw new Error(body.error || "Failed to revoke");
      setRevoked(true);
      setShareUrl(null);
      setToken(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setRevoking(false);
    }
  };

  return (
    <div className="flex flex-col max-h-[90vh]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-(--border) shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-(--accent)/10 border border-(--accent)/20 flex items-center justify-center">
            <Share2 size={15} className="text-(--accent)" />
          </div>
          <div>
            <p className="text-sm font-bold text-(--text)">Share Brief</p>
            <p className="text-[11px] text-(--text-muted)">Generate a secure read-only link</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-(--text-muted) hover:text-(--text) hover:bg-(--surface) rounded-lg transition-colors"
        >
          <X size={15} />
        </button>
      </div>

      {/* Body */}
      <div className="px-6 py-5 space-y-5 overflow-y-auto">

        {/* Brief preview */}
        <div className="p-3.5 rounded-xl bg-(--surface) border border-(--border)">
          <p className="text-[10px] font-bold uppercase tracking-wider text-(--text-muted) mb-1">Sharing</p>
          <p className="text-sm font-semibold text-(--text) line-clamp-1">{summary.title}</p>
          <p className="text-[11px] text-(--text-muted) mt-0.5 capitalize">{briefType} Brief</p>
        </div>

        {/* Permissions — read only, always */}
        <div className="flex items-center gap-3 p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
          <ShieldCheck size={16} className="text-emerald-400 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-emerald-400">Read Only Access</p>
            <p className="text-[11px] text-(--text-muted)">Recipients can view summaries and evidence — cannot edit, regenerate, or access other records</p>
          </div>
        </div>

        {/* Expiry selector */}
        {!shareUrl && (
          <div>
            <p className="text-xs font-semibold text-(--text) mb-2.5 flex items-center gap-1.5">
              <Clock size={12} className="text-(--text-muted)" />
              Link Expiration
            </p>
            <div className="grid grid-cols-2 gap-2">
              {EXPIRY_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setExpiry(opt.value)}
                  className={clsx(
                    "flex flex-col items-start px-3 py-2.5 rounded-xl border text-left transition-all",
                    expiry === opt.value
                      ? "border-(--accent) bg-(--accent)/8 shadow-[0_0_0_1px_var(--accent)]"
                      : "border-(--border) bg-(--surface) hover:border-(--border-strong)"
                  )}
                >
                  <span className={clsx("text-xs font-semibold", expiry === opt.value ? "text-(--accent)" : "text-(--text)")}>
                    {opt.label}
                  </span>
                  <span className="text-[10px] text-(--text-muted) mt-0.5">{opt.sub}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <AlertCircle size={14} className="text-red-400 shrink-0 mt-0.5" />
            <p className="text-xs text-red-400">{error}</p>
          </div>
        )}

        {/* Revoked state */}
        {revoked && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
            <Lock size={14} className="text-amber-400 shrink-0" />
            <p className="text-xs text-amber-400 font-medium">Link has been revoked. Generate a new one if needed.</p>
          </div>
        )}

        {/* Generated link */}
        {shareUrl && !revoked && (
          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold text-(--text) mb-2 flex items-center gap-1.5">
                <Link size={12} className="text-(--text-muted)" />
                Share Link
              </p>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-(--surface) border border-(--border)">
                <p className="text-xs text-(--text-muted) font-mono flex-1 truncate">{shareUrl}</p>
                <button
                  onClick={copy}
                  className={clsx(
                    "flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all shrink-0",
                    copied
                      ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/20"
                      : "text-(--accent) bg-(--accent)/10 border-(--accent)/20 hover:bg-(--accent)/20"
                  )}
                >
                  {copied ? <><Check size={12} /> Copied!</> : <><Copy size={12} /> Copy</>}
                </button>
              </div>
            </div>

            {/* Expiry info */}
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-(--text-muted) flex items-center gap-1">
                <Clock size={10} />
                {formatExpiry(expiresAt)}
              </span>
              <span className="text-emerald-400 flex items-center gap-1">
                <ShieldCheck size={10} />
                Read Only
              </span>
            </div>

            {/* Revoke */}
            <button
              onClick={revoke}
              disabled={revoking}
              className="flex items-center gap-2 w-full px-3 py-2.5 text-xs font-semibold text-red-400 bg-red-400/5 hover:bg-red-400/10 border border-red-400/20 rounded-xl transition-colors disabled:opacity-50"
            >
              {revoking
                ? <><Loader2 size={12} className="animate-spin" /> Revoking…</>
                : <><Trash2 size={12} /> Revoke Access</>
              }
            </button>
          </div>
        )}
      </div>

      {/* Footer */}
      {!shareUrl && !revoked && (
        <div className="px-6 py-4 border-t border-(--border) shrink-0">
          <button
            onClick={generate}
            disabled={generating}
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-(--accent) text-white text-sm font-semibold rounded-xl hover:bg-blue-600 transition-all hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] disabled:opacity-60"
          >
            {generating
              ? <><Loader2 size={14} className="animate-spin" /> Generating Link…</>
              : <><Share2 size={14} /> Generate Share Link</>
            }
          </button>
        </div>
      )}
    </div>
  );
}

// ── Portal wrapper ────────────────────────────────────────────────────────────

export function ShareModal(props: ShareModalProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9990]"
        onClick={props.onClose}
      />
      {/* Modal */}
      <div className="fixed inset-0 z-[9991] flex items-center justify-center p-4 pointer-events-none">
        <div
          className="w-full max-w-md bg-(--bg2) border border-(--border-strong) rounded-2xl shadow-[0_24px_64px_rgba(0,0,0,0.5)] pointer-events-auto animate-[fadeInUp_0.2s_ease-out_forwards]"
          onClick={e => e.stopPropagation()}
        >
          <ModalContent {...props} />
        </div>
      </div>
    </>,
    document.body
  );
}
