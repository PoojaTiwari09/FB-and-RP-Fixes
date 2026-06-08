'use client'
import { useState } from 'react'
import type { BriefData } from '@deal-boards/components/services/dealBoardsService'
import { 
  FileText, ChevronUp, ChevronDown, ListChecks, Target, AlertTriangle, 
  Scale, Users, History, CheckCircle, ArrowRight, Phone, Calendar, Mail, Clock 
} from 'lucide-react'

interface Props { data: BriefData | null; loading: boolean }

export default function BriefTab({ data, loading }: Props) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['overview']))

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
    return <div style={{ padding: 24, color: '#9ca3af', fontSize: 13 }}>Loading brief...</div>
  }

  if (!data) {
    return <div style={{ padding: 24, color: '#9ca3af', fontSize: 13 }}>No brief available</div>
  }

  const NoDataFallback = () => (
    <p className="text-[13px] text-gray-400 italic leading-relaxed m-0">
      Information not available for this deal yet.
    </p>
  )

  // 7-SECTION ACCORDION
  return (
    <div className="space-y-4 p-4">
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
          <div className="px-6 py-4 border-t border-gray-100 bg-white">
            {data.overview ? (
              <p className="text-[13px] text-gray-700 leading-relaxed m-0">{data.overview}</p>
            ) : (
              <NoDataFallback />
            )}
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
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0" style={{ backgroundColor: '#8B5CF6' }}>
              <ListChecks className="w-5 h-5" />
            </div>
            <span className="font-semibold text-gray-900" style={{ fontFamily: 'var(--font-serif)' }}>Key Discussion Points</span>
          </div>
          {expandedSections.has('discussion') ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
        </button>
        {expandedSections.has('discussion') && (
          <div className="px-6 py-4 border-t border-gray-100 bg-white">
            {data.keyDiscussionPoints && data.keyDiscussionPoints.length > 0 ? (
              <ul className="space-y-3 m-0 pl-0">
                {data.keyDiscussionPoints.map((point, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-[13px] text-gray-700 leading-relaxed">
                    <div className="w-1.5 h-1.5 rounded-full bg-violet-400 mt-1.5 shrink-0" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <NoDataFallback />
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
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0" style={{ backgroundColor: '#10B981' }}>
              <Target className="w-5 h-5" />
            </div>
            <span className="font-semibold text-gray-900" style={{ fontFamily: 'var(--font-serif)' }}>Customer Needs & Goals</span>
          </div>
          {expandedSections.has('needs') ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
        </button>
        {expandedSections.has('needs') && (
          <div className="px-6 py-4 border-t border-gray-100 bg-white">
            {data.customerNeeds && data.customerNeeds.length > 0 ? (
              <div className="space-y-4">
                {data.customerNeeds.map((need, idx) => (
                  <div key={idx}>
                    <h4 className="text-[13px] font-semibold text-gray-900 mb-1">{need.title}</h4>
                    <p className="text-[13px] text-gray-600 leading-relaxed m-0">{need.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <NoDataFallback />
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
          <div className="px-6 py-4 border-t border-gray-100 bg-white">
            {data.risks && data.risks.length > 0 ? (
              <div className="space-y-4">
                {data.risks.map((risk, idx) => (
                  <div key={idx} className={`p-3 rounded-lg border ${
                    risk.severity === 'high' ? 'bg-red-50 border-red-100' :
                    risk.severity === 'medium' ? 'bg-orange-50 border-orange-100' :
                    'bg-yellow-50 border-yellow-100'
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle className={`w-4 h-4 ${
                        risk.severity === 'high' ? 'text-red-500' :
                        risk.severity === 'medium' ? 'text-orange-500' :
                        'text-yellow-500'
                      }`} />
                      <h4 className={`text-[13px] font-semibold ${
                        risk.severity === 'high' ? 'text-red-900' :
                        risk.severity === 'medium' ? 'text-orange-900' :
                        'text-yellow-900'
                      }`}>{risk.title}</h4>
                    </div>
                    <p className={`text-[13px] leading-relaxed m-0 ml-6 ${
                      risk.severity === 'high' ? 'text-red-700' :
                      risk.severity === 'medium' ? 'text-orange-700' :
                      'text-yellow-700'
                    }`}>{risk.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <NoDataFallback />
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
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0" style={{ backgroundColor: '#EC4899' }}>
              <Scale className="w-5 h-5" />
            </div>
            <span className="font-semibold text-gray-900" style={{ fontFamily: 'var(--font-serif)' }}>Decisions & Commitments</span>
          </div>
          {expandedSections.has('commitments') ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
        </button>
        {expandedSections.has('commitments') && (
          <div className="px-6 py-4 border-t border-gray-100 bg-white">
            {data.commitments && data.commitments.length > 0 ? (
              <div className="space-y-3">
                {data.commitments.map((commitment, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
                    {commitment.assigneeType === 'rep' ? (
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 mt-0.5">
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle className="w-3.5 h-3.5" />
                      </div>
                    )}
                    <div>
                      <p className="text-[13px] text-gray-900 font-medium leading-relaxed m-0">
                        {commitment.description}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        <span className="text-[11px] text-gray-500 font-medium uppercase tracking-wide">
                          {commitment.dueDate}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <NoDataFallback />
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
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0" style={{ backgroundColor: '#6366F1' }}>
              <Users className="w-5 h-5" />
            </div>
            <span className="font-semibold text-gray-900" style={{ fontFamily: 'var(--font-serif)' }}>Key Stakeholders</span>
          </div>
          {expandedSections.has('stakeholders') ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
        </button>
        {expandedSections.has('stakeholders') && (
          <div className="px-6 py-4 border-t border-gray-100 bg-white">
            {data.stakeholders && data.stakeholders.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {data.stakeholders.map((stakeholder, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 rounded-lg border border-gray-100 bg-gray-50/50">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold text-sm shrink-0 border border-indigo-200">
                      {stakeholder.avatarInitials}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold text-gray-900 m-0 truncate">{stakeholder.name}</p>
                      <p className="text-[12px] text-gray-500 m-0 truncate">{stakeholder.title}</p>
                      <p className="text-[11px] text-gray-400 m-0 truncate mt-0.5">{stakeholder.company}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <NoDataFallback />
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
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0" style={{ backgroundColor: '#14B8A6' }}>
              <History className="w-5 h-5" />
            </div>
            <span className="font-semibold text-gray-900" style={{ fontFamily: 'var(--font-serif)' }}>Recent Activity Context</span>
          </div>
          {expandedSections.has('activity') ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
        </button>
        {expandedSections.has('activity') && (
          <div className="px-6 py-4 border-t border-gray-100 bg-white">
            {data.activityContext && data.activityContext.length > 0 ? (
              <div className="relative border-l-2 border-gray-100 ml-3 space-y-6 pb-2">
                {data.activityContext.map((activity, idx) => (
                  <div key={idx} className="relative pl-6">
                    <div className="absolute -left-[13px] top-1 w-6 h-6 rounded-full bg-white border-2 border-teal-500 flex items-center justify-center">
                      {activity.type === 'call' && <Phone className="w-3 h-3 text-teal-600" />}
                      {activity.type === 'meeting' && <Calendar className="w-3 h-3 text-teal-600" />}
                      {activity.type === 'email' && <Mail className="w-3 h-3 text-teal-600" />}
                    </div>
                    <div>
                      <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">{activity.date}</span>
                      <p className="text-[13px] text-gray-700 mt-1 mb-0 leading-relaxed">{activity.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <NoDataFallback />
            )}
          </div>
        )}
      </div>
    </div>
  )
}
