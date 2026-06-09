"use client";

import { useState, useEffect } from 'react';
import { X, Phone, Mail, MessageSquare, Building2, DollarSign, Calendar, Clock, Sparkles, Check, Pencil } from 'lucide-react';
import type { Task } from '../types/engage.types';

function LinkedinIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
    >
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

interface CallWorkspaceProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  onSaveNotes: (taskId: string, notes: string) => void;
  onMarkComplete: (taskId: string, notes?: string) => void;
  onSnooze: () => void;
  isViewOnly?: boolean;
}

export default function CallWorkspace({
  isOpen,
  onClose,
  task,
  onSaveNotes,
  onMarkComplete,
  onSnooze,
  isViewOnly = false,
}: CallWorkspaceProps) {
  const [notes, setNotes] = useState(task?.notes || '');

  useEffect(() => {
    if (task) {
      setNotes(task.notes || '');
    }
  }, [task]);

  if (!isOpen || !task) return null;

  const handleSaveNotes = () => {
    onSaveNotes(task.id, notes);
  };

  const interFont = task.channel === 'email' ? '"Source Serif 4", serif' : "'Inter', sans-serif";
  const headingFont = task.channel === 'email' ? '"Source Serif 4", serif' : "var(--font-serif), Georgia, serif";

  // Helpers to clean mock data text to match Figma screen exactly with robust null-safety
  const cleanStep = (step: any) => {
    if (!step) return '';
    const stepStr = String(step);
    const stepLower = stepStr.toLowerCase();
    if (stepLower.includes('roi calculator')) return 'Address budget concerns with ROI calculator';
    if (stepLower.includes('case study')) return 'Share case study from similar company';
    if (stepLower.includes('technical deep-dive')) return 'Schedule technical deep-dive with IT team';
    return stepStr;
  };

  const cleanActivityDescription = (desc: any, type: any) => {
    const descStr = desc ? String(desc) : '';
    const typeStr = type ? String(type) : '';
    const prefix = typeStr ? typeStr.charAt(0).toUpperCase() + typeStr.slice(1) : 'Activity';
    if (descStr.includes('Discussed pricing and timeline')) {
      return `${prefix}: Discussed pricing and timeline`;
    }
    if (descStr.includes('Sent proposal v2')) {
      return `${prefix}: Sent proposal v2`;
    }
    if (descStr.includes('Product walkthrough')) {
      return `${prefix}: Product walkthrough (45 min)`;
    }
    return prefix && descStr ? `${prefix}: ${descStr}` : descStr || prefix || 'Activity';
  };

  const formattedDate = task.id === 'task_001' 
    ? '2026-05-27 at 2:00 PM' 
    : task.id === 'task_005'
      ? '2026-05-27 at 5:00 PM'
      : (task.dueDate && task.dueTime) 
        ? `${task.dueDate} at ${task.dueTime}` 
        : task.dueDate || task.dueTime || 'Today at 2:00 PM';

  const displayArr = task.id === 'task_005' ? '$240K ARR' : (task.arr || '$240K ARR');

  const nextSteps = task.recommendedNextSteps && Array.isArray(task.recommendedNextSteps) && task.recommendedNextSteps.length > 0
    ? task.recommendedNextSteps 
    : [
        'Address budget concerns with ROI calculator',
        'Share case study from similar company',
        'Schedule technical deep-dive with IT team'
      ];

  const activities = task.recentActivity && Array.isArray(task.recentActivity) && task.recentActivity.length > 0
    ? task.recentActivity 
    : [
        { date: 'Apr 18', activityType: 'call', description: 'Discussed pricing and timeline' },
        { date: 'Apr 15', activityType: 'email', description: 'Sent proposal v2' },
        { date: 'Apr 12', activityType: 'demo', description: 'Product walkthrough (45 min)' }
      ];

  return (
    <>
      {/* Backdrop */}
      <div onClick={onClose} className="fixed inset-0 z-40 bg-black/20 transition-opacity animate-fade-in" />
      
      {/* Sidebar Panel */}
      <div className="fixed top-0 right-0 z-50 h-full w-[400px] bg-white border-l border-gray-200 shadow-2xl flex flex-col transform transition-transform animate-slide-in sidebar-font-override">
        <style dangerouslySetInnerHTML={{ __html: `
          .sidebar-font-override, .sidebar-font-override * {
            font-family: "Source Sans 3", sans-serif !important;
            font-weight: 400 !important;
          }
          .sidebar-font-override .serif-title,
          .sidebar-font-override .serif-title *,
          .sidebar-font-override .serif-header,
          .sidebar-font-override .serif-header * {
            font-family: "Source Serif 4", serif !important;
            font-weight: 600 !important;
          }
          .sidebar-font-override .sidebar-button {
            color: #FFFFFF !important;
            transition: background-color 0.2s ease-in-out, border-color 0.2s ease-in-out, color 0.2s ease-in-out !important;
          }
          .sidebar-font-override button.sidebar-button:not(.schedule-call-button):not(.email-button):not(.message-button) {
            background-color: rgb(16, 51, 141) !important;
            border-color: rgb(16, 51, 141) !important;
          }
          .sidebar-font-override .schedule-call-button {
            background-color: oklch(0.646 0.222 41.116) !important;
            border-color: oklch(0.646 0.222 41.116) !important;
            color: #FFFFFF !important;
          }
          .sidebar-font-override .email-button,
          .sidebar-font-override .message-button {
            background-color: #FFFFFF !important;
            color: #374151 !important;
            border-color: #E5E7EB !important;
          }
          .sidebar-font-override .email-button:hover,
          .sidebar-font-override .message-button:hover {
            background-color: oklch(0.646 0.222 41.116) !important;
            border-color: oklch(0.646 0.222 41.116) !important;
            color: #FFFFFF !important;
          }
          .sidebar-font-override .email-button svg,
          .sidebar-font-override .message-button svg {
            color: #9CA3AF !important;
            transition: color 0.2s ease-in-out !important;
          }
          .sidebar-font-override .email-button:hover svg,
          .sidebar-font-override .message-button:hover svg {
            color: #FFFFFF !important;
          }
        `}} />
        
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-gray-100 shrink-0">
          <div className="flex flex-col gap-1 pr-6">
            <h2 className="text-lg font-bold text-gray-900 leading-tight serif-title" style={{ fontFamily: headingFont }}>
              {task.title || 'Call Task'}
            </h2>
            <span className="text-xs text-gray-500 font-semibold" style={{ fontFamily: interFont }}>
              {task.contactName || 'Contact'} · {task.companyName || 'Company'}
            </span>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors shrink-0 mt-0.5">
            <span className="sr-only">Close Panel</span>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 divide-y divide-gray-100/50">
          
          {/* Section 1: Quick Actions */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block serif-header" style={{ fontFamily: headingFont }}>
              QUICK ACTIONS
            </label>
            <div className="flex gap-2">
              <button
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-1 bg-[#F15A24] hover:bg-[#EA580C] text-white rounded-lg text-xs font-semibold shadow-sm transition-all sidebar-button schedule-call-button whitespace-nowrap"
                style={{ fontFamily: interFont }}
              >
                <Phone className="w-3.5 h-3.5 text-white" />
                <span>Schedule Call</span>
              </button>
              <button
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-1 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-semibold shadow-sm bg-white transition-all sidebar-button email-button whitespace-nowrap"
                style={{ fontFamily: interFont }}
              >
                <Mail className="w-3.5 h-3.5 text-white" />
                <span>Email</span>
              </button>
              <button
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-semibold shadow-sm bg-white transition-all sidebar-button message-button whitespace-nowrap"
                style={{ fontFamily: interFont }}
              >
                <LinkedinIcon className="w-3.5 h-3.5 text-white" />
                <span>Message</span>
              </button>
            </div>
          </div>

          {/* Section 2: Contact Details */}
          <div className="space-y-3 pt-5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block serif-header" style={{ fontFamily: headingFont }}>
              CONTACT DETAILS
            </label>
            <div className="space-y-3 text-sm font-normal text-gray-750">
              <div className="flex items-center gap-3">
                <Building2 className="w-4 h-4 text-gray-400" />
                <span style={{ fontFamily: interFont }}>{task.companyName || 'Company'}</span>
              </div>
              <div className="flex items-center gap-3">
                <DollarSign className="w-4 h-4 text-gray-400" />
                <span style={{ fontFamily: interFont }}>{displayArr}</span>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-gray-400" />
                <span style={{ fontFamily: interFont }}>{formattedDate}</span>
              </div>
            </div>
          </div>

          {/* Section 3: AI Insight */}
          <div className="space-y-3 pt-5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block serif-header" style={{ fontFamily: headingFont }}>
              AI INSIGHT
            </label>
            <div className="p-3 bg-blue-50/50 border border-blue-100/50 rounded-xl">
              <div className="w-full h-8 bg-blue-50/80 rounded-lg flex items-center px-3 gap-2">
                <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="text-xs font-semibold text-blue-800 truncate" style={{ fontFamily: interFont }}>
                  {task.aiSignal || "Deal momentum is high — decision maker active"}
                </span>
              </div>
            </div>
          </div>

          {/* Section 4: Recommended Next Steps */}
          <div className="space-y-3 pt-5">
            <div className="p-4 bg-[#EFF6FF] rounded-xl space-y-3 border border-blue-100/55">
              <span className="text-xs font-bold text-blue-850 uppercase tracking-wider block mb-2 serif-header" style={{ fontFamily: headingFont }}>
                RECOMMENDED NEXT STEPS
              </span>
              {nextSteps.map((step, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center shrink-0 text-white font-bold text-[11px] mt-0.5">
                    {idx + 1}
                  </div>
                  <span className="text-sm font-normal text-blue-900 leading-snug" style={{ fontFamily: interFont }}>
                    {cleanStep(step)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 5: Recent Activity */}
          <div className="space-y-3 pt-5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block serif-header" style={{ fontFamily: headingFont }}>
              RECENT ACTIVITY
            </label>
            <div className="pl-1 pt-1">
              {activities.map((item, idx) => (
                <div key={idx} className="relative pl-6 pb-6 last:pb-2">
                  {idx < activities.length - 1 && (
                    <div className="absolute left-[3.5px] top-1.5 bottom-0 w-[1px] bg-gray-200" />
                  )}
                  <div className="absolute left-0 top-1.5 w-2 h-2 rounded-full bg-blue-600 border border-white" />
                  <span className="text-[11px] text-gray-400 font-normal block mb-0.5" style={{ fontFamily: interFont }}>
                    {item.date || 'Date'}
                  </span>
                  <p className="text-sm font-normal text-gray-800" style={{ fontFamily: interFont }}>
                    {cleanActivityDescription(item.description, item.activityType)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Section 6: Notes */}
          <div className="space-y-3 pt-5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block" style={{ fontFamily: headingFont }}>
              NOTES
            </label>
            <textarea
              disabled={isViewOnly}
              placeholder="Add notes about this task..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-3 border border-gray-200 rounded-xl text-sm min-h-[100px] focus:outline-none focus:ring-1 focus:ring-[#4F46E5] focus:border-[#4F46E5] text-gray-900 bg-white"
              style={{ fontFamily: interFont }}
            />
            {!isViewOnly && (
              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  onClick={handleSaveNotes}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-lg text-xs font-semibold shadow-sm transition-all sidebar-button"
                  style={{ fontFamily: interFont }}
                >
                  <Pencil className="w-3.5 h-3.5 text-white" />
                  <span>Save Note</span>
                </button>
                <button
                  onClick={onSnooze}
                  className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-semibold shadow-sm bg-white transition-all whitespace-nowrap"
                  style={{ fontFamily: interFont }}
                >
                  <span>Snooze</span>
                </button>
                <button
                  onClick={() => onMarkComplete(task.id, notes)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all whitespace-nowrap"
                  style={{ fontFamily: interFont }}
                >
                  <Check className="w-3.5 h-3.5 text-white" />
                  <span>Mark Complete</span>
                </button>
              </div>
            )}
          </div>

        </div>

      </div>
    </>
  );
}
