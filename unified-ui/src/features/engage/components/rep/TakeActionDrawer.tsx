'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Phone, Mail, MessageSquare, Building2, DollarSign, Calendar, Pencil, Sparkles } from 'lucide-react';
import type { Task, TaskDetail, TaskNote } from './types/engage.types';
import { getTaskDetail, fetchTaskNotes, saveNotes } from './services/engage.service';
import { useRole } from '@shared/hooks/useRole';

interface TakeActionDrawerProps {
  task: Task;
  onClose: () => void;
  onEmail: (task: Task) => void;
  onMessage: (task: Task) => void;
}

export default function TakeActionDrawer({ task, onClose, onEmail, onMessage }: TakeActionDrawerProps) {
  const router = useRouter();
  const { isManager } = useRole();
  const [detail, setDetail] = useState<TaskDetail | null>(null);
  const [note, setNote] = useState('');
  const [savedNotes, setSavedNotes] = useState<TaskNote[]>([]);
  const [aiLoading, setAiLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    let active = true;
    setAiLoading(true);
    setNote('');
    setSavedNotes([]);

    Promise.all([getTaskDetail(task.taskId), fetchTaskNotes(task.taskId)])
      .then(([data, notes]) => {
        if (active) {
          setDetail(data || null);
          setSavedNotes(notes || []);
          setAiLoading(false);
        }
      })
      .catch((err) => {
        console.error('Error fetching task detail:', err);
        if (active) {
          setAiLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [task.taskId]);

  const handleSaveNote = async () => {
    const trimmed = note.trim();
    if (!trimmed) return;

    try {
      await saveNotes(task.taskId, trimmed);
      const updated = await fetchTaskNotes(task.taskId);
      setSavedNotes(updated || []);
      setNote('');
      if (detail) {
        setDetail({ ...detail, existingNotes: trimmed });
      }
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (err) {
      console.error('Failed to save task notes:', err);
    }
  };

  const scheduledDate = detail
    ? new Date(detail.scheduledDateTime).toLocaleDateString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;

  return (
    <div className="w-[360px] shrink-0 h-full border-l border-gray-200 bg-white flex flex-col overflow-hidden" style={{ boxShadow: '-4px 0 16px rgba(0,0,0,0.08)' }}>
      {/* Header */}
      <div className="px-4 py-3.5 border-b border-gray-200">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-900 leading-snug truncate">
              {detail?.taskTitle ?? task.company}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {task.contactName} &middot; {task.company}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 flex-shrink-0 cursor-pointer transition-colors mt-0.5"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Quick Actions */}
        <div className="px-4 py-3 border-b border-gray-100">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Quick Actions
          </p>
          {!isManager ? (
            <div className="grid grid-cols-2 gap-2 mb-2">
              <button className="flex items-center justify-center gap-1.5 bg-gray-900 text-white text-xs font-semibold py-2.5 rounded-lg hover:bg-gray-800 cursor-pointer transition-colors">
                <Phone size={12} /> Quick Call
              </button>
              <button
                onClick={() => router.push(`/smart-call?contactId=${task.contactId}`)}
                className="flex items-center justify-center gap-1.5 bg-purple-600 text-white text-xs font-semibold py-2.5 rounded-lg hover:bg-purple-700 cursor-pointer transition-colors"
              >
                <Sparkles size={12} /> Smart Call
              </button>
            </div>
          ) : (
            <button className="w-full flex items-center justify-center gap-1.5 bg-gray-900 text-white text-xs font-semibold py-2.5 rounded-lg hover:bg-gray-800 cursor-pointer transition-colors mb-2">
              <Phone size={12} /> Quick Call
            </button>
          )}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onEmail(task)}
              className="flex items-center justify-center gap-1.5 border border-gray-200 text-gray-700 text-xs font-medium py-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <Mail size={12} /> Email
            </button>
            <button
              onClick={() => onMessage(task)}
              className="flex items-center justify-center gap-1.5 border border-gray-200 text-gray-700 text-xs font-medium py-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <MessageSquare size={12} /> Message
            </button>
          </div>
        </div>

        {/* Contact Details */}
        <div className="px-4 py-3 border-b border-gray-100">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Contact Details
          </p>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Building2 size={12} className="text-gray-400 flex-shrink-0" />
              <span>{task.company}</span>
            </div>
            {detail && (
              <>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <DollarSign size={12} className="text-gray-400 flex-shrink-0" />
                  <span>{detail.arrValue}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-600">
                  <Calendar size={12} className="text-gray-400 flex-shrink-0" />
                  <span>{scheduledDate}</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* AI Insight */}
        <div className="px-4 py-3 border-b border-gray-100">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
            AI Insight
          </p>
          {aiLoading ? (
            <div className="space-y-2">
              <div className="skeleton h-3 rounded w-full" />
              <div className="skeleton h-3 rounded w-4/5" />
              <div className="skeleton h-3 rounded w-3/5" />
            </div>
          ) : (
            <p className="text-xs text-gray-700 leading-relaxed">{detail?.aiInsight}</p>
          )}
        </div>

        {/* Recommended Next Steps */}
        {detail?.recommendedNextSteps && detail.recommendedNextSteps.length > 0 && (
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Recommended Next Steps
            </p>
            <ol className="space-y-2">
              {detail.recommendedNextSteps.map((step, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-gray-700">
                  <span className="flex-shrink-0 w-4 h-4 rounded-full bg-purple-600 text-white text-[10px] font-bold flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {/* Recent Activity */}
        {detail?.recentActivity && detail.recentActivity.length > 0 && (
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Recent Activity
            </p>
            <ul className="space-y-2">
              {detail.recentActivity.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
                  <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-purple-400 mt-1.5" />
                  <span>
                    <span className="font-medium text-gray-500">{item.date}</span>
                    {' · '}
                    {item.channelType}: {item.summary}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Notes */}
        <div className="px-4 py-3">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">Notes</p>

          {savedNotes.length > 0 && (
            <div className="mb-3">
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
                Previously Saved Notes ({savedNotes.length})
              </p>
              <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                {savedNotes.map((saved) => {
                  const dateStr = new Date(saved.timestamp || saved.createdAt).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });
                  const initials = saved.authorName
                    .split(' ')
                    .map((part) => part[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase();

                  return (
                    <div
                      key={saved.noteId}
                      className="p-3 rounded-lg bg-gray-50 border border-gray-100 flex flex-col gap-2 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center font-semibold text-[10px] flex-shrink-0">
                            {initials}
                          </div>
                          <span className="font-semibold text-gray-700 truncate">{saved.authorName}</span>
                        </div>
                        <span className="text-[10px] text-gray-400 font-medium flex-shrink-0">{dateStr}</span>
                      </div>
                      <p className="text-gray-600 leading-relaxed break-words whitespace-pre-wrap">{saved.note}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add notes about this task..."
            rows={3}
            className="w-full text-xs text-gray-700 placeholder-gray-400 border border-gray-200 rounded-lg px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <button
            onClick={handleSaveNote}
            disabled={!note.trim()}
            className="mt-2 flex items-center gap-1.5 text-xs font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:bg-purple-300 disabled:cursor-not-allowed px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
          >
            <Pencil size={11} />
            Save Note
          </button>
        </div>
      </div>

      {/* Green Toast Message */}
      {showToast && (
        <div
          className="absolute bottom-4 left-4 right-4 p-3 rounded-xl border flex items-center gap-2 shadow-lg animate-in slide-in-from-bottom duration-300"
          style={{
            backgroundColor: '#ECFDF5',
            borderColor: '#A7F3D0',
            color: '#047857',
            zIndex: 50,
          }}
        >
          <div className="w-2 h-2 rounded-full bg-[#10B981]" />
          <p className="text-xs font-semibold">Note saved successfully</p>
        </div>
      )}
    </div>
  );
}
