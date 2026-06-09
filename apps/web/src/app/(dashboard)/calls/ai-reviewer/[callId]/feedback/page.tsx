import CallDetailFeedback from '@calls/components/rep/CallDetailFeedback';

interface Props {
  params: Promise<{ callId: string }>;
}

export default async function FeedbackPage({ params }: Props) {
  const { callId } = await params;
  return <CallDetailFeedback callId={callId} />;
}
