import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Bell, AlertTriangle, Flag, ChevronDown, ChevronRight, ArrowUpDown } from 'lucide-react'
import type { Deal } from '@deal-boards/components/services/dealBoardsService'
import type { DealActivity } from '@deal-boards/components/types/deal-boards.types'

interface Props {
  deals: Deal[]
  groupBy: 'none' | 'stage' | 'rep'
  onDealClick: (deal: Deal) => void
}

const fmt = (n: number) => {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`
  return `$${n}`
}

const playbookColors: Record<string, { bg: string; text: string; bar: string }> = {
  green: { bg: '#d1fae5', text: '#065f46', bar: '#10b981' },
  orange: { bg: '#fef3c7', text: '#92400e', bar: '#f59e0b' },
  red: { bg: '#fee2e2', text: '#991b1b', bar: '#ef4444' },
}

const stageColors: Record<string, string> = {
  Qualification: '#eef2ff',
  Discovery: '#eef2ff',
  Proposal: '#eef2ff',
  Negotiation: '#eef2ff',
  'Closed Won': '#eef2ff',
  'Closed Lost': '#eef2ff',
}
const stageTextColors: Record<string, string> = {
  Qualification: '#4f46e5',
  Discovery: '#4f46e5',
  Proposal: '#4f46e5',
  Negotiation: '#4f46e5',
  'Closed Won': '#4f46e5',
  'Closed Lost': '#4f46e5',
}

type SortKey = 'dealName' | 'amount' | 'closeDate' | 'playbookScore' | 'stage'
type SortDir = 'asc' | 'desc'

function ActivityCell({ activities }: { activities?: DealActivity[] }) {
  const [show, setShow] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0 })
  const [mounted, setMounted] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleMouseEnter = () => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect()
      setCoords({ top: rect.top, left: rect.left + rect.width / 2 })
    }
    setShow(true)
  }

  return (
    <>
      <div 
        ref={ref}
        style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 16, cursor: 'pointer', width: 'fit-content' }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setShow(false)}
      >
        <div style={{ width: 4, height: '60%', background: '#10b981', borderRadius: 2 }} />
        <div style={{ width: 4, height: '100%', background: '#4f46e5', borderRadius: 2 }} />
        <div style={{ width: 4, height: '40%', background: '#8b5cf6', borderRadius: 2 }} />
      </div>

      {mounted && show && activities && activities.length > 0 && createPortal(
        <div style={{
          position: 'fixed', 
          bottom: window.innerHeight - coords.top + 10, 
          left: coords.left, 
          transform: 'translateX(-80%)',
          width: 420, background: '#fff', border: '1px solid #e8eaed',
          borderRadius: 8, boxShadow: '0 10px 30px rgba(0,0,0,0.15)', zIndex: 999999,
          padding: '20px',
          pointerEvents: 'none'
        }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: 14, color: '#1a1d23', fontWeight: 600 }}>Activity Over Time</h4>
          <p style={{ margin: '0 0 24px 0', fontSize: 12, color: '#6b7280' }}>
            Larger dots represent longer interactions. Hover to see details.
          </p>

          <div style={{ position: 'relative', paddingBottom: 40 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 40, padding: '0 10px' }}>
              {activities.map((act, i) => (
                <div key={i} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: '#9ca3af', marginBottom: 4 }}>{act.dateLabel}</div>
                  <div style={{ background: '#f3f4f6', borderRadius: 4, fontSize: 11, padding: '2px 8px', color: '#4b5563', display: 'inline-block' }}>{act.count}</div>
                </div>
              ))}
            </div>

            <div style={{ position: 'absolute', bottom: 10, left: 10, right: 10, height: 4, background: '#cbd5e1', borderRadius: 2 }} />
            
            <div style={{ position: 'absolute', bottom: 12, left: 10, right: 10, height: 0 }}>
              {activities.map(act => act.interactions.map(int => (
                <div
                  key={int.id}
                  style={{
                    position: 'absolute',
                    left: `${int.positionPercent}%`,
                    bottom: int.type === 'customer' ? 0 : (int.size > 14 ? 8 : -8), 
                    width: int.size,
                    height: int.size,
                    background: int.type === 'customer' ? '#ec4899' : '#8b5cf6',
                    borderRadius: '50%',
                    transform: 'translate(-50%, 50%)',
                    border: '2px solid #fff',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                />
              )))}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

function FlagCell({ flagCount, flagReason }: { flagCount: number, flagReason?: string }) {
  const [show, setShow] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0 })
  const [mounted, setMounted] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleMouseEnter = () => {
    if (ref.current) {
      const rect = ref.current.getBoundingClientRect()
      setCoords({ top: rect.top, left: rect.left + rect.width / 2 })
    }
    setShow(true)
  }

  return (
    <>
      <div 
        ref={ref}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setShow(false)}
        style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#ef4444', cursor: 'pointer', width: 'fit-content' }}
      >
        <Flag size={12} fill="#ef4444" color="#ef4444" />
      </div>

      {mounted && show && createPortal(
        <div style={{
          position: 'fixed', 
          top: coords.top - 10,
          left: coords.left, 
          transform: 'translate(-50%, -100%)',
          width: 260, background: '#fff', border: '1px solid #fca5a5',
          borderRadius: 10, boxShadow: '0 12px 32px rgba(0,0,0,0.12)', zIndex: 999999,
          padding: 0,
          pointerEvents: 'none',
          overflow: 'hidden'
        }}>
          <div style={{ background: '#fef2f2', padding: '10px 14px', borderBottom: '1px solid #fecaca', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Flag size={13} fill="#ef4444" color="#ef4444" />
            <span style={{ fontSize: 12, fontWeight: 700, color: '#991b1b' }}>Flagged for Attention</span>
          </div>
          <div style={{ padding: '12px 14px' }}>
            <p style={{ margin: 0, fontSize: 13, color: '#1e293b', lineHeight: 1.5, fontWeight: 500 }}>
              {flagReason || "This deal has been manually flagged for review."}
            </p>
          </div>
        </div>,
        document.body
      )}
    </>
  )
}

function DealRow({ deal, onClick }: { deal: Deal; onClick: () => void }) {
  const pc = playbookColors[deal.playbookColor] || playbookColors.orange
  const isOverdue = new Date(deal.closeDate) < new Date() && !deal.stage.startsWith('Closed')

  return (
    <tr
      onClick={onClick}
      style={{ cursor: 'pointer', borderBottom: '1px solid #f3f4f6' }}
      onMouseEnter={e => (e.currentTarget.style.background = '#f8f9ff')}
      onMouseLeave={e => (e.currentTarget.style.background = '#fff')}
    >
      {/* Deal Name */}
      <td style={{ padding: '8px 14px', minWidth: 220 }}>
        <div style={{ fontWeight: 600, fontSize: 13, color: '#4f46e5', marginBottom: 2 }}>{deal.dealName}</div>
        <div style={{ fontSize: 12, color: '#9ca3af' }}>{deal.company}</div>
      </td>
      {/* Stage */}
      <td style={{ padding: '8px 10px' }}>
        <span style={{
          padding: '3px 8px', borderRadius: 20, fontSize: 11, fontWeight: 600,
          background: stageColors[deal.stage] || '#f3f4f6',
          color: stageTextColors[deal.stage] || '#6b7280',
        }}>{deal.stage}</span>
      </td>
      {/* Amount */}
      <td style={{ padding: '14px 10px', fontWeight: 700, fontSize: 13, color: '#1a1d23' }}>
        {fmt(deal.amount)}
      </td>
      {/* Contacts */}
      <td style={{ padding: '14px 10px' }}>
        <span style={{ fontSize: 12, color: '#6b7280' }}>
          {deal.contacts} contact{deal.contacts !== 1 ? 's' : ''}
        </span>
      </td>
      {/* Notifications */}
      <td style={{ padding: '14px 10px' }}>
        {deal.notificationCount > 0 ? (
          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#4f46e5' }}>
            <Bell size={12} /> {deal.notificationCount}
          </span>
        ) : (
          <span style={{ color: '#d1d5db' }}>—</span>
        )}
      </td>
      {/* AI Warnings and Flags */}
      <td style={{ padding: '14px 10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {deal.aiWarningCount > 0 ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#d97706' }}>
              <AlertTriangle size={12} /> {deal.aiWarningCount}
            </span>
          ) : (
            <span style={{ color: '#d1d5db' }}>—</span>
          )}
          
          {deal.flagCount > 0 && (
            <FlagCell flagCount={deal.flagCount} flagReason={deal.flagReason} />
          )}
        </div>
      </td>
      {/* Activity */}
      <td style={{ padding: '14px 10px' }}>
        <ActivityCell activities={deal.activityOverTime} />
      </td>
      {/* Playbook Score */}
      <td style={{ padding: '14px 10px' }}>
        <div style={{ position: 'relative', width: 60, height: 20, background: '#e5e7eb', borderRadius: 10 }}>
          <div style={{
            position: 'absolute', left: 0, top: 0, bottom: 0,
            width: `${deal.playbookScore}%`,
            background: pc.bar,
            borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            minWidth: 28,
          }}>
            <span style={{ fontSize: 9, color: '#fff', fontWeight: 700 }}>{deal.playbookScore}%</span>
          </div>
        </div>
      </td>
      {/* AI Next Step */}
      <td style={{ padding: '14px 14px', maxWidth: 220 }}>
        <p style={{ fontSize: 12, color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {deal.aiSuggestedNextStep}
        </p>
      </td>
    </tr>
  )
}

function GroupSection({ label, deals, onDealClick }: { label: string; deals: Deal[]; onDealClick: (d: Deal) => void }) {
  const [collapsed, setCollapsed] = useState(false)
  const total = deals.reduce((s, d) => s + d.amount, 0)

  return (
    <>
      <tr
        onClick={() => setCollapsed(!collapsed)}
        style={{ background: '#f8f9fa', cursor: 'pointer', borderBottom: '1px solid #e8eaed' }}
      >
        <td colSpan={10} style={{ padding: '10px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {collapsed ? <ChevronRight size={14} color="#9ca3af" /> : <ChevronDown size={14} color="#9ca3af" />}
            <span style={{ fontWeight: 600, fontSize: 13, color: '#1a1d23' }}>{label}</span>
            <span style={{ fontSize: 12, color: '#9ca3af' }}>({deals.length} deals · {fmt(total)})</span>
          </div>
        </td>
      </tr>
      {!collapsed && deals.map(d => <DealRow key={d.dealId} deal={d} onClick={() => onDealClick(d)} />)}
    </>
  )
}

export default function DealTable({ deals, groupBy, onDealClick }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('dealName')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  const sorted = [...deals].sort((a, b) => {
    let cmp = 0
    if (sortKey === 'dealName') cmp = a.dealName.localeCompare(b.dealName)
    else if (sortKey === 'amount') cmp = a.amount - b.amount
    else if (sortKey === 'closeDate') cmp = a.closeDate.localeCompare(b.closeDate)
    else if (sortKey === 'playbookScore') cmp = a.playbookScore - b.playbookScore
    else if (sortKey === 'stage') cmp = a.stage.localeCompare(b.stage)
    return sortDir === 'asc' ? cmp : -cmp
  })

  const SortIcon = ({ k }: { k: SortKey }) => (
    <span style={{ display: 'inline-flex', flexDirection: 'column', marginLeft: 4, opacity: sortKey === k ? 1 : 0.3 }}>
      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ marginBottom: -2, color: sortKey === k && sortDir === 'asc' ? '#4f46e5' : '#9ca3af' }}><polyline points="18 15 12 9 6 15"></polyline></svg>
      <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" style={{ marginTop: -2, color: sortKey === k && sortDir === 'desc' ? '#4f46e5' : '#9ca3af' }}><polyline points="6 9 12 15 18 9"></polyline></svg>
    </span>
  )

  const thStyle = (k?: SortKey): React.CSSProperties => ({
    padding: '10px 10px', textAlign: 'left', fontSize: 11, fontWeight: 600,
    color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5,
    cursor: k ? 'pointer' : 'default',
    whiteSpace: 'nowrap',
    userSelect: 'none',
    borderBottom: '2px solid #e8eaed',
    background: '#fafbfc',
  })

  const grouped: Record<string, Deal[]> = {}
  if (groupBy !== 'none') {
    sorted.forEach(d => {
      const key = groupBy === 'stage' ? d.stage : d.assignedRep
      if (!grouped[key]) grouped[key] = []
      grouped[key].push(d)
    })
  }

  return (
    <div style={{
      background: '#fff', border: '1px solid #e8eaed', borderRadius: 10,
      overflow: 'hidden',
    }}>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={thStyle()}>DEAL NAME</th>
              <th style={thStyle()}>STAGE</th>
              <th style={thStyle()}>AMOUNT</th>
              <th style={thStyle()}>CONTACTS</th>
              <th style={thStyle()}>NOTIFICATIONS</th>
              <th style={thStyle()}>AI WARNINGS</th>
              <th style={thStyle()}>ACTIVITY</th>
              <th style={thStyle()}>PLAYBOOK</th>
              <th style={thStyle()}>AI SUGGESTED NEXT STEP</th>
            </tr>
          </thead>
          <tbody>
            {groupBy === 'none' ? (
              sorted.map(d => <DealRow key={d.dealId} deal={d} onClick={() => onDealClick(d)} />)
            ) : (
              Object.entries(grouped).map(([label, grpDeals]) => (
                <GroupSection key={label} label={label} deals={grpDeals} onDealClick={onDealClick} />
              ))
            )}
            {deals.length === 0 && (
              <tr>
                <td colSpan={10} style={{ textAlign: 'center', padding: 40, color: '#9ca3af', fontSize: 14 }}>
                  No deals match the current filters
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}




