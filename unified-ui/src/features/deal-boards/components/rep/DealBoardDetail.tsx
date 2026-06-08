'use client'
import { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft, HelpCircle, ChevronDown, Filter } from 'lucide-react'
import NotificationsPanel from '@deal-boards/components/components/NotificationsPanel'
import StageSummaryCards from '@deal-boards/components/components/StageSummaryCards'
import FilterBar, { FilterState } from '@deal-boards/components/components/FilterBar'
import DealTable from '@deal-boards/components/components/DealTable'
import DealDetailPanel from '@deal-boards/components/components/deal-detail/DealDetailPanel'
import {
  getBoardDetail, getDeals, getNotifications,
  markAllNotificationsRead,
} from '@deal-boards/components/services/dealBoardsService'
import type { BoardDetail, Deal, NotificationsResponse } from '@deal-boards/components/types/deal-boards.types'

export default function DealBoardDetail() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const boardId = params.boardId as string
  const urlDealId = searchParams.get('dealId')

  const [board, setBoard] = useState<BoardDetail | null>(null)
  const [deals, setDeals] = useState<Deal[]>([])
  const [notifs, setNotifs] = useState<NotificationsResponse>({ notifications: [], unreadCount: 0 })
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null)
  const [selectedCard, setSelectedCard] = useState<string | null>('Open')
  const [showFilters, setShowFilters] = useState(true)
  const [loading, setLoading] = useState(true)
  const [showGroupMenu, setShowGroupMenu] = useState(false)

  const [filters, setFilters] = useState<FilterState>({
    stages: [],
    forecastCategories: [],
    groupBy: 'none',
    amountMin: '',
    amountMax: '',
    closeDate: '',
  })

  useEffect(() => {
    Promise.all([
      getBoardDetail(boardId),
      getDeals(boardId),
      getNotifications(),
    ]).then(([b, d, n]) => {
      setBoard(b.data)
      setDeals(d.data)
      setNotifs(n.data)
      setLoading(false)
    })
  }, [boardId])

  useEffect(() => {
    if (!loading && deals.length > 0 && urlDealId) {
      const found = deals.find(d => String(d.dealId) === urlDealId);
      if (found) {
        setSelectedDeal(found);
      }
    }
  }, [loading, deals, urlDealId])

  const computedSummaryCards = useMemo(() => {
    const buckets = {
      'Open': deals.filter(d => !d.stage.startsWith('Closed')),
      'Commit': deals.filter(d => d.forecastCategory === 'Commit'),
      'Most Likely': deals.filter(d => d.forecastCategory === 'Most Likely'),
      'Best Case': deals.filter(d => d.forecastCategory === 'Best Case'),
      'Closed Won': deals.filter(d => d.stage === 'Closed Won'),
      'Closed Lost': deals.filter(d => d.stage === 'Closed Lost'),
    }

    return Object.entries(buckets).map(([label, bucketDeals]) => ({
      label,
      amount: bucketDeals.reduce((sum, d) => sum + d.amount, 0),
      count: bucketDeals.length,
      changePercent: 12
    }))
  }, [deals])

  const filteredDeals = useMemo(() => {
    return deals.filter(d => {
      // 1. Summary Card Filter
      if (selectedCard) {
        if (selectedCard === 'Open' && d.stage.startsWith('Closed')) return false
        if (selectedCard === 'Commit' && d.forecastCategory !== 'Commit') return false
        if (selectedCard === 'Most Likely' && d.forecastCategory !== 'Most Likely') return false
        if (selectedCard === 'Best Case' && d.forecastCategory !== 'Best Case') return false
        if (selectedCard === 'Closed Won' && d.stage !== 'Closed Won') return false
        if (selectedCard === 'Closed Lost' && d.stage !== 'Closed Lost') return false
      }

      // 2. Panel Filters
      if (filters.stages.length && !filters.stages.includes(d.stage)) return false
      if (filters.forecastCategories.length && !filters.forecastCategories.includes(d.forecastCategory)) return false
      if (filters.amountMin && d.amount < Number(filters.amountMin)) return false
      if (filters.amountMax && d.amount > Number(filters.amountMax)) return false
      if (filters.closeDate && d.closeDate !== filters.closeDate) return false
      return true
    })
  }, [deals, filters, selectedCard])

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead()
    setNotifs(prev => ({
      ...prev, unreadCount: 0,
      notifications: prev.notifications.map(n => ({ ...n, read: true })),
    }))
  }

  return (
    <div style={{ flex: 1, minHeight: '100vh', background: '#f5f6fa' }}>
      {/* App Main Header */}
      <div style={{
        height: 52, background: '#fff', borderBottom: '1px solid #e8eaed',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '0 24px', position: 'relative'
      }}>
        <span style={{ fontWeight: 600, fontSize: 14, color: '#1a1d23', display: 'flex', alignItems: 'center', gap: 6 }}>
          Revenue Intelligence UI - Sales Rep (Copy) (Copy) <ChevronDown size={14} color="#9ca3af" />
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'absolute', right: 24 }}>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', padding: 4 }}>
            <HelpCircle size={18} />
          </button>
          <button style={{
            padding: '7px 14px', borderRadius: 8,
            background: '#4f46e5', color: '#fff',
            border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600,
          }}>
            Sign up with email
          </button>
          <button style={{
            padding: '7px 14px', borderRadius: 8,
            background: '#fff', color: '#1a1d23', border: '1px solid #e8eaed',
            cursor: 'pointer', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6
          }}>
            <img src="https://www.google.com/favicon.ico" width={14} height={14} alt="G" /> Continue with Google
          </button>
        </div>
      </div>

      {/* Page Title Row */}
      <div style={{ padding: '24px 28px 0 28px' }}>
        <button
          onClick={() => router.push('/deal-boards')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, marginBottom: 16 }}
        >
          <ArrowLeft size={16} /> Deal Boards
        </button>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <h1 style={{ fontSize: 24, fontWeight: 600, color: '#1a1d23', margin: 0 }}>
              {board?.name || 'Loading...'}
            </h1>
            {board?.ownerTag && (
              <span style={{ fontSize: 12, color: '#10b981', background: '#d1fae5', padding: '4px 10px', borderRadius: 20, fontWeight: 500 }}>
                {board.ownerTag}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <NotificationsPanel
              notifications={notifs.notifications}
              unreadCount={notifs.unreadCount}
              onMarkAllRead={handleMarkAllRead}
            />
            <button
              onClick={() => setShowFilters(!showFilters)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 14px', borderRadius: 8,
                border: '1px solid #e8eaed', background: '#fff',
                color: '#1a1d23', cursor: 'pointer', fontSize: 13, fontWeight: 500,
              }}
            >
              <Filter size={14} />
              Filters
            </button>
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowGroupMenu(!showGroupMenu)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 16,
                  padding: '7px 14px', borderRadius: 8,
                  border: '1px solid #e8eaed', background: '#fff',
                  color: '#1a1d23', cursor: 'pointer', fontSize: 13, fontWeight: 500,
                  width: 150, justifyContent: 'space-between'
                }}
              >
                {filters.groupBy === 'none' ? 'No grouping' : filters.groupBy === 'stage' ? 'Group by stage' : 'Group by Rep'}
                <ChevronDown size={14} color="#6b7280" />
              </button>
              
              {showGroupMenu && (
                <div style={{
                  position: 'absolute', top: 'calc(100% + 4px)', right: 0,
                  width: 150, background: '#fff', border: '1px solid #e8eaed',
                  borderRadius: 4, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  zIndex: 50, overflow: 'hidden'
                }}>
                  {[
                    { label: 'No grouping', value: 'none' },
                    { label: 'Group by stage', value: 'stage' },
                    { label: 'Group by Rep', value: 'rep' },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        setFilters({ ...filters, groupBy: opt.value as any })
                        setShowGroupMenu(false)
                      }}
                      style={{
                        display: 'block', width: '100%', textAlign: 'left',
                        padding: '10px 14px', fontSize: 13, border: 'none',
                        cursor: 'pointer',
                        background: filters.groupBy === opt.value ? '#737373' : '#fff',
                        color: filters.groupBy === opt.value ? '#fff' : '#1a1d23',
                      }}
                      onMouseEnter={e => {
                        if (filters.groupBy !== opt.value) e.currentTarget.style.background = '#f9fafb'
                      }}
                      onMouseLeave={e => {
                        if (filters.groupBy !== opt.value) e.currentTarget.style.background = '#fff'
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '24px 28px' }}>
        {/* Filter Bar */}
        <FilterBar
          filters={filters}
          onChange={setFilters}
          showFilters={showFilters}
        />

        {/* Summary Cards */}
        <StageSummaryCards
          cards={computedSummaryCards}
          selectedCard={selectedCard}
          onSelectCard={label => setSelectedCard(prev => prev === label ? null : label)}
        />

        {/* Table */}
        {loading ? (
          <div style={{ background: '#fff', borderRadius: 10, border: '1px solid #e8eaed', height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', fontSize: 14 }}>
            Loading deals...
          </div>
        ) : (
          <DealTable
            deals={filteredDeals}
            groupBy={filters.groupBy}
            onDealClick={setSelectedDeal}
          />
        )}
      </div>

      {/* Deal Detail Panel */}
      {selectedDeal && (
        <DealDetailPanel
          deal={selectedDeal}
          onClose={() => setSelectedDeal(null)}
        />
      )}
    </div>
  )
}


