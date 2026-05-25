'use client';

import { useEffect, useState, useCallback } from 'react';
import { usePanelStore } from '@/store/usePanelStore';
import { useSessionStore } from '@/store/useSessionStore';
import { fetchAccountDetail, fetchTodos, createTodo, updateTodo, deleteTodo, editSupplementary, generateSummary, askAI, fetchActivities } from '@/lib/api';
import { formatCurrency, formatDate, formatDateTime, formatRelativeTime, formatDuration, getRiskColor, getStageColor } from '@/lib/utils';
import type { AccountDetail, PanelTab, TodoItem, AIBrief } from '@/types';

const PANEL_TABS: { id: PanelTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'timeline', label: 'Activity' },
  { id: 'briefs', label: 'AI Briefs' },
  { id: 'todos', label: 'To-dos' },
  { id: 'notes', label: 'Notes' },
  { id: 'crm', label: 'CRM Sync' },
];

export default function AccountPanel() {
  const { isOpen, selectedAccountId, activeTab, closePanel, setActiveTab } = usePanelStore();
  const role = useSessionStore((s) => s.role);
  const aiBriefsEnabled = useSessionStore((s) => s.aiBriefsEnabled);
  const boardBriefPeriodDays = useSessionStore((s) => s.boardBriefPeriodDays);
  const boardBriefType = useSessionStore((s) => s.boardBriefType);
  const [account, setAccount] = useState<AccountDetail | null>(null);
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [newTodo, setNewTodo] = useState('');
  const [activityFilter, setActivityFilter] = useState<string>('ALL');
  const [activityFromDate, setActivityFromDate] = useState<string>('');
  const [activityToDate, setActivityToDate] = useState<string>('');
  const [activityPage, setActivityPage] = useState<number>(1);
  const [liveActivities, setLiveActivities] = useState<any[]>([]);
  const [activityTotal, setActivityTotal] = useState<number>(0);
  const [activitiesLoading, setActivitiesLoading] = useState<boolean>(false);
  const [brief, setBrief] = useState<AIBrief | null>(null);
  const [briefLoading, setBriefLoading] = useState(false);
  const [briefScope, setBriefScope] = useState<string>('entire_account');
  // null means "use board default"; number means user manually overrode it
  const [briefPeriodOverride, setBriefPeriodOverride] = useState<number | null>(null);
  // boardBriefPeriodDays=0 means store not yet initialised; fall back to 90 as safe default
  const briefPeriod = briefPeriodOverride ?? (boardBriefPeriodDays || 90);
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<{ role: string; content: string; citations?: any[] }[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  // When the board's configured default changes, drop any manual override
  useEffect(() => {
    setBriefPeriodOverride(null);
    setBrief(null);
  }, [boardBriefPeriodDays]);

  // Load account detail
  useEffect(() => {
    if (!selectedAccountId || !isOpen) return;
    setLoading(true);
    setBrief(null);
    setChatHistory([]);
    setChatInput('');
    fetchAccountDetail(selectedAccountId)
      .then((data) => setAccount(data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedAccountId, isOpen]);

  // Load todos when tab is active
  useEffect(() => {
    if (activeTab === 'todos' && selectedAccountId) {
      fetchTodos(selectedAccountId).then((t) => setTodos(t.filter((item) => item.type === 'todo'))).catch(console.error);
    }
    if (activeTab === 'notes' && selectedAccountId) {
      fetchTodos(selectedAccountId).then((t) => setTodos(t.filter((item) => item.type === 'note'))).catch(console.error);
    }
    if (activeTab === 'briefs' && selectedAccountId && !brief) {
      loadBrief(selectedAccountId, briefScope, briefPeriod, boardBriefType);
    }
  }, [activeTab, selectedAccountId, brief, briefScope, briefPeriod, boardBriefType]);

  // Load activities specifically when timeline tab is active or filters change
  useEffect(() => {
    if (activeTab === 'timeline' && selectedAccountId) {
      const load = async () => {
        setActivitiesLoading(true);
        try {
          const res = await fetchActivities(
            selectedAccountId,
            activityFilter,
            50,
            activityFromDate || undefined,
            activityToDate || undefined,
            activityPage,
            50
          );
          if (activityPage === 1) {
            setLiveActivities(res.activities);
          } else {
            setLiveActivities(prev => [...prev, ...res.activities]);
          }
          setActivityTotal(res.total);
        } catch (err) {
          console.error(err);
        } finally {
          setActivitiesLoading(false);
        }
      };
      load();
    }
  }, [activeTab, selectedAccountId, activityFilter, activityFromDate, activityToDate, activityPage]);

  // Reset activity pagination when filters change
  useEffect(() => {
    setActivityPage(1);
  }, [activityFilter, activityFromDate, activityToDate, selectedAccountId]);

  const loadBrief = async (id: string, scope: string, period: number, type: string, forceRefresh: boolean = false) => {
    setBriefLoading(true);
    setBrief(null);
    try {
      const result = await generateSummary(id, scope, period, type, forceRefresh);
      setBrief(result.brief);
    } catch (err) {
      console.error('Brief generation failed:', err);
    } finally {
      setBriefLoading(false);
    }
  };

  const handleChat = async () => {
    if (!chatInput.trim() || !selectedAccountId) return;
    const userMsg = { role: 'user', content: chatInput.trim() };
    const newHistory = [...chatHistory, userMsg];
    setChatHistory(newHistory);
    setChatInput('');
    setChatLoading(true);
    try {
      const result = await askAI(selectedAccountId, userMsg.content, chatHistory.map(m => ({ role: m.role, content: m.content })));
      setChatHistory([...newHistory, { role: 'assistant', content: result.reply, citations: result.citations }]);
    } catch (err) {
      setChatHistory([...newHistory, { role: 'assistant', content: 'AI service unavailable. Check GROQ_API_KEY.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  // Escape key closes panel
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closePanel();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [closePanel]);

  const handleCreateTodo = async () => {
    if (!newTodo.trim() || !selectedAccountId) return;
    const type = activeTab === 'notes' ? 'note' : 'todo';
    try {
      await createTodo(selectedAccountId, type, newTodo.trim(), role);
      setNewTodo('');
      const updated = await fetchTodos(selectedAccountId);
      setTodos(updated.filter((t) => t.type === type));
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleTodo = async (todo: TodoItem) => {
    try {
      await updateTodo(todo.id, { completed: !todo.completed });
      const updated = await fetchTodos(selectedAccountId!);
      setTodos(updated.filter((t) => t.type === 'todo'));
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTodo = async (todoId: string) => {
    try {
      await deleteTodo(todoId);
      setTodos((prev) => prev.filter((t) => t.id !== todoId));
    } catch (err) {
      console.error(err);
    }
  };

  const uncompletedCount = todos.filter((t) => !t.completed && t.type === 'todo').length;

  return (
    <div className={`panel-overlay ${isOpen ? 'open' : ''}`}>
      {/* Header */}
      <div className="panel-header">
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="panel-header-top">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="panel-title">{account?.name || 'Loading…'}</div>
              {account && (
                <span style={{
                  fontSize: 11, fontWeight: 600,
                  padding: '2px 8px',
                  background: 'var(--accent-light)',
                  color: 'var(--accent)',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid rgba(91,33,182,0.15)',
                }}>
                  {account.segment}
                </span>
              )}
            </div>
            <button
              className="panel-close"
              onClick={closePanel}
              aria-label="Close account panel"
            >✕</button>
          </div>
          {account && (
            <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>{account.industry}</span>
              <span>·</span>
              <span>{account.domain}</span>
              <a
                href={account.account_console_url || `https://app.hubspot.com/contacts/${process.env.NEXT_PUBLIC_HUBSPOT_PORTAL_ID || '246259639'}/company/${account.hubspot_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="panel-header-cta"
                aria-label="Open account in HubSpot CRM"
                style={{ marginLeft: 'auto', fontSize: 11, padding: '3px 10px' }}
              >
                Go to CRM ↗
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Tabs — hide AI Briefs when disabled on this board */}
      <div className="panel-tabs">
        {PANEL_TABS.filter((tab) => tab.id !== 'briefs' || aiBriefsEnabled).map((tab) => (
          <button
            key={tab.id}
            className={`panel-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
            {tab.id === 'todos' && uncompletedCount > 0 && (
              <span className="tab-badge">{uncompletedCount}</span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="panel-content">
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="loading-skeleton" style={{ height: 24, borderRadius: 4 }} />
            ))}
          </div>
        ) : !account ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <div className="empty-title">Select an account</div>
          </div>
        ) : (
          <>
            {/* ── Overview Tab ─────────────────────────────────── */}
            {activeTab === 'overview' && (
              <>
                <div className="panel-section">
                  <div className="panel-section-title">⚡ Account Details</div>
                  <div className="panel-grid">
                    <div className="panel-field">
                      <span className="field-label">Last Activity</span>
                      <span className="field-value">{formatRelativeTime(account.last_activity_date)}</span>
                    </div>
                    <div className="panel-field">
                      <span className="field-label">Account Owner</span>
                      <span className="field-value">{account.assigned_rep.name}</span>
                    </div>
                    <div className="panel-field">
                      <span className="field-label">Account Type</span>
                      <span className="field-value">{account.type}</span>
                    </div>
                    <div className="panel-field">
                      <span className="field-label">Industry</span>
                      <span className="field-value">{account.industry}</span>
                    </div>
                    <div className="panel-field">
                      <span className="field-label">Exit ARR</span>
                      <span className="field-value" style={{ fontWeight: 700 }}>{formatCurrency(account.exit_arr)}</span>
                    </div>
                    <div className="panel-field">
                      <span className="field-label">AI Risk Score</span>
                      <span className="field-value">
                        <span
                          className={`risk-badge ${(account.risk_label ?? 'unknown').toLowerCase()}`}
                        >
                          {account.ai_risk_score ?? 'N/A'} — {account.risk_label ?? 'Unscored'}
                        </span>
                      </span>
                    </div>
                    <div className="panel-field">
                      <span className="field-label">Next QBR</span>
                      <span className="field-value">{formatDate(account.next_qbr_date)}</span>
                    </div>
                    <div className="panel-field">
                      <span className="field-label">Employees</span>
                      <span className="field-value">{account.employee_count?.toLocaleString() || '—'}</span>
                    </div>
                  </div>
                </div>

                {/* Contacts */}
                <div className="panel-section">
                  <div className="panel-section-title">👥 Contacts ({account.contacts.length})</div>
                  {account.contacts.length === 0 ? (
                    <div style={{ padding: '16px 14px', color: 'var(--text-tertiary)', fontSize: 12 }}>No contacts found</div>
                  ) : account.contacts.map((contact) => (
                    <div key={contact.hubspot_id} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 0', borderBottom: '1px solid var(--surface-border)',
                    }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: '50%',
                        background: contact.is_primary ? 'var(--accent-light)' : 'var(--bg-tertiary)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 600,
                        color: contact.is_primary ? 'var(--accent)' : 'var(--text-tertiary)',
                      }}>
                        {contact.first_name[0]}{contact.last_name[0]}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13, fontWeight: 500 }}>
                          {contact.first_name} {contact.last_name}
                          {contact.is_primary && <span style={{ fontSize: 10, color: 'var(--accent)', marginLeft: 6 }}>PRIMARY</span>}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{contact.job_title}</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Open Deals */}
                <div className="panel-section">
                  <div className="panel-section-title">💰 Open & Recently Closed Deals ({account.deals.length})</div>
                  {account.deals.length === 0 ? (
                    <div style={{ padding: '16px 14px', color: 'var(--text-tertiary)', fontSize: 12 }}>No deals found</div>
                  ) : account.deals.map((deal) => (
                    <div key={deal.hubspot_id} className="deal-card">
                      <div className="deal-name">{deal.name}</div>
                      <div className="deal-meta">
                        <span
                          className="stage-badge"
                          style={{
                            background: `${getStageColor(deal.stage)}20`,
                            color: getStageColor(deal.stage),
                          }}
                        >
                          {deal.stage}
                        </span>
                        <span className="deal-amount">{formatCurrency(deal.amount)}</span>
                        <span className="deal-date">{formatDate(deal.close_date)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* ── Activity Timeline Tab ────────────────────────── */}
            {activeTab === 'timeline' && (
              <>
                <div className="panel-section">
                  <div className="panel-section-title">📞 Activity Timeline</div>
                  <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--surface-border)', display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                    {['ALL', 'CALL', 'EMAIL', 'MEETING'].map((filter) => (
                      <button
                        key={filter}
                        className={`btn btn-sm ${activityFilter === filter ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setActivityFilter(filter)}
                      >
                        {filter === 'ALL' ? 'All' : filter.charAt(0) + filter.slice(1).toLowerCase() + 's'}
                      </button>
                    ))}
                    <div style={{ width: '1px', height: 20, background: 'var(--surface-border)', margin: '0 8px' }} />
                    <input
                      type="date"
                      className="filter-select"
                      value={activityFromDate}
                      onChange={(e) => setActivityFromDate(e.target.value)}
                      title="From Date"
                      style={{ padding: '4px 8px', fontSize: 12 }}
                    />
                    <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>to</span>
                    <input
                      type="date"
                      className="filter-select"
                      value={activityToDate}
                      onChange={(e) => setActivityToDate(e.target.value)}
                      title="To Date"
                      style={{ padding: '4px 8px', fontSize: 12 }}
                    />
                    {(activityFromDate || activityToDate) && (
                      <button 
                        className="btn btn-sm btn-secondary" 
                        onClick={() => { setActivityFromDate(''); setActivityToDate(''); }}
                      >Clear</button>
                    )}
                  </div>
                  {liveActivities.length === 0 ? (
                    <div className="empty-state" style={{ padding: '24px' }}>
                      <div className="empty-icon">📭</div>
                      <div className="empty-title">No activities found</div>
                    </div>
                  ) : (
                    <>
                      {liveActivities.map((activity) => (
                        <div key={activity.id} className="timeline-item">
                          <div className={`timeline-icon ${(activity.type ?? 'call').toLowerCase()}`}>
                            {activity.type === 'CALL' ? '📞' : activity.type === 'EMAIL' ? '✉️' : '📅'}
                          </div>
                          <div className="timeline-body">
                            <div className="timeline-header">
                              <span className="timeline-type">{activity.type}</span>
                              <span className="timeline-dir">{activity.direction}</span>
                              <span className="timeline-date">{formatDateTime(activity.timestamp)}</span>
                            </div>
                            <div className="timeline-text">{activity.body}</div>
                            {activity.type === 'CALL' && activity.rep_talk_pct != null && (
                              <div style={{ marginTop: 8 }}>
                                <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginBottom: 4 }}>
                                  Rep {activity.rep_talk_pct}% | Client {activity.client_talk_pct}%
                                  {activity.duration_seconds && ` · ${formatDuration(activity.duration_seconds)}`}
                                </div>
                                <div className="talk-bar">
                                  <div className="rep-bar" style={{ width: `${activity.rep_talk_pct}%` }} />
                                  <div className="client-bar" style={{ width: `${activity.client_talk_pct}%` }} />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      {liveActivities.length < activityTotal && (
                        <div style={{ padding: '16px', textAlign: 'center' }}>
                          <button 
                            className="btn btn-secondary" 
                            onClick={() => setActivityPage(p => p + 1)}
                            disabled={activitiesLoading}
                          >
                            {activitiesLoading ? 'Loading...' : `Load More (${activityTotal - liveActivities.length} remaining)`}
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </>
            )}

            {/* ── AI Briefs Tab ─────────────────────────────────── */}
            {activeTab === 'briefs' && (
              <>
                {/* Controls */}
                <div className="panel-section">
                  <div className="panel-section-title" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>🤖 AI Summary Generator</span>
                    {account.brief_available && account.brief_generated_at && (
                      <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontWeight: 'normal' }}>
                        Last generated {formatRelativeTime(account.brief_generated_at)}
                      </span>
                    )}
                  </div>
                  <div style={{ padding: '12px 14px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <select
                      className="filter-select"
                      value={briefScope}
                      onChange={(e) => { setBriefScope(e.target.value); setBrief(null); }}
                    >
                      <option value="entire_account">Entire Account</option>
                      <option value="deals_only">Deals Only</option>
                    </select>
                    <select
                      className="filter-select"
                      value={briefPeriod}
                      onChange={(e) => { setBriefPeriodOverride(Number(e.target.value)); setBrief(null); }}
                    >
                      <option value={7}>Last 7 Days</option>
                      <option value={30}>Last 30 Days</option>
                      <option value={60}>Last 60 Days</option>
                      <option value={90}>Last 90 Days</option>
                      <option value={180}>Last 180 Days</option>
                      <option value={0}>All Time</option>
                    </select>
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => selectedAccountId && loadBrief(selectedAccountId, briefScope, briefPeriod, boardBriefType, true)}
                      disabled={briefLoading}
                    >
                      {briefLoading ? 'Generating…' : '⚡ Refresh'}
                    </button>
                  </div>
                </div>

                {briefLoading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="loading-skeleton" style={{ height: 20, borderRadius: 4, width: `${70 + i * 8}%` }} />
                    ))}
                    <div style={{ fontSize: 12, color: 'var(--text-tertiary)', marginTop: 8 }}>
                      Generating brief with Groq llama-3.3-70b…
                    </div>
                  </div>
                ) : brief ? (
                  <div className="ai-brief">
                    {/* Status badge */}
                    <div style={{ marginBottom: 16 }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: 6,
                        padding: '4px 12px', borderRadius: 100,
                        fontSize: 13, fontWeight: 700,
                        background: brief.status === 'At Risk' ? 'var(--danger-bg)'
                          : brief.status === 'Healthy' ? 'var(--success-bg)' : 'var(--warning-bg)',
                        color: brief.status === 'At Risk' ? 'var(--danger)'
                          : brief.status === 'Healthy' ? 'var(--success)' : 'var(--warning)',
                      }}>
                        {brief.status === 'At Risk' ? '⚠' : brief.status === 'Healthy' ? '✓' : '●'}
                        {' '}{brief.status}
                      </span>
                      {brief.insufficient_data && (
                        <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--text-tertiary)' }}>
                          Limited data — brief may be incomplete
                        </span>
                      )}
                    </div>

                    {/* Key Risks */}
                    {brief.key_risks?.length > 0 && (
                      <div className="brief-section">
                        <div className="brief-label">⚠ Key Risks</div>
                        <ul className="brief-list">
                          {brief.key_risks.map((risk, i) => (
                            <li key={i}>{risk}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Recommended Steps */}
                    {brief.recommended_steps?.length > 0 && (
                      <div className="brief-section">
                        <div className="brief-label">→ Recommended Steps</div>
                        <ul className="brief-list">
                          {brief.recommended_steps.map((step, i) => (
                            <li key={i}>{step}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Citations */}
                    {brief.citations?.length > 0 && (
                      <div className="brief-section">
                        <div className="brief-label">📎 Evidence</div>
                        {brief.citations.map((citation, i) => (
                          <div key={i} style={{
                            padding: '6px 10px',
                            background: 'var(--surface-glass)',
                            border: '1px solid var(--surface-border)',
                            borderRadius: 'var(--radius-sm)',
                            marginBottom: 6,
                            fontSize: 12,
                          }}>
                            <span style={{ fontWeight: 600, color: 'var(--accent)' }}>{citation.type}</span>
                            {' · '}
                            <span style={{ color: 'var(--text-tertiary)' }}>{citation.date}</span>
                            {' — '}
                            <span style={{ color: 'var(--text-secondary)' }}>{citation.summary}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="empty-state">
                    <div className="empty-icon">🤖</div>
                    <div className="empty-title">No brief generated</div>
                    <div className="empty-text">Click Refresh to generate an AI brief</div>
                  </div>
                )}

                {/* Chat */}
                <div style={{ marginTop: 24, borderTop: '1px solid var(--surface-border)', paddingTop: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', marginBottom: 12 }}>
                    Ask AI about this account
                  </div>
                  <div style={{ maxHeight: 200, overflowY: 'auto', marginBottom: 12 }}>
                    {chatHistory.map((msg, i) => (
                      <div key={i} style={{
                        padding: '8px 10px',
                        marginBottom: 6,
                        borderRadius: 'var(--radius-md)',
                        fontSize: 12,
                        background: msg.role === 'user' ? 'var(--accent-light)' : 'var(--bg-tertiary)',
                        color: msg.role === 'user' ? 'var(--accent)' : 'var(--text-primary)',
                        textAlign: msg.role === 'user' ? 'right' : 'left',
                        whiteSpace: 'pre-wrap',
                      }}>
                        {msg.content}
                        {msg.citations && msg.citations.length > 0 && (
                          <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(128,128,128,0.2)' }}>
                            <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-tertiary)', marginBottom: 4 }}>CITATIONS:</div>
                            {msg.citations.map((cit: any, cIdx: number) => (
                              <div key={cIdx} style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 2 }}>
                                • [{cit.date}] {cit.type}: {cit.summary}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                    {chatLoading && (
                      <div className="loading-skeleton" style={{ height: 36, borderRadius: 'var(--radius-md)' }} />
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      className="todo-input"
                      style={{ flex: 1 }}
                      placeholder="Ask anything about this account…"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter' && !chatLoading) handleChat(); }}
                      disabled={chatLoading}
                    />
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={handleChat}
                      disabled={chatLoading || !chatInput.trim()}
                    >
                      Send
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* ── Todos Tab ────────────────────────────────────── */}
            {activeTab === 'todos' && (
              <>
                {todos.map((todo) => (
                  <div key={todo.id} className="todo-item">
                    <button
                      className={`todo-checkbox ${todo.completed ? 'checked' : ''}`}
                      onClick={() => handleToggleTodo(todo)}
                    >
                      {todo.completed && '✓'}
                    </button>
                    <span className={`todo-text ${todo.completed ? 'completed' : ''}`}>
                      {todo.content}
                    </span>
                    <button className="todo-delete" onClick={() => handleDeleteTodo(todo.id)}>✕</button>
                  </div>
                ))}
                <div style={{ marginTop: 16 }}>
                  <input
                    className="todo-input"
                    placeholder="Add a todo... (press Enter)"
                    value={newTodo}
                    onChange={(e) => setNewTodo(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreateTodo();
                    }}
                  />
                </div>
              </>
            )}

            {/* ── Notes Tab ────────────────────────────────────── */}
            {activeTab === 'notes' && (
              <>
                <div className="panel-section">
                  <div className="panel-section-title">Manager Note</div>
                  <textarea
                    style={{
                      width: '100%',
                      minHeight: 120,
                      padding: 12,
                      fontSize: 13,
                      fontFamily: 'var(--font-sans)',
                      color: 'var(--text-primary)',
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--surface-border)',
                      borderRadius: 'var(--radius-md)',
                      outline: 'none',
                      resize: 'vertical',
                    }}
                    defaultValue={account.supplementary?.manager_note || ''}
                    onBlur={(e) => {
                      if (selectedAccountId) {
                        editSupplementary(selectedAccountId, 'manager_note', e.target.value, role);
                      }
                    }}
                    placeholder="Add a manager note..."
                  />
                </div>

                {/* Recent notes */}
                <div className="panel-section">
                  <div className="panel-section-title">Notes History</div>
                  {todos.map((note) => (
                    <div key={note.id} style={{
                      padding: '10px 0',
                      borderBottom: '1px solid var(--surface-border)',
                    }}>
                      <div style={{ fontSize: 13, color: 'var(--text-primary)', marginBottom: 4 }}>
                        {note.content}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                        {note.created_by_role} · {formatDateTime(note.created_at)}
                      </div>
                    </div>
                  ))}
                  <div style={{ marginTop: 16 }}>
                    <input
                      className="todo-input"
                      placeholder="Add a note... (press Enter)"
                      value={newTodo}
                      onChange={(e) => setNewTodo(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleCreateTodo();
                      }}
                    />
                  </div>
                </div>
              </>
            )}

            {/* ── CRM Sync Tab ─────────────────────────────────── */}
            {activeTab === 'crm' && (
              <>
                <div className="panel-section">
                  <div className="panel-section-title">CRM Profile</div>
                  <a
                    href={`https://app.hubspot.com/contacts/${process.env.NEXT_PUBLIC_HUBSPOT_PORTAL_ID || ''}/company/${account.hubspot_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-secondary"
                    style={{ marginBottom: 16, display: 'inline-flex' }}
                  >
                    Go to HubSpot Profile →
                  </a>
                </div>

                <div className="panel-section">
                  <div className="panel-section-title">Sync Status</div>
                  <table style={{ width: '100%', fontSize: 12 }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--surface-border)' }}>
                        <th style={{ textAlign: 'left', padding: '6px 0', color: 'var(--text-tertiary)', fontWeight: 500 }}>Field</th>
                        <th style={{ textAlign: 'left', padding: '6px 0', color: 'var(--text-tertiary)', fontWeight: 500 }}>Value</th>
                        <th style={{ textAlign: 'center', padding: '6px 0', color: 'var(--text-tertiary)', fontWeight: 500 }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { field: 'Name', value: account.name },
                        { field: 'Industry', value: account.industry },
                        { field: 'Segment', value: account.segment },
                        { field: 'Type', value: account.type },
                        { field: 'Exit ARR', value: formatCurrency(account.exit_arr) },
                        { field: 'Domain', value: account.domain },
                      ].map((row) => (
                        <tr key={row.field} style={{ borderBottom: '1px solid var(--surface-border)' }}>
                          <td style={{ padding: '8px 0', color: 'var(--text-secondary)' }}>{row.field}</td>
                          <td style={{ padding: '8px 0' }}>{row.value}</td>
                          <td style={{ padding: '8px 0', textAlign: 'center' }}>✅</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
