'use client';

import { useState } from 'react';
import { Copy, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import type {
  LiveSessionData,
  Competitor,
  IntentSignal,
  DiarizedLine,
} from '@smart-call/types/smart-call.types';

function SignalRow({ signal }: { signal: IntentSignal }) {
  const styles: Record<string, string> = {
    green: 'bg-green-50 text-green-800 border-green-100',
    blue: 'bg-blue-50 text-blue-800 border-blue-100',
    yellow: 'bg-yellow-50 text-yellow-800 border-yellow-100',
    purple: 'bg-purple-50 text-purple-800 border-purple-100',
    red: 'bg-red-50 text-red-800 border-red-100',
  };
  const badge: Record<string, string> = {
    green: 'bg-green-100 text-green-700',
    blue: 'bg-blue-100 text-blue-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    purple: 'bg-purple-100 text-purple-700',
    red: 'bg-red-100 text-red-700',
  };
  const row = styles[signal.color] ?? styles.blue;
  const b = badge[signal.color] ?? badge.blue;
  return (
    <div className={`flex items-center justify-between px-3 py-2 rounded-lg border text-sm ${row}`}>
      <span className="font-medium">{signal.label}</span>
      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${b}`}>{signal.value}</span>
    </div>
  );
}

function CompetitorBlock({ comp }: { comp: Competitor }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="space-y-2 pb-3 border-b border-gray-100 last:border-0 last:pb-0">
      <span className="inline-block px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-700 text-xs font-semibold">
        {comp.competitorName}
      </span>
      <p className="text-xs text-gray-600">{comp.insight}</p>
      <div className="bg-green-50 border border-green-100 rounded-lg px-3 py-2 text-xs text-green-800">
        <span className="font-semibold">Our edge: </span>
        {comp.ourEdge}
      </div>
      <button
        type="button"
        onClick={() => {
          navigator.clipboard.writeText(comp.sayThis).catch(() => {});
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        }}
        className="w-full text-left bg-blue-50 border border-blue-100 rounded-lg px-3 py-2 text-xs text-blue-900 hover:bg-blue-100"
      >
        <span className="font-semibold">{copied ? 'Copied' : 'Say: '}</span> {comp.sayThis}
      </button>
    </div>
  );
}

function DiarizedTranscript({ lines, repName, clientName }: {
  lines: DiarizedLine[];
  repName: string;
  clientName: string;
}) {
  if (!lines.length) {
    return (
      <p className="text-xs text-gray-400 italic py-4 text-center">
        Transcript with speaker labels will appear as the call progresses.
      </p>
    );
  }
  return (
    <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
      {[...lines].reverse().map((line) => (
        <div key={line.id} className="text-xs leading-relaxed">
          <div className="flex items-baseline gap-2 mb-0.5">
            <span className="font-mono text-gray-400 shrink-0">{line.timeLabel}</span>
            <span
              className={`font-semibold shrink-0 ${
                line.speaker === 'REP' ? 'text-violet-600' : 'text-pink-600'
              }`}
            >
              {line.speakerName || (line.speaker === 'REP' ? repName : clientName)}
            </span>
          </div>
          <p className="text-gray-700 pl-[52px]">{line.text}</p>
        </div>
      ))}
    </div>
  );
}

export type SmartCallLivePanelsProps = {
  data: LiveSessionData;
  isCapturing?: boolean;
  layout?: 'page' | 'pip';
  onCopyResponse?: (text: string, idx: number) => void;
  copiedIdx?: number | null;
};

export default function SmartCallLivePanels({
  data,
  isCapturing = false,
  layout = 'page',
  onCopyResponse,
  copiedIdx = null,
}: SmartCallLivePanelsProps) {
  const [competitorOpen, setCompetitorOpen] = useState(true);
  const isPip = layout === 'pip';
  const rootClass = isPip
    ? 'flex h-full min-h-0 bg-slate-50'
    : 'flex flex-1 min-h-0 overflow-hidden';

  const leftClass = isPip
    ? 'w-[52%] min-w-0 border-r border-gray-200 overflow-y-auto p-3 space-y-3 bg-white'
    : 'flex-1 overflow-y-auto p-5 space-y-5';

  const rightClass = isPip
    ? 'w-[48%] min-w-0 overflow-y-auto p-3 space-y-3 bg-gray-50/80'
    : 'w-[22rem] shrink-0 border-l border-gray-200 overflow-y-auto p-4 space-y-4 bg-white';

  const primaryTip = data.strategicTips[0] ?? (data.overlay
    ? { tip: data.overlay.strategicTip, exactScript: data.overlay.strategicTipScript }
    : null);

  return (
    <div className={rootClass}>
      {/* LEFT — Live guidance */}
      <div className={leftClass}>
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
            Live guidance
          </p>
          {data.guidance ? (
            <div className="rounded-xl border border-gray-200 bg-white p-3 space-y-2 shadow-sm">
              <div className="flex items-center gap-2">
                <Zap size={14} className="text-blue-500" />
                <span className="text-xs font-semibold text-gray-800">Live coaching update</span>
              </div>
              <span className="inline-block px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-[11px] font-medium">
                {data.guidance.currentStage}
              </span>
              <p className="text-sm text-gray-800 leading-snug">
                <span className="font-semibold text-emerald-700">Next: </span>
                {data.guidance.nextSuggestion}
              </p>
            </div>
          ) : (
            <p className="text-xs text-gray-400 italic">
              {isCapturing ? 'Analyzing conversation…' : 'Start AI Assist to enable guidance.'}
            </p>
          )}
        </div>

        {data.responses.length > 0 && (
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
              Suggested responses
            </p>
            <div className="space-y-2">
              {data.responses.map((resp, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => onCopyResponse?.(resp, i)}
                  className="w-full text-left rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 hover:border-blue-200 hover:bg-blue-50/40 transition-colors"
                >
                  {copiedIdx === i ? (
                    <span className="text-green-600 text-xs font-semibold">Copied</span>
                  ) : (
                    resp
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {primaryTip && (
          <div className="rounded-xl border border-violet-100 bg-violet-50/50 p-3 space-y-2">
            <p className="text-[10px] font-bold text-violet-600 uppercase tracking-widest">
              Strategic tips
            </p>
            <p className="text-sm text-gray-800 leading-snug">{primaryTip.tip}</p>
            {primaryTip.exactScript && (
              <p className="text-xs text-gray-600 border-l-2 border-violet-300 pl-2">
                <span className="font-semibold">Say: </span>
                {primaryTip.exactScript}
              </p>
            )}
            {data.strategicTips.length > 1 && (
              <ul className="text-xs text-gray-600 space-y-1 pt-1">
                {data.strategicTips.slice(1, 3).map((t, i) => (
                  <li key={i}>• {t.tip}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {(data.logEntries.length > 0 || data.overlay?.strategicTip) && (
          <div className="rounded-xl border border-amber-100 bg-amber-50/60 p-3">
            <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest mb-2">
              Drift detection &amp; alerts
            </p>
            {data.logEntries.length === 0 ? (
              <p className="text-xs text-gray-500">No active alerts.</p>
            ) : (
              <ul className="space-y-2">
                {data.logEntries.map((e, i) => (
                  <li key={i} className="text-xs text-amber-900">
                    <span className="font-semibold">{e.title}: </span>
                    {e.description}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {data.competitors.length > 0 && (
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <button
              type="button"
              onClick={() => setCompetitorOpen((v) => !v)}
              className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-gray-50"
            >
              <span className="text-[10px] font-bold text-orange-600 uppercase tracking-widest">
                Competitor intelligence
              </span>
              {competitorOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>
            {competitorOpen && (
              <div className="px-3 pb-3 pt-1">
                {data.competitors.map((c) => (
                  <CompetitorBlock key={c.competitorName} comp={c} />
                ))}
              </div>
            )}
          </div>
        )}

        {data.previousSuggestions.length > 0 && (
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
              Previous suggestions
            </p>
            <ul className="space-y-1.5">
              {data.previousSuggestions.slice(0, 6).map((s, i) => (
                <li key={i} className="text-xs text-gray-500 flex gap-2">
                  <span className="font-mono shrink-0 text-gray-400">{s.timeLabel}</span>
                  <span className="line-clamp-2">{s.text}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* RIGHT — Intent & risk + transcript */}
      <div className={rightClass}>
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
            Intent &amp; risk
          </p>
          {data.signals.length === 0 ? (
            <p className="text-xs text-gray-400 italic">No intent signal yet.</p>
          ) : (
            <div className="space-y-1.5">
              {data.signals.map((sig) => (
                <SignalRow key={`${sig.label}-${sig.value}`} signal={sig} />
              ))}
            </div>
          )}
        </div>

        {data.objectionTimeline.length > 0 && (
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">
              Objection timeline
            </p>
            <ul className="text-xs text-gray-600 space-y-1">
              {data.objectionTimeline.map((o, i) => (
                <li key={i}>• {o}</li>
              ))}
            </ul>
          </div>
        )}

        {data.talkRatio && (
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="rounded-lg border border-gray-200 bg-white p-2">
              <p className="text-[9px] text-gray-400 uppercase">{data.repName} talk</p>
              <p className="text-lg font-bold text-violet-600">{data.talkRatio.repPercent}%</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-2">
              <p className="text-[9px] text-gray-400 uppercase">{data.clientName} talk</p>
              <p className="text-lg font-bold text-pink-600">{data.talkRatio.customerPercent}%</p>
            </div>
          </div>
        )}

        {data.metrics && (
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-500">Sentiment</span>
              <span className="font-medium text-gray-800">Neutral</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-500">Interruptions</span>
              <span className="font-medium text-gray-800">{data.metrics.interruptions || 'low'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-500">Pace</span>
              <span className="font-medium text-gray-800">{data.metrics.speakingPace}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-gray-100">
              <span className="text-gray-500">Words/min</span>
              <span className="font-medium text-gray-800">{data.metrics.wordsPerMinute}</span>
            </div>
          </div>
        )}

        {data.contextSummary && (
          <div className="rounded-lg border border-gray-200 bg-white p-2">
            <p className="text-[9px] font-bold text-gray-400 uppercase mb-1">LLM context</p>
            <p className="text-xs text-gray-600 leading-relaxed line-clamp-4">{data.contextSummary}</p>
          </div>
        )}

        <div className="pt-1 border-t border-gray-200">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
            Diarized transcript
          </p>
          <DiarizedTranscript
            lines={data.diarizedLines}
            repName={data.repName}
            clientName={data.clientName}
          />
        </div>
      </div>
    </div>
  );
}
