import { requireRole } from '@shared/lib/auth';
import { redirect } from 'next/navigation';
import AIDeepResearcherManagerView from '@ai-deep-researcher/components/manager/AIDeepResearcherManagerView';

export default async function AIDeepResearcherPage() {
  try {
    await requireRole(['sales_manager']);
  } catch {
    redirect('/engage');
  }
  return <AIDeepResearcherManagerView />;
}
