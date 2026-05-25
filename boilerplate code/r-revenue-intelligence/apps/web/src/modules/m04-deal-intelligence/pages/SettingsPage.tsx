import { useEffect, useState } from 'react'
import { useAuthStore } from '../stores/authStore'
import {
  settingsAPI,
} from '../lib/api'
import {
  Settings,
  Bell,
  Lock,
  Globe,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Users,
} from 'lucide-react'

export default function SettingsPage() {
  const { user } = useAuthStore()
  const userRole = user?.role || 'USER'
  
  const [activeTab, setActiveTab] = useState<'global' | 'notifications' | 'coaching' | 'governance'>('global')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Settings State
  const [globalSettings, setGlobalSettings] = useState({
    defaultBoardView: 'list',
    timezone: 'America/New_York',
    dateFormat: 'MM/DD/YYYY',
    currencySymbol: '$',
    theme: 'light',
  })

  const [notificationSettings, setNotificationSettings] = useState({
    emailEnabled: true,
    inAppEnabled: true,
    notifyOnWarnings: true,
    notifyOnTaskAssignments: true,
    notifyOnComments: true,
    notifyOnRiskEscalations: true,
    dailyDigestEnabled: false,
    weeklySummaryEnabled: true,
  })

  const [coachingSettings, setCoachingSettings] = useState({
    autoAssignTasks: true,
    defaultTaskDueDays: 3,
    riskEscalationThreshold: 40,
    autoEscalateHighRisk: true,
    requireCommentOnEscalation: true,
    trackMeddpiccCompletion: true,
  })

  const [governanceSettings, setGovernanceSettings] = useState({
    lockBoardFilters: true,
    preventManualOverride: true,
    allowRepColumnReorder: false,
    defaultPlaybookTemplate: 'MEDDICC',
  })

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const allSettings = await settingsAPI.getAllSettings()
      
      if (allSettings.global) setGlobalSettings(allSettings.global)
      if (allSettings.notifications) setNotificationSettings(allSettings.notifications)
      if (allSettings.coaching) setCoachingSettings(allSettings.coaching)
      if (allSettings.governance) setGovernanceSettings(allSettings.governance)
    } catch (err: any) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 4000)
  }

  const handleSave = async (section: 'global' | 'notifications' | 'coaching' | 'governance') => {
    try {
      setSaving(true)
      setMessage(null)

      if (section === 'global') {
        await settingsAPI.saveGlobalSettings(globalSettings)
      } else if (section === 'notifications') {
        await settingsAPI.saveNotificationSettings(notificationSettings)
      } else if (section === 'coaching') {
        await settingsAPI.saveCoachingSettings(coachingSettings)
      } else if (section === 'governance') {
        await settingsAPI.saveViewSettings({
          boardId: 'global-governance',
          compactView: governanceSettings.lockBoardFilters,
          showCompletedTasks: governanceSettings.preventManualOverride,
        })
      }

      showMessage('success', `${section.charAt(0).toUpperCase() + section.slice(1)} settings updated successfully!`)
    } catch (err: any) {
      showMessage('error', err?.message || 'Failed to save settings.')
    } finally {
      setSaving(false)
    }
  }

  const handleReset = async () => {
    if (!confirm('Are you sure you want to reset all preferences to default factory settings?')) return
    try {
      setSaving(true)
      await settingsAPI.resetAllSettings()
      await loadSettings()
      showMessage('success', 'All preferences have been reset to default values.')
    } catch (err: any) {
      showMessage('error', err?.message || 'Failed to reset settings.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
          <p className="text-gray-500 font-medium">Loading preferences...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-2">
            <Settings className="w-8 h-8 text-blue-600" />
            Preferences & Settings
          </h1>
          <p className="text-gray-500 mt-1">
            Configure system interfaces, automated notifications, coaching models, and board permissions for your role.
          </p>
        </div>
      </div>

      {/* Message alert */}
      {message && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 ${
          message.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
          )}
          <span className="text-sm font-semibold">{message.text}</span>
        </div>
      )}

      {/* Settings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Navigation Sidebar */}
        <div className="md:col-span-1 space-y-1">
          <button
            onClick={() => setActiveTab('global')}
            className={`w-full flex items-center gap-2.5 px-4 py-3 text-sm font-bold rounded-xl transition-all ${
              activeTab === 'global'
                ? 'bg-blue-50 text-blue-700 shadow-sm border-l-4 border-blue-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Globe className="w-4 h-4" />
            Global Settings
          </button>

          <button
            onClick={() => setActiveTab('notifications')}
            className={`w-full flex items-center gap-2.5 px-4 py-3 text-sm font-bold rounded-xl transition-all ${
              activeTab === 'notifications'
                ? 'bg-blue-50 text-blue-700 shadow-sm border-l-4 border-blue-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Bell className="w-4 h-4" />
            Notifications
          </button>

          {/* Coaching - Manager & Admin only */}
          {(userRole === 'MANAGER' || userRole === 'ADMIN') && (
            <button
              onClick={() => setActiveTab('coaching')}
              className={`w-full flex items-center gap-2.5 px-4 py-3 text-sm font-bold rounded-xl transition-all ${
                activeTab === 'coaching'
                  ? 'bg-blue-50 text-blue-700 shadow-sm border-l-4 border-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Users className="w-4 h-4" />
              Coaching Rules
            </button>
          )}

          {/* Governance - Admin only */}
          {userRole === 'ADMIN' && (
            <button
              onClick={() => setActiveTab('governance')}
              className={`w-full flex items-center gap-2.5 px-4 py-3 text-sm font-bold rounded-xl transition-all ${
                activeTab === 'governance'
                  ? 'bg-blue-50 text-blue-700 shadow-sm border-l-4 border-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Lock className="w-4 h-4" />
              Governance & Wizard
            </button>
          )}

          <div className="pt-6">
            <button
              onClick={handleReset}
              disabled={saving}
              className="w-full flex items-center gap-2 px-4 py-2 text-xs font-semibold text-gray-500 hover:text-red-600 rounded-lg hover:bg-red-50 border border-gray-200 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset All Defaults
            </button>
          </div>
        </div>

        {/* Content Box */}
        <div className="md:col-span-3 bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          
          {/* ========================================== */}
          {/* GLOBAL PREFERENCES                         */}
          {/* ========================================== */}
          {activeTab === 'global' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">Global User preferences</h3>
                <p className="text-xs text-gray-400 mt-1">Configure layout look-and-feel and local parameters.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Default Board View</label>
                  <select
                    value={globalSettings.defaultBoardView}
                    onChange={(e) => setGlobalSettings({ ...globalSettings, defaultBoardView: e.target.value })}
                    className="w-full text-sm font-medium border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="list">Standard Grid Table (Figma Default)</option>
                    <option value="kanban">Forecast Kanban Boards</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Local Timezone</label>
                  <select
                    value={globalSettings.timezone}
                    onChange={(e) => setGlobalSettings({ ...globalSettings, timezone: e.target.value })}
                    className="w-full text-sm font-medium border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="America/New_York">Eastern Time (EST)</option>
                    <option value="America/Los_Angeles">Pacific Time (PST)</option>
                    <option value="Europe/London">London (GMT)</option>
                    <option value="Asia/Kolkata">India (IST)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Interface Theme</label>
                  <select
                    value={globalSettings.theme}
                    onChange={(e) => setGlobalSettings({ ...globalSettings, theme: e.target.value })}
                    className="w-full text-sm font-medium border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="light">Harmonious Sleek HSL Light</option>
                    <option value="dark">Vibrant Charcoal Slate Dark</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Currency Symbol</label>
                  <select
                    value={globalSettings.currencySymbol}
                    onChange={(e) => setGlobalSettings({ ...globalSettings, currencySymbol: e.target.value })}
                    className="w-full text-sm font-medium border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="$">$ (USD Dollar)</option>
                    <option value="€">€ (EUR Euro)</option>
                    <option value="£">£ (GBP British Pound)</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end">
                <button
                  onClick={() => handleSave('global')}
                  disabled={saving}
                  className="btn-primary"
                >
                  {saving ? 'Saving...' : 'Save Global Preferences'}
                </button>
              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* NOTIFICATION SETTINGS                      */}
          {/* ========================================== */}
          {activeTab === 'notifications' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">Automated Communications</h3>
                <p className="text-xs text-gray-400 mt-1">Configure email alerts and in-app pushes for signal updates.</p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors">
                  <div>
                    <h4 className="text-sm font-bold text-gray-800">Email Notifications</h4>
                    <p className="text-xs text-gray-500 mt-0.5">Receive alert logs directly into your inbox.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationSettings.emailEnabled}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, emailEnabled: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                  />
                </div>

                <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors">
                  <div>
                    <h4 className="text-sm font-bold text-gray-800">High-Severity AI Warnings</h4>
                    <p className="text-xs text-gray-500 mt-0.5">Notify instantly when Champion departs or activity gaps appear.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationSettings.notifyOnWarnings}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, notifyOnWarnings: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                  />
                </div>

                <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors">
                  <div>
                    <h4 className="text-sm font-bold text-gray-800">Task Assignments</h4>
                    <p className="text-xs text-gray-500 mt-0.5">Notify immediately when Manager assigns coaching next steps.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationSettings.notifyOnTaskAssignments}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, notifyOnTaskAssignments: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                  />
                </div>

                <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors">
                  <div>
                    <h4 className="text-sm font-bold text-gray-800">Weekly Forecast Summary</h4>
                    <p className="text-xs text-gray-500 mt-0.5">Receive a compiled Friday forecast report PDF.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notificationSettings.weeklySummaryEnabled}
                    onChange={(e) => setNotificationSettings({ ...notificationSettings, weeklySummaryEnabled: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end">
                <button
                  onClick={() => handleSave('notifications')}
                  disabled={saving}
                  className="btn-primary"
                >
                  {saving ? 'Saving...' : 'Save Notification Preferences'}
                </button>
              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* COACHING RULES                             */}
          {/* ========================================== */}
          {activeTab === 'coaching' && (userRole === 'MANAGER' || userRole === 'ADMIN') && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">Manager Coaching Guardrails</h3>
                <p className="text-xs text-gray-400 mt-1">Configure automated assignments and risk triggers.</p>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors">
                  <div>
                    <h4 className="text-sm font-bold text-gray-800">Auto-Assign Warning Actions</h4>
                    <p className="text-xs text-gray-500 mt-0.5">Generate follow-up tasks in Engage list on critical warning triggers.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={coachingSettings.autoAssignTasks}
                    onChange={(e) => setCoachingSettings({ ...coachingSettings, autoAssignTasks: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                  />
                </div>

                <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors">
                  <div>
                    <h4 className="text-sm font-bold text-gray-800">Auto-Escalate to High Risk</h4>
                    <p className="text-xs text-gray-500 mt-0.5">Visually flag deals across all shared boards when score drops below threshold.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={coachingSettings.autoEscalateHighRisk}
                    onChange={(e) => setCoachingSettings({ ...coachingSettings, autoEscalateHighRisk: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">High Risk Threshold (AI Score)</label>
                    <input
                      type="number"
                      value={coachingSettings.riskEscalationThreshold}
                      onChange={(e) => setCoachingSettings({ ...coachingSettings, riskEscalationThreshold: Number(e.target.value) })}
                      className="w-full text-sm font-medium border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Default Task Due Date Offset</label>
                    <select
                      value={coachingSettings.defaultTaskDueDays}
                      onChange={(e) => setCoachingSettings({ ...coachingSettings, defaultTaskDueDays: Number(e.target.value) })}
                      className="w-full text-sm font-medium border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={1}>1 Day (Urgent)</option>
                      <option value={3}>3 Days (Standard)</option>
                      <option value={7}>7 Days (Qualification buffer)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end">
                <button
                  onClick={() => handleSave('coaching')}
                  disabled={saving}
                  className="btn-primary"
                >
                  {saving ? 'Saving...' : 'Save Coaching Guardrails'}
                </button>
              </div>
            </div>
          )}

          {/* ========================================== */}
          {/* GOVERNANCE & WIZARD                        */}
          {/* ========================================== */}
          {activeTab === 'governance' && userRole === 'ADMIN' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3">Admin Deal Board Governance</h3>
                <p className="text-xs text-gray-400 mt-1">Manage deal board parameters and locking logic (Story DB-031).</p>
              </div>

              <div className="space-y-5">
                <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors">
                  <div>
                    <h4 className="text-sm font-bold text-gray-800">Lock Deal Board Filters</h4>
                    <p className="text-xs text-gray-500 mt-0.5">Enforce filter-only memberships. Viewers cannot add/remove custom deals manually.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={governanceSettings.lockBoardFilters}
                    onChange={(e) => setGovernanceSettings({ ...governanceSettings, lockBoardFilters: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                  />
                </div>

                <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors">
                  <div>
                    <h4 className="text-sm font-bold text-gray-800">Prevent Deal Selection Overrides</h4>
                    <p className="text-xs text-gray-500 mt-0.5">Ensure deals exit/enter automated boards strictly via CRM attributes matching filters.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={governanceSettings.preventManualOverride}
                    onChange={(e) => setGovernanceSettings({ ...governanceSettings, preventManualOverride: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                  />
                </div>

                <div className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-xl transition-colors">
                  <div>
                    <h4 className="text-sm font-bold text-gray-800">Allow Rep-Level Column Reordering</h4>
                    <p className="text-xs text-gray-500 mt-0.5">Enable reps to customize column sequence without adding/removing columns (Story DB-031).</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={governanceSettings.allowRepColumnReorder}
                    onChange={(e) => setGovernanceSettings({ ...governanceSettings, allowRepColumnReorder: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">Default Playbook Template</label>
                  <select
                    value={governanceSettings.defaultPlaybookTemplate}
                    onChange={(e) => setGovernanceSettings({ ...governanceSettings, defaultPlaybookTemplate: e.target.value })}
                    className="w-full text-sm font-medium border border-gray-300 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="MEDDICC">MEDDICC Qualification Checklist (Recommended)</option>
                    <option value="BANT">BANT Checklist</option>
                  </select>
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-2.5 text-xs text-blue-800">
                <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <span><strong>RevOps Wizard Info:</strong> New deal boards created using the step-by-step wizard automatically default to these compliance rules.</span>
              </div>

              <div className="pt-4 border-t border-gray-100 flex justify-end">
                <button
                  onClick={() => handleSave('governance')}
                  disabled={saving}
                  className="btn-primary"
                >
                  {saving ? 'Saving...' : 'Apply Governance Lock'}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
