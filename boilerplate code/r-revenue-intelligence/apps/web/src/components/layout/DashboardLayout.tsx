'use client';
import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', overflow: 'hidden' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        <Header />
        <main style={{ flex: 1, overflowY: 'auto', padding: '32px 40px', position: 'relative' }}>
          <div style={{ maxWidth: 1400, margin: '0 auto' }}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
