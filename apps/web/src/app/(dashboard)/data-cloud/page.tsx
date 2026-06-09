import { requireRole } from '@shared/lib/auth';
import { redirect } from 'next/navigation';
import DataCloudManagerView from '@data-cloud/components/manager/DataCloudManagerView';

export default async function DataCloudPage() {
  try {
    await requireRole(['sales_manager']);
  } catch {
    redirect('/engage');
  }
  return <DataCloudManagerView />;
}
