import CallsReviewDetailView from '@calls/components/pages/CallsReviewDetailView';

interface Props {
  params: Promise<{ reviewId: string }>;
}

export default async function CallsReviewDetailPage({ params }: Props) {
  const { reviewId } = await params;
  return <CallsReviewDetailView reviewId={reviewId} />;
}
