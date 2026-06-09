"use client";

import { useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import type { Task } from '../types/engage.types';

interface CustomWorkspaceProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  onSaveNotes: (taskId: string, notes: string) => void;
  onMarkComplete: (taskId: string, notes?: string) => void;
  onSnooze: () => void;
  isViewOnly?: boolean;
}

export default function CustomWorkspace({
  isOpen,
  onClose,
  task,
  onSaveNotes,
  onMarkComplete,
  onSnooze,
  isViewOnly = false,
}: CustomWorkspaceProps) {
  const [notes, setNotes] = useState(task?.notes || '');

  if (!isOpen || !task) return null;

  return (
    <>
      <div onClick={onClose} className="fixed inset-0 z-40 bg-black/30 transition-opacity" />
      <div className="fixed top-0 right-0 z-50 h-full w-[400px] bg-white border-l border-gray-200 shadow-2xl flex flex-col transform transition-transform">
        
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-gray-150 shrink-0">
          <div className="flex flex-col gap-0.5">
            <h2 className="text-base font-bold text-gray-900 leading-tight">Custom Task Workspace</h2>
            <span className="text-xs text-gray-500 font-semibold">{task.contactName} · {task.companyName}</span>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 text-gray-400">
            <span className="sr-only">Close Panel</span>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg text-indigo-700">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-indigo-850 font-bold uppercase tracking-wide">Custom Task</p>
              <p className="text-sm font-semibold text-indigo-950 mt-0.5">{task.title}</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wide">Manager Task Notes</label>
            <textarea
              disabled={isViewOnly}
              placeholder="Record task status, outcomes, or internal notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-xs min-h-[120px] focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Footer */}
        {!isViewOnly && (
          <div className="px-6 py-5 border-t border-gray-150 flex items-center justify-between bg-gray-50 shrink-0">
            <button
              onClick={onSnooze}
              className="px-3 py-2 border border-gray-200 hover:bg-gray-100 rounded-lg text-xs font-semibold text-gray-700 transition-colors"
            >
              Snooze
            </button>
            <div className="flex gap-2">
              <button
                onClick={() => onSaveNotes(task.id, notes)}
                className="px-3 py-2 border border-gray-200 hover:bg-gray-100 rounded-lg text-xs font-semibold text-gray-700 transition-colors"
              >
                Save Draft
              </button>
              <button
                onClick={() => onMarkComplete(task.id, notes)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
              >
                Mark Complete
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
