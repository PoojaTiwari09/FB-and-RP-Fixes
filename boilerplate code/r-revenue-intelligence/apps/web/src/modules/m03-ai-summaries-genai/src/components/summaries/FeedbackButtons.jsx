import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { ThumbsUp, ThumbsDown, Flag, X, Check, Loader2 } from "lucide-react";

// ── Toast notification ────────────────────────────────────────────────────────

function Toast({ message, type }) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 2800);
    return () => clearTimeout(t);
  }, []);
  if (!visible) return null;

  const isSuccess = type === "success";
  return createPortal(
    <div style={{
      position: "fixed",
      bottom: 24,
      right: 24,
      zIndex: 99999,
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "10px 16px",
      borderRadius: 10,
      border: `1px solid ${isSuccess ? "#a7f3d0" : "#fecaca"}`,
      background: isSuccess ? "#ecfdf5" : "#fef2f2",
      color: isSuccess ? "#059669" : "#dc2626",
      fontSize: 13,
      fontWeight: 600,
      boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
      animation: "fadeInUp 0.2s ease-out",
    }}>
      {isSuccess ? <Check size={14} /> : <X size={14} />}
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

function ThumbsDownModal({ onSubmit, onClose }) {
  const [reason,     setReason]     = useState("");
  const [comment,    setComment]    = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    await onSubmit(reason, comment);
    setSubmitting(false);
  };

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.45)",
          backdropFilter: "blur(4px)",
          zIndex: 9990,
        }}
      />
      {/* Modal */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 9991,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 16, pointerEvents: "none",
      }}>
        <div
          onClick={e => e.stopPropagation()}
          style={{
            width: "100%", maxWidth: 380,
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 16,
            boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
            pointerEvents: "auto",
            animation: "fadeInUp 0.2s ease-out",
          }}
        >
          {/* Header */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "16px 20px", borderBottom: "1px solid #f3f4f6",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <ThumbsDown size={15} style={{ color: "#ef4444" }} />
              <p style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>Why wasn't this helpful?</p>
            </div>
            <button
              onClick={onClose}
              style={{
                width: 26, height: 26, borderRadius: 6, border: "1px solid #e5e7eb",
                background: "#f9fafb", cursor: "pointer", display: "flex",
                alignItems: "center", justifyContent: "center", color: "#6b7280",
              }}
            >
              <X size={13} />
            </button>
          </div>

          {/* Body */}
          <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {DOWN_REASONS.map(r => (
                <label
                  key={r.value}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "9px 12px", borderRadius: 8,
                    border: `1px solid ${reason === r.value ? "#fca5a5" : "#e5e7eb"}`,
                    background: reason === r.value ? "#fef2f2" : "#fff",
                    color: reason === r.value ? "#ef4444" : "#374151",
                    cursor: "pointer", transition: "all 0.1s",
                  }}
                >
                  <input
                    type="radio" name="down_reason" value={r.value}
                    checked={reason === r.value}
                    onChange={() => setReason(r.value)}
                    style={{ accentColor: "#ef4444" }}
                  />
                  <span style={{ fontSize: 13 }}>{r.label}</span>
                </label>
              ))}
            </div>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Additional comments (optional)…"
              rows={2}
              style={{
                width: "100%", resize: "none", fontSize: 13,
                background: "#f9fafb", border: "1px solid #e5e7eb",
                borderRadius: 8, padding: "8px 12px",
                color: "#374151", outline: "none",
                fontFamily: "inherit", boxSizing: "border-box",
              }}
            />
          </div>

          {/* Footer */}
          <div style={{ padding: "0 20px 16px", display: "flex", gap: 8 }}>
            <button
              onClick={onClose}
              style={{
                flex: 1, padding: "9px 0", fontSize: 13, fontWeight: 600,
                background: "#f9fafb", border: "1px solid #e5e7eb",
                borderRadius: 8, cursor: "pointer", color: "#6b7280",
              }}
            >
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={submitting}
              style={{
                flex: 1, padding: "9px 0", fontSize: 13, fontWeight: 600,
                background: submitting ? "#fca5a5" : "#ef4444",
                border: "none", borderRadius: 8, cursor: submitting ? "not-allowed" : "pointer",
                color: "#fff", display: "flex", alignItems: "center",
                justifyContent: "center", gap: 6, transition: "background 0.15s",
              }}
            >
              {submitting && <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />}
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
  { value: "hallucination",       label: "Hallucinated content" },
  { value: "wrong_transcript",    label: "Wrong transcript interpretation" },
  { value: "incorrect_sentiment", label: "Incorrect sentiment" },
  { value: "missing_context",     label: "Missing context" },
  { value: "wrong_stakeholder",   label: "Wrong stakeholder mapping" },
  { value: "incorrect_risk",      label: "Incorrect risk assessment" },
];

