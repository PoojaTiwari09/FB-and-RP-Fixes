/**
 * elevenLabs.service.ts — TTS and voice fetching.
 *
 * TTS Strategy (in order):
 *  1. Browser SpeechSynthesis API — always works, free, no API key (PRIMARY)
 *  2. ElevenLabs — higher quality, used if API key is valid (ENHANCEMENT)
 *
 * Voice Strategy:
 *  - getVoices() fetches from ElevenLabs if key is present
 *  - Falls back to mock voices if unavailable
 */
import { AI_CONFIG } from './config';
import type { VoiceOption } from '@training/types/trainingSetup.types';
import { TRAINING_SETUP_MOCK } from '@training/mocks/trainingSetup.mock';

// ── Types ──────────────────────────────────────────────────────────────────

interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  labels?: Record<string, string>;
}

// ── Voice slot templates ───────────────────────────────────────────────────

const VOICE_SLOTS: { label: string; description: string; wantFemale: boolean }[] = [
  { label: 'Voice 1', description: 'Professional Female · Confident & Direct', wantFemale: true },
  { label: 'Voice 2', description: 'Professional Male · Calm & Analytical',    wantFemale: false },
  { label: 'Voice 3', description: 'Professional Female · Friendly & Warm',    wantFemale: true },
  { label: 'Voice 4', description: 'Professional Male · Energetic & Fast',     wantFemale: false },
];

function isFemaleVoice(voice: ElevenLabsVoice): boolean {
  const label = (voice.labels?.gender ?? '').toLowerCase();
  if (label === 'female') return true;
  if (label === 'male') return false;
  const name = voice.name.toLowerCase();
  return AI_CONFIG.FEMALE_NAME_HINTS.some((h) => name.includes(h));
}

function pickVoicesForSlots(all: ElevenLabsVoice[]): ElevenLabsVoice[] {
  const females = all.filter(isFemaleVoice);
  const males   = all.filter((v) => !isFemaleVoice(v));
  let fi = 0, mi = 0;
  return VOICE_SLOTS.map((slot) => {
    if (slot.wantFemale) return females[fi++ % Math.max(females.length, 1)] ?? all[0];
    else                 return males[mi++ % Math.max(males.length, 1)] ?? all[0];
  });
}

// ── Public: Voices ─────────────────────────────────────────────────────────

export async function getVoices(): Promise<VoiceOption[]> {
  if (!AI_CONFIG.ELEVENLABS_API_KEY) {
    return TRAINING_SETUP_MOCK.voices;
  }
  try {
    const res = await fetch(AI_CONFIG.ELEVENLABS_VOICES_URL, {
      headers: { 'xi-api-key': AI_CONFIG.ELEVENLABS_API_KEY },
    });
    if (!res.ok) throw new Error(`Voices API: ${res.status}`);
    const data = await res.json() as { voices: ElevenLabsVoice[] };
    const all = data.voices ?? [];
    if (all.length === 0) return TRAINING_SETUP_MOCK.voices;
    const picked = pickVoicesForSlots(all);
    return picked.map((v, i) => ({
      id: v.voice_id,
      label: VOICE_SLOTS[i].label,
      description: VOICE_SLOTS[i].description,
      previewText: TRAINING_SETUP_MOCK.voices[i]?.previewText ?? `Hi, I'm ${v.name}.`,
    }));
  } catch (err) {
    console.warn('[ElevenLabsService] getVoices failed, using mock:', err);
    return TRAINING_SETUP_MOCK.voices;
  }
}

// ── Public: TTS ────────────────────────────────────────────────────────────

export function synthesizeSpeech(
  text: string,
  voiceId: string,
  onEnd: () => void
): { stop: () => void } {
  if (!AI_CONFIG.ELEVENLABS_API_KEY) {
    return browserTTS(text, onEnd);
  }

  let activeAudio: HTMLAudioElement | null = null;
  let isStopped = false;
  let browserFallback: { stop: () => void } | null = null;

  async function startElevenLabs() {
    try {
      const response = await fetch(`${AI_CONFIG.ELEVENLABS_TTS_URL}/${voiceId}`, {
        method: 'POST',
        headers: {
          'xi-api-key': AI_CONFIG.ELEVENLABS_API_KEY,
          'Content-Type': 'application/json',
          accept: 'audio/mpeg',
        },
        body: JSON.stringify({
          text,
          model_id: AI_CONFIG.ELEVENLABS_MODEL || 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs TTS status: ${response.status}`);
      }

      if (isStopped) return;

      const blob = await response.blob();
      if (isStopped) return;

      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      activeAudio = audio;

      audio.onended = () => {
        URL.revokeObjectURL(url);
        if (!isStopped) {
          onEnd();
        }
      };

      audio.onerror = () => {
        URL.revokeObjectURL(url);
        if (!isStopped) {
          browserFallback = browserTTS(text, onEnd);
        }
      };

      await audio.play();
    } catch (err) {
      console.warn('[ElevenLabsService] ElevenLabs TTS failed, using browser fallback:', err);
      if (!isStopped) {
        browserFallback = browserTTS(text, onEnd);
      }
    }
  }

  startElevenLabs();

  return {
    stop: () => {
      isStopped = true;
      if (activeAudio) {
        activeAudio.pause();
      }
      if (browserFallback) {
        browserFallback.stop();
      }
    },
  };
}

/**
 * Browser built-in TTS via SpeechSynthesis API.
 * Free, works offline, no API key, zero latency.
 */
function browserTTS(text: string, onEnd: () => void): { stop: () => void } {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    onEnd();
    return { stop: () => {} };
  }

  // Cancel any currently playing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = 0.95;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;

  let ended = false;
  // Safety timeout: ~130 words/min average speech, give 3x buffer
  const wordCount = text.trim().split(/\s+/).length;
  const estimatedMs = Math.max(4000, (wordCount / 130) * 60 * 1000 * 1.5);
  const safetyTimer = setTimeout(() => {
    if (!ended) {
      ended = true;
      window.speechSynthesis.cancel();
      onEnd();
    }
  }, estimatedMs);

  function done() {
    if (!ended) {
      ended = true;
      clearTimeout(safetyTimer);
      onEnd();
    }
  }

  let spoke = false;
  function speak() {
    if (spoke) return; // prevent double-speak from race
    spoke = true;

    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
      const preferred =
        voices.find((v) => v.lang === 'en-US' && v.name.toLowerCase().includes('google')) ??
        voices.find((v) => v.lang === 'en-US' && !v.localService) ??
        voices.find((v) => v.lang.startsWith('en')) ??
        voices[0];
      if (preferred) utterance.voice = preferred;
    }

    utterance.onend = () => done();
    utterance.onerror = (e) => {
      if (e.error !== 'canceled' && e.error !== 'interrupted') done();
    };
    window.speechSynthesis.speak(utterance);
  }

  // Voices may not be loaded yet on first call — wait for them
  if (window.speechSynthesis.getVoices().length > 0) {
    speak();
  } else {
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.onvoiceschanged = null;
      speak();
    };
    setTimeout(speak, 300); // fallback if onvoiceschanged never fires
  }

  return {
    stop: () => {
      window.speechSynthesis.cancel();
      done();
    },
  };
}
