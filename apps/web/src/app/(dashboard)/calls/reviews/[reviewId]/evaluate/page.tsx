import CallsReviewEvaluateView from '@calls/components/pages/CallsReviewEvaluateView';

interface Props {
  params: Promise<{ reviewId: string }>;
}

export default async function CallsReviewEvaluatePage({ params }: Props) {
  const { reviewId } = await params;
  return <CallsReviewEvaluateView reviewId={reviewId} />;
}
