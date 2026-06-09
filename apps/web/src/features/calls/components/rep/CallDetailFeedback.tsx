'use client';

import { useState, useEffect } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  Zap,
  ChevronDown,
  Loader2,
  FileX,
  Check,
  Loader,
  TrendingUp,
  MessageSquare,
  Target,
} from 'lucide-react';
import { fetchFeedback, acknowledgeFeedback, updateActionItem } from '@calls/services/callsApi';
import type { FeedbackData, ActionItem } from '@calls/data/mockData';

const TAG_COLORS: Record<string, string> = {
  'Best Practice': 'bg-blue-100 text-blue-700 border-blue-200',
  'Needs Coaching': 'bg-orange-100 text-orange-700 border-orange-200',
  Risk: 'bg-red-100 text-red-700 border-red-200',
};

const STATUS_OPTIONS = ['Not Started', 'In Progress', 'Completed'];
const STATUS_COLORS: Record<string, string> = {
  'Not Started': 'text-gray-500',
  'In Progress': 'text-blue-600',
  Completed: 'text-green-600',
};

// ─── Feedback Card ─────────────────────────────────────────────────────────────



function FeedbackCard({
  title,
  icon,
  iconBg,
  items,
  isText,
  text,
}: {
  title: string;
  icon: React.ReactNode;
  iconBg: string;
  items?: string[];
  isText?: boolean;
  text?: string;
}) {
  const isStrengths = title === 'Strengths';
  const isImprovement = title === 'Improvement Areas';
  const isRecommended = title === 'Recommended Actions';

  return (
    <div className="bg-white border border-gray-200/60 rounded-xl p-5 shadow-xs hover:shadow-sm transition-shadow flex flex-col h-full">
      <div className="flex items-center gap-2.5 mb-3">
        <span className={`p-2 rounded-lg ${iconBg} flex items-center justify-center shrink-0`}>
          {icon}
        </span>
        <h3 className="text-lg font-semibold text-gray-800 font-serif">{title}</h3>
      </div>
      {isText ? (
        <p className="text-sm text-gray-600 leading-relaxed font-sans flex-1">{text}</p>
      ) : (
        <ul className="space-y-2 flex-1">
          {(items ?? []).map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-700 leading-relaxed">
              {isStrengths && (
                <CheckCircle2 size={15} className="text-emerald-500 mt-0.5 shrink-0" />
              )}
              {isImprovement && (
                <AlertTriangle size={15} className="text-amber-500 mt-0.5 shrink-0" />
              )}
              {isRecommended && (
                <span className="w-1.5 h-1.5 rounded-full bg-purple-500 mt-2 shrink-0" />
              )}
              {!isStrengths && !isImprovement && !isRecommended && (
                <span className="mt-1 shrink-0 text-gray-300 text-xs">•</span>
              )}
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ─── Acknowledgement Section ──────────────────────────────────────────────────

const DEFAULT_ACKNOWLEDGEMENT: FeedbackData['acknowledgement'] = {
  isAcknowledged: false,
  acknowledgedAt: null,
  repResponse: null,
};

function AcknowledgementSection({
  callId,
  initialData,
}: {
  callId: string;
  initialData?: FeedbackData['acknowledgement'];
}) {
  const safe = initialData ?? DEFAULT_ACKNOWLEDGEMENT;
  const [ack, setAck] = useState(safe);
  const [response, setResponse] = useState(safe.repResponse ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleAcknowledge = async () => {
    setSaving(true);
    const result = await acknowledgeFeedback(callId, response.trim() || undefined);
    setAck({ isAcknowledged: true, acknowledgedAt: result.acknowledgedAt, repResponse: response.trim() || null });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleSaveResponse = async () => {
    setSaving(true);
    await acknowledgeFeedback(callId, response.trim() || undefined);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  function formatAckDate(iso: string) {
    const d = new Date(iso);
    const y = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    return `${y}-${mo}-${da} ${time}`;
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
      <h3 className="text-xl font-semibold text-gray-800 mb-4 font-serif">Acknowledgement</h3>

      <div className="space-y-4">
        {/* Banner — green when acknowledged, neutral prompt when not */}
        {ack.isAcknowledged ? (
          <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3">
            <div className="flex items-center gap-2">
              <Check size={15} className="text-green-600 shrink-0" />
              <span className="text-sm font-semibold text-green-700">Feedback Acknowledged</span>
            </div>
            {ack.acknowledgedAt && (
              <p className="text-sm text-green-600 mt-0.5 pl-[23px]">
                Acknowledged on {formatAckDate(ack.acknowledgedAt)}
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            Review the feedback above and acknowledge that you&apos;ve read it.
          </p>
        )}

        {/* Response textarea — always editable */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Response (Optional)
          </label>
          <textarea
            value={response}
            onChange={(e) => setResponse(e.target.value.slice(0, 1000))}
            rows={5}
            placeholder="Share your thoughts on this feedback..."
            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder:text-gray-400"
          />
          <div className="flex justify-end mt-1">
            <span className="text-xs text-gray-400">{response.length}/1000</span>
          </div>
        </div>

        {/* Action button */}
        {ack.isAcknowledged ? (
          <button
            onClick={handleSaveResponse}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-60 transition-colors"
          >
            {saving && <Loader size={14} className="animate-spin" />}
            Save Response
          </button>
        ) : (
          <button
            onClick={handleAcknowledge}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 disabled:opacity-60 transition-colors"
          >
            {saving ? <Loader size={14} className="animate-spin" /> : <Check size={14} />}
            Acknowledge Feedback
          </button>
        )}
      </div>

      {/* Toast */}
      {saved && (
        <div className="fixed bottom-6 right-6 bg-green-600 text-white text-sm px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2 z-50">
          <CheckCircle2 size={15} />
          Response saved successfully
        </div>
      )}
    </div>
  );
}

// ─── Action Items ─────────────────────────────────────────────────────────────

function ActionItemCard({ callId, item }: { callId: string; item: ActionItem }) {
  const normalizeStatus = (s: string) => {
    const lower = s.toLowerCase();
    if (lower === 'completed' || lower === 'done') return 'Completed';
    if (lower === 'in progress' || lower === 'in_progress') return 'In Progress';
    if (lower === 'pending' || lower === 'not started' || lower === 'not_started') return 'Not Started';
    return STATUS_OPTIONS.includes(s) ? s : 'Not Started';
  };
  const [status, setStatus] = useState(normalizeStatus(item.status));
  const [notes, setNotes] = useState(item.notes);
  const [updating, setUpdating] = useState(false);
  const [toast, setToast] = useState(false);

  const handleStatusChange = async (newStatus: string) => {
    setStatus(newStatus);
    setUpdating(true);
    await updateActionItem(callId, item.id, newStatus, notes);
    setUpdating(false);
    setToast(true);
    setTimeout(() => setToast(false), 2500);
  };

  return (
    <div className="border border-gray-200 rounded-xl p-4 space-y-3 bg-white">
      {/* Title + Status */}
      <div className="flex items-start justify-between gap-3">
        <h4 className="text-sm font-semibold text-gray-800">{item.title}</h4>
        <div className="relative shrink-0">
          <select
            value={status}
            onChange={(e) => handleStatusChange(e.target.value)}
            disabled={updating}
            className={`appearance-none pl-2 pr-6 py-1 text-xs font-medium border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-400 cursor-pointer ${STATUS_COLORS[status]}`}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <ChevronDown size={11} className="absolute right-1.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600">{item.description}</p>

      {/* Meta */}
      <div className="flex flex-wrap items-center gap-1 text-sm text-gray-500">
        <span>Due: {item.dueDate}</span>
        <span className="text-gray-300">•</span>
        <span>Assigned by: <span className="text-gray-700">{item.assignedBy}</span></span>
      </div>

      {/* Notes */}
      <div className="flex flex-wrap gap-1 text-sm text-gray-600">
        <span className="font-medium text-gray-700">Notes:</span>
        <input
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={() => updateActionItem(callId, item.id, status, notes)}
          placeholder="Add notes..."
          className="flex-1 min-w-0 text-sm text-gray-600 bg-transparent border-none outline-none placeholder:text-gray-400"
        />
      </div>

      {/* Status update toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 bg-blue-600 text-white text-sm px-4 py-2.5 rounded-lg shadow-lg flex items-center gap-2 z-50">
          <CheckCircle2 size={15} />
          Action item updated
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CallDetailFeedback({ callId }: { callId: string }) {
  const [feedback, setFeedback] = useState<FeedbackData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeedback(callId)
      .then(setFeedback)
      .catch((err) => {
        console.error('Failed to load feedback:', err);
        setFeedback(null);
      })
      .finally(() => setLoading(false));
  }, [callId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 size={24} className="text-blue-400 animate-spin" />
      </div>
    );
  }

  if (!feedback) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2">
        <FileX size={32} className="text-gray-300" />
        <p className="text-sm">No feedback available for this call.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 overflow-y-auto px-6 pt-3 pb-8">
      <div className="max-w-5xl mx-auto w-full">
        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {(feedback.tags ?? []).map((tag) => {
            const isBestPractice = tag === 'Best Practice';
            const isNeedsCoaching = tag === 'Needs Coaching';
            const badgeClass = isBestPractice 
              ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
              : isNeedsCoaching 
              ? 'bg-amber-50 text-amber-700 border-amber-100' 
              : 'bg-rose-50 text-rose-700 border-rose-100';
            return (
              <span
                key={tag}
                className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeClass}`}
              >
                {tag}
              </span>
            );
          })}
        </div>

        {/* Cards Grid */}
        <div className="space-y-4 mb-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <FeedbackCard
              title="Strengths"
              icon={<TrendingUp size={18} className="text-emerald-600" />}
              iconBg="bg-emerald-50"
              items={feedback.strengths ?? []}
            />
            <FeedbackCard
              title="Improvement Areas"
              icon={<AlertTriangle size={18} className="text-amber-600" />}
              iconBg="bg-amber-50"
              items={feedback.improvementAreas ?? []}
            />
          </div>

          <FeedbackCard
            title="Coaching Notes"
            icon={<MessageSquare size={18} className="text-blue-600" />}
            iconBg="bg-blue-50"
            isText
            text={feedback.coachingNotes ?? ''}
          />

          <FeedbackCard
            title="Recommended Actions"
            icon={<Target size={18} className="text-purple-600" />}
            iconBg="bg-purple-50"
            items={feedback.recommendedActions ?? []}
          />
        </div>

        {/* Acknowledgement */}
        <div className="mb-4">
          <AcknowledgementSection callId={callId} initialData={feedback.acknowledgement} />
        </div>

      {/* Action Items */}
      <div className="mt-8">
        <h3 className="text-xl font-semibold text-gray-800 mb-4 font-serif">
          Action Items
          <span className="ml-2 text-xs font-normal text-gray-400 font-sans">
            ({(feedback.actionItems ?? []).length})
          </span>
        </h3>
        {(feedback.actionItems ?? []).length === 0 ? (
          <p className="text-sm text-gray-400 italic">No action items assigned.</p>
        ) : (
          <div className="space-y-3">
            {(feedback.actionItems ?? []).map((item) => (
              <ActionItemCard key={item.id} callId={callId} item={item} />
            ))}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
