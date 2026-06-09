import { requireRole } from '@shared/lib/auth';
import { redirect } from 'next/navigation';
import AITranscriberManagerView from '@calls/components/manager/AITranscriberManagerView';

export default async function AITranscriberPage() {
  try {
    await requireRole(['sales_manager']);
  } catch {
    redirect('/engage');
  }
  return <AITranscriberManagerView />;
}
