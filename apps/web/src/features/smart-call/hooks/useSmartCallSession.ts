'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import type {
  LiveSessionData,
  WSEvent,
  Competitor,
  TranscriptSpeaker,
} from '@smart-call/types/smart-call.types';
import {
  buildDiarizedLine,
  inferSpeaker,
  mergeDiarizedLines,
  speakerNamesFromInsights,
  formatLiveTime,
} from '@smart-call/lib/diarization';
import type { SmartCallApiKeys } from '@smart-call/lib/api-keys';
import type { AudioCapturePrefs } from '@smart-call/components/AudioCaptureModal';
import { insightsToEvents } from '@smart-call/lib/insights-to-ui';
import {
  fetchSessionSummaries,
  type LiveCallChunkSummary,
} from '@smart-call/services/smart-call.service';
import { resolveApiBase } from '@shared/config/module-api';
import { getBridgeHeaders } from '@shared/lib/backend-headers';
import {
  detectLocalSignals,
  computeSignalDelta,
  detectTurnTransition,
  shouldTriggerLLM,
  deduplicateSuggestions,
  ConversationMemory,
  StrategicTipStabilizer,
} from '@smart-call/live-assist/services/localEventEngine.js';

const INITIAL_STATE: LiveSessionData = {
  guidance: null,
  responses: [],
  competitors: [],
  signals: [],
  talkRatio: null,
  metrics: null,
  summarySegments: [],
  overlay: null,
  logEntries: [],
  strategicTips: [],
  diarizedLines: [],
  previousSuggestions: [],
  objectionTimeline: [],
  contextSummary: '',
  repName: 'You',
  clientName: 'Client',
};

const CAPTURE_SLICE_MS = 5000;
const LOCAL_TICK_MS = 2000;
const SUGGESTED_MAX_INTERVAL_MS = 12000;
const COMPETITOR_FLASH_COOLDOWN_MS = 5000;
const SUMMARY_INTERVAL_MS = 30000;
const MIN_TRANSCRIBE_BLOB_BYTES = 3000;
const MIN_ANALYSIS_WORDS = 4;
const ROLLING_WINDOW_SECONDS = 30;
const TACTICAL_COOLDOWN_MS = 2500;
const FULL_INSIGHT_COOLDOWN_MS = 8000;

export type SmartCallSessionOptions = {
  apiKeys: SmartCallApiKeys;
  sessionId?: string;
  dealContext?: { company?: string; stage?: string; value?: number; contact?: string; rep?: string };
};

type StoredSummary = {
  time_start: string;
  time_end: string;
  summary_text: string;
  chunk_index?: number;
};

function clipSegments(segments: { id: string; ts: number; text: string }[], maxAgeMs = 8 * 60 * 1000) {
  const minTs = Date.now() - maxAgeMs;
  return segments.filter((s) => s.ts >= minTs);
}

function rollingTranscript(segments: { ts: number; text: string }[], seconds: number) {
  const minTs = Date.now() - seconds * 1000;
  return segments
    .filter((s) => s.ts >= minTs)
    .map((s) => s.text)
    .join(' ')
    .trim();
}

function transcriptTail(segments: { text: string }[], maxSegments = 8) {
  return segments
    .slice(-maxSegments)
    .map((s) => s.text)
    .join(' ');
}

