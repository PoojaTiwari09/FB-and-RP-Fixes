import CallsReviewSubmittedView from '@calls/components/pages/CallsReviewSubmittedView';

interface Props {
  params: Promise<{ reviewId: string }>;
}

export default async function CallsReviewSubmittedPage({ params }: Props) {
  const { reviewId } = await params;
  return <CallsReviewSubmittedView reviewId={reviewId} />;
}
