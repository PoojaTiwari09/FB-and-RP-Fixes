import { requireRole } from '@shared/lib/auth';
import { redirect } from 'next/navigation';
import AITranslatorManagerView from '@calls/components/manager/AITranslatorManagerView';

export default async function AITranslatorPage() {
  try {
    await requireRole(['sales_manager']);
  } catch {
    redirect('/engage');
  }
  return <AITranslatorManagerView />;
}
