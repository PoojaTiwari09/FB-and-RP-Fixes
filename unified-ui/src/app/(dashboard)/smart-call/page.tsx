import { requireRole } from '@shared/lib/auth';
import { redirect } from 'next/navigation';
import SmartCallPage from '@smart-call/pages/SmartCallPage';

import { Suspense } from 'react';

export default async function SmartCallRoutePage() {
  try {
    await requireRole(['sales_rep']);
  } catch {
    redirect('/engage');
  }
  return (
    <Suspense fallback={<div className="p-6">Loading Smart Call...</div>}>
      <SmartCallPage />
    </Suspense>
  );
}
