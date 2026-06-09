'use client'
import { useState, useEffect, useCallback } from 'react'
import { X, FileText, AlertTriangle, CheckSquare, Activity, Edit, Play } from 'lucide-react'
import type { Deal, BriefData, Warning, PlaybookData, ActivityData, CrmFields, StageOptions } from '@deal-boards/components/services/dealBoardsService'
import {
  getDealBrief, getDealWarnings, getDealPlaybook, getDealActivity,
  getDealCrmFields, getStageOptions, updateDeal, updatePlaybookCriterion,
  resolveWarning, triggerWarningAction
} from '@deal-boards/components/services/dealBoardsService'
import BriefTab from './tabs/BriefTab'
import WarningsTab from './tabs/WarningsTab'
import PlaybookTab from './tabs/PlaybookTab'
import ActivityTab from './tabs/ActivityTab'
import UpdateCRMTab from './tabs/UpdateCRMTab'

interface Props {
  deal: Deal | null
  onClose: () => void
}

const TABS = [
  { id: 'brief', label: 'Brief', icon: FileText },
  { id: 'warnings', label: 'Warnings', icon: AlertTriangle },
  { id: 'playbook', label: 'Playbook', icon: CheckSquare },
  { id: 'activity', label: 'Activity', icon: Activity },
  { id: 'crm', label: 'Update CRM', icon: Edit },
] as const

type TabId = typeof TABS[number]['id']

