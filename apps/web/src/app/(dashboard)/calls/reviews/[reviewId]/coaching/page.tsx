import CallsReviewCoachingView from '@calls/components/pages/CallsReviewCoachingView';

interface Props {
  params: Promise<{ reviewId: string }>;
}

export default async function CallsReviewCoachingPage({ params }: Props) {
  const { reviewId } = await params;
  return <CallsReviewCoachingView reviewId={reviewId} />;
}
