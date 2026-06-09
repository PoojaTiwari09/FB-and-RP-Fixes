import { useState, useEffect, useRef, useCallback } from 'react';
import type { CallProcessPhase } from '../types/calls.types';
import { fetchCallProcessStatus, triggerCallProcess } from '../services/calls-list.service';

const POLL_MS = 2000;

interface UseCallProcessingOptions {
  onReady?: () => void;
}

interface UseCallProcessingReturn {
  phase: CallProcessPhase | null;
  message: string | null;
  isProcessing: boolean;
  error: string | null;
  retry: () => void;
}

export function useCallProcessing(
  callId: string | null,
  options?: UseCallProcessingOptions,
): UseCallProcessingReturn {
  const [phase, setPhase] = useState<CallProcessPhase | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const onReadyRef = useRef(options?.onReady);
  onReadyRef.current = options?.onReady;
  const runIdRef = useRef(0);

  const finishReady = useCallback(async (id: string, runId: number) => {
    await triggerCallProcess(id);
    if (runIdRef.current !== runId) return;
    setPhase('ready');
    setMessage('Transcript and analysis fields are ready.');
    setIsProcessing(false);
    onReadyRef.current?.();
  }, []);

  const pollUntilDone = useCallback(
    async (id: string, runId: number) => {
      while (runIdRef.current === runId) {
        const status = await fetchCallProcessStatus(id);
        setPhase(status.phase);
        setMessage(status.message);

        if (status.phase === 'error') {
          setIsProcessing(false);
          setError(status.message);
          return;
        }
        if (status.phase === 'ready') {
          await finishReady(id, runId);
          return;
        }

        await new Promise((r) => setTimeout(r, POLL_MS));
      }
    },
    [finishReady],
  );

  const start = useCallback(async () => {
    if (!callId) return;
    const runId = ++runIdRef.current;
    setIsProcessing(true);
    setError(null);
    setPhase(null);
    setMessage('Preparing call…');

    try {
      const result = await triggerCallProcess(callId);
      if (runIdRef.current !== runId) return;

      setPhase(result.phase);
      setMessage(result.message);

      if (result.phase === 'ready') {
        setIsProcessing(false);
        onReadyRef.current?.();
        return;
      }
      if (result.phase === 'error') {
        setIsProcessing(false);
        setError(result.message);
        return;
      }

      await pollUntilDone(callId, runId);
    } catch {
      if (runIdRef.current === runId) {
        setIsProcessing(false);
        setError('Failed to process call. Check that the API and worker are running.');
      }
    }
  }, [callId, pollUntilDone]);

  useEffect(() => {
    start();
    return () => {
      runIdRef.current += 1;
    };
  }, [start]);

  return {
    phase,
    message,
    isProcessing,
    error,
    retry: start,
  };
}
