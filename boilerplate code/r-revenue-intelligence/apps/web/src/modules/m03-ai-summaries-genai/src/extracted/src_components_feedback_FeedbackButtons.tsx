"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import type { BriefType, FeedbackType } from "@/types/database";
import clsx from "clsx";
import { ThumbsUp, ThumbsDown, Flag, X, Check, Loader2 } from "lucide-react";

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ message, type }: { message: string; type: "success" | "error" }) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 2500);
    return () => clearTimeout(t);
  }, []);
  if (!visible) return null;
  return createPortal(
    <div className={clsx(
      "fixed bottom-6 right-6 z-[99999] flex items-center gap-2 px-4 py-2.5 rounded-xl border shadow-xl text-sm font-medium",
      "animate-[fadeInUp_0.2s_ease-out_forwards]",
      type === "success"
        ? "bg-emerald-500/15 border-emerald-500/25 text-emerald-400"
        : "bg-red-500/15 border-red-500/25 text-red-400"
    )}>
      {type === "success" ? <Check size={14} /> : <X size={14} />}
      {message}
    </div>,
    document.body
  );
}

// ── Thumbs-down modal ─────────────────────────────────────────────────────────

const DOWN_REASONS = [
  { value: "too_generic",        label: "Too generic" },
  { value: "missing_details",    label: "Missing details" },
  { value: "wrong_conclusion",   label: "Wrong conclusion" },
  { value: "poor_summary",       label: "Poor summary" },
  { value: "incorrect_analysis", label: "Incorrect analysis" },
];

function ThumbsDownModal({
  onSubmit, onClose,
}: {
  onSubmit: (reason: string, comment: string) => Promise<void>;
  onClose: () => void;
}) {
  const [reason,    setReason]    = useState("");
  const [comment,   setComment]   = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    await onSubmit(reason, comment);
    setSubmitting(false);
  };

  return createPortal(
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9990]" onClick={onClose} />
      <div className="fixed inset-0 z-[9991] flex items-center justify-center p-4 pointer-events-none">
        <div
          className="w-full max-w-sm bg-(--bg2) border border-(--border-strong) rounded-2xl shadow-2xl pointer-events-auto animate-[fadeInUp_0.2s_ease-out_forwards]"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-(--border)">
            <div className="flex items-center gap-2">
              <ThumbsDown size={14} className="text-red-400" />
              <p className="text-sm font-bold text-(--text)">Why wasn't this helpful?</p>
            </div>
            <button onClick={onClose} className="p-1 text-(--text-muted) hover:text-(--text) rounded-lg transition-colors">
              <X size={13} />
            </button>
          </div>
          <div className="px-5 py-4 space-y-3">
            <div className="space-y-1.5">
              {DOWN_REASONS.map(r => (
                <label key={r.value} className={clsx(
                  "flex items-center gap-2.5 px-3 py-2 rounded-lg border cursor-pointer transition-colors",
                  reason === r.value
                    ? "border-red-400/30 bg-red-400/8 text-red-400"
                    : "border-(--border) hover:border-(--border-strong) text-(--text-muted) hover:text-(--text)"
                )}>
                  <input
                    type="radio" name="reason" value={r.value}
                    checked={reason === r.value}
                    onChange={() => setReason(r.value)}
                    className="accent-red-400"
                  />
                  <span className="text-sm">{r.label}</span>
                </label>
              ))}
            </div>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Additional comments (optional)…"
              rows={2}
              className="w-full text-sm bg-(--surface) border border-(--border) rounded-lg px-3 py-2 text-(--text) placeholder-(--text-muted) focus:outline-none focus:border-(--accent) resize-none"
            />
          </div>
          <div className="px-5 pb-4 flex gap-2">
            <button onClick={onClose} className="flex-1 px-3 py-2 text-sm text-(--text-muted) bg-(--surface) border border-(--border) rounded-lg hover:text-(--text) transition-colors">
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={submitting}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors disabled:opacity-60"
            >
              {submitting ? <Loader2 size={13} className="animate-spin" /> : null}
              Submit
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}

// ── Flag inaccuracy modal ─────────────────────────────────────────────────────

const FLAG_REASONS = [
  { value: "hallucination",          label: "Hallucinated content" },
  { value: "wrong_transcript",       label: "Wrong transcript interpretation" },
  { value: "incorrect_sentiment",    label: "Incorrect sentiment" },
  { value: "missing_context",        label: "Missing context" },
  { value: "wrong_stakeholder",      label: "Wrong stakeholder mapping" },
  { value: "incorrect_risk",         label: "Incorrect risk assessment" },
];

