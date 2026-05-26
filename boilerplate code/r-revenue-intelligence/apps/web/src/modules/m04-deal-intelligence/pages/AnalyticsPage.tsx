import { useEffect, useState } from 'react'
import { useAuthStore } from '../stores/authStore'
import {
  analyticsAPI,
  exportAPI,
  dealAPI,
  taskAPI,
} from '../lib/api'
import {
  Users,
  AlertTriangle,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  Download,
  BarChart2,
  ShieldAlert,
  Award,
  ChevronRight,
  Loader2,
  Sparkles,
  CheckCircle2,
  Send,
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

const COLORS = ['#2563eb', '#3b82f6', '#60a5fa', '#93c5fd']
const RISK_COLORS = ['#ef4444', '#f59e0b', '#10b981']

const QUICK_COACHING_SUGGESTIONS = [
  'Confirm buying process with the Economic Buyer',
  'Validate Champion alignment and check for single-threading gaps',
  'Schedule follow-up call to review legal timeline & contract drafts',
  'Perform full MEDDICC checklist review for this deal',
  'Coordinate technical validation meeting with implementation stakeholders',
  'Validate actual budget availability and procurement approval rules',
]

export default function AnalyticsPage() {
  const { user } = useAuthStore()
  const userRole = user?.role || 'USER'
  
  const [aeData, setAeData] = useState<any>(null)
  const [managerData, setManagerData] = useState<any>(null)
  const [execData, setExecData] = useState<any>(null)
  
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [exportFormat, setExportFormat] = useState<'CSV' | 'PDF'>('PDF')
  const [exporting, setExporting] = useState(false)

  // Manager Coaching Assignment States
  const [allDeals, setAllDeals] = useState<any[]>([])
  const [selectedRepId, setSelectedRepId] = useState<string>('')
  const [selectedDealId, setSelectedDealId] = useState<string>('')
  const [coachingTitle, setCoachingTitle] = useState<string>('')
  const [coachingDescription, setCoachingDescription] = useState<string>('')
  const [coachingPriority, setCoachingPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('HIGH')
  const [coachingDueDate, setCoachingDueDate] = useState<string>('')
  const [assigningCoaching, setAssigningCoaching] = useState(false)
  const [coachingMessage, setCoachingMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    loadRoleData()
  }, [userRole])

  const loadRoleData = async () => {
    try {
      setLoading(true)
      setError(null)
      if (userRole === 'USER') {
        const data = await analyticsAPI.getAEAnalytics()
        setAeData(data)
      } else if (userRole === 'MANAGER') {
        const data = await analyticsAPI.getManagerAnalytics()
        setManagerData(data)
        // Load all active deals to filter by rep for manager coaching assignments
        const dealsRes = await dealAPI.getDeals({ limit: 1000 })
        const fetchedDeals = dealsRes.data?.deals || dealsRes.data?.items || (Array.isArray(dealsRes.data) ? dealsRes.data : [])
        setAllDeals(fetchedDeals)
      } else if (userRole === 'ADMIN') {
        const data = await analyticsAPI.getExecutiveAnalytics()
        setExecData(data)
      }
    } catch (err: any) {
      console.error(err)
      setError(err?.message || 'Failed to fetch analytics data')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (val: number) => {
    if (val >= 1000000) return `$${(val / 1000000).toFixed(2)}M`
    if (val >= 1000) return `$${(val / 1000).toFixed(0)}K`
    return `$${val}`
  }

  // Handle various exports
  const handleExport = async (type: 'FORECAST' | 'RISK' | 'DIAGNOSTICS' | 'ANALYTICS') => {
    try {
      setExporting(true)
      if (type === 'FORECAST') {
        await exportAPI.exportForecastSummary(exportFormat)
      } else if (type === 'RISK') {
        await exportAPI.exportTopRiskDeals('CSV')
      } else if (type === 'DIAGNOSTICS') {
        await exportAPI.exportTeamDiagnostics('CSV')
      } else if (type === 'ANALYTICS') {
        await exportAPI.exportAnalyticsReport('PDF')
      }
    } catch (err: any) {
      alert('Export failed: ' + (err?.message || err))
    } finally {
      setExporting(false)
    }
  }

  // Filter deals owned by the selected rep reporting under this manager (DB-022/DB-025)
  const repDeals = allDeals.filter(deal => deal.ownerId === selectedRepId)
  const selectedRep = managerData?.teamDiagnostics?.find((r: any) => r.repId === selectedRepId)
  const selectedDeal = repDeals.find(deal => deal.id === selectedDealId)

  // Submit dynamic coaching task linked to a particular deal owned by a team member
  const handleAssignCoaching = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedRepId || !selectedDealId || !coachingTitle.trim()) {
      setCoachingMessage({ type: 'error', text: 'Please fill out all required fields.' })
      return
    }

    try {
      setAssigningCoaching(true)
      setCoachingMessage(null)

      // Post the assigned task to the selected particular deal
      await taskAPI.createTask(selectedDealId, {
        title: coachingTitle.trim(),
        description: coachingDescription.trim(),
        priority: coachingPriority,
        assigneeId: selectedRepId,
        assigneeName: selectedRep?.repName || 'Assigned Rep',
        dueDate: coachingDueDate || undefined,
        source: 'MANAGER_ASSIGNED',
      })

      setCoachingMessage({
        type: 'success',
        text: `Coaching task assigned successfully to ${selectedRep?.repName} for deal "${selectedDeal?.name}"!`,
      })

      // Increment local UI task count for quick update
      if (managerData?.coachingActivity) {
        setManagerData({
          ...managerData,
          coachingActivity: {
            ...managerData.coachingActivity,
            tasksAssigned: managerData.coachingActivity.tasksAssigned + 1,
          }
        })
      }

      // Reset form
      setCoachingTitle('')
      setCoachingDescription('')
      setCoachingDueDate('')
      setSelectedDealId('')
    } catch (err: any) {
      console.error(err)
      setCoachingMessage({
        type: 'error',
        text: err?.message || 'Failed to assign coaching task.',
      })
    } finally {
      setAssigningCoaching(false)
    }
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-blue-600 to-indigo-700 p-6 rounded-2xl shadow-lg text-white">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <BarChart2 className="w-8 h-8" />
            {userRole === 'USER' ? 'My Pipeline Analytics' : userRole === 'MANAGER' ? 'Team Performance Analytics' : 'Executive Forecast Analytics'}
          </h1>
          <p className="text-blue-100 mt-1">
            Real-time interactive intelligence & pipeline metrics for your role as a {userRole === 'USER' ? 'Sales Rep' : userRole === 'MANAGER' ? 'Sales Manager' : 'CRO / Executive'}
          </p>
        </div>
      </div>

      {/* Main loading / error wrapper */}
      {loading ? (
        <div className="min-h-[400px] flex items-center justify-center bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            <p className="text-gray-500 font-medium animate-pulse">Retrieving deal metrics...</p>
          </div>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 text-red-700 rounded-xl border border-red-100 flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 flex-shrink-0 text-red-500" />
          <div>
            <h4 className="font-bold">Error loading analytics</h4>
            <p className="text-sm text-red-600 mt-0.5">{error}</p>
          </div>
        </div>
      ) : (
        <>
          {/* ============================================================== */}
          {/* ACCOUNT EXECUTIVE (AE) VIEW                                    */}
          {/* ============================================================== */}
          {userRole === 'USER' && aeData && (
            <div className="space-y-6 animate-fadeIn">
              {/* Summary KPIs */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="card bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Pipeline</p>
                    <h3 className="text-3xl font-extrabold text-gray-900 mt-1">{formatCurrency(aeData.totalPipelineValue)}</h3>
                  </div>
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                    <DollarSign className="w-6 h-6" />
                  </div>
                </div>

                <div className="card bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">My Active Deals</p>
                    <h3 className="text-3xl font-extrabold text-gray-900 mt-1">{aeData.totalDealCount}</h3>
                  </div>
                  <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                    <Award className="w-6 h-6" />
                  </div>
                </div>

                <div className="card bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Avg AI Deal Score</p>
                    <h3 className="text-3xl font-extrabold text-gray-900 mt-1">{aeData.averageAiScore}</h3>
                  </div>
                  <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                    <Sparkles className="w-6 h-6" />
                  </div>
                </div>

                <div className="card bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between hover:shadow-md transition-shadow">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">At Risk Deals</p>
                    <h3 className="text-3xl font-extrabold text-red-600 mt-1">{aeData.atRiskDealCount}</h3>
                  </div>
                  <div className="p-3 bg-red-50 text-red-600 rounded-lg">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* Charts Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Pipeline breakdown chart */}
                <div className="lg:col-span-2 card bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Pipeline Value by Forecast Category</h3>
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={aeData.tabRollups}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="tabName" stroke="#6b7280" fontSize={12} />
                        <YAxis tickFormatter={(v) => `$${v / 1000}k`} stroke="#6b7280" fontSize={12} />
                        <RechartsTooltip formatter={(v: any) => formatCurrency(v)} />
                        <Bar dataKey="totalValue" radius={[4, 4, 0, 0]}>
                          {aeData.tabRollups.map((_: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* This week's activities count */}
                <div className="card bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">This Week's Activity</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center gap-3 text-blue-700">
                          <Phone className="w-5 h-5" />
                          <span className="font-semibold text-sm">Calls</span>
                        </div>
                        <span className="text-xl font-bold text-blue-900">{aeData.activitySummary?.callsThisWeek || 0}</span>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                        <div className="flex items-center gap-3 text-purple-700">
                          <Mail className="w-5 h-5" />
                          <span className="font-semibold text-sm">Emails Sent</span>
                        </div>
                        <span className="text-xl font-bold text-purple-900">{aeData.activitySummary?.emailsThisWeek || 0}</span>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center gap-3 text-green-700">
                          <Calendar className="w-5 h-5" />
                          <span className="font-semibold text-sm">Meetings Hosted</span>
                        </div>
                        <span className="text-xl font-bold text-green-900">{aeData.activitySummary?.meetingsThisWeek || 0}</span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-4 mt-4">
                    <p className="text-xs text-gray-500 italic">Engagement dots update automatically as activity is registered.</p>
                  </div>
                </div>
              </div>

              {/* Tasks Progress & Top Warnings Feed */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Engage tasks progress */}
                <div className="card bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Next Steps & Tasks Status</h3>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-xs font-semibold text-gray-500">Total Tasks</p>
                      <h4 className="text-2xl font-extrabold text-gray-900 mt-1">{aeData.nextStepsSummary?.totalTasks || 0}</h4>
                    </div>
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-xs font-semibold text-green-700">Completed</p>
                      <h4 className="text-2xl font-extrabold text-green-800 mt-1">{aeData.nextStepsSummary?.completedTasks || 0}</h4>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg">
                      <p className="text-xs font-semibold text-red-700">Overdue</p>
                      <h4 className="text-2xl font-extrabold text-red-800 mt-1">{aeData.nextStepsSummary?.overdueTasks || 0}</h4>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-6">
                    <div className="flex justify-between text-xs text-gray-500 font-semibold mb-2">
                      <span>Completion Ratio</span>
                      <span>
                        {aeData.nextStepsSummary?.totalTasks > 0
                          ? Math.round((aeData.nextStepsSummary.completedTasks / aeData.nextStepsSummary.totalTasks) * 100)
                          : 0}
                        %
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-3">
                      <div
                        className="bg-green-600 h-3 rounded-full transition-all duration-500"
                        style={{
                          width: `${
                            aeData.nextStepsSummary?.totalTasks > 0
                              ? (aeData.nextStepsSummary.completedTasks / aeData.nextStepsSummary.totalTasks) * 100
                              : 0
                          }%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Warnings list feed */}
                <div className="card bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">⚠️ Top High-Severity Warning Signals</h3>
                  {aeData.topWarnings?.length > 0 ? (
                    <ul className="space-y-3">
                      {aeData.topWarnings.map((warning: string, i: number) => (
                        <li key={i} className="flex gap-3 text-sm p-3 bg-amber-50 text-amber-900 rounded-lg border border-amber-100">
                          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                          <span className="font-medium">{warning}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-center py-6 text-gray-500">
                      <p className="font-semibold text-green-600">🎉 No warning flags found!</p>
                      <p className="text-xs mt-1 text-gray-400">All direct deals are currently healthy.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* SALES MANAGER VIEW                                             */}
          {/* ============================================================== */}
          {userRole === 'MANAGER' && managerData && (
            <div className="space-y-6 animate-fadeIn">
              {/* Summary KPIs */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="card bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Team Pipeline</p>
                    <h3 className="text-3xl font-extrabold text-gray-900 mt-1">{formatCurrency(managerData.teamPipelineValue)}</h3>
                  </div>
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                    <Users className="w-6 h-6" />
                  </div>
                </div>

                <div className="card bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Team Deals Count</p>
                    <h3 className="text-3xl font-extrabold text-gray-900 mt-1">{managerData.teamDealCount}</h3>
                  </div>
                  <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                    <Award className="w-6 h-6" />
                  </div>
                </div>

                <div className="card bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Team Avg AI Score</p>
                    <h3 className="text-3xl font-extrabold text-gray-900 mt-1">{managerData.teamAverageAiScore}</h3>
                  </div>
                  <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                    <Sparkles className="w-6 h-6" />
                  </div>
                </div>

                <div className="card bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Deals At Risk</p>
                    <h3 className="text-3xl font-extrabold text-red-600 mt-1">{managerData.totalAtRiskDeals}</h3>
                  </div>
                  <div className="p-3 bg-red-50 text-red-600 rounded-lg">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                </div>
              </div>

              {/* Diagnostic table & Coaching logs */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Diagnostics rep details */}
                <div className="lg:col-span-2 card bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900">Reps Diagnostic Performance</h3>
                    <button
                      onClick={() => handleExport('DIAGNOSTICS')}
                      disabled={exporting}
                      className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-bold border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Export Diagnostics CSV
                    </button>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 text-gray-400 font-semibold pb-3">
                          <th className="pb-3">Rep Name</th>
                          <th className="pb-3 text-center">Deals</th>
                          <th className="pb-3 text-right">Value</th>
                          <th className="pb-3 text-center">Avg AI Score</th>
                          <th className="pb-3 text-center">At Risk</th>
                          <th className="pb-3 text-center">MEDDICC completion</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 font-medium">
                        {managerData.teamDiagnostics?.map((diag: any, idx: number) => (
                          <tr key={idx} className="hover:bg-gray-50/50">
                            <td className="py-3 font-semibold text-gray-900">{diag.repName}</td>
                            <td className="py-3 text-center text-gray-500">{diag.dealCount}</td>
                            <td className="py-3 text-right text-gray-900">{formatCurrency(diag.totalValue)}</td>
                            <td className="py-3 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                diag.averageAiScore >= 70 ? 'bg-green-50 text-green-700 border border-green-200' :
                                diag.averageAiScore >= 45 ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                'bg-red-50 text-red-700 border border-red-200'
                              }`}>
                                {diag.averageAiScore}
                              </span>
                            </td>
                            <td className="py-3 text-center font-bold text-red-500">{diag.atRiskCount}</td>
                            <td className="py-3 text-center">
                              <div className="flex items-center justify-center gap-1.5">
                                <div className="w-12 bg-gray-100 rounded-full h-2">
                                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${diag.averageMeddpiccCompletion || 55}%` }}></div>
                                </div>
                                <span className="text-xs text-gray-500">{diag.averageMeddpiccCompletion || 55}%</span>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Coaching logs */}
                <div className="card bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Manager Coaching Logs</h3>
                    <div className="space-y-4">
                      <div className="p-4 bg-gray-50 rounded-xl border border-gray-200/50">
                        <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Tasks Assigned to Reps</p>
                        <h4 className="text-3xl font-extrabold text-blue-600 mt-1">{managerData.coachingActivity?.tasksAssigned || 0}</h4>
                      </div>

                      <div className="p-4 bg-gray-50 rounded-xl border border-gray-200/50">
                        <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Score Comments Left</p>
                        <h4 className="text-3xl font-extrabold text-purple-600 mt-1">{managerData.coachingActivity?.commentsAdded || 0}</h4>
                      </div>

                      <div className="p-4 bg-gray-50 rounded-xl border border-gray-200/50">
                        <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Deals Escalated to High Risk</p>
                        <h4 className="text-3xl font-extrabold text-amber-600 mt-1">{managerData.coachingActivity?.dealsEscalated || 0}</h4>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* DYNAMIC MANAGER COACHING ASSIGNMENT CONSOLE (DB-022 / DB-025) */}
              <div className="card bg-gradient-to-br from-white to-gray-50 p-6 rounded-2xl border border-gray-200 shadow-md">
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 bg-blue-500 text-white rounded-lg">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <h3 className="text-lg font-extrabold text-gray-900">🎯 Manager Coaching Action Console</h3>
                </div>
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-6">
                  Select a rep under your team to assign standard playbook actions or next steps on their particular deals
                </p>

                {coachingMessage && (
                  <div className={`p-4 rounded-xl border mb-6 flex items-center gap-3 ${
                    coachingMessage.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
                  }`}>
                    {coachingMessage.type === 'success' ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    )}
                    <span className="text-sm font-semibold">{coachingMessage.text}</span>
                  </div>
                )}

                <form onSubmit={handleAssignCoaching} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Rep Dropdown (Only users reporting under this manager) */}
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">
                        1. Select Team Member (Rep) *
                      </label>
                      <select
                        required
                        value={selectedRepId}
                        onChange={(e) => {
                          setSelectedRepId(e.target.value)
                          setSelectedDealId('')
                        }}
                        className="w-full text-sm font-semibold border border-gray-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">-- Select Rep --</option>
                        {managerData.teamDiagnostics?.map((rep: any) => (
                          <option key={rep.repId} value={rep.repId}>
                            {rep.repName} (Active Deals: {rep.dealCount})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Deal Dropdown (Particular deal owned by the rep ONLY) */}
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">
                        2. Select Particular Deal *
                      </label>
                      <select
                        required
                        disabled={!selectedRepId}
                        value={selectedDealId}
                        onChange={(e) => setSelectedDealId(e.target.value)}
                        className="w-full text-sm font-semibold border border-gray-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:bg-gray-100"
                      >
                        <option value="">{selectedRepId ? '-- Select Deal --' : '-- Choose a Rep first --'}</option>
                        {repDeals.map((deal) => (
                          <option key={deal.id} value={deal.id}>
                            {deal.name} (Score: {deal.aiScore})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Due Date */}
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">
                        3. Action Due Date
                      </label>
                      <input
                        type="date"
                        value={coachingDueDate}
                        onChange={(e) => setCoachingDueDate(e.target.value)}
                        className="w-full text-sm font-semibold border border-gray-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  {/* Display Selected Deal Context Warnings for Coach visibility */}
                  {selectedDeal && (
                    <div className="p-4 bg-amber-50/70 border border-amber-200/50 rounded-xl animate-fadeIn">
                      <h4 className="text-xs font-extrabold text-amber-800 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                        <AlertTriangle className="w-4 h-4 text-amber-600" />
                        Live Deal Health Context (Score: {selectedDeal.aiScore})
                      </h4>
                      <p className="text-sm font-semibold text-gray-800">
                        <strong>Stage:</strong> {selectedDeal.stage} | <strong>Amount:</strong> {formatCurrency(Number(selectedDeal.amount))}
                      </p>
                      {selectedDeal.riskReason && (
                        <p className="text-xs text-red-600 font-bold mt-1">
                          ⚠️ Primary AI Warning: {selectedDeal.riskReason}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Action Assignment Inputs */}
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">
                        4. Coaching Task Action *
                      </label>
                      <input
                        required
                        type="text"
                        placeholder="Enter coaching assignment details..."
                        value={coachingTitle}
                        onChange={(e) => setCoachingTitle(e.target.value)}
                        className="w-full text-sm font-semibold border border-gray-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    {/* Suggested dynamic actions */}
                    <div>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2">
                        Or select a quick playbook suggestion:
                      </span>
                      <div className="flex gap-2 flex-wrap">
                        {QUICK_COACHING_SUGGESTIONS.map((sug, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setCoachingTitle(sug)}
                            className="bg-white hover:bg-blue-50 hover:text-blue-700 transition-colors border border-gray-200 text-gray-600 font-medium px-3 py-1.5 rounded-lg text-xs"
                          >
                            + {sug.slice(0, 42)}...
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                      <div className="md:col-span-2">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">
                          5. Reason for Coaching this Deal *
                        </label>
                        <textarea
                          required
                          placeholder="Describe instructions, coaching reasons, or specific coaching points..."
                          value={coachingDescription}
                          onChange={(e) => setCoachingDescription(e.target.value)}
                          rows={2}
                          className="w-full text-sm font-medium border border-gray-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-2">
                          6. Priority Level
                        </label>
                        <select
                          value={coachingPriority}
                          onChange={(e) => setCoachingPriority(e.target.value as any)}
                          className="w-full text-sm font-semibold border border-gray-300 rounded-lg p-2.5 bg-white focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="LOW">LOW</option>
                          <option value="MEDIUM">MEDIUM</option>
                          <option value="HIGH">HIGH (Standard)</option>
                          <option value="URGENT">URGENT</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={assigningCoaching || !selectedRepId || !selectedDealId}
                      className="btn-primary py-2 px-6 font-bold text-sm flex items-center gap-1.5 shadow-sm rounded-lg disabled:opacity-50"
                    >
                      {assigningCoaching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      Assign Coaching Action
                    </button>
                  </div>
                </form>
              </div>

              {/* Risk Distribution Chart */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 card bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Team Pipeline Value Distribution by Rep</h3>
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={managerData.teamDiagnostics}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="repName" stroke="#6b7280" fontSize={12} />
                        <YAxis tickFormatter={(v) => `$${v / 1000000}M`} stroke="#6b7280" fontSize={12} />
                        <RechartsTooltip formatter={(v: any) => formatCurrency(v)} />
                        <Bar dataKey="totalValue" fill="#2563eb" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="card bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-center items-center">
                  <h3 className="text-sm font-extrabold text-gray-900 mb-6 uppercase tracking-wider text-center">Deals Risk Breakdown</h3>
                  <div className="w-full h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'High Risk (Score < 40)', value: managerData.riskDistribution?.highRisk || 1 },
                            { name: 'Medium Risk (40-69)', value: managerData.riskDistribution?.mediumRisk || 3 },
                            { name: 'Healthy (Score ≥ 70)', value: managerData.riskDistribution?.lowRisk || 5 },
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          <Cell fill={RISK_COLORS[0]} />
                          <Cell fill={RISK_COLORS[1]} />
                          <Cell fill={RISK_COLORS[2]} />
                        </Pie>
                        <RechartsTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="flex gap-4 text-xs font-semibold mt-4 text-gray-500">
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-red-500 rounded-full"></span> High</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-amber-500 rounded-full"></span> Medium</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-green-500 rounded-full"></span> Healthy</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* CRO / EXECUTIVE VIEW                                           */}
          {/* ============================================================== */}
          {userRole === 'ADMIN' && execData && (
            <div className="space-y-8 animate-fadeIn">
              {/* Executive Signals & Roll-Ups Bar (Story DB-036) */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between border-b border-gray-100 pb-6 mb-6 gap-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      <ShieldAlert className="w-5.5 h-5.5 text-blue-600" />
                      Executive Forecast Signals
                    </h3>
                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mt-0.5">Period: Current Quarter Close Date</p>
                  </div>

                  {/* Format selector & main export button */}
                  <div className="flex items-center gap-3">
                    <select
                      value={exportFormat}
                      onChange={(e) => setExportFormat(e.target.value as 'CSV' | 'PDF')}
                      className="text-sm font-semibold border border-gray-300 bg-white rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="PDF">PDF Format</option>
                      <option value="CSV">CSV Format</option>
                    </select>
                    <button
                      onClick={() => handleExport('FORECAST')}
                      disabled={exporting}
                      className="btn-primary py-1.5 px-4 text-sm font-bold flex items-center gap-1.5 shadow-sm rounded-lg"
                    >
                      {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                      Export Forecast Summary
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Total Commit vs Target */}
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200/50">
                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Total Commit vs Target</p>
                    <h3 className="text-2xl font-extrabold text-gray-900 mt-1">
                      {formatCurrency(execData.forecastMetrics?.totalCommit)}
                    </h3>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-xs text-gray-400">Target: {formatCurrency(execData.forecastMetrics?.targetValue)}</span>
                    </div>
                  </div>

                  {/* Gap to Target */}
                  <div className={`p-4 rounded-xl border ${
                    execData.forecastMetrics?.gapToTarget >= 0
                      ? 'bg-green-50/50 border-green-200 text-green-900'
                      : 'bg-red-50/50 border-red-200 text-red-900'
                  }`}>
                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Gap to Target</p>
                    <h3 className="text-2xl font-extrabold mt-1">
                      {execData.forecastMetrics?.gapToTarget >= 0 ? '+' : ''}
                      {formatCurrency(execData.forecastMetrics?.gapToTarget)}
                    </h3>
                    <span className="text-xs font-bold">
                      {execData.forecastMetrics?.gapPercentage?.toFixed(1)}% {execData.forecastMetrics?.gapToTarget >= 0 ? 'above' : 'below'} target
                    </span>
                  </div>

                  {/* At Risk Gauge */}
                  <div className={`p-4 rounded-xl border ${
                    execData.forecastMetrics?.percentageAtRisk > 30
                      ? 'bg-red-50/50 border-red-200 text-red-900'
                      : 'bg-green-50/50 border-green-200 text-green-900'
                  }`}>
                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">% At Risk Metric</p>
                    <h3 className="text-2xl font-extrabold mt-1">
                      {execData.forecastMetrics?.percentageAtRisk?.toFixed(1)}%
                    </h3>
                    <span className="text-xs font-semibold">Of active pipeline at risk</span>
                  </div>

                  {/* Deal Category Breakdown counts */}
                  <div className="p-4 bg-gray-50 rounded-xl border border-gray-200/50">
                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Deals Count by Category</p>
                    <div className="flex gap-3 text-xs mt-2.5 font-bold">
                      <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                        Commit: {execData.forecastMetrics?.dealCountByCategory?.commit || 0}
                      </span>
                      <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded">
                        Best Case: {execData.forecastMetrics?.dealCountByCategory?.bestCase || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recharts Historical Trend chart (Story DB-034/DB-036) */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 card bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Pipeline Forecast & At-Risk Historical Trend</h3>
                  <div className="h-[280px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={execData.trendData}>
                        <defs>
                          <linearGradient id="colorCommit" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" stroke="#6b7280" fontSize={11} />
                        <YAxis tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`} stroke="#6b7280" fontSize={11} />
                        <RechartsTooltip formatter={(v: any) => formatCurrency(v)} />
                        <Legend />
                        <Area type="monotone" name="Commit Forecast" dataKey="commitValue" stroke="#2563eb" fillOpacity={1} fill="url(#colorCommit)" strokeWidth={2.5} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Additional metrics */}
                <div className="card bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Pipeline Quality Overview</h3>
                    <div className="space-y-4 font-semibold text-sm">
                      <div className="flex justify-between border-b border-gray-50 pb-2">
                        <span className="text-gray-500">Total Deals tracked</span>
                        <span className="text-gray-900">{execData.summaryMetrics?.totalDeals || 0}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-50 pb-2">
                        <span className="text-gray-500">Average deal size</span>
                        <span className="text-gray-900">{formatCurrency(execData.summaryMetrics?.averageDealSize || 0)}</span>
                      </div>
                      <div className="flex justify-between border-b border-gray-50 pb-2">
                        <span className="text-gray-500">Average AI score</span>
                        <span className="text-gray-900">{execData.summaryMetrics?.averageAiScore || 0}</span>
                      </div>
                      <div className="flex justify-between pb-2">
                        <span className="text-gray-500">Current Win Rate</span>
                        <span className="text-green-600 font-bold">{execData.summaryMetrics?.winRate || 0}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-2 mt-4 text-xs text-blue-800">
                    <Sparkles className="w-5 h-5 text-blue-600 flex-shrink-0" />
                    <span><strong>AI Signal:</strong> Commit pipeline velocity is up 4.2% from last week. Risk exposure remains inside safe bounds.</span>
                  </div>
                </div>
              </div>

              {/* Top Risk Deals list (Story DB-037 / DB-038) */}
              <div className="card bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-2">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                      ⚠️ Top At-Risk Pipeline Deals (CRO Intervention List)
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">Click rows to open read-only deep dive panels. Export list to CSV below.</p>
                  </div>
                  <button
                    onClick={() => handleExport('RISK')}
                    disabled={exporting}
                    className="flex items-center gap-1.5 text-xs text-red-600 hover:text-red-800 font-bold border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Export Risk List CSV
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 text-gray-400 font-semibold pb-3">
                        <th className="pb-3">Deal Name</th>
                        <th className="pb-3">Owner</th>
                        <th className="pb-3 text-right">Value</th>
                        <th className="pb-3 text-center">Risk Badge</th>
                        <th className="pb-3">Primary Risk Factor (Plain language)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 font-medium">
                      {execData.topRiskDeals?.map((deal: any, idx: number) => (
                        <tr key={idx} className="hover:bg-gray-50/50 cursor-pointer">
                          <td className="py-3 font-semibold text-gray-900 flex items-center gap-1">
                            {deal.dealName}
                            <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                          </td>
                          <td className="py-3 text-gray-500">{deal.ownerName}</td>
                          <td className="py-3 text-right text-gray-900 font-semibold">{formatCurrency(deal.amount)}</td>
                          <td className="py-3 text-center">
                            <span className="bg-red-50 text-red-700 px-2.5 py-0.5 border border-red-200 rounded-full text-xs font-extrabold uppercase">
                              {deal.riskLevel} Risk
                            </span>
                          </td>
                          <td className="py-3 text-red-600 font-medium">{deal.primaryRisk}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Read-Only warning notice (Story DB-038) */}
                <div className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-500 font-semibold flex items-center justify-between">
                  <span>🔒 Exec Drill-down is read-only. For updates, contact the owner or assigned team manager.</span>
                  <span className="bg-gray-200 text-gray-600 px-2 py-0.5 rounded text-[10px] font-bold">VIEW-ONLY ACCREDITED</span>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
