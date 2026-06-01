import { getUserRole } from '@shared/lib/auth';
import CallsListRepView from '@calls/components/rep/CallsListRepView';
import CallsListManagerView from '@calls/components/manager/CallsListManagerView';

export default async function CallsListPage() {
  const role = await getUserRole();
  return role === 'sales_manager' ? <CallsListManagerView /> : <CallsListRepView />;
}
