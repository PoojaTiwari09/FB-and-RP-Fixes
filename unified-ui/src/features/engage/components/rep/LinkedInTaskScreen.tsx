'use client';

import { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Users, Copy, Check, ExternalLink, User } from 'lucide-react';
import type { Task } from './types/engage.types';
import { MOCK_LINKEDIN_DRAFTS, MOCK_CONTACT_DETAILS } from './mocks/engage.mock';
import ContactSidebar from './ContactSidebar';

function LinkedInIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  );
}

interface LinkedInTaskScreenProps {
  task: Task;
  allTasks: Task[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
  onMarkComplete: (taskId: string) => void;
  inQueue?: boolean;
}

export default function LinkedInTaskScreen({
  task,
  allTasks,
  currentIndex,
  onClose,
  onNavigate,
  onMarkComplete,
  inQueue = false,
}: LinkedInTaskScreenProps) {
  const draft   = MOCK_LINKEDIN_DRAFTS[task.taskId];
  const contact = MOCK_CONTACT_DETAILS[task.contactId];

  const defaultMessage = draft?.messageScript ??
    `Hi ${task.contactName.split(' ')[0]},\n\nI came across your profile and thought there might be a great fit between what we offer and what ${task.company} is working on.\n\nWould you be open to a quick 15-minute call to explore?\n\nBest,\nAlex`;

  const [message, setMessage] = useState(defaultMessage);
  const [copied,  setCopied]  = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const linkedInUrl = draft?.linkedInProfileUrl ?? contact?.linkedInUrl ?? '#';

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
        <h2 className="text-sm font-semibold text-gray-900">LinkedIn Task</h2>
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

        {/* Left: compose area */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-gray-200">

          {/* Meta bar */}
          <div className="flex items-center flex-wrap gap-x-3 gap-y-1 px-5 py-2.5 border-b border-gray-100 bg-gray-50 text-xs text-gray-600">
            <span className="font-semibold text-gray-800">{task.contactName}</span>
            <span className="text-gray-300">·</span>
            <span>{task.company}</span>
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-sky-700"
              style={{ backgroundColor: '#F0F9FF', borderColor: '#BAE6FD' }}
            >
              <LinkedInIcon size={10} />
              LinkedIn Message
            </span>
            <span className="text-gray-300">·</span>
            <span>Due: Today 2:00 PM</span>
            {task.sequenceName && (
              <>
                <span className="text-gray-300">·</span>
                <span>{task.sequenceName} &bull; {task.sequenceStep}</span>
              </>
            )}
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">

            {/* Contact preview card */}
            <div className="border border-gray-200 rounded-xl p-4">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center flex-shrink-0">
                  <User size={18} className="text-sky-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{task.contactName}</p>
                  {contact && (
                    <>
                      <p className="text-xs text-gray-500">{contact.jobTitle}</p>
                      <p className="text-xs text-gray-400">{contact.company}</p>
                    </>
                  )}
                </div>
              </div>
              {draft?.mutualConnections !== undefined && (
                <div className="flex items-center gap-1.5 text-xs text-blue-600 mb-3">
                  <Users size={12} />
                  <span>{draft.mutualConnections} mutual connections</span>
                </div>
              )}
              <button className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer underline underline-offset-2 transition-colors">
                Not the right person?
              </button>
            </div>

            {/* Message Script */}
            <div>
              <p className="text-xs font-semibold text-gray-700 mb-2">Message Script</p>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                rows={11}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 resize-none text-gray-800"
                style={{ outlineColor: '#0EA5E9' }}
              />
            </div>

            {/* Action buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-sm font-medium text-blue-700 border border-blue-200 bg-blue-50 hover:bg-blue-100 rounded-lg px-4 py-2 cursor-pointer transition-colors"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copied!' : 'Copy Message'}
              </button>
              <a
                href={linkedInUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm font-medium text-blue-700 border border-blue-200 bg-blue-50 hover:bg-blue-100 rounded-lg px-4 py-2 cursor-pointer transition-colors"
              >
                <LinkedInIcon size={14} />
                Open LinkedIn
                <ExternalLink size={12} />
              </a>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end px-5 py-3 border-t border-gray-200 bg-white">
            <button
              onClick={() => onMarkComplete(task.taskId)}
              className="text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg px-5 py-2 cursor-pointer transition-colors"
            >
              Mark Complete
            </button>
          </div>
        </div>

        {/* Right: contact sidebar */}
        {contact && <ContactSidebar contact={contact} />}
      </div>
    </div>
  );
}
