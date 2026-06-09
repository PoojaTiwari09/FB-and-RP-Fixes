'use client'
import type { ActivityData } from '@deal-boards/components/services/dealBoardsService'
import { ArrowUpRight, ArrowDownLeft, Phone, Mail, MessageSquare, FileText } from 'lucide-react'

interface Props { data: ActivityData | null; loading: boolean }

const typeIcon = (type: string) => {
  if (type.toLowerCase().includes('call') || type.toLowerCase().includes('demo')) return <Phone size={13} />
  if (type.toLowerCase().includes('email')) return <Mail size={13} />
  if (type.toLowerCase().includes('note')) return <FileText size={13} />
  return <MessageSquare size={13} />
}

export default function ActivityTab({ data, loading }: Props) {
  if (loading) return <div style={{ padding: 24, color: '#9ca3af', fontSize: 13 }}>Loading activity...</div>
  if (!data) return <div style={{ padding: 24, color: '#9ca3af', fontSize: 13 }}>No activity data</div>

  return (
    <div style={{ padding: '16px 20px' }}>
      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
        <div style={{ background: '#fff', border: '1px solid #e8eaed', borderRadius: 8, padding: 12, textAlign: 'center' }}>
          <p style={{ fontSize: 20, fontWeight: 800, color: '#4f46e5' }}>{data.ourInteractions}</p>
          <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>Our Interactions</p>
        </div>
        <div style={{ background: '#fff', border: '1px solid #e8eaed', borderRadius: 8, padding: 12, textAlign: 'center' }}>
          <p style={{ fontSize: 20, fontWeight: 800, color: '#10b981' }}>{data.customerInteractions}</p>
          <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>Customer Interactions</p>
        </div>
        <div style={{ background: '#fff', border: '1px solid #e8eaed', borderRadius: 8, padding: 12, textAlign: 'center' }}>
          <p style={{ fontSize: 20, fontWeight: 800, color: '#f59e0b' }}>{data.totalMinutes}</p>
          <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>Total Minutes</p>
        </div>
      </div>

      {/* Timeline */}
      <div style={{ position: 'relative' }}>
        {data.events.map((event, i) => (
          <div key={event.activityId} style={{
            display: 'flex', gap: 14, marginBottom: 16,
          }}>
            {/* Timeline line */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
              <div style={{
                width: 30, height: 30, borderRadius: '50%',
                background: event.direction === 'outbound' ? '#eef2ff' : '#f0fdf4',
                border: `2px solid ${event.direction === 'outbound' ? '#c7d2fe' : '#bbf7d0'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: event.direction === 'outbound' ? '#4f46e5' : '#10b981',
              }}>
                {typeIcon(event.type)}
              </div>
              {i < data.events.length - 1 && (
                <div style={{ width: 1, flex: 1, background: '#e8eaed', minHeight: 12, marginTop: 4 }} />
              )}
            </div>

            <div style={{ flex: 1, paddingBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontWeight: 600, fontSize: 13, color: '#1a1d23' }}>{event.type}</span>
                <span style={{
                  display: 'flex', alignItems: 'center', gap: 3,
                  fontSize: 11, color: event.direction === 'outbound' ? '#4f46e5' : '#10b981',
                  background: event.direction === 'outbound' ? '#eef2ff' : '#f0fdf4',
                  padding: '2px 6px', borderRadius: 4,
                }}>
                  {event.direction === 'outbound' ? <ArrowUpRight size={10} /> : <ArrowDownLeft size={10} />}
                  {event.direction}
                </span>
                <span style={{ fontSize: 11, color: '#9ca3af' }}>{event.duration}m</span>
              </div>
              <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>{event.date}</p>
              <p style={{ fontSize: 13, color: '#6b7280', lineHeight: 1.5 }}>{event.notes}</p>
              {event.participants.length > 0 && (
                <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
                  {event.participants.map((p, pi) => (
                    <span key={pi} style={{
                      fontSize: 11, color: '#6b7280', background: '#f3f4f6',
                      padding: '2px 7px', borderRadius: 10,
                    }}>{p}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}




