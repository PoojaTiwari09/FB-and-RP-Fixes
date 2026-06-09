import { requireRole } from '@shared/lib/auth';
import { redirect } from 'next/navigation';
import TrackersRepView from '@trackers/components/rep/TrackersRepView';

export default async function TrackersPage() {
  try {
    await requireRole(['sales_rep']);
  } catch {
    redirect('/engage');
  }
  return <TrackersRepView />;
}
