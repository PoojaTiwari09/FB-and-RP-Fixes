import { useEffect, useState } from 'react'
import { useAuthStore } from '../stores/authStore'
import {
  coachingAPI,
  dealAPI,
  taskAPI,
  commentAPI,
  escalationAPI,
  playbookAPI,
} from '../lib/api'
import {
  Users,
  Sparkles,
  AlertTriangle,
  Loader2,
  Send,
  MessageSquare,
  Plus,
  ShieldAlert,
  ArrowRight,
  Bookmark,
  CheckCircle2,
} from 'lucide-react'

export default function CoachingPage() {
  const { user } = useAuthStore()
  const userRole = user?.role || 'USER'

  const [opportunities, setOpportunities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Drawer / Workspace state
  const [activeDealId, setActiveDealId] = useState<string | null>(null)
  const [dealDetail, setDealDetail] = useState<any>(null)
  const [playbookItems, setPlaybookItems] = useState<any[]>([])
  const [comments, setComments] = useState<any[]>([])
  const [loadingDetail, setLoadingDetail] = useState(false)

  // New Action forms state
  const [taskTitle, setTaskTitle] = useState('')
  const [taskDescription, setTaskDescription] = useState('')
  const [taskDueDate, setTaskDueDate] = useState('')
  const [taskPriority, setTaskPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('HIGH')
  const [assigningTask, setAssigningTask] = useState(false)

  const [commentText, setCommentText] = useState('')
  const [submittingComment, setSubmittingComment] = useState(false)

  const [escalateReason, setEscalateReason] = useState('')
  const [escalating, setEscalating] = useState(false)

  const [workspaceMessage, setWorkspaceMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Sales Rep View States
  const [repTasks, setRepTasks] = useState<any[]>([])
  const [repDeals, setRepDeals] = useState<any[]>([])

  useEffect(() => {
    if (userRole === 'MANAGER' || userRole === 'ADMIN') {
      loadOpportunities()
    } else if (userRole === 'USER') {
      loadRepCoachingData()
    }
  }, [userRole])

  const loadRepCoachingData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [tasksRes, dealsRes] = await Promise.all([
        taskAPI.getMyTasks(),
        dealAPI.getMyDeals(),
      ])
      setRepTasks(tasksRes.data || tasksRes || [])
      setRepDeals(dealsRes.data || dealsRes || [])
    } catch (err: any) {
      console.error(err)
      setError(err?.message || 'Failed to load coaching data.')
    } finally {
      setLoading(false)
    }
  }

  const handleCompleteTask = async (dealId: string, taskId: string) => {
    try {
      await taskAPI.updateTask(dealId, taskId, { status: 'COMPLETED' })
      // Refresh tasks
      const tasksRes = await taskAPI.getMyTasks()
      setRepTasks(tasksRes.data || tasksRes)
    } catch (err: any) {
      alert('Failed to complete coaching task: ' + (err?.message || err))
    }
  }

  const getDealName = (dealId: string) => {
    const deal = repDeals.find(d => d.id === dealId)
    return deal ? deal.name : 'Unknown Deal'
  }

  const loadOpportunities = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await coachingAPI.getOpportunities()
      setOpportunities(res.data || [])
    } catch (err: any) {
      console.error(err)
      setError(err?.message || 'Failed to retrieve team coaching opportunities.')
    } finally {
      setLoading(false)
    }
  }

  // Load deal details, warnings, playbooks, and comments for manager deep-dive
  const handleOpenWorkspace = async (dealId: string) => {
    try {
      setActiveDealId(dealId)
      setLoadingDetail(true)
      setWorkspaceMessage(null)
      
      const [dealRes, playbookRes, commentsRes] = await Promise.all([
        dealAPI.getDeal(dealId),
        playbookAPI.getPlaybook(dealId),
        commentAPI.getComments(dealId),
      ])

      setDealDetail(dealRes.data || dealRes)
      setPlaybookItems(playbookRes.data || playbookRes || [])
      setComments(commentsRes.data || commentsRes || [])
    } catch (err: any) {
      console.error(err)
      alert('Failed to load deal detailed coaching context: ' + (err?.message || err))
      setActiveDealId(null)
    } finally {
      setLoadingDetail(false)
    }
  }

  // Assign follow-up coaching task specifically linked to this particular deal (DB-022/DB-025)
  const handleAssignTask = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeDealId || !taskTitle.trim() || !dealDetail || !taskDescription.trim()) return

    try {
      setAssigningTask(true)
      setWorkspaceMessage(null)
      
      await taskAPI.createTask(activeDealId, {
        title: taskTitle.trim(),
        description: taskDescription.trim(),
        priority: taskPriority,
        dueDate: taskDueDate || undefined,
        assigneeId: dealDetail.ownerId,
        assigneeName: dealDetail.ownerName,
        source: 'MANAGER_ASSIGNED',
      })

      setWorkspaceMessage({ type: 'success', text: `Coaching task assigned successfully to ${dealDetail.ownerName}!` })
      setTaskTitle('')
      setTaskDescription('')
      setTaskDueDate('')
    } catch (err: any) {
      setWorkspaceMessage({ type: 'error', text: err?.message || 'Failed to assign task.' })
    } finally {
      setAssigningTask(false)
    }
  }

  // Submit coaching comment / context notes visible to the rep in the panel (DB-023)
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeDealId || !commentText.trim()) return

    try {
      setSubmittingComment(true)
      setWorkspaceMessage(null)
      
      const newComment = await commentAPI.createComment(activeDealId, {
        content: commentText.trim(),
      })

      // Update local comment array
      setComments([newComment.data || newComment, ...comments])
      setWorkspaceMessage({ type: 'success', text: 'Coaching note added successfully!' })
      setCommentText('')
    } catch (err: any) {
      setWorkspaceMessage({ type: 'error', text: err?.message || 'Failed to save comment.' })
    } finally {
      setSubmittingComment(false)
    }
  }

  // Escalate deal to 'High Risk' status with optional manager reasons (DB-024)
  const handleEscalateRisk = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!activeDealId || !dealDetail) return

    try {
      setEscalating(true)
      setWorkspaceMessage(null)

      // Post risk escalation
      await escalationAPI.create(activeDealId, {
        reason: escalateReason.trim() || 'Manager manual risk escalation',
      })

      // Also update deal status locally
      setDealDetail({
        ...dealDetail,
        isHighRisk: true,
        riskReason: escalateReason.trim() || 'Manager escalated',
      })

      setWorkspaceMessage({ type: 'success', text: `Deal successfully escalated to HIGH RISK across all boards!` })
      setEscalateReason('')
    } catch (err: any) {
      setWorkspaceMessage({ type: 'error', text: err?.message || 'Failed to escalate risk.' })
    } finally {
      setEscalating(false)
    }
  }

  const formatCurrency = (val: number) => {
    if (!val) return '$0'
    if (val >= 1000000) return `$${(val / 1000000).toFixed(2)}M`
    if (val >= 1000) return `$${(val / 1000).toFixed(0)}K`
    return `$${val}`
  }

  // Rep Coaching Dashboard for Sales User Roles (DB-033/DB-022 Resolved)
  if (userRole === 'USER') {
    const coachingTasks = repTasks.filter(
      (t) => t.source === 'MANAGER_ASSIGNED' || t.source === 'AI_SUGGESTED'
    )
    const activeCoaching = coachingTasks.filter((t) => t.status !== 'COMPLETED')
    const completedCoaching = coachingTasks.filter((t) => t.status === 'COMPLETED')

    return (
      <div className="space-y-8 max-w-7xl mx-auto text-left">
        {/* Gradients Header */}
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 md:p-12 text-white shadow-lg">
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
          <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-2xl" />
          
          <div className="relative z-10 space-y-4">
            <span className="bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Sales Rep Coaching Dashboard
            </span>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight animate-fadeIn">
              Professional Development & Guidance
            </h1>
            <p className="text-blue-100 max-w-2xl text-sm md:text-base leading-relaxed">
              Track undergoing coaching actions assigned by your Sales Manager, resolve playbook gaps, and review past completed coaching guidance history.
            </p>
          </div>
        </div>

        {/* Dynamic KPI Badges */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
            <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500">
              <Sparkles className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Undergoing Coaching</span>
              <span className="text-2xl font-black text-gray-950 mt-1">{activeCoaching.length} Active Actions</span>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Coaching Completed</span>
              <span className="text-2xl font-black text-gray-950 mt-1">{completedCoaching.length} Resolved</span>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-500">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Coaching Type</span>
              <span className="text-2xl font-black text-gray-950 mt-1">Manager & AI</span>
            </div>
          </div>
        </div>

        {/* Lists Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Active Coaching Actions (Undergoing) */}
          <div className="lg:col-span-2 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-gray-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-600" />
                Undergoing Coaching Actions
              </h2>
              <span className="bg-blue-100 text-blue-800 text-xs font-bold px-2.5 py-0.5 rounded-full">
                {activeCoaching.length} Pending
              </span>
            </div>

            {activeCoaching.length === 0 ? (
              <div className="bg-white border border-dashed border-gray-300 rounded-2xl py-12 px-6 text-center">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <h4 className="font-bold text-gray-900">All coaching actions resolved!</h4>
                <p className="text-xs text-gray-500 mt-1">You have completed all active coaching items assigned to you.</p>
              </div>
            ) : (
              <div className="space-y-4 animate-fadeIn">
                {activeCoaching.map((task) => {
                  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date()
                  return (
                    <div
                      key={task.id}
                      className="bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-2 text-left">
                        <div className="flex items-center gap-2">
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                            task.source === 'MANAGER_ASSIGNED' 
                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                              : 'bg-blue-100 text-blue-800 border border-blue-200'
                          }`}>
                            {task.source === 'MANAGER_ASSIGNED' ? 'Manager Assigned' : 'AI Suggested'}
                          </span>

                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                            task.priority === 'URGENT' ? 'bg-red-100 text-red-800' :
                            task.priority === 'HIGH' ? 'bg-amber-100 text-amber-800' :
                            task.priority === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {task.priority} Priority
                          </span>
                        </div>

                        <h3 className="font-bold text-gray-900 text-sm md:text-base leading-snug">
                          {task.title}
                        </h3>

                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-semibold text-gray-500">
                          <span>Deal: <span className="text-blue-600 font-bold">{getDealName(task.dealId)}</span></span>
                          {task.dueDate && (
                            <span className={isOverdue ? 'text-red-600 font-bold' : ''}>
                              Due: {new Date(task.dueDate).toLocaleDateString()} {isOverdue && '(Overdue)'}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handleCompleteTask(task.dealId, task.id)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-sm transition-all flex items-center gap-1.5 flex-shrink-0"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Complete Action
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Past Coaching details */}
          <div className="lg:col-span-1 space-y-5">
            <h2 className="text-lg font-extrabold text-gray-900 flex items-center gap-2 text-left">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              Past Coaching History
            </h2>

            {completedCoaching.length === 0 ? (
              <div className="bg-white border border-gray-200 rounded-2xl py-12 px-4 text-center shadow-sm">
                <p className="text-xs text-gray-400 italic">No completed coaching history recorded yet.</p>
              </div>
            ) : (
              <div className="space-y-4 overflow-y-auto max-h-[500px] pr-1 animate-fadeIn">
                {completedCoaching.map((task) => (
                  <div
                    key={task.id}
                    className="bg-gray-50/50 border border-gray-200 rounded-2xl p-4 text-left space-y-2 opacity-85 hover:opacity-100 transition-opacity"
                  >
                    <span className="bg-gray-200 text-gray-700 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase">
                      Completed
                    </span>
                    <h4 className="font-bold text-gray-900 text-sm leading-snug">{task.title}</h4>
                    <p className="text-[11px] text-gray-500 font-semibold">
                      Deal: {getDealName(task.dealId)}
                    </p>
                    {task.completedAt && (
                      <span className="text-[9px] text-gray-400 block font-medium">
                        Resolved on {new Date(task.completedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 flex items-center gap-2">
            <Users className="w-8 h-8 text-blue-600" />
            Manager Coaching Portal
          </h1>
          <p className="text-gray-500 mt-1">
            Review AI-powered coaching opportunities, qualified playbook gaps, and assign deal-specific coaching tasks to your reps.
          </p>
        </div>

        {/* Dynamic coaching dashboard KPI badges */}
        {opportunities.length > 0 && (
          <div className="flex gap-4">
            <div className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-center shadow-sm">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Opportunities</span>
              <span className="text-xl font-extrabold text-blue-600">{opportunities.length}</span>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl px-4 py-2 text-center shadow-sm">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">At Risk Deals</span>
              <span className="text-xl font-extrabold text-red-600">
                {opportunities.filter(o => o.stage?.includes('LOST') || o.prompts?.length > 2).length}
              </span>
            </div>
          </div>
        )}
      </div>

      {loading ? (
        <div className="min-h-[400px] flex items-center justify-center bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            <p className="text-gray-500 font-medium">Retrieving coaching opportunities...</p>
          </div>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 text-red-700 rounded-xl border border-red-100 flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-red-500 flex-shrink-0" />
          <div>
            <h4 className="font-bold">Error loading coaching data</h4>
            <p className="text-sm text-red-600 mt-0.5">{error}</p>
          </div>
        </div>
      ) : opportunities.length === 0 ? (
        <div className="text-center py-16 bg-white border border-gray-200 rounded-2xl shadow-sm">
          <p className="text-lg font-bold text-green-600">🎉 Your team pipeline is completely healthy!</p>
          <p className="text-sm text-gray-500 mt-1">No outstanding AI coaching opportunities reported across active deals.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Opportunities List Left (DB-021) */}
          <div className="lg:col-span-1 space-y-4">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">AI Coaching Prompts & Opportunities</h3>
            <div className="space-y-4 overflow-y-auto max-h-[700px] pr-2">
              {opportunities.map((opp) => (
                <div
                  key={opp.dealId}
                  onClick={() => handleOpenWorkspace(opp.dealId)}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer text-left ${
                    activeDealId === opp.dealId
                      ? 'bg-blue-50/50 border-blue-400 shadow-sm ring-1 ring-blue-400/20'
                      : 'bg-white border-gray-200 hover:shadow-md'
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <h4 className="font-bold text-gray-900 text-sm line-clamp-1">{opp.dealName}</h4>
                    <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded">
                      {opp.stage?.slice(0, 15)}
                    </span>
                  </div>
                  
                  <p className="text-xs text-gray-500 font-semibold mt-1">Rep: {opp.repName}</p>

                  {/* Focus area tags */}
                  <div className="flex gap-1.5 mt-3 flex-wrap">
                    {opp.focusAreas?.slice(0, 2).map((area: string, idx: number) => (
                      <span key={idx} className="bg-gray-100 text-gray-600 text-[10px] px-2 py-0.5 rounded-full font-bold">
                        {area}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-xs font-bold text-blue-600 border-t border-gray-100 pt-3 mt-4">
                    <span>{opp.prompts?.length || 0} Coaching Prompts</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Deep-Dive Coaching Workspace Right (DB-021 / DB-022 / DB-023 / DB-024 / DB-025) */}
          <div className="lg:col-span-2 space-y-6">
            {!activeDealId ? (
              <div className="min-h-[500px] bg-white border border-gray-200 rounded-2xl flex flex-col items-center justify-center p-8 text-center shadow-sm">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
                  <Sparkles className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Coaching Workspace</h3>
                <p className="text-gray-500 text-sm mt-1 max-w-sm">
                  Select a team opportunity from the list to review AI-generated questions, qualified playbook gaps, and assign coaching tasks.
                </p>
              </div>
            ) : loadingDetail ? (
              <div className="min-h-[500px] bg-white border border-gray-200 rounded-2xl flex items-center justify-center p-8 shadow-sm">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                  <p className="text-gray-500 text-sm font-semibold">Generating Coaching Workspace...</p>
                </div>
              </div>
            ) : dealDetail ? (
              <div className="space-y-6 animate-fadeIn text-left">
                {/* Deal Header Overview with High Risk Escalation triggers */}
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-extrabold text-gray-900">{dealDetail.name}</h3>
                    <div className="flex items-center gap-3 text-xs font-bold text-gray-500 mt-1">
                      <span>Owner: {dealDetail.ownerName}</span>
                      <span>•</span>
                      <span>Amount: {formatCurrency(Number(dealDetail.amount))}</span>
                      <span>•</span>
                      <span>Stage: {dealDetail.stage}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {dealDetail.isHighRisk ? (
                      <span className="bg-red-50 text-red-700 px-3 py-1 rounded-full text-xs font-extrabold uppercase border border-red-200 flex items-center gap-1">
                        <ShieldAlert className="w-4 h-4" />
                        HIGH RISK ESCALATED
                      </span>
                    ) : (
                      <form onSubmit={handleEscalateRisk} className="flex gap-2">
                        <input
                          required
                          type="text"
                          placeholder="Escalation reason..."
                          value={escalateReason}
                          onChange={(e) => setEscalateReason(e.target.value)}
                          className="text-xs font-semibold border border-gray-300 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
                        />
                        <button
                          type="submit"
                          disabled={escalating}
                          className="flex items-center gap-1 px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                        >
                          <ShieldAlert className="w-3.5 h-3.5" />
                          Escalate Risk
                        </button>
                      </form>
                    )}
                  </div>
                </div>

                {workspaceMessage && (
                  <div className={`p-4 rounded-xl border flex items-center gap-3 ${
                    workspaceMessage.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
                  }`}>
                    {workspaceMessage.type === 'success' ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    )}
                    <span className="text-sm font-semibold">{workspaceMessage.text}</span>
                  </div>
                )}

                {/* Grid for AI prompts and Playbook validation */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* AI prompts list (DB-021) */}
                  <div className="card bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col">
                    <h4 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-blue-600" />
                      AI coaching Questions
                    </h4>
                    
                    <div className="space-y-4 flex-1 max-h-[300px] overflow-y-auto pr-1">
                      {opportunities.find(o => o.dealId === activeDealId)?.prompts?.map((prompt: any, i: number) => (
                        <div key={i} className="p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                          <p className="text-xs font-bold text-blue-700">Category: {prompt.category}</p>
                          <h5 className="font-semibold text-gray-900 text-sm mt-1">"{prompt.question}"</h5>
                          <p className="text-xs text-gray-500 mt-1 italic">Context: {prompt.context}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* MEDDICC playbook gaps (DB-021) */}
                  <div className="card bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                    <h4 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                      <Bookmark className="w-4 h-4 text-purple-600" />
                      Qualified Playbook Gaps
                    </h4>
                    
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                      {playbookItems.length > 0 ? (
                        playbookItems.map((item: any) => (
                          <div key={item.id} className="flex justify-between items-center p-2.5 rounded-lg border border-gray-100">
                            <div>
                              <span className="bg-purple-100 text-purple-800 text-[9px] font-bold px-1.5 py-0.5 rounded">
                                {item.type}
                              </span>
                              <p className="text-xs font-semibold text-gray-900 mt-1">{item.criterion}</p>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                              item.status === 'COMPLETED'
                                ? 'bg-green-50 text-green-700 border border-green-100'
                                : 'bg-amber-50 text-amber-700 border border-amber-100'
                            }`}>
                              {item.status}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-6 text-gray-500 text-xs italic">
                          No playbook items initialized for this deal.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Forms block: Assign Follow-up and Coaching Comments */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Assign task specifically to this particular deal (DB-022/DB-025) */}
                  <div className="card bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                    <h4 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                      <Plus className="w-4 h-4 text-blue-600" />
                      Assign Coaching Action
                    </h4>

                    <form onSubmit={handleAssignTask} className="space-y-4">
                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Coaching Task Action *</label>
                        <input
                          required
                          type="text"
                          placeholder="e.g. Schedule validation call..."
                          value={taskTitle}
                          onChange={(e) => setTaskTitle(e.target.value)}
                          className="w-full text-xs font-semibold border border-gray-300 rounded-lg p-2 bg-white focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Reason for Coaching *</label>
                        <textarea
                          required
                          placeholder="Describe instructions, coaching reasons, or specific coaching points..."
                          value={taskDescription}
                          onChange={(e) => setTaskDescription(e.target.value)}
                          rows={2}
                          className="w-full text-xs font-medium border border-gray-300 rounded-lg p-2 bg-white focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Due Date</label>
                          <input
                            type="date"
                            value={taskDueDate}
                            onChange={(e) => setTaskDueDate(e.target.value)}
                            className="w-full text-xs font-semibold border border-gray-300 rounded-lg p-2 bg-white focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Priority</label>
                          <select
                            value={taskPriority}
                            onChange={(e) => setTaskPriority(e.target.value as any)}
                            className="w-full text-xs font-semibold border border-gray-300 rounded-lg p-2 bg-white focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="LOW">LOW</option>
                            <option value="MEDIUM">MEDIUM</option>
                            <option value="HIGH">HIGH</option>
                            <option value="URGENT">URGENT</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <button
                          type="submit"
                          disabled={assigningTask}
                          className="btn-primary py-1.5 px-4 text-xs font-bold flex items-center gap-1 shadow-sm rounded-lg"
                        >
                          {assigningTask ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                          Assign Task
                        </button>
                      </div>
                    </form>
                  </div>

                  {/* Comments note feed visible to the rep (DB-023) */}
                  <div className="card bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex flex-col justify-between">
                    <div>
                      <h4 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                        <MessageSquare className="w-4 h-4 text-purple-600" />
                        Rep Coaching Notes feed
                      </h4>

                      <form onSubmit={handleAddComment} className="flex gap-2 mb-4">
                        <input
                          required
                          type="text"
                          placeholder="Type coaching advice or context note..."
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          className="flex-1 text-xs font-semibold border border-gray-300 rounded-lg p-2 bg-white focus:ring-2 focus:ring-blue-500"
                        />
                        <button
                          type="submit"
                          disabled={submittingComment}
                          className="btn-primary py-1.5 px-3 text-xs font-bold flex items-center gap-1 shadow-sm rounded-lg"
                        >
                          {submittingComment ? <Loader2 className="w-3 animate-spin" /> : <Send className="w-3 h-3" />}
                          Post Note
                        </button>
                      </form>

                      <div className="space-y-3 max-h-[140px] overflow-y-auto pr-1">
                        {comments.length > 0 ? (
                          comments.map((c: any) => (
                            <div key={c.id} className="p-2.5 bg-gray-50 rounded-xl border border-gray-200/50">
                              <p className="text-xs font-bold text-gray-800">{c.authorName || 'Manager Advice'}</p>
                              <p className="text-xs text-gray-600 mt-0.5">{c.content}</p>
                              <span className="text-[9px] text-gray-400 block mt-1">
                                {new Date(c.createdAt).toLocaleDateString()} at {new Date(c.createdAt).toLocaleTimeString()}
                              </span>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-4 text-gray-400 text-xs italic">
                            No coaching comments logged yet.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            ) : null}
          </div>

        </div>
      )}
    </div>
  )
}
