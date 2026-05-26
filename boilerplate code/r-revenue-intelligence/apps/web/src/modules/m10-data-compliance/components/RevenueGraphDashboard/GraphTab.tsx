'use client';
import React, { useRef, useState, useEffect, useMemo } from 'react';
import type { Account, Deal } from '../../types/revenue-graph.types';

/**
 * Revenue Graph Visualization — BRD §6.4 (RG-14 / RG-16)
 * Interconnected entity relationship graph: Hub → Accounts → Deals
 * Relationships stored as graph connections (RG-14).
 */

interface GraphNode {
  id: string; label: string; type: 'hub' | 'account' | 'deal';
  x: number; y: number; color: string; radius: number; sub?: string;
}
interface GraphEdge { from: string; to: string; label?: string; }

const GRAPH_HEIGHT = 580;

export function GraphTab({ accounts, deals }: { accounts: Account[]; deals: Deal[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [width, setWidth] = useState(900);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      const w = entries[0]?.contentRect?.width;
      if (w && w > 100) setWidth(w);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const { nodes, edges } = useMemo(() => {
    const cx = width / 2;
    const cy = GRAPH_HEIGHT / 2;
    const ns: GraphNode[] = [];
    const es: GraphEdge[] = [];

    ns.push({ id: 'hub', label: 'Revenue Graph', type: 'hub', x: cx, y: cy, color: '#818cf8', radius: 44, sub: 'Entity Map · RG-16' });

    const aRad = Math.min(cx, cy) * 0.48;
    accounts.forEach((a, i) => {
      const angle = (2 * Math.PI * i) / Math.max(accounts.length, 1) - Math.PI / 2;
      ns.push({ id: `a-${a.accountId}`, label: a.name, type: 'account', x: cx + aRad * Math.cos(angle), y: cy + aRad * Math.sin(angle), color: '#38bdf8', radius: 30, sub: a.domain ?? '' });
      es.push({ from: 'hub', to: `a-${a.accountId}` });
    });

    const dRad = Math.min(cx, cy) * 0.82;
    deals.forEach((d, i) => {
      const angle = (2 * Math.PI * i) / Math.max(deals.length, 1) + Math.PI / 7;
      const col = d.isActive ? '#10b981' : '#64748b';
      const label = d.name.length > 20 ? d.name.slice(0, 18) + '…' : d.name;
      ns.push({ id: `d-${d.dealId}`, label, type: 'deal', x: cx + dRad * Math.cos(angle), y: cy + dRad * Math.sin(angle), color: col, radius: 22, sub: `$${((d.amount ?? 0) / 1000).toFixed(0)}K · ${d.stage}` });
      const parent = accounts.find(a => a.accountId === d.account?.accountId);
      es.push({ from: parent ? `a-${parent.accountId}` : 'hub', to: `d-${d.dealId}`, label: d.stage });
    });

    return { nodes: ns, edges: es };
  }, [accounts, deals, width]);

  return (
    <div style={{ background: 'rgba(8,14,30,0.4)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '16px 28px', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.015)' }}>
        <div>
          <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: 16 }}>Entity Relationship Graph</div>
          <div style={{ color: '#64748b', fontSize: 12, marginTop: 2 }}>RG-14 · Accounts → Deals linked via deterministic + AI entity resolution</div>
        </div>
        <div style={{ display: 'flex', gap: 16, fontSize: 11, fontWeight: 500, color: '#94a3b8' }}>
          {[
            { color: '#818cf8', label: 'Hub' },
            { color: '#38bdf8', label: 'Account' },
            { color: '#10b981', label: 'Deal (Active)' },
            { color: '#64748b', label: 'Deal (Closed)' },
          ].map(l => (
            <span key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: l.color, boxShadow: `0 0 6px ${l.color}80` }} />{l.label}
            </span>
          ))}
        </div>
      </div>

      {/* SVG Container — fixed height prevents infinite resize loop */}
      <div ref={containerRef} style={{ width: '100%', height: GRAPH_HEIGHT, position: 'relative' }}>
        <svg width="100%" height="100%" viewBox={`0 0 ${width} ${GRAPH_HEIGHT}`} style={{ display: 'block' }}>
          <defs>
            <filter id="nodeGlow"><feGaussianBlur stdDeviation="3.5" result="blur" /><feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge></filter>
          </defs>

          {/* Edges */}
          {edges.map((e, i) => {
            const f = nodes.find(n => n.id === e.from);
            const t = nodes.find(n => n.id === e.to);
            if (!f || !t) return null;
            const lit = hoveredNode === e.from || hoveredNode === e.to;
            return (
              <g key={i}>
                <line x1={f.x} y1={f.y} x2={t.x} y2={t.y}
                  stroke={lit ? '#818cf8' : 'rgba(148,163,184,0.12)'}
                  strokeWidth={lit ? 2 : 1} strokeDasharray={lit ? '' : '4,4'}
                  style={{ transition: 'stroke .25s, stroke-width .25s' }} />
                {lit && e.label && <text x={(f.x + t.x) / 2} y={(f.y + t.y) / 2 - 10} textAnchor="middle" fill="#c7d2fe" fontSize={10} fontWeight={600}>{e.label}</text>}
              </g>
            );
          })}

          {/* Nodes */}
          {nodes.map(n => {
            const h = hoveredNode === n.id;
            return (
              <g key={n.id} onMouseEnter={() => setHoveredNode(n.id)} onMouseLeave={() => setHoveredNode(null)} style={{ cursor: 'pointer' }}>
                {h && <circle cx={n.x} cy={n.y} r={n.radius + 10} fill="none" stroke={n.color} strokeWidth={1.5} opacity={.4} filter="url(#nodeGlow)" />}
                <circle cx={n.x} cy={n.y} r={h ? n.radius + 3 : n.radius} fill={`${n.color}12`} stroke={n.color} strokeWidth={h ? 2.5 : 1.5}
                  style={{ transition: 'all .25s cubic-bezier(.4,0,.2,1)' }} />
                <text x={n.x} y={n.y + 2} textAnchor="middle" dominantBaseline="middle" fontSize={n.radius * 0.65} fill={n.color}>
                  {n.type === 'hub' ? '🕸️' : n.type === 'account' ? '🏢' : '💼'}
                </text>
                <text x={n.x} y={n.y + n.radius + 16} textAnchor="middle" fill={h ? '#fff' : '#e2e8f0'} fontSize={12} fontWeight={h ? 700 : 500}
                  style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,.6))' }}>{n.label}</text>
                {n.sub && <text x={n.x} y={n.y + n.radius + 30} textAnchor="middle" fill="#94a3b8" fontSize={10}>{n.sub}</text>}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
