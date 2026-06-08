'use client'
import { useState } from 'react'
import { Bell, X, AlertTriangle, Info, Activity } from 'lucide-react'
import type { Notification } from '@deal-boards/components/services/dealBoardsService'

interface Props {
  notifications: Notification[]
  unreadCount: number
  onMarkAllRead: () => void
}

export default function NotificationsPanel({ notifications, unreadCount, onMarkAllRead }: Props) {
  const [open, setOpen] = useState(false)

  const getIcon = (type: string) => {
    if (type === 'warning') return <AlertTriangle size={14} color="#ef4444" />
    if (type === 'activity') return <Activity size={14} color="#6b7280" />
    return <Info size={14} color="#3b82f6" />
  }

  const formatTime = (ts: string) => {
    const d = new Date(ts)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    const hours = Math.floor(diff / 3600000)
    if (hours < 1) return 'Just now'
    if (hours < 24) return `${hours}h ago`
    return `${Math.floor(hours / 24)}d ago`
  }

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          position: 'relative', width: 36, height: 36,
          borderRadius: 8, border: '1px solid #e8eaed',
          background: '#fff', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#6b7280',
        }}
      >
        <Bell size={16} />
        {unreadCount > 0 && (
          <span style={{
            position: 'absolute', top: -4, right: -4,
            background: '#ef4444', color: '#fff',
            borderRadius: '50%', width: 16, height: 16,
            fontSize: 10, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>{unreadCount}</span>
        )}
      </button>

      {open && (
        <div className="fade-in" style={{
          position: 'absolute', right: 0, top: 44, width: 360,
          background: '#fff', border: '1px solid #e8eaed',
          borderRadius: 12, boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          zIndex: 100,
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '14px 16px', borderBottom: '1px solid #e8eaed',
          }}>
            <span style={{ fontWeight: 600, fontSize: 14 }}>Notifications</span>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              {unreadCount > 0 && (
                <button onClick={onMarkAllRead} style={{
                  fontSize: 12, color: '#4f46e5', cursor: 'pointer',
                  background: 'none', border: 'none',
                }}>Mark all as read</button>
              )}
              <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af' }}>
                <X size={16} />
              </button>
            </div>
          </div>
          <div style={{ maxHeight: 320, overflowY: 'auto' }}>
            {notifications.map(n => (
              <div key={n.id} style={{
                padding: '12px 16px',
                borderBottom: '1px solid #f3f4f6',
                background: n.read ? '#fff' : '#f8f9ff',
                display: 'flex', gap: 10, alignItems: 'flex-start',
              }}>
                <div style={{ marginTop: 2 }}>{getIcon(n.type)}</div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, color: '#1a1d23', lineHeight: 1.4 }}>{n.message}</p>
                  <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>{formatTime(n.timestamp)}</p>
                </div>
                {!n.read && (
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4f46e5', marginTop: 6, flexShrink: 0 }} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}




