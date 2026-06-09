import { requireRole } from '@shared/lib/auth';
import { redirect } from 'next/navigation';
import AIRevenuePredictorManagerView from '@ai-revenue-predictor/components/manager/AIRevenuePredictorManagerView';

export default async function AIRevenuePredictorPage() {
  try {
    await requireRole(['sales_manager']);
  } catch {
    redirect('/engage');
  }
  return <AIRevenuePredictorManagerView />;
}
