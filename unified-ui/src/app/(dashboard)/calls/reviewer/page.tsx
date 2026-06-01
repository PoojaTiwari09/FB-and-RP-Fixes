import { redirect } from 'next/navigation';
import { getUserRole } from '@shared/lib/auth';

/** Legacy sidebar link → module-specific reviewer UIs */
export default async function CallsReviewerRedirectPage() {
  const role = await getUserRole();
  if (role === 'sales_manager') {
    redirect('/calls/reviews/list');
  }
  redirect('/calls/ai-reviewer');
}