const fmt = (n: number) => {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`
  return `$${n}`
}

export default function DealDetailPanel({ deal, onClose }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('brief')

  const [brief, setBrief] = useState<BriefData | null>(null)
  const [warnings, setWarnings] = useState<Warning[]>([])
  const [playbook, setPlaybook] = useState<PlaybookData | null>(null)
  const [activity, setActivity] = useState<ActivityData | null>(null)
  const [crmFields, setCrmFields] = useState<CrmFields | null>(null)
  const [stageOptions, setStageOptions] = useState<StageOptions | null>(null)

  const [loadingBrief, setLoadingBrief] = useState(false)
  const [loadingWarnings, setLoadingWarnings] = useState(false)
  const [loadingPlaybook, setLoadingPlaybook] = useState(false)
  const [loadingActivity, setLoadingActivity] = useState(false)
  const [loadingCrm, setLoadingCrm] = useState(false)

  useEffect(() => {
    if (!deal) return
    setActiveTab('brief')
    setBrief(null); setWarnings([]); setPlaybook(null); setActivity(null); setCrmFields(null)

    // Load brief + warnings immediately
    setLoadingBrief(true)
    getDealBrief(deal.dealId).then(r => { setBrief(r.data); setLoadingBrief(false) })
    setLoadingWarnings(true)
    getDealWarnings(deal.dealId).then(r => { setWarnings(r.data); setLoadingWarnings(false) })
    // Load stage options once
    getStageOptions().then(r => setStageOptions(r.data))
  }, [deal?.dealId])

  const loadTab = useCallback(async (tab: TabId) => {
    if (!deal) return
    if (tab === 'playbook' && !playbook) {
      setLoadingPlaybook(true)
      const r = await getDealPlaybook(deal.dealId)
      setPlaybook(r.data); setLoadingPlaybook(false)
    }
    if (tab === 'activity' && !activity) {
      setLoadingActivity(true)
      const r = await getDealActivity(deal.dealId)
      setActivity(r.data); setLoadingActivity(false)
    }
    if (tab === 'crm' && !crmFields) {
      setLoadingCrm(true)
      const r = await getDealCrmFields(deal.dealId)
      setCrmFields(r.data); setLoadingCrm(false)
    }
  }, [deal, playbook, activity, crmFields])

  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab)
    loadTab(tab)
  }

  if (!deal) return null

  const stageColors: Record<string, string> = {
    Qualification: '#dbeafe', Discovery: '#e0e7ff', Proposal: '#fef3c7',
    Negotiation: '#fed7aa', 'Closed Won': '#d1fae5', 'Closed Lost': '#fee2e2',
  }
  const stageTextColors: Record<string, string> = {
    Qualification: '#1d4ed8', Discovery: '#4338ca', Proposal: '#d97706',
    Negotiation: '#ea580c', 'Closed Won': '#065f46', 'Closed Lost': '#991b1b',
  }

  const isOverdue = new Date(deal.closeDate) < new Date() && !deal.stage.startsWith('Closed')

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.2)', zIndex: 200 }}
      />
      {/* Panel */}
      <div className="slide-in" style={{
        position: 'fixed', right: 0, top: 0, bottom: 0,
        width: 520, background: '#fff',
        boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
        zIndex: 201, display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ padding: '24px 24px 16px', background: '#f8fafc', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ fontFamily: 'Georgia, serif', fontWeight: 600, fontSize: 20, color: '#1e293b', margin: 0 }}>
              {deal.dealName}
            </h2>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 0 }}>
              <X size={20} />
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, color: '#64748b' }}>{deal.company}</span>
            <span style={{ color: '#cbd5e1', fontSize: 14 }}>•</span>
            <span style={{ fontSize: 13, color: '#0f172a', fontWeight: 700 }}>{fmt(deal.amount)}</span>
            <span style={{ color: '#cbd5e1', fontSize: 14 }}>•</span>
            <span style={{
              padding: '2px 10px', borderRadius: 4, fontSize: 12, fontWeight: 500,
              background: stageColors[deal.stage] || '#f1f5f9',
              color: stageTextColors[deal.stage] || '#64748b',
            }}>
              {deal.stage}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', background: '#f8fafc', padding: '0 8px', borderBottom: '1px solid #e2e8f0', flexShrink: 0 }}>
          {TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  flex: 1, padding: '12px 4px', border: 'none', cursor: 'pointer',
                  fontSize: 13, fontWeight: 500,
                  color: activeTab === tab.id ? '#1e293b' : '#64748b',
                  background: activeTab === tab.id ? '#fff' : 'transparent',
                  borderTopLeftRadius: 8, borderTopRightRadius: 8,
                  borderBottom: `2px solid ${activeTab === tab.id ? '#3b82f6' : 'transparent'}`,
                  transition: 'all 0.15s',
                }}
              >
                <Icon size={16} />
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {tab.id === 'crm' ? <span style={{ maxWidth: 50, textAlign: 'left', lineHeight: 1.1 }}>{tab.label}</span> : tab.label}
                  {tab.id === 'warnings' && warnings.filter(w => w.status === 'active').length > 0 && (
                    <span style={{ background: '#fef2f2', color: '#ef4444', borderRadius: '50%', width: 16, height: 16, fontSize: 10, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                      {warnings.filter(w => w.status === 'active').length}
                    </span>
                  )}
                </span>
              </button>
            )
          })}
        </div>

        {/* Tab content */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {activeTab === 'brief' && <BriefTab data={brief} loading={loadingBrief} />}
          {activeTab === 'warnings' && (
            <WarningsTab
              warnings={warnings}
              loading={loadingWarnings}
              onResolve={wid => resolveWarning(deal.dealId, wid)}
              onAction={wid => triggerWarningAction(deal.dealId, wid)}
            />
          )}
          {activeTab === 'playbook' && (
            <PlaybookTab
              data={playbook}
              loading={loadingPlaybook}
              onUpdateCriterion={async (cid, status) => {
                // Optimistically update local state
                if (playbook) {
                  const updatedCriteria = playbook.criteria.map(c => 
                    c.criterionId === cid ? { ...c, status } : c
                  );
                  
                  // Recalculate score and completed count
                  const completedCount = updatedCriteria.filter(c => c.status === 'Completed').length;
                  const scorePercentage = Math.round((completedCount / playbook.totalCount) * 100);
                  
                  setPlaybook({
                    ...playbook,
                    criteria: updatedCriteria,
                    completedCount,
                    scorePercentage
                  });
                }
                await updatePlaybookCriterion(deal.dealId, cid, status);
              }}
            />
          )}
          {activeTab === 'activity' && <ActivityTab data={activity} loading={loadingActivity} />}
          {activeTab === 'crm' && (
            <UpdateCRMTab
              data={crmFields}
              stageOptions={stageOptions}
              loading={loadingCrm}
              onSave={async fields => { await updateDeal(deal.dealId, fields) }}
            />
          )}
        </div>
      </div>
    </>
  )
}




