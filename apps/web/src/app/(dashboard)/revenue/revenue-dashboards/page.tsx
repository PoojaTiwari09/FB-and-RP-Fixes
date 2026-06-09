import { requireRole } from '@shared/lib/auth';
import { redirect } from 'next/navigation';
import RevenueDashboardsManagerView from '@revenue/components/manager/RevenueDashboardsManagerView';

export default async function RevenueDashboardsPage() {
  try {
    await requireRole(['sales_manager']);
  } catch {
    redirect('/engage');
  }
  return <RevenueDashboardsManagerView />;
}
