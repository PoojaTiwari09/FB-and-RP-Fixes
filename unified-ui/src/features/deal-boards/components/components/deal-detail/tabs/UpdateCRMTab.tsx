'use client'
import { useState, useEffect } from 'react'
import type { CrmFields, StageOptions } from '@deal-boards/components/services/dealBoardsService'
import { Save, Check } from 'lucide-react'

interface Props {
  data: CrmFields | null
  stageOptions: StageOptions | null
  loading: boolean
  onSave: (fields: Partial<CrmFields>) => Promise<void>
}

export default function UpdateCRMTab({ data, stageOptions, loading, onSave }: Props) {
  const [form, setForm] = useState<CrmFields | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (data) setForm({ ...data })
  }, [data])

  if (loading) return <div style={{ padding: 24, color: '#9ca3af', fontSize: 13 }}>Loading CRM fields...</div>
  if (!form) return <div style={{ padding: 24, color: '#9ca3af', fontSize: 13 }}>No CRM data</div>

  const stages = stageOptions?.stages || ['Qualification', 'Discovery', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost']
  const forecasts = stageOptions?.forecastCategories || ['Pipeline', 'Best Case', 'Most Likely', 'Commit', 'Closed', 'Omitted']

  const handleSave = async () => {
    setSaving(true)
    await onSave(form)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 12px',
    border: '1px solid #e8eaed', borderRadius: 8,
    fontSize: 13, color: '#1a1d23', background: '#fff',
    outline: 'none',
  }
  const labelStyle: React.CSSProperties = {
    fontSize: 12, fontWeight: 600, color: '#6b7280',
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6, display: 'block',
  }

  return (
    <div style={{ padding: '16px 20px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

        <div>
          <label style={labelStyle}>Stage</label>
          <select value={form.stage} onChange={e => setForm({ ...form, stage: e.target.value })} style={inputStyle}>
            {stages.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>

        <div>
          <label style={labelStyle}>Amount ($)</label>
          <input
            type="number"
            value={form.amount}
            onChange={e => setForm({ ...form, amount: Number(e.target.value) })}
            style={inputStyle}
          />
        </div>

        <div>
          <label style={labelStyle}>Forecast Category</label>
          <select value={form.forecastCategory} onChange={e => setForm({ ...form, forecastCategory: e.target.value })} style={inputStyle}>
            {forecasts.map(f => <option key={f}>{f}</option>)}
          </select>
        </div>

        <div>
          <label style={labelStyle}>Next Step</label>
          <textarea
            value={form.nextStep}
            onChange={e => setForm({ ...form, nextStep: e.target.value })}
            rows={3}
            style={{ ...inputStyle, resize: 'vertical' }}
          />
        </div>

        <div>
          <label style={labelStyle}>Close Date</label>
          <input
            type="date"
            value={form.closeDate}
            onChange={e => setForm({ ...form, closeDate: e.target.value })}
            style={inputStyle}
          />
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '10px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: saved ? '#10b981' : '#4f46e5',
            color: '#fff', fontWeight: 600, fontSize: 14,
            transition: 'background 0.2s',
          }}
        >
          {saved ? <><Check size={15} /> Saved!</> : saving ? 'Saving...' : <><Save size={15} /> Save Changes</>}
        </button>
      </div>
    </div>
  )
}