function FlagModal({ bulletText, onSubmit, onClose }) {
  const [reason,     setReason]     = useState("");
  const [comment,    setComment]    = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!reason) return;
    setSubmitting(true);
    const type = reason === "hallucination" ? "hallucination" : "inaccuracy_flag";
    await onSubmit(type, reason, comment);
    setSubmitting(false);
  };

  return createPortal(
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.45)",
          backdropFilter: "blur(4px)",
          zIndex: 9990,
        }}
      />
      {/* Modal */}
      <div style={{
        position: "fixed", inset: 0, zIndex: 9991,
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 16, pointerEvents: "none",
      }}>
        <div
          onClick={e => e.stopPropagation()}
          style={{
            width: "100%", maxWidth: 400,
            background: "#fff",
            border: "1px solid #e5e7eb",
            borderRadius: 16,
            boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
            pointerEvents: "auto",
            animation: "fadeInUp 0.2s ease-out",
          }}
        >
          {/* Header */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "16px 20px", borderBottom: "1px solid #f3f4f6",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Flag size={15} style={{ color: "#f59e0b" }} />
              <p style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>Flag Inaccuracy</p>
            </div>
            <button
              onClick={onClose}
              style={{
                width: 26, height: 26, borderRadius: 6, border: "1px solid #e5e7eb",
                background: "#f9fafb", cursor: "pointer", display: "flex",
                alignItems: "center", justifyContent: "center", color: "#6b7280",
              }}
            >
              <X size={13} />
            </button>
          </div>

          {/* Body */}
          <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
            {/* Bullet preview */}
            {bulletText && (
              <div style={{
                padding: "8px 12px", background: "#fafafa",
                border: "1px solid #e5e7eb", borderRadius: 8,
              }}>
                <p style={{ fontSize: 10, color: "#9ca3af", marginBottom: 3 }}>Flagging insight:</p>
                <p style={{
                  fontSize: 12, color: "#374151", fontStyle: "italic",
                  lineHeight: 1.5, overflow: "hidden",
                  display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                }}>"{bulletText}"</p>
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {FLAG_REASONS.map(r => (
                <label
                  key={r.value}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "9px 12px", borderRadius: 8,
                    border: `1px solid ${reason === r.value ? "#fde68a" : "#e5e7eb"}`,
                    background: reason === r.value ? "#fffbeb" : "#fff",
                    color: reason === r.value ? "#d97706" : "#374151",
                    cursor: "pointer", transition: "all 0.1s",
                  }}
                >
                  <input
                    type="radio" name="flag_reason" value={r.value}
                    checked={reason === r.value}
                    onChange={() => setReason(r.value)}
                    style={{ accentColor: "#f59e0b" }}
                  />
                  <span style={{ fontSize: 13 }}>{r.label}</span>
                </label>
              ))}
            </div>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Additional details (optional)…"
              rows={2}
              style={{
                width: "100%", resize: "none", fontSize: 13,
                background: "#f9fafb", border: "1px solid #e5e7eb",
                borderRadius: 8, padding: "8px 12px",
                color: "#374151", outline: "none",
                fontFamily: "inherit", boxSizing: "border-box",
              }}
            />
          </div>

          {/* Footer */}
          <div style={{ padding: "0 20px 16px", display: "flex", gap: 8 }}>
            <button
              onClick={onClose}
              style={{
                flex: 1, padding: "9px 0", fontSize: 13, fontWeight: 600,
                background: "#f9fafb", border: "1px solid #e5e7eb",
                borderRadius: 8, cursor: "pointer", color: "#6b7280",
              }}
            >
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={submitting || !reason}
              style={{
                flex: 1, padding: "9px 0", fontSize: 13, fontWeight: 600,
                background: submitting || !reason ? "#fde68a" : "#f59e0b",
                border: "none", borderRadius: 8,
                cursor: submitting || !reason ? "not-allowed" : "pointer",
                color: "#fff", display: "flex", alignItems: "center",
                justifyContent: "center", gap: 6, transition: "background 0.15s",
              }}
            >
              {submitting
                ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
                : <Flag size={13} />
              }
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

export function FeedbackButtons({ ctx }) {
  const [state,      setState]      = useState("idle"); // "idle" | "up" | "down" | "flagged"
  const [showDown,   setShowDown]   = useState(false);
  const [showFlag,   setShowFlag]   = useState(false);
  const [toast,      setToast]      = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (feedbackType, feedbackReason, feedbackComment) => {
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
      setToast({ msg: "Feedback submitted!", type: "success" });
    } catch {
      setToast({ msg: "Failed to submit feedback", type: "error" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleUp = async () => {
    if (state === "up" || submitting) return;
    setState("up");
    await submit("thumbs_up");
  };

  const handleDown = () => {
    if (state === "down" || submitting) return;
    setShowDown(true);
  };

  const handleFlag = () => {
    if (submitting) return;
    setShowFlag(true);
  };

  return (
    <>
      {/* Toast */}
      {toast && <Toast key={toast.msg + Date.now()} message={toast.msg} type={toast.type} />}

      {/* Thumbs-down modal */}
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

      {/* Flag modal */}
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

      {/* Inline buttons — always visible, compact */}
      <span style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 2,
        marginLeft: 8,
        verticalAlign: "middle",
      }}>
        {/* Thumbs up */}
        <button
          onClick={handleUp}
          disabled={submitting}
          title="Helpful"
          style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 22, height: 22, borderRadius: 6,
            border: state === "up" ? "1px solid #a7f3d0" : "1px solid transparent",
            background: state === "up" ? "#ecfdf5" : "transparent",
            color: state === "up" ? "#10b981" : "#9ca3af",
            cursor: submitting ? "not-allowed" : "pointer",
            transition: "all 0.15s",
            padding: 0,
          }}
          onMouseEnter={e => {
            if (state !== "up") {
              e.currentTarget.style.background = "#ecfdf5";
              e.currentTarget.style.color = "#10b981";
              e.currentTarget.style.borderColor = "#a7f3d0";
            }
          }}
          onMouseLeave={e => {
            if (state !== "up") {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "#9ca3af";
              e.currentTarget.style.borderColor = "transparent";
            }
          }}
        >
          <ThumbsUp size={12} />
        </button>

        {/* Thumbs down */}
        <button
          onClick={handleDown}
          disabled={submitting}
          title="Not helpful"
          style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 22, height: 22, borderRadius: 6,
            border: state === "down" ? "1px solid #fca5a5" : "1px solid transparent",
            background: state === "down" ? "#fef2f2" : "transparent",
            color: state === "down" ? "#ef4444" : "#9ca3af",
            cursor: submitting ? "not-allowed" : "pointer",
            transition: "all 0.15s",
            padding: 0,
          }}
          onMouseEnter={e => {
            if (state !== "down") {
              e.currentTarget.style.background = "#fef2f2";
              e.currentTarget.style.color = "#ef4444";
              e.currentTarget.style.borderColor = "#fca5a5";
            }
          }}
          onMouseLeave={e => {
            if (state !== "down") {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "#9ca3af";
              e.currentTarget.style.borderColor = "transparent";
            }
          }}
        >
          <ThumbsDown size={12} />
        </button>

        {/* Flag */}
        <button
          onClick={handleFlag}
          disabled={submitting}
          title="Flag inaccuracy"
          style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 22, height: 22, borderRadius: 6,
            border: state === "flagged" ? "1px solid #fde68a" : "1px solid transparent",
            background: state === "flagged" ? "#fffbeb" : "transparent",
            color: state === "flagged" ? "#f59e0b" : "#9ca3af",
            cursor: submitting ? "not-allowed" : "pointer",
            transition: "all 0.15s",
            padding: 0,
          }}
          onMouseEnter={e => {
            if (state !== "flagged") {
              e.currentTarget.style.background = "#fffbeb";
              e.currentTarget.style.color = "#f59e0b";
              e.currentTarget.style.borderColor = "#fde68a";
            }
          }}
          onMouseLeave={e => {
            if (state !== "flagged") {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "#9ca3af";
              e.currentTarget.style.borderColor = "transparent";
            }
          }}
        >
          <Flag size={12} />
        </button>
      </span>
    </>
  );
}
