'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { TranscriptMessage, SessionContext, ScorecardSectionStatus } from '@training/types/trainingSession.types';
import {
  fetchSessionData,
  sendSessionMessage,
  pauseSession,
  resumeSession,
  endSession,
  connectToSession,
} from '@training/services/trainingSession.service';
import { analyzeScorecardStatus } from '@training/services/ai/groq.service';
import * as speechService from '@training/services/ai/speech.service';
import { synthesizeSpeech } from '@training/services/ai/elevenLabs.service';
import { AI_CONFIG } from '@training/services/ai/config';
import { useRouter } from 'next/navigation';

export type SidebarTab = 'background' | 'scorecard';

interface UseTrainingSessionReturn {
  context: SessionContext | null;
  transcript: TranscriptMessage[];
  elapsedSeconds: number;
  isMicActive: boolean;
  isAISpeaking: boolean;
  isPaused: boolean;
  inputValue: string;
  activeSidebarTab: SidebarTab;
  isLoading: boolean;
  error: string | null;
  sectionStatuses: Record<string, ScorecardSectionStatus>;
  selectedVoiceId: string;
  turnCount: number;
  turnLimit: number;
  micUnsupported: boolean;
  setInputValue: (value: string) => void;
  setActiveSidebarTab: (tab: SidebarTab) => void;
  toggleMic: () => void;
  togglePause: () => void;
  sendMessage: () => void;
  handleEndSession: () => void;
}

