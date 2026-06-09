'use client';

import type { LiveSessionData } from '@smart-call/types/smart-call.types';
import { overlayFromSession } from '@smart-call/lib/overlay-from-session';
import OverlayWidget from '@smart-call/components/OverlayWidget';

type Props = {
  data: LiveSessionData;
  contactName: string;
  contactCompany: string;
  onClose: () => void;
};

/** Document PiP shell — original dark Coach / Signals / Log overlay. */
export default function SmartCallPiPOverlay({
  data,
  contactName,
  contactCompany,
  onClose,
}: Props) {
  return (
    <OverlayWidget
      mode="embedded"
      data={overlayFromSession(data)}
      logEntries={data.logEntries}
      signals={data.signals}
      talkRatio={data.talkRatio}
      metrics={data.metrics}
      contactName={contactName}
      contactCompany={contactCompany}
      onClose={onClose}
    />
  );
}
