import { SharedBriefView } from "@/components/shared/SharedBriefView";

interface Props {
  params: Promise<{ token: string }>;
}

export default async function SharedBriefPage({ params }: Props) {
  const { token } = await params;
  return <SharedBriefView token={token} />;
}

export const dynamic = "force-dynamic";
