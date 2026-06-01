import { redirect } from 'next/navigation';

interface Props {
  params: Promise<{ callId: string }>;
}

export default async function CallDetailIndexPage({ params }: Props) {
  const { callId } = await params;
  redirect(`/calls/ai-reviewer/${callId}/overview`);
}
