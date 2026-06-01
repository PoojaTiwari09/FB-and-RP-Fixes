'use client';

import { useEffect, useState } from 'react';
import { X, Phone, Mail, MessageSquare, Building2, DollarSign, Calendar, Pencil } from 'lucide-react';
import type { Task } from './types/engage.types';
import { MOCK_TASK_DETAILS } from './mocks/engage.mock';

interface TakeActionDrawerProps {
  task: Task;
  onClose: () => void;
  onEmail: (task: Task) => void;
  onMessage: (task: Task) => void;
}

export default function TakeActionDrawer({ task, onClose, onEmail, onMessage }: TakeActionDrawerProps) {
  const detail = MOCK_TASK_DETAILS[task.taskId];
  const [note, setNote] = useState(detail?.existingNotes ?? '');
  const [aiLoading, setAiLoading] = useState(true);
  const [noteSaved, setNoteSaved] = useState(false);

  useEffect(() => {
    setAiLoading(true);
    setNote(MOCK_TASK_DETAILS[task.taskId]?.existingNotes ?? '');
    const t = setTimeout(() => setAiLoading(false), 1400);
    return () => clearTimeout(t);
  }, [task.taskId]);

  const handleSaveNote = () => {
    setNoteSaved(true);
    setTimeout(() => setNoteSaved(false), 2000);
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
    <div className="fixed right-0 top-0 h-full w-[360px] border-l border-gray-200 bg-white flex flex-col overflow-hidden z-40" style={{ boxShadow: '-4px 0 16px rgba(0,0,0,0.08)' }}>
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
          <button className="w-full flex items-center justify-center gap-1.5 bg-gray-900 text-white text-xs font-semibold py-2.5 rounded-lg hover:bg-gray-800 cursor-pointer transition-colors mb-2">
            <Phone size={12} /> Quick Call
          </button>
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
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add notes about this task..."
            rows={3}
            className="w-full text-xs text-gray-700 placeholder-gray-400 border border-gray-200 rounded-lg px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
          <button
            onClick={handleSaveNote}
            className="mt-2 flex items-center gap-1.5 text-xs font-medium text-white bg-purple-600 hover:bg-purple-700 px-3 py-1.5 rounded-lg cursor-pointer transition-colors"
          >
            <Pencil size={11} />
            {noteSaved ? 'Saved!' : 'Save Note'}
          </button>
        </div>
      </div>
    </div>
  );
}
