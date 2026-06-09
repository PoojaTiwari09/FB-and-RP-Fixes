import { requireRole } from '@shared/lib/auth';
import { redirect } from 'next/navigation';
import CoachingInsightsManagerView from '@revenue/components/manager/CoachingInsightsManagerView';

export default async function CoachingInsightsPage() {
  try {
    await requireRole(['sales_manager']);
  } catch {
    redirect('/engage');
  }
  return <CoachingInsightsManagerView />;
}
