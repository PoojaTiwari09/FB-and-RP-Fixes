import { requireRole } from '@shared/lib/auth';
import { redirect } from 'next/navigation';
import AccountsManagerView from '@revenue/components/manager/AccountsManagerView';

export default async function AccountsPage() {
  try {
    await requireRole(['sales_manager']);
  } catch {
    redirect('/engage');
  }
  return <AccountsManagerView />;
}
