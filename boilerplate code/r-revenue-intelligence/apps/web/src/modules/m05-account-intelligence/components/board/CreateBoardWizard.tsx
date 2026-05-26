'use client';

import { useState } from 'react';
import { createBoard } from '@/modules/m05-account-intelligence/lib/api';
import type { BoardConfig } from '@/modules/m05-account-intelligence/types';

interface Props {
  existingBoards: BoardConfig[];
  onCreated: (board: BoardConfig) => void;
  onClose: () => void;
}

type AggMethod = 'count' | 'arr_sum';
type BriefType = 'full' | 'summary' | 'risk_only';

interface TabDraft {
  label: string;
}

interface ColDraft {
  field_key: string;
  label: string;
  visible_to_roles: string[];
}

const AVAILABLE_COLUMNS: { field_key: string; label: string; description: string; required?: boolean }[] = [
  { field_key: 'name', label: 'Account', description: 'Company name + industry/segment', required: true },
  { field_key: 'exit_arr', label: 'ARR', description: 'Annual Recurring Revenue', required: true },
  { field_key: 'contacts_count', label: 'Contacts', description: 'Number of CRM contacts' },
  { field_key: 'activity_timeline', label: 'Activity Timeline', description: '21-day sparkline bubbles' },
  { field_key: 'last_activity_date', label: 'Last Activity', description: 'Date of last interaction' },
  { field_key: 'manager_note', label: 'Manager Note', description: 'Editable note field (manager only)' },
  { field_key: 'open_deals_summary', label: 'Open Deals', description: 'Count + value of open deals' },
  { field_key: 'renewal_date', label: 'Renewal Date', description: 'Earliest renewal deal close date' },
  { field_key: 'employee_count', label: 'Employees', description: 'Employee headcount from HubSpot' },
];

const STEP_LABELS = ['Details', 'Tabs', 'Columns', 'AI Briefs'];

