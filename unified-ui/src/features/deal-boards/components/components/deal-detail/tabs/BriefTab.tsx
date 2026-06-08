'use client'
import type { BriefData } from '@deal-boards/components/services/dealBoardsService'
import { Brain, TrendingUp, AlertCircle, Clock } from 'lucide-react'

interface Props { data: BriefData | null; loading: boolean }

const sentimentColor = { Positive: '#10b981', Neutral: '#f59e0b', Negative: '#ef4444' }
const sentimentBg = { Positive: '#d1fae5', Neutral: '#fef3c7', Negative: '#fee2e2' }

export default function BriefTab({ data, loading }: Props) {
  if (loading) return <div style={{ padding: 24, color: '#9ca3af', fontSize: 13 }}>Loading brief...</div>
  if (!data) return <div style={{ padding: 24, color: '#9ca3af', fontSize: 13 }}>No brief available</div>

  return (
    <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* AI Summary */}
      <div>
        <h3 style={{ fontSize: 11, fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
          AI Summary
        </h3>
        <div style={{ background: '#f0f6ff', borderRadius: 8, padding: '16px', border: '1px solid #bfdbfe' }}>
          <p style={{ fontSize: 13, color: '#1e40af', lineHeight: 1.6, margin: 0 }}>
            {data.aiSummary}
          </p>
        </div>
      </div>

      {/* What Changed */}
      <div>
        <h3 style={{ fontSize: 11, fontWeight: 700, color: '#92400e', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
          What Changed This Week
        </h3>
        <div style={{ background: '#fef3c7', borderRadius: 8, padding: '16px', border: '1px solid #fde68a' }}>
          <p style={{ fontSize: 13, color: '#92400e', lineHeight: 1.6, margin: 0 }}>
            {data.whatChangedThisWeek}
          </p>
        </div>
      </div>

      {/* Attributes List */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {/* Buyer Sentiment */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid #f3f4f6' }}>
          <span style={{ fontSize: 13, color: '#6b7280' }}>Buyer sentiment</span>
          <span style={{
            padding: '4px 10px', borderRadius: 4, fontSize: 12, fontWeight: 600,
            background: sentimentBg[data.buyerSentiment] || '#f3f4f6',
            color: sentimentColor[data.buyerSentiment] || '#374151',
          }}>
            {data.buyerSentiment}
          </span>
        </div>
        
        {/* Last Interaction */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 0', borderBottom: '1px solid #f3f4f6' }}>
          <span style={{ fontSize: 13, color: '#6b7280' }}>Last interaction</span>
          <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>
            {data.lastInteraction}
          </span>
        </div>

        {/* Key Risks */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '16px 0' }}>
          <span style={{ fontSize: 13, color: '#6b7280', flexShrink: 0, marginRight: 16 }}>Key risks</span>
          <span style={{ fontSize: 13, color: '#374151', fontWeight: 500, textAlign: 'right' }}>
            {data.keyRisks.split(' • ').join(' • ')}
          </span>
        </div>
      </div>
    </div>
  )
}




