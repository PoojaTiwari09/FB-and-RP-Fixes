'use client';

import { useState, useCallback, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import type {
  Contact,
  PreCallBrief,
  SessionStartResponse,
  CallSummary,
  SmartCallScreen,
} from '@smart-call/types/smart-call.types';
import {
  fetchPreCallBrief,
  startSession,
  endSession,
  fetchCallSummary,
} from '@smart-call/services/smart-call.service';
import { loadSmartCallApiKeys } from '@smart-call/lib/api-keys';

import ContactSelectionScreen    from '@smart-call/components/ContactSelectionScreen';
import PreCallScreen             from '@smart-call/components/PreCallScreen';
import LoadingScreen             from '@smart-call/components/LoadingScreen';
import LiveSessionScreen         from '@smart-call/components/LiveSessionScreen';
import GeneratingSummaryScreen   from '@smart-call/components/GeneratingSummaryScreen';
import CallSummaryScreen         from '@smart-call/components/CallSummaryScreen';

export default function SmartCallPage() {
  const [screen,          setScreen]         = useState<SmartCallScreen>('contact-selection');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [preCallBrief,    setPreCallBrief]    = useState<PreCallBrief | null>(null);
  const [session,         setSession]         = useState<SessionStartResponse | null>(null);
  const [callSummary,     setCallSummary]     = useState<CallSummary | null>(null);

  const searchParams = useSearchParams();
  const queryContactId = searchParams.get('contactId');

  useEffect(() => {
    if (queryContactId) {
      // Auto-load pre-call brief for queryContactId
      const autoLoad = async () => {
        try {
          const brief = await fetchPreCallBrief(queryContactId);
          setPreCallBrief(brief);
          setSelectedContact({
            contactId: brief.contactId,
            contactName: brief.contactName,
            jobTitle: brief.dealStage || '',
            company: brief.contactCompany || '',
            avatarUrl: null,
            lastInteractionLabel: '',
            phone: '',
          });
          setScreen('pre-call');
        } catch (err) {
          console.error('Failed to auto-load contact for smart call:', err);
        }
      };
      autoLoad();
    }
  }, [queryContactId]);

  // ── Step 1: Contact selected → fetch pre-call brief → pre-call screen ──
  const handleContactSelect = useCallback(async (contact: Contact) => {
    setSelectedContact(contact);
    const brief = await fetchPreCallBrief(contact.contactId);
    setPreCallBrief(brief);
    setScreen('pre-call');
  }, []);

  // ── Step 2: "Start Live Assist" clicked → start session → loading → live ─
  const handleStartLiveAssist = useCallback(async () => {
    if (!selectedContact) return;
    setScreen('loading');
    const [sess] = await Promise.all([
      startSession(selectedContact.contactId),
      new Promise<void>((resolve) => setTimeout(resolve, 1800)), // min loading UX
    ]);
    setSession(sess);
    setScreen('live-session');
  }, [selectedContact]);

  // ── Step 3: Session ended → generating-summary screen → call-summary ──
  const handleEndSession = useCallback(async (
    transcript: string,
    duration: string,
    finalSummaryText?: string,
  ) => {
    if (!session) return;

    setScreen('generating-summary');
    await endSession(session.sessionId);

    let summary: CallSummary;
    try {
      if (finalSummaryText) {
        summary = {
          ...(await fetchCallSummary(session.sessionId)),
          aiSummary: finalSummaryText,
          duration,
        };
      } else {
        const keys = loadSmartCallApiKeys();
        const res = await fetch('/api/smart-call/summarize', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transcript,
            sessionId: session.sessionId,
            callType: session.taskTitle,
            duration,
            groqApiKey: keys.groq,
            openRouterApiKey: keys.openRouter,
          }),
        });
        summary = res.ok
          ? (await res.json() as CallSummary)
          : await fetchCallSummary(session.sessionId);
      }
    } catch {
      summary = await fetchCallSummary(session.sessionId);
    }

    setCallSummary(summary);
    setScreen('call-summary');
  }, [session]);

  // ── Step 4: "Back to Dashboard" or "Practice Again" → reset ────────────
  const handleReset = useCallback(() => {
    setScreen('contact-selection');
    setSelectedContact(null);
    setPreCallBrief(null);
    setSession(null);
    setCallSummary(null);
  }, []);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {screen === 'contact-selection' && (
        <ContactSelectionScreen onContactSelect={handleContactSelect} />
      )}

      {screen === 'pre-call' && preCallBrief && (
        <PreCallScreen
          brief={preCallBrief}
          onStart={handleStartLiveAssist}
          onBack={handleReset}
        />
      )}

      {screen === 'loading' && <LoadingScreen />}

      {screen === 'generating-summary' && <GeneratingSummaryScreen />}

      {screen === 'live-session' && session && preCallBrief && (
        <LiveSessionScreen
          session={session}
          preCallBrief={preCallBrief}
          onEnd={handleEndSession}
        />
      )}

      {screen === 'call-summary' && callSummary && (
        <CallSummaryScreen
          summary={callSummary}
          onBack={handleReset}
          onPracticeAgain={handleReset}
        />
      )}
    </div>
  );
}
