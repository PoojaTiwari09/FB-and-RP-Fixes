'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  listFields,
  createField,
  updateField,
  deleteField,
  toggleFieldActive,
  testExtraction,
  AiExtractionField,
  CreateFieldPayload,
  TestExtractionResult,
} from '../../api/ai-extractor.api';
import { listCalls, CallRecord } from '../../api/calls.api';
import styles from './page.module.css';

// ── Helper: auto-generate fieldName from label ──────────────────────────
function toFieldName(label: string) {
  return label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

// ── Empty form state ────────────────────────────────────────────────────
const EMPTY_FORM: CreateFieldPayload = {
  question: '',
  fieldLabel: '',
  fieldName: '',
  dataType: 'text',
  enumOptions: [],
  extractionHint: '',
  crmObject: '',
  crmField: '',
};

export default function ExtractionLibraryPage() {
  const router = useRouter();

  // ── State ─────────────────────────────────────────────────────────────
  const [fields,    setFields]    = useState<AiExtractionField[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form,      setForm]      = useState<CreateFieldPayload>(EMPTY_FORM);
  const [saving,    setSaving]    = useState(false);
  const [enumInput, setEnumInput] = useState('');

  // Test panel state (inside Edit modal)
  const [calls,       setCalls]       = useState<CallRecord[]>([]);
  const [testCallId,  setTestCallId]  = useState('');
  const [testing,     setTesting]     = useState(false);
  const [testResult,  setTestResult]  = useState<TestExtractionResult | null>(null);

  // Per-row Run Extraction state
  const [runModal,   setRunModal]   = useState<{ fieldId: string; fieldLabel: string } | null>(null);
  const [runCallId,  setRunCallId]  = useState('');
  const [running,    setRunning]    = useState(false);
  const [runResult,  setRunResult]  = useState<TestExtractionResult | null>(null);
  const [runError,   setRunError]   = useState<string | null>(null);

  // ── Load fields ───────────────────────────────────────────────────────
  const loadFields = useCallback(async () => {
    try {
      const data = await listFields();
      setFields(data);
    } catch (e: any) {
      console.error('Failed to load fields:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Load calls for test dropdown ──────────────────────────────────────
  const loadCalls = useCallback(async () => {
    try {
      const data = await listCalls({ transcriptStatus: 'completed' });
      setCalls(data.records ?? []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { loadFields(); loadCalls(); }, [loadFields, loadCalls]);

  // ── Modal open/close ──────────────────────────────────────────────────
  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setEnumInput('');
    setTestResult(null);
    setTestCallId('');
    setShowModal(true);
  };

  const openEdit = (f: AiExtractionField) => {
    setEditingId(f.id);
    setForm({
      question:       f.question,
      fieldLabel:     f.fieldLabel,
      fieldName:      f.fieldName,
      dataType:       f.dataType,
      enumOptions:    f.enumOptions,
      extractionHint: f.extractionHint ?? '',
      crmObject:      f.crmObject ?? '',
      crmField:       f.crmField ?? '',
    });
    setEnumInput(f.enumOptions.join(', '));
    setTestResult(null);
    setTestCallId('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setTestResult(null);
  };

  // ── Save (create or update) ───────────────────────────────────────────
  const handleSave = async () => {
    if (!form.question || !form.fieldLabel || !form.dataType) return;
    setSaving(true);
    try {
      const payload: CreateFieldPayload = {
        ...form,
        fieldName: form.fieldName || toFieldName(form.fieldLabel),
        enumOptions: form.dataType === 'enum'
          ? enumInput.split(',').map(s => s.trim()).filter(Boolean)
          : [],
      };

      if (editingId) {
        await updateField(editingId, payload);
      } else {
        await createField(payload);
      }
      await loadFields();
      closeModal();
    } catch (e: any) {
      alert(e.message || 'Failed to save field');
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────
  const handleDelete = async (id: string) => {
    if (!confirm('Delete this extraction field and all its results?')) return;
    try {
      await deleteField(id);
      await loadFields();
    } catch (e: any) {
      alert(e.message || 'Delete failed');
    }
  };

  // ── Toggle active ─────────────────────────────────────────────────────
  const handleToggle = async (f: AiExtractionField) => {
    try {
      await toggleFieldActive(f.id, !f.isActive);
      await loadFields();
    } catch (e: any) {
      alert(e.message || 'Toggle failed');
    }
  };

  // ── Test extraction ───────────────────────────────────────────────────
  const handleTest = async () => {
    if (!editingId || !testCallId) return;
    setTesting(true);
    setTestResult(null);
    try {
      const result = await testExtraction(editingId, testCallId);
      setTestResult(result);
    } catch (e: any) {
      alert(e.message || 'Test failed');
    } finally {
      setTesting(false);
    }
  };

  // ── Per-row Run Extraction for specific call ─────────────────────────
  const openRunModal = (f: AiExtractionField) => {
    setRunModal({ fieldId: f.id, fieldLabel: f.fieldLabel });
    setRunCallId('');
    setRunResult(null);
    setRunError(null);
  };

  const closeRunModal = () => {
    setRunModal(null);
    setRunResult(null);
    setRunError(null);
  };

  const handleRunExtraction = async () => {
    if (!runModal || !runCallId) return;
    setRunning(true);
    setRunResult(null);
    setRunError(null);
    try {
      const result = await testExtraction(runModal.fieldId, runCallId);
      setRunResult(result);
    } catch (e: any) {
      setRunError(e.message || 'Extraction failed');
    } finally {
      setRunning(false);
    }
  };

  // ── Confidence helpers ────────────────────────────────────────────────
  const getConfColor = (s: number | null) => {
    if (s == null) return '#475569';
    if (s >= 0.8) return '#10b981';
    if (s >= 0.5) return '#f59e0b';
    return '#ef4444';
  };

  // ── Auto-fill fieldName from label ────────────────────────────────────
  const handleLabelChange = (val: string) => {
    setForm(f => ({
      ...f,
      fieldLabel: val,
      fieldName: editingId ? f.fieldName : toFieldName(val),
    }));
  };

  // ── Completed calls for test dropdown ─────────────────────────────────
  const completedCalls = calls.filter(c => c.transcriptStatus === 'completed');

  return (
    <div className={styles.page}>
      <button className={styles.back} onClick={() => router.back()}>← Back</button>

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1>🧠 Extraction Library</h1>
          <p>Define questions the AI answers for every call transcript</p>
        </div>
        <button className={styles.addBtn} onClick={openCreate}>
          + New Field
        </button>
      </div>

      {/* ── Table or Empty State ─────────────────────────────────────── */}
      {loading ? (
        <div className={styles.emptyState}>Loading…</div>
      ) : fields.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🧠</div>
          <h2 className={styles.emptyTitle}>No extraction fields yet</h2>
          <p className={styles.emptyDesc}>
            Create your first field to start extracting structured intelligence
            from every call transcript automatically.
          </p>
          <button className={styles.addBtn} onClick={openCreate}>
            + Create First Field
          </button>
        </div>
      ) : (
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Field</th>
              <th>Type</th>
              <th>CRM Mapping</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {fields.map(f => (
              <tr key={f.id}>
                <td>
                  <div className={styles.fieldLabel}>{f.fieldLabel}</div>
                  <div className={styles.question}>{f.question}</div>
                </td>
                <td>
                  <span className={`${styles.typeBadge} ${styles[f.dataType]}`}>
                    {f.dataType}
                  </span>
                </td>
                <td>
                  {f.crmObject && f.crmField
                    ? `${f.crmObject} → ${f.crmField}`
                    : <span style={{ color: '#475569' }}>—</span>}
                </td>
                <td>
                  <div className={styles.statusToggle}>
                    <button
                      className={`${styles.toggle} ${f.isActive ? styles.active : styles.inactive}`}
                      onClick={() => handleToggle(f)}
                      aria-label={f.isActive ? 'Deactivate' : 'Activate'}
                    />
                    <span className={`${styles.statusLabel} ${f.isActive ? styles.on : styles.off}`}>
                      {f.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </td>
                <td>
                  <div className={styles.actions}>
                    <button className={styles.actionBtn} onClick={() => openEdit(f)}>✏️ Edit</button>
                    <button
                      className={`${styles.actionBtn} ${styles.runBtn}`}
                      onClick={() => openRunModal(f)}
                      title="Run extraction for a specific call"
                    >
                      ▶ Run
                    </button>
                    <button className={`${styles.actionBtn} ${styles.danger}`} onClick={() => handleDelete(f.id)}>🗑</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* ── Create/Edit Modal ────────────────────────────────────────── */}
      {showModal && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>
              {editingId ? '✏️ Edit Extraction Field' : '✨ New Extraction Field'}
            </h2>

            {/* Question */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Question</label>
              <textarea
                className={styles.formTextarea}
                placeholder='e.g. "What competitor was mentioned in the call?"'
                value={form.question}
                onChange={e => setForm(f => ({ ...f, question: e.target.value }))}
              />
              <div className={styles.formHint}>The question the AI will answer for each transcript</div>
            </div>

            {/* Label + Data Type */}
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Display Label</label>
                <input
                  className={styles.formInput}
                  placeholder='e.g. "Competitor Mentioned"'
                  value={form.fieldLabel}
                  onChange={e => handleLabelChange(e.target.value)}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Data Type</label>
                <select
                  className={styles.formSelect}
                  value={form.dataType}
                  onChange={e => setForm(f => ({ ...f, dataType: e.target.value }))}
                >
                  <option value="text">Text</option>
                  <option value="boolean">Boolean (Yes/No)</option>
                  <option value="number">Number</option>
                  <option value="date">Date</option>
                  <option value="enum">Select / Enum</option>
                </select>
              </div>
            </div>

            {/* Field Name (auto-generated) */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Field Name (machine key)</label>
              <input
                className={styles.formInput}
                value={form.fieldName}
                onChange={e => setForm(f => ({ ...f, fieldName: e.target.value }))}
                placeholder="auto-generated from label"
              />
            </div>

            {/* Enum Options (conditional) */}
            {form.dataType === 'enum' && (
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Enum Options (comma-separated)</label>
                <input
                  className={styles.formInput}
                  placeholder='e.g. "Low, Medium, High"'
                  value={enumInput}
                  onChange={e => setEnumInput(e.target.value)}
                />
              </div>
            )}

            {/* Extraction Hint */}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Extraction Hint (optional)</label>
              <input
                className={styles.formInput}
                placeholder='e.g. "Look for competitor names like Salesforce, HubSpot, Zoho"'
                value={form.extractionHint}
                onChange={e => setForm(f => ({ ...f, extractionHint: e.target.value }))}
              />
            </div>

            {/* CRM Mapping */}
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>CRM Object</label>
                <select
                  className={styles.formSelect}
                  value={form.crmObject}
                  onChange={e => setForm(f => ({ ...f, crmObject: e.target.value }))}
                >
                  <option value="">— None —</option>
                  <option value="Deal">Deal</option>
                  <option value="Account">Account</option>
                  <option value="Contact">Contact</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>CRM Field</label>
                <input
                  className={styles.formInput}
                  placeholder='e.g. "Competitor__c"'
                  value={form.crmField}
                  onChange={e => setForm(f => ({ ...f, crmField: e.target.value }))}
                />
              </div>
            </div>

            {/* ── Test Panel (only when editing an existing field) ──── */}
            {editingId && (
              <div className={styles.testSection}>
                <div className={styles.testTitle}>🧪 Test Against a Transcript</div>
                <div className={styles.testRow}>
                  <select
                    className={styles.testSelect}
                    value={testCallId}
                    onChange={e => setTestCallId(e.target.value)}
                  >
                    <option value="">Select a completed call…</option>
                    {completedCalls.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.title} ({new Date(c.callDate).toLocaleDateString()})
                      </option>
                    ))}
                  </select>
                  <button
                    className={styles.testBtn}
                    onClick={handleTest}
                    disabled={testing || !testCallId}
                  >
                    {testing ? '⏳ Testing…' : '▶ Run Test'}
                  </button>
                </div>

                {testResult && (
                  <div className={styles.testResult}>
                    <div className={styles.testResultLabel}>Extracted Value</div>
                    <div className={styles.testResultValue}>
                      {testResult.extractedValue ?? 'Not detected'}
                    </div>
                    {testResult.rawEvidence && (
                      <div className={styles.testEvidence}>
                        "{testResult.rawEvidence}"
                      </div>
                    )}
                    <div className={styles.testConfidence}>
                      <span
                        className={styles.confidenceDot}
                        style={{ background: getConfColor(testResult.confidenceScore) }}
                      />
                      <span style={{ color: getConfColor(testResult.confidenceScore) }}>
                        Confidence: {testResult.confidenceScore != null
                          ? `${Math.round(testResult.confidenceScore * 100)}%`
                          : 'N/A'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Modal Actions ────────────────────────────────────── */}
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={closeModal}>Cancel</button>
              <button
                className={styles.saveBtn}
                onClick={handleSave}
                disabled={saving || !form.question || !form.fieldLabel || !form.dataType}
              >
                {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Create Field'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Per-row Run Extraction Modal ─────────────────────────────── */}
      {runModal && (
        <div className={styles.modalOverlay} onClick={closeRunModal}>
          <div className={styles.modal} onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
            <h2 className={styles.modalTitle}>▶ Run Extraction for a Call</h2>
            <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 16 }}>
              Field: <strong style={{ color: '#e2e8f0' }}>{runModal.fieldLabel}</strong>
            </p>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Select Call</label>
              <select
                className={styles.formSelect}
                value={runCallId}
                onChange={e => { setRunCallId(e.target.value); setRunResult(null); setRunError(null); }}
              >
                <option value="">— Select a completed call —</option>
                {completedCalls.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.title} ({new Date(c.callDate).toLocaleDateString()})
                  </option>
                ))}
              </select>
              {completedCalls.length === 0 && (
                <div className={styles.formHint} style={{ color: '#f59e0b' }}>
                  No completed calls available. Upload and transcribe a call first.
                </div>
              )}
            </div>

            {/* Result */}
            {runResult && (
              <div className={styles.testResult}>
                <div className={styles.testResultLabel}>✅ Extracted Value</div>
                <div className={styles.testResultValue}>
                  {runResult.extractedValue ?? 'Not detected'}
                </div>
                {runResult.rawEvidence && (
                  <div className={styles.testEvidence}>"{runResult.rawEvidence}"</div>
                )}
                <div className={styles.testConfidence}>
                  <span
                    className={styles.confidenceDot}
                    style={{ background: getConfColor(runResult.confidenceScore) }}
                  />
                  <span style={{ color: getConfColor(runResult.confidenceScore) }}>
                    Confidence: {runResult.confidenceScore != null
                      ? `${Math.round(runResult.confidenceScore * 100)}%`
                      : 'N/A'}
                  </span>
                </div>
              </div>
            )}

            {runError && (
              <div style={{ color: '#ef4444', fontSize: 13, padding: '8px 12px', background: '#450a0a', borderRadius: 6, border: '1px solid #7f1d1d', marginBottom: 12 }}>
                ❌ {runError}
              </div>
            )}

            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={closeRunModal}>Close</button>
              <button
                className={styles.testBtn}
                onClick={handleRunExtraction}
                disabled={running || !runCallId}
              >
                {running ? '⏳ Running…' : '▶ Run Extraction'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
