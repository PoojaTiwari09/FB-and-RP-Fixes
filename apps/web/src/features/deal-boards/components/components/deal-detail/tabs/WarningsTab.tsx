'use client'
import { useState } from 'react'
import type { Warning } from '@deal-boards/components/services/dealBoardsService'
import { AlertTriangle, CheckCircle, Zap, Check } from 'lucide-react'

interface Props {
  warnings: Warning[]
  loading: boolean
  onResolve: (warningId: string) => void
  onAction: (warningId: string) => void
}

const severityConfig = {
  HIGH: { color: '#ef4444', bg: '#fee2e2', label: 'HIGH' },
  MEDIUM: { color: '#f59e0b', bg: '#fef3c7', label: 'MED' },
  LOW: { color: '#3b82f6', bg: '#dbeafe', label: 'LOW' },
}

export default function WarningsTab({ warnings, loading, onResolve, onAction }: Props) {
  const [localResolved, setLocalResolved] = useState<Set<string>>(new Set())

  if (loading) return <div style={{ padding: 24, color: '#9ca3af', fontSize: 13 }}>Loading warnings...</div>

  const active = warnings.filter(w => w.status === 'active' && !localResolved.has(w.warningId))
  const resolved = warnings.filter(w => w.status === 'resolved' || localResolved.has(w.warningId))

  const handleResolve = (wid: string) => {
    setLocalResolved(prev => {
      const next = new Set(prev)
      next.add(wid)
      return next
    })
    onResolve(wid)
  }

  return (
    <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {active.length === 0 && (
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          padding: 32, color: '#10b981',
        }}>
          <CheckCircle size={36} />
          <p style={{ marginTop: 8, fontWeight: 600, fontSize: 14 }}>No active warnings</p>
          <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>This deal looks healthy</p>
        </div>
      )}

      {active.map(w => {
        const cfg = severityConfig[w.severity]
        return (
          <div key={w.warningId} style={{
            background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8,
            padding: '20px', display: 'flex', flexDirection: 'column'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontWeight: 600, fontSize: 14, color: '#1e293b' }}>
                {w.title}
              </span>
              <span style={{
                padding: '4px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700,
                background: cfg.bg, color: cfg.color,
              }}>
                {cfg.label}
              </span>
            </div>
            
            <p style={{ fontSize: 13, color: '#64748b', marginBottom: 20, lineHeight: 1.5, marginTop: 0 }}>
              {w.description}
            </p>
            
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                onClick={() => onAction(w.warningId)}
                style={{
                  padding: '8px 16px', borderRadius: 6, fontSize: 13, fontWeight: 600,
                  background: '#1d4ed8', color: '#fff', border: 'none', cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
              >
                Take action
              </button>
              <button
                onClick={() => handleResolve(w.warningId)}
                style={{
                  padding: '8px 16px', borderRadius: 6, fontSize: 13, fontWeight: 500,
                  background: '#fff', color: '#64748b', border: '1px solid #cbd5e1', cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
              >
                Mark as resolved
              </button>
            </div>
          </div>
        )
      })}

      {/* Persistent Note Banner */}
      {active.length > 0 && (
        <div style={{ background: '#fffbeb', border: '1px solid #fde047', borderRadius: 8, padding: '16px', marginTop: 8 }}>
          <p style={{ fontSize: 13, color: '#92400e', lineHeight: 1.5, margin: 0 }}>
            <span style={{ fontWeight: 700 }}>💡 For Sales Rep:</span> It should only display the next steps (read only) and actionable — he shouldn't be able to add any steps.
          </p>
        </div>
      )}

      {resolved.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <p style={{ fontSize: 12, color: '#9ca3af', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
            Resolved ({resolved.length})
          </p>
          {resolved.map(w => (
            <div key={w.warningId} style={{
              padding: '12px 16px', borderRadius: 8,
              border: '1px solid #f1f5f9', marginBottom: 8, background: '#fafbfc',
              display: 'flex', alignItems: 'center', gap: 8, opacity: 0.6,
            }}>
              <CheckCircle size={14} color="#10b981" />
              <span style={{ fontSize: 13, color: '#64748b', textDecoration: 'line-through' }}>{w.title}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}




