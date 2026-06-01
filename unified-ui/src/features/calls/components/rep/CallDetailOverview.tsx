'use client';

import { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Search,
  Loader2,
  AlertCircle,
  Lightbulb,
  Users,
  TrendingUp,
  MessageSquare,
  DollarSign,
  CheckCircle,
  ListTodo,
} from 'lucide-react';
import { fetchTranscript } from '@calls/services/callsApi';
import { useAssemblyAI } from '@calls/hooks/useAssemblyAI';
import {
  assemblyInsightsToAiInsights,
  assemblyInsightsToTranscriptEntries,
} from '@calls/lib/assemblyai.mappers';
import type { TranscriptEntry, AIInsights } from '@calls/data/mockData';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const SPEEDS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
const SKIP_SECONDS = 10;

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || isNaN(seconds)) return '00:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ─── Audio Player ─────────────────────────────────────────────────────────────

interface AudioPlayerProps {
  audioUrl: string | null;
  durationSeconds?: number;
  loading: boolean;
  error: boolean;
}

interface AudioPlayerHandle {
  seekTo: (seconds: number) => void;
}

const AudioPlayer = forwardRef<AudioPlayerHandle, AudioPlayerProps>(
function AudioPlayer({ audioUrl, durationSeconds, loading, error }: AudioPlayerProps, ref) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(durationSeconds ?? 0);
  const [buffering, setBuffering] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const [speed, setSpeed] = useState(1.0);
  const [volume, setVolume] = useState(1);
  const [showVolume, setShowVolume] = useState(false);
  const volumeRef = useRef<HTMLDivElement>(null);

  useImperativeHandle(ref, () => ({
    seekTo(seconds: number) {
      const audio = audioRef.current;
      if (!audio) return;
      audio.currentTime = seconds;
    },
  }), []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => {
      if (isFinite(audio.duration)) setDuration(audio.duration);
      setBuffering(false);
      setAudioError(false);
    };
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = () => { setPlaying(false); setCurrentTime(0); };
    const onWaiting = () => setBuffering(true);
    const onCanPlay = () => setBuffering(false);
    const onError = () => { setAudioError(true); setBuffering(false); setPlaying(false); };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('canplay', onCanPlay);
    audio.addEventListener('error', onError);
    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('canplay', onCanPlay);
      audio.removeEventListener('error', onError);
    };
  }, [audioUrl]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (volumeRef.current && !volumeRef.current.contains(e.target as Node)) {
        setShowVolume(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const togglePlay = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio || audioError) return;
    if (playing) { audio.pause(); } else {
      try { await audio.play(); } catch { setAudioError(true); }
    }
  }, [playing, audioError]);

  const skipBack = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, audio.currentTime - SKIP_SECONDS);
  }, []);

  const skipForward = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.min(duration, audio.currentTime + SKIP_SECONDS);
  }, [duration]);

  const handleSpeedChange = useCallback((s: number) => {
    const audio = audioRef.current;
    if (audio) audio.playbackRate = s;
    setSpeed(s);
  }, []);

  const handleVolumeChange = useCallback((v: number) => {
    const audio = audioRef.current;
    if (audio) audio.volume = v;
    setVolume(v);
  }, []);

  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audio.currentTime = ratio * duration;
  }, [duration]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const disabled = loading || error || audioError || !audioUrl;

  return (
    <div className="bg-white border-b p-4" style={{ borderColor: '#E5E7EB' }}>
      {audioUrl && (
        <audio ref={audioRef} src={audioUrl} preload="metadata" className="hidden" />
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-xs" style={{ color: '#9CA3AF' }}>
          <Loader2 size={14} className="animate-spin" />
          Loading audio…
        </div>
      ) : (
        <div className={disabled ? 'opacity-50 pointer-events-none' : ''}>
          {/* Row 1: Controls */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              {/* Play/Pause */}
              <button
                onClick={togglePlay}
                disabled={buffering || disabled}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-colors"
                style={{ backgroundColor: '#3B82F6', color: '#FFFFFF' }}
              >
                {buffering ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : playing ? (
                  <Pause size={18} />
                ) : (
                  <Play size={18} className="ml-0.5" />
                )}
              </button>
              {/* Skip Back */}
              <button
                onClick={skipBack}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                style={{ backgroundColor: '#F3F4F6', color: '#374151' }}
              >
                <SkipBack size={16} />
              </button>
              {/* Skip Forward */}
              <button
                onClick={skipForward}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                style={{ backgroundColor: '#F3F4F6', color: '#374151' }}
              >
                <SkipForward size={16} />
              </button>
              <span className="text-sm ml-2" style={{ color: '#6B7280' }}>
                {formatTime(currentTime)} / {formatTime(duration || (durationSeconds ?? 0))}
              </span>
            </div>

            {/* Right: Volume + Speed */}
            <div className="flex items-center gap-3">
              <div ref={volumeRef} className="relative">
                <button
                  onClick={() => setShowVolume((v) => !v)}
                  className="p-1.5 rounded-full hover:bg-gray-100 transition-colors"
                  style={{ color: '#9CA3AF' }}
                >
                  {volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
                </button>
                {showVolume && (
                  <div className="absolute bottom-10 left-1/2 -translate-x-1/2 bg-white border border-gray-200 rounded-xl shadow-lg px-3 py-3 z-10 flex flex-col items-center gap-1">
                    <span className="text-[10px]" style={{ color: '#6B7280' }}>{Math.round(volume * 100)}%</span>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={volume}
                      onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                      className="h-20 cursor-pointer accent-blue-600"
                      style={{ writingMode: 'vertical-lr', direction: 'rtl' }}
                    />
                  </div>
                )}
              </div>
              <select
                value={speed}
                onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
                className="px-3 py-1 border rounded-lg text-sm focus:outline-none focus:ring-2"
                style={{ borderColor: '#D1D5DB' }}
              >
                {SPEEDS.map((s) => (
                  <option key={s} value={s}>{s}x</option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Progress bar */}
          <div
            className="w-full rounded-full h-2 cursor-pointer"
            style={{ backgroundColor: '#E5E7EB' }}
            onClick={handleProgressClick}
          >
            <div
              className="h-2 rounded-full"
              style={{ width: `${progress}%`, backgroundColor: '#3B82F6' }}
            />
          </div>

          {audioError && (
            <p className="text-xs mt-2 flex items-center gap-1.5" style={{ color: '#F59E0B' }}>
              <AlertCircle size={12} />
              Unable to load recording — using demo audio failed. Ensure the API is running or retry.
            </p>
          )}
        </div>
      )}
    </div>
  );
});
AudioPlayer.displayName = 'AudioPlayer';

// ─── Transcript ───────────────────────────────────────────────────────────────

interface TranscriptViewProps {
  entries: TranscriptEntry[];
  loading: boolean;
  statusMessage?: string;
  errorMessage?: string | null;
  onTimestampClick?: (timestamp: string) => void;
}

function TranscriptView({ entries, loading, statusMessage, errorMessage, onTimestampClick }: TranscriptViewProps) {
  const [search, setSearch] = useState('');

  const filtered = entries.filter(
    (e) =>
      !search ||
      e.text.toLowerCase().includes(search.toLowerCase()) ||
      e.speaker.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col flex-1 min-h-0" style={{ backgroundColor: '#F9FAFB' }}>
      {/* Search bar */}
      <div className="p-4 bg-white border-b" style={{ borderColor: '#E5E7EB' }}>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9CA3AF' }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search transcript..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 text-sm"
            style={{ borderColor: '#D1D5DB' }}
          />
        </div>
      </div>

      {statusMessage && (
        <div className="px-4 py-2 bg-blue-50 border-b text-xs text-blue-700" style={{ borderColor: '#E5E7EB' }}>
          {statusMessage}
        </div>
      )}
      {errorMessage && (
        <div className="px-4 py-2 bg-amber-50 border-b text-xs text-amber-800" style={{ borderColor: '#E5E7EB' }}>
          {errorMessage}
        </div>
      )}

      {/* Entries */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {loading ? (
          [...Array(5)].map((_, i) => (
            <div key={i} className="p-4 rounded-lg bg-white animate-pulse space-y-2">
              <div className="h-3 w-32 bg-gray-100 rounded" />
              <div className="h-3 w-full bg-gray-100 rounded" />
              <div className="h-3 w-3/4 bg-gray-100 rounded" />
            </div>
          ))
        ) : entries.length === 0 ? (
          <p className="text-sm text-center py-6" style={{ color: '#9CA3AF' }}>Transcript unavailable</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-center py-6" style={{ color: '#9CA3AF' }}>No matches found</p>
        ) : (
          filtered.map((entry, i) => (
            <div
              key={i}
              className={`p-4 rounded-lg ${entry.highlighted ? 'border' : ''}`}
              style={{
                backgroundColor: entry.highlighted ? '#FEF3C7' : '#FFFFFF',
                borderColor: entry.highlighted ? '#FCD34D' : 'transparent',
              }}
            >
              <div className="flex items-baseline gap-3 mb-2">
                <span className="font-medium" style={{ color: '#111827' }}>{entry.speaker}</span>
                <button
                  onClick={() => onTimestampClick?.(entry.timestamp)}
                  className="text-sm hover:underline"
                  style={{ color: '#9CA3AF' }}
                >
                  {entry.timestamp}
                </button>
              </div>
              <p className="leading-relaxed" style={{ color: '#374151' }}>{entry.text}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ─── AI Insights Panel ────────────────────────────────────────────────────────

function BulletList({ items, color }: { items: string[]; color: string }) {
  if (!items.length) return <p className="text-sm italic" style={{ color: '#9CA3AF' }}>None detected</p>;
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="text-sm flex items-start gap-2" style={{ color: '#374151' }}>
          <span className="mt-0.5" style={{ color }}>•</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function AIInsightsPanel({ insights, loading }: { insights: AIInsights | null; loading: boolean }) {
  if (loading) {
    return (
      <div className="p-6 space-y-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
            <div className="h-3 w-full bg-gray-100 rounded animate-pulse" />
            <div className="h-3 w-5/6 bg-gray-100 rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  if (!insights) {
    return <p className="p-6 text-sm" style={{ color: '#9CA3AF' }}>No insights available.</p>;
  }

  return (
    <div className="overflow-y-auto h-full p-6 space-y-6">
      {/* Summary */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Lightbulb size={20} style={{ color: '#3B82F6' }} />
          <h3 className="font-medium" style={{ color: '#111827' }}>Summary</h3>
        </div>
        <p className="text-sm leading-relaxed" style={{ color: '#374151' }}>{insights.summary}</p>
      </section>

      {/* Key Highlights */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle size={20} style={{ color: '#10B981' }} />
          <h3 className="font-medium" style={{ color: '#111827' }}>Key Highlights</h3>
        </div>
        <BulletList items={insights.keyHighlights ?? []} color="#10B981" />
      </section>

      {/* Talk Ratio */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <Users size={20} style={{ color: '#8B5CF6' }} />
          <h3 className="font-medium" style={{ color: '#111827' }}>Talk Ratio</h3>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm mb-1">
            <span style={{ color: '#6B7280' }}>Rep</span>
            <span className="font-medium" style={{ color: '#111827' }}>{insights.talkRatio.rep}%</span>
          </div>
          <div className="w-full rounded-full h-2" style={{ backgroundColor: '#E5E7EB' }}>
            <div className="h-2 rounded-full" style={{ width: `${insights.talkRatio.rep}%`, backgroundColor: '#3B82F6' }} />
          </div>
          <div className="flex justify-between text-sm mb-1 mt-3">
            <span style={{ color: '#6B7280' }}>Customer</span>
            <span className="font-medium" style={{ color: '#111827' }}>{insights.talkRatio.customer}%</span>
          </div>
          <div className="w-full rounded-full h-2" style={{ backgroundColor: '#E5E7EB' }}>
            <div className="h-2 rounded-full" style={{ width: `${insights.talkRatio.customer}%`, backgroundColor: '#10B981' }} />
          </div>
        </div>
      </section>

      {/* Sentiment */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp size={20} style={{ color: '#F59E0B' }} />
          <h3 className="font-medium" style={{ color: '#111827' }}>Sentiment</h3>
        </div>
        <span
          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            insights.sentiment === 'Positive' || insights.sentiment === 'positive'
              ? 'bg-green-100 text-green-800'
              : insights.sentiment === 'Negative' || insights.sentiment === 'negative'
              ? 'bg-red-100 text-red-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {insights.sentiment.charAt(0).toUpperCase() + insights.sentiment.slice(1)}
        </span>
      </section>

      {/* Topics Discussed */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare size={20} style={{ color: '#6366F1' }} />
          <h3 className="font-medium" style={{ color: '#111827' }}>Topics Discussed</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {(insights.topicsDiscussed ?? []).map((topic, i) => (
            <span key={i} className="px-3 py-1 rounded-full text-sm" style={{ backgroundColor: '#EEF2FF', color: '#6366F1' }}>
              {topic}
            </span>
          ))}
        </div>
      </section>

      {/* Objections */}
      {(insights.objectionsDetected ?? []).length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle size={20} style={{ color: '#EF4444' }} />
            <h3 className="font-medium" style={{ color: '#111827' }}>Objections Detected</h3>
          </div>
          <BulletList items={insights.objectionsDetected ?? []} color="#EF4444" />
        </section>
      )}

      {/* Competitor Mentions */}
      {(insights.competitorMentions ?? []).length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle size={20} style={{ color: '#F59E0B' }} />
            <h3 className="font-medium" style={{ color: '#111827' }}>Competitor Mentions</h3>
          </div>
          <BulletList items={insights.competitorMentions ?? []} color="#F59E0B" />
        </section>
      )}

      {/* Pricing Discussion */}
      {(insights.pricingDiscussion ?? []).length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <DollarSign size={20} style={{ color: '#10B981' }} />
            <h3 className="font-medium" style={{ color: '#111827' }}>Pricing Discussion</h3>
          </div>
          <BulletList items={insights.pricingDiscussion ?? []} color="#10B981" />
        </section>
      )}

      {/* Next Steps */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <CheckCircle size={20} style={{ color: '#3B82F6' }} />
          <h3 className="font-medium" style={{ color: '#111827' }}>Next Steps</h3>
        </div>
        <BulletList items={insights.nextSteps ?? []} color="#3B82F6" />
      </section>

      {/* Action Items */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <ListTodo size={20} style={{ color: '#8B5CF6' }} />
          <h3 className="font-medium" style={{ color: '#111827' }}>Action Items</h3>
        </div>
        <BulletList items={insights.actionItems ?? []} color="#8B5CF6" />
      </section>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CallDetailOverview({ callId }: { callId: string }) {
  const audioPlayerRef = useRef<AudioPlayerHandle>(null);
  const { playbackUrl, status: aiStatus, insights: assemblyInsights, error: assemblyError } =
    useAssemblyAI(callId);

  const [fallbackTranscript, setFallbackTranscript] = useState<TranscriptEntry[]>([]);

  useEffect(() => {
    if (assemblyError) {
      fetchTranscript(callId).then(setFallbackTranscript).catch(() => setFallbackTranscript([]));
    }
  }, [callId, assemblyError]);

  const transcriptFromAssembly = assemblyInsights
    ? assemblyInsightsToTranscriptEntries(assemblyInsights)
    : [];
  const transcript =
    transcriptFromAssembly.length > 0 ? transcriptFromAssembly : fallbackTranscript;

  const insights: AIInsights | null = assemblyInsights
    ? assemblyInsightsToAiInsights(assemblyInsights)
    : null;

  const audioLoading = aiStatus === 'idle' || aiStatus === 'loading-audio';
  const transcriptLoading =
    aiStatus === 'submitting' || aiStatus === 'processing' || aiStatus === 'loading-audio';
  const insightsLoading = transcriptLoading;
  const audioFetchError = aiStatus === 'error' && !playbackUrl;

  const statusMessage =
    aiStatus === 'submitting'
      ? 'Sending recording to AssemblyAI…'
      : aiStatus === 'processing'
        ? 'Generating transcript and AI insights…'
        : undefined;

  const errorMessage =
    assemblyError && transcript.length === 0
      ? `AssemblyAI: ${assemblyError}. Add your API key via AssemblyAI API Key on the calls list, or set ASSEMBLYAI_API_KEY in .env.local.`
      : assemblyError && transcript.length > 0
        ? `AssemblyAI unavailable — showing database transcript fallback.`
        : null;

  const handleTimestampClick = useCallback((timestamp: string) => {
    const [m, s] = timestamp.split(':').map(Number);
    audioPlayerRef.current?.seekTo(m * 60 + s);
  }, []);

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: '#F9FAFB' }}>
      {/* Audio Player */}
      <AudioPlayer
        ref={audioPlayerRef}
        audioUrl={playbackUrl}
        loading={audioLoading}
        error={audioFetchError}
      />

      {/* Transcript + AI Insights */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Left: Transcript */}
        <div className="flex-1 flex flex-col min-h-0 border-r" style={{ borderColor: '#E5E7EB' }}>
          <TranscriptView
            entries={transcript}
            loading={transcriptLoading}
            statusMessage={statusMessage}
            errorMessage={errorMessage}
            onTimestampClick={handleTimestampClick}
          />
        </div>

        {/* Right: AI Insights — w-96 matches Figma exactly */}
        <div className="w-96 bg-white flex flex-col min-h-0 shrink-0">
          <div className="px-6 pt-6 pb-2 border-b" style={{ borderColor: '#E5E7EB' }}>
            <h2 className="text-xl font-semibold" style={{ color: '#111827' }}>AI Insights</h2>
          </div>
          <AIInsightsPanel insights={insights} loading={insightsLoading} />
        </div>
      </div>
    </div>
  );
}
