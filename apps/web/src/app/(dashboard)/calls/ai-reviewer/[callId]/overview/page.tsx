import CallDetailOverview from '@calls/components/rep/CallDetailOverview';

interface Props {
  params: Promise<{ callId: string }>;
}

export default async function OverviewPage({ params }: Props) {
  const { callId } = await params;
  return <CallDetailOverview callId={callId} />;
}
