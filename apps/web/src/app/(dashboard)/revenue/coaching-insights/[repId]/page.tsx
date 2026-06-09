import CoachingRepManagerView from '@/features/revenue/components/manager/CoachingRepManagerView';

export default async function CoachingRepPage({ params }: { params: Promise<{ repId: string }> }) {
  const resolvedParams = await params;
  return <CoachingRepManagerView repId={resolvedParams.repId} />;
}
