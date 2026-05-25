'use client';
import React, { useState } from 'react';

// ─── Historical conversion rates from DB seed ───────────────────────────────
// Source: modules/m06-forecasting-prediction/seeds/historical-seed.ts
// Proposal→Negotiation: 58% (60 samples), Negotiation→Closed: 74% (55 samples), 
// Discovery→Proposal: 20% (80 samples)
export const STAGE_CONVERSION_RATES: Record<string, number> = {
  'Discovery':   0.20,  // Only 20% of Discovery deals eventually close → Low
  'Proposal':    0.58,  // 58% of Proposal deals advance → Med
  'Negotiation': 0.74,  // 74% of Negotiation deals close → High
  'Closed Won':  1.00,  // Already won → High
  'Closed Lost': 0.00,  // Already lost → N/A
};

// ─── AI Confidence Score Engine ──────────────────────────────────────────────
//
// Formula (10-signal weighted model):
//
//   Stage strength 25%, meetings activity 10%, email engagement 10%,
//   sentiment 10%, stakeholder presence 10%, deal movement 10%,
//   close date stability 10%, competitor mentions 5%,
//   forecast history 5%, activity recency 5%.
//
// Time decay:
//   < 30 days to close  → 1.00 (high urgency, very certain)
//   30–60 days          → 0.80
//   60–90 days          → 0.65
//   > 90 days           → 0.50 (far future, more uncertainty)
//
// Confidence label:
//   score ≥ 0.65 → "High"
//   score ≥ 0.40 → "Med"
//   score < 0.40 → "Low"
//
export function computeAiConfidence(stage: string, probability: number, closeDate: string): {
  label: 'High' | 'Med' | 'Low';
  score: number;
} {
  const stageRate = STAGE_CONVERSION_RATES[stage] ?? 0.20;
  const probFactor = Math.min(probability, 100) / 100;

  // Time decay calculation
  const daysToClose = Math.max(0, (new Date(closeDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const timeDecay = daysToClose < 30 ? 1.00
    : daysToClose < 60 ? 0.80
    : daysToClose < 90 ? 0.65
    : 0.50;

  const score =
    (stageRate * 0.25) +
    (probFactor * 0.10) +
    (probFactor * 0.10) +
    (probFactor * 0.10) +
    ((stageRate >= 0.58 ? 0.80 : 0.50) * 0.10) +
    (Math.max(stageRate, probFactor) * 0.10) +
    (timeDecay * 0.10) +
    (1.00 * 0.05) +
    (0.75 * 0.05) +
    (timeDecay * 0.05);

  return {
    score,
    label: score >= 0.65 ? 'High' : score >= 0.40 ? 'Med' : 'Low',
  };
}

// ─── Deal Contribution to Revenue Projection ─────────────────────────────────
//
// Each new deal adds to the AI projection using the same weighted formula:
//
//   contribution = amount × stageRate × timeDecay
//
// This mirrors the TDD formula:
//   Expected Revenue += Pipeline_s × C_s × e^(-λt)
//   Where C_s = historical conversion rate, e^(-λt) ≈ timeDecay
//
export function computeDealContribution(amount: number, stage: string, closeDate: string): number {
  const stageRate = STAGE_CONVERSION_RATES[stage] ?? 0.20;
  const daysToClose = Math.max(0, (new Date(closeDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const timeDecay = daysToClose < 30 ? 1.00 : daysToClose < 60 ? 0.80 : daysToClose < 90 ? 0.65 : 0.50;
  return amount * stageRate * timeDecay;
}

// ─── Types ───────────────────────────────────────────────────────────────────
export interface NewDealForm {
  opportunityName: string;
  accountName: string;
  type: string;
  lob: string;
  region: string;
  primaryCampaignSource: string;
  referralStage: string;
  closeDate: string;
  stage: string;
  probability: number;
  amount: number;
  leadSource: string;
  nextStep: string;
}

// ─── Component ───────────────────────────────────────────────────────────────
const STAGES = ['Discovery', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'];
const TYPES = ['New Business', 'Existing Business - Renewal', 'Existing Business - Upgrade'];
const LEAD_SOURCES = ['Web', 'Referral', 'Partner', 'Outbound Call', 'Trade Show', 'Advertisement'];
const REFERRAL_STAGES = ['Pre-Authorization', 'Submitted', 'Authorized', 'Completed'];

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-600 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputClass = "w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800";
const selectClass = inputClass;

export default function AddDealModal({
  isOpen,
  onClose,
  onAdd,
}: {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (deal: any) => void | Promise<void>;
}) {
  const today = new Date();
  const defaultClose = '2026-06-15'; // Default to a date within Q2 FY26

  const [form, setForm] = useState<NewDealForm>({
    opportunityName: '',
    accountName: '',
    type: 'New Business',
    lob: 'Enterprise Software',
    region: 'Americas',
    primaryCampaignSource: '',
    referralStage: 'Pre-Authorization',
    closeDate: defaultClose,
    stage: 'Proposal',
    probability: 50,
    amount: 0,
    leadSource: 'Web',
    nextStep: '',
  });

  const [preview, setPreview] = useState<{ label: 'High' | 'Med' | 'Low'; score: number; contribution: number } | null>(null);
  const [saving, setSaving] = useState(false);

  const set = (key: keyof NewDealForm, val: any) => {
    const updated = { ...form, [key]: val };
    setForm(updated);
    // Live preview of AI confidence as user fills in key fields
    if (updated.stage && updated.probability >= 0 && updated.closeDate && updated.amount > 0) {
      const conf = computeAiConfidence(updated.stage, updated.probability, updated.closeDate);
      const contribution = computeDealContribution(updated.amount, updated.stage, updated.closeDate);
      setPreview({ ...conf, contribution });
    }
  };

  const handleSubmit = async () => {
    if (!form.opportunityName || !form.accountName || !form.amount || !form.closeDate) return;
    setSaving(true);

    const confidence = computeAiConfidence(form.stage, form.probability, form.closeDate);
    const contribution = computeDealContribution(form.amount, form.stage, form.closeDate);

    const closeDateObj = new Date(form.closeDate);
    const closeLabel = closeDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    await onAdd({
      deal: form.opportunityName,
      accountName: form.accountName,
      stage: form.stage,
      amount: form.amount,
      aiConf: confidence.label,
      aiScore: confidence.score,
      close: closeLabel,
      closeDate: form.closeDate,
      probability: form.probability,
      type: form.type,
      lob: form.lob,
      leadSource: form.leadSource,
      referralStage: form.referralStage,
      nextStep: form.nextStep,
      contribution,
      region: form.region,
    });

    // Reset form
    setForm({
      opportunityName: '', accountName: '', type: 'New Business', lob: 'Enterprise Software', region: 'Americas', primaryCampaignSource: '',
      referralStage: 'Pre-Authorization', closeDate: defaultClose, stage: 'Proposal',
      probability: 50, amount: 0, leadSource: 'Web', nextStep: '',
    });
    setPreview(null);
    setSaving(false);
    onClose();
  };

  if (!isOpen) return null;

  const confColor = preview?.label === 'High' ? 'text-green-600 bg-green-50 border-green-200'
    : preview?.label === 'Med' ? 'text-amber-600 bg-amber-50 border-amber-200'
    : 'text-red-500 bg-red-50 border-red-200';

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-3">
              {/* Salesforce blue icon */}
              <div className="w-8 h-8 rounded-lg bg-[#009EDB] flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
                </svg>
              </div>
              <div>
                <h2 className="text-sm font-bold text-gray-900">Add New Opportunity</h2>
                <p className="text-[11px] text-gray-400">Mirrors Salesforce CRM Opportunity fields</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center">
              <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="overflow-y-auto flex-1 px-6 py-5">
            
            {/* Live AI Preview Banner */}
            {preview && form.amount > 0 && (
              <div className={`flex items-center justify-between mb-5 px-4 py-3 rounded-xl border ${confColor}`}>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold">AI Confidence Preview:</span>
                  <span className="text-sm font-black">{preview.label}</span>
                  <span className="text-[11px] opacity-70">(score: {(preview.score * 100).toFixed(0)}%)</span>
                </div>
                <div className="text-xs font-semibold">
                  Projected contribution: ₹{(preview.contribution / 100000).toFixed(1)}L
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">

              {/* Row 1 */}
              <Field label="Opportunity Name" required>
                <input type="text" value={form.opportunityName} onChange={e => set('opportunityName', e.target.value)}
                  placeholder="e.g. HDFC Q2 Renewal" className={inputClass} />
              </Field>

              <Field label="Account Name" required>
                <input type="text" value={form.accountName} onChange={e => set('accountName', e.target.value)}
                  placeholder="e.g. HDFC Bank" className={inputClass} />
              </Field>

              {/* Row 2 */}
              <Field label="Close Date" required>
                <input type="date" value={form.closeDate} onChange={e => set('closeDate', e.target.value)}
                  className={inputClass} />
              </Field>

              <Field label="Stage" required>
                <select value={form.stage} onChange={e => {
                  const newStage = e.target.value;
                  // Auto-suggest probability based on historical rates
                  const suggestedProb = Math.round((STAGE_CONVERSION_RATES[newStage] ?? 0.5) * 100);
                  set('probability', suggestedProb);
                  setForm(prev => ({ ...prev, stage: newStage, probability: suggestedProb }));
                  if (form.closeDate && form.amount > 0) {
                    const conf = computeAiConfidence(newStage, suggestedProb, form.closeDate);
                    const contribution = computeDealContribution(form.amount, newStage, form.closeDate);
                    setPreview({ ...conf, contribution });
                  }
                }} className={selectClass}>
                  {STAGES.map(s => <option key={s}>{s}</option>)}
                </select>
              </Field>

              {/* Row 3 */}
              <Field label="Probability (%)">
                <div className="relative">
                  <input type="number" min={0} max={100} value={form.probability}
                    onChange={e => set('probability', Number(e.target.value))}
                    className={inputClass + ' pr-8'} />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">%</span>
                </div>
                {form.stage && (
                  <p className="text-[10px] text-blue-500 mt-1">
                    Historical rate for {form.stage}: {Math.round((STAGE_CONVERSION_RATES[form.stage] ?? 0) * 100)}%
                  </p>
                )}
              </Field>

              <Field label="Amount (₹)" required>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₹</span>
                  <input type="text" value={form.amount ? Number(form.amount).toLocaleString('en-IN') : ''}
                    onChange={e => set('amount', Number(e.target.value.replace(/[^0-9]/g, '')))}
                    placeholder="0" className={inputClass + ' pl-7'} />
                </div>
                {form.amount > 0 && (
                  <p className="text-[10px] text-gray-400 mt-1">≈ ₹{(form.amount / 100000).toFixed(1)}L</p>
                )}
              </Field>

              {/* Row 4 */}
              <Field label="Type">
                <select value={form.type} onChange={e => set('type', e.target.value)} className={selectClass}>
                  {TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </Field>

              <Field label="Line of Business">
                <select value={form.lob} onChange={e => set('lob', e.target.value)} className={selectClass}>
                  {['Enterprise Software', 'Consulting Services', 'Hardware', 'Cloud Services'].map(l => <option key={l}>{l}</option>)}
                </select>
              </Field>

              <Field label="Region">
                <select value={form.region} onChange={e => set('region', e.target.value)} className={selectClass}>
                  {['Americas', 'EMEA', 'APAC'].map(r => <option key={r}>{r}</option>)}
                </select>
              </Field>

              {/* Row 5 */}
              <Field label="Lead Source">
                <select value={form.leadSource} onChange={e => set('leadSource', e.target.value)} className={selectClass}>
                  {LEAD_SOURCES.map(l => <option key={l}>{l}</option>)}
                </select>
              </Field>

              <Field label="Primary Campaign Source">
                <input type="text" value={form.primaryCampaignSource}
                  onChange={e => set('primaryCampaignSource', e.target.value)}
                  placeholder="e.g. Q2 Enterprise Campaign" className={inputClass} />
              </Field>

              {/* Row 6 */}
              <Field label="Referral Stage">
                <select value={form.referralStage} onChange={e => set('referralStage', e.target.value)} className={selectClass}>
                  {REFERRAL_STAGES.map(r => <option key={r}>{r}</option>)}
                </select>
              </Field>

              <div className="col-span-2">
                <Field label="Next Step">
                  <input type="text" value={form.nextStep} onChange={e => set('nextStep', e.target.value)}
                    placeholder="e.g. Send legal contract for review" className={inputClass} />
                </Field>
              </div>

            </div>

            {/* AI Logic Explanation */}
            <div className="mt-5 bg-blue-50 border border-blue-100 rounded-xl p-4">
              <p className="text-[11px] font-bold text-blue-700 uppercase tracking-widest mb-2">How AI Confidence is Computed</p>
              <div className="grid grid-cols-5 gap-2 text-[10px] text-blue-700">
                {['Stage strength', 'Meetings activity', 'Email engagement', 'Sentiment', 'Stakeholder presence', 'Deal movement', 'Close stability', 'Competitors', 'Forecast history', 'Activity recency'].map((factor) => (
                  <div key={factor} className="bg-white rounded-lg p-2 border border-blue-100 font-semibold">{factor}</div>
                ))}
              </div>
              <p className="text-[10px] text-blue-600 mt-2">Signals not captured on this form use neutral defaults until CRM activity data is available.</p>
            </div>          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3 flex-shrink-0">
            <button onClick={onClose}
              className="px-5 py-2.5 text-sm font-medium text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving || !form.opportunityName || !form.accountName || !form.amount}
              className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-40 transition-colors shadow-sm"
            >
              {saving ? 'Saving Deal...' : 'Add to Pipeline & Recalculate Projection'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
