import { requireRole } from '@shared/lib/auth';
import { redirect } from 'next/navigation';
import TopicsRepView from '@topics/components/rep/TopicsRepView';

export default async function TopicsPage() {
  try {
    await requireRole(['sales_rep']);
  } catch {
    redirect('/engage');
  }
  return <TopicsRepView />;
}
