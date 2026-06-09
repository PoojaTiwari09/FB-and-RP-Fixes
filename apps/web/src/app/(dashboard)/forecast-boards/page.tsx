import { requireRole } from '@shared/lib/auth';
import { redirect } from 'next/navigation';
import ForecastBoardsRepView from '@forecast/components/rep/ForecastBoardsRepView';
import ForecastBoardsManagerView from '@forecast/components/manager/ForecastBoardsManagerView';

export default async function ForecastBoardsPage() {
  let session;
  try {
    session = await requireRole(['sales_rep', 'sales_manager']);
  } catch {
    redirect('/engage');
  }

  if (session.role === 'sales_manager') {
    return <ForecastBoardsManagerView />;
  }

  return <ForecastBoardsRepView />;
}

