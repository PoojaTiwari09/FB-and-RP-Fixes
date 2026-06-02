'use client';

import { useState, useEffect, useRef } from 'react';
import { X, ExternalLink, ChevronDown, ChevronUp, Send, CheckSquare, Square, RefreshCw } from 'lucide-react';
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

  if (risks.length === 0) return (
    <div className="p-6 text-center text-sm text-gray-400">No risks or objections recorded.</div>
  );

  return (
    <div className="divide-y divide-gray-100">
      <p className="px-4 py-2.5 text-xs font-semibold text-gray-400 uppercase tracking-wide">Risks & Objections</p>
      {risks.map((r, i) => (
        <div key={i} className="px-4 py-3">
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
      ))}
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

// ─── Briefs Tab ──────────────────────────────────────────────
function BriefsTab({ accountId }: { accountId: string }) {
  const { data, isLoading } = useAccountBriefs(accountId);

  if (isLoading) return <div className="p-4 space-y-2"><div className="skeleton h-4 w-full rounded"/><div className="skeleton h-24 w-full rounded"/></div>;

  return (
    <div className="px-4 py-4">
      {data?.briefContent ? (
        <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed prose-sm">
          {data.briefContent}
        </div>
      ) : (
        <p className="text-sm text-gray-400 text-center">No brief available.</p>
      )}
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
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (data?.notes !== undefined) setValue(data.notes);
  }, [data?.notes]);

  async function handleSave() {
    setSaving(true);
    await saveNotes(value);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (isLoading) return <div className="p-4"><div className="skeleton h-32 w-full rounded"/></div>;

  return (
    <div className="px-4 py-4 flex flex-col gap-3">
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={8}
        className="w-full rounded-lg border border-gray-200 p-3 text-sm text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 transition"
        placeholder="Add manager notes…"
      />
      <div className="flex items-center justify-between">
        {data?.updatedAt && (
          <span className="text-xs text-gray-400">
            Last saved: {new Date(data.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        )}
        <button
          onClick={handleSave}
          disabled={saving}
          className="ml-auto px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 disabled:opacity-60 transition-colors"
        >
          {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Notes'}
        </button>
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
      const res = mock.mockAiChat(msg);
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

        {/* AI Chat — always visible at bottom */}
        <AiChatInput accountId={account.accountId} accountName={account.accountName} />
      </div>
    </>
  );
}
