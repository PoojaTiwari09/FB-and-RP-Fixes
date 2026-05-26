import { useState } from 'react'
import { useAuthStore } from '../stores/authStore'
import { exportAPI } from '../lib/api'
import {
  Download,
  FileSpreadsheet,
  FileText,
  Loader2,
  TrendingUp,
  Users,
  ShieldAlert,
  Calendar,
  Layers,
  CheckCircle2,
  Lock,
  X,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-react'

interface ExportCard {
  title: string
  description: string
  formats: ('CSV' | 'PDF' | 'EXCEL')[]
  type: string
  IconComp: any
  persona: 'Executive' | 'Manager' | 'Sales Rep'
  colorClass: string
  bgClass: string
  previewDetails: string[]
  badgeClass: string
}

export default function ExportsPage() {
  const { user } = useAuthStore()
  const userRole = user?.role || 'USER'

  const [exporting, setExporting] = useState<string | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [openCardIdx, setOpenCardIdx] = useState<number | null>(null)

  const handleExport = async (type: string, format: 'CSV' | 'PDF' | 'EXCEL', cardTitle: string) => {
    const key = `${type}-${format}`
    try {
      setExporting(key)
      setMessage(null)

      if (type === 'FORECAST_SUMMARY') {
        await exportAPI.exportForecastSummary(format as any)
      } else if (type === 'TOP_RISK_DEALS') {
        await exportAPI.exportTopRiskDeals(format as any)
      } else if (type === 'TEAM_DIAGNOSTICS') {
        await exportAPI.exportTeamDiagnostics(format as any)
      } else if (type === 'ANALYTICS_REPORT') {
        await exportAPI.exportAnalyticsReport(format as any)
      } else if (type === 'ACTIVITIES') {
        await exportAPI.createAndDownload({ format: format as any, type: 'ACTIVITIES' })
      } else if (type === 'BOARD') {
        await exportAPI.createAndDownload({ format: format as any, type: 'BOARD', boardId: 'default' })
      } else {
        await exportAPI.createAndDownload({ format: format as any, type: type as any })
      }

      setMessage({
        type: 'success',
        text: `✅ ${cardTitle} exported as ${format}! Your download has started.`,
      })
    } catch (err: any) {
      console.error(err)
      setMessage({
        type: 'error',
        text: err?.response?.data?.message || err?.message || `Failed to export ${cardTitle}.`,
      })
    } finally {
      setExporting(null)
    }
  }

  const exportCards: ExportCard[] = [
    {
      title: 'Forecast Summary Report',
      description: 'Full executive rollup of commit vs target values, gap analysis, and forecast categories breakdown.',
      formats: ['PDF', 'CSV'],
      type: 'FORECAST_SUMMARY',
      IconComp: TrendingUp,
      persona: 'Executive',
      colorClass: 'text-indigo-600',
      bgClass: 'bg-indigo-50',
      badgeClass: 'bg-indigo-100 text-indigo-800',
      previewDetails: [
        '📊 Total Commit value vs Revenue Target',
        '📉 Gap-to-Target with percentage deviation',
        '🔴 % At-Risk metric for active pipeline',
        '📋 Deal counts by Forecast Category (Commit / Best Case / Pipeline)',
        '🤖 Average AI Health Score across all deals',
        '📅 Period: Current Quarter',
      ],
    },
    {
      title: 'Top Risk Deals List',
      description: 'Prioritized list of deals exhibiting critical AI warning flags or low overall AI health scores.',
      formats: ['CSV'],
      type: 'TOP_RISK_DEALS',
      IconComp: ShieldAlert,
      persona: 'Executive',
      colorClass: 'text-red-600',
      bgClass: 'bg-red-50',
      badgeClass: 'bg-red-100 text-red-800',
      previewDetails: [
        '🚨 Deal Name, Owner, and Stage',
        '💰 Deal Amount and close date',
        '🤖 AI Risk Score (< 50 = At Risk)',
        '⚠️ Primary Risk Reason per deal',
        '🎯 Risk Level: HIGH / MEDIUM / LOW',
        '📌 Warning count per deal',
      ],
    },
    {
      title: 'Full Analytics Digest',
      description: 'Comprehensive report containing pipeline trends, deal velocities, and key deal diagnostic charts.',
      formats: ['PDF'],
      type: 'ANALYTICS_REPORT',
      IconComp: FileText,
      persona: 'Executive',
      colorClass: 'text-blue-600',
      bgClass: 'bg-blue-50',
      badgeClass: 'bg-blue-100 text-blue-800',
      previewDetails: [
        '📈 Total Pipeline Value & Deal Count',
        '🤖 Average AI Deal Score across portfolio',
        '🔴 At-Risk deal count and breakdown',
        '💰 High-Value deals (> $100K)',
        '📊 Deals grouped by Stage',
        '📋 Deals grouped by Forecast Category',
        '⚠️ Top 10 active AI warnings',
      ],
    },
    {
      title: 'Reps Performance Diagnostics',
      description: 'Diagnostic data per rep: pipeline, deal sizes, AI scores, and risk counts.',
      formats: ['CSV'],
      type: 'TEAM_DIAGNOSTICS',
      IconComp: Users,
      persona: 'Manager',
      colorClass: 'text-green-600',
      bgClass: 'bg-green-50',
      badgeClass: 'bg-green-100 text-green-800',
      previewDetails: [
        '👤 Rep Name and ID',
        '📦 Total Deal Count per rep',
        '💵 Total Pipeline Value per rep',
        '🤖 Average AI Score per rep',
        '🔴 At-Risk Deal Count',
        '🏆 Highest Value Deal',
        '📉 Lowest AI Score (risk indicator)',
      ],
    },
    {
      title: 'Coaching Activity Log',
      description: 'History of assigned coaching tasks, escalations, and resolution timelines per rep.',
      formats: ['CSV'],
      type: 'COACHING_ACTIVITY',
      IconComp: CheckCircle2,
      persona: 'Manager',
      colorClass: 'text-purple-600',
      bgClass: 'bg-purple-50',
      badgeClass: 'bg-purple-100 text-purple-800',
      previewDetails: [
        '📋 Task ID and Deal ID',
        '👤 Assigned By (Manager) → Assigned To (Rep)',
        '📝 Task Description and Priority',
        '📅 Due Date and Completion Date',
        '✅ Status: Pending / Completed / Overdue',
        '🕐 Created timestamp',
      ],
    },
    {
      title: 'My Board Deals Export',
      description: 'Export your active board deals with all columns and locked filters applied.',
      formats: ['CSV', 'PDF'],
      type: 'BOARD',
      IconComp: FileSpreadsheet,
      persona: 'Sales Rep',
      colorClass: 'text-amber-600',
      bgClass: 'bg-amber-50',
      badgeClass: 'bg-amber-100 text-amber-800',
      previewDetails: [
        '🏷️ Deal Name, Stage, and Forecast Category',
        '💰 Deal Amount and Close Date',
        '👤 Owner Name and CRM Account',
        '🤖 AI Score and Risk Level',
        '⚠️ Warning Count',
        '📅 Last Activity Date',
        '📌 Next Step',
      ],
    },
    {
      title: 'Activities Timeline',
      description: 'Chronological timeline of calls, emails, and meetings against pipeline deals.',
      formats: ['CSV'],
      type: 'ACTIVITIES',
      IconComp: Calendar,
      persona: 'Sales Rep',
      colorClass: 'text-teal-600',
      bgClass: 'bg-teal-50',
      badgeClass: 'bg-teal-100 text-teal-800',
      previewDetails: [
        '📞 Activity Type (Call / Email / Meeting / Task)',
        '📋 Subject and Summary',
        '📅 Activity Date',
        '⏱️ Duration in minutes',
        '🔗 Linked Deal ID',
      ],
    },
    {
      title: 'MEDDICC Playbook Status',
      description: 'Playbook qualification checklist items, notes, and AI completion scores per deal.',
      formats: ['CSV'],
      type: 'PLAYBOOK',
      IconComp: Layers,
      persona: 'Sales Rep',
      colorClass: 'text-pink-600',
      bgClass: 'bg-pink-50',
      badgeClass: 'bg-pink-100 text-pink-800',
      previewDetails: [
        '🎯 MEDDICC Criterion (Metrics / Economic Buyer / Decision Criteria...)',
        '❓ Qualifying Question',
        '📝 Captured Notes',
        '✅ Completion Status',
        '💡 AI Suggested Note',
        '🔗 Linked Deal ID',
      ],
    },
  ]

  const filteredCards = exportCards.filter(card => {
    if (userRole === 'USER') return card.persona === 'Sales Rep'
    if (userRole === 'MANAGER') return card.persona === 'Manager' || card.persona === 'Sales Rep'
    return true // ADMIN sees all
  })

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 rounded-2xl shadow-lg text-white">
        <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
          <Download className="w-8 h-8" />
          Data Exports Center
        </h1>
        <p className="text-blue-100 mt-1 text-sm">
          Click any card to preview what's included, then download in CSV or PDF format.
        </p>
      </div>

      {/* Flash message */}
      {message && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 ${
          message.type === 'success'
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {message.type === 'success'
            ? <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
            : <ShieldAlert className="w-5 h-5 text-red-600 flex-shrink-0" />
          }
          <span className="text-sm font-semibold">{message.text}</span>
          <button className="ml-auto text-gray-400 hover:text-gray-600" onClick={() => setMessage(null)}>
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredCards.map((card, idx) => {
          const Ico = card.IconComp
          const isOpen = openCardIdx === idx

          return (
            <div
              key={idx}
              className={`bg-white rounded-2xl border transition-all duration-200 overflow-hidden ${
                isOpen
                  ? 'border-blue-500 shadow-lg ring-2 ring-blue-100'
                  : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
              }`}
            >
              {/* Card Header — always visible, click to toggle */}
              <button
                type="button"
                className="w-full text-left p-6 focus:outline-none"
                onClick={() => setOpenCardIdx(isOpen ? null : idx)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    <div className={`p-3 rounded-xl shrink-0 ${card.bgClass} ${card.colorClass}`}>
                      <Ico className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-bold text-gray-900">{card.title}</h3>
                        <span className={`text-[10px] uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full shrink-0 ${card.badgeClass}`}>
                          {card.persona}
                        </span>
                      </div>
                      <p className="text-gray-500 text-xs mt-1 leading-relaxed">{card.description}</p>
                      <div className="flex items-center gap-1.5 mt-2">
                        <Info className="w-3 h-3 text-gray-400" />
                        <span className="text-[11px] text-gray-400 font-semibold">{card.formats.join(' · ')}</span>
                      </div>
                    </div>
                  </div>
                  <div className={`shrink-0 ${card.colorClass}`}>
                    {isOpen
                      ? <ChevronUp className="w-5 h-5" />
                      : <ChevronDown className="w-5 h-5" />
                    }
                  </div>
                </div>
              </button>

              {/* Expandable Detail Panel */}
              {isOpen && (
                <div className="border-t border-gray-100 px-6 pb-6 pt-4 space-y-4 animate-fadeIn">
                  {/* What's included */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-1.5">
                      <Info className="w-3 h-3" />
                      What's included in this export
                    </p>
                    <ul className="space-y-1.5">
                      {card.previewDetails.map((detail, i) => (
                        <li key={i} className="text-sm text-gray-700 leading-snug">
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Download buttons */}
                  <div className="flex flex-wrap gap-2">
                    {card.formats.map((fmt) => {
                      const key = `${card.type}-${fmt}`
                      const isLoading = exporting === key
                      return (
                        <button
                          key={fmt}
                          onClick={() => handleExport(card.type, fmt, card.title)}
                          disabled={exporting !== null}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all border shadow-sm disabled:opacity-50 ${
                            fmt === 'PDF'
                              ? 'bg-red-600 text-white border-red-700 hover:bg-red-700 active:scale-95'
                              : fmt === 'CSV'
                              ? 'bg-emerald-600 text-white border-emerald-700 hover:bg-emerald-700 active:scale-95'
                              : 'bg-violet-600 text-white border-violet-700 hover:bg-violet-700 active:scale-95'
                          }`}
                        >
                          {isLoading
                            ? <Loader2 className="w-4 h-4 animate-spin" />
                            : fmt === 'PDF'
                            ? <FileText className="w-4 h-4" />
                            : <FileSpreadsheet className="w-4 h-4" />
                          }
                          {isLoading ? 'Generating...' : `Download ${fmt}`}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer note */}
      <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-xs text-gray-500 flex items-center justify-between">
        <span>🕒 All generated export files auto-expire after 24 hours from our secure servers.</span>
        <span className="flex items-center gap-1 text-gray-400 shrink-0">
          <Lock className="w-3.5 h-3.5" />
          SECURE SESSION
        </span>
      </div>
    </div>
  )
}
