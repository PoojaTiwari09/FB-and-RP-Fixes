'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Clock, Mic, MicOff, Pause, Send, Volume2, PlayCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LiveCoachingPanel } from '@/components/coaching/LiveCoachingPanel';
import { ErrorCard } from '@/components/shared/ErrorCard';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { sessionsService } from '@/services/sessions.service';
import { useAssignments } from '@/hooks/useAssignments';
import { ChatMessage, HighlightedSegment, LiveCoachingEvaluation } from '@/types/session.types';
import { apiClient } from '@/lib/api';

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  start: () => void;
  stop: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

const highlightClass: Record<HighlightedSegment['severity'], string> = {
  red: 'rounded-sm bg-red-500/35',
  yellow: 'rounded-sm bg-amber-400/40',
  green: 'rounded-sm bg-emerald-400/35',
};

function HighlightedMessage({ text, segments }: { text: string; segments?: HighlightedSegment[] }) {
  const textLower = text.toLowerCase();
  const validSegments = (segments || []).filter((segment) => segment.text && textLower.includes(segment.text.toLowerCase()));
  if (!validSegments.length) return <p>{text}</p>;

  const parts: Array<{ text: string; segment?: HighlightedSegment }> = [];
  let cursor = 0;

  validSegments.forEach((segment) => {
    const index = textLower.indexOf(segment.text.toLowerCase(), cursor);
    if (index < 0) return;
    if (index > cursor) parts.push({ text: text.slice(cursor, index) });
    parts.push({ text: text.slice(index, index + segment.text.length), segment });
    cursor = index + segment.text.length;
  });

  if (cursor < text.length) parts.push({ text: text.slice(cursor) });

  return (
    <p>
      {parts.map((part, index) => part.segment ? (
        <span key={`${part.text}-${index}`} title={part.segment.reason} className={`inline-block px-0.5 text-inherit ${highlightClass[part.segment.severity]}`}>
          {part.text}
        </span>
      ) : (
        <span key={`${part.text}-${index}`}>{part.text}</span>
      ))}
    </p>
  );
}

