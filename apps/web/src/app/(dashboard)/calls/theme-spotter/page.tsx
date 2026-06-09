import { getUserRole } from '@shared/lib/auth';
import AIThemeSpotterRepView from '@calls/components/rep/AIThemeSpotterRepView';
import AIThemeSpotterManagerView from '@calls/components/manager/AIThemeSpotterManagerView';

export default async function AIThemeSpotterPage() {
  const role = await getUserRole();
  return role === 'sales_manager' ? <AIThemeSpotterManagerView /> : <AIThemeSpotterRepView />;
}
