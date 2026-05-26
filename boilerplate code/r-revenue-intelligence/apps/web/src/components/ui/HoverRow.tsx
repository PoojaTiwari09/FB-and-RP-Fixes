'use client';
import React, { useState } from 'react';

export function HoverRow({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      style={{
        display: 'grid', alignItems: 'center', padding: '16px 24px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: hovered ? 'rgba(255,255,255,0.04)' : 'transparent',
        transition: 'all 0.2s ease', cursor: 'pointer',
        ...style,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {children}
    </div>
  );
}
