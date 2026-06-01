import { requireRole } from '@shared/lib/auth';
import { redirect } from 'next/navigation';
import SmartCallPage from '@smart-call/pages/SmartCallPage';

export default async function SmartCallRoutePage() {
  try {
    await requireRole(['sales_rep']);
  } catch {
    redirect('/engage');
  }
  return <SmartCallPage />;
}
