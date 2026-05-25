'use client';

import { useState, useRef, useEffect } from 'react';
import type { BoardConfig, ColumnConfig } from '@/modules/m05-account-intelligence/types';
import { updateBoard, duplicateBoard, deleteBoard, addColumn, deleteColumn, fetchBoard, updateBriefConfig } from '@/modules/m05-account-intelligence/lib/api';

interface Props {
  board: BoardConfig;
  role: string;
  onBoardUpdated: (updated: BoardConfig) => void;
  onBoardDuplicated: (newBoard: BoardConfig) => void;
  onBoardDeleted: (slug: string) => void;
}

type SortField = 'name' | 'exit_arr' | 'last_activity_date' | 'employee_count';
type SortDir = 'asc' | 'desc';
type ModalTab = 'general' | 'columns' | 'ai_briefs';

const AVAILABLE_COLUMNS = [
  { field_key: 'name', label: 'Account', description: 'Company name + segment', required: true },
  { field_key: 'exit_arr', label: 'ARR', description: 'Annual Recurring Revenue', required: true },
  { field_key: 'contacts_count', label: 'Contacts', description: 'Number of CRM contacts' },
  { field_key: 'activity_timeline', label: 'Activity Timeline', description: '21-day sparkline' },
  { field_key: 'last_activity_date', label: 'Last Activity', description: 'Date of last interaction' },
  { field_key: 'manager_note', label: 'Manager Note', description: 'Editable note (manager only)' },
  { field_key: 'open_deals_summary', label: 'Open Deals', description: 'Count + value of open deals' },
  { field_key: 'renewal_date', label: 'Renewal Date', description: 'Earliest renewal close date' },
  { field_key: 'employee_count', label: 'Employees', description: 'Headcount from HubSpot' },
];

