// Revenue Graph — App Router Page
// Route: /modules/m10-data-compliance/revenue-graph
// Direct import of the dashboard component (no extra re-export layer)

import type { Metadata } from 'next';
import RevenueGraphDashboard from '../../../../modules/m10-data-compliance/components/RevenueGraphDashboard/index';

export const metadata: Metadata = {
  title: 'Revenue Graph | M10 Data & Compliance',
  description: 'Entity linking pipeline — maps captured interactions to accounts, contacts, and deals. M10 Data & Compliance module.',
};

export default function RevenueGraphPage() {
  return <RevenueGraphDashboard />;
}
