import { useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './stores/authStore'
import { authAPI } from './lib/api'
import LoginPage from './pages/LoginPage'
import DashboardLayout from './layouts/DashboardLayout'
import BoardsPage from './pages/BoardsPage'
import BoardDetailPage from './pages/BoardDetailPage'
import DealDetailPage from './pages/DealDetailPage'
import AnalyticsPage from './pages/AnalyticsPage'
import CoachingPage from './pages/CoachingPage'
import ExportsPage from './pages/ExportsPage'
import SettingsPage from './pages/SettingsPage'

function App() {
  const { isAuthenticated, login, logout } = useAuthStore()
  const [isCheckingSession, setIsCheckingSession] = useState(isAuthenticated)

  useEffect(() => {
    if (!isAuthenticated) {
      setIsCheckingSession(false)
      return
    }

    authAPI
      .getSession()
      .then((response) => login(response.data))
      .catch(() => logout())
      .finally(() => setIsCheckingSession(false))
  }, [])

  if (isCheckingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Checking session...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <LoginPage />
  }

  return (
    <Routes>
      <Route path="/" element={<DashboardLayout />}>
        <Route index element={<Navigate to="/boards" replace />} />
        <Route path="boards" element={<BoardsPage />} />
        <Route path="boards/:boardId" element={<BoardDetailPage />} />
        <Route path="deals/:dealId" element={<DealDetailPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="coaching" element={<CoachingPage />} />
        <Route path="exports" element={<ExportsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  )
}

export default App
