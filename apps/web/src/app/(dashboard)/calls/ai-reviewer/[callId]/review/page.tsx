import CallDetailReview from '@calls/components/rep/CallDetailReview';

interface Props {
  params: Promise<{ callId: string }>;
}

export default async function ReviewPage({ params }: Props) {
  const { callId } = await params;
  return <CallDetailReview callId={callId} />;
}
