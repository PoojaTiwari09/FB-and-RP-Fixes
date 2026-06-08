import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from 'react-query'
import {
  Activity as ActivityIcon,
  AlertTriangle,
  CheckSquare,
  Edit3,
  FileText,
  Lightbulb,
  X,
  Calendar,
  Clock,
  Lock,
  MessageSquare,
  Target,
  CheckCircle,
  Users,
  ChevronUp,
  ChevronDown,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { activityAPI, dealAPI, playbookAPI, summaryAPI, warningAPI } from '../lib/api'
import { useAuthStore } from '../stores/authStore'

interface DealDetailPanelProps {
  deal: any
  canEdit?: boolean
  onClose: () => void
  onDealUpdated?: (deal: any) => void
  board?: any
}

const allTabs = [
  { id: 'brief', label: 'Brief', icon: FileText },
  { id: 'warnings', label: 'Warnings', icon: AlertTriangle },
  { id: 'playbook', label: 'Playbook', icon: CheckSquare },
  { id: 'activity', label: 'Activity', icon: ActivityIcon },
  { id: 'update-crm', label: 'Update CRM', icon: Edit3 },
]

const stageOptions = [
  'PROSPECTING',
  'QUALIFICATION',
  'NEEDS_ANALYSIS',
  'PROPOSAL',
  'NEGOTIATION',
  'CLOSED_WON',
  'CLOSED_LOST',
]

function label(value?: string) {
  if (!value) return ''
  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function formatMoney(value: unknown) {
  return `$${Number(value || 0).toLocaleString()}`
}

function formatDate(value?: string | Date) {
  if (!value) return 'N/A'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'N/A'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatDateFull(value?: string | Date) {
  if (!value) return 'N/A'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'N/A'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// ─────────────────────────────────────────────────────────────────────────────
export default function DealDetailPanel({ deal, canEdit = true, onClose, onDealUpdated, board }: DealDetailPanelProps) {
  const [activeTab, setActiveTab] = useState('brief')
  const tabs = allTabs.filter(tab => tab.id !== 'update-crm' || canEdit)

  const { data: summary } = useQuery(['summary', deal.id], () => summaryAPI.getCurrent(deal.id), {
    retry: false,
  })
  const { data: warnings } = useQuery(['warnings', deal.id], () => warningAPI.getActive(deal.id), {
    retry: false,
  })
  const { data: playbook } = useQuery(
    ['playbook', deal.id],
    () => playbookAPI.getPlaybook(deal.id),
    { retry: false }
  )
  const { data: timeline } = useQuery(
    ['timeline', deal.id],
    () => activityAPI.getTimeline(deal.id, { limit: 1000 }),
    { retry: false }
  )
  const { data: activities } = useQuery(
    ['activities', deal.id],
    () => activityAPI.getActivities(deal.id, { limit: 1000 }),
    { retry: false }
  )

  const daysSinceActivity = deal.lastActivityAt
    ? Math.floor((Date.now() - new Date(deal.lastActivityAt).getTime()) / 86400000)
    : 0

  const fallbackWarningsCount = [
    daysSinceActivity > 7,
    deal.crmData?.decisionMakerEngaged === 'No',
    deal.closeDate && new Date(deal.closeDate) < new Date(),
    deal.isHighRisk
  ].filter(Boolean).length

  const warningCount = warnings?.data?.length || deal.warningCount || fallbackWarningsCount || (deal.isHighRisk ? 1 : 0)

  return (
    <div className="fixed inset-y-0 right-0 z-50 flex w-[44rem] max-w-[96vw] flex-col border-l border-gray-200 bg-white shadow-2xl">
      {/* ── Panel Header ── */}
      <div className="border-b border-gray-200 bg-white px-7 pt-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="truncate text-xl font-bold text-gray-950">{deal.name}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-sm">
              <span className="text-gray-500">{deal.accountName || 'Unknown account'}</span>
              <span className="text-gray-300">·</span>
              <span className="font-semibold text-gray-800">{formatMoney(deal.amount)}</span>
              <span className="text-gray-300">·</span>
              <span className="rounded bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                {label(deal.stage)}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
            aria-label="Close panel"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* ── Tab Bar ── */}
        <div className="mt-5 flex items-stretch">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex flex-1 items-center justify-center gap-1.5 border-b-2 pb-3 pt-2 text-xs font-semibold transition-colors ${
                  active
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">{tab.label}</span>
                {tab.id === 'warnings' && warningCount > 0 && (
                  <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-600">
                    {warningCount}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Tab Content ── */}
      <div className="flex-1 overflow-y-auto px-7 py-6">
        {activeTab === 'brief' && <BriefTab deal={deal} summary={summary?.data} />}
        {activeTab === 'warnings' && <WarningsTab deal={deal} warnings={warnings?.data} />}
        {activeTab === 'playbook' && <PlaybookTab deal={deal} playbook={playbook?.data} />}
        {activeTab === 'activity' && (
          <ActivityTab deal={deal} timeline={timeline?.data} activities={activities?.data} />
        )}
        {activeTab === 'update-crm' && (
          <UpdateCRMTab deal={deal} onDealUpdated={onDealUpdated} board={board} />
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// BRIEF TAB
// ─────────────────────────────────────────────────────────────────────────────
const briefCache = new Map<string, any>()

function tryParseBrief(summaryObj: any) {
  if (!summaryObj || !summaryObj.summary) return null
  try {
    const parsed = JSON.parse(summaryObj.summary)
    if (parsed && typeof parsed === 'object' && 'overview' in parsed) {
      return parsed
    }
  } catch (e) {
    // Not valid JSON
  }
  return null
}

function BriefSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      {[1, 2, 3, 4, 5, 6, 7].map((i) => (
        <div key={i} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="w-full flex items-center justify-between px-6 py-4 bg-gray-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gray-200" />
              <div className="h-4 w-32 bg-gray-200 rounded" />
            </div>
            <div className="w-4 h-4 bg-gray-200 rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}

function BriefTab({ deal, summary }: any) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [briefData, setBriefData] = useState<any>(null)
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['overview']))

  useEffect(() => {
    let active = true

    async function loadBrief() {
      // 1. Check client-side cache
      if (briefCache.has(deal.id)) {
        setBriefData(briefCache.get(deal.id))
        setLoading(false)
        return
      }

      // 2. Check summary prop
      const parsedFromProp = tryParseBrief(summary)
      if (parsedFromProp) {
        setBriefData(parsedFromProp)
        briefCache.set(deal.id, parsedFromProp)
        setLoading(false)
        return
      }

      setLoading(true)
      setError(null)

      try {
        let summaryObj = null
        try {
          const currentRes = await summaryAPI.getCurrent(deal.id)
          summaryObj = currentRes.data
        } catch (fetchErr: any) {
          if (fetchErr.response?.status !== 404) {
            throw fetchErr
          }
        }

        let parsed = tryParseBrief(summaryObj)

        if (parsed) {
          if (active) {
            setBriefData(parsed)
            briefCache.set(deal.id, parsed)
            setLoading(false)
          }
          return
        }

        // 3. Generate summary
        const genRes = await summaryAPI.generate(deal.id)
        const genSummaryObj = genRes.data
        parsed = tryParseBrief(genSummaryObj)

        if (parsed) {
          if (active) {
            setBriefData(parsed)
            briefCache.set(deal.id, parsed)
            setLoading(false)
          }
        } else {
          throw new Error('Failed to parse newly generated brief')
        }
      } catch (err: any) {
        console.error('Error loading brief:', err)
        if (active) {
          setError(err.message || 'Failed to load deal brief')
          setLoading(false)
        }
      }
    }

    loadBrief()

    return () => {
      active = false
    }
  }, [deal.id, summary])

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev)
      if (next.has(section)) {
        next.delete(section)
      } else {
        next.add(section)
      }
      return next
    })
  }

  if (loading) {
    return <BriefSkeleton />
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        <p className="font-semibold mb-1">Failed to load deal brief</p>
        <p className="text-xs text-red-600">{error}</p>
        <button
          onClick={() => {
            // Trigger refresh
            briefCache.delete(deal.id)
            setLoading(true)
            setError(null)
            summaryAPI.generate(deal.id)
              .then((res) => {
                const parsed = tryParseBrief(res.data)
                if (parsed) {
                  setBriefData(parsed)
                  briefCache.set(deal.id, parsed)
                  setLoading(false)
                } else {
                  throw new Error('Could not parse brief')
                }
              })
              .catch((err) => {
                setError(err.message || 'Failed to regenerate brief')
                setLoading(false)
              })
          }}
          className="mt-2.5 inline-flex items-center justify-center px-3 py-1.5 border border-red-300 rounded-md text-xs font-medium bg-white hover:bg-gray-50 text-red-700"
        >
          Try Regenerating Brief
        </button>
      </div>
    )
  }

  if (!briefData) {
    return null
  }

  return (
    <div className="space-y-4">
      {/* 1. Overview */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <button
          onClick={() => toggleSection('overview')}
          className="w-full flex items-center justify-between px-6 py-4 bg-gray-50/50 hover:bg-gray-50 cursor-pointer text-left focus:outline-none"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0" style={{ backgroundColor: '#3B82F6' }}>
              <FileText className="w-5 h-5" />
            </div>
            <span className="font-semibold text-gray-900" style={{ fontFamily: 'var(--font-serif)' }}>Overview</span>
          </div>
          {expandedSections.has('overview') ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
        </button>
        
        {expandedSections.has('overview') && (
          <div className="px-6 py-4 border-t border-gray-200 text-sm text-gray-700 leading-relaxed">
            {briefData.overview}
          </div>
        )}
      </div>

      {/* 2. Key Discussion Points */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <button
          onClick={() => toggleSection('discussion')}
          className="w-full flex items-center justify-between px-6 py-4 bg-gray-50/50 hover:bg-gray-50 cursor-pointer text-left focus:outline-none"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0" style={{ backgroundColor: '#7C3AED' }}>
              <MessageSquare className="w-5 h-5" />
            </div>
            <span className="font-semibold text-gray-900" style={{ fontFamily: 'var(--font-serif)' }}>Key Discussion Points</span>
          </div>
          {expandedSections.has('discussion') ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
        </button>
        
        {expandedSections.has('discussion') && (
          <div className="px-6 py-4 border-t border-gray-200 space-y-3">
            {briefData.keyDiscussionPoints?.map((pt: string, i: number) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-lg" style={{ backgroundColor: '#F9FAFB', border: '1px solid #F3F4F6' }}>
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-violet-500" />
                <p className="text-sm text-gray-700">{pt}</p>
              </div>
            ))}
            {(!briefData.keyDiscussionPoints || briefData.keyDiscussionPoints.length === 0) && (
              <p className="text-sm text-gray-500 italic">No key discussion points recorded.</p>
            )}
          </div>
        )}
      </div>

      {/* 3. Customer Needs & Goals */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <button
          onClick={() => toggleSection('needs')}
          className="w-full flex items-center justify-between px-6 py-4 bg-gray-50/50 hover:bg-gray-50 cursor-pointer text-left focus:outline-none"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0" style={{ backgroundColor: '#0D9488' }}>
              <Target className="w-5 h-5" />
            </div>
            <span className="font-semibold text-gray-900" style={{ fontFamily: 'var(--font-serif)' }}>Customer Needs & Goals</span>
          </div>
          {expandedSections.has('needs') ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
        </button>
        
        {expandedSections.has('needs') && (
          <div className="px-6 py-4 border-t border-gray-200 space-y-3">
            {briefData.customerNeeds?.map((need: any, i: number) => (
              <div key={i} className="p-4 rounded-lg" style={{ backgroundColor: '#EFF6FF', border: '1px solid #DBEAFE' }}>
                <h4 className="text-sm font-semibold mb-1" style={{ color: '#1D4ED8' }}>{need.title}</h4>
                <p className="text-sm" style={{ color: '#4B5563' }}>{need.description}</p>
              </div>
            ))}
            {(!briefData.customerNeeds || briefData.customerNeeds.length === 0) && (
              <p className="text-sm text-gray-500 italic">No customer needs recorded.</p>
            )}
          </div>
        )}
      </div>

      {/* 4. Risks & Objections */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <button
          onClick={() => toggleSection('risks')}
          className="w-full flex items-center justify-between px-6 py-4 bg-gray-50/50 hover:bg-gray-50 cursor-pointer text-left focus:outline-none"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0" style={{ backgroundColor: '#F59E0B' }}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <span className="font-semibold text-gray-900" style={{ fontFamily: 'var(--font-serif)' }}>Risks & Objections</span>
          </div>
          {expandedSections.has('risks') ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
        </button>
        
        {expandedSections.has('risks') && (
          <div className="px-6 py-4 border-t border-gray-200 space-y-3">
            {briefData.risks?.map((risk: any, i: number) => (
              <div key={i} className="flex items-start gap-3 p-4 rounded-lg" style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A' }}>
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#D97706' }} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-semibold" style={{ color: '#D97706' }}>{risk.title}</h4>
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize"
                      style={{
                        backgroundColor: risk.severity === 'high' ? '#FEE2E2' : risk.severity === 'medium' ? '#FEF3C7' : '#DBEAFE',
                        color: risk.severity === 'high' ? '#DC2626' : risk.severity === 'medium' ? '#B45309' : '#1D4ED8',
                      }}
                    >
                      {risk.severity}
                    </span>
                  </div>
                  <p className="text-sm" style={{ color: '#6B7280' }}>{risk.description}</p>
                </div>
              </div>
            ))}
            {(!briefData.risks || briefData.risks.length === 0) && (
              <p className="text-sm text-gray-500 italic">No risks identified.</p>
            )}
          </div>
        )}
      </div>

      {/* 5. Decisions & Commitments */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <button
          onClick={() => toggleSection('commitments')}
          className="w-full flex items-center justify-between px-6 py-4 bg-gray-50/50 hover:bg-gray-50 cursor-pointer text-left focus:outline-none"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0" style={{ backgroundColor: '#10B981' }}>
              <CheckCircle className="w-5 h-5" />
            </div>
            <span className="font-semibold text-gray-900" style={{ fontFamily: 'var(--font-serif)' }}>Decisions & Commitments</span>
          </div>
          {expandedSections.has('commitments') ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
        </button>
        
        {expandedSections.has('commitments') && (
          <div className="px-6 py-4 border-t border-gray-200 space-y-3">
            {briefData.commitments?.map((com: any, i: number) => (
              <div key={i} className="flex items-start gap-3 p-4 rounded-lg" style={{ backgroundColor: '#F0FDF4', border: '1px solid #D1FAE5' }}>
                <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#10B981' }} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize"
                      style={{
                        backgroundColor: com.assigneeType === 'rep' ? '#EFF6FF' : '#EDE9FE',
                        color: com.assigneeType === 'rep' ? '#3B82F6' : '#6D28D9',
                      }}
                    >
                      {com.assigneeType === 'rep' ? 'Me' : 'Customer'}
                    </span>
                    <span className="text-xs" style={{ color: '#9CA3AF' }}>{com.dueDate}</span>
                  </div>
                  <p className="text-sm text-gray-700">{com.description}</p>
                </div>
              </div>
            ))}
            {(!briefData.commitments || briefData.commitments.length === 0) && (
              <p className="text-sm text-gray-500 italic">No decisions or commitments recorded.</p>
            )}
          </div>
        )}
      </div>

      {/* 6. Key Stakeholders */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <button
          onClick={() => toggleSection('stakeholders')}
          className="w-full flex items-center justify-between px-6 py-4 bg-gray-50/50 hover:bg-gray-50 cursor-pointer text-left focus:outline-none"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0" style={{ backgroundColor: '#EC4899' }}>
              <Users className="w-5 h-5" />
            </div>
            <span className="font-semibold text-gray-900">Key Stakeholders</span>
          </div>
          {expandedSections.has('stakeholders') ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
        </button>
        
        {expandedSections.has('stakeholders') && (
          <div className="px-6 py-4 border-t border-gray-200 divide-y divide-gray-100">
            {briefData.stakeholders?.map((sh: any, i: number) => (
              <div key={i} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white shrink-0"
                  style={{
                    backgroundColor: sh.avatarInitials?.charCodeAt(0) % 3 === 0 ? '#10B981' : sh.avatarInitials?.charCodeAt(0) % 3 === 1 ? '#3B82F6' : '#8B5CF6',
                  }}
                >
                  {sh.avatarInitials}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">{sh.name}</h4>
                  <p className="text-xs text-gray-500">{sh.title} • {sh.company}</p>
                </div>
              </div>
            ))}
            {(!briefData.stakeholders || briefData.stakeholders.length === 0) && (
              <p className="text-sm text-gray-500 italic">No stakeholders mapped.</p>
            )}
          </div>
        )}
      </div>

      {/* 7. Recent Activity Context */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <button
          onClick={() => toggleSection('activity')}
          className="w-full flex items-center justify-between px-6 py-4 bg-gray-50/50 hover:bg-gray-50 cursor-pointer text-left focus:outline-none"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0" style={{ backgroundColor: '#F97316' }}>
              <ActivityIcon className="w-5 h-5" />
            </div>
            <span className="font-semibold text-gray-900">Recent Activity Context</span>
          </div>
          {expandedSections.has('activity') ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
        </button>
        
        {expandedSections.has('activity') && (
          <div className="px-6 py-4 border-t border-gray-200 divide-y divide-gray-100">
            {briefData.activityContext?.map((act: any, i: number) => (
              <div key={i} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                <span
                  className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize mt-0.5 shrink-0"
                  style={{
                    backgroundColor: act.type === 'email' ? '#EFF6FF' : act.type === 'call' ? '#FEF3C7' : '#E9D5FF',
                    color: act.type === 'email' ? '#3B82F6' : act.type === 'call' ? '#D97706' : '#6B7280',
                  }}
                >
                  {act.type}
                </span>
                <div className="flex-1">
                  <p className="text-sm text-gray-700 leading-tight">{act.description}</p>
                  <span className="text-xs text-gray-400 mt-1 block">{act.date}</span>
                </div>
              </div>
            ))}
            {(!briefData.activityContext || briefData.activityContext.length === 0) && (
              <p className="text-sm text-gray-500 italic">No recent activities found.</p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// WARNINGS TAB
// ─────────────────────────────────────────────────────────────────────────────
function WarningsTab({ deal, warnings }: any) {
  const queryClient = useQueryClient()
  const [dismissedLocal, setDismissedLocal] = useState<string[]>([])

  const resolveWarning = useMutation(
    (warningId: string) => warningAPI.resolve(deal.id, warningId, { resolution: 'Resolved' }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['warnings', deal.id])
        toast.success('Warning resolved')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Unable to resolve warning')
      },
    }
  )

  useEffect(() => {
    setDismissedLocal([])
  }, [deal.id])

  const daysSinceActivity = deal.lastActivityAt
    ? Math.floor((Date.now() - new Date(deal.lastActivityAt).getTime()) / 86400000)
    : 0

  const fallbackWarnings = [
    daysSinceActivity > 7 && {
      id: 'no-activity',
      title: `No activity — ${daysSinceActivity} days`,
      severity: 'HIGH',
      message: `No calls or emails since ${formatDate(deal.lastActivityAt)}. Threshold for ${label(deal.stage)} stage: 7 days.`,
      action: 'Schedule a call now',
      localOnly: true,
    },
    deal.crmData?.decisionMakerEngaged === 'No' && {
      id: 'decision-maker',
      title: 'Decision maker not engaged',
      severity: 'HIGH',
      message: 'CFO has not appeared on any recorded interaction. Only manager-level contacts engaged.',
      action: 'Find CFO contact',
      localOnly: true,
    },
    deal.closeDate && new Date(deal.closeDate) < new Date() && {
      id: 'close-date',
      title: 'Close date in the past',
      severity: 'HIGH',
      message: `CRM close date was ${formatDate(deal.closeDate)}. Deal is still open. Update or escalate.`,
      action: 'Update close date',
      localOnly: true,
    },
    deal.isHighRisk && {
      id: 'high-risk',
      title: deal.riskReason || 'Risk score requires attention',
      severity: 'HIGH',
      message: 'AI score and engagement signals indicate this deal needs immediate attention.',
      action: 'Review deal',
      localOnly: true,
    },
  ].filter(Boolean) as any[]

  const warningItems = (
    warnings?.length > 0 ? warnings : fallbackWarnings
  ).filter((w: any) => !dismissedLocal.includes(w.id))

  const markDone = (warning: any) => {
    if (warning.localOnly || !warning.dealId) {
      setDismissedLocal((prev) => [...prev, warning.id])
      toast.success('Warning marked as done')
      return
    }
    resolveWarning.mutate(warning.id)
  }

  return (
    <div className="space-y-4">
      {warningItems.length === 0 && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5 text-sm text-emerald-800">
          ✓ No active warnings for this deal.
        </div>
      )}

      {warningItems.map((warning: any) => (
        <div key={warning.id} className="rounded-lg border border-gray-200 bg-white p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="flex-1">
              <h3 className="text-base font-semibold text-gray-950">
                {warning.title || warning.type}
              </h3>
              <p className="mt-2 text-sm leading-6 text-gray-600">
                {warning.message}
              </p>
            </div>
            <span
              className={`shrink-0 rounded-md px-2.5 py-1 text-[11px] font-bold ${
                (warning.severity || 'HIGH') === 'HIGH'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-amber-100 text-amber-700'
              }`}
            >
              {warning.severity || 'HIGH'}
            </span>
          </div>

          <div className="flex gap-3">
            <button className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-gray-800">
              {warning.action || warning.recommendedAction || 'Review'}
            </button>
            <button
              onClick={() => markDone(warning)}
              disabled={resolveWarning.isLoading}
              className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Mark as done
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// PLAYBOOK TAB
// ─────────────────────────────────────────────────────────────────────────────
function PlaybookTab({ deal, playbook }: any) {
  const queryClient = useQueryClient()
  const [localCompleted, setLocalCompleted] = useState<Record<string, boolean>>({})
  const playbookData = playbook?.[0]

  const fallbackItems = [
    {
      id: 'metrics',
      criterion: 'Metrics',
      status: 'COMPLETED',
      question: 'What are the quantifiable business metrics driving this purchase?',
      notes: 'Increase sales productivity by 30%, reduce sales cycle by 2 weeks',
      localOnly: true,
    },
    {
      id: 'economic-buyer',
      criterion: 'Economic Buyer',
      status: 'NOT_STARTED',
      question: 'Who has budget authority and final approval?',
      notes:
        deal.crmData?.decisionMakerEngaged === 'Yes'
          ? 'Decision maker confirmed'
          : 'Robert Davis (CFO) — meeting scheduled',
      aiSuggestion: 'Confirm budget amount and approval timeline in upcoming CFO meeting',
      localOnly: true,
    },
    {
      id: 'decision-criteria',
      criterion: 'Decision Criteria',
      status: 'IN_PROGRESS',
      question: 'What criteria will they use to make their decision?',
      notes: deal.crmData?.primaryProduct
        ? `Primary product: ${deal.crmData.primaryProduct}`
        : 'To be confirmed in next call',
      localOnly: true,
    },
    {
      id: 'decision-process',
      criterion: 'Decision Process',
      status: 'NOT_STARTED',
      question: 'What is their internal buying process?',
      notes: 'Pending stakeholder mapping',
      localOnly: true,
    },
    {
      id: 'identify-pain',
      criterion: 'Identify Pain',
      status: 'COMPLETED',
      question: 'What business pain are they trying to solve?',
      notes: deal.riskReason || 'Operational inefficiencies, slow deal cycles',
      localOnly: true,
    },
    {
      id: 'champion',
      criterion: 'Champion',
      status: 'IN_PROGRESS',
      question: 'Who is your internal champion?',
      notes: deal.ownerName ? `Deal owner: ${deal.ownerName}` : 'Identifying champion',
      localOnly: true,
    },
  ]

  const rawItems = playbookData?.items?.length ? playbookData.items : fallbackItems
  const items = rawItems.map((item: any) => {
    const localOverride = localCompleted[item.id]
    return {
      ...item,
      completed:
        localOverride !== undefined
          ? localOverride
          : item.completed || item.status === 'COMPLETED',
    }
  })

  const completedCount = items.filter((i: any) => i.completed).length
  const completion = items.length ? Math.round((completedCount / items.length) * 100) : 0

  useEffect(() => {
    setLocalCompleted({})
  }, [deal.id, playbookData?.type])

  const updatePlaybookItem = useMutation(
    ({ item, completed }: { item: any; completed: boolean }) =>
      playbookAPI.updateItem(deal.id, item.id, {
        status: completed ? 'COMPLETED' : 'IN_PROGRESS',
        notes: item.notes || item.note || '',
      }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['playbook', deal.id])
        toast.success('Playbook updated')
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || 'Unable to update playbook')
      },
    }
  )

  const toggleItem = (item: any) => {
    const completed = !item.completed
    setLocalCompleted((prev) => ({ ...prev, [item.id]: completed }))
    if (!item.localOnly && item.dealId) {
      updatePlaybookItem.mutate({ item, completed })
    }
  }

  return (
    <div className="space-y-5">
      {/* Progress Card */}
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-950">MEDDIC Framework</h3>
          <span className="text-sm text-gray-500">
            {completedCount} of {items.length} complete
          </span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-gray-200">
          <div
            className="h-full rounded-full bg-blue-500 transition-all duration-500"
            style={{ width: `${completion}%` }}
          />
        </div>
        <div className="mt-2 text-right text-lg font-bold text-gray-950">
          {completion}%{' '}
          <span className="text-sm font-normal text-gray-500">Score</span>
        </div>
      </div>

      {/* Playbook Items */}
      {items.map((item: any) => (
        <div
          key={item.id}
          className={`rounded-lg border p-5 transition-colors ${
            item.completed
              ? 'border-emerald-200 bg-emerald-50/50'
              : 'border-gray-200 bg-white'
          }`}
        >
          <div className="flex gap-4">
            {/* Checkbox */}
            <button
              type="button"
              onClick={() => toggleItem(item)}
              disabled={updatePlaybookItem.isLoading}
              className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-md border-2 transition-colors ${
                item.completed
                  ? 'border-emerald-500 bg-emerald-500 text-white'
                  : 'border-gray-300 bg-white text-transparent'
              }`}
            >
              <CheckSquare className="h-4 w-4" />
            </button>

            <div className="flex-1 min-w-0">
              <div
                className={`mb-1 text-[11px] font-bold uppercase tracking-[0.1em] ${
                  item.completed ? 'text-emerald-600' : 'text-gray-400'
                }`}
              >
                {item.criterion}
              </div>
              <div className="text-sm font-medium text-gray-950">
                {item.question || item.criterion}
              </div>
              <div className="mt-3 rounded-md bg-gray-100 px-3 py-2.5 text-sm text-gray-700">
                {item.notes || item.note || 'No note captured yet'}
              </div>
              {(item.aiSuggestion || item.suggestion) && (
                <div className="mt-3 rounded-md border border-violet-200 bg-violet-50 p-3 text-sm text-violet-800">
                  <div className="mb-1.5 flex items-center gap-2 text-xs font-bold uppercase text-violet-700">
                    <Lightbulb className="h-3.5 w-3.5" />
                    AI Suggested Note
                  </div>
                  {item.aiSuggestion || item.suggestion}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// ACTIVITY TAB
// ─────────────────────────────────────────────────────────────────────────────
function ActivityTab({ deal, timeline, activities: allActivities }: any) {
  const datasetTotals = {
    CALL: Number(deal.crmData?.totalCalls || 0),
    EMAIL: Number(deal.crmData?.totalEmails || 0),
    MEETING: Number(deal.crmData?.totalMeetings || 0),
  }
  const totalInteractions =
    datasetTotals.CALL + datasetTotals.EMAIL + datasetTotals.MEETING

  // Resolve activities list
  const activities: any[] = allActivities?.length
    ? allActivities
    : timeline?.activities?.length
    ? timeline.activities
    : [
        {
          id: 'fallback-1',
          type: 'CALL',
          subject: 'Quick Update',
          summary: deal.nextStep || 'Status update call',
          activityDate: deal.lastActivityAt || new Date(),
          durationMinutes: 10,
        },
      ]

  const sortedActivities = [...activities].sort(
    (a, b) =>
      new Date(a.activityDate || a.createdAt || 0).getTime() -
      new Date(b.activityDate || b.createdAt || 0).getTime()
  )

  // Timeline date labels
  const dates = sortedActivities
    .map((a) => new Date(a.activityDate || a.createdAt))
    .filter((d) => !isNaN(d.getTime()))

  const startDate = dates[0] || new Date(deal.lastActivityAt || Date.now())
  const endDate = dates[dates.length - 1] || startDate
  const span = Math.max(1, endDate.getTime() - startDate.getTime())

  const timelineLabels = [0, 1, 2, 3].map((step) => {
    const d = new Date(startDate.getTime() + (span * step) / 3)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()
  })

  // Dot positions
  const dotsToShow = sortedActivities.slice(0, 16)

  function dotColor(type: string) {
    const t = String(type || '').toUpperCase()
    if (t === 'CALL') return 'bg-pink-500'
    if (t === 'EMAIL') return 'bg-violet-500'
    if (t === 'MEETING') return 'bg-emerald-500'
    return 'bg-gray-400'
  }

  // Group activities for the detail section
  const grouped = [
    { type: 'CALL', label: 'Calls', color: 'bg-pink-500', badge: 'bg-pink-50 text-pink-700', total: datasetTotals.CALL },
    { type: 'EMAIL', label: 'Emails', color: 'bg-violet-500', badge: 'bg-violet-50 text-violet-700', total: datasetTotals.EMAIL },
    { type: 'MEETING', label: 'Meetings', color: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700', total: datasetTotals.MEETING },
  ]
    .map((group) => ({
      ...group,
      items: sortedActivities
        .filter((a) => String(a.type || '').toUpperCase() === group.type)
        .reverse()
        .slice(0, 5),
    }))
    .filter((g) => g.items.length > 0 || g.total > 0)

  return (
    <div className="space-y-6">
      {/* Timeline */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-950">Activity Timeline</h3>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-pink-500" />
              Calls
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-violet-500" />
              Emails
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              Meetings
            </span>
          </div>
        </div>

        <div className="rounded-lg border-2 border-blue-500 bg-white p-6">
          <div className="relative" style={{ height: '72px' }}>
            {/* Date labels */}
            <div className="grid grid-cols-4 text-center text-[10px] font-bold uppercase text-gray-400">
              {timelineLabels.map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>

            {/* Single timeline row with all dots */}
            <div className="absolute left-0 right-0" style={{ top: '46px' }}>
              <div className="relative h-[2px] bg-gray-200 mx-4">
                {dotsToShow.map((a, i, arr) => {
                    const date = new Date(a.activityDate || a.createdAt)
                    const dateTime = date.getTime()
                    const pct =
                      span > 0
                        ? ((dateTime - startDate.getTime()) / span) * 100
                        : i * (100 / Math.max(1, arr.length - 1))
                    return (
                      <span
                        key={a.id || i}
                        title={`${label(a.type)}: ${a.subject || 'Activity'}`}
                        className={`absolute h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-white ${dotColor(a.type)} cursor-pointer hover:scale-125 transition-transform`}
                        style={{ left: `${Math.max(2, Math.min(98, pct))}%` }}
                      />
                    )
                  })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Details */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-bold text-gray-950">Activity Details</h3>
          <span className="text-sm text-gray-500">
            {totalInteractions || activities.length} interactions
          </span>
        </div>

        <div className="space-y-3">
          {activities
            .slice()
            .reverse()
            .slice(0, 20)
            .map((activity: any, i) => {
              const tone = activityTone(activity)
              return (
                <div
                  key={activity.id || i}
                  className="flex items-start gap-3 rounded-lg bg-gray-50 p-4"
                >
                  <span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${tone.dot}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-gray-900">
                          {activity.subject || label(activity.type) || 'Activity'}
                        </div>
                        <div className="mt-0.5 text-xs text-gray-500">
                          {activity.summary ||
                            activity.crmData?.body ||
                            `${label(activity.type)} activity`}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <Clock className="h-3 w-3" />
                          {activity.durationMinutes || 5}min
                        </div>
                        <div className="mt-0.5 flex items-center gap-1 text-xs text-gray-400">
                          <Calendar className="h-3 w-3" />
                          {formatDate(activity.activityDate || activity.createdAt)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
        </div>

        {/* Show aggregate stats if no individual activities */}
        {activities.length === 0 && totalInteractions > 0 && (
          <div className="space-y-2">
            {grouped.map((g) =>
              g.total > 0 ? (
                <div
                  key={g.type}
                  className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3"
                >
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 rounded-full ${g.color}`} />
                    <span className="text-sm font-medium text-gray-800">{g.label}</span>
                  </div>
                  <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${g.badge}`}>
                    {g.total} total
                  </span>
                </div>
              ) : null
            )}
          </div>
        )}
      </section>
    </div>
  )
}

function activityTone(activity: any) {
  const type = String(activity.type || '').toUpperCase()
  if (type === 'EMAIL') return { dot: 'bg-violet-500' }
  if (type === 'CALL') return { dot: 'bg-pink-500' }
  if (type === 'MEETING') return { dot: 'bg-emerald-500' }
  if (type === 'TASK') return { dot: 'bg-amber-500' }
  return { dot: 'bg-gray-400' }
}

// ─────────────────────────────────────────────────────────────────────────────
// UPDATE CRM TAB
// ─────────────────────────────────────────────────────────────────────────────
function UpdateCRMTab({ deal, onDealUpdated, board }: any) {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const userRole = user?.role || 'USER'
  const boardPermission = board?.userPermission
  const canEdit =
    userRole === 'ADMIN' ||
    userRole === 'MANAGER' ||
    boardPermission === 'EDITOR' ||
    boardPermission === 'ADMIN'

  const [stage, setStage] = useState(deal.stage)
  const [nextStep, setNextStep] = useState(deal.nextStep || '')
  const [amount, setAmount] = useState(String(deal.amount || ''))
  const [closeDate, setCloseDate] = useState(
    deal.closeDate ? new Date(deal.closeDate).toISOString().split('T')[0] : ''
  )

  useEffect(() => {
    setStage(deal.stage)
    setNextStep(deal.nextStep || '')
    setAmount(String(deal.amount || ''))
    setCloseDate(deal.closeDate ? new Date(deal.closeDate).toISOString().split('T')[0] : '')
  }, [deal.id])

  const updateDeal = useMutation(
    () =>
      dealAPI.updateDeal(deal.id, {
        stage,
        nextStep,
        amount: amount ? parseFloat(amount) : undefined,
        closeDate: closeDate || undefined,
      }),
    {
      onSuccess: (response) => {
        onDealUpdated?.(response.data)
        window.dispatchEvent(new CustomEvent('dealUpdated', { 
          detail: { 
            title: 'Deal Updated ✏️', 
            message: `Deal "${deal.name}" has been updated.` 
          } 
        }))
        queryClient.invalidateQueries('deals')
        queryClient.invalidateQueries(['deals', 'board-preview'])
        queryClient.invalidateQueries(['summary', deal.id])
        queryClient.invalidateQueries(['warnings', deal.id])
        toast.success('Changes saved & synced to HubSpot ✓', { duration: 4000 })
      },
      onError: (error: any) => {
        const msg = error.response?.data?.message || 'Unable to sync update to HubSpot'
        toast.error(msg, { duration: 6000 })
      },
    }
  )

  const isDirty =
    stage !== deal.stage ||
    nextStep !== (deal.nextStep || '') ||
    amount !== String(deal.amount || '') ||
    closeDate !== (deal.closeDate ? new Date(deal.closeDate).toISOString().split('T')[0] : '')

  return (
    <div className="space-y-6">
      {/* Premium Lock Banner if restricted */}
      {!canEdit && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3.5 text-sm text-red-950 shadow-sm animate-pulse">
          <Lock className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
          <div className="flex-1">
            <span className="font-semibold block text-red-900">CRM Field Restrictions Active</span>
            <span className="text-red-700 text-xs">
              This deal board has restricted edit access to Viewer-only for standard users. Standard edits are disabled.
            </span>
          </div>
        </div>
      )}

      {/* Info Banner */}
      <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3.5 text-sm text-amber-900">
        <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
        <span>
          Update key deal fields to keep your CRM current. Changes sync automatically to HubSpot.
        </span>
      </div>

      {/* Stage */}
      <div>
        <label className="mb-2 block text-sm font-semibold text-gray-800">Stage</label>
        <div className="relative">
          <select
            value={stage}
            onChange={(e) => setStage(e.target.value)}
            disabled={!canEdit}
            className="h-12 w-full appearance-none rounded-lg border border-gray-300 bg-white px-4 pr-10 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-50 disabled:text-gray-500"
          >
            {stageOptions.map((opt) => (
              <option key={opt} value={opt}>
                {label(opt)}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-3 top-3.5 text-gray-400">▾</span>
        </div>
      </div>

      {/* Next Step */}
      <div>
        <label className="mb-2 block text-sm font-semibold text-gray-800">Next Step</label>
        <textarea
          value={nextStep}
          onChange={(e) => setNextStep(e.target.value)}
          disabled={!canEdit}
          placeholder="Describe the next action for this deal..."
          className="h-28 w-full resize-none rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-50 disabled:text-gray-500"
        />
      </div>

      {/* Amount */}
      <div>
        <label className="mb-2 block text-sm font-semibold text-gray-800">Deal Amount ($)</label>
        <input
          type="number"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          disabled={!canEdit}
          placeholder="0"
          className="h-12 w-full rounded-lg border border-gray-300 px-4 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-50 disabled:text-gray-500"
        />
      </div>

      {/* Close Date */}
      <div>
        <label className="mb-2 block text-sm font-semibold text-gray-800">Close Date</label>
        <input
          type="date"
          value={closeDate}
          onChange={(e) => setCloseDate(e.target.value)}
          disabled={!canEdit}
          className="h-12 w-full rounded-lg border border-gray-300 px-4 text-sm text-gray-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-gray-50 disabled:text-gray-500"
        />
      </div>

      {/* Save Button */}
      <button
        onClick={() => updateDeal.mutate()}
        disabled={!canEdit || updateDeal.isLoading || !isDirty}
        className="h-12 w-full rounded-lg bg-blue-600 text-sm font-semibold text-white transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {updateDeal.isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Saving & syncing to HubSpot...
          </span>
        ) : (
          'Save Changes'
        )}
      </button>

      {canEdit && !isDirty && (
        <p className="text-center text-xs text-gray-400">No changes to save</p>
      )}
    </div>
  )
}