export function useTrainingSession(trainingId: string, sessionId: string): UseTrainingSessionReturn {
  const router = useRouter();
  const [context, setContext] = useState<SessionContext | null>(null);
  const [transcript, setTranscript] = useState<TranscriptMessage[]>([]);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isMicActive, setIsMicActive] = useState(false);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [activeSidebarTab, setActiveSidebarTab] = useState<SidebarTab>('background');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sectionStatuses, setSectionStatuses] = useState<Record<string, ScorecardSectionStatus>>({});
  const [selectedVoiceId, setSelectedVoiceId] = useState('');
  const [turnCount, setTurnCount] = useState(0);
  const [micUnsupported, setMicUnsupported] = useState(false);

  const messageCountRef = useRef(0);
  const ttsStopRef = useRef<(() => void) | null>(null);
  const contextRef = useRef<SessionContext | null>(null);
  const transcriptRef = useRef<TranscriptMessage[]>([]);
  const selectedVoiceIdRef = useRef('');

  // Keep refs in sync (for use inside callbacks without stale closures)
  useEffect(() => { contextRef.current = context; }, [context]);
  useEffect(() => { transcriptRef.current = transcript; }, [transcript]);
  useEffect(() => { selectedVoiceIdRef.current = selectedVoiceId; }, [selectedVoiceId]);

  // Dynamic turn limit: comes from session context if set, otherwise AI_CONFIG default
  const turnLimit = AI_CONFIG.DEFAULT_TURN_LIMIT;

  // Check mic support on mount
  useEffect(() => {
    setMicUnsupported(!speechService.isSupported());
  }, []);

  // Load session data on mount
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setIsLoading(true);
        const data = await fetchSessionData(trainingId, sessionId);
        if (!cancelled) {
          setContext(data.context);
          // Voice ID: prefer what came from session data, fall back to sessionStorage
          // (sessionStorage is written by SetupClientShell before navigation)
          const voiceId = data.selectedVoiceId
            || sessionStorage.getItem(`voice-${sessionId}`)
            || '';
          setSelectedVoiceId(voiceId);
          if (data.messages.length > 0) {
            setTranscript(data.messages);
            messageCountRef.current = data.messages.length;
            setTurnCount(Math.floor(data.messages.filter(m => m.sender === 'user').length));
          }
          if (data.elapsedSeconds > 0) setElapsedSeconds(data.elapsedSeconds);
          if (data.status === 'paused') setIsPaused(true);

          const statuses: Record<string, ScorecardSectionStatus> = {};
          for (const section of data.context.playbookSections) {
            statuses[section.id] = 'not-started';
          }
          setSectionStatuses(statuses);
          setIsLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load session');
          setIsLoading(false);
        }
      }
    }
    load();
    return () => { cancelled = true; };
  }, [trainingId, sessionId]);

  // WebSocket stub
  useEffect(() => {
    const ws = connectToSession(trainingId, sessionId);
    return () => ws.disconnect();
  }, [trainingId, sessionId]);

  // Timer — 1s tick
  useEffect(() => {
    if (isPaused || isLoading) return;
    const interval = setInterval(() => setElapsedSeconds((prev) => prev + 1), 1000);
    return () => clearInterval(interval);
  }, [isPaused, isLoading]);

  // Stop TTS when pausing
  useEffect(() => {
    if (isPaused) ttsStopRef.current?.();
  }, [isPaused]);

  // ── Mic toggle ────────────────────────────────────────────────────────────
  const isMicActiveRef = useRef(false);
  useEffect(() => { isMicActiveRef.current = isMicActive; }, [isMicActive]);

  const toggleMic = useCallback(() => {
    if (micUnsupported) return;

    if (isMicActiveRef.current) {
      // Currently active → stop
      speechService.stopListening();
      setIsMicActive(false);
    } else {
      // Currently inactive → start
      setIsMicActive(true);
      speechService.startListening(
        (transcript) => {
          // Stream recognised text into the input field live
          setInputValue(transcript);
        },
        () => {
          // Only fires on real error / explicit stop
          setIsMicActive(false);
        },
        inputValue // preserve whatever the user already typed
      );
    }
  }, [micUnsupported, inputValue]);

  // ── Pause / Resume ────────────────────────────────────────────────────────
  const togglePause = useCallback(() => {
    const willPause = !isPaused;
    setIsPaused(willPause);
    if (willPause) {
      speechService.stopListening();
      setIsMicActive(false);
      pauseSession(trainingId, sessionId).catch(() => {});
    } else {
      resumeSession(trainingId, sessionId).catch(() => {});
    }
  }, [isPaused, trainingId, sessionId]);

  // ── End session — persist transcript to sessionStorage for results page ──
  const handleEndSession = useCallback(() => {
    // Save transcript + context so results page can call Groq evaluation
    try {
      sessionStorage.setItem(
        `session-${sessionId}-data`,
        JSON.stringify({
          transcript: transcriptRef.current,
          context: contextRef.current,
        })
      );
      
      // Mark as completed in cookies so dashboards update
      const match = document.cookie.match(new RegExp('(^| )completed_trainings=([^;]+)'));
      const completed = match ? JSON.parse(decodeURIComponent(match[2])) : {};
      
      // Upgrade path: if it's an array from previous sessions, convert to object
      const completedMap = Array.isArray(completed) 
        ? completed.reduce((acc: any, id: string) => ({ ...acc, [id]: 'mock-session-id' }), {})
        : completed;
        
      if (!completedMap[trainingId]) {
        completedMap[trainingId] = sessionId;
        document.cookie = `completed_trainings=${encodeURIComponent(JSON.stringify(completedMap))}; path=/; max-age=31536000`;
      }
    } catch {
      // sessionStorage/cookie unavailable — results page will use mock
    }

    speechService.stopListening();
    ttsStopRef.current?.();
    endSession(trainingId, sessionId).catch(() => {});
    router.push(`/training/${trainingId}/sessions/${sessionId}/results`);
  }, [trainingId, sessionId, router]);

  // ── Send message ───────────────────────────────────────────────────────────
  const sendMessage = useCallback(async () => {
    const text = inputValue.trim();
    if (!text || isAISpeaking) return;

    // Stop mic before sending — user is done speaking
    speechService.stopListening();
    setIsMicActive(false);

    const userMsg: TranscriptMessage = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text,
      timestampSeconds: elapsedSeconds,
    };

    setTranscript((prev) => [...prev, userMsg]);
    setInputValue('');
    setIsAISpeaking(true);

    const newTurnCount = turnCount + 1;
    setTurnCount(newTurnCount);

    try {
      const currentIndex = messageCountRef.current;
      messageCountRef.current += 1;

      // Pass transcript + context to service so Groq gets full history
      const response = await sendSessionMessage(
        trainingId,
        sessionId,
        text,
        currentIndex,
        'text',
        [...transcriptRef.current, userMsg],
        contextRef.current
      );

      const aiMsg: TranscriptMessage = {
        id: response.aiReplyId || `msg-${Date.now()}-ai`,
        sender: 'ai',
        text: response.aiReplyText,
        timestampSeconds: response.aiReplyTimestamp || elapsedSeconds,
      };

      setTranscript((prev) => [...prev, aiMsg]);

      // Run scorecard analysis in background — non-blocking, doesn't delay TTS
      const fullTranscriptWithAI = [...transcriptRef.current, aiMsg];
      const sections = contextRef.current?.playbookSections ?? [];
      if (sections.length > 0) {
        analyzeScorecardStatus(fullTranscriptWithAI, sections)
          .then((updatedStatuses) => {
            setSectionStatuses((prev) => ({ ...prev, ...updatedStatuses }));
          })
          .catch(() => { /* scorecard update failed — non-critical */ });
      }

      if (response.scorecardUpdate) {
        setSectionStatuses((prev) => ({ ...prev, ...response.scorecardUpdate }));
      }

      // TTS playback: prefer backend-provided ElevenLabs audio, then client-side TTS
      if (response.audioUrl && response.audioUrl.startsWith('data:')) {
        // Backend returned base64 ElevenLabs audio — play it directly
        const audio = new Audio(response.audioUrl);
        let stopped = false;
        ttsStopRef.current = () => {
          stopped = true;
          audio.pause();
          setIsAISpeaking(false);
        };
        audio.onended = () => { if (!stopped) setIsAISpeaking(false); };
        audio.onerror = () => {
          if (!stopped) {
            // Fallback to client-side TTS
            const voiceId = selectedVoiceIdRef.current;
            if (response.aiReplyText && voiceId) {
              const { stop } = synthesizeSpeech(response.aiReplyText, voiceId, () => setIsAISpeaking(false));
              ttsStopRef.current = stop;
            } else {
              setIsAISpeaking(false);
            }
          }
        };
        audio.play().catch(() => {
          if (!stopped) {
            const voiceId = selectedVoiceIdRef.current;
            if (response.aiReplyText && voiceId) {
              const { stop } = synthesizeSpeech(response.aiReplyText, voiceId, () => setIsAISpeaking(false));
              ttsStopRef.current = stop;
            } else {
              setIsAISpeaking(false);
            }
          }
        });
        return; // isAISpeaking stays true until audio ends
      }

      // No backend audio — use client-side TTS (ElevenLabs or browser fallback)
      const voiceId = selectedVoiceIdRef.current;
      if (response.aiReplyText && voiceId) {
        const { stop } = synthesizeSpeech(
          response.aiReplyText,
          voiceId,
          () => setIsAISpeaking(false)   // reset only when audio actually finishes
        );
        ttsStopRef.current = stop;
        return; // isAISpeaking stays true until onEnd fires
      }

      // No TTS — clear speaking state immediately
      setIsAISpeaking(false);
    } catch {
      setIsAISpeaking(false);
    }

    // Auto-end after reaching turn limit
    if (newTurnCount >= turnLimit) {
      setTimeout(() => handleEndSession(), 1500); // small delay so last message shows
    }
  }, [inputValue, isAISpeaking, isMicActive, elapsedSeconds, trainingId, sessionId, turnCount, turnLimit, handleEndSession]);

  // Watch turn count — trigger auto-end
  useEffect(() => {
    if (turnCount > 0 && turnCount >= turnLimit && !isLoading) {
      setTimeout(() => handleEndSession(), 1500);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turnCount, turnLimit]);

  return {
    context,
    transcript,
    elapsedSeconds,
    isMicActive,
    isAISpeaking,
    isPaused,
    inputValue,
    activeSidebarTab,
    isLoading,
    error,
    sectionStatuses,
    selectedVoiceId,
    turnCount,
    turnLimit,
    micUnsupported,
    setInputValue,
    setActiveSidebarTab,
    toggleMic,
    togglePause,
    sendMessage,
    handleEndSession,
  };
}
