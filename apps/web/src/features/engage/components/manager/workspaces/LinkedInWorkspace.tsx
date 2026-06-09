"use client";

import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, MessageSquare, Copy, ExternalLink, ChevronDown, Phone, Mail, User, Check, Link2, Calendar } from 'lucide-react';
import type { Task } from '../types/engage.types';
import * as engageService from '../services/engage.service';

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

// Timeline activity icon map
const timelineIconMap: Record<string, { icon: any; color: string; bg: string }> = {
  linkedin: { icon: LinkedinIcon, color: '#0A66C2', bg: '#EFF6FF' },
  link: { icon: Link2, color: '#7C3AED', bg: '#F5F3FF' },
  call: { icon: Phone, color: '#059669', bg: '#ECFDF5' },
  meeting: { icon: Calendar, color: '#D97706', bg: '#FFFBEB' },
  email: { icon: Mail, color: '#4F46E5', bg: '#EEF2FF' },
};

interface LinkedInWorkspaceProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  onMarkComplete: (taskId: string, notes?: string) => void;
  onSkip: (taskId: string) => void;
  onDismiss: (taskId: string) => void;
  isViewOnly?: boolean;
}

export default function LinkedInWorkspace({
  isOpen,
  onClose,
  task,
  onMarkComplete,
  onSkip,
  onDismiss,
  isViewOnly = false,
}: LinkedInWorkspaceProps) {
  const [script, setScript] = useState('');
  const [mutualConnections, setMutualConnections] = useState(0);
  const [profileUrl, setProfileUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [copied, setCopied] = useState(false);
  const [, setLoading] = useState(false);
  
  const [contactDetail, setContactDetail] = useState<any>(null);
  const [crmOpen, setCrmOpen] = useState<Record<string, boolean>>({
    contact: true,
    timeline: false,
    account: false,
    deal: false,
  });

  useEffect(() => {
    if (!task) return;
    setLoading(true);
    
    engageService.fetchLinkedInScript(task.id)
      .then((data) => {
        setScript(data.messageScript);
        setMutualConnections(data.mutualConnections || 0);
        setProfileUrl(data.linkedInProfileUrl || 'https://linkedin.com');
      })
      .catch(() => {});

    const contactId = 'contact_sarah_chen_001';
    engageService.fetchContactDetail(contactId)
      .then(setContactDetail)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [task]);

  if (!isOpen || !task) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(script);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenLinkedIn = () => {
    window.open(profileUrl, '_blank');
  };

  const interFont = "'Inter', sans-serif";

  return (
    <div className="fixed inset-0 z-50 bg-[#F9FAFB] flex flex-col animate-fade-in linkedin-workspace-container">
      <style dangerouslySetInnerHTML={{ __html: `
        .linkedin-workspace-container .serif-override {
          font-family: "Source Serif 4", serif !important;
          font-weight: 600 !important;
        }
        .linkedin-workspace-container .sans-button {
          font-family: "Source Sans 3", sans-serif !important;
          font-weight: 400 !important;
          color: #FFFFFF !important;
        }
        .linkedin-workspace-container .copy-msg-btn {
          background-color: rgb(10, 102, 194) !important;
          border-color: rgb(10, 102, 194) !important;
        }
        .linkedin-workspace-container .mark-complete-btn {
          background-color: rgb(79, 70, 229) !important;
          border-color: rgb(79, 70, 229) !important;
        }
        .linkedin-workspace-container .open-linkedin-btn {
          color: #374151 !important;
          background-color: #FFFFFF !important;
          border-color: #D1D5DB !important;
        }
        .linkedin-workspace-container .open-linkedin-btn:hover {
          background-color: #F3F4F6 !important;
        }
        .linkedin-workspace-container .open-linkedin-btn svg {
          color: #9CA3AF !important;
        }
        .linkedin-workspace-container .secondary-btn {
          color: #374151 !important;
          background-color: #FFFFFF !important;
          border-color: #D1D5DB !important;
        }
        .linkedin-workspace-container .secondary-btn:hover {
          background-color: #F3F4F6 !important;
        }
      `}} />
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <span className="text-base font-bold text-gray-900 serif-override">LinkedIn Task</span>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-1 border border-gray-200 hover:bg-gray-50 text-gray-400 hover:text-gray-700 rounded-lg transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs text-gray-500 font-semibold">Task 1 of 1</span>
          <button className="p-1 border border-gray-200 hover:bg-gray-50 text-gray-400 hover:text-gray-700 rounded-lg transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left Side: LinkedIn Message */}
        <div className="flex-1 flex flex-col overflow-y-auto bg-white border-r border-gray-200">
          <div className="px-8 py-5 border-b border-gray-100 shrink-0">
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-0.5">
                <h2 style={{ fontFamily: interFont }}>
                  <span className="text-lg font-semibold text-gray-950 serif-override">{task.contactName}</span>
                  <span className="text-sm font-normal text-gray-400 ml-2">· {task.companyName}</span>
                </h2>
                <div className="flex items-center gap-2 mt-1">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                    <LinkedinIcon className="w-3 h-3" />
                    <span>LinkedIn Message</span>
                  </span>
                  <span className="text-xs text-gray-400 font-medium">Due: Today 2:00 PM</span>
                  <span className="text-xs text-gray-400 font-medium">·</span>
                  <span className="text-xs text-gray-400 font-medium">Enterprise Onboarding Flow · Step 2</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-6 flex-1 overflow-y-auto">
            {/* Contact Card */}
            <div className="flex items-center gap-4 p-4 border border-gray-200 rounded-xl bg-gray-50/50">
              <div className="w-12 h-12 rounded-full bg-[#EEF2F6] flex items-center justify-center text-gray-500 shrink-0">
                <User className="w-6 h-6" />
              </div>
              <div className="flex flex-col flex-1">
                <span className="text-sm font-semibold text-gray-900" style={{ fontFamily: interFont }}>{task.contactName}</span>
                <span className="text-xs text-gray-500 font-normal" style={{ fontFamily: interFont }}>{contactDetail?.role || 'VP of Sales'}</span>
                <span className="text-xs text-gray-500 font-normal" style={{ fontFamily: interFont }}>{task.companyName}</span>
                <span className="text-xs text-blue-600 font-medium mt-1 flex items-center gap-1">
                  <User className="w-3 h-3" />
                  {mutualConnections} mutual connections
                </span>
              </div>
            </div>

            {/* Not the right person link */}
            <p className="text-xs text-gray-400 -mt-3">Not the right person?</p>

            {/* Message Script */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-900 serif-override">Message Script</label>
              <div className="border border-gray-200 rounded-xl p-5 bg-white text-sm font-normal text-gray-800 leading-relaxed" style={{ fontFamily: interFont }}>
                <pre className="whitespace-pre-wrap" style={{ fontFamily: interFont }}>{script}</pre>
              </div>
              
              <div className="flex items-center gap-2.5 pt-2">
                <button
                  onClick={handleCopy}
                  className={`flex items-center gap-1.5 py-2 px-4 rounded-lg text-xs transition-all sans-button copy-msg-btn shadow-sm`}
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy Message'}</span>
                </button>
                <button
                  onClick={handleOpenLinkedIn}
                  className="flex items-center gap-1.5 py-2 px-4 border rounded-lg text-xs transition-colors shadow-sm sans-button open-linkedin-btn"
                >
                  <LinkedinIcon className="w-3.5 h-3.5" />
                  <span>Open LinkedIn</span>
                  <ExternalLink className="w-3 h-3 text-gray-400" />
                </button>
              </div>
            </div>
          </div>

          {/* Bottom Action Bar */}
          <div className="px-8 py-5 border-t border-gray-150 flex items-center justify-between bg-gray-50/50 shrink-0">
            <div className="flex gap-2">
              <button
                onClick={() => onDismiss(task.id)}
                className="px-4 py-2 border rounded-xl text-xs transition-colors sans-button secondary-btn"
              >
                Dismiss
              </button>
              <button
                onClick={() => onSkip(task.id)}
                className="px-4 py-2 border rounded-xl text-xs transition-colors sans-button secondary-btn"
              >
                Skip
              </button>
            </div>
            <button
              onClick={() => onMarkComplete(task.id, notes)}
              disabled={isViewOnly}
              className={`px-5 py-2 rounded-xl text-xs transition-colors shadow-sm sans-button mark-complete-btn ${
                isViewOnly ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              Mark Complete
            </button>
          </div>
        </div>

        {/* Right Side: CRM Accordions */}
        <div className="w-[360px] bg-white border-l border-gray-200 overflow-y-auto shrink-0 flex flex-col">
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {/* Contact Accordion */}
            <div className="flex flex-col">
              <button
                onClick={() => setCrmOpen((prev) => ({ ...prev, contact: !prev.contact }))}
                className="flex items-center justify-between px-6 py-4 hover:bg-gray-50/50 text-sm font-medium text-gray-900 transition-colors serif-override"
              >
                <span>Contact</span>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${crmOpen.contact ? 'rotate-180' : ''}`} />
              </button>
              
              {crmOpen.contact && contactDetail && (
                <div className="px-6 pb-5 flex flex-col gap-4">
                  {/* Card Container */}
                  <div className="p-5 bg-white border border-gray-200 rounded-xl space-y-4">
                    {/* Top Row: Avatar & Title */}
                    <div className="flex items-center gap-3.5">
                      <div className="w-10 h-10 rounded-full bg-[#EEF2F6] flex items-center justify-center text-[#4F46E5]">
                        <User className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-gray-900" style={{ fontFamily: interFont }}>{contactDetail.name}</span>
                        <span className="text-xs text-gray-500 font-medium mt-0.5" style={{ fontFamily: interFont }}>{contactDetail.role}</span>
                        <span className="text-xs text-gray-500 font-medium" style={{ fontFamily: interFont }}>{contactDetail.companyName}</span>
                      </div>
                    </div>

                    {/* Links Row */}
                    <div className="space-y-3 pt-1 text-sm font-medium">
                      <a
                        href={`tel:${contactDetail.phone}`}
                        className="flex items-center gap-3.5 text-[#4F46E5] hover:text-[#4338CA] transition-colors"
                        style={{ fontFamily: interFont }}
                      >
                        <Phone className="w-4 h-4" />
                        <span>{contactDetail.phone}</span>
                      </a>
                      <a
                        href={`mailto:${contactDetail.email}`}
                        className="flex items-center gap-3.5 text-[#4F46E5] hover:text-[#4338CA] transition-colors break-all"
                        style={{ fontFamily: interFont }}
                      >
                        <Mail className="w-4 h-4" />
                        <span>{contactDetail.email}</span>
                      </a>
                      <a
                        href={contactDetail.linkedInUrl || 'https://linkedin.com'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3.5 text-[#4F46E5] hover:text-[#4338CA] transition-colors"
                        style={{ fontFamily: interFont }}
                      >
                        <LinkedinIcon className="w-4 h-4" />
                        <span className="flex items-center gap-1">
                          View LinkedIn
                          <ExternalLink className="w-3.5 h-3.5" />
                        </span>
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Engagement Timeline Accordion */}
            <div className="flex flex-col">
              <button
                onClick={() => setCrmOpen((prev) => ({ ...prev, timeline: !prev.timeline }))}
                className="flex items-center justify-between px-6 py-4 hover:bg-gray-50/50 text-sm font-medium text-gray-900 transition-colors serif-override"
              >
                <span>Engagement Timeline</span>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${crmOpen.timeline ? 'rotate-180' : ''}`} />
              </button>
              {crmOpen.timeline && contactDetail && (
                <div className="px-6 pb-6 pt-1 relative border-l border-gray-100 ml-10 space-y-4">
                  {contactDetail.engagementTimeline.map((item: any, idx: number) => (
                    <div key={idx} className="relative flex flex-col gap-0.5 pl-1">
                      <div className="absolute -left-[24.5px] top-1.5 w-2 h-2 rounded-full bg-[#4F46E5] border border-white" />
                      <span className="text-[10px] text-gray-400 font-semibold" style={{ fontFamily: interFont }}>{item.relativeTime}</span>
                      <p className="text-sm text-gray-800 font-semibold" style={{ fontFamily: interFont }}>{item.label}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Account Info Accordion */}
            <div className="flex flex-col">
              <button
                onClick={() => setCrmOpen((prev) => ({ ...prev, account: !prev.account }))}
                className="flex items-center justify-between px-6 py-4 hover:bg-gray-50/50 text-sm font-medium text-gray-900 transition-colors serif-override"
              >
                <span>Account Info</span>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${crmOpen.account ? 'rotate-180' : ''}`} />
              </button>
              {crmOpen.account && contactDetail && (
                <div className="px-6 pb-6 flex flex-col gap-2 text-xs font-medium text-gray-600">
                  <div className="flex justify-between py-1.5 border-b border-gray-50">
                    <span className="font-semibold" style={{ fontFamily: interFont }}>Industry</span>
                    <span className="text-gray-900 font-semibold" style={{ fontFamily: interFont }}>{contactDetail.accountInfo?.industry || 'Technology'}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-gray-50">
                    <span className="font-semibold" style={{ fontFamily: interFont }}>Company Size</span>
                    <span className="text-gray-900 font-semibold" style={{ fontFamily: interFont }}>{contactDetail.accountInfo?.size || '750'} employees</span>
                  </div>
                </div>
              )}
            </div>

            {/* Deal Info Accordion */}
            <div className="flex flex-col">
              <button
                onClick={() => setCrmOpen((prev) => ({ ...prev, deal: !prev.deal }))}
                className="flex items-center justify-between px-6 py-4 hover:bg-gray-50/50 text-sm font-medium text-gray-900 transition-colors serif-override"
              >
                <span>Deal Info</span>
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${crmOpen.deal ? 'rotate-180' : ''}`} />
              </button>
              {crmOpen.deal && contactDetail && (
                <div className="px-6 pb-6 flex flex-col gap-2 text-xs font-medium text-gray-600">
                  <div className="flex justify-between py-1.5 border-b border-gray-50">
                    <span className="font-semibold" style={{ fontFamily: interFont }}>Deal Name</span>
                    <span className="text-gray-900 font-semibold" style={{ fontFamily: interFont }}>{contactDetail.dealInfo?.dealName || 'Q2 Renewal Proposal'}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-gray-50">
                    <span className="font-semibold" style={{ fontFamily: interFont }}>Stage</span>
                    <span className="text-gray-900 font-semibold" style={{ fontFamily: interFont }}>{contactDetail.dealInfo?.stage || 'Proposal / Negotiation'}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-gray-50">
                    <span className="font-semibold" style={{ fontFamily: interFont }}>Value</span>
                    <span className="text-gray-900 font-semibold" style={{ fontFamily: interFont }}>{contactDetail.dealInfo?.value || '$240,000'}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Notes Input Section at the Bottom */}
          <div className="flex flex-col p-6 border-t border-gray-100 space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 serif-override">Notes</h3>
            <textarea
              disabled={isViewOnly}
              placeholder="Add notes about this task..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-3 border border-gray-200 rounded-lg text-sm min-h-[100px] focus:outline-none focus:ring-1 focus:ring-[#4F46E5] focus:border-[#4F46E5] text-gray-900 bg-white"
              style={{ fontFamily: interFont }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
