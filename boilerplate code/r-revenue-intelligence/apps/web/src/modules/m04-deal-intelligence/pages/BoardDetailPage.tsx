import { Fragment, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useQuery } from 'react-query'
import {
  ArrowLeft,
  AlertCircle,
  Filter,
  SlidersHorizontal,
  ChevronDown,
  Search,
  X as XIcon,
} from 'lucide-react'
import { boardAPI, dealAPI } from '../lib/api'
import { useAuthStore } from '../stores/authStore'
import DealDetailPanel from '../components/DealDetailPanel'

const stageOptions = [
  'PROSPECTING',
  'QUALIFICATION',
  'NEEDS_ANALYSIS',
  'PROPOSAL',
  'NEGOTIATION',
  'CLOSED_WON',
  'CLOSED_LOST',
]

function label(value: string) {
  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function formatMoney(value: unknown) {
  return `$${Number(value || 0).toLocaleString()}`
}

/** Parse date from DB safely without timezone offset shifting */
function parseDate(value: string | null | undefined): Date | null {
  if (!value) return null
  // DB dates come as "2024-03-15" — parse as local date to avoid UTC midnight shifting
  const parts = String(value).split('T')[0].split('-')
  if (parts.length === 3) {
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
    return isNaN(d.getTime()) ? null : d
  }
  const d = new Date(value)
  return isNaN(d.getTime()) ? null : d
}

/** Stage badge — colors match Figma */
function StageBadge({ stage }: { stage: string }) {
  const colorMap: Record<string, string> = {
    PROSPECTING:   'bg-gray-100 text-gray-700',
    QUALIFICATION: 'bg-orange-100 text-orange-700',
    NEEDS_ANALYSIS:'bg-yellow-100 text-yellow-700',
    PROPOSAL:      'bg-blue-100 text-blue-700',
    NEGOTIATION:   'bg-purple-100 text-purple-700',
    CLOSED_WON:    'bg-emerald-100 text-emerald-700',
    CLOSED_LOST:   'bg-red-100 text-red-700',
  }
  return (
    <span
      className={`inline-block rounded-md px-3 py-1 text-sm font-medium ${
        colorMap[stage] || 'bg-blue-100 text-blue-700'
      }`}
    >
      {label(stage)}
    </span>
  )
}

/** Active filter badge pill */
function FilterBadge({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
      {label}
      <button onClick={onRemove} className="hover:text-blue-900">
        <XIcon className="h-3 w-3" />
      </button>
    </span>
  )
}

/** Three vertical bars representing activity strength */
function ActivityBars({ deal }: { deal: any }) {
  const strength = Number(deal.activityStrength || 0)
  const bars = [
    { active: strength > 10, color: 'bg-blue-500' },
    { active: strength > 35, color: 'bg-emerald-500' },
    { active: strength > 65, color: 'bg-violet-500' },
  ]
  return (
    <div className="flex h-7 items-end gap-[3px]">
      {bars.map((bar, i) => (
        <span
          key={i}
          className={`w-[5px] rounded-full transition-all ${bar.active ? bar.color : 'bg-gray-200'}`}
          style={{ height: bar.active ? `${16 + i * 4}px` : '10px' }}
        />
      ))}
    </div>
  )
}

const PAGE_SIZE = 50

const DEFAULT_FILTERS = {
  stages: [] as string[],
  amountMin: '',
  amountMax: '',
  closeDateStart: '',
  search: '',
  highRiskOnly: false,
}

export default function BoardDetailPage() {
  const { user } = useAuthStore()
  const { boardId } = useParams()
  const [selectedDeal, setSelectedDeal] = useState<any>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [activeTab, setActiveTab] = useState<'PIPELINE' | 'BEST_CASE' | 'COMMIT'>('PIPELINE')
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState(DEFAULT_FILTERS)
  const [grouping, setGrouping] = useState<'NONE' | 'STAGE' | 'OWNER'>('NONE')

  const { data: board } = useQuery(['board', boardId], () => boardAPI.getBoard(boardId!))
  const { data: deals, isLoading } = useQuery(
    ['deals', 'board-preview'],
    () => dealAPI.getDeals({ limit: 500 }),
    { staleTime: 60_000 }
  )

  const boardData = board?.data
  const allDeals: any[] = deals?.data?.deals || []

  /** How many active sidebar filters are applied */
  const activeFilterCount =
    filters.stages.length +
    (filters.amountMin ? 1 : 0) +
    (filters.amountMax ? 1 : 0) +
    (filters.closeDateStart ? 1 : 0) +
    (filters.highRiskOnly ? 1 : 0)

  /** Apply all sidebar filters (search + stage + amount + date + risk) */
  const filteredDeals = useMemo(() => {
    const searchLower = filters.search.trim().toLowerCase()
    const amountMin = filters.amountMin ? Number(filters.amountMin) : null
    const amountMax = filters.amountMax ? Number(filters.amountMax) : null
    const dateStart = filters.closeDateStart ? parseDate(filters.closeDateStart) : null

    return allDeals.filter((deal) => {
      // ── Search (name or account)
      if (searchLower) {
        const name    = String(deal.name || '').toLowerCase()
        const account = String(deal.accountName || '').toLowerCase()
        if (!name.includes(searchLower) && !account.includes(searchLower)) return false
      }

      // ── Stage checkboxes
      if (filters.stages.length && !filters.stages.includes(deal.stage)) return false

      // ── Amount range
      const amount = Number(deal.amount || 0)
      if (amountMin !== null && amount < amountMin) return false
      if (amountMax !== null && amount > amountMax) return false

      // ── Close date range (timezone-safe)
      const closeDate = parseDate(deal.closeDate)
      if (dateStart && (!closeDate || closeDate < dateStart)) return false

      // ── High risk only
      if (filters.highRiskOnly && !deal.isHighRisk) return false

      return true
    })
  }, [allDeals, filters])

  /** Tab counts — count across ALL sidebar-filtered deals (not just active tab) */
  const tabCounts = {
    PIPELINE:  filteredDeals.filter((d) => d.forecastCategory === 'PIPELINE').length,
    BEST_CASE: filteredDeals.filter((d) => d.forecastCategory === 'BEST_CASE').length,
    COMMIT:    filteredDeals.filter((d) => d.forecastCategory === 'COMMIT').length,
  }

  /** Apply tab filter on top of sidebar filters */
  const tabDeals = filteredDeals.filter((d) => d.forecastCategory === activeTab)

  const visibleDeals = tabDeals.slice(0, page * PAGE_SIZE)
  const hasMore = tabDeals.length > visibleDeals.length

  const groupedDeals = useMemo(() => {
    if (grouping === 'NONE') return null

    const groups: Record<string, any[]> = {}
    visibleDeals.forEach((deal) => {
      let key = 'Unassigned'
      if (grouping === 'STAGE') {
        key = label(deal.stage)
      } else if (grouping === 'OWNER') {
        key = deal.ownerName || 'Unassigned'
      }
      if (!groups[key]) {
        groups[key] = []
      }
      groups[key].push(deal)
    })

    return Object.entries(groups).map(([key, list]) => ({
      key,
      deals: list,
    }))
  }, [visibleDeals, grouping])

  const toggleStage = (stage: string) => {
    setPage(1)
    setFilters((prev) => ({
      ...prev,
      stages: prev.stages.includes(stage)
        ? prev.stages.filter((s) => s !== stage)
        : [...prev.stages, stage],
    }))
  }

  const updateFilter = <K extends keyof typeof DEFAULT_FILTERS>(
    key: K,
    value: (typeof DEFAULT_FILTERS)[K]
  ) => {
    setPage(1)
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const clearAllFilters = () => {
    setPage(1)
    setFilters(DEFAULT_FILTERS)
  }

  const handleTabChange = (tab: 'PIPELINE' | 'BEST_CASE' | 'COMMIT') => {
    setActiveTab(tab)
    setPage(1)
  }

  const tabs: Array<{ key: 'PIPELINE' | 'BEST_CASE' | 'COMMIT'; label: string }> = [
    { key: 'PIPELINE',  label: 'Pipeline'  },
    { key: 'BEST_CASE', label: 'Best Case' },
    { key: 'COMMIT',    label: 'Commit'    },
  ]

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="border-b border-gray-200 bg-white pb-0">
        <Link
          to="/boards"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Deal Boards
        </Link>

        <div className="mt-5 flex items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-950">
              {boardData?.name || 'My Deals — Q2'}
            </h1>
            <span className="rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              Owner = Me · locked
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Search bar */}
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search deals..."
                value={filters.search}
                onChange={(e) => updateFilter('search', e.target.value)}
                className="h-9 w-52 rounded-lg border border-gray-300 bg-white pl-9 pr-3 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
              {filters.search && (
                <button
                  onClick={() => updateFilter('search', '')}
                  className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600"
                >
                  <XIcon className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Filter toggle */}
            <button
              onClick={() => setShowFilters((v) => !v)}
              className={`relative inline-flex h-9 items-center gap-2 rounded-lg border px-4 text-sm font-medium transition-colors ${
                showFilters || activeFilterCount > 0
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Filter className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <span className="ml-0.5 rounded-full bg-blue-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Grouping select */}
            <div className="relative">
              <select
                value={grouping}
                onChange={(e) => setGrouping(e.target.value as 'NONE' | 'STAGE' | 'OWNER')}
                className="h-9 appearance-none rounded-lg border border-gray-300 bg-white pl-4 pr-8 text-sm text-gray-700 outline-none"
              >
                <option value="NONE">No grouping</option>
                <option value="STAGE">Group by Stage</option>
                <option value="OWNER">Group by Rep</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2 top-2 h-4 w-4 text-gray-500" />
            </div>
          </div>
        </div>

        {/* ── Active filter badges ── */}
        {(activeFilterCount > 0 || filters.search) && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {filters.search && (
              <FilterBadge
                label={`Search: "${filters.search}"`}
                onRemove={() => updateFilter('search', '')}
              />
            )}
            {filters.stages.map((s) => (
              <FilterBadge key={s} label={label(s)} onRemove={() => toggleStage(s)} />
            ))}
            {filters.amountMin && (
              <FilterBadge
                label={`Min: $${Number(filters.amountMin).toLocaleString()}`}
                onRemove={() => updateFilter('amountMin', '')}
              />
            )}
            {filters.amountMax && (
              <FilterBadge
                label={`Max: $${Number(filters.amountMax).toLocaleString()}`}
                onRemove={() => updateFilter('amountMax', '')}
              />
            )}
            {filters.closeDateStart && (
              <FilterBadge
                label={`Close Date: ${filters.closeDateStart}`}
                onRemove={() => updateFilter('closeDateStart', '')}
              />
            )}
            {filters.highRiskOnly && (
              <FilterBadge
                label="High risk only"
                onRemove={() => updateFilter('highRiskOnly', false)}
              />
            )}
            <button
              onClick={clearAllFilters}
              className="text-xs font-medium text-gray-400 underline hover:text-gray-600"
            >
              Clear all
            </button>
          </div>
        )}

        {/* ── Filters Panel ── */}
        {showFilters && (
          <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-5">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {/* Stage */}
              <div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Stage
                </div>
                <div className="max-h-40 space-y-1.5 overflow-y-auto pr-1">
                  {stageOptions.map((stage) => (
                    <label
                      key={stage}
                      className="flex cursor-pointer items-center gap-2 text-sm text-gray-700"
                    >
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-gray-300 accent-blue-600"
                        checked={filters.stages.includes(stage)}
                        onChange={() => toggleStage(stage)}
                      />
                      {label(stage)}
                    </label>
                  ))}
                </div>
              </div>

              {/* Amount */}
              <div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Amount ($)
                </div>
                <div className="space-y-2">
                  <input
                    type="number"
                    placeholder="Min amount"
                    className="h-9 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    value={filters.amountMin}
                    onChange={(e) => updateFilter('amountMin', e.target.value)}
                  />
                  <input
                    type="number"
                    placeholder="Max amount"
                    className="h-9 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    value={filters.amountMax}
                    onChange={(e) => updateFilter('amountMax', e.target.value)}
                  />
                </div>
              </div>

              {/* Close Date */}
              <div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Close Date
                </div>
                <div>
                  <input
                    type="date"
                    className="h-9 w-full rounded-lg border border-gray-300 px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    value={filters.closeDateStart}
                    onChange={(e) => updateFilter('closeDateStart', e.target.value)}
                  />
                </div>
              </div>

              {/* Risk & Other */}
              <div>
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Risk & Status
                </div>
                <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 accent-blue-600"
                    checked={filters.highRiskOnly}
                    onChange={(e) => updateFilter('highRiskOnly', e.target.checked)}
                  />
                  High risk deals only
                </label>
                <p className="mt-3 text-xs text-gray-400">
                  Showing{' '}
                  <span className="font-semibold text-gray-700">{filteredDeals.length}</span> of{' '}
                  <span className="font-semibold text-gray-700">{allDeals.length}</span> deals
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <p className="text-xs text-gray-400">
                {activeFilterCount > 0
                  ? `${activeFilterCount} filter${activeFilterCount > 1 ? 's' : ''} active`
                  : 'No filters applied'}
              </p>
              {activeFilterCount > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  Clear all filters
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Tabs ── */}
        <div className="mt-6 flex gap-0">
          {tabs.map(({ key, label: tabLabel }) => (
            <button
              key={key}
              onClick={() => handleTabChange(key)}
              className={`border-b-2 px-6 pb-4 text-sm font-semibold transition-colors ${
                activeTab === key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              {tabLabel}{' '}
              <span
                className={`ml-1 ${activeTab === key ? 'text-blue-600' : 'text-gray-400'}`}
              >
                {tabCounts[key]}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 bg-white text-left">
              <th className="w-[32%] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-400">
                Deal Name
              </th>
              <th className="w-[14%] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-400">
                Stage
              </th>
              <th className="w-[12%] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-400">
                Amount
              </th>
              <th className="w-[12%] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-400">
                Contacts
              </th>
              <th className="w-[14%] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-400">
                AI Warnings
              </th>
              <th className="w-[10%] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-gray-400">
                Activity
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {groupedDeals ? (
              groupedDeals.map((group) => (
                <Fragment key={group.key}>
                  {/* Group Header Row */}
                  <tr className="bg-gray-50/75">
                    <td colSpan={6} className="px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-gray-500 border-y border-gray-100">
                      <div className="flex items-center justify-between">
                        <span>{group.key}</span>
                        <span className="rounded-full bg-gray-200 px-2 py-0.5 text-[10px] font-semibold text-gray-600">
                          {group.deals.length} {group.deals.length === 1 ? 'deal' : 'deals'}
                        </span>
                      </div>
                    </td>
                  </tr>
                  {/* Group Rows */}
                  {group.deals.map((deal: any) => (
                    <tr
                      key={deal.id}
                      onClick={() => setSelectedDeal(deal)}
                      className="cursor-pointer bg-white transition-colors hover:bg-blue-50/30"
                    >
                      <td className="px-5 py-4">
                        <div className="truncate text-sm font-semibold text-blue-600">
                          {deal.name}
                        </div>
                        <div className="mt-0.5 truncate text-xs text-gray-500">
                          {deal.accountName || '—'}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <StageBadge stage={deal.stage} />
                      </td>
                      <td className="px-5 py-4 text-sm font-semibold text-gray-900">
                        {formatMoney(deal.amount)}
                      </td>
                      <td className="px-5 py-4 text-sm text-gray-600">
                        {deal.contactCount > 0
                          ? `${deal.contactCount} ${deal.contactCount === 1 ? 'contact' : 'contacts'}`
                          : '—'}
                      </td>
                      <td className="px-5 py-4">
                        {(() => {
                          const daysSinceActivity = deal.lastActivityAt
                            ? Math.floor((Date.now() - new Date(deal.lastActivityAt).getTime()) / 86400000)
                            : 0;
                          
                          const fallbackCount = [
                            daysSinceActivity > 7,
                            deal.crmData?.decisionMakerEngaged === 'No',
                            deal.closeDate && new Date(deal.closeDate) < new Date(),
                            deal.isHighRisk
                          ].filter(Boolean).length;
                          
                          const displayCount = deal.warningCount || fallbackCount || (deal.isHighRisk ? 1 : 0);

                          if (displayCount > 0) {
                            return (
                              <span className="inline-flex items-center gap-1.5 text-sm">
                                <AlertCircle
                                  className={`h-4 w-4 ${deal.isHighRisk ? 'text-red-500' : 'text-amber-500'}`}
                                />
                                <span className="font-medium text-gray-800">
                                  {displayCount}
                                </span>
                              </span>
                            );
                          }
                          return <span className="text-gray-300">—</span>;
                        })()}
                      </td>
                      <td className="px-5 py-4">
                        <ActivityBars deal={deal} />
                      </td>
                    </tr>
                  ))}
                </Fragment>
              ))
            ) : (
              visibleDeals.map((deal: any) => (
                <tr
                  key={deal.id}
                  onClick={() => setSelectedDeal(deal)}
                  className="cursor-pointer bg-white transition-colors hover:bg-blue-50/30"
                >
                  <td className="px-5 py-4">
                    <div className="truncate text-sm font-semibold text-blue-600">
                      {deal.name}
                    </div>
                    <div className="mt-0.5 truncate text-xs text-gray-500">
                      {deal.accountName || '—'}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <StageBadge stage={deal.stage} />
                  </td>
                  <td className="px-5 py-4 text-sm font-semibold text-gray-900">
                    {formatMoney(deal.amount)}
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-600">
                    {deal.contactCount > 0
                      ? `${deal.contactCount} ${deal.contactCount === 1 ? 'contact' : 'contacts'}`
                      : '—'}
                  </td>
                  <td className="px-5 py-4">
                    {(() => {
                      const daysSinceActivity = deal.lastActivityAt
                        ? Math.floor((Date.now() - new Date(deal.lastActivityAt).getTime()) / 86400000)
                        : 0;
                      
                      const fallbackCount = [
                        daysSinceActivity > 7,
                        deal.crmData?.decisionMakerEngaged === 'No',
                        deal.closeDate && new Date(deal.closeDate) < new Date(),
                        deal.isHighRisk
                      ].filter(Boolean).length;
                      
                      const displayCount = deal.warningCount || fallbackCount || (deal.isHighRisk ? 1 : 0);

                      if (displayCount > 0) {
                        return (
                          <span className="inline-flex items-center gap-1.5 text-sm">
                            <AlertCircle
                              className={`h-4 w-4 ${deal.isHighRisk ? 'text-red-500' : 'text-amber-500'}`}
                            />
                            <span className="font-medium text-gray-800">
                              {displayCount}
                            </span>
                          </span>
                        );
                      }
                      return <span className="text-gray-300">—</span>;
                    })()}
                  </td>
                  <td className="px-5 py-4">
                    <ActivityBars deal={deal} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Loading */}
        {isLoading && (
          <div className="py-12 text-center text-sm text-gray-400">Loading deals...</div>
        )}

        {/* Empty state */}
        {!isLoading && visibleDeals.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <SlidersHorizontal className="mb-3 h-8 w-8 text-gray-200" />
            <div className="text-sm font-medium text-gray-500">No deals match your filters</div>
            <div className="mt-1 text-xs text-gray-400">
              Try switching tabs, adjusting filters, or{' '}
              <button onClick={clearAllFilters} className="text-blue-600 underline">
                clearing all
              </button>
            </div>
          </div>
        )}

        {/* Load more */}
        {hasMore && (
          <div className="border-t border-gray-100 px-5 py-4 text-center">
            <button
              onClick={() => setPage((p) => p + 1)}
              className="text-sm font-semibold text-blue-600 hover:text-blue-700"
            >
              Load more ({tabDeals.length - visibleDeals.length} remaining)
            </button>
          </div>
        )}

        {/* Row count footer */}
        {!isLoading && visibleDeals.length > 0 && (
          <div className="border-t border-gray-100 px-5 py-3 text-right text-xs text-gray-400">
            Showing {visibleDeals.length} of {tabDeals.length} deals in this tab
          </div>
        )}
      </div>

      {/* Deal Detail Panel */}
      {selectedDeal && (
        <DealDetailPanel
          deal={selectedDeal}
          board={boardData}
          canEdit={user?.role === 'ADMIN' || user?.role === 'MANAGER' || boardData?.userPermission === 'ADMIN' || boardData?.userPermission === 'EDITOR' || selectedDeal.ownerId === user?.id}
          onClose={() => setSelectedDeal(null)}
          onDealUpdated={(updated) => setSelectedDeal(updated)}
        />
      )}
    </div>
  )
}
