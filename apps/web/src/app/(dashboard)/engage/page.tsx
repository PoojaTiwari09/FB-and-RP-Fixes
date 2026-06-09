import { getUserRole } from '@shared/lib/auth';
import EngageRepView from '@engage/components/rep/EngageRepView';
import EngageManagerView from '@engage/components/manager/EngageManagerView';

export default async function EngagePage() {
  const role = await getUserRole();
  return role === 'sales_manager' ? <EngageManagerView /> : <EngageRepView />;
}
