'use client'
import { useState, useRef, useEffect } from 'react'

export interface FilterState {
  stages: string[]
  forecastCategories: string[]
  groupBy: 'none' | 'stage' | 'rep'
  amountMin: string
  amountMax: string
  closeDate: string
}

interface Props {
  filters: FilterState
  onChange: (f: FilterState) => void
  showFilters: boolean
}

const DEFAULT_STAGES = ['Proposal', 'Negotiation', 'Discovery', 'Closed Won', 'Qualification', 'Closed Lost']
const DEFAULT_FORECAST = ['Pipeline', 'Best Case', 'Commit', 'Closed', 'Omitted']

export default function FilterBar({ filters, onChange, showFilters }: Props) {
  const contentRef = useRef<HTMLDivElement>(null)
  const [contentHeight, setContentHeight] = useState(0)

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight)
    }
  }, [filters, showFilters])

  const toggle = (arr: string[], val: string) =>
    arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val]

  const clearAllFilters = () => {
    onChange({
      ...filters,
      stages: [],
      forecastCategories: [],
      amountMin: '',
      amountMax: '',
      closeDate: '',
    })
  }

  return (
    <div
      style={{
        overflow: 'hidden',
        transition: 'max-height 0.3s ease-in-out, opacity 0.3s ease-in-out, margin-bottom 0.3s ease-in-out',
        maxHeight: showFilters ? `${contentHeight + 40}px` : '0px',
        opacity: showFilters ? 1 : 0,
        marginBottom: showFilters ? 20 : 0,
      }}
    >
      <div ref={contentRef} style={{ padding: '0 2px 2px 2px' }}>
        {/* Filter Panel - 4 Column Grid */}
        <div style={{
          padding: '20px 24px', background: '#fff',
          border: '1px solid #e8eaed', borderRadius: 12,
          display: 'flex', flexDirection: 'column', gap: 16
        }}>
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 32,
          }}>
            {/* Column 1: STAGE */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, color: '#4b5563', marginBottom: 8 }}>Stage</p>
              <div style={{
                border: '1px solid #e8eaed', borderRadius: 6,
                height: 110, overflowY: 'auto', padding: '4px'
              }}>
                {DEFAULT_STAGES.map(s => {
                  const isSelected = filters.stages.includes(s)
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => onChange({ ...filters, stages: toggle(filters.stages, s) })}
                      style={{
                        display: 'block', width: '100%', padding: '4px 8px', borderRadius: 4,
                        background: isSelected ? '#eef2ff' : 'transparent',
                        color: isSelected ? '#4f46e5' : '#1a1d23',
                        fontSize: 13, textAlign: 'left', cursor: 'pointer',
                        border: 'none', transition: 'background 0.1s'
                      }}
                    >
                      {s}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Column 2: FORECAST CATEGORY */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, color: '#4b5563', marginBottom: 8 }}>Forecast Category</p>
              <div style={{
                border: '1px solid #e8eaed', borderRadius: 6,
                height: 110, overflowY: 'auto', padding: '4px'
              }}>
                {DEFAULT_FORECAST.map(fc => {
                  const isSelected = filters.forecastCategories.includes(fc)
                  return (
                    <button
                      key={fc}
                      type="button"
                      onClick={() => onChange({ ...filters, forecastCategories: toggle(filters.forecastCategories, fc) })}
                      style={{
                        display: 'block', width: '100%', padding: '4px 8px', borderRadius: 4,
                        background: isSelected ? '#eef2ff' : 'transparent',
                        color: isSelected ? '#4f46e5' : '#1a1d23',
                        fontSize: 13, textAlign: 'left', cursor: 'pointer',
                        border: 'none', transition: 'background 0.1s'
                      }}
                    >
                      {fc}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Column 3: AMOUNT RANGE */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, color: '#4b5563', marginBottom: 8 }}>Amount</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <input type="number" placeholder="Min" value={filters.amountMin}
                  onChange={e => onChange({ ...filters, amountMin: e.target.value })}
                  style={{ padding: '8px 12px', border: '1px solid #e8eaed', borderRadius: 6, fontSize: 13, width: '100%', outline: 'none' }} />
                <input type="number" placeholder="Max" value={filters.amountMax}
                  onChange={e => onChange({ ...filters, amountMax: e.target.value })}
                  style={{ padding: '8px 12px', border: '1px solid #e8eaed', borderRadius: 6, fontSize: 13, width: '100%', outline: 'none' }} />
              </div>
            </div>

            {/* Column 4: CLOSE DATE */}
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, color: '#4b5563', marginBottom: 8 }}>Close Date</p>
              <div>
                <input type="date" value={filters.closeDate}
                  onChange={e => onChange({ ...filters, closeDate: e.target.value })}
                  style={{ padding: '8px 12px', border: '1px solid #e8eaed', borderRadius: 6, fontSize: 13, width: '100%', outline: 'none', color: '#1a1d23' }} />
              </div>
            </div>
          </div>

          {/* Clear Filters Button */}
          <div style={{ marginTop: 8 }}>
            <button
              onClick={clearAllFilters}
              style={{
                background: 'none', border: 'none', color: '#4f46e5',
                fontSize: 13, fontWeight: 500, cursor: 'pointer', padding: 0
              }}
            >
              Clear all filters
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
