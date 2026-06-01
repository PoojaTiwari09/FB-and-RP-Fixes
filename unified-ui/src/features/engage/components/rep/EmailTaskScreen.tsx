'use client';

import { useState } from 'react';
import { X, ChevronLeft, ChevronRight, ChevronDown, Mail, Paperclip, Sparkles } from 'lucide-react';
import type { Task } from './types/engage.types';
import { MOCK_EMAIL_DRAFTS, MOCK_CONTACT_DETAILS } from './mocks/engage.mock';
import ContactSidebar from './ContactSidebar';

interface EmailTaskScreenProps {
  task: Task;
  allTasks: Task[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
  inQueue?: boolean;
}

type ActiveTab = 'email' | 'crm';

export default function EmailTaskScreen({
  task,
  allTasks,
  currentIndex,
  onClose,
  onNavigate,
  inQueue = false,
}: EmailTaskScreenProps) {
  const draft   = MOCK_EMAIL_DRAFTS[task.taskId];
  const contact = MOCK_CONTACT_DETAILS[task.contactId];

  const [activeTab, setActiveTab] = useState<ActiveTab>('email');
  const [to, setTo] = useState(draft?.contactEmail ?? '');
  const [subject, setSubject] = useState(draft?.subject ?? '');
  const [body, setBody] = useState(
    draft?.bodyHtml.replace(/<[^>]*>/g, '').replace(/\n\s*\n/g, '\n\n').trim() ?? ''
  );
  const [sendSuccess, setSendSuccess] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);

  const handleSend = () => {
    setSendSuccess(true);
    setTimeout(() => { setSendSuccess(false); onClose(); }, 1200);
  };

  const handleSaveDraft = () => {
    setDraftSaved(true);
    setTimeout(() => setDraftSaved(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 bg-white">
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-700 cursor-pointer transition-colors"
        >
          <X size={18} />
        </button>
        <h2 className="text-sm font-semibold text-gray-900">Email Task</h2>
        {inQueue ? (
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <button
              onClick={() => currentIndex > 0 && onNavigate(currentIndex - 1)}
              disabled={currentIndex === 0}
              className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 cursor-pointer transition-colors"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="font-medium">Task {currentIndex + 1} of {allTasks.length}</span>
            <button
              onClick={() => currentIndex < allTasks.length - 1 && onNavigate(currentIndex + 1)}
              disabled={currentIndex === allTasks.length - 1}
              className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 cursor-pointer transition-colors"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        ) : (
          <div className="w-20" />
        )}
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Left: Compose area */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-gray-200">
          {/* Meta bar */}
          <div className="flex items-center flex-wrap gap-x-2 gap-y-1 px-5 py-2.5 border-b border-gray-100 bg-gray-50 text-xs text-gray-600">
            <span className="font-semibold text-gray-800">{task.contactName}</span>
            <span className="text-gray-300">·</span>
            <span>{task.company}</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
              <Mail size={10} /> Email
            </span>
            <span className="text-gray-300">·</span>
            <span>Due: Today 2:00 PM</span>
            {task.sequenceName && (
              <>
                <span className="text-gray-300">·</span>
                <span>
                  {task.sequenceName} &bull; {task.sequenceStep}
                </span>
              </>
            )}
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 px-5 bg-white">
            {(['email', 'crm'] as ActiveTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px cursor-pointer transition-colors ${
                  activeTab === tab
                    ? 'border-purple-600 text-purple-700'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab === 'crm' ? 'CRM' : 'Email'}
              </button>
            ))}
          </div>

          {activeTab === 'email' ? (
            <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
              {/* To */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">To</label>
                <input
                  type="email"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-800"
                />
              </div>

              {/* From */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">From</label>
                <div className="relative">
                  <select className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none cursor-pointer text-gray-800 bg-white">
                    <option>{draft?.fromLabel ?? 'you@company.com (Gmail)'}</option>
                  </select>
                  <ChevronDown
                    size={14}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  />
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Subject</label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-800"
                />
              </div>

              {/* Toolbar */}
              <div className="flex gap-2">
                <button className="flex items-center gap-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 cursor-pointer transition-colors">
                  Use Template
                </button>
                <button className="flex items-center gap-1.5 text-xs font-medium text-purple-600 border border-purple-200 rounded-lg px-3 py-1.5 hover:bg-purple-50 cursor-pointer transition-colors">
                  <Sparkles size={12} /> AI Rephrase
                </button>
              </div>

              {/* Message */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Message</label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={12}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none text-gray-800"
                />
              </div>

              {/* Attachment */}
              <button className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 cursor-pointer transition-colors">
                <Paperclip size={13} /> Add Attachment
              </button>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto px-5 py-5">
              <p className="text-sm font-medium text-gray-700 mb-1">CRM Fields</p>
              <p className="text-xs text-gray-500">Account and deal fields can be edited here</p>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-5 py-3 border-t border-gray-200 bg-white">
            <button
              onClick={handleSaveDraft}
              className="text-sm font-medium text-gray-600 border border-gray-200 rounded-lg px-4 py-2 hover:bg-gray-50 cursor-pointer transition-colors"
            >
              {draftSaved ? 'Draft Saved!' : 'Save Draft'}
            </button>
            <button
              onClick={handleSend}
              className="text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg px-5 py-2 cursor-pointer transition-colors"
            >
              {sendSuccess ? 'Sent!' : 'Send'}
            </button>
          </div>
        </div>

        {/* Right: Contact Sidebar */}
        {contact && <ContactSidebar contact={contact} />}
      </div>
    </div>
  );
}
