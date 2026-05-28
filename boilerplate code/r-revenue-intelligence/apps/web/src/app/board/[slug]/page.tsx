'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSessionStore } from '@/modules/m05-account-intelligence/store/useSessionStore';
import { usePanelStore } from '@/modules/m05-account-intelligence/store/usePanelStore';
import { fetchBoards, fetchAccounts, fetchTeam, editCompany, editSupplementary } from '@/modules/m05-account-intelligence/lib/api';
import SyncStatusBar from '@/modules/m05-account-intelligence/components/board/SyncStatusBar';
import { formatCurrency, formatDate, formatRelativeTime } from '@/modules/m05-account-intelligence/lib/utils';
import type { BoardConfig, AccountSummary, AccountsResponse, TeamMember } from '@/modules/m05-account-intelligence/types';
import AccountPanel from '@/modules/m05-account-intelligence/components/panel/AccountPanel';
import ToastContainer, { useToast } from '@/modules/m05-account-intelligence/components/ui/ToastContainer';
import InlineEdit from '@/modules/m05-account-intelligence/components/ui/InlineEdit';
import ActivityTimeline from '@/modules/m05-account-intelligence/components/board/ActivityTimeline';
import BoardSettingsPanel from '@/modules/m05-account-intelligence/components/board/BoardSettingsPanel';
import CreateBoardWizard from '@/modules/m05-account-intelligence/components/board/CreateBoardWizard';
import ModuleNavLinks from '@/modules/m05-account-intelligence/components/board/ModuleNavLinks';

