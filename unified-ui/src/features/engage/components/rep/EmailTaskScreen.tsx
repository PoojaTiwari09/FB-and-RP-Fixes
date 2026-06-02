'use client';

import { useEffect, useState, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, ChevronDown, Mail, Paperclip, Sparkles, Check, RotateCcw } from 'lucide-react';
import type { ContactDetails, Task, TaskDetail } from './types/engage.types';
import {
  getContactDetails,
  getEmailDraft,
  getTaskDetail,
  rephraseEmail,
  saveDraft,
  sendEmail,
} from './services/engage.service';
import ContactSidebar from './ContactSidebar';

interface EmailTaskScreenProps {
  task: Task;
  allTasks: Task[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
  onSuccess?: (taskId: string) => void;
  inQueue?: boolean;
}

type ActiveTab = 'email' | 'crm';

function htmlToPlainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<[^>]*>/g, '')
    .replace(/\n\s*\n/g, '\n\n')
    .trim();
}

function plainTextToHtml(text: string): string {
  return text
    .split(/\n\s*\n/)
    .map((paragraph) => `<p>${paragraph.replace(/\n/g, '<br/>')}</p>`)
    .join('\n');
}

function fallbackContact(task: Task, contactEmail = ''): ContactDetails {
  return {
    contactId: task.contactId,
    contactName: task.contactName,
    jobTitle: '',
    company: task.company,
    phone: '',
    email: contactEmail,
    linkedInUrl: '',
    engagementTimeline: [],
    accountInfo: { accountName: task.company, arrValue: '' },
    dealInfo: {},
  };
}

function buildFallbackDraft(task: Task, detail: TaskDetail | null | undefined, contactEmail: string) {
  const first = task.contactName.split(' ')[0] || 'there';
  const steps = detail?.recommendedNextSteps?.filter(Boolean).slice(0, 4) ?? [];
  const insight = detail?.aiInsight?.trim();
  const subject =
    task.sequenceName && task.sequenceStep
      ? `${task.sequenceName} — ${task.sequenceStep} for ${task.company}`
      : `Following up — ${task.company}`;

  const stepsText =
    steps.length > 0
      ? `\n\nWhat's next:\n${steps.map((step, i) => `${i + 1}. ${step}`).join('\n')}`
      : '\n\nWould you be open to a brief call this week to walk through priorities and timeline?';

  const body = `Hi ${first},

I wanted to follow up regarding ${task.company}.${insight ? `\n\n${insight}` : ''}${stepsText}

Best,
Alex`;

  return { subject, body, contactEmail };
}

function RephraseDiff({ original, rephrased }: { original: string; rephrased: string }) {
  const words2 = rephrased.split(/(\s+)/);

  // Normalize words for comparison
  const normalize = (w: string) => w.toLowerCase().replace(/[^\w]/g, '');
  const originalWordsSet = new Set(
    original
      .split(/\s+/)
      .map(normalize)
      .filter((w) => w.length > 0),
  );

  return (
    <div className="font-sans">
      {words2.map((word, i) => {
        if (!word.trim()) return <span key={i}>{word}</span>;

        const cleanWord = normalize(word);
        const isNew = cleanWord && !originalWordsSet.has(cleanWord);

        return (
          <span
            key={i}
            className={
              isNew
                ? 'bg-purple-50 text-purple-700 font-semibold px-0.5 rounded border-b-2 border-purple-200'
                : 'text-gray-700'
            }
          >
            {word}
          </span>
        );
      })}
    </div>
  );
}

