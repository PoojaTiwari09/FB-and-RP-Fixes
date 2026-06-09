'use client'
import { useState, useRef, useEffect } from 'react'
import type { PlaybookData, PlaybookCriterion } from '@deal-boards/components/services/dealBoardsService'
import { ChevronDown, Lightbulb } from 'lucide-react'

interface Props {
  data: PlaybookData | null
  loading: boolean
  onUpdateCriterion: (criterionId: string, status: 'Completed' | 'Pending' | 'N/A') => void
}

const statusStyles: Record<string, { color: string; bg: string; border: string }> = {
  Completed: { color: '#059669', bg: '#d1fae5', border: '#6ee7b7' },
  Pending:   { color: '#64748b', bg: '#f1f5f9', border: '#cbd5e1' },
  'N/A':     { color: '#9ca3af', bg: '#f9fafb', border: '#e5e7eb' },
}

function StatusDropdown({ current, onChange }: { current: string; onChange: (s: 'Completed' | 'Pending' | 'N/A') => void }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const cfg = statusStyles[current] || statusStyles['Pending']

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '5px 10px', borderRadius: 6,
          background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
          fontSize: 12, fontWeight: 600, cursor: 'pointer',
          transition: 'all 0.15s',
        }}
      >
        {current}
        <ChevronDown size={13} />
      </button>

      {open && (
        <div style={{
          position: 'absolute', right: 0, top: '100%', marginTop: 4,
          background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8,
          boxShadow: '0 8px 24px rgba(0,0,0,0.1)', zIndex: 10,
          minWidth: 130, overflow: 'hidden',
        }}>
          {(['Completed', 'Pending'] as const).map(s => {
            const sc = statusStyles[s]
            return (
              <button
                key={s}
                onClick={() => { onChange(s); setOpen(false) }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  width: '100%', padding: '9px 12px', border: 'none',
                  background: current === s ? '#f8fafc' : '#fff',
                  color: sc.color, fontSize: 12, fontWeight: current === s ? 700 : 500,
                  cursor: 'pointer', textAlign: 'left',
                }}
              >
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: sc.color, flexShrink: 0 }} />
                {s}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function CriterionCard({ c, onUpdate }: { c: PlaybookCriterion; onUpdate: (status: 'Completed' | 'Pending' | 'N/A') => void }) {
  const cfg = statusStyles[c.status] || statusStyles['Pending']
  const labelColor = c.status === 'Completed' ? '#059669' : c.status === 'Pending' ? '#64748b' : '#9ca3af'

  return (
    <div style={{
      background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10,
      padding: '20px', display: 'flex', flexDirection: 'column', gap: 12,
    }}>
      {/* Header: criterion name + dropdown */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: labelColor, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          {c.criterionName}
        </span>
        <StatusDropdown current={c.status} onChange={onUpdate} />
      </div>

      {/* Question */}
      <p style={{ fontSize: 13, color: '#1e293b', fontWeight: 500, margin: 0, lineHeight: 1.5 }}>
        {c.question}
      </p>

      {/* Notes */}
      {c.notes && (
        <div style={{ background: '#f8fafc', borderRadius: 6, padding: '10px 12px', borderLeft: '3px solid #e2e8f0' }}>
          <p style={{ fontSize: 13, color: '#64748b', margin: 0, lineHeight: 1.5 }}>{c.notes}</p>
        </div>
      )}

      {/* AI Suggested Note */}
      {c.aiSuggestedNote && (
        <div style={{ background: '#eff6ff', borderRadius: 8, padding: '10px 12px', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <Lightbulb size={14} color="#f59e0b" style={{ marginTop: 2, flexShrink: 0 }} />
          <div>
            <span style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b' }}>AI Suggested Note</span>
            <p style={{ fontSize: 12, color: '#3b82f6', margin: '4px 0 0', lineHeight: 1.5 }}>{c.aiSuggestedNote}</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default function PlaybookTab({ data, loading, onUpdateCriterion }: Props) {
  if (loading) return <div style={{ padding: 24, color: '#9ca3af', fontSize: 13 }}>Loading playbook...</div>
  if (!data) return <div style={{ padding: 24, color: '#9ca3af', fontSize: 13 }}>No playbook data</div>

  const barColor = data.scorePercentage >= 80 ? '#10b981' : data.scorePercentage >= 50 ? '#3b82f6' : '#ef4444'

  return (
    <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Score Header */}
      <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: '#1e293b' }}>{data.framework}</span>
          <span style={{ fontSize: 13, color: '#64748b' }}>{data.completedCount} of {data.totalCount} complete</span>
        </div>
        <div style={{ height: 8, background: '#e2e8f0', borderRadius: 4, marginBottom: 10 }}>
          <div style={{ height: '100%', width: `${data.scorePercentage}%`, background: barColor, borderRadius: 4, transition: 'width 0.5s' }} />
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: 16, fontWeight: 800, color: '#1e293b' }}>{data.scorePercentage}%</span>
          <span style={{ fontSize: 13, color: '#64748b', marginLeft: 4 }}>Score</span>
        </div>
      </div>

      {/* Criterion Cards */}
      {data.criteria.map(c => (
        <CriterionCard key={c.criterionId} c={c} onUpdate={s => onUpdateCriterion(c.criterionId, s)} />
      ))}
    </div>
  )
}