export default function CreateBoardWizard({ existingBoards, onCreated, onClose }: Props) {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  // Step 1
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [aggMethod, setAggMethod] = useState<AggMethod>('arr_sum');
  const [companySource, setCompanySource] = useState<string>(existingBoards[0]?.slug || '');

  // Step 2 — Tabs
  const [tabs, setTabs] = useState<TabDraft[]>([{ label: 'All Accounts' }]);

  // Step 3 — Columns
  const [selectedCols, setSelectedCols] = useState<ColDraft[]>([
    { field_key: 'name', label: 'Account', visible_to_roles: ['rep', 'manager', 'admin'] },
    { field_key: 'exit_arr', label: 'ARR', visible_to_roles: ['rep', 'manager', 'admin'] },
    { field_key: 'activity_timeline', label: 'Activity Timeline', visible_to_roles: ['rep', 'manager', 'admin'] },
    { field_key: 'last_activity_date', label: 'Last Activity', visible_to_roles: ['rep', 'manager', 'admin'] },
  ]);

  // Step 4
  const [aiBriefs, setAiBriefs] = useState(true);
  const [briefType, setBriefType] = useState<BriefType>('full');
  const [briefPeriodDays, setBriefPeriodDays] = useState(30);

  const buildPayload = () => ({
    name,
    description,
    aggregation_method: aggMethod,
    parent_board_slug: companySource || undefined,
    tabs: tabs.map((t, i) => ({
      label: t.label,
      filter_logic: { operator: 'AND', conditions: [] },
      order: i,
    })),
    columns: selectedCols.map((c, i) => ({
      field_key: c.field_key,
      label: c.label,
      visible_to_roles: c.visible_to_roles,
      order: i,
    })),
    ai_briefs_enabled: aiBriefs,
    brief_type: briefType,
    brief_period_days: briefPeriodDays,
  });

  const validateAndNext = async () => {
    setErrors([]);
    setSaving(true);
    try {
      await createBoard(step, buildPayload());
      setStep(step + 1);
    } catch (err: any) {
      const body = err.message || '';
      // Try to parse validation errors from body
      try {
        const parsed = JSON.parse(body.replace(/^API Error \d+: /, ''));
        if (parsed.message?.errors) setErrors(parsed.message.errors);
        else if (Array.isArray(parsed.errors)) setErrors(parsed.errors);
        else setErrors([body]);
      } catch {
        setErrors([body]);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleFinish = async () => {
    setErrors([]);
    setSaving(true);
    try {
      const result = await createBoard(4, buildPayload());
      if (result.board) {
        onCreated(result.board);
      }
    } catch (err: any) {
      const body = err.message || '';
      try {
        const parsed = JSON.parse(body.replace(/^API Error \d+: /, ''));
        if (parsed.message?.errors) setErrors(parsed.message.errors);
        else if (Array.isArray(parsed.errors)) setErrors(parsed.errors);
        else setErrors([body]);
      } catch {
        setErrors([body]);
      }
    } finally {
      setSaving(false);
    }
  };

  const toggleColumn = (field_key: string) => {
    const col = AVAILABLE_COLUMNS.find((c) => c.field_key === field_key)!;
    if (col.required) return; // can't deselect required
    const isSelected = selectedCols.some((c) => c.field_key === field_key);
    if (isSelected) {
      setSelectedCols(selectedCols.filter((c) => c.field_key !== field_key));
    } else {
      if (selectedCols.length >= 15) {
        setErrors(['Maximum 15 columns allowed']);
        return;
      }
      setErrors([]);
      setSelectedCols([...selectedCols, { field_key, label: col.label, visible_to_roles: ['rep', 'manager', 'admin'] }]);
    }
  };

  return (
    <div className="cbw-overlay" role="dialog" aria-modal="true" aria-label="Create new board">
      <div className="cbw-modal">
        {/* Header */}
        <div className="cbw-header">
          <div>
            <h2 className="cbw-title">Create New Board</h2>
            <p className="cbw-subtitle">Configure your revenue intelligence board in 4 steps</p>
          </div>
          <button className="bsp-modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        {/* Step Indicator */}
        <div className="cbw-steps">
          {STEP_LABELS.map((label, i) => {
            const stepNum = i + 1;
            const state = step === stepNum ? 'active' : step > stepNum ? 'done' : 'upcoming';
            return (
              <div key={stepNum} className={`cbw-step ${state}`}>
                <div className="cbw-step-circle">
                  {state === 'done' ? '✓' : stepNum}
                </div>
                <span className="cbw-step-label">{label}</span>
                {i < STEP_LABELS.length - 1 && <div className="cbw-step-connector" />}
              </div>
            );
          })}
        </div>

        {/* Body */}
        <div className="cbw-body">
          {/* ── Step 1: Details ── */}
          {step === 1 && (
            <div className="cbw-step-content">
              <div className="bsp-field">
                <label className="bsp-label" htmlFor="cbw-name">Board Name *</label>
                <input
                  id="cbw-name"
                  className="bsp-input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Strategic Accounts"
                  maxLength={80}
                  autoFocus
                />
                <span className="cbw-hint">{name.length}/80 characters</span>
              </div>

              <div className="bsp-field">
                <label className="bsp-label" htmlFor="cbw-desc">Description</label>
                <textarea
                  id="cbw-desc"
                  className="bsp-input bsp-textarea"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Optional — describe the purpose of this board"
                  rows={3}
                />
              </div>

              <div className="bsp-field">
                <label className="bsp-label" htmlFor="cbw-source">Company Source</label>
                <select
                  id="cbw-source"
                  className="bsp-input"
                  value={companySource}
                  onChange={(e) => setCompanySource(e.target.value)}
                >
                  <option value="">— No source (empty board) —</option>
                  {existingBoards.map((b) => (
                    <option key={b.slug} value={b.slug}>{b.name}</option>
                  ))}
                </select>
                <span className="cbw-hint">
                  {companySource
                    ? `This board will show companies from "${existingBoards.find(b => b.slug === companySource)?.name}"`
                    : 'Board will be empty until companies are assigned in HubSpot'}
                </span>
              </div>

              <div className="bsp-field">
                <label className="bsp-label">Summary Aggregation Method</label>
                <div className="cbw-radio-group">
                  {([
                    { value: 'arr_sum', label: 'ARR Sum', desc: 'Show total ARR for each tab' },
                    { value: 'count', label: 'Account Count', desc: 'Show number of accounts per tab' },
                  ] as const).map((opt) => (
                    <label key={opt.value} className={`cbw-radio-card ${aggMethod === opt.value ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="agg"
                        value={opt.value}
                        checked={aggMethod === opt.value}
                        onChange={() => setAggMethod(opt.value)}
                        className="cbw-radio-input"
                      />
                      <div>
                        <div className="cbw-radio-label">{opt.label}</div>
                        <div className="cbw-radio-desc">{opt.desc}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Step 2: Tabs ── */}
          {step === 2 && (
            <div className="cbw-step-content">
              <p className="cbw-step-info">
                Define up to <strong>8 tabs</strong> for this board. Tabs act as saved filters.
                The first tab is the default view.
              </p>

              <div className="cbw-tab-list">
                {tabs.map((tab, i) => (
                  <div key={i} className="cbw-tab-row">
                    <div className="cbw-tab-index">{i + 1}</div>
                    <input
                      className="bsp-input cbw-tab-input"
                      value={tab.label}
                      onChange={(e) => {
                        const updated = [...tabs];
                        updated[i] = { ...updated[i], label: e.target.value };
                        setTabs(updated);
                      }}
                      placeholder={`Tab ${i + 1} name`}
                      aria-label={`Tab ${i + 1} name`}
                    />
                    {tabs.length > 1 && (
                      <button
                        className="cbw-tab-remove"
                        onClick={() => setTabs(tabs.filter((_, j) => j !== i))}
                        aria-label={`Remove tab ${i + 1}`}
                        title="Remove tab"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {tabs.length < 8 && (
                <button
                  className="cbw-add-tab-btn"
                  onClick={() => setTabs([...tabs, { label: '' }])}
                >
                  + Add Tab
                </button>
              )}
            </div>
          )}

          {/* ── Step 3: Columns ── */}
          {step === 3 && (
            <div className="cbw-step-content">
              <p className="cbw-step-info">
                Select up to <strong>15 columns</strong>. <strong>Account</strong> and <strong>ARR</strong> are required.
                <span className="cbw-col-count"> {selectedCols.length}/15 selected</span>
              </p>

              <div className="cbw-col-grid">
                {AVAILABLE_COLUMNS.map((col) => {
                  const selected = selectedCols.some((c) => c.field_key === col.field_key);
                  return (
                    <label
                      key={col.field_key}
                      className={`cbw-col-card ${selected ? 'selected' : ''} ${col.required ? 'required' : ''}`}
                      title={col.required ? 'Required — cannot be removed' : ''}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleColumn(col.field_key)}
                        disabled={col.required}
                        className="cbw-col-checkbox"
                      />
                      <div className="cbw-col-info">
                        <div className="cbw-col-name">
                          {col.label}
                          {col.required && <span className="cbw-required-badge">required</span>}
                        </div>
                        <div className="cbw-col-desc">{col.description}</div>
                      </div>
                      <div className={`cbw-col-check ${selected ? 'on' : ''}`}>
                        {selected ? '✓' : ''}
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Step 4: AI Briefs ── */}
          {step === 4 && (
            <div className="cbw-step-content">
              <div className="bsp-field">
                <label className="bsp-label">AI Brief Generation</label>
                <div className="bsp-toggle-row">
                  <span className="bsp-toggle-label">
                    {aiBriefs ? 'Enabled — AI brief buttons shown on all account rows' : 'Disabled — brief buttons hidden'}
                  </span>
                  <button
                    id="cbw-toggle-briefs"
                    aria-label={aiBriefs ? 'Disable AI Briefs' : 'Enable AI Briefs'}
                    className={`bsp-toggle ${aiBriefs ? 'on' : 'off'}`}
                    onClick={() => setAiBriefs((v) => !v)}
                  >
                    <span className="bsp-toggle-thumb" />
                  </button>
                </div>
              </div>

              {aiBriefs && (
                <>
                  <div className="bsp-field-row">
                    <div className="bsp-field">
                      <label className="bsp-label" htmlFor="cbw-brief-type">Brief Type</label>
                      <select
                        id="cbw-brief-type"
                        className="bsp-input"
                        value={briefType}
                        onChange={(e) => setBriefType(e.target.value as BriefType)}
                      >
                        <option value="full">Full Brief</option>
                        <option value="summary">Summary Only</option>
                        <option value="risk_only">Risk Focus</option>
                      </select>
                    </div>
                    <div className="bsp-field">
                      <label className="bsp-label" htmlFor="cbw-brief-period">Time Window</label>
                      <select
                        id="cbw-brief-period"
                        className="bsp-input"
                        value={briefPeriodDays}
                        onChange={(e) => setBriefPeriodDays(Number(e.target.value))}
                      >
                        <option value={7}>Last 7 days</option>
                        <option value={30}>Last 30 days</option>
                        <option value={60}>Last 60 days</option>
                        <option value={90}>Last 90 days</option>
                      </select>
                    </div>
                  </div>

                  <div className="bsp-info-box">
                    <strong>📌 Groq LLM</strong> — Briefs are generated from CRM activity data within the selected time window.
                    Full briefs include key risks + recommended next steps. Responses are cached for 1 hour per account.
                  </div>
                </>
              )}
            </div>
          )}

          {/* Errors */}
          {errors.length > 0 && (
            <div className="bsp-error">
              {errors.map((e, i) => <div key={i}>• {e}</div>)}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="cbw-footer">
          <div>
            {step > 1 && (
              <button className="bsp-btn bsp-btn--secondary" onClick={() => { setErrors([]); setStep(step - 1); }}>
                ← Back
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="bsp-btn bsp-btn--secondary" onClick={onClose}>Cancel</button>
            {step < 4 ? (
              <button
                id={`cbw-next-step-${step}`}
                className="bsp-btn bsp-btn--primary"
                onClick={validateAndNext}
                disabled={saving}
              >
                {saving ? 'Validating…' : `Next: ${STEP_LABELS[step]} →`}
              </button>
            ) : (
              <button
                id="cbw-create-board"
                className="bsp-btn bsp-btn--primary"
                onClick={handleFinish}
                disabled={saving}
              >
                {saving ? 'Creating…' : '✦ Create Board'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