export default function PracticePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const qc = useQueryClient();
  const assignments = useAssignments();
  
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const isListeningRef = useRef(false);
  const isSpeakingRef = useRef(false);
  const accumulatedFinalRef = useRef('');
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const hasStartedRef = useRef(false);
  const hasSentInitialRef = useRef(false);
  
  const [sessionId, setSessionId] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [score, setScore] = useState(0);
  const [liveEvaluation, setLiveEvaluation] = useState<LiveCoachingEvaluation | null>(null);
  const [startedAt, setStartedAt] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceError, setVoiceError] = useState('');
  const [isPausing, setIsPausing] = useState(false);
  const [activeHint, setActiveHint] = useState<string | null>(null);
  const [hintsUsed, setHintsUsed] = useState(0);
  const resumePathRef = useRef(`/rep/practice/${params.id}`);

  const start = useMutation({
    mutationFn: (data: { scenarioId: string; assignmentId?: string }) => sessionsService.startSession(data),
    onSuccess: (data) => {
      setSessionId(data.sessionId || data.id);
      qc.invalidateQueries({ queryKey: ['assignments'] });
      qc.invalidateQueries({ queryKey: ['sessions', 'my'] });
    }
  });

  // When assignment lookup is done, hold a ref to the active assignment for retry on 404
  const activeAssignmentRef = useRef<{ scenarioId: string; assignmentId: string } | null>(null);

  const send = useMutation({ mutationFn: (message: string) => sessionsService.sendMessage({ sessionId, message }) });
  const end = useMutation({ mutationFn: () => sessionsService.endSession(sessionId), onSuccess: () => router.push(`/rep/results/${sessionId}`) });
  const getHintMut = useMutation({ 
    mutationFn: () => sessionsService.getHint(sessionId),
    onSuccess: (data) => {
      setActiveHint(data.hint);
      setHintsUsed(data.hints_used);
    }
  });

  useEffect(() => {
    if (assignments.isSuccess && !assignments.isFetching && !sessionId && !hasStartedRef.current) {
      const activeAssignment = assignments.data?.find((item) => item.id === params.id);
      
      if (activeAssignment) {
        // ID is an assignment. Do we already have an active session for it?
        if (activeAssignment.session_id && activeAssignment.status !== 'Completed') {
          // Attempt to resume this session. If 404, sessionQuery will handle fallback.
          activeAssignmentRef.current = {
            scenarioId: activeAssignment.scenario_id || activeAssignment.scenario?.id,
            assignmentId: activeAssignment.id,
          };
          resumePathRef.current = `/rep/practice/${activeAssignment.id}`;
          setSessionId(activeAssignment.session_id);
          hasStartedRef.current = true;
        } else {
          // Need to start a new session for this assignment
          hasStartedRef.current = true;
          activeAssignmentRef.current = {
            scenarioId: activeAssignment.scenario_id || activeAssignment.scenario?.id,
            assignmentId: activeAssignment.id,
          };
          resumePathRef.current = `/rep/practice/${activeAssignment.id}`;
          start.mutate({
            scenarioId: activeAssignment.scenario_id || activeAssignment.scenario?.id,
            assignmentId: activeAssignment.id,
          });
        }
      } else {
        // ID is not an assignment, so it must already be a Session ID from ad-hoc practice or history resume!
        resumePathRef.current = `/rep/practice/${params.id}`;
        setSessionId(params.id);
        hasStartedRef.current = true;
      }
    }
  }, [assignments.isSuccess, assignments.data, params.id, sessionId, start]);

  // Fetch the full session to get scenario details and past messages if we are resuming
  const sessionQuery = useQuery({
    queryKey: ['session', sessionId],
    queryFn: () => apiClient.get(`/sessions/${sessionId}`).then(res => res.data),
    enabled: !!sessionId,
    retry: false, // don't retry on 404
  });

  // If the session fetch 404s (stale session_id in assignment), start a fresh one
  useEffect(() => {
    if (sessionQuery.isError && activeAssignmentRef.current && !start.isPending && !start.isSuccess) {
      const { scenarioId, assignmentId } = activeAssignmentRef.current;
      activeAssignmentRef.current = null;
      setSessionId('');
      hasStartedRef.current = false;
      start.mutate({ scenarioId, assignmentId });
    }
  }, [sessionQuery.isError, start]);

  useEffect(() => {
    if (sessionQuery.isSuccess && sessionQuery.data) {
      if (sessionQuery.data.messages_json && sessionQuery.data.messages_json.length > 0) {
        setMessages(sessionQuery.data.messages_json);
      }
      
      if (sessionQuery.data.feedback_json?.overall_score) {
         setScore(Number(sessionQuery.data.feedback_json.overall_score));
      }

      if (sessionQuery.data.hints_used) {
        setHintsUsed(sessionQuery.data.hints_used);
      }
    }
  }, [sessionQuery.isSuccess, sessionQuery.data]);

  // Trigger AI opening statement if no messages exist
  useEffect(() => {
    if (sessionQuery.isSuccess && (!sessionQuery.data?.messages_json || sessionQuery.data.messages_json.length === 0) && !send.isPending && !hasSentInitialRef.current) {
      hasSentInitialRef.current = true;
      send.mutate('', {
        onSuccess: (data) => {
          setMessages([{ role: 'assistant', content: data.reply }]);
          speakAgentReply(data.reply);
        }
      });
    }
  }, [sessionQuery.isSuccess, sessionQuery.data, send]);

  useEffect(() => {
    setStartedAt(Date.now());
  }, []);

  useEffect(() => {
    return () => {
      stopListening();
      window.speechSynthesis?.cancel();
    };
  }, []);

  useEffect(() => {
    if (!startedAt) return;
    const timer = window.setInterval(() => setElapsedSeconds(Math.floor((Date.now() - startedAt) / 1000)), 1000);
    return () => window.clearInterval(timer);
  }, [startedAt]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, interimTranscript]);

  const formattedElapsed = `${Math.floor(elapsedSeconds / 60).toString().padStart(2, '0')}:${(elapsedSeconds % 60).toString().padStart(2, '0')}`;

  function stopListening() {
    isListeningRef.current = false;
    setIsListening(false);
    accumulatedFinalRef.current = '';
    setInterimTranscript('');
    try { recognitionRef.current?.stop(); } catch (_) {}
    recognitionRef.current = null;
  }

  function speakAgentReply(text: string) {
    if (!text || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    stopListening();
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.onstart = () => {
      isSpeakingRef.current = true;
      setIsSpeaking(true);
    };
    utterance.onend = () => {
      isSpeakingRef.current = false;
      setIsSpeaking(false);
    };
    utterance.onerror = () => {
      isSpeakingRef.current = false;
      setIsSpeaking(false);
    };
    window.speechSynthesis.speak(utterance);
  }

  async function submitText(rawText?: string) {
    const text = (rawText ?? input).trim();
    if (!text || !sessionId || send.isPending) return;

    stopListening();
    setMessages((current) => [...current, { role: 'user', content: text }]);
    setInput('');
    setLiveEvaluation(null);
    setActiveHint(null);

    send.mutate(text, {
      onSuccess: (data) => {
        setMessages((current) => [
          ...current.slice(0, -1),
          { role: 'user', content: text, live_coaching: data.live_coaching },
          { role: 'assistant', content: data.reply }
        ]);
        if (data.live_coaching) setLiveEvaluation(data.live_coaching);
        speakAgentReply(data.reply);
      },
      onError: (err) => {
        setVoiceError((err as Error).message || 'Failed to get a response.');
      }
    });
  }

  function submit() {
    submitText();
  }

  async function pauseSession() {
    if (!sessionId) return;
    setIsPausing(true);
    try {
      await sessionsService.pauseSession(sessionId);
      qc.invalidateQueries({ queryKey: ['assignments'] });
      qc.invalidateQueries({ queryKey: ['sessions', 'my'] });
      
      if (sessionQuery.data?.is_practice) {
        router.push('/rep/history');
      } else {
        router.push('/rep/assignments');
      }
    } catch (err) {
      setVoiceError('Failed to pause session. ' + ((err as Error).message || ''));
    } finally {
      setIsPausing(false);
    }
  }

  function toggleListening() {
    if (isListeningRef.current) {
      stopListening();
      return;
    }

    setVoiceError('');
    if (typeof window === 'undefined' || (!('SpeechRecognition' in window) && !('webkitSpeechRecognition' in window))) {
      setVoiceError('Speech recognition is not supported in this browser. Please use Chrome.');
      return;
    }

    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) return;

    accumulatedFinalRef.current = '';
    setInterimTranscript('');
    setActiveHint(null);
    isListeningRef.current = true;
    setIsListening(true);

    function createAndStart() {
      if (!isListeningRef.current) return;
      
      const recognition = new SpeechRec!();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let currentInterim = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            accumulatedFinalRef.current += result[0].transcript + ' ';
            setInterimTranscript('');
            setInput(accumulatedFinalRef.current);
          } else {
            currentInterim += result[0].transcript;
          }
        }
        if (currentInterim) {
          setInterimTranscript(currentInterim);
        }
      };

      recognition.onerror = (event) => {
        if (event.error === 'no-speech') return;
        setVoiceError(`Microphone error: ${event.error}`);
        stopListening();
      };

      recognition.onend = () => {
        if (isListeningRef.current) {
          // auto-restart if it stopped unexpectedly
          try { createAndStart(); } catch (_) {}
        }
      };

      recognitionRef.current = recognition;
      try {
        recognition.start();
      } catch (_) {
        if (isListeningRef.current) setTimeout(createAndStart, 200);
      }
    }

    createAndStart();
  }

  if (assignments.isLoading || start.isPending || (!sessionQuery.isSuccess && !!sessionId)) {
    return <LoadingSkeleton />;
  }
  
  if (assignments.isError || start.isError || sessionQuery.isError) {
    return <ErrorCard message={((assignments.error || start.error || sessionQuery.error) as Error)?.message} onRetry={() => window.location.reload()} />;
  }

  const scenarioData = sessionQuery.data?.scenario;
  const personaName = scenarioData?.persona_name || 'Agent';
  const avatarInitials = personaName.substring(0, 2).toUpperCase();
  const isPractice = sessionQuery.data?.is_practice || (!assignments.data?.find((item) => item.id === params.id) && !sessionQuery.data);
  const turnCount = Math.floor(messages.filter(m => m.role === 'user').length);
  const MAX_TURNS = 10;

  return (
    <section className="flex flex-col lg:flex-row h-[calc(100vh-6rem)] gap-4 overflow-hidden">
      {/* LEFT COLUMN: Persona Brief */}
      <aside className="hidden xl:flex w-[300px] flex-shrink-0 flex-col gap-4 overflow-y-auto pr-2">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm shrink-0">
          <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Persona Brief</h2>
          <h1 className="text-xl font-bold text-gray-900">{personaName}</h1>
          <p className="text-sm text-gray-500 mb-4">{scenarioData?.persona_type || 'Buyer'}</p>
          
          <div className="flex flex-wrap gap-2 mb-6">
            <Badge variant="outline">{scenarioData?.difficulty || 'standard'}</Badge>
            <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-100">Score {liveEvaluation?.live_score ?? score}</Badge>
          </div>

          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Background</h3>
          <p className="text-sm text-gray-700 leading-relaxed">
            {scenarioData?.context_text?.replace(/\[SCENARIO_METADATA:.*?\]/s, '').trim() || 'Backend scenario context will appear here.'}
          </p>
        </div>

        <LiveCoachingPanel evaluation={liveEvaluation} onUseSuggestion={setInput} />
      </aside>

      {/* CENTER COLUMN: The Call Experience */}
      <div className="flex-1 min-w-[320px] flex flex-col rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden relative">
        <div className="absolute top-4 right-4 z-10 flex gap-2">
          {isPractice && (
             <Badge variant="outline" className={`bg-white/80 backdrop-blur-sm ${turnCount >= MAX_TURNS - 1 ? 'text-orange-600 border-orange-200' : 'text-purple-700'}`}>
               Turn {Math.min(turnCount, MAX_TURNS)}/{MAX_TURNS}
             </Badge>
          )}
          <Badge variant="outline" className="bg-white/80 backdrop-blur-sm"><Clock className="mr-1 h-3 w-3" /> {formattedElapsed}</Badge>
        </div>

        {/* Central Avatar */}
        <div className="flex-1 flex flex-col items-center justify-center relative p-8">
          <div className="relative">
            {isSpeaking && (
              <div className="absolute inset-0 -m-8 animate-pulse rounded-full bg-indigo-50" />
            )}
            <div className={`relative flex h-40 w-40 items-center justify-center rounded-full bg-indigo-600 text-white shadow-xl transition-transform duration-300 ${isSpeaking ? 'scale-105' : ''}`}>
              <span className="text-5xl font-bold">{avatarInitials}</span>
              {isSpeaking && (
                <div className="absolute -bottom-2 right-4 rounded-full bg-green-500 p-2 border-4 border-white">
                  <Volume2 className="h-4 w-4 text-white" />
                </div>
              )}
            </div>
          </div>
          <h2 className="mt-6 text-2xl font-bold text-gray-900">{personaName}</h2>
          <p className="text-gray-500">
            {isListening
              ? interimTranscript || input
                ? 'Transcribing your speech...'
                : 'Listening — speak now, then press Send'
              : isSpeaking
              ? 'Agent speaking...'
              : send.isPending
              ? 'Waiting for agent...'
              : 'Click the mic when you are ready to speak'}
          </p>
        </div>

        {/* Input Area */}
        <div className="p-6 bg-white border-t border-gray-100 relative">
          {activeHint && (
            <div className="absolute bottom-[calc(100%+1rem)] left-1/2 -translate-x-1/2 w-[90%] max-w-lg bg-indigo-900 text-white p-4 rounded-2xl shadow-xl z-20 animate-in fade-in slide-in-from-bottom-4 flex gap-3 items-start">
              <div className="flex-1">
                <p className="text-xs text-indigo-300 font-semibold uppercase tracking-wider mb-1">Coach Hint</p>
                <p className="text-sm font-medium leading-relaxed">{activeHint}</p>
              </div>
              <button onClick={() => setActiveHint(null)} className="text-indigo-400 hover:text-white p-1">
                <X className="h-4 w-4" />
              </button>
              {/* Pointer Triangle */}
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-indigo-900 rotate-45" />
            </div>
          )}

          {voiceError && <p className="mb-2 text-sm text-red-600 text-center">{voiceError}</p>}
          <div className="flex items-center gap-3 max-w-2xl mx-auto w-full">
            <button
              type="button"
              onClick={toggleListening}
              disabled={!sessionId || send.isPending || isSpeaking}
              aria-label={isListening ? 'Stop microphone' : 'Start microphone'}
              title={
                isSpeaking
                  ? 'Wait for agent to finish'
                  : isListening
                  ? 'Stop listening'
                  : 'Click to speak'
              }
              className={`inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full transition-all relative disabled:opacity-50 disabled:cursor-not-allowed ${
                isListening
                  ? 'bg-red-500 text-white shadow-lg shadow-red-500/40 hover:bg-red-600 scale-105'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {isListening ? <MicOff className="h-6 w-6 shrink-0" strokeWidth={2} /> : <Mic className="h-6 w-6 shrink-0" strokeWidth={2} />}
              {isListening && (
                <span className="absolute top-1 right-1 h-3 w-3 rounded-full bg-white animate-pulse" />
              )}
            </button>
            <input 
              value={input} 
              onChange={(event) => setInput(event.target.value)} 
              onKeyDown={(event) => event.key === 'Enter' ? submit() : undefined} 
              className="flex-1 rounded-2xl border-2 border-gray-100 bg-gray-50 px-6 py-4 text-sm outline-none transition focus:border-indigo-500 focus:bg-white" 
              placeholder={isListening ? 'Speak — your words appear here...' : 'Type or use mic, then press Send'} 
            />
            <button
              type="button"
              onClick={submit}
              disabled={send.isPending || !sessionId || !input.trim()}
              aria-label="Send message"
              title="Send message"
              className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
            >
              <Send className="h-5 w-5 shrink-0" strokeWidth={2} />
            </button>
          </div>
          
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <Button
              onClick={() => getHintMut.mutate()}
              disabled={!sessionId || getHintMut.isPending || send.isPending || (sessionQuery.data?.max_hints !== null && hintsUsed >= sessionQuery.data?.max_hints)}
              variant="outline"
              className="rounded-full border-indigo-200 px-6 text-indigo-700 hover:bg-indigo-50"
            >
              {getHintMut.isPending ? 'Getting Hint...' : `Get Hint ${sessionQuery.data?.max_hints !== null ? `(${hintsUsed}/${sessionQuery.data?.max_hints})` : ''}`}
            </Button>
            <Button
              onClick={pauseSession}
              disabled={!sessionId || isPausing || send.isPending}
              variant="outline"
              className="rounded-full border-amber-200 px-6 text-amber-700 hover:bg-amber-50"
            >
              <Pause className="mr-2 h-4 w-4" />
              {isPausing ? 'Saving...' : 'Pause Session'}
            </Button>
            <Button onClick={() => end.mutate()} disabled={!sessionId || end.isPending} variant="outline" className="text-red-600 border-transparent hover:text-red-700 hover:bg-red-50 rounded-full px-6">
              End Session
            </Button>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Chat History */}
      <aside className="hidden md:flex w-[320px] xl:w-[350px] flex-shrink-0 flex-col rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50/50">
          <h2 className="font-bold text-gray-900">Conversation</h2>
        </div>
        
        <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message, index) => (
            <div key={index} className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
              <span className="text-xs font-semibold text-gray-400 mb-1 ml-1 mr-1">
                {message.role === 'user' ? 'You' : personaName}
              </span>
              <div className={`max-w-[90%] rounded-2xl px-4 py-3 text-sm shadow-sm ${message.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-sm' : 'bg-gray-100 text-gray-800 rounded-tl-sm'}`}>
                {message.role === 'user' ? (
                  <HighlightedMessage text={message.content} segments={message.live_coaching?.highlighted_segments} />
                ) : (
                  <p>{message.content}</p>
                )}
              </div>
            </div>
          ))}
          {send.isPending && (
            <div className="flex flex-col items-start">
              <span className="text-xs font-semibold text-gray-400 mb-1 ml-1">{personaName}</span>
              <div className="max-w-[90%] rounded-2xl rounded-tl-sm bg-gray-100 px-4 py-3 text-sm text-gray-800">
                <div className="flex gap-1 items-center h-5">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-75"></span>
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-150"></span>
                </div>
              </div>
            </div>
          )}
          {messages.length === 0 && !interimTranscript && (
            <div className="h-full flex flex-col items-center justify-center text-center text-gray-500 opacity-50 pt-20">
              <PlayCircle className="w-12 h-12 mb-4 text-gray-300" />
              <p className="text-sm">Session started.</p>
              <p className="text-xs mt-1">Start speaking to begin.</p>
            </div>
          )}
        </div>
      </aside>
    </section>
  );
}
