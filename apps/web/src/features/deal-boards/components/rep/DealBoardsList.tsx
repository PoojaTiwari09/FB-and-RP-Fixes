'use client'
import { useState, useEffect } from 'react'
import { HelpCircle } from 'lucide-react'
import NotificationsPanel from '@deal-boards/components/components/NotificationsPanel'
import BoardCard from '@deal-boards/components/components/BoardCard'
import { getDealBoards, getNotifications, markAllNotificationsRead } from '@deal-boards/components/services/dealBoardsService'
import type { DealBoard, NotificationsResponse } from '@deal-boards/components/types/deal-boards.types'

export default function DealBoardsList() {
  const [boards, setBoards] = useState<DealBoard[]>([])
  const [notifs, setNotifs] = useState<NotificationsResponse>({ notifications: [], unreadCount: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getDealBoards(),
      getNotifications(),
    ]).then(([b, n]) => {
      setBoards(b.data)
      setNotifs(n.data)
      setLoading(false)
    })
  }, [])

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead()
    setNotifs(prev => ({
      ...prev,
      unreadCount: 0,
      notifications: prev.notifications.map(n => ({ ...n, read: true })),
    }))
  }

  return (
    <div style={{ flex: 1, minHeight: '100vh', background: '#f8f8fa' }}>
      {/* Top Bar */}
      <div style={{
        height: 52, background: '#fff', borderBottom: '1px solid #e8eaed',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 24px', position: 'sticky', top: 0, zIndex: 40,
      }}>
        <span style={{ fontWeight: 600, fontSize: 14, color: '#1a1d23' }}>
          Revenue Intelligence UI - Sales Rep
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4 }}>
            <HelpCircle size={18} />
          </button>
          <NotificationsPanel
            notifications={notifs.notifications}
            unreadCount={notifs.unreadCount}
            onMarkAllRead={handleMarkAllRead}
          />
          <button style={{
            padding: '7px 14px', borderRadius: 8,
            background: '#4f46e5', color: '#fff',
            border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
          }}>
            Sign up with email
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '32px 48px' }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 24, fontWeight: 600, color: '#1a1d23', marginBottom: 6 }}>Deal Boards</h1>
          <p style={{ fontSize: 14, color: '#9ca3af' }}>Manage and track your deals across different boards</p>
        </div>

        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {[1,2,3,4].map(i => (
              <div key={i} style={{ height: 160, background: '#fff', borderRadius: 12, border: '1px solid #e8eaed', opacity: 0.5 }} />
            ))}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            {boards.map(board => (
              <BoardCard key={board.boardId} board={board} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}


