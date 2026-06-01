import CallDetailLayout from '@calls/components/rep/CallDetailLayout';

interface Props {
  children: React.ReactNode;
  params: Promise<{ callId: string }>;
}

export default async function CallDetailRootLayout({ children, params }: Props) {
  const { callId } = await params;
  return <CallDetailLayout callId={callId}>{children}</CallDetailLayout>;
}
