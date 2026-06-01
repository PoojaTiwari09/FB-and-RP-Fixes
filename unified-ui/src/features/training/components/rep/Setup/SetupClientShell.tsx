'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Loader2 } from 'lucide-react';
import { VoiceOption } from '@training/types/trainingSetup.types';
import { createTrainingSession } from '@training/services/trainingSetup.service';
import VoiceSelector from './VoiceSelector';

interface SetupClientShellProps {
  trainingId: string;
  voices: VoiceOption[];
}

/**
 * Client shell for the Setup page.
 * Owns selectedVoiceId state and wires it to both VoiceSelector and createTrainingSession.
 * This lets the parent Setup page stay a server component.
 */
export default function SetupClientShell({ trainingId, voices }: SetupClientShellProps) {
  const router = useRouter();
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>(
    voices.length > 0 ? voices[0].id : ''
  );
  const [isStarting, setIsStarting] = useState(false);

  async function handleStartTraining() {
    if (isStarting) return;
    setIsStarting(true);
    try {
      const { sessionId } = await createTrainingSession(trainingId, selectedVoiceId);
      // Persist selected voice so the session page can use it for TTS
      sessionStorage.setItem(`voice-${sessionId}`, selectedVoiceId);
      router.push(`/training/${trainingId}/sessions/${sessionId}`);
    } catch {
      setIsStarting(false);
    }
  }

  return (
    <>
      {/* Voice Selection — injected between Coaching Playbook and sticky footer */}
      <VoiceSelector
        voices={voices}
        selectedVoiceId={selectedVoiceId}
        onSelect={setSelectedVoiceId}
      />

      {/* Sticky footer */}
      <div className="sticky bottom-0 bg-white border-t border-gray-200 px-8 py-4 flex items-center justify-between">
        <Link
          href="/training"
          className="inline-flex items-center gap-1.5 px-5 py-2.5 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors"
        >
          <ChevronLeft size={16} />
          Back
        </Link>
        <button
          onClick={handleStartTraining}
          disabled={isStarting || !selectedVoiceId}
          className="inline-flex items-center gap-2 px-6 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors shadow-sm hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isStarting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Starting…
            </>
          ) : (
            'Start Training'
          )}
        </button>
      </div>
    </>
  );
}
