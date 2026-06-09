import { requireRole } from '@shared/lib/auth';
import { redirect } from 'next/navigation';
import DealDriversManagerView from '@deal-drivers/components/manager/DealDriversManagerView';

export default async function DealDriversPage() {
  try {
    await requireRole(['sales_manager']);
  } catch {
    redirect('/engage');
  }
  return <DealDriversManagerView />;
}
