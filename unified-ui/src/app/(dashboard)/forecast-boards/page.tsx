import { requireRole } from '@shared/lib/auth';
import { redirect } from 'next/navigation';
import ForecastBoardsRepView from '@forecast/components/rep/ForecastBoardsRepView';

export default async function ForecastBoardsPage() {
  try {
    await requireRole(['sales_rep']);
  } catch {
    redirect('/engage');
  }
  return <ForecastBoardsRepView />;
}
