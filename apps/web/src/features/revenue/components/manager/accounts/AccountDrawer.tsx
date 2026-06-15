'use client';

import { useState, useEffect, useRef } from 'react';
import {
  X,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Send,
  CheckSquare,
  Square,
  RefreshCw,
  FileText,
  MessageSquare,
  Target,
  AlertTriangle,
  CheckCircle,
  Users,
  Activity,
} from 'lucide-react';
import type { AccountRow } from '@revenue/types/accounts.types';
import {
  useAccountOverview,
  useAccountActivity,
  useAccountBriefs,
  useAccountTodos,
  useAccountNotes,
  useAccountCrm,
} from '@revenue/hooks/useAccountsData';
import * as api from '@revenue/services/accountsService';
import * as mock from '@revenue/services/mock/mockAccountsService';

type TabId = 'overview' | 'activity' | 'briefs' | 'todos' | 'notes' | 'crm';

const TABS: { id: TabId; label: string }[] = [
  { id: 'overview',  label: 'Overview'  },
  { id: 'activity',  label: 'Activity'  },
  { id: 'briefs',    label: 'Briefs'    },
  { id: 'todos',     label: 'To-dos'    },
  { id: 'notes',     label: 'Notes'     },
  { id: 'crm',       label: 'CRM'       },
];

const SEVERITY_COLORS = {
  HIGH:   'bg-red-100 text-red-700 border-red-200',
  MEDIUM: 'bg-amber-100 text-amber-700 border-amber-200',
  LOW:    'bg-green-100 text-green-700 border-green-200',
};

interface Props {
  account: AccountRow | null;
  onClose: () => void;
}

