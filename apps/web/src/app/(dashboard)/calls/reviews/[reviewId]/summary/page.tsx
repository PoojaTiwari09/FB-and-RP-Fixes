import CallsReviewSummaryView from '@calls/components/pages/CallsReviewSummaryView';

interface Props {
  params: Promise<{ reviewId: string }>;
}

export default async function CallsReviewSummaryPage({ params }: Props) {
  const { reviewId } = await params;
  return <CallsReviewSummaryView reviewId={reviewId} />;
}
