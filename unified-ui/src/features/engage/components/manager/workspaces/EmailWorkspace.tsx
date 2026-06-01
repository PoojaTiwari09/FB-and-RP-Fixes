"use client";

import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Mail, Paperclip, Sparkles, FileText, ChevronDown, Phone, User, Clock, ExternalLink, Link2, Calendar } from 'lucide-react';
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

interface EmailWorkspaceProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  onSend: (taskId: string, body: { to: string; from: string; subject: string; body: string; notes?: string }) => void;
  onSaveDraft: (taskId: string, body: { to: string; from: string; subject: string; body: string }) => void;
  onSkip: (taskId: string) => void;
  onDismiss: (taskId: string) => void;
  isViewOnly?: boolean;
}

export default function EmailWorkspace({
  isOpen,
  onClose,
  task,
  onSend,
  onSaveDraft,
  onSkip,
  onDismiss,
  isViewOnly = false,
}: EmailWorkspaceProps) {
  const [to, setTo] = useState('');
  const serifFont = '"Source Serif 4", serif';
  const [from, setFrom] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [notes, setNotes] = useState('');
  const [fromOptions, setFromOptions] = useState<string[]>([]);
  const [showFromDropdown, setShowFromDropdown] = useState(false);
  const [, setLoading] = useState(false);
  const [rephrasing, setRephrasing] = useState(false);
  const [activeTab, setActiveTab] = useState<'email' | 'crm'>('email');
  
  const [contactDetail, setContactDetail] = useState<any>(null);
  const [crmOpen, setCrmOpen] = useState<Record<string, boolean>>({
    contact: true,
    timeline: false,
    account: false,
    deal: false,
  });

  const [showTemplates, setShowTemplates] = useState(false);
  const [templates, setTemplates] = useState<{ id: string; name: string; subject: string; body: string }[]>([]);

  useEffect(() => {
    if (!task) return;
    setLoading(true);
    
    engageService.fetchEmailDraft(task.id)
      .then((draft) => {
        if (draft) {
          setTo(draft.to);
          const fOptions = ['you@company.com (Gmail)', ...draft.fromOptions.filter(o => !o.includes('you@company.com'))];
          setFromOptions(fOptions);
          setFrom(fOptions[0]);
          if (draft.subject.includes('Following up on Q2 contract renewal')) {
            setSubject('Following up on Q2 contract renewal');
          } else {
            setSubject(draft.subject);
          }
          setBody(draft.body);
        }
      })
      .catch(() => {});

    engageService.fetchEmailTemplates()
      .then(setTemplates)
      .catch(() => {});

    const contactId = 'contact_sarah_chen_001';
    engageService.fetchContactDetail(contactId)
      .then(setContactDetail)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [task]);

  if (!isOpen || !task) return null;

  const handleTemplateSelect = (tmpl: any) => {
    const firstName = task.contactName.split(' ')[0] || '';
    const companyName = task.companyName || '';
    
    let nextSubject = tmpl.subject.replace('{{companyName}}', companyName);
    let nextBody = tmpl.body
      .replace('{{firstName}}', firstName)
      .replace('{{companyName}}', companyName)
      .replace('{{senderName}}', 'Alex Morgan');

    setSubject(nextSubject);
    setBody(nextBody);
    setShowTemplates(false);
  };

  const handleAIRephrase = async (tone: string) => {
    setRephrasing(true);
    try {
      const text = await engageService.rephraseEmail(task.id, { currentBody: body, tone });
      setBody(text);
    } catch (e) {
      // Silent catch
    } finally {
      setRephrasing(false);
    }
  };

  const handleSend = () => {
    onSend(task.id, { to, from, subject, body, notes });
  };

  const handleSave = () => {
    onSaveDraft(task.id, { to, from, subject, body });
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#F9FAFB] flex flex-col animate-fade-in email-workspace-container">
      <style dangerouslySetInnerHTML={{ __html: `
        .email-workspace-container .serif-override {
          font-family: "Source Serif 4", serif !important;
          font-weight: 600 !important;
        }
      `}} />
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200 shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-900 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <span className="text-lg font-bold text-gray-900 serif-override">
            Email Task
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-1 border border-gray-200 hover:bg-gray-50 text-gray-500 rounded-md transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-xs text-gray-500 font-medium px-1">Task 1 of 1</span>
          <button className="p-1 border border-gray-200 hover:bg-gray-50 text-gray-500 rounded-md transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left Side: Composer and Actions */}
        <div className="flex-1 flex flex-col overflow-y-auto bg-white border-r border-gray-200">
          {/* Metadata Info */}
          <div className="px-8 py-5 border-b border-gray-100 shrink-0">
            <div className="flex items-start justify-between">
              <div className="flex flex-col gap-1.5">
                <h2 className="text-lg font-semibold text-gray-900 font-sans" style={{ fontFamily: 'var(--font-sans)' }}>
                  <span className="serif-override">{task.contactName}</span> <span className="mx-1">•</span> <span className="text-sm font-normal text-gray-600">{task.companyName}</span>
                </h2>
                <div className="flex items-center gap-2.5 mt-0.5 text-xs text-gray-500">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded bg-[#EEF2F6] text-[#4F46E5] border border-transparent font-medium">
                    <Mail className="w-3.5 h-3.5" />
                    <span>Email</span>
                  </span>
                  <span className="flex items-center gap-1 font-medium text-gray-500">
                    <Clock className="w-3.5 h-3.5 text-gray-400" />
                    <span>Due: Today 2:00 PM</span>
                  </span>
                  <span className="text-gray-400">•</span>
                  <span className="font-medium text-gray-500">
                    Enterprise Onboarding Flow • Step 2
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="px-8 py-3 shrink-0 flex gap-2 border-b border-gray-50">
            <button
              onClick={() => setActiveTab('email')}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'email' ? 'bg-[#F3F4F6] text-gray-800' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Email
            </button>
            <button
              onClick={() => setActiveTab('crm')}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                activeTab === 'crm' ? 'bg-[#F3F4F6] text-gray-800' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              CRM
            </button>
          </div>

          {/* Composer Content Area */}
          <div className="flex-1 p-8 space-y-5 min-h-0 overflow-y-auto">
            {activeTab === 'crm' ? (
              <div className="text-sm text-gray-500 italic p-6 border border-dashed border-gray-200 rounded-xl bg-gray-50/50 text-center">
                CRM synchronization panel matches Salesforce logs automatically.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-700">To</label>
                  <input
                    type="email"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#4F46E5] focus:border-[#4F46E5] text-gray-900 bg-white"
                  />
                </div>

                <div className="flex flex-col gap-1.5 relative">
                  <label className="text-sm font-medium text-gray-700">From</label>
                  <button
                    type="button"
                    onClick={() => setShowFromDropdown(!showFromDropdown)}
                    className="w-full text-left px-3.5 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#4F46E5] focus:border-[#4F46E5] bg-white flex items-center justify-between text-gray-900"
                  >
                    <span>{from}</span>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </button>
                  {showFromDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 divide-y divide-gray-100 overflow-hidden">
                      {fromOptions.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => {
                            setFrom(opt);
                            setShowFromDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm text-gray-700 font-medium"
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-700">Subject</label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className="w-full px-3.5 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#4F46E5] focus:border-[#4F46E5] text-gray-900 bg-white"
                  />
                </div>

                <div className="flex items-center gap-3 pt-1">
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowTemplates(!showTemplates)}
                      className="flex items-center gap-2 py-2 px-3 border border-gray-200 hover:bg-gray-50 text-gray-705 rounded-lg text-xs font-semibold transition-colors bg-white"
                    >
                      <FileText className="w-4 h-4 text-gray-500" />
                      <span>Use Template</span>
                    </button>
                    {showTemplates && (
                      <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 w-64 divide-y divide-gray-100 overflow-hidden">
                        {templates.map((tmpl) => (
                          <button
                            key={tmpl.id}
                            type="button"
                            onClick={() => handleTemplateSelect(tmpl)}
                            className="w-full text-left px-4 py-3 hover:bg-gray-50 text-xs font-semibold text-gray-700 block transition-colors"
                          >
                            {tmpl.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleAIRephrase('professional')}
                      disabled={rephrasing || !body.trim()}
                      className="flex items-center gap-2 py-2 px-3 border border-gray-200 hover:bg-gray-50 text-gray-705 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 bg-white"
                    >
                      <Sparkles className="w-4 h-4 text-gray-500" />
                      <span>{rephrasing ? 'Rephrasing...' : 'AI Rephrase'}</span>
                    </button>
                    {/* Make Concise button removed */}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-700">Message</label>
                  <textarea
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    className="w-full px-4 py-3.5 border border-gray-200 rounded-lg text-sm min-h-[220px] focus:outline-none focus:ring-1 focus:ring-[#4F46E5] focus:border-[#4F46E5] leading-relaxed font-sans text-gray-900 bg-white"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    className="flex items-center gap-2 py-2 px-4 border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-colors bg-white"
                  >
                    <Paperclip className="w-4 h-4 text-gray-500" />
                    <span>Add Attachment</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="px-8 py-5 border-t border-gray-200 flex items-center justify-between bg-white shrink-0">
            <div className="flex gap-2">
              <button
                onClick={() => onDismiss(task.id)}
                className="px-4 py-2 border border-gray-200 hover:bg-gray-50 rounded-lg text-sm font-medium text-gray-750 transition-colors bg-white"
              >
                Dismiss
              </button>
              <button
                onClick={() => onSkip(task.id)}
                className="px-4 py-2 border border-gray-200 hover:bg-gray-50 rounded-lg text-sm font-medium text-gray-750 transition-colors bg-white"
              >
                Skip
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="px-4 py-2 border border-gray-200 hover:bg-gray-50 rounded-lg text-sm font-medium text-gray-750 transition-colors bg-white"
              >
                Save Draft
              </button>
              <button
                onClick={handleSend}
                disabled={isViewOnly || !to || !subject || !body}
                className={`px-5 py-2 text-white rounded-lg text-sm font-medium transition-all shadow-sm ${
                  !isViewOnly && to && subject && body ? 'bg-[#4F46E5] hover:bg-[#4338CA] cursor-pointer' : 'bg-gray-300 cursor-not-allowed opacity-60'
                }`}
              >
                Send
              </button>
            </div>
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
                        <span className="text-sm font-semibold text-gray-900" style={{ fontFamily: serifFont }}>{contactDetail.name}</span>
                        <span className="text-xs text-gray-500 font-medium mt-0.5" style={{ fontFamily: serifFont }}>{contactDetail.role}</span>
                        <span className="text-xs text-gray-500 font-medium" style={{ fontFamily: serifFont }}>{contactDetail.companyName}</span>
                      </div>
                    </div>

                    {/* Links Row */}
                    <div className="space-y-3 pt-1 text-sm font-medium">
                      <a
                        href={`tel:${contactDetail.phone}`}
                        className="flex items-center gap-3.5 text-[#4F46E5] hover:text-[#4338CA] transition-colors"
                        style={{ fontFamily: serifFont }}
                      >
                        <Phone className="w-4 h-4" />
                        <span>{contactDetail.phone}</span>
                      </a>
                      <a
                        href={`mailto:${contactDetail.email}`}
                        className="flex items-center gap-3.5 text-[#4F46E5] hover:text-[#4338CA] transition-colors break-all"
                        style={{ fontFamily: serifFont }}
                      >
                        <Mail className="w-4 h-4" />
                        <span>{contactDetail.email}</span>
                      </a>
                      <a
                        href={contactDetail.linkedInUrl || 'https://linkedin.com'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3.5 text-[#4F46E5] hover:text-[#4338CA] transition-colors"
                        style={{ fontFamily: serifFont }}
                      >
                        <LinkedinIcon className="w-4 h-4" />
                        <span className="flex items-center gap-1" style={{ fontFamily: serifFont }}>
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
                      <span className="text-[10px] text-gray-400 font-semibold" style={{ fontFamily: serifFont }}>{item.relativeTime}</span>
                      <p className="text-sm text-gray-800 font-semibold" style={{ fontFamily: serifFont }}>{item.label}</p>
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
                    <span className="font-semibold" style={{ fontFamily: serifFont }}>Industry</span>
                    <span className="text-gray-900 font-semibold" style={{ fontFamily: serifFont }}>{contactDetail.accountInfo?.industry || 'Technology'}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-gray-50">
                    <span className="font-semibold" style={{ fontFamily: serifFont }}>Company Size</span>
                    <span className="text-gray-900 font-semibold" style={{ fontFamily: serifFont }}>{contactDetail.accountInfo?.size || '750'} employees</span>
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
                    <span className="font-semibold" style={{ fontFamily: serifFont }}>Deal Name</span>
                    <span className="text-gray-900 font-semibold" style={{ fontFamily: serifFont }}>{contactDetail.dealInfo?.dealName || 'Q2 Renewal Proposal'}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-gray-50">
                    <span className="font-semibold" style={{ fontFamily: serifFont }}>Stage</span>
                    <span className="text-gray-900 font-semibold" style={{ fontFamily: serifFont }}>{contactDetail.dealInfo?.stage || 'Proposal / Negotiation'}</span>
                  </div>
                  <div className="flex justify-between py-1.5 border-b border-gray-50">
                    <span className="font-semibold" style={{ fontFamily: serifFont }}>Value</span>
                    <span className="text-gray-900 font-semibold" style={{ fontFamily: serifFont }}>{contactDetail.dealInfo?.value || '$240,000'}</span>
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
              style={{ fontFamily: serifFont }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
