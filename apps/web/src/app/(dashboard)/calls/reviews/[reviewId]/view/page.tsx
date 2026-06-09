import CallsReviewViewView from '@calls/components/pages/CallsReviewViewView';

interface Props {
  params: Promise<{ reviewId: string }>;
}

export default async function CallsReviewViewPage({ params }: Props) {
  const { reviewId } = await params;
  return <CallsReviewViewView reviewId={reviewId} />;
}
