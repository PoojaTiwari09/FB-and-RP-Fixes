'use client';
import { useState } from 'react';
import {
  Sparkles,
  BarChart2,
  AlertTriangle,
  CheckCircle2,
  User,
  Building2,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import type { AiInsight, Priority } from '../types';

type Filter = 'All' | 'High' | 'Medium' | 'Low';

function PriorityIcon({ priority }: { priority: string }) {
  if (priority === 'high')
    return <AlertTriangle size={14} style={{ color: '#dc2626', flexShrink: 0 }} />;
  if (priority === 'medium')
    return <BarChart2 size={14} style={{ color: '#d97706', flexShrink: 0 }} />;
  return <CheckCircle2 size={14} style={{ color: '#059669', flexShrink: 0 }} />;
}

export default function AiInsights({ insights, bannerText }: { insights: AiInsight[]; bannerText?: string }) {
  const [filter, setFilter] = useState<Filter>('All');

  const counts = {
    All: insights.length,
    High: insights.filter(i => i.priority === 'high').length,
    Medium: insights.filter(i => i.priority === 'medium').length,
    Low: insights.filter(i => i.priority === 'low').length,
  };

  const filtered =
    filter === 'All'
      ? insights
      : insights.filter(i => i.priority === (filter.toLowerCase() as Priority));

  const pillBase: React.CSSProperties = {
    padding: '6px 14px',
    fontSize: 12,
    fontWeight: 500,
    border: '1px solid #e5e7eb',
    borderRadius: 20,
    cursor: 'pointer',
    transition: 'all 0.15s',
    lineHeight: '1.2',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      
      {/* Header and Filter Row Card */}
      <div style={{ background: '#fff', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', padding: '20px 20px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div style={{ background: '#f5f3ff', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Sparkles size={16} style={{ color: '#7c3aed' }} />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>AI Insights</div>
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 3 }}>
                Rule-based analysis: revenue risk · urgency · co-occurrence · win rate · benchmarks · slip prediction
              </div>
            </div>
          </div>
          
          {/* Filter pills */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {(['All', 'High', 'Medium', 'Low'] as Filter[]).map(f => {
              const isActive = filter === f;
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  style={{
                    ...pillBase,
                    background: isActive ? '#1e293b' : '#fff',
                    color: isActive ? '#fff' : '#374151',
                    borderColor: isActive ? '#1e293b' : '#e5e7eb',
                  }}
                >
                  {f} ({counts[f]})
                </button>
              );
            })}
          </div>
        </div>

        {/* Banner - Nested inside header card for cleaner layout */}
        <div style={{
          marginTop: 16,
          padding: '10px 14px',
          background: '#f5f3ff',
          border: '1px solid #ddd6fe',
          borderRadius: 6,
          fontSize: 13,
          color: '#5b21b6',
          display: 'flex',
          alignItems: 'center',
          gap: 6
        }}>
          <BarChart2 size={15} style={{ flexShrink: 0, color: '#7c3aed' }} />
          <span>{bannerText || "3 of 5 columns affected team-wide. $514K revenue at risk. Escalate enablement."}</span>
        </div>
      </div>

      {/* Insights Cards List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.map(ins => {
          let leftBorderColor = '#10b981'; // low/default
          let sevBg = '#ecfdf5';
          let sevText = '#059669';
          if (ins.priority === 'high') {
            leftBorderColor = '#dc2626';
            sevBg = '#fee2e2';
            sevText = '#dc2626';
          } else if (ins.priority === 'medium') {
            leftBorderColor = '#f59e0b';
            sevBg = '#fef3c7';
            sevText = '#d97706';
          }

          return (
            <div
              key={ins.id}
              style={{
                background: '#fff',
                borderRadius: 8,
                border: '1px solid #e5e7eb',
                borderLeft: `4px solid ${leftBorderColor}`,
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                padding: '16px 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                transition: 'transform 0.15s, box-shadow 0.15s',
              }}
            >
              {/* Card Header row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                  <PriorityIcon priority={ins.priority} />
                  <span style={{ textTransform: 'uppercase', fontSize: 11, fontWeight: 700, color: '#4b5563', letterSpacing: '0.05em' }}>
                    {ins.type}
                  </span>
                  
                  {ins.rep && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#eff6ff', color: '#1e40af', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 500 }}>
                      <User size={11} />
                      {ins.rep}
                    </span>
                  )}
                  {ins.account && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#f0fdf4', color: '#166534', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 500 }}>
                      <Building2 size={11} />
                      {ins.account}
                    </span>
                  )}
                  {ins.score && (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#f5f3ff', color: '#5b21b6', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 500 }}>
                      Score {ins.score}/100
                    </span>
                  )}
                </div>
                
                <span style={{
                  fontSize: 11,
                  fontWeight: 600,
                  padding: '2px 8px',
                  borderRadius: 4,
                  background: sevBg,
                  color: sevText,
                  textTransform: 'capitalize'
                }}>
                  {ins.priority} Priority
                </span>
              </div>

              {/* Card Title */}
              <div style={{ fontWeight: 600, fontSize: 14, color: '#111827' }}>
                {ins.insight.split(' — ')[0] || ins.insight.substring(0, 60)}
              </div>

              {/* Card Body Description */}
              <div style={{ fontSize: 13, color: '#4b5563', lineHeight: 1.5 }}>
                {ins.insight}
              </div>

              {/* Card Tags */}
              {ins.tags && ins.tags.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                  {ins.tags.map((tag, i) => (
                    <span
                      key={i}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: 11,
                        padding: '3px 8px',
                        background: '#f3f4f6',
                        color: '#4b5563',
                        borderRadius: 4,
                        fontWeight: 500,
                      }}
                    >
                      <AlertCircle size={10} style={{ color: ins.priority === 'high' ? '#dc2626' : '#d97706' }} />
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Recommended Action Link */}
              <div style={{
                marginTop: 6,
                paddingTop: 10,
                borderTop: '1px solid #f3f4f6',
                fontSize: 12,
                color: '#6b7280',
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: 4
              }}>
                <span>Recommended action:</span>
                <a
                  href="#"
                  style={{
                    color: '#2563eb',
                    fontWeight: 600,
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 3,
                    marginLeft: 2,
                  }}
                  onClick={e => e.preventDefault()}
                  onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                  onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
                >
                  <ArrowRight size={12} />
                  {ins.recommendation}
                </a>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div style={{
            background: '#fff',
            borderRadius: 8,
            border: '1px solid #e5e7eb',
            padding: 32,
            textAlign: 'center',
            color: '#9ca3af',
            fontSize: 13
          }}>
            No {filter.toLowerCase()} severity insights found.
          </div>
        )}
      </div>
    </div>
  );
}
