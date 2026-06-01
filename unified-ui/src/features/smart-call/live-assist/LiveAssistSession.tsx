'use client';

import dynamic from 'next/dynamic';
import type { PreCallBrief, SessionStartResponse } from '@smart-call/types/smart-call.types';

const LiveAssistView = dynamic(
  () => import('./components/LiveAssistView'),
  { ssr: false, loading: () => <div className="p-8 text-sm text-gray-500">Loading Live Call Assist…</div> },
);

type Props = {
  session: SessionStartResponse;
  preCallBrief: PreCallBrief;
  onEnd: (transcript: string, duration: string, finalSummary?: string) => Promise<void>;
};

export default function LiveAssistSession({ session, preCallBrief, onEnd }: Props) {
  const dealContext = {
    id: session.contactId,
    contactId: session.contactId,
    company: session.contactCompany || preCallBrief.contactCompany,
    contact: session.contactName || preCallBrief.contactName,
    stage: preCallBrief.dealStage,
    value: preCallBrief.arrValue ? parseInt(String(preCallBrief.arrValue).replace(/\D/g, ''), 10) || 0 : 0,
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 -m-6">
      <LiveAssistView
        backendSessionId={session.sessionId}
        dealContext={dealContext}
        autoStartCapture
        onEndSession={async (summary, segments) => {
          const transcript = (segments as { text?: string }[])
            .map((s) => s.text)
            .filter(Boolean)
            .join('\n');
          const duration =
            segments.length > 0
              ? `${Math.floor((Date.now() - (segments[0] as { ts?: number }).ts!) / 60000)}:${String(
                  Math.floor(((Date.now() - (segments[0] as { ts?: number }).ts!) % 60000) / 1000),
                ).padStart(2, '0')}`
              : '0:00';
          await onEnd(transcript, duration, summary);
        }}
      />
    </div>
  );
}