// ─── Overview Tab ────────────────────────────────────────────
function OverviewTab({ accountId }: { accountId: string }) {
  const { data, isLoading } = useAccountOverview(accountId);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());

  if (isLoading) return (
    <div className="space-y-3 p-4">
      {[0,1,2].map(i=><div key={i} className="skeleton h-16 w-full rounded-lg"/>)}
    </div>
  );

  const risks = data?.risksAndObjections ?? [];
  const info = (data as any)?.overviewInfo;
  const recentActs = (data as any)?.recentActivities ?? [];

  return (
    <div className="divide-y divide-gray-100 pb-6">
      {info && (
        <div className="px-5 py-4 bg-gray-50/50">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Account Summary</p>
          <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
            <div>
              <span className="text-xs text-gray-400 block">Assigned Rep</span>
              <span className="font-medium text-gray-800">{info.assignedRep || 'Unassigned'}</span>
            </div>
            <div>
              <span className="text-xs text-gray-400 block">Health Score</span>
              <span className={`font-semibold ${(info.healthScore ?? 0) >= 70 ? 'text-green-600' : 'text-amber-600'}`}>
                {info.healthScore != null ? `${info.healthScore}/100` : 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-xs text-gray-400 block">Exit ARR</span>
              <span className="font-medium text-gray-800">${info.exitArr?.toLocaleString() || '0'}</span>
            </div>
            <div>
              <span className="text-xs text-gray-400 block">Open Deals</span>
              <span className="font-medium text-gray-800">${info.openDealsAmount?.toLocaleString() || '0'}</span>
            </div>
            <div>
              <span className="text-xs text-gray-400 block">Contacts Count</span>
              <span className="font-medium text-gray-800">{info.contactsCount}</span>
            </div>
            <div>
              <span className="text-xs text-gray-400 block">Last Activity</span>
              <span className="font-medium text-gray-800">{info.lastActivityLabel}</span>
            </div>
            <div>
              <span className="text-xs text-gray-400 block">Renewal Date</span>
              <span className="font-medium text-gray-800">
                {info.renewalDate ? new Date(info.renewalDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
              </span>
            </div>
            <div className="col-span-2">
              <span className="text-xs text-gray-400 block">Manager Note</span>
              <p className="font-medium text-gray-700 mt-0.5 text-xs whitespace-pre-wrap">{info.managerNote || 'None'}</p>
            </div>
          </div>
        </div>
      )}
      <div>
        <p className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide bg-gray-50/20">Risks & Objections</p>
        {risks.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-400">No risks or objections recorded.</div>
        ) : (
          risks.map((r, i) => (
            <div key={i} className="px-5 py-2.5 last:pb-4">
              <button
                onClick={() => {
                  const next = new Set(expanded);
                  next.has(i) ? next.delete(i) : next.add(i);
                  setExpanded(next);
                }}
                className="flex w-full items-center justify-between text-left"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${SEVERITY_COLORS[r.severity]}`}>
                    {r.severity}
                  </span>
                  <span className="text-sm font-medium text-gray-800 truncate">{r.title}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  <span className="text-xs text-gray-400">{r.mentionedCount}×</span>
                  {expanded.has(i) ? <ChevronUp size={14} className="text-gray-400"/> : <ChevronDown size={14} className="text-gray-400"/>}
                </div>
              </button>
              {expanded.has(i) && (
                <p className="mt-2 text-xs text-gray-500">
                  Last mentioned: {r.lastMentioned} · Mentioned {r.mentionedCount} time{r.mentionedCount !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          ))
        )}
      </div>
      <div>
        <p className="px-5 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide bg-gray-50/20">Recent Activity Timeline</p>
        {recentActs.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-400">No recent activity recorded.</div>
        ) : (
          <div className="divide-y divide-gray-50 px-2">
            {recentActs.map((act: any, i: number) => (
              <div key={i} className="flex gap-3 px-3 py-2 text-xs">
                <span className="text-sm mt-0.5 shrink-0">{ACTIVITY_ICONS[act.type] ?? '•'}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-800 truncate">{act.subject}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {act.type} · {new Date(act.datetime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Activity Tab ────────────────────────────────────────────
const ACTIVITY_TYPES = ['all', 'Meeting', 'Call', 'Email', 'Note'] as const;
type ActType = typeof ACTIVITY_TYPES[number];

const ACTIVITY_ICONS: Record<string, string> = {
  Meeting: '📅', Call: '📞', Email: '✉️', Note: '📝',
};

function ActivityTab({ accountId }: { accountId: string }) {
  const [typeFilter, setTypeFilter] = useState<ActType>('all');
  const { data, isLoading } = useAccountActivity(accountId, { type: typeFilter === 'all' ? 'all' : typeFilter, page: 1, size: 20 });

  const items = data?.items ?? [];

  return (
    <div>
      <div className="flex gap-1 px-4 pt-3 pb-2 border-b border-gray-100">
        {ACTIVITY_TYPES.map((t) => (
          <button
            key={t}
            onClick={() => setTypeFilter(t)}
            className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize transition-colors ${
              typeFilter === t ? 'bg-blue-600 text-white' : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      {isLoading ? (
        <div className="p-4 space-y-3">
          {[0,1,2].map(i=><div key={i} className="skeleton h-14 w-full rounded-lg"/>)}
        </div>
      ) : items.length === 0 ? (
        <p className="p-6 text-center text-sm text-gray-400">No activity recorded.</p>
      ) : (
        <div className="divide-y divide-gray-50">
          {items.map((item, i) => (
            <div key={i} className="flex gap-3 px-4 py-3">
              <span className="text-base mt-0.5 shrink-0">{ACTIVITY_ICONS[item.type] ?? '•'}</span>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{item.subject}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {item.type} · with {item.with} · by {item.createdBy}
                </p>
                <p className="text-xs text-gray-400">
                  {new Date(item.datetime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Helper to parse raw markdown into structured sections when JSON parsing fails
function parseMarkdownToSections(text: string): Record<string, string> {
  const sections: Record<string, string> = {};
  const lines = text.split('\n');
  
  const headingMappings = [
    { key: 'overview', patterns: [/overview/i, /summary/i, /about/i] },
    { key: 'keyDiscussionPoints', patterns: [/discussion/i, /key.*point/i, /topic/i] },
    { key: 'customerNeedsGoals', patterns: [/need/i, /goal/i, /customer/i] },
    { key: 'risksObjections', patterns: [/risk/i, /objection/i, /concern/i] },
    { key: 'decisionsCommitments', patterns: [/decision/i, /commitment/i, /action/i] },
    { key: 'keyStakeholders', patterns: [/stakeholder/i, /contact/i, /people/i] },
    { key: 'recentActivityContext', patterns: [/activity/i, /context/i, /history/i] }
  ];

  let currentKey: string | null = null;
  let currentContent: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Check for Markdown headers (e.g. ### Overview or **Overview**)
    const isHeader = trimmed.startsWith('#') || 
                     (trimmed.startsWith('**') && trimmed.endsWith('**') && trimmed.length < 100) ||
                     (trimmed.endsWith(':') && trimmed.length < 50 && !trimmed.includes('http'));

    if (isHeader) {
      if (currentKey && currentContent.length > 0) {
        sections[currentKey] = currentContent.join('\n').trim();
        currentContent = [];
      }
      
      const cleanHeader = trimmed.replace(/[#\*:]/g, '').trim();
      let matchedKey: string | null = null;
      for (const mapping of headingMappings) {
        if (mapping.patterns.some(p => p.test(cleanHeader))) {
          matchedKey = mapping.key;
          break;
        }
      }
      currentKey = matchedKey;
    } else {
      if (currentKey) {
        currentContent.push(line);
      } else {
        currentKey = 'overview';
        currentContent.push(line);
      }
    }
  }

  if (currentKey && currentContent.length > 0) {
    sections[currentKey] = currentContent.join('\n').trim();
  }

  return sections;
}

// Helper to format raw markdown list items (e.g. * **Title**: Desc) into beautifully styled HTML nodes
function renderFormattedContent(content: string, bulletColor: string = '#3B82F6') {
  if (!content) return null;
  
  const lines = content.split('\n');
  const renderedElements: React.ReactNode[] = [];
  
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    
    // Match bullet point with bold header: * **Title**: Description
    const boldTitleMatch = trimmed.match(/^[\*\-\s]*\*\*(.*?)\*\*[:\s]*(.*)$/);
    if (boldTitleMatch) {
      const title = boldTitleMatch[1].trim();
      const desc = boldTitleMatch[2].trim();
      renderedElements.push(
        <div key={index} className="flex items-start gap-2.5 mb-2 last:mb-0">
          <span 
            className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full" 
            style={{ backgroundColor: bulletColor }}
          />
          <div className="text-sm leading-relaxed">
            <strong className="font-semibold text-gray-900">{title}</strong>
            {desc && <span className="text-gray-600">: {desc}</span>}
          </div>
        </div>
      );
      return;
    }
    
    // Match simple bullet: * Description
    const simpleBulletMatch = trimmed.match(/^[\*\-\s]+(.*)$/);
    if (simpleBulletMatch) {
      const desc = simpleBulletMatch[1].trim();
      renderedElements.push(
        <div key={index} className="flex items-start gap-2.5 mb-2 last:mb-0">
          <span 
            className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full" 
            style={{ backgroundColor: bulletColor }}
          />
          <div className="text-sm leading-relaxed text-gray-600">{desc}</div>
        </div>
      );
      return;
    }
    
    // Regular text paragraph — render with bullet point using the section's color
    renderedElements.push(
      <div key={index} className="flex items-start gap-2.5 mb-2 last:mb-0">
        <span 
          className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full" 
          style={{ backgroundColor: bulletColor }}
        />
        <div className="text-sm leading-relaxed text-gray-600">{trimmed}</div>
      </div>
    );
  });
  
  return <div className="space-y-1.5">{renderedElements}</div>;
}

// ─── Briefs Tab ──────────────────────────────────────────────
const SECTION_ORDER = [
  { key: 'overview', title: 'Overview', icon: FileText, color: '#3B82F6' },
  { key: 'keyDiscussionPoints', title: 'Key Discussion Points', icon: MessageSquare, color: '#7C3AED' },
  { key: 'customerNeedsGoals', title: 'Customer Needs & Goals', icon: Target, color: '#0D9488' },
  { key: 'risksObjections', title: 'Risks & Objections', icon: AlertTriangle, color: '#F59E0B' },
  { key: 'decisionsCommitments', title: 'Decisions & Commitments', icon: CheckCircle, color: '#10B981' },
  { key: 'keyStakeholders', title: 'Key Stakeholders', icon: Users, color: '#EC4899' },
  { key: 'recentActivityContext', title: 'Recent Activity Context', icon: Activity, color: '#F97316' },
];

function BriefsTab({ accountId }: { accountId: string }) {
  const { data, isLoading, regenerate } = useAccountBriefs(accountId);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['overview']));

  let parsedData: any = {};

  if (data?.briefContent) {
    try {
      parsedData = JSON.parse(data.briefContent);
    } catch (e) {
      parsedData = parseMarkdownToSections(data.briefContent);
    }
  }

  const toggleSection = (sectionId: string) => {
    const newSet = new Set(expandedSections);
    if (newSet.has(sectionId)) {
      newSet.delete(sectionId);
    } else {
      newSet.add(sectionId);
    }
    setExpandedSections(newSet);
  };

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-6 w-6 rounded-full bg-gray-200 animate-pulse" />
            <div className="h-6 flex-1 bg-gray-200 rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }



  return (
    <div className="px-6 py-5">
      {/* Metadata Bar */}
      <div className="mb-6 flex items-center justify-between rounded-md bg-gray-50 px-3 py-2 text-[11px] font-medium text-gray-500 ring-1 ring-inset ring-gray-200">
        <div className="flex items-center gap-1.5">
          <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
          Generated from Account Data
        </div>
        <div className="flex items-center gap-3">
          <span>Generated: Today</span>
          <button
            onClick={regenerate}
            className="flex items-center gap-1 text-blue-600 hover:text-blue-700 transition-colors"
          >
            <RefreshCw size={12} />
            Regenerate
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {SECTION_ORDER.map((section) => {
          let content = parsedData[section.key];
          
          // Merge decisions & commitments and next steps
          if (section.key === 'decisionsCommitments' && parsedData.nextSteps) {
            const nextStepsText = parsedData.nextSteps.trim();
            if (nextStepsText) {
              content = (content ? content.trim() + '\n\n' : '') + `**Next Steps:**\n${nextStepsText}`;
            }
          }

          const isExpanded = expandedSections.has(section.key);
          const Icon = section.icon;

          return (
            <div key={section.key} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <button
                onClick={() => toggleSection(section.key)}
                className="w-full flex items-center justify-between px-6 py-4 bg-gray-50/50 hover:bg-gray-50 cursor-pointer text-left transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white" 
                    style={{ backgroundColor: section.color }}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <span 
                    className="font-semibold text-gray-900" 
                    style={{ fontFamily: 'var(--font-serif)' }}
                  >
                    {section.title}
                  </span>
                </div>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-gray-500" />
                )}
              </button>
              
              {isExpanded && (
                <div className="px-6 py-4 border-t border-gray-200 text-sm text-gray-700 leading-relaxed">
                  {content ? (
                    renderFormattedContent(content, section.color)
                  ) : (
                    <span className="text-gray-400 italic">
                      Under this feature, it's still not reflecting.
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Todos Tab ───────────────────────────────────────────────
function TodosTab({ accountId }: { accountId: string }) {
  const { data, isLoading, toggleTodo } = useAccountTodos(accountId);
  const [localCompleted, setLocalCompleted] = useState<Record<string, boolean>>({});

  const todos = data?.todos ?? [];

  async function handleToggle(todoId: string, current: boolean) {
    setLocalCompleted((prev) => ({ ...prev, [todoId]: !current }));
    await toggleTodo(todoId, !current);
  }

  if (isLoading) return <div className="p-4 space-y-3">{[0,1,2].map(i=><div key={i} className="skeleton h-10 w-full rounded"/>)}</div>;

  return (
    <div className="divide-y divide-gray-50 px-2">
      {todos.length === 0
        ? <p className="p-6 text-center text-sm text-gray-400">No to-dos for this account.</p>
        : todos.map((todo) => {
          const done = localCompleted[todo.id] ?? todo.completed;
          return (
            <div key={todo.id} className="flex items-start gap-2.5 px-2 py-3">
              <button onClick={() => handleToggle(todo.id, done)} className="mt-0.5 shrink-0 text-gray-400 hover:text-blue-600 transition-colors">
                {done ? <CheckSquare size={16} className="text-blue-600"/> : <Square size={16}/>}
              </button>
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-medium ${done ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                  {todo.title}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">{todo.assignee} · Due {todo.dueDate}</p>
              </div>
            </div>
          );
        })
      }
    </div>
  );
}

// ─── Notes Tab ───────────────────────────────────────────────
function NotesTab({ accountId }: { accountId: string }) {
  const { data, isLoading, saveNotes } = useAccountNotes(accountId);
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedNotes, setSavedNotes] = useState<Array<{ text: string; date: string }>>([]);

  useEffect(() => {
    if (data?.notes) {
      try {
        const parsed = JSON.parse(data.notes);
        if (Array.isArray(parsed)) {
          setSavedNotes(parsed);
          return;
        }
      } catch (e) {
        // Not a JSON array, treat as single old note
      }
      setSavedNotes([{ text: data.notes, date: data.updatedAt || new Date().toISOString() }]);
    } else {
      setSavedNotes([]);
    }
  }, [data?.notes, data?.updatedAt]);

  async function handleSave() {
    if (!value.trim()) return;
    setSaving(true);
    const newNote = {
      text: value,
      date: new Date().toISOString()
    };
    const updated = [newNote, ...savedNotes];
    setSavedNotes(updated);
    await saveNotes(JSON.stringify(updated));
    setValue('');
    setSaving(false);
  }

  if (isLoading) return <div className="p-4"><div className="skeleton h-32 w-full rounded"/></div>;

  return (
    <div className="px-4 py-4 flex flex-col gap-4">
      {/* Notes Box Section */}
      <div className="flex flex-col gap-2">
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          rows={4}
          className="w-full rounded-lg border border-gray-200 p-3 text-sm text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition"
          placeholder="Type a new manager note or update here…"
        />
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving || !value.trim()}
            className="px-3.5 py-2 rounded-lg bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving…' : 'Save Note'}
          </button>
        </div>
      </div>

      {/* Saved Notes Section */}
      <div className="border-t border-gray-100 pt-4 flex flex-col gap-3">
        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Saved Notes</h4>
        {savedNotes.length === 0 ? (
          <p className="text-xs text-gray-400 italic">No notes saved yet.</p>
        ) : (
          <div className="space-y-3">
            {savedNotes.map((note, idx) => (
              <div key={idx} className="rounded-xl border border-gray-150 bg-gray-50/50 p-3 shadow-sm hover:border-gray-300 transition-colors">
                <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{note.text}</p>
                <p className="text-[10px] text-gray-400 mt-2 font-medium">
                  Saved on {new Date(note.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── CRM Tab ─────────────────────────────────────────────────
function CrmTab({ accountId }: { accountId: string }) {
  const { data, isLoading } = useAccountCrm(accountId);
  const fields = data?.crmFields ?? [];

  if (isLoading) return <div className="p-4 space-y-2">{[0,1,2,3].map(i=><div key={i} className="skeleton h-8 w-full rounded"/>)}</div>;

  return (
    <div className="px-4 py-4">
      {fields.length === 0
        ? <p className="text-center text-sm text-gray-400">No CRM data available.</p>
        : <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            {fields.map((f) => (
              <div key={f.label}>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{f.label}</p>
                <p className="text-sm text-gray-800 mt-0.5">{f.value}</p>
              </div>
            ))}
          </div>
      }
    </div>
  );
}

// ─── AI Chat ─────────────────────────────────────────────────
function AiChatInput({ accountId, accountName }: { accountId: string; accountName: string }) {
  const [msg, setMsg] = useState('');
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(false);
  const sessionId = useRef(`session-${accountId}-${Date.now()}`);

  async function handleSend() {
    if (!msg.trim()) return;
    setLoading(true);
    try {
      const res = await api.sendAiChat(accountId, { message: msg, sessionId: sessionId.current });
      setReply(res.reply);
    } catch {
      const res = await mock.mockAiChat(msg, accountName);
      setReply(res.reply);
    }
    setMsg('');
    setLoading(false);
  }

  return (
    <div className="border-t border-gray-100 p-4 space-y-2">
      {reply && (
        <div className="rounded-lg bg-blue-50 border border-blue-100 p-3 text-sm text-gray-700">
          {reply}
        </div>
      )}
      <div className="flex gap-2">
        <input
          value={msg}
          onChange={(e) => setMsg(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
          placeholder={`Ask anything about ${accountName}…`}
          className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition"
          disabled={loading}
        />
        <button
          onClick={handleSend}
          disabled={loading || !msg.trim()}
          className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <Send size={15} />
        </button>
      </div>
    </div>
  );
}

// ─── Main Drawer ─────────────────────────────────────────────
export default function AccountDrawer({ account, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  useEffect(() => {
    if (account) setActiveTab('overview');
  }, [account?.accountId]);

  if (!account) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-30 bg-black/20 backdrop-blur-[1px]"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div className="fixed right-0 top-0 z-40 h-full w-[480px] max-w-full flex flex-col bg-white shadow-2xl border-l border-gray-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <div className="min-w-0">
            <h2 className="text-base font-semibold text-gray-900 truncate">{account.accountName}</h2>
            <p className="text-xs text-gray-400 mt-0.5">Exit ARR: ${account.exitARR.toLocaleString()}</p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 ml-3">
            <button className="p-1.5 text-gray-400 hover:text-gray-700 transition-colors" title="Open full page">
              <ExternalLink size={15} />
            </button>
            <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* AI Chat — always visible at top */}
        <AiChatInput accountId={account.accountId} accountName={account.accountName} />

        {/* Tab bar */}
        <div className="flex gap-0 border-b border-gray-100 shrink-0 px-4 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content — scrollable */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {activeTab === 'overview' && <OverviewTab accountId={account.accountId} />}
          {activeTab === 'activity'  && <ActivityTab accountId={account.accountId} />}
          {activeTab === 'briefs'    && <BriefsTab accountId={account.accountId} />}
          {activeTab === 'todos'     && <TodosTab accountId={account.accountId} />}
          {activeTab === 'notes'     && <NotesTab accountId={account.accountId} />}
          {activeTab === 'crm'       && <CrmTab accountId={account.accountId} />}
        </div>
      </div>
    </>
  );
}
