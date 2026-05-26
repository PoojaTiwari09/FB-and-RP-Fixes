'use client';

import { useEffect, useState, useRef } from 'react';
import { useSessionStore } from '@/modules/m05-account-intelligence/store/useSessionStore';
import { fetchBoards, updateBoard, triggerSync } from '@/modules/m05-account-intelligence/lib/api';
import type { BoardConfig } from '@/modules/m05-account-intelligence/types';

export default function AdminPage() {
  const role = useSessionStore((s) => s.role);
  const [boards, setBoards] = useState<BoardConfig[]>([]);
  const [selectedBoard, setSelectedBoard] = useState<BoardConfig | null>(null);
  const [originalBoard, setOriginalBoard] = useState<BoardConfig | null>(null);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [syncMsg, setSyncMsg] = useState('');

  useEffect(() => {
    fetchBoards().then((b) => {
      setBoards(b);
      if (b.length > 0) {
        setSelectedBoard(b[0]);
        setOriginalBoard(b[0]);
      }
    });
  }, []);

  if (role !== 'admin') {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100vh', flexDirection: 'column', gap: 12,
      }}>
        <div style={{ fontSize: 48 }}>🔒</div>
        <div style={{ fontSize: 16, color: 'var(--text-secondary)' }}>
          Admin access required. Switch role to <strong>admin</strong> in the sidebar.
        </div>
        <a href="/board/commercial" className="btn btn-secondary" style={{ marginTop: 8 }}>
          ← Back to Dashboard
        </a>
      </div>
    );
  }

  // Check if there are unsaved changes
  const isDirty = selectedBoard && originalBoard &&
    JSON.stringify({
      name: selectedBoard.name,
      description: selectedBoard.description,
      date_filter_enabled: selectedBoard.date_filter_enabled,
      ai_briefs_enabled: selectedBoard.ai_briefs_enabled,
      columns: selectedBoard.columns,
    }) !== JSON.stringify({
      name: originalBoard.name,
      description: originalBoard.description,
      date_filter_enabled: originalBoard.date_filter_enabled,
      ai_briefs_enabled: originalBoard.ai_briefs_enabled,
      columns: originalBoard.columns,
    });

  const handleSave = async () => {
    if (!selectedBoard) return;
    setSaving(true);
    setSaveMsg('');
    try {
      const updated = await updateBoard(selectedBoard.slug, {
        name: selectedBoard.name,
        description: selectedBoard.description,
        date_filter_enabled: selectedBoard.date_filter_enabled,
        ai_briefs_enabled: selectedBoard.ai_briefs_enabled,
        columns: selectedBoard.columns,
        tabs: selectedBoard.tabs,
      });
      // Re-fetch to confirm persistence
      const refreshed = await fetchBoards();
      setBoards(refreshed);
      const freshBoard = refreshed.find((b) => b.slug === selectedBoard.slug);
      if (freshBoard) {
        setSelectedBoard(freshBoard);
        setOriginalBoard(freshBoard);
      }
      setSaveMsg('✓ Board saved successfully');
    } catch {
      setSaveMsg('✗ Failed to save board');
    } finally {
      setSaving(false);
    }
  };

  const handleSelectBoard = (board: BoardConfig) => {
    setSelectedBoard(board);
    setOriginalBoard(board);
    setSaveMsg('');
  };

  const handleSync = async () => {
    setSyncing(true);
    setSyncMsg('');
    try {
      const result = await triggerSync('admin');
      setSyncMsg(result.success ? `✓ ${result.message}` : `✗ ${result.message || 'Sync failed'}`);
    } catch {
      setSyncMsg('✗ Sync service unreachable');
    } finally {
      setSyncing(false);
    }
  };

  const updateField = (field: keyof BoardConfig, value: any) => {
    if (!selectedBoard) return;
    setSelectedBoard({ ...selectedBoard, [field]: value });
  };

  const updateColumn = (colId: string, field: string, value: any) => {
    if (!selectedBoard) return;
    setSelectedBoard({
      ...selectedBoard,
      columns: selectedBoard.columns.map((col) =>
        col.id === colId ? { ...col, [field]: value } : col,
      ),
    });
  };

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="app-sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">RI</div>
          <span className="logo-text">Revenue Intel</span>
        </div>
        <div className="sidebar-section">
          <div className="sidebar-section-title">Navigation</div>
          <a href="/board/commercial" className="sidebar-link">
            <span className="link-icon">📊</span> Dashboard
          </a>
          <a href="/admin" className="sidebar-link active">
            <span className="link-icon">⚙️</span> Admin Wizard
          </a>
        </div>
      </aside>

      {/* Main */}
      <main className="app-main">
        <header className="app-header">
          <h1 className="header-board-name">⚙ Admin Board Wizard</h1>
          <div className="header-right">
            <span style={{ fontSize: 11, background: 'var(--danger-bg)', color: 'var(--danger)', padding: '3px 10px', borderRadius: 100, fontWeight: 600 }}>
              ADMIN ONLY
            </span>
          </div>
        </header>

        <div style={{ padding: 24, display: 'grid', gridTemplateColumns: '240px 1fr', gap: 24, maxWidth: 1100 }}>
          {/* Board selector */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-muted)', marginBottom: 12 }}>
              Boards
            </div>
            {boards.map((board) => (
              <button
                key={board.id}
                onClick={() => handleSelectBoard(board)}
                style={{
                  width: '100%', textAlign: 'left', padding: '10px 14px',
                  background: selectedBoard?.id === board.id ? 'var(--accent-light)' : 'var(--bg-tertiary)',
                  border: `1px solid ${selectedBoard?.id === board.id ? 'var(--accent)' : 'var(--surface-border)'}`,
                  borderRadius: 'var(--radius-md)', cursor: 'pointer', marginBottom: 8,
                  color: selectedBoard?.id === board.id ? 'var(--accent)' : 'var(--text-primary)',
                  fontSize: 13, fontWeight: 500, transition: 'all var(--transition-fast)',
                }}
              >
                {board.name.split(' — ')[0]}
              </button>
            ))}

            {/* Sync Control */}
            <div style={{ marginTop: 24, padding: 16, background: 'var(--bg-tertiary)', border: '1px solid var(--surface-border)', borderRadius: 'var(--radius-lg)' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 8 }}>
                HubSpot Sync
              </div>
              <button
                className="btn btn-secondary"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={handleSync}
                disabled={syncing}
              >
                {syncing ? '⟳ Syncing…' : '🔄 Trigger Sync'}
              </button>
              {syncMsg && (
                <div style={{
                  marginTop: 8, fontSize: 11, fontWeight: 500, padding: '4px 8px', borderRadius: 4,
                  background: syncMsg.startsWith('✓') ? 'var(--success-bg)' : 'var(--danger-bg)',
                  color: syncMsg.startsWith('✓') ? 'var(--success)' : 'var(--danger)',
                }}>
                  {syncMsg}
                </div>
              )}
            </div>
          </div>

          {/* Board editor */}
          {selectedBoard && (
            <div>
              {/* ── Sticky Save Bar ── */}
              <div style={{
                position: 'sticky', top: 0, zIndex: 10,
                padding: '12px 20px', marginBottom: 20,
                background: isDirty ? 'var(--warning-bg, rgba(255,193,7,0.12))' : 'var(--bg-card)',
                border: `1px solid ${isDirty ? 'var(--warning, #ffc107)' : 'var(--surface-border)'}`,
                borderRadius: 'var(--radius-lg)',
                display: 'flex', alignItems: 'center', gap: 12,
                backdropFilter: 'blur(8px)',
              }}>
                <button
                  id="save-board-config"
                  className="btn btn-primary"
                  onClick={handleSave}
                  disabled={saving || !isDirty}
                  style={{ minWidth: 160 }}
                >
                  {saving ? '⟳ Saving…' : isDirty ? '💾 Save Board Config' : '✓ Saved'}
                </button>
                <a href={`/board/${selectedBoard.slug}`} className="btn btn-secondary">
                  ← Back to Board
                </a>
                {isDirty && (
                  <span style={{ fontSize: 12, color: 'var(--warning, #ffc107)', fontWeight: 600 }}>
                    ● Unsaved changes
                  </span>
                )}
                {saveMsg && (
                  <span style={{
                    fontSize: 12, fontWeight: 500,
                    color: saveMsg.startsWith('✓') ? 'var(--success)' : 'var(--danger)',
                  }}>
                    {saveMsg}
                  </span>
                )}
              </div>

              {/* Board settings */}
              <div style={{
                padding: 20, background: 'var(--bg-card)', border: '1px solid var(--surface-border)',
                borderRadius: 'var(--radius-lg)', marginBottom: 20,
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16, color: 'var(--text-primary)' }}>
                  Board Settings
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                  <div>
                    <label style={{ fontSize: 11, color: 'var(--text-tertiary)', display: 'block', marginBottom: 6 }}>
                      Board Name
                    </label>
                    <input
                      className="todo-input"
                      value={selectedBoard.name}
                      onChange={(e) => updateField('name', e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: 'var(--text-tertiary)', display: 'block', marginBottom: 6 }}>
                      Description
                    </label>
                    <input
                      className="todo-input"
                      value={selectedBoard.description || ''}
                      onChange={(e) => updateField('description', e.target.value)}
                    />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 20 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={selectedBoard.date_filter_enabled}
                      onChange={(e) => updateField('date_filter_enabled', e.target.checked)}
                    />
                    Date Filter Enabled
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={selectedBoard.ai_briefs_enabled}
                      onChange={(e) => updateField('ai_briefs_enabled', e.target.checked)}
                    />
                    AI Briefs Enabled
                  </label>
                </div>
              </div>

              {/* Columns editor */}
              <div style={{
                padding: 20, background: 'var(--bg-card)', border: '1px solid var(--surface-border)',
                borderRadius: 'var(--radius-lg)', marginBottom: 20,
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16, color: 'var(--text-primary)' }}>
                  Column Configuration
                </div>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Column</th>
                      <th>Field Key</th>
                      <th>Width</th>
                      <th>Sortable</th>
                      <th>Editable</th>
                      <th>Visible To</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedBoard.columns.map((col) => (
                      <tr key={col.id} style={{ cursor: 'default' }}>
                        <td>
                          <input
                            className="todo-input"
                            value={col.label}
                            onChange={(e) => updateColumn(col.id, 'label', e.target.value)}
                            style={{ width: 120 }}
                          />
                        </td>
                        <td style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'monospace' }}>
                          {col.field_key}
                        </td>
                        <td>
                          <input
                            type="number"
                            className="todo-input"
                            value={col.width}
                            onChange={(e) => updateColumn(col.id, 'width', Number(e.target.value))}
                            style={{ width: 60 }}
                          />
                        </td>
                        <td>
                          <input
                            type="checkbox"
                            checked={col.sortable}
                            onChange={(e) => updateColumn(col.id, 'sortable', e.target.checked)}
                          />
                        </td>
                        <td>
                          <input
                            type="checkbox"
                            checked={col.editable}
                            onChange={(e) => updateColumn(col.id, 'editable', e.target.checked)}
                          />
                        </td>
                        <td style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                          {Array.isArray(col.visible_to_roles) ? col.visible_to_roles.join(', ') : 'all'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Tabs overview */}
              <div style={{
                padding: 20, background: 'var(--bg-card)', border: '1px solid var(--surface-border)',
                borderRadius: 'var(--radius-lg)', marginBottom: 20,
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16, color: 'var(--text-primary)' }}>
                  Board Tabs ({selectedBoard.tabs.length})
                </div>
                {selectedBoard.tabs.map((tab) => (
                  <div key={tab.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0',
                    borderBottom: '1px solid var(--surface-border)',
                  }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)', minWidth: 120 }}>
                      {tab.label}
                    </span>
                    {tab.is_default && (
                      <span style={{ fontSize: 10, padding: '2px 8px', background: 'var(--accent-light)', color: 'var(--accent)', borderRadius: 100 }}>
                        Default
                      </span>
                    )}
                    <span style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'monospace' }}>
                      {tab.filter_logic?.operator} · {tab.filter_logic?.conditions?.length || 0} conditions
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

