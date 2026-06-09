'use client'
import { useRouter } from 'next/navigation'
import { BarChart2, Edit2, Eye, MoreVertical } from 'lucide-react'
import type { DealBoard } from '@deal-boards/components/services/dealBoardsService'

interface Props { board: DealBoard }

export default function BoardCard({ board }: Props) {
  const router = useRouter()

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    const pad = (n: number) => n.toString().padStart(2, '0')
    const dateStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
    const timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
    return `${dateStr} ${timeStr}`
  }

  return (
    <div
      onClick={() => router.push(`/deal-boards/${board.boardId}`)}
      style={{
        background: '#ffffff',
        border: '1px solid #e8eaed',
        borderRadius: 12,
        padding: '24px 24px',
        cursor: 'pointer',
        transition: 'box-shadow 0.15s, border-color 0.15s',
        position: 'relative',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)';
        (e.currentTarget as HTMLDivElement).style.borderColor = '#4f46e5'
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.boxShadow = 'none';
        (e.currentTarget as HTMLDivElement).style.borderColor = '#e8eaed'
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: '#f0f4ff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <BarChart2 size={18} color="#4f46e5" />
          </div>
          <div>
            <h3 style={{ fontWeight: 600, fontSize: 15, color: '#1a1d23' }}>{board.name}</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
              {board.canEdit ? (
                <><Edit2 size={11} color="#6b7280" />
                <span style={{ fontSize: 12, color: '#6b7280' }}>Edit</span></>
              ) : (
                <><Eye size={11} color="#6b7280" />
                <span style={{ fontSize: 12, color: '#6b7280' }}>View</span></>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={e => e.stopPropagation()}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4 }}
        >
          <MoreVertical size={16} />
        </button>
      </div>

      {/* Description */}
      <p style={{ fontSize: 13, color: '#6b7280', marginBottom: 16 }}>{board.description}</p>

      {/* Divider */}
      <div style={{ borderTop: '1px solid #f3f4f6', paddingTop: 14 }}>
        <p style={{ fontSize: 12, color: '#6b7280' }}>
          Owner: <span style={{ color: '#1a1d23' }}>{board.owner}</span>
        </p>
        <p style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
          Last modified: {formatDate(board.lastModified)}
        </p>
      </div>
    </div>
  )
}





