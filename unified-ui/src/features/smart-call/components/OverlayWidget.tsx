'use client';

import { useState } from 'react';
import { Copy, Volume2, Minus, X, AlertTriangle } from 'lucide-react';
import type {
  OverlayUpdateEvent,
  LogEntry,
  IntentSignal,
  TalkRatioEvent,
  ConversationMetricsEvent,
} from '@smart-call/types/smart-call.types';

interface Props {
  data: OverlayUpdateEvent | null;
  logEntries: LogEntry[];
  signals: IntentSignal[];
  talkRatio: TalkRatioEvent | null;
  metrics: ConversationMetricsEvent | null;
  contactName: string;
  contactCompany: string;
  onClose: () => void;
}

type OverlayTab = 'Coach' | 'Signals' | 'Log';

const SIGNAL_VALUE_STYLES: Record<string, string> = {
  green:  'text-green-400',
  blue:   'text-blue-400',
  yellow: 'text-yellow-400',
  purple: 'text-purple-400',
  red:    'text-red-400',
};

export default function OverlayWidget({
  data,
  logEntries,
  signals,
  talkRatio,
  metrics,
  contactName,
  contactCompany,
  onClose,
}: Props) {
  const [activeTab, setActiveTab] = useState<OverlayTab>('Coach');
  const [minimized, setMinimized] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!data) return;
    navigator.clipboard.writeText(data.suggestedResponse).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const intentSignals = signals.filter((s) => s.severity !== 'MEDIUM' && s.severity !== 'LOW');
  const riskSignals   = signals.filter((s) => s.severity === 'MEDIUM' || s.severity === 'LOW');

  return (
    <div
      className="fixed right-4 top-20 z-50 w-72 rounded-2xl overflow-hidden shadow-2xl"
      style={{ background: '#1a1d2e' }}
    >
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
          <span className="text-xs font-semibold text-white">Live AI Co-Pilot</span>
          {data && (
            <span className="px-2 py-0.5 rounded-full bg-violet-600 text-white text-[10px] font-semibold">
              {data.confidenceScore}%
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMinimized((v) => !v)}
            className="p-1 text-gray-400 hover:text-white transition-colors"
            aria-label="Minimize"
          >
            <Minus size={13} />
          </button>
          <button
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {minimized ? null : !data ? (
        <div className="px-4 py-8 text-center space-y-2">
          <div className="w-6 h-6 rounded-full border-2 border-violet-500 border-t-transparent animate-spin mx-auto" />
          <p className="text-xs text-gray-400">AI is analysing the conversation…</p>
        </div>
      ) : (
        <>
          {/* ── Context ───────────────────────────────────────────────────── */}
          <div className="px-4 pt-3 pb-2 space-y-1">
            <div className="flex gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white text-xs font-medium">
                {contactName}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white text-xs font-medium">
                {contactCompany}
              </span>
            </div>
            <p className="text-xs text-white font-medium leading-snug pt-1">
              {data.contextSummary}
            </p>
            <p className="text-xs text-gray-400 leading-snug">{data.actionSuggestion}</p>
          </div>

          {/* ── Tabs ──────────────────────────────────────────────────────── */}
          <div className="flex gap-1 px-4 pb-2">
            {(['Coach', 'Signals', 'Log'] as OverlayTab[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  activeTab === tab
                    ? 'bg-violet-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* ── Tab content ───────────────────────────────────────────────── */}
          <div className="max-h-[460px] overflow-y-auto px-4 pb-4 space-y-3">

            {/* COACH TAB */}
            {activeTab === 'Coach' && (
              <>
                {/* Suggested Response */}
                <div className="rounded-xl p-3 space-y-2" style={{ background: '#252840' }}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                      Suggested Response
                    </span>
                    <div className="flex gap-2">
                      <button onClick={handleCopy} className="text-gray-400 hover:text-white transition-colors">
                        <Copy size={12} />
                      </button>
                      <button className="text-gray-400 hover:text-white transition-colors">
                        <Volume2 size={12} />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-white leading-relaxed">
                    {copied ? '✓ Copied!' : data.suggestedResponse}
                  </p>
                </div>

                {/* Strategic Tips */}
                <div className="rounded-xl p-3 space-y-2" style={{ background: '#252840' }}>
                  <div className="flex items-center gap-1.5">
                    <span className="text-orange-400">🎯</span>
                    <span className="text-[10px] font-semibold text-orange-400 uppercase tracking-wider">
                      Strategic Tips
                    </span>
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed">{data.strategicTip}</p>
                  <p className="text-xs text-gray-400 italic leading-relaxed">
                    &ldquo;{data.strategicTipScript}&rdquo;
                  </p>
                </div>

                {/* Competitor Intelligence */}
                <div className="space-y-2">
                  <p className="text-[10px] font-semibold text-orange-400 uppercase tracking-wider">
                    Competitor Intelligence
                  </p>
                  {data.competitors.map((comp) => (
                    <div key={comp.competitorName} className="rounded-xl p-3 space-y-2" style={{ background: '#252840' }}>
                      <span className="inline-block px-2.5 py-0.5 rounded-full bg-pink-500 text-white text-[10px] font-semibold">
                        vs {comp.competitorName}
                      </span>
                      <div>
                        <p className="text-[10px] text-green-400 font-semibold">Our Edge</p>
                        <p className="text-xs text-gray-300 leading-snug mt-0.5">{comp.ourEdge}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-gray-400 font-semibold">Say</p>
                        <p className="text-xs text-gray-400 italic leading-snug mt-0.5">
                          &ldquo;{comp.sayThis}&rdquo;
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* SIGNALS TAB */}
            {activeTab === 'Signals' && (
              <>
                {/* Alert banner */}
                <div className="rounded-xl p-3 border border-red-500/40" style={{ background: '#2a1a1a' }}>
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle size={12} className="text-red-400" />
                    <span className="text-[10px] font-semibold text-red-400 uppercase tracking-wider">
                      Alerts
                    </span>
                  </div>
                  <p className="text-xs text-red-300">Client is showing signs of price sensitivity</p>
                </div>

                {/* Metrics grid */}
                {talkRatio && metrics && (
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'REP TALK',   value: `${talkRatio.repPercent}%`      },
                      { label: 'CLIENT TALK', value: `${talkRatio.customerPercent}%` },
                      { label: 'WPM',         value: String(metrics.wordsPerMinute)  },
                      { label: 'PACE',        value: metrics.speakingPace === 'GOOD' ? 'Balanced' : metrics.speakingPace },
                      { label: 'INTERRUPTS',  value: metrics.interruptions === 0 ? 'None' : String(metrics.interruptions) },
                      { label: 'SEGMENTS',    value: '11' },
                    ].map((m) => (
                      <div
                        key={m.label}
                        className="rounded-lg p-2 text-center"
                        style={{ background: '#252840' }}
                      >
                        <p className="text-[9px] text-gray-500 uppercase tracking-wider">{m.label}</p>
                        <p className="text-xs font-bold text-white mt-0.5">{m.value}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Intent Signals */}
                {intentSignals.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold text-gray-400 mb-2">Intent Signals</p>
                    <div className="space-y-1.5">
                      {intentSignals.map((sig) => (
                        <div
                          key={sig.label}
                          className="flex items-center justify-between py-2 px-3 rounded-lg"
                          style={{ background: '#252840' }}
                        >
                          <span className="text-xs text-gray-300">{sig.label}</span>
                          <span className={`text-xs font-semibold ${SIGNAL_VALUE_STYLES[sig.color] ?? 'text-gray-300'}`}>
                            {sig.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Risk Signals */}
                {riskSignals.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold text-gray-400 mb-2">Risk Signals</p>
                    <div className="space-y-1.5">
                      {riskSignals.map((sig) => (
                        <div
                          key={sig.label}
                          className="flex items-center justify-between py-2 px-3 rounded-lg border border-yellow-500/20"
                          style={{ background: '#2a2210' }}
                        >
                          <div className="flex items-center gap-1.5">
                            <AlertTriangle size={11} className="text-yellow-500" />
                            <span className="text-xs text-gray-300">{sig.label}</span>
                          </div>
                          <span className={`text-xs font-semibold ${SIGNAL_VALUE_STYLES[sig.color] ?? 'text-gray-300'}`}>
                            {sig.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* LOG TAB */}
            {activeTab === 'Log' && (
              <div className="space-y-0">
                {logEntries.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-4">
                    Events will appear as the conversation progresses.
                  </p>
                ) : (
                  logEntries.map((entry, i) => (
                    <div
                      key={i}
                      className="py-3 border-b border-white/5 last:border-0"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono text-orange-400">{entry.timestamp}</span>
                        <span className="text-xs font-semibold text-orange-300">{entry.title}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5 pl-0">{entry.description}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