function FlagModal({
  bulletText,
  onSubmit, onClose,
}: {
  bulletText: string;
  onSubmit: (type: FeedbackType, reason: string, comment: string) => Promise<void>;
  onClose: () => void;
}) {
  const [reason,     setReason]     = useState("");
  const [comment,    setComment]    = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!reason) return;
    setSubmitting(true);
    const type: FeedbackType = reason === "hallucination" ? "hallucination" : "inaccuracy_flag";
    await onSubmit(type, reason, comment);
    setSubmitting(false);
  };

  return createPortal(
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9990]" onClick={onClose} />
      <div className="fixed inset-0 z-[9991] flex items-center justify-center p-4 pointer-events-none">
        <div
          className="w-full max-w-sm bg-(--bg2) border border-(--border-strong) rounded-2xl shadow-2xl pointer-events-auto animate-[fadeInUp_0.2s_ease-out_forwards]"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-(--border)">
            <div className="flex items-center gap-2">
              <Flag size={14} className="text-amber-400" />
              <p className="text-sm font-bold text-(--text)">Flag Inaccuracy</p>
            </div>
            <button onClick={onClose} className="p-1 text-(--text-muted) hover:text-(--text) rounded-lg transition-colors">
              <X size={13} />
            </button>
          </div>
          <div className="px-5 py-4 space-y-3">
            {/* Bullet preview */}
            <div className="p-2.5 rounded-lg bg-(--surface) border border-(--border)">
              <p className="text-[11px] text-(--text-muted) mb-1">Flagging insight:</p>
              <p className="text-xs text-(--text) line-clamp-2 italic">"{bulletText}"</p>
            </div>
            <div className="space-y-1.5">
              {FLAG_REASONS.map(r => (
                <label key={r.value} className={clsx(
                  "flex items-center gap-2.5 px-3 py-2 rounded-lg border cursor-pointer transition-colors",
                  reason === r.value
                    ? "border-amber-400/30 bg-amber-400/8 text-amber-400"
                    : "border-(--border) hover:border-(--border-strong) text-(--text-muted) hover:text-(--text)"
                )}>
                  <input
                    type="radio" name="flag_reason" value={r.value}
                    checked={reason === r.value}
                    onChange={() => setReason(r.value)}
                    className="accent-amber-400"
                  />
                  <span className="text-sm">{r.label}</span>
                </label>
              ))}
            </div>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Additional details (optional)…"
              rows={2}
              className="w-full text-sm bg-(--surface) border border-(--border) rounded-lg px-3 py-2 text-(--text) placeholder-(--text-muted) focus:outline-none focus:border-(--accent) resize-none"
            />
          </div>
          <div className="px-5 pb-4 flex gap-2">
            <button onClick={onClose} className="flex-1 px-3 py-2 text-sm text-(--text-muted) bg-(--surface) border border-(--border) rounded-lg hover:text-(--text) transition-colors">
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={submitting || !reason}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-semibold text-white bg-amber-500 hover:bg-amber-600 rounded-lg transition-colors disabled:opacity-60"
            >
              {submitting ? <Loader2 size={13} className="animate-spin" /> : <Flag size={13} />}
              Flag
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}

// ── Main FeedbackButtons component ───────────────────────────────────────────

export interface FeedbackContext {
  entityId: string;
  entityType: BriefType;
  briefType: BriefType;
  sectionName: string;
  bulletId: string;
  bulletText: string;
}

interface FeedbackButtonsProps {
  ctx: FeedbackContext;
}

type LocalState = "idle" | "up" | "down" | "flagged";

export function FeedbackButtons({ ctx }: FeedbackButtonsProps) {
  const [state,       setState]       = useState<LocalState>("idle");
  const [showDown,    setShowDown]    = useState(false);
  const [showFlag,    setShowFlag]    = useState(false);
  const [toast,       setToast]       = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [submitting,  setSubmitting]  = useState(false);

  const submit = async (
    feedbackType: FeedbackType,
    feedbackReason?: string,
    feedbackComment?: string
  ) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entityId:        ctx.entityId,
          entityType:      ctx.entityType,
          briefType:       ctx.briefType,
          sectionName:     ctx.sectionName,
          bulletId:        ctx.bulletId,
          bulletText:      ctx.bulletText,
          feedbackType,
          feedbackReason:  feedbackReason  ?? null,
          feedbackComment: feedbackComment ?? null,
        }),
      });
      const body = await res.json();
      if (!body.success) throw new Error(body.error);
      setToast({ msg: "Feedback submitted", type: "success" });
    } catch {
      setToast({ msg: "Failed to submit feedback", type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUp = async () => {
    if (state === "up") return;
    setState("up");
    await submit("thumbs_up");
  };

  const handleDown = () => {
    if (state === "down") return;
    setShowDown(true);
  };

  const handleFlag = () => {
    setShowFlag(true);
  };

  return (
    <>
      {toast && <Toast message={toast.msg} type={toast.type} />}

      {showDown && (
        <ThumbsDownModal
          onSubmit={async (reason, comment) => {
            setShowDown(false);
            setState("down");
            await submit("thumbs_down", reason, comment);
          }}
          onClose={() => setShowDown(false)}
        />
      )}

      {showFlag && (
        <FlagModal
          bulletText={ctx.bulletText}
          onSubmit={async (type, reason, comment) => {
            setShowFlag(false);
            setState("flagged");
            await submit(type, reason, comment);
          }}
          onClose={() => setShowFlag(false)}
        />
      )}

      <span className="inline-flex items-center gap-0.5 ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
        {/* Thumbs up */}
        <button
          onClick={handleUp}
          disabled={submitting}
          title="Helpful"
          className={clsx(
            "p-1 rounded-md transition-all duration-100",
            state === "up"
              ? "text-emerald-400 bg-emerald-400/15"
              : "text-(--text-muted) hover:text-emerald-400 hover:bg-emerald-400/10"
          )}
        >
          <ThumbsUp size={11} />
        </button>

        {/* Thumbs down */}
        <button
          onClick={handleDown}
          disabled={submitting}
          title="Not helpful"
          className={clsx(
            "p-1 rounded-md transition-all duration-100",
            state === "down"
              ? "text-red-400 bg-red-400/15"
              : "text-(--text-muted) hover:text-red-400 hover:bg-red-400/10"
          )}
        >
          <ThumbsDown size={11} />
        </button>

        {/* Flag */}
        <button
          onClick={handleFlag}
          disabled={submitting}
          title="Flag inaccuracy"
          className={clsx(
            "p-1 rounded-md transition-all duration-100",
            state === "flagged"
              ? "text-amber-400 bg-amber-400/15"
              : "text-(--text-muted) hover:text-amber-400 hover:bg-amber-400/10"
          )}
        >
          <Flag size={11} />
        </button>
      </span>
    </>
  );
}