function countWords(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function mergeBlobs(carry: Blob | null, chunk: Blob): Blob | null {
  if (!carry) return chunk;
  return new Blob([carry, chunk], { type: chunk.type || 'audio/webm' });
}

function formatElapsed(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function mapDbSummaries(rows: LiveCallChunkSummary[]): StoredSummary[] {
  return rows.map((r) => ({
    time_start: r.time_start,
    time_end: r.time_end,
    summary_text: r.summary_text,
    chunk_index: r.chunk_index,
  }));
}

function competitorFromFlash(result: Record<string, unknown>): Competitor {
  return {
    competitorName: String(result.competitor || 'Competitor'),
    badgeColor: 'orange',
    insight: String(result.mentionedContext || ''),
    ourEdge: String(result.ourAdvantage || result.theirWeakness || ''),
    sayThis: String(result.talkTrack || ''),
  };
}

export function useSmartCallSession(options: SmartCallSessionOptions) {
  const { apiKeys, sessionId, dealContext } = options;

  const [data, setData] = useState<LiveSessionData>(INITIAL_STATE);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureError, setCaptureError] = useState<string | null>(null);

  const displayStreamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const chunkQueueRef = useRef<Blob[]>([]);
  const carryChunkRef = useRef<Blob | null>(null);
  const carrySinceRef = useRef(0);
  const processingRef = useRef(false);
  const sliceTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const localTickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const suggestedTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const summaryTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isCapturingRef = useRef(false);
  const segmentsRef = useRef<{ id: string; ts: number; text: string }[]>([]);
  const transcriptRef = useRef('');
  const callStartRef = useRef(0);
  const isAnalyzingRef = useRef(false);
  const lastLLMCallRef = useRef(0);
  const lastSuggestedAtRef = useRef(0);
  const lastSummaryAtRef = useRef(0);
  const lastAnalyzedContextRef = useRef('');
  const lastTranscriptChangeRef = useRef(0);
  const previousSignalsRef = useRef<ReturnType<typeof detectLocalSignals> | null>(null);
  const conversationMemoryRef = useRef(new ConversationMemory());
  const tipStabilizerRef = useRef(new StrategicTipStabilizer());
  const chunkSummariesRef = useRef<StoredSummary[]>([]);
  const chunkIndexRef = useRef(0);
  const suggestionHistoryRef = useRef<string[][]>([]);
  const lastCompetitorAlertRef = useRef<Record<string, number>>({});
  const competitorsRef = useRef<Competitor[]>([]);
  const apiKeysRef = useRef(apiKeys);
  const lastSpeakerRef = useRef<TranscriptSpeaker>('REP');
  const repNameRef = useRef(dealContext?.rep ?? 'You');
  const clientNameRef = useRef(dealContext?.contact ?? 'Client');

  useEffect(() => {
    apiKeysRef.current = apiKeys;
  }, [apiKeys]);

  useEffect(() => {
    if (dealContext?.contact) {
      clientNameRef.current = dealContext.contact;
    }
    if (dealContext?.rep) {
      repNameRef.current = dealContext.rep;
    }
    setData((prev) => ({
      ...prev,
      clientName: clientNameRef.current,
      repName: repNameRef.current,
    }));
  }, [dealContext?.contact, dealContext?.rep]);

  const applyEvent = useCallback((event: WSEvent) => {
    setData((prev) => {
      switch (event.eventType) {
        case 'LIVE_GUIDANCE':
          return { ...prev, guidance: event };
        case 'SUGGESTED_RESPONSES': {
          const timeLabel = callStartRef.current
            ? formatLiveTime(Date.now(), callStartRef.current)
            : 'Live';
          const added = event.responses.map((text) => ({ timeLabel, text }));
          return {
            ...prev,
            responses: event.responses,
            previousSuggestions: [...added, ...prev.previousSuggestions].slice(0, 12),
          };
        }
        case 'COMPETITOR_INTELLIGENCE': {
          const merged = [...event.competitors, ...prev.competitors].slice(0, 4);
          competitorsRef.current = merged;
          return { ...prev, competitors: merged };
        }
        case 'INTENT_SIGNALS':
          return { ...prev, signals: event.signals };
        case 'TALK_RATIO':
          return { ...prev, talkRatio: event };
        case 'CONVERSATION_METRICS':
          return { ...prev, metrics: event };
        case 'CONVERSATION_SUMMARY':
          return {
            ...prev,
            summarySegments: [...prev.summarySegments, ...event.segments].slice(-12),
          };
        case 'OVERLAY_UPDATE':
          return { ...prev, overlay: event };
        default:
          return prev;
      }
    });
  }, []);

  const applyInsights = useCallback(
    (insights: Record<string, unknown>, requestType: string) => {
      const names = speakerNamesFromInsights(
        insights,
        repNameRef.current,
        clientNameRef.current,
      );
      repNameRef.current = names.repName;
      clientNameRef.current = names.clientName;

      const strategicTips = Array.isArray(insights.strategicTips)
        ? (insights.strategicTips as Array<{ tip?: string; exactScript?: string }>)
            .filter((t) => t.tip?.trim())
            .map((t) => ({ tip: String(t.tip), exactScript: t.exactScript }))
        : [];

      const objectionTimeline = Array.isArray(insights.objectionTimeline)
        ? (insights.objectionTimeline as string[]).slice(0, 8)
        : [];

      const drift = insights.conversationDrift as
        | { detected?: boolean; description?: string; recommendation?: string }
        | undefined;
      const driftEntries =
        drift?.detected && drift.description
          ? [
              {
                timestamp: 'Live',
                title: 'Conversation drift',
                description: `${drift.description}${drift.recommendation ? ` — ${drift.recommendation}` : ''}`,
              },
            ]
          : [];

      setData((prev) => ({
        ...prev,
        repName: names.repName,
        clientName: names.clientName,
        strategicTips: strategicTips.length ? strategicTips : prev.strategicTips,
        objectionTimeline: objectionTimeline.length ? objectionTimeline : prev.objectionTimeline,
        contextSummary: String(
          insights.headline || insights.chunkSummary || prev.contextSummary || '',
        ),
        logEntries: driftEntries.length
          ? [...driftEntries, ...prev.logEntries].slice(0, 8)
          : prev.logEntries,
      }));

      if (insights.strategicTips && Array.isArray(insights.strategicTips)) {
        const tips = insights.strategicTips as Array<{ tip?: string; exactScript?: string }>;
        tipStabilizerRef.current.update(tips);
        const stable = tipStabilizerRef.current.getDisplay();
        if (stable.length) insights.strategicTips = stable;
      }

      if (requestType === 'tactical_only') {
        const responses = insights.suggestedResponses as string[] | undefined;
        const deduped = deduplicateSuggestions(responses ?? [], suggestionHistoryRef.current);
        if (deduped.length) {
          suggestionHistoryRef.current = [...suggestionHistoryRef.current, deduped].slice(-5);
          applyEvent({ eventType: 'SUGGESTED_RESPONSES', responses: deduped.slice(0, 3) });
          lastSuggestedAtRef.current = Date.now();
        }
        const nba = insights.nextBestAction as { action?: string } | undefined;
        if (nba?.action) {
          applyEvent({
            eventType: 'LIVE_GUIDANCE',
            currentStage:
              (insights.stageConfidence as { dominantStage?: string })?.dominantStage || 'Discovery',
            nextSuggestion: nba.action,
          });
        }
        return;
      }

      for (const ev of insightsToEvents(insights)) {
        if (requestType === 'summary_only') {
          if (
            ev.eventType === 'CONVERSATION_SUMMARY' ||
            ev.eventType === 'OVERLAY_UPDATE'
          ) {
            applyEvent(ev);
          }
          continue;
        }
        applyEvent(ev);
      }

      const alerts = insights.alerts as Array<{ message?: string; level?: string }> | undefined;
      if (Array.isArray(alerts) && alerts.length && requestType !== 'tactical_only') {
        setData((prev) => ({
          ...prev,
          logEntries: alerts.slice(0, 5).map((a) => ({
            timestamp: 'Live',
            title: a.level === 'critical' ? 'Critical' : 'Coaching',
            description: String(a.message || ''),
          })),
        }));
      }

      const responses = insights.suggestedResponses as string[] | undefined;
      if (responses?.length) {
        lastSuggestedAtRef.current = Date.now();
      }
    },
    [applyEvent],
  );

  const refreshSummariesFromDb = useCallback(async () => {
    if (!sessionId) return;
    const rows = await fetchSessionSummaries(sessionId);
    if (rows.length) {
      chunkSummariesRef.current = mapDbSummaries(rows);
      chunkIndexRef.current = Math.max(...rows.map((r) => r.chunk_index), 0) + 1;
      const segments = rows.map((r) => ({
        startTime: r.time_start,
        endTime: r.time_end,
        summary: r.summary_text,
        highlightedKeywords: [] as { word: string; color: string }[],
        tags: ['Stored'],
      }));
      setData((prev) => ({ ...prev, summarySegments: segments.slice(-12) }));
    }
  }, [sessionId]);

  const persistChunk = useCallback(
    async (summaryText: string, rolling: string, elapsed: number) => {
      if (!sessionId || !summaryText.trim()) return;
      const idx = chunkIndexRef.current++;
      const body = {
        chunk_index: idx,
        time_start: formatElapsed(Math.max(0, elapsed - 30)),
        time_end: formatElapsed(elapsed),
        summary_text: summaryText,
        raw_transcript: rolling,
      };
      chunkSummariesRef.current = [...chunkSummariesRef.current, body].slice(-20);
      await fetch(`${resolveApiBase()}/api/v1/capture-transcription/smart-call/sessions/${sessionId}/chunks`, {
        method: 'POST',
        headers: getBridgeHeaders(),
        body: JSON.stringify(body),
      }).catch(() => {});
    },
    [sessionId],
  );

  const runCompetitorFlash = useCallback(
    async (competitorName: string, rolling: string) => {
      const key = apiKeysRef.current.groq?.trim();
      if (!key) return;
      const now = Date.now();
      const last = lastCompetitorAlertRef.current[competitorName] || 0;
      if (now - last < COMPETITOR_FLASH_COOLDOWN_MS) return;
      lastCompetitorAlertRef.current[competitorName] = now;

      try {
        const res = await fetch('/api/smart-call/competitor-flash', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            competitor: competitorName,
            transcriptContext: rolling,
            groqApiKey: key,
          }),
        });
        if (!res.ok) return;
        const result = (await res.json()) as Record<string, unknown> | null;
        if (!result?.competitor) return;
        const comp = competitorFromFlash(result);
        competitorsRef.current = [comp, ...competitorsRef.current.filter(
          (c) => c.competitorName !== comp.competitorName,
        )].slice(0, 4);
        applyEvent({ eventType: 'COMPETITOR_INTELLIGENCE', competitors: competitorsRef.current });
        conversationMemoryRef.current.addCompetitor(comp.competitorName);
      } catch (e) {
        console.warn('[SmartCall] competitor flash', e);
      }
    },
    [applyEvent],
  );

  const runAnalysis = useCallback(
    async (triggerReason: string, requestType: string) => {
      const keys = apiKeysRef.current;
      if (!keys.groq?.trim()) return;
      if (!segmentsRef.current.length) return;
      if (isAnalyzingRef.current) return;

      const now = Date.now();
      const isTactical = requestType === 'tactical_only';
      const cooldown = isTactical ? TACTICAL_COOLDOWN_MS : FULL_INSIGHT_COOLDOWN_MS;
      if (now - lastLLMCallRef.current < cooldown && triggerReason !== 'forced_suggested') return;

      const rolling = rollingTranscript(segmentsRef.current, ROLLING_WINDOW_SECONDS);
      if (countWords(rolling) < MIN_ANALYSIS_WORDS) return;
      if (
        rolling === lastAnalyzedContextRef.current &&
        !['competitor_detected', 'turn_transition_completed', 'forced_suggested', 'forced_summary'].includes(
          triggerReason,
        )
      ) {
        return;
      }

      isAnalyzingRef.current = true;
      lastLLMCallRef.current = now;
      lastAnalyzedContextRef.current = rolling;

      const elapsed = callStartRef.current
        ? Math.floor((now - callStartRef.current) / 1000)
        : 0;

      try {
        const res = await fetch('/api/smart-call/insights', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            groqApiKey: keys.groq,
            openRouterApiKey: keys.openRouter,
            recentTranscript: rolling,
            fullTranscriptTail: transcriptTail(segmentsRef.current),
            dealContext,
            runningStats: {
              totalWords: countWords(transcriptRef.current),
              segmentCount: segmentsRef.current.length,
              estimatedTalkRatioRep: 48,
              estimatedTalkRatioCustomer: 52,
            },
            previousSummaries: chunkSummariesRef.current.slice(-8),
            requestType,
            callElapsedSeconds: elapsed,
            conversationMemory: conversationMemoryRef.current.toPayload(),
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({})) as { error?: string };
          throw new Error(err.error || `Insights ${res.status}`);
        }
        const insights = (await res.json()) as Record<string, unknown>;
        applyInsights(insights, requestType);

        if (requestType !== 'tactical_only' && insights.dealMomentumScore) {
          const score = (insights.dealMomentumScore as { score?: number }).score;
          if (score != null) {
            conversationMemoryRef.current.addMomentum(score, []);
          }
        }

        if (requestType === 'summary_only' && insights.chunkSummary) {
          await persistChunk(String(insights.chunkSummary), rolling, elapsed);
          lastSummaryAtRef.current = now;
          await refreshSummariesFromDb();
        }
      } catch (e) {
        console.warn('[SmartCall] insights', e);
      } finally {
        isAnalyzingRef.current = false;
      }
    },
    [applyInsights, dealContext, persistChunk, refreshSummariesFromDb],
  );

  const runLocalTick = useCallback(() => {
    if (!isCapturingRef.current) return;
    const rolling = rollingTranscript(segmentsRef.current, ROLLING_WINDOW_SECONDS);
    if (countWords(rolling) < MIN_ANALYSIS_WORDS) return;

    if (rolling !== lastAnalyzedContextRef.current) {
      lastTranscriptChangeRef.current = Date.now();
    }

    const now = Date.now();
    const currentSignals = detectLocalSignals(rolling);
    const delta = computeSignalDelta(currentSignals, previousSignalsRef.current);
    previousSignalsRef.current = currentSignals;

    const mem = conversationMemoryRef.current;
    if (delta.reasons.includes('new_objection') && currentSignals.objection.matched.length) {
      mem.addObjection(currentSignals.objection.matched.slice(-1)[0], currentSignals.objection.matched.slice(-1)[0]);
    }
    if (delta.hasNewCompetitor && currentSignals.competitor.matched.length) {
      const name = currentSignals.competitor.matched.slice(-1)[0];
      mem.addCompetitor(name);
      void runCompetitorFlash(name, rolling);
    }
    if (delta.reasons.includes('buying_signal') && currentSignals.buying.matched.length) {
      mem.addBuyingSignal(currentSignals.buying.matched.slice(-1)[0]);
    }

    const turnResult = detectTurnTransition(
      rolling,
      lastAnalyzedContextRef.current,
      lastTranscriptChangeRef.current,
    );

    const decision = shouldTriggerLLM(
      delta,
      {},
      lastLLMCallRef.current,
      rolling,
      lastAnalyzedContextRef.current,
      turnResult.isTurnTransition,
    );

    if (decision.trigger && decision.requestType !== 'none') {
      void runAnalysis(decision.reason, decision.requestType);
    }

    if (now - lastSuggestedAtRef.current >= SUGGESTED_MAX_INTERVAL_MS) {
      void runAnalysis('forced_suggested', 'tactical_only');
    }
  }, [runAnalysis, runCompetitorFlash]);

  const transcribeBlob = useCallback(async (blob: Blob) => {
    const form = new FormData();
    form.append('file', blob, 'audio.webm');
    const res = await fetch('/api/smart-call/transcribe', {
      method: 'POST',
      body: form,
      headers: { 'x-groq-api-key': apiKeysRef.current.groq },
    });
    if (!res.ok) throw new Error(`Transcribe ${res.status}`);
    const { text } = (await res.json()) as { text?: string };
    return (text ?? '').trim();
  }, []);

  const drainQueue = useCallback(async () => {
    if (processingRef.current) return;
    processingRef.current = true;
    try {
      while (chunkQueueRef.current.length > 0) {
        const chunk = chunkQueueRef.current.shift();
        if (!chunk) continue;

        const merged = mergeBlobs(carryChunkRef.current, chunk);
        const forceFlush =
          carrySinceRef.current > 0 && Date.now() - carrySinceRef.current > 10000;
        if (!merged || (merged.size < MIN_TRANSCRIBE_BLOB_BYTES && !forceFlush)) {
          carryChunkRef.current = merged;
          if (!carrySinceRef.current) carrySinceRef.current = Date.now();
          continue;
        }

        try {
          const text = await transcribeBlob(merged);
          carryChunkRef.current = null;
          carrySinceRef.current = 0;
          if (!text) continue;

          const segment = {
            id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
            ts: Date.now(),
            text,
          };
          const speaker = inferSpeaker(text, lastSpeakerRef.current);
          lastSpeakerRef.current = speaker;
          const line = buildDiarizedLine(
            segment,
            speaker,
            repNameRef.current,
            clientNameRef.current,
            callStartRef.current || segment.ts,
          );
          segmentsRef.current = clipSegments([...segmentsRef.current, segment]);
          transcriptRef.current = segmentsRef.current.map((s) => s.text).join('\n');
          setLiveTranscript(transcriptRef.current);
          setData((prev) => ({
            ...prev,
            diarizedLines: mergeDiarizedLines([...prev.diarizedLines, line]).slice(-60),
          }));
          runLocalTick();
        } catch (err) {
          carryChunkRef.current = null;
          carrySinceRef.current = 0;
          setCaptureError((err as Error).message || 'Transcription failed');
        }
      }
    } finally {
      processingRef.current = false;
      if (chunkQueueRef.current.length > 0) drainQueue();
    }
  }, [transcribeBlob, runLocalTick]);

  const clearTimers = useCallback(() => {
    for (const ref of [sliceTimerRef, localTickRef, suggestedTimerRef, summaryTimerRef]) {
      if (ref.current) {
        clearInterval(ref.current);
        ref.current = null;
      }
    }
  }, []);

  const cleanupCapture = useCallback(() => {
    clearTimers();
    if (recorderRef.current?.state === 'recording') {
      try {
        recorderRef.current.stop();
      } catch {
        /* ignore */
      }
    }
    displayStreamRef.current?.getTracks().forEach((t) => t.stop());
    micStreamRef.current?.getTracks().forEach((t) => t.stop());
    audioCtxRef.current?.close().catch(() => {});
    displayStreamRef.current = null;
    recorderRef.current = null;
    micStreamRef.current = null;
    audioCtxRef.current = null;
  }, [clearTimers]);

  const stopCapture = useCallback(() => {
    isCapturingRef.current = false;
    cleanupCapture();
    setIsCapturing(false);
  }, [cleanupCapture]);

  const startTimers = useCallback(() => {
    localTickRef.current = setInterval(() => runLocalTick(), LOCAL_TICK_MS);
    suggestedTimerRef.current = setInterval(() => {
      if (Date.now() - lastSuggestedAtRef.current >= SUGGESTED_MAX_INTERVAL_MS) {
        void runAnalysis('interval_suggested', 'tactical_only');
      }
    }, SUGGESTED_MAX_INTERVAL_MS);
    summaryTimerRef.current = setInterval(() => {
      if (Date.now() - lastSummaryAtRef.current >= SUMMARY_INTERVAL_MS - 500) {
        void runAnalysis('forced_summary', 'summary_only');
      }
    }, SUMMARY_INTERVAL_MS);
  }, [runLocalTick, runAnalysis]);

  const startCaptureWithPrefs = useCallback(
    async (prefs: AudioCapturePrefs) => {
      if (isCapturingRef.current) return;
      setCaptureError(null);

      if (!apiKeys.groq?.trim()) {
        setCaptureError('Add your Groq API key using API Keys in the header.');
        return;
      }
      if (!prefs.includeSystemAudio && !prefs.includeMicrophone) {
        setCaptureError('Select at least one audio source.');
        return;
      }

      let displayStream: MediaStream;
      try {
        displayStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: prefs.includeSystemAudio,
        });
      } catch {
        return;
      }

      const videoTrack = displayStream.getVideoTracks()[0];
      const displaySurface = videoTrack?.getSettings()?.displaySurface ?? 'unknown';
      const isEntireScreen = displaySurface === 'monitor';
      let audioTracks = [...displayStream.getAudioTracks()];

      if (prefs.includeMicrophone) {
        try {
          const mic = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
          });
          micStreamRef.current = mic;
          if (isEntireScreen && audioTracks.length > 0) {
            const ctx = new AudioContext();
            audioCtxRef.current = ctx;
            const dest = ctx.createMediaStreamDestination();
            ctx.createMediaStreamSource(new MediaStream(audioTracks)).connect(dest);
            ctx.createMediaStreamSource(mic).connect(dest);
            audioTracks = dest.stream.getAudioTracks();
          } else if (audioTracks.length === 0) {
            audioTracks = mic.getAudioTracks();
          } else if (!isEntireScreen) {
            const ctx = new AudioContext();
            audioCtxRef.current = ctx;
            const dest = ctx.createMediaStreamDestination();
            ctx.createMediaStreamSource(new MediaStream(audioTracks)).connect(dest);
            ctx.createMediaStreamSource(mic).connect(dest);
            audioTracks = dest.stream.getAudioTracks();
          }
        } catch {
          if (audioTracks.length === 0) {
            displayStream.getTracks().forEach((t) => t.stop());
            setCaptureError(
              'Microphone access denied. Allow mic or enable tab/system audio in the share dialog.',
            );
            return;
          }
        }
      }

      if (audioTracks.length === 0) {
        displayStream.getTracks().forEach((t) => t.stop());
        setCaptureError(
          'No audio captured. Enable “Share tab audio” or “Share system audio” in the browser picker.',
        );
        return;
      }

      const mimeType = ['audio/webm;codecs=opus', 'audio/webm', ''].find(
        (m) => !m || MediaRecorder.isTypeSupported(m),
      );
      const recordingStream = new MediaStream(audioTracks);
      const recorder = new MediaRecorder(recordingStream, mimeType ? { mimeType } : undefined);

      recorder.ondataavailable = (e) => {
        if (e.data?.size > 0) {
          chunkQueueRef.current.push(e.data);
          drainQueue();
        }
      };

      recorder.onerror = () => {
        setCaptureError('Recording error');
        stopCapture();
      };

      displayStream.getVideoTracks().forEach((t) => {
        t.onended = () => {
          if (isCapturingRef.current) stopCapture();
        };
      });

      displayStreamRef.current = displayStream;
      recorderRef.current = recorder;
      isCapturingRef.current = true;
      callStartRef.current = Date.now();
      lastSpeakerRef.current = 'REP';
      segmentsRef.current = [];
      transcriptRef.current = '';
      setLiveTranscript('');
      setData((prev) => ({
        ...prev,
        diarizedLines: [],
        previousSuggestions: [],
        clientName: clientNameRef.current,
      }));
      conversationMemoryRef.current = new ConversationMemory();
      tipStabilizerRef.current = new StrategicTipStabilizer();
      previousSignalsRef.current = null;
      lastLLMCallRef.current = 0;
      lastSuggestedAtRef.current = 0;
      lastSummaryAtRef.current = 0;
      lastAnalyzedContextRef.current = '';
      suggestionHistoryRef.current = [];
      lastCompetitorAlertRef.current = {};
      competitorsRef.current = [];
      chunkIndexRef.current = 0;
      chunkSummariesRef.current = [];

      if (sessionId) {
        await refreshSummariesFromDb();
      }

      recorder.start();
      sliceTimerRef.current = setInterval(() => {
        if (recorder.state === 'recording' && isCapturingRef.current) {
          recorder.stop();
          setTimeout(() => {
            if (isCapturingRef.current && recorder.state === 'inactive') {
              try {
                recorder.start();
              } catch {
                /* ignore */
              }
            }
          }, 50);
        }
      }, CAPTURE_SLICE_MS);

      startTimers();
      setIsCapturing(true);
      setCaptureError(null);
    },
    [apiKeys, drainQueue, stopCapture, sessionId, refreshSummariesFromDb, startTimers],
  );

  useEffect(() => () => cleanupCapture(), [cleanupCapture]);

  const getTranscript = useCallback(() => transcriptRef.current, []);

  return {
    data,
    liveTranscript,
    isCapturing,
    captureError,
    startCaptureWithPrefs,
    stopCapture,
    getTranscript,
  };
}
