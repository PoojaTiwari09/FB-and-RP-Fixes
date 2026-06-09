'use client';

import { ArrowLeft, MessageSquare, Shield, Lightbulb, FileText, Lock, Sparkles } from 'lucide-react';
import type { PreCallBrief, Integration } from '@smart-call/types/smart-call.types';

interface Props {
  brief: PreCallBrief;
  onStart: () => void;
  onBack: () => void;
}

const INTEGRATION_LABELS: Record<Integration, string> = {
  ZOOM: 'Zoom',
  MEET: 'Meet',
  TEAMS: 'Teams',
};

const AI_FEATURES = [
  {
    icon: <MessageSquare size={15} className="text-blue-500" />,
    title: 'Real-time call suggestions',
    desc: 'Get instant prompts and responses during the conversation',
  },
  {
    icon: <Shield size={15} className="text-orange-500" />,
    title: 'Objection handling prompts',
    desc: 'AI-powered responses to common objections and concerns',
  },
  {
    icon: <Lightbulb size={15} className="text-orange-400" />,
    title: 'Key insights and reminders',
    desc: 'Contextual information about the contact and their needs',
  },
  {
    icon: <FileText size={15} className="text-red-400" />,
    title: 'Live transcription and highlights',
    desc: 'Automatic transcript with key moments flagged',
  },
];

export default function PreCallScreen({ brief, onStart, onBack }: Props) {
  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden bg-gray-50">
      {/* Back bar */}
      <div className="px-6 py-3 bg-white border-b border-gray-100">
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft size={14} />
          Back to Task
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto py-10 px-4">
        <div className="max-w-lg mx-auto space-y-6">

          {/* Hero */}
          <div className="flex flex-col items-center text-center gap-3">
            <div className="w-14 h-14 rounded-full bg-orange-500 flex items-center justify-center shadow-md">
              <Sparkles size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Smart Call – Live Assist</h1>
              <p className="text-sm text-gray-500 mt-1">
                Calling:{' '}
                <span className="font-semibold text-gray-700">{brief.contactName}</span>
                {' '}at {brief.contactCompany}
              </p>
            </div>
            <div className="mt-1">
              <h2 className="text-base font-semibold text-gray-900">
                Get AI Assistance During Your Call
              </h2>
              <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                Start Live Assist to get real-time suggestions, talking points, and insights
                while you&apos;re on a call.
              </p>
            </div>
          </div>

          {/* What AI Will Do */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
              What AI Will Do
            </p>
            {AI_FEATURES.map((f) => (
              <div key={f.title} className="flex items-start gap-3">
                <div className="mt-0.5 shrink-0">{f.icon}</div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{f.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Screen Sharing Required */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
            <Lock size={15} className="text-blue-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-blue-700">Screen Sharing Required</p>
              <p className="text-xs text-blue-600 mt-1 leading-relaxed">
                To enable Live Assist, you&apos;ll need to share your screen or window.
                We only use this to provide contextual suggestions during your call.
              </p>
              <p className="text-xs text-blue-500 mt-2 flex items-center gap-1.5">
                <span className="text-blue-500">✓</span>
                Your data is secure and not recorded without permission
              </p>
            </div>
          </div>

          {/* Works With */}
          <div className="flex flex-col items-center gap-2">
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
              Works With
            </p>
            <div className="flex items-center gap-2">
              {brief.supportedIntegrations.map((int) => (
                <span
                  key={int}
                  className="px-4 py-1.5 rounded-full border border-gray-200 bg-white text-xs font-medium text-gray-600"
                >
                  {INTEGRATION_LABELS[int]}
                </span>
              ))}
            </div>
          </div>

          {/* CTAs */}
          <div className="space-y-2 pb-4">
            <button
              onClick={onStart}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-orange-500 hover:bg-orange-600 active:bg-orange-700 text-white font-semibold rounded-xl transition-colors shadow-sm"
            >
              <Sparkles size={16} />
              Start Live Assist
            </button>
            <button
              onClick={onBack}
              className="w-full text-sm text-gray-400 hover:text-gray-600 py-2 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
