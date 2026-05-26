// M10 Revenue Graph — Next.js Page Route
// Route: /modules/m10-data-compliance/revenue-graph
// Lazy-loads the dashboard to keep the initial bundle small.

import type { Metadata } from 'next';
import dynamic from 'next/dynamic';

export const metadata: Metadata = {
  title: 'Revenue Graph | M10 Data & Compliance',
  description: 'Entity linking pipeline — maps captured interactions to accounts, contacts, and deals. Part of the M10 Data & Compliance module.',
};

const RevenueGraphDashboard = dynamic(
  () => import('../components/RevenueGraphDashboard/index'),
  {
    loading: () => (
      <div style={{
        fontFamily: "'Inter', sans-serif", background: '#0a0f1e', minHeight: '100vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#475569',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🕸️</div>
          <div style={{ fontSize: 16 }}>Loading Revenue Graph…</div>
        </div>
      </div>
    ),
    ssr: false,
  },
);

export default function RevenueGraphPage() {
  return <RevenueGraphDashboard />;
}
