'use client'
import type { BoardSummaryCard } from '@deal-boards/components/types/deal-boards.types'
import { TrendingUp } from 'lucide-react'

interface Props {
  cards: BoardSummaryCard[]
  selectedCard: string | null
  onSelectCard: (label: string) => void
}

const fmt = (n: number) => {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`
  return `$${n}`
}

export default function StageSummaryCards({ cards, selectedCard, onSelectCard }: Props) {
  return (
    <div style={{
      display: 'flex',
      gap: 16,
      marginBottom: 24,
      overflowX: 'auto',
      paddingBottom: 4,
    }}>
      {cards.map((card, i) => {
        const isSelected = selectedCard === card.label
        return (
          <div
            key={i}
            onClick={() => onSelectCard(card.label)}
            style={{
              flex: '1 0 140px',
              minWidth: 140,
              background: isSelected ? '#f8f9ff' : '#fff',
              border: `1px solid ${isSelected ? '#4f46e5' : '#e8eaed'}`,
              borderRadius: 10,
              padding: '14px 16px',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              boxShadow: isSelected ? '0 0 0 1px #4f46e5' : 'none',
            }}
          >
            <p style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
              {card.label}
            </p>
            <p style={{ fontSize: 18, fontWeight: 700, color: '#1a1d23', marginBottom: 4 }}>
              {fmt(card.amount)}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 11, color: '#9ca3af' }}>({card.count})</span>
              <div style={{ background: '#d1fae5', padding: '2px 6px', borderRadius: 4 }}>
                <span style={{ fontSize: 11, color: '#10b981', fontWeight: 600 }}>+ {card.changePercent}%</span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}