export default function BoardSettingsPanel({ board, role, onBoardUpdated, onBoardDuplicated, onBoardDeleted }: Props) {
  const canManage = role === 'manager' || role === 'admin';

  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [modalTab, setModalTab] = useState<ModalTab>('general');

  // General tab state
  const [editName, setEditName] = useState(board.name);
  const [editDesc, setEditDesc] = useState(board.description || '');
  const [editSortField, setEditSortField] = useState<SortField>((board.default_sort_field as SortField) || 'name');
  const [editSortDir, setEditSortDir] = useState<SortDir>((board.default_sort_dir as SortDir) || 'desc');

  // AI Briefs tab state
  const [editAiBriefs, setEditAiBriefs] = useState(board.ai_briefs_enabled ?? true);
  const [editBriefType, setEditBriefType] = useState(board.brief_type || 'full');
  const [editBriefPeriod, setEditBriefPeriod] = useState(board.brief_period_days ?? 30);

  // Column tab state
  const [columns, setColumns] = useState<ColumnConfig[]>(board.columns || []);
  const [colActionId, setColActionId] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setEditName(board.name);
    setEditDesc(board.description || '');
    setEditSortField((board.default_sort_field as SortField) || 'name');
    setEditSortDir((board.default_sort_dir as SortDir) || 'desc');
    setEditAiBriefs(board.ai_briefs_enabled ?? true);
    setEditBriefType(board.brief_type || 'full');
    setEditBriefPeriod(board.brief_period_days ?? 30);
    setColumns(board.columns || []);
  }, [board]);

  if (!canManage) return null;

  const openEdit = (tab: ModalTab = 'general') => { setModalTab(tab); setError(null); setMenuOpen(false); setEditOpen(true); };

  const handleSave = async () => {
    if (!editName.trim()) { setError('Board name is required.'); return; }
    setSaving(true); setError(null);
    try {
      const updated = await updateBoard(board.slug, { name: editName.trim(), description: editDesc.trim(), default_sort_field: editSortField, default_sort_dir: editSortDir });
      onBoardUpdated(updated); setEditOpen(false);
    } catch (err: any) { setError(err.message || 'Failed to save.'); }
    finally { setSaving(false); }
  };

  const handleSaveBriefs = async () => {
    setSaving(true); setError(null);
    try {
      const result = await updateBriefConfig(board.slug, { ai_briefs_enabled: editAiBriefs, brief_type: editBriefType, brief_period_days: editBriefPeriod });
      onBoardUpdated(result.board); setEditOpen(false);
    } catch (err: any) { setError(err.message || 'Failed to save brief config.'); }
    finally { setSaving(false); }
  };

  const handleAddColumn = async (fieldKey: string) => {
    if (columns.length >= 15) { setError('Maximum 15 columns allowed.'); return; }
    setError(null); setColActionId(fieldKey);
    try {
      const meta = AVAILABLE_COLUMNS.find((c) => c.field_key === fieldKey)!;
      await addColumn(board.slug, { field_key: fieldKey, label: meta.label });
      const updated = await fetchBoard(board.slug);
      setColumns(updated.columns); onBoardUpdated(updated);
    } catch (err: any) { setError(err.message || 'Failed to add column.'); }
    finally { setColActionId(null); }
  };

  const handleRemoveColumn = async (colId: string, fieldKey: string) => {
    if (['name', 'exit_arr'].includes(fieldKey)) { setError(`The "${fieldKey === 'name' ? 'Account' : 'ARR'}" column is required.`); return; }
    setError(null); setColActionId(colId);
    try {
      await deleteColumn(board.slug, colId);
      const newCols = columns.filter((c) => c.id !== colId);
      setColumns(newCols); onBoardUpdated({ ...board, columns: newCols });
    } catch (err: any) { setError(err.message || 'Failed to remove column.'); }
    finally { setColActionId(null); }
  };

  const handleDuplicate = async () => {
    setDuplicating(true); setMenuOpen(false);
    try { const nb = await duplicateBoard(board.slug); onBoardDuplicated(nb); }
    catch (err: any) { console.error('Duplicate failed:', err); }
    finally { setDuplicating(false); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try { await deleteBoard(board.slug); setDeleteConfirmOpen(false); onBoardDeleted(board.slug); }
    catch (err: any) { setError(err.message || 'Failed to delete board.'); setDeleting(false); }
  };

  const activeFieldKeys = new Set(columns.map((c) => c.field_key));

  return (
    <>
      {/* ── Ellipsis Menu ─────────────────────────────────────────── */}
      <div ref={menuRef} style={{ position: 'relative', display: 'inline-block' }}>
        <button id="board-settings-trigger" aria-label="Board settings" className="bsp-trigger" onClick={() => setMenuOpen((v) => !v)} title="Board settings">⋯</button>

        {menuOpen && (
          <div className="bsp-menu" role="menu">
            <button className="bsp-menu-item" onClick={() => openEdit('general')} role="menuitem"><span className="bsp-menu-icon">✏️</span> Edit Board</button>
            <button className="bsp-menu-item" onClick={() => openEdit('columns')} role="menuitem"><span className="bsp-menu-icon">📐</span> Manage Columns</button>
            <button className="bsp-menu-item" onClick={() => openEdit('ai_briefs')} role="menuitem"><span className="bsp-menu-icon">🤖</span> AI Briefs Config</button>
            <button className="bsp-menu-item" onClick={handleDuplicate} disabled={duplicating} role="menuitem">
              <span className="bsp-menu-icon">📋</span> {duplicating ? 'Duplicating…' : 'Duplicate Board'}
            </button>
            <div className="bsp-menu-divider" />
            <button className="bsp-menu-item bsp-menu-item--danger" onClick={() => { setMenuOpen(false); setDeleteConfirmOpen(true); }} role="menuitem">
              <span className="bsp-menu-icon">🗑️</span> Delete Board
            </button>
          </div>
        )}
      </div>

      {/* ── Edit Modal ────────────────────────────────────────────── */}
      {editOpen && (
        <div className="bsp-overlay" role="dialog" aria-modal="true" aria-label="Edit board settings">
          <div className="bsp-modal bsp-modal--wide">
            <div className="bsp-modal-header">
              <h2 className="bsp-modal-title">Board Settings</h2>
              <button className="bsp-modal-close" onClick={() => setEditOpen(false)} aria-label="Close">✕</button>
            </div>

            <div className="bsp-tabs">
              <button className={`bsp-tab ${modalTab === 'general' ? 'active' : ''}`} onClick={() => setModalTab('general')}>General</button>
              <button className={`bsp-tab ${modalTab === 'columns' ? 'active' : ''}`} onClick={() => setModalTab('columns')}>
                Columns <span className="bsp-tab-badge">{columns.length}</span>
              </button>
              <button className={`bsp-tab ${modalTab === 'ai_briefs' ? 'active' : ''}`} onClick={() => setModalTab('ai_briefs')}>AI Briefs</button>
            </div>

            <div className="bsp-modal-body">

              {/* ── General ── */}
              {modalTab === 'general' && (
                <>
                  <div className="bsp-field">
                    <label className="bsp-label" htmlFor="edit-board-name">Board Name *</label>
                    <input id="edit-board-name" className="bsp-input" value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="e.g. Enterprise Accounts" />
                  </div>
                  <div className="bsp-field">
                    <label className="bsp-label" htmlFor="edit-board-desc">Description</label>
                    <textarea id="edit-board-desc" className="bsp-input bsp-textarea" value={editDesc} onChange={(e) => setEditDesc(e.target.value)} placeholder="Optional description…" rows={3} />
                  </div>
                  <div className="bsp-field-row">
                    <div className="bsp-field">
                      <label className="bsp-label" htmlFor="edit-sort-field">Default Sort Field</label>
                      <select id="edit-sort-field" className="bsp-input" value={editSortField} onChange={(e) => setEditSortField(e.target.value as SortField)}>
                        <option value="name">Name</option>
                        <option value="exit_arr">ARR</option>
                        <option value="last_activity_date">Last Activity</option>
                        <option value="employee_count">Employee Count</option>
                      </select>
                    </div>
                    <div className="bsp-field">
                      <label className="bsp-label" htmlFor="edit-sort-dir">Direction</label>
                      <select id="edit-sort-dir" className="bsp-input" value={editSortDir} onChange={(e) => setEditSortDir(e.target.value as SortDir)}>
                        <option value="asc">Ascending ↑</option>
                        <option value="desc">Descending ↓</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {/* ── Columns ── */}
              {modalTab === 'columns' && (
                <>
                  <div className="bsp-col-section-title">Active Columns ({columns.length}/15)</div>
                  <div className="bsp-col-active-list">
                    {columns.length === 0 && <div className="bsp-col-empty">No columns configured.</div>}
                    {columns.map((col) => {
                      const isProtected = ['name', 'exit_arr'].includes(col.field_key);
                      const isRemoving = colActionId === col.id;
                      return (
                        <div key={col.id} className="bsp-col-row">
                          <span className="bsp-col-drag">⠿</span>
                          <div className="bsp-col-info">
                            <span className="bsp-col-label">{col.label}</span>
                            <span className="bsp-col-key">{col.field_key}</span>
                          </div>
                          {isProtected && <span className="bsp-col-protected">required</span>}
                          {!isProtected && (
                            <button className="bsp-col-remove" onClick={() => handleRemoveColumn(col.id, col.field_key)} disabled={isRemoving} aria-label={`Remove ${col.label}`} title="Remove column">
                              {isRemoving ? '…' : '✕'}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {columns.length < 15 && (
                    <>
                      <div className="bsp-col-section-title" style={{ marginTop: 16 }}>Add Column</div>
                      <div className="bsp-col-add-grid">
                        {AVAILABLE_COLUMNS.filter((c) => !activeFieldKeys.has(c.field_key)).map((col) => {
                          const isAdding = colActionId === col.field_key;
                          return (
                            <button key={col.field_key} id={`add-col-${col.field_key}`} className="bsp-col-add-btn" onClick={() => handleAddColumn(col.field_key)} disabled={isAdding} title={col.description}>
                              <span className="bsp-col-add-icon">{isAdding ? '…' : '+'}</span>
                              <div>
                                <div className="bsp-col-add-name">{col.label}</div>
                                <div className="bsp-col-add-desc">{col.description}</div>
                              </div>
                            </button>
                          );
                        })}
                        {AVAILABLE_COLUMNS.filter((c) => !activeFieldKeys.has(c.field_key)).length === 0 && (
                          <div className="bsp-col-empty">All available columns are active.</div>
                        )}
                      </div>
                    </>
                  )}
                </>
              )}

              {/* ── AI Briefs ── */}
              {modalTab === 'ai_briefs' && (
                <>
                  <div className="bsp-field">
                    <label className="bsp-label">AI Brief Generation</label>
                    <div className="bsp-toggle-row">
                      <span className="bsp-toggle-label">
                        {editAiBriefs ? 'Enabled — Brief buttons visible on all account rows' : 'Disabled — Brief buttons hidden for this board'}
                      </span>
                      <button id="toggle-ai-briefs" aria-label={editAiBriefs ? 'Disable AI Briefs' : 'Enable AI Briefs'} className={`bsp-toggle ${editAiBriefs ? 'on' : 'off'}`} onClick={() => setEditAiBriefs((v) => !v)}>
                        <span className="bsp-toggle-thumb" />
                      </button>
                    </div>
                  </div>

                  {editAiBriefs && (
                    <>
                      <div className="bsp-field-row">
                        <div className="bsp-field">
                          <label className="bsp-label" htmlFor="edit-brief-type">Brief Type</label>
                          <select id="edit-brief-type" className="bsp-input" value={editBriefType} onChange={(e) => setEditBriefType(e.target.value)}>
                            <option value="full">Full Brief</option>
                            <option value="summary">Summary Only</option>
                            <option value="risk_only">Risk Focus</option>
                          </select>
                        </div>
                        <div className="bsp-field">
                          <label className="bsp-label" htmlFor="edit-brief-period">Default Time Window</label>
                          <select id="edit-brief-period" className="bsp-input" value={editBriefPeriod} onChange={(e) => setEditBriefPeriod(Number(e.target.value))}>
                            <option value={7}>Last 7 days</option>
                            <option value={30}>Last 30 days</option>
                            <option value={60}>Last 60 days</option>
                            <option value={90}>Last 90 days</option>
                          </select>
                        </div>
                      </div>
                      <div className="bsp-info-box">
                        <strong>📌 Groq LLM</strong> — Briefs are generated from CRM activity data within the
                        selected time window. Full briefs include key risks + recommended next steps.
                        Cached for 1 hour per account per configuration.
                      </div>
                    </>
                  )}
                </>
              )}

              {error && <div className="bsp-error">{error}</div>}
            </div>

            <div className="bsp-modal-footer">
              <button className="bsp-btn bsp-btn--secondary" onClick={() => setEditOpen(false)}>Cancel</button>
              {modalTab === 'general' && (
                <button id="save-board-settings" className="bsp-btn bsp-btn--primary" onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              )}
              {modalTab === 'ai_briefs' && (
                <button id="save-brief-config" className="bsp-btn bsp-btn--primary" onClick={handleSaveBriefs} disabled={saving}>
                  {saving ? 'Saving…' : 'Save Brief Config'}
                </button>
              )}
              {modalTab === 'columns' && (
                <button className="bsp-btn bsp-btn--primary" onClick={() => setEditOpen(false)}>Done</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation ───────────────────────────────────── */}
      {deleteConfirmOpen && (
        <div className="bsp-overlay" role="dialog" aria-modal="true" aria-label="Confirm board deletion">
          <div className="bsp-modal bsp-modal--sm">
            <div className="bsp-modal-header">
              <h2 className="bsp-modal-title bsp-modal-title--danger">Delete Board</h2>
              <button className="bsp-modal-close" onClick={() => setDeleteConfirmOpen(false)} aria-label="Close">✕</button>
            </div>
            <div className="bsp-modal-body">
              <p className="bsp-confirm-text">
                Are you sure you want to delete <strong>&ldquo;{board.name}&rdquo;</strong>?
                This will permanently remove all tabs and column configurations. Company data will not be affected.
              </p>
              {error && <div className="bsp-error">{error}</div>}
            </div>
            <div className="bsp-modal-footer">
              <button className="bsp-btn bsp-btn--secondary" onClick={() => setDeleteConfirmOpen(false)} disabled={deleting}>Cancel</button>
              <button id="confirm-delete-board" className="bsp-btn bsp-btn--danger" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Deleting…' : 'Delete Board'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