export default function BoardPage() {
  const params = useParams();
  const slug = params.slug as string;
  const router = useRouter();

  const role = useSessionStore((s) => s.role);
  const setRole = useSessionStore((s) => s.setRole);
  const activeBoard = useSessionStore((s) => s.activeBoard);
  const setActiveBoard = useSessionStore((s) => s.setActiveBoard);
  const activeTabId = useSessionStore((s) => s.activeTabId);
  const setActiveTabId = useSessionStore((s) => s.setActiveTabId);
  const sortField = useSessionStore((s) => s.sortField);
  const sortDir = useSessionStore((s) => s.sortDir);
  const setSortField = useSessionStore((s) => s.setSortField);
  const setSortDir = useSessionStore((s) => s.setSortDir);
  const page = useSessionStore((s) => s.page);
  const setPage = useSessionStore((s) => s.setPage);
  const pageSize = useSessionStore((s) => s.pageSize);
  const setPageSize = useSessionStore((s) => s.setPageSize);
  const selectedRepIds = useSessionStore((s) => s.selectedRepIds);
  const setSelectedRepIds = useSessionStore((s) => s.setSelectedRepIds);
  const period = useSessionStore((s) => s.period);
  const setPeriod = useSessionStore((s) => s.setPeriod);
  const setBoardBriefConfigRef = useRef(useSessionStore.getState().setBoardBriefConfig);
  const setBoardBriefConfig = setBoardBriefConfigRef.current;

  // Track previous slug so we can detect a board change
  const prevSlugRef = useRef<string | null>(null);

  const { isOpen, selectedAccountId, openPanel } = usePanelStore();
  const toast = useToast();

  const [boards, setBoards] = useState<BoardConfig[]>([]);
  const [currentBoard, setCurrentBoard] = useState<BoardConfig | null>(null);
  const [response, setResponse] = useState<AccountsResponse | null>(null);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState<string | null>(null);  // 6A: error state
  const [wizardOpen, setWizardOpen] = useState(false);
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(new Set());
  const [columnPickerOpen, setColumnPickerOpen] = useState(false);
  const columnPickerRef = useRef<HTMLDivElement>(null);

  // 6B: Debounce ref for sort/filter changes (300ms)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Board mutation callbacks
  const handleBoardUpdated = (updated: BoardConfig) => {
    setBoards((prev) => prev.map((b) => (b.slug === updated.slug ? updated : b)));
    setCurrentBoard(updated);
    setBoardBriefConfig({
      aiBriefsEnabled: updated.ai_briefs_enabled,
      briefPeriodDays: updated.brief_period_days ?? 30,
      briefType: updated.brief_type ?? 'full',
    });
    toast.success('Board settings saved!');
  };

  const handleBoardCreated = (newBoard: BoardConfig) => {
    setBoards((prev) => [...prev, newBoard]);
    setWizardOpen(false);
    toast.success(`Board "${newBoard.name}" created!`);
    router.push(`/board/${newBoard.slug}`);
  };

  const handleBoardDuplicated = (newBoard: BoardConfig) => {
    setBoards((prev) => [...prev, newBoard]);
    toast.success(`Board duplicated as "${newBoard.name}"`);
    router.push(`/board/${newBoard.slug}`);
  };

  const handleBoardDeleted = (deletedSlug: string) => {
    const remaining = boards.filter((b) => b.slug !== deletedSlug);
    setBoards(remaining);
    toast.success('Board deleted.');
    if (remaining.length > 0) {
      router.push(`/board/${remaining[0].slug}`);
    } else {
      router.push('/');
    }
  };

  // Set active board on route change + reset tab immediately on board switch
  useEffect(() => {
    if (slug && slug !== activeBoard) {
      setActiveBoard(slug);
    }
    // When slug changes to a DIFFERENT board, wipe the tab immediately
    // so stale localStorage tab doesn't bleed into the new board's API call
    if (prevSlugRef.current !== null && prevSlugRef.current !== slug) {
      setActiveTabId(null);
    }
    prevSlugRef.current = slug;
  }, [slug, activeBoard, setActiveBoard, setActiveTabId]);

  // Load boards + team — depends only on [slug], never on activeTabId
  // to avoid the re-render cycle: tab change → effect re-runs → setTab → cycle
  useEffect(() => {
    Promise.all([fetchBoards(), fetchTeam()])
      .then(([b, t]) => {
        setBoards(b);
        setTeam(t);
        setApiError(null);
        const board = b.find((bd) => bd.slug === slug);
        setCurrentBoard(board || null);
        if (board) {
          setBoardBriefConfig({
            aiBriefsEnabled: board.ai_briefs_enabled,
            briefPeriodDays: board.brief_period_days ?? 30,
            briefType: board.brief_type ?? 'full',
          });
          // Read activeTabId fresh from store (not from closure) to avoid stale deps
          const currentTabId = useSessionStore.getState().activeTabId;
          const tabBelongsToBoard = board.tabs.some((t) => t.id === currentTabId);
          if (!tabBelongsToBoard) {
            // Tab is null, stale, or from a different board — reset to this board's default
            const defaultTab = board.tabs.find((t) => t.is_default) ?? board.tabs[0];
            if (defaultTab) setActiveTabId(defaultTab.id);
          }
        }
      })
      .catch((err) => {
        setApiError('Could not connect to API. Please check the server is running.');
        console.error(err);
      });
  }, [slug]); // ← slug only — never activeTabId

  // Fetch accounts (debounced internally)
  const loadAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAccounts({
        board_slug: slug,
        tab_id: activeTabId || undefined,
        rep_id: selectedRepIds.length > 0 ? selectedRepIds.join(',') : undefined,
        period: period !== 'all_time' ? period : undefined,
        sort_field: sortField,
        sort_dir: sortDir,
        page,
        page_size: pageSize,
      });
      setResponse(data);
      setApiError(null);
    } catch (err: any) {
      console.error('Failed to fetch accounts:', err);
      setApiError('Could not load account data. Check the API server.');
    }
    setLoading(false);
  }, [slug, activeTabId, selectedRepIds, period, sortField, sortDir, page, pageSize]);

  // 6B: Debounced effect — waits 300ms after deps change before fetching
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      loadAccounts();
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [loadAccounts]);

  // Handle sort (6B: debounced via useEffect above)
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const totalPages = response ? Math.ceil(response.total / pageSize) : 1;
  // Columns allowed by role
  const roleColumns = currentBoard?.columns.filter(
    (col) => (col.visible_to_roles ?? ['rep', 'manager', 'admin']).includes(role),
  ) || [];
  // Columns actually displayed (respecting user's column picker)
  const visibleColumns = roleColumns.filter(
    (col) => !hiddenColumns.has(col.field_key),
  );

  // Close column picker on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (columnPickerRef.current && !columnPickerRef.current.contains(e.target as Node)) {
        setColumnPickerOpen(false);
      }
    }
    if (columnPickerOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [columnPickerOpen]);

  // Summary totals
  const summaryArr = response?.summary.all_arr ?? 0;
  const summaryCount = response?.summary.all_count ?? 0;

  return (
    <div className="app-layout">
      {/* ── Sidebar ─────────────────────────────────────────────── */}
      <aside className="app-sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">RI</div>
          <span className="logo-text">Revenue Intel</span>
        </div>

        <div className="sidebar-section">
          <div className="sidebar-section-title">Revenue</div>
          {boards.map((board) => (
            <a
              key={board.slug}
              href={`/board/${board.slug}`}
              className={`sidebar-link ${board.slug === slug ? 'active' : ''}`}
            >
              <span className="link-icon">
                {board.slug === 'commercial' ? '📊' : board.slug === 'enterprise' ? '🏢' : '🚀'}
              </span>
              {board.name.split(' — ')[0]}
            </a>
          ))}
          {(role === 'manager' || role === 'admin') && (
            <button
              id="new-board-btn"
              className="sidebar-new-board-btn"
              onClick={() => setWizardOpen(true)}
              aria-label="Create new board"
            >
              <span>+</span> New Board
            </button>
          )}
        </div>

        {role === 'admin' && (
          <div className="sidebar-section">
            <div className="sidebar-section-title">Admin</div>
            <a href="/admin" className="sidebar-link" aria-label="Open board wizard admin panel">
              <span className="link-icon">⚙️</span> Board Wizard
            </a>
          </div>
        )}

        <div className="sidebar-section" style={{ marginTop: 'auto', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 12 }}>
          <div className="sidebar-section-title">Session</div>
          <div style={{ padding: '4px 12px' }}>
            <div className="role-switcher">
              {(['rep', 'manager', 'admin'] as const).map((r) => (
                <button
                  key={r}
                  className={`role-btn ${role === r ? 'active' : ''}`}
                  onClick={() => {
                    if (r === role) return;
                    setRole(r);
                    // Fetch last-board for the new role and navigate there
                    fetch(`http://localhost:3001/preferences/${r}/last-board`)
                      .then(async (res) => {
                        if (!res.ok) return null;
                        const text = await res.text();
                        return text ? JSON.parse(text) : null;
                      })
                      .then((data) => {
                        if (data && data.board_id) {
                          router.push(`/board/${data.board_id}`);
                        }
                      })
                      .catch(console.error);
                  }}
                  aria-label={`Switch to ${r} role`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main Content ────────────────────────────────────────── */}
      <main className="app-main">
        {/* 6A: API Error Banner */}
        {apiError && (
          <div className="api-error-banner" role="alert">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {apiError}
            <button className="banner-retry" onClick={loadAccounts} aria-label="Retry loading accounts">
              Retry
            </button>
          </div>
        )}

        {/* Header */}
        <header className="app-header">
          <div className="header-left">
            <h1 className="header-board-name">{currentBoard?.name || 'Loading…'}</h1>
            {currentBoard && (
              <BoardSettingsPanel
                board={currentBoard}
                role={role}
                onBoardUpdated={handleBoardUpdated}
                onBoardDuplicated={handleBoardDuplicated}
                onBoardDeleted={handleBoardDeleted}
              />
            )}
          </div>
          <div className="header-right">
            <ModuleNavLinks />
            <SyncStatusBar role={role} onSyncComplete={loadAccounts} />
            <div className="header-board-selector">
              {boards.map((board) => (
                <a
                  key={board.slug}
                  href={`/board/${board.slug}`}
                  className={`header-board-btn ${board.slug === slug ? 'active' : ''}`}
                  aria-label={`Switch to ${board.name} board`}
                >
                  {board.slug.charAt(0).toUpperCase() + board.slug.slice(1)}
                </a>
              ))}
            </div>
          </div>
        </header>

        {/* Summary Strip */}
        {response?.summary && currentBoard && (
          <div className="summary-strip">
            {/* All accounts card */}
            <div
              className={`summary-card ${!activeTabId ? 'active' : ''}`}
              onClick={() => setActiveTabId(null)}
              role="button"
              tabIndex={0}
              aria-label="Show all accounts"
              aria-pressed={!activeTabId}
              onKeyDown={(e) => e.key === 'Enter' && setActiveTabId(null)}
            >
              <div className="card-label">Accounts</div>
              <div className="card-value">{formatCurrency(summaryArr)}</div>
              <div className="card-count">{summaryCount} accounts</div>
            </div>
            {currentBoard.tabs.map((tab) => {
              const tabData = response.summary.tab_counts[tab.id];
              return (
                <div
                  key={tab.id}
                  className={`summary-card ${activeTabId === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTabId(tab.id)}
                  role="button"
                  tabIndex={0}
                  aria-label={`Filter by ${tab.label}`}
                  aria-pressed={activeTabId === tab.id}
                  onKeyDown={(e) => e.key === 'Enter' && setActiveTabId(tab.id)}
                >
                  <div className="card-label">{tab.label}</div>
                  <div className="card-value">{formatCurrency(tabData?.arr || 0)}</div>
                  <div className="card-count">{tabData?.count || 0} accounts</div>
                </div>
              );
            })}
          </div>
        )}

        {/* Filter Bar */}
        <div className="filter-bar">
          {role !== 'rep' && (
            <select
              id="rep-filter-select"
              className="filter-select"
              value={selectedRepIds[0] || ''}
              onChange={(e) => setSelectedRepIds(e.target.value ? [e.target.value] : [])}
              aria-label="Filter by sales rep"
            >
              <option value="">Team: All members</option>
              {team.filter((t) => t.role === 'rep').map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          )}

          <select
            id="period-filter-select"
            className="filter-select"
            value={period}
            onChange={(e) => { setPeriod(e.target.value); setPage(1); }}
            aria-label="Filter by time period"
          >
            <option value="all_time">Period: All time</option>
            <option value="last_7_days">Last 7 Days</option>
            <option value="last_30_days">Last 30 Days</option>
            <option value="last_90_days">Last 90 Days</option>
          </select>

          <select
            id="page-size-select"
            className="filter-select"
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value) as 10 | 20 | 50)}
            aria-label="Rows per page"
          >
            <option value={10}>10 / page</option>
            <option value={20}>20 / page</option>
            <option value={50}>50 / page</option>
          </select>

          {/* Column Visibility Picker */}
          <div ref={columnPickerRef} style={{ position: 'relative' }}>
            <button
              id="column-picker-btn"
              className="filter-select"
              onClick={() => setColumnPickerOpen((v) => !v)}
              style={{
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                whiteSpace: 'nowrap',
              }}
              aria-label="Choose columns to display"
              aria-expanded={columnPickerOpen}
            >
              <span>📊</span>
              Columns ({visibleColumns.length}/{roleColumns.length})
            </button>
            {columnPickerOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  marginTop: 4,
                  background: 'var(--bg-card, #1a1f2e)',
                  border: '1px solid var(--surface-border, rgba(255,255,255,0.1))',
                  borderRadius: 'var(--radius-lg, 10px)',
                  padding: '8px 0',
                  minWidth: 220,
                  zIndex: 50,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                  maxHeight: 320,
                  overflowY: 'auto',
                }}
                role="menu"
              >
                {/* Show All / Reset */}
                <button
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '6px 14px',
                    fontSize: 12,
                    fontWeight: 600,
                    color: hiddenColumns.size > 0 ? 'var(--accent, #6366f1)' : 'var(--text-muted, #64748b)',
                    background: 'none',
                    border: 'none',
                    cursor: hiddenColumns.size > 0 ? 'pointer' : 'default',
                    borderBottom: '1px solid var(--surface-border, rgba(255,255,255,0.06))',
                    marginBottom: 4,
                  }}
                  onClick={() => { setHiddenColumns(new Set()); }}
                  disabled={hiddenColumns.size === 0}
                >
                  {hiddenColumns.size > 0 ? '↻ Show All Columns' : '✓ All columns visible'}
                </button>
                {roleColumns.map((col) => {
                  const isHidden = hiddenColumns.has(col.field_key);
                  const isRequired = col.field_key === 'name'; // Account name is always required
                  return (
                    <label
                      key={col.field_key}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '5px 14px',
                        fontSize: 13,
                        cursor: isRequired ? 'default' : 'pointer',
                        color: isRequired ? 'var(--text-muted, #64748b)' : isHidden ? 'var(--text-tertiary, #475569)' : 'var(--text-primary, #f8fafc)',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <input
                        type="checkbox"
                        checked={!isHidden}
                        disabled={isRequired}
                        onChange={() => {
                          if (isRequired) return;
                          setHiddenColumns((prev) => {
                            const next = new Set(prev);
                            if (next.has(col.field_key)) {
                              next.delete(col.field_key);
                            } else {
                              next.add(col.field_key);
                            }
                            return next;
                          });
                        }}
                        style={{ accentColor: 'var(--accent, #6366f1)' }}
                      />
                      {col.label}
                      {isRequired && (
                        <span style={{ fontSize: 10, color: 'var(--text-muted)', marginLeft: 'auto' }}>required</span>
                      )}
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {activeTabId && currentBoard && (
            <span
              className="filter-badge"
              onClick={() => setActiveTabId(null)}
              role="button"
              tabIndex={0}
              aria-label="Clear tab filter"
              onKeyDown={(e) => e.key === 'Enter' && setActiveTabId(null)}
            >
              {currentBoard.tabs.find((t) => t.id === activeTabId)?.label || 'Filtered'}
            </span>
          )}

          {hiddenColumns.size > 0 && (
            <span
              className="filter-badge"
              onClick={() => setHiddenColumns(new Set())}
              role="button"
              tabIndex={0}
              aria-label="Show all columns"
              onKeyDown={(e) => e.key === 'Enter' && setHiddenColumns(new Set())}
            >
              {hiddenColumns.size} col{hiddenColumns.size > 1 ? 's' : ''} hidden ✕
            </span>
          )}
        </div>

        {/* Data Table */}
        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                {visibleColumns.map((col) => (
                  <th
                    key={col.id}
                    className={`${col.sortable ? 'sortable' : ''} ${sortField === col.field_key ? 'sorted' : ''}`}
                    style={{ width: col.width }}
                    onClick={() => col.sortable && handleSort(col.field_key)}
                    aria-sort={sortField === col.field_key ? (sortDir === 'asc' ? 'ascending' : 'descending') : undefined}
                    role={col.sortable ? 'columnheader' : undefined}
                    aria-label={col.sortable ? `Sort by ${col.label}` : col.label}
                  >
                    {col.label}
                    {col.sortable && (
                      <span className="sort-icon" aria-hidden="true">
                        {sortField === col.field_key ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Totals row */}
              {!loading && response && response.accounts.length > 0 && (
                <tr className="totals-row">
                  {visibleColumns.map((col, i) => (
                    <td key={col.id}>
                      {col.field_key === 'name' ? 'Totals' :
                       col.field_key === 'exit_arr' ? formatCurrency(response.accounts.reduce((s, a) => s + a.exit_arr, 0)) :
                       col.field_key === 'open_deals_summary' ? formatCurrency(response.accounts.reduce((s, a) => s + a.open_deals_summary.total_amount, 0)) :
                       '—'}
                    </td>
                  ))}
                </tr>
              )}

              {/* 6B: Skeleton loaders */}
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="skeleton-row" aria-hidden="true">
                    {visibleColumns.map((col) => (
                      <td key={col.id}>
                        <div className="loading-skeleton" style={{ height: 14, width: `${55 + Math.random() * 35}%` }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : response?.accounts.length === 0 ? (
                <tr>
                  <td colSpan={visibleColumns.length}>
                    {/* 6A: Improved empty state */}
                    <div className="empty-state">
                      <div className="empty-icon">📭</div>
                      <div className="empty-title">No accounts match your filters</div>
                      <div className="empty-text">
                        Try adjusting the period, rep, or tab filter to see accounts.
                      </div>
                      {activeTabId && (
                        <button
                          className="btn btn-secondary btn-sm"
                          style={{ marginTop: 12 }}
                          onClick={() => setActiveTabId(null)}
                          aria-label="Clear active tab filter"
                        >
                          Clear filter
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                response?.accounts.map((account) => (
                  <tr
                    key={account.hubspot_id}
                    className={selectedAccountId === account.hubspot_id ? 'selected' : ''}
                    onClick={() => openPanel(account.hubspot_id)}
                    role="row"
                    aria-label={`Open account panel for ${account.name}`}
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && openPanel(account.hubspot_id)}
                  >
                    {visibleColumns.map((col) => (
                      <td key={col.id}>
                        {renderCell(col.field_key, account, role)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {response && response.total > 0 && (
          <div className="pagination">
            <div className="pagination-info">
              Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, response.total)} of {response.total} accounts
            </div>
            <div className="pagination-controls">
              <button
                className="pagination-btn wide"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                aria-label="Previous page"
              >
                ← Prev
              </button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  className={`pagination-btn ${page === p ? 'active' : ''}`}
                  onClick={() => setPage(p)}
                  aria-label={`Go to page ${p}`}
                  aria-current={page === p ? 'page' : undefined}
                >
                  {p}
                </button>
              ))}
              <button
                className="pagination-btn wide"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                aria-label="Next page"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ── Account Panel ───────────────────────────────────────── */}
      <AccountPanel />
      <ToastContainer />

      {/* ── Create Board Wizard ─────────────────────────────────────────────── */}
      {wizardOpen && (
        <CreateBoardWizard
          existingBoards={boards}
          onCreated={handleBoardCreated}
          onClose={() => setWizardOpen(false)}
        />
      )}
    </div>
  );
}

// ── Cell Renderer ──────────────────────────────────────────────────────
function renderCell(
  fieldKey: string,
  account: AccountSummary,
  role: string,
  onMutation?: (hubspotId: string, field: string, value: string) => void,
) {
  switch (fieldKey) {
    case 'name':
      return (
        <div>
          <div className="cell-name">
            {account.strategic_priority && <span className="priority-star" aria-label="Strategic priority">★ </span>}
            {account.name}
          </div>
          <div className="cell-subtitle">{account.industry} · {account.segment}</div>
        </div>
      );

    case 'exit_arr':
      return <span className="cell-arr">{formatCurrency(account.exit_arr)}</span>;

    case 'contacts_count':
      return <span>{account.contacts_count || '—'}</span>;

    case 'activity_timeline':
      return <ActivityTimeline activities={account.activities_21d} />;

    case 'last_activity_date':
      return (
        <div>
          <div>{formatRelativeTime(account.last_activity_date)}</div>
          {account.zero_activity_flag && (
            <span className="zero-activity-flag" role="status" aria-label="No recent activity">⚠ No activity</span>
          )}
        </div>
      );

    case 'manager_note': {
      const canEdit = role === 'manager' || role === 'admin';
      return canEdit ? (
        <InlineEdit
          value={account.manager_note || ''}
          fieldKey="manager_note"
          placeholder="Add note…"
          onSave={async (val) => {
            await editSupplementary(account.hubspot_id, 'manager_note', val, role);
            onMutation?.(account.hubspot_id, 'manager_note', val);
          }}
          className="cell-note"
        />
      ) : (
        <div className="cell-note" title={account.manager_note || ''}>{account.manager_note || '—'}</div>
      );
    }

    case 'open_deals_summary':
      return (
        <div>
          <div style={{ fontWeight: 600 }}>{formatCurrency(account.open_deals_summary.total_amount)}</div>
          <div className="cell-subtitle">{account.open_deals_summary.count} deals</div>
        </div>
      );

    case 'renewal_date':
      return <span>{formatDate(account.renewal_date)}</span>;

    default:
      return <span>—</span>;
  }
}
