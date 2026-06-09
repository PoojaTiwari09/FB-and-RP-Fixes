'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { VoiceOption } from '@training/types/trainingSetup.types';

interface VoiceSelectorProps {
  voices: VoiceOption[];
  selectedVoiceId: string;
  onSelect: (voiceId: string) => void;
}

/**
 * Per-slot speech parameters.
 * Even if the browser only has one underlying voice engine,
 * pitch + rate differences make each slot clearly distinguishable.
 */
const VOICE_PARAMS: {
  pitchHint: number;
  rateHint: number;
  /** Keywords to match in SpeechSynthesisVoice.name for gender preference */
  femaleKeywords: boolean;
}[] = [
  { pitchHint: 1.0,  rateHint: 1.0,  femaleKeywords: true  }, // Voice 1 — Female, Confident & Direct
  { pitchHint: 0.78, rateHint: 0.82, femaleKeywords: false }, // Voice 2 — Male, Calm & Analytical (lower, slower)
  { pitchHint: 1.25, rateHint: 1.05, femaleKeywords: true  }, // Voice 3 — Female, Friendly (brighter pitch)
  { pitchHint: 1.05, rateHint: 1.3,  femaleKeywords: false }, // Voice 4 — Male, Energetic (faster rate)
];

/** Names typically associated with female TTS voices across browsers */
const FEMALE_NAME_HINTS = ['samantha', 'victoria', 'karen', 'moira', 'fiona', 'kate',
  'susan', 'allison', 'ava', 'zoe', 'alice', 'female', 'woman', 'girl',
  'microsoft zira', 'microsoft aria', 'google us english'];

/** Names typically associated with male TTS voices across browsers */
const MALE_NAME_HINTS = ['alex', 'daniel', 'fred', 'tom', 'lee', 'james', 'aaron',
  'male', 'man', 'microsoft david', 'microsoft mark', 'google uk english male'];

function pickVoice(
  available: SpeechSynthesisVoice[],
  wantFemale: boolean,
  slotIndex: number
): SpeechSynthesisVoice | null {
  if (!available.length) return null;

  const hints = wantFemale ? FEMALE_NAME_HINTS : MALE_NAME_HINTS;
  const enVoices = available.filter((v) => v.lang.startsWith('en'));
  const pool = enVoices.length ? enVoices : available;

  // Try to find a matching-gender voice
  const matched = pool.filter((v) =>
    hints.some((h) => v.name.toLowerCase().includes(h))
  );

  if (matched.length > 0) {
    // Pick different voices within the same gender group by slot index
    return matched[slotIndex % matched.length];
  }

  // Fallback: split pool in half — even slots = first half, odd = second half
  const half = Math.ceil(pool.length / 2);
  const subset = wantFemale ? pool.slice(0, half) : pool.slice(half);
  const fallback = subset.length ? subset : pool;
  return fallback[slotIndex % fallback.length];
}

function speak(
  text: string,
  voice: SpeechSynthesisVoice | null,
  pitch: number,
  rate: number,
  onEnd: () => void
): () => void {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    onEnd();
    return () => {};
  }
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  if (voice) u.voice = voice;
  u.pitch = pitch;
  u.rate = rate;
  u.onend = onEnd;
  u.onerror = onEnd;
  window.speechSynthesis.speak(u);
  return () => {
    window.speechSynthesis.cancel();
    onEnd();
  };
}

export default function VoiceSelector({ voices, selectedVoiceId, onSelect }: VoiceSelectorProps) {
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [assignedVoices, setAssignedVoices] = useState<(SpeechSynthesisVoice | null)[]>([]);
  const cancelRef = useRef<(() => void) | null>(null);

  // Load browser voices and assign one per slot
  useEffect(() => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    function assign() {
      const available = window.speechSynthesis.getVoices();
      if (!available.length) return;
      // Count how many female slots came before each slot (for index cycling)
      let femaleCount = 0;
      let maleCount = 0;
      const assigned = VOICE_PARAMS.map((p) => {
        const v = pickVoice(available, p.femaleKeywords, p.femaleKeywords ? femaleCount : maleCount);
        if (p.femaleKeywords) femaleCount++; else maleCount++;
        return v;
      });
      setAssignedVoices(assigned);
    }

    assign();
    // Chrome loads voices asynchronously
    window.speechSynthesis.onvoiceschanged = assign;
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const triggerPreview = useCallback(
    (voice: VoiceOption, slotIndex: number) => {
      cancelRef.current?.();
      setPreviewingId(voice.id);
      const params = VOICE_PARAMS[slotIndex] ?? VOICE_PARAMS[0];
      const synthVoice = assignedVoices[slotIndex] ?? null;
      cancelRef.current = speak(
        voice.previewText,
        synthVoice,
        params.pitchHint,
        params.rateHint,
        () => setPreviewingId(null)
      );
    },
    [assignedVoices]
  );

  const handleCardSelect = useCallback(
    (voice: VoiceOption, slotIndex: number) => {
      onSelect(voice.id);
      triggerPreview(voice, slotIndex);
    },
    [onSelect, triggerPreview]
  );

  const handlePreview = useCallback(
    (e: React.MouseEvent, voice: VoiceOption, slotIndex: number) => {
      e.stopPropagation();
      if (previewingId === voice.id) {
        cancelRef.current?.();
        cancelRef.current = null;
        setPreviewingId(null);
        return;
      }
      triggerPreview(voice, slotIndex);
    },
    [previewingId, triggerPreview]
  );

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-1">
        <Volume2 size={18} className="text-blue-500" />
        <h2 className="text-lg font-semibold text-gray-900">Voice Selection</h2>
      </div>
      <p className="text-sm text-gray-500 mb-5">
        Choose the voice for the AI client during the training session
      </p>

      {/* 2×2 grid — outer card is a <div role="radio"> to avoid nested <button> */}
      <div className="grid grid-cols-2 gap-3">
        {voices.map((voice, slotIndex) => {
          const isSelected = voice.id === selectedVoiceId;
          const isPreviewing = previewingId === voice.id;

          return (
            <div
              key={voice.id}
              role="radio"
              aria-checked={isSelected}
              tabIndex={0}
              onClick={() => handleCardSelect(voice, slotIndex)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleCardSelect(voice, slotIndex);
                }
              }}
              className={`
                relative flex items-center gap-3 px-4 py-4 rounded-xl border-2 text-left
                cursor-pointer transition-all duration-150 group select-none
                ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50/60 shadow-sm'
                    : 'border-gray-200 bg-gray-50/50 hover:border-gray-300 hover:bg-white'
                }
              `}
            >
              {/* Radio dot */}
              <div
                className={`
                  shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors
                  ${isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300 bg-white'}
                `}
              >
                {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>

              {/* Text */}
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-semibold leading-tight ${
                    isSelected ? 'text-blue-700' : 'text-gray-800'
                  }`}
                >
                  {voice.label}
                </p>
                <p className="text-xs text-gray-500 mt-0.5 leading-snug">{voice.description}</p>
              </div>

              {/* Preview button — single <button> per card, no nesting issue */}
              <button
                type="button"
                onClick={(e) => handlePreview(e, voice, slotIndex)}
                title={isPreviewing ? 'Stop preview' : 'Preview voice'}
                className={`
                  shrink-0 p-1.5 rounded-lg transition-colors
                  ${
                    isPreviewing
                      ? 'bg-blue-100 text-blue-600'
                      : 'text-gray-400 hover:text-blue-500 hover:bg-blue-50 opacity-0 group-hover:opacity-100'
                  }
                `}
              >
                {isPreviewing ? <VolumeX size={14} /> : <Volume2 size={14} />}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
