import { useState, useEffect } from 'react'
import { Outlet, Link, useLocation } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'
import { dealAPI } from '../lib/api'
import { 
  LayoutDashboard, 
  BarChart3, 
  Users, 
  FileDown, 
  Settings, 
  LogOut,
  Bell,
  Search
} from 'lucide-react'

export default function DashboardLayout() {
  const location = useLocation()
  const { user, logout } = useAuthStore()

  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [readIds, setReadIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('read_notification_ids')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem('read_notification_ids', JSON.stringify(readIds))
    } catch (e) {
      console.error(e)
    }
  }, [readIds])

  const getMocksForRole = (role?: string) => {
    if (role === 'USER') {
      return [
        {
          id: 'mock-1',
          title: 'New Coaching Assigned 🎯',
          message: 'Manager Jane Smith assigned a MEDDICC coaching action on deal "Acme Corp - Enterprise License".',
          time: '5 mins ago',
          unread: false,
          type: 'COACHING',
        },
        {
          id: 'mock-2',
          title: 'AI Warning Flagged ⚠️',
          message: 'Deal "BigBox Retailers" is single-threaded (no economic buyer engaged).',
          time: '2 hours ago',
          unread: false,
          type: 'WARNING',
        },
        {
          id: 'mock-3',
          title: 'Coaching Task Overdue 📅',
          message: '"Follow-up with economic buyer" on Stark Industries has passed its due date.',
          time: '1 day ago',
          unread: false,
          type: 'OVERDUE',
        },
      ]
    } else if (role === 'MANAGER') {
      return [
        {
          id: 'mock-1',
          title: 'Deal Risk Escalated 🚨',
          message: 'Sales Rep escalated "Stark Industries - R&D Contract" to High Risk with reason: Budget frozen.',
          time: '10 mins ago',
          unread: false,
          type: 'RISK',
        },
        {
          id: 'mock-2',
          title: 'Coaching Task Resolved ✅',
          message: 'Sales Rep user@example.com completed the coaching task: "Validate Champion influence".',
          time: '1 hour ago',
          unread: false,
          type: 'RESOLVED',
        },
        {
          id: 'mock-3',
          title: 'AI Alert: Score Drop 📉',
          message: 'Deal Stark Industries AI score dropped below 50 due to stalled activities.',
          time: '3 hours ago',
          unread: false,
          type: 'ALERT',
        },
      ]
    } else {
      return [
        {
          id: 'mock-1',
          title: 'HubSpot Sync Success 🔄',
          message: 'Full HubSpot pipeline sync completed successfully. 7,500 deals verified and updated.',
          time: '15 mins ago',
          unread: false,
          type: 'SYNC',
        },
        {
          id: 'mock-2',
          title: 'Governance Setting Enabled 🔒',
          message: 'Global MEDDICC playbook criteria locking policy active across all dashboards.',
          time: '4 hours ago',
          unread: false,
          type: 'POLICY',
        },
        {
          id: 'mock-3',
          title: 'System Health Check OK 🩺',
          message: 'AI Model server connection online. Pipeline diagnostics loaded successfully.',
          time: '1 day ago',
          unread: false,
          type: 'HEALTH',
        },
      ]
    }
  }

  const refreshNotifications = async (currentReadIds = readIds) => {
    if (!user) return
    try {
      const res = await dealAPI.getRecentNotifications()
      const backendNotifs = res.data.map((notif: any) => ({
        id: notif.id,
        title: 'Deal Update ✏️',
        message: notif.message,
        time: new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        unread: !currentReadIds.includes(notif.id),
        type: 'DEAL_UPDATE',
      }))

      const mocks = getMocksForRole(user.role)
      const combined = [...backendNotifs, ...mocks]
      
      const seen = new Set()
      const unique = combined.filter(n => {
        if (seen.has(n.id)) return false
        seen.add(n.id)
        return true
      })

      setNotifications(unique)
    } catch (error) {
      console.error('Failed to load notifications:', error)
    }
  }

  useEffect(() => {
    if (!user) return

    refreshNotifications()

    const interval = setInterval(() => {
      refreshNotifications()
    }, 15000)

    const handleDealUpdated = () => {
      refreshNotifications()
    }

    window.addEventListener('dealUpdated', handleDealUpdated)

    return () => {
      clearInterval(interval)
      window.removeEventListener('dealUpdated', handleDealUpdated)
    }
  }, [user, readIds])

  const handleMarkAllRead = () => {
    const unreadBackendIds = notifications
      .filter(n => n.unread && !n.id.startsWith('mock-'))
      .map(n => n.id)
    
    setReadIds(prev => {
      const next = [...prev, ...unreadBackendIds]
      refreshNotifications(next)
      return next
    })
    
    setNotifications(prev => prev.map(n => ({ ...n, unread: false })))
  }

  const handleMarkRead = (id: string) => {
    if (id.startsWith('mock-')) {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, unread: false } : n))
      return
    }
    setReadIds(prev => {
      const next = [...prev, id]
      refreshNotifications(next)
      return next
    })
  }

  const unreadCount = notifications.filter(n => n.unread).length

  const navigation = [
    { name: 'Boards', href: '/boards', icon: LayoutDashboard },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    ...(user?.role !== 'ADMIN' ? [{ name: 'Coaching', href: '/coaching', icon: Users }] : []),
    { name: 'Exports', href: '/exports', icon: FileDown },
    { name: 'Settings', href: '/settings', icon: Settings },
  ]

  const isActive = (path: string) => location.pathname.startsWith(path)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center h-16 px-6 border-b border-gray-200">
            <h1 className="text-xl font-bold text-primary-600">Deal Intelligence</h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                    isActive(item.href)
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-primary-700 font-semibold">
                    {user?.name?.charAt(0) || 'U'}
                  </span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                  <p className="text-xs text-gray-500">{user?.role}</p>
                </div>
              </div>
              <button
                onClick={logout}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="pl-64">
        {/* Top Bar */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between h-16 px-8">
            {/* Search */}
            <div className="flex-1 max-w-2xl">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search deals, boards, or contacts..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Notifications (Dynamic & Real-Time) */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 focus:outline-none transition-colors"
                title="Notifications"
              >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                )}
              </button>

              {showNotifications && (
                <>
                  <div 
                    className="fixed inset-0 z-20" 
                    onClick={() => setShowNotifications(false)}
                  />
                  <div className="absolute right-0 mt-2 w-96 bg-white border border-gray-200 rounded-2xl shadow-xl z-30 animate-fadeIn overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/50">
                      <h4 className="font-extrabold text-sm text-gray-900 flex items-center gap-1.5">
                        <Bell className="w-4 h-4 text-blue-600" />
                        Real-Time Alerts ({unreadCount} unread)
                      </h4>
                      {unreadCount > 0 && (
                        <button 
                          onClick={handleMarkAllRead}
                          className="text-xs font-bold text-blue-600 hover:text-blue-800"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>

                    <div className="divide-y divide-gray-50 max-h-[360px] overflow-y-auto pr-1">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-xs text-gray-400 italic">
                          No notifications to display.
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div 
                            key={notif.id}
                            onClick={() => handleMarkRead(notif.id)}
                            className={`p-4 hover:bg-gray-50/50 transition-colors cursor-pointer text-left ${
                              notif.unread ? 'bg-blue-50/10' : ''
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                                notif.unread ? 'bg-blue-500 animate-pulse' : 'bg-gray-300'
                              }`} />
                              <div className="flex-1 space-y-1">
                                <div className="flex items-center justify-between gap-2">
                                  <h5 className="font-bold text-xs text-gray-900">{notif.title}</h5>
                                  <span className="text-[10px] font-semibold text-gray-400 whitespace-nowrap">{notif.time}</span>
                                </div>
                                <p className="text-[11px] leading-relaxed text-gray-600 font-medium">{notif.message}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Page Content */}
        <main className="p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