export default function EmailTaskScreen({
  task,
  allTasks,
  currentIndex,
  onClose,
  onNavigate,
  onSuccess,
  inQueue = false,
}: EmailTaskScreenProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('email');
  const [to, setTo] = useState('');
  const [fromLabel, setFromLabel] = useState('alex.chen@company.com (Gmail)');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [contact, setContact] = useState<ContactDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [rephrasing, setRephrasing] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [tone, setTone] = useState('formal');
  const [rephrasePreview, setRephrasePreview] = useState<{
    original: string;
    rephrased: string;
    isSelection: boolean;
    selectionStart?: number;
    selectionEnd?: number;
  } | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setSendSuccess(false);
    setDraftSaved(false);

    Promise.all([
      getEmailDraft(task.taskId),
      getTaskDetail(task.taskId),
      task.contactId ? getContactDetails(task.contactId) : Promise.resolve(undefined),
    ])
      .then(([draft, detail, contactData]) => {
        if (!active) return;

        const contactEmail = contactData?.email || draft?.contactEmail || '';
        const resolvedDraft =
          draft?.subject && draft?.bodyHtml
            ? draft
            : buildFallbackDraft(task, detail, contactEmail);

        if (draft?.subject && draft?.bodyHtml) {
          setTo(draft.contactEmail || contactEmail);
          setFromLabel(draft.fromLabel || `${draft.fromEmail} (Gmail)`);
          setSubject(draft.subject || '');
          setBody(htmlToPlainText(draft.bodyHtml || ''));
        } else {
          setTo(resolvedDraft.contactEmail);
          setFromLabel('alex.chen@company.com (Gmail)');
          setSubject(resolvedDraft.subject);
          setBody((resolvedDraft as any).body || '');
        }

        setContact(contactData || fallbackContact(task, contactEmail));
      })
      .catch((err) => {
        console.error('Failed to load email task data:', err);
        if (active) {
          const fallback = buildFallbackDraft(task, null, '');
          setTo(fallback.contactEmail);
          setSubject(fallback.subject);
          setBody(fallback.body);
          setContact(fallbackContact(task));
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [task.taskId, task.contactId, task.contactName, task.company]);

  const handleSend = async () => {
    try {
      await sendEmail(task.taskId, {
        to,
        from: fromLabel,
        subject,
        body,
        bodyHtml: plainTextToHtml(body),
      });
      setSendSuccess(true);
      setTimeout(() => {
        setSendSuccess(false);
        if (onSuccess) {
          onSuccess(task.taskId);
        } else {
          onClose();
        }
      }, 1200);
    } catch (err) {
      console.error('Failed to send email:', err);
    }
  };

  const handleSaveDraft = async () => {
    try {
      await saveDraft(task.taskId, {
        contactName: task.contactName,
        contactEmail: to,
        fromEmail: fromLabel.replace(/\s*\(.*\)$/, ''),
        fromLabel,
        subject,
        body,
        bodyHtml: plainTextToHtml(body),
      });
      setDraftSaved(true);
      setTimeout(() => setDraftSaved(false), 2000);
    } catch (err) {
      console.error('Failed to save draft:', err);
    }
  };

  const handleRephrase = async () => {
    if (!body.trim()) return;

    let textToRephrase = body;
    let isSelection = false;
    let selectionStart = 0;
    let selectionEnd = 0;

    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart;
      const end = textareaRef.current.selectionEnd;
      if (start !== end) {
        textToRephrase = body.substring(start, end);
        isSelection = true;
        selectionStart = start;
        selectionEnd = end;
      }
    }

    setRephrasing(true);
    try {
      const { rephrasedBody } = await rephraseEmail(task.taskId, {
        subject,
        body: textToRephrase,
        contactName: task.contactName,
        company: task.company,
        tone,
      });

      setRephrasePreview({
        original: textToRephrase,
        rephrased: rephrasedBody,
        isSelection,
        selectionStart,
        selectionEnd,
      });
    } catch (err) {
      console.error('Failed to rephrase email:', err);
    } finally {
      setRephrasing(false);
    }
  };

  const handleAcceptRephrase = () => {
    if (!rephrasePreview) return;

    if (rephrasePreview.isSelection) {
      const newBody =
        body.substring(0, rephrasePreview.selectionStart ?? 0) +
        rephrasePreview.rephrased +
        body.substring(rephrasePreview.selectionEnd ?? 0);
      setBody(newBody);
    } else {
      setBody(rephrasePreview.rephrased);
    }
    setRephrasePreview(null);
  };

  const handleCancelRephrase = () => {
    setRephrasePreview(null);
  };

  const dueLabel = task.dueDateTime?.startsWith('Due:')
    ? task.dueDateTime.replace(/^Due:\s*/, '')
    : task.scheduledTime || 'Today 2:00 PM';

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
            <span>Due: {dueLabel}</span>
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

          {loading ? (
            <div className="flex-1 px-5 py-5 space-y-4">
              <div className="skeleton h-10 rounded-lg" />
              <div className="skeleton h-10 rounded-lg" />
              <div className="skeleton h-10 rounded-lg" />
              <div className="skeleton h-48 rounded-lg" />
            </div>
          ) : activeTab === 'email' ? (
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
                  <select
                    value={fromLabel}
                    onChange={(e) => setFromLabel(e.target.value)}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none cursor-pointer text-gray-800 bg-white"
                  >
                    <option>{fromLabel}</option>
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
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-1.5 text-xs font-medium text-gray-600 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50 cursor-pointer transition-colors">
                  Use Template
                </button>
                <div className="flex items-center gap-1 bg-white border border-purple-200 rounded-lg px-2 py-1">
                  <span className="text-[10px] font-semibold text-purple-400 uppercase tracking-wider mr-1">Tone</span>
                  {(['casual', 'formal', 'demanding'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTone(t)}
                      className={`px-2 py-0.5 text-[11px] font-medium rounded transition-colors capitalize ${
                        tone === t
                          ? 'bg-purple-100 text-purple-700'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleRephrase}
                  disabled={rephrasing}
                  className="flex items-center gap-1.5 text-xs font-medium text-purple-600 border border-purple-200 rounded-lg px-3 py-1.5 hover:bg-purple-50 disabled:opacity-50 cursor-pointer transition-colors ml-auto"
                >
                  <Sparkles size={12} /> {rephrasing ? 'Rephrasing…' : 'AI Rephrase'}
                </button>
              </div>

              {/* Message */}
              <div className="relative">
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Message</label>
                <textarea
                  ref={textareaRef}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={12}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none text-gray-800"
                />

                {rephrasePreview && (
                  <div className="absolute inset-0 bg-white/95 rounded-lg border border-purple-200 z-10 flex flex-col">
                    <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 bg-purple-50/50">
                      <div className="flex items-center gap-2">
                        <Sparkles size={14} className="text-purple-600" />
                        <span className="text-xs font-bold text-purple-900">Review AI Rephrase ({tone})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleCancelRephrase}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-gray-600 hover:bg-gray-200 rounded transition-colors"
                        >
                          <RotateCcw size={12} /> Discard
                        </button>
                        <button
                          onClick={handleAcceptRephrase}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-white bg-purple-600 hover:bg-purple-700 rounded transition-colors shadow-sm"
                        >
                          <Check size={12} /> Accept Changes
                        </button>
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 text-sm leading-relaxed text-gray-800 whitespace-pre-wrap">
                      <RephraseDiff original={rephrasePreview.original} rephrased={rephrasePreview.rephrased} />
                    </div>
                  </div>
                )}
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
              disabled={loading}
              className="text-sm font-medium text-gray-600 border border-gray-200 rounded-lg px-4 py-2 hover:bg-gray-50 disabled:opacity-50 cursor-pointer transition-colors"
            >
              {draftSaved ? 'Draft Saved!' : 'Save Draft'}
            </button>
            <button
              onClick={handleSend}
              disabled={loading}
              className="text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-lg px-5 py-2 cursor-pointer transition-colors"
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
