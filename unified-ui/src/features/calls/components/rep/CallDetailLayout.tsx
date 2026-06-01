'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { fetchCall } from '@calls/services/callsApi';
import type { CallDetail } from '@calls/data/mockData';
import AssemblyAIKeySettings from '@calls/components/rep/AssemblyAIKeySettings';

const PARTICIPANT_COLORS: Record<string, string> = {
  Rep: 'text-blue-600',
  Buyer: 'text-purple-600',
  'Tech Lead': 'text-green-600',
  CFO: 'text-orange-600',
  CTO: 'text-pink-600',
  PM: 'text-teal-600',
  'VP Sales': 'text-indigo-600',
};

function getScoreTextColor(score: number) {
  if (score >= 80) return 'text-green-600';
  if (score >= 60) return 'text-yellow-600';
  return 'text-red-600';
}

function formatDateTime(iso: string) {
  const d = new Date(iso);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  return `${year}-${month}-${day} at ${time}`;
}

interface CallDetailLayoutProps {
  callId: string;
  children: React.ReactNode;
}

export default function CallDetailLayout({ callId, children }: CallDetailLayoutProps) {
  const pathname = usePathname();
  const [call, setCall] = useState<CallDetail | null>(null);

  useEffect(() => {
    fetchCall(callId).then(setCall);
  }, [callId]);

  const tabs = [
    { label: 'Overview', href: `/calls/ai-reviewer/${callId}/overview` },
    { label: 'Review', href: `/calls/ai-reviewer/${callId}/review` },
    { label: 'Feedback', href: `/calls/ai-reviewer/${callId}/feedback` },
  ];

  const activeTab = tabs.find((t) => pathname.startsWith(t.href))?.label ?? 'Overview';

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Back Link */}
      <div className="px-6 pt-4 bg-white border-b border-gray-100">
        <div className="flex items-center justify-between gap-3 mb-3">
          <Link
            href="/calls/ai-reviewer"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft size={14} />
            Back to My Calls
          </Link>
          <AssemblyAIKeySettings compact />
        </div>

        {/* Call Header */}
        {call ? (
          <div className="flex items-start justify-between pb-3">
            <div className="flex flex-col gap-1.5 flex-1 min-w-0 pr-6">
              {/* Title */}
              <h1 className="text-2xl font-semibold leading-tight" style={{ color: '#111827' }}>{call.callName}</h1>

              {/* Meta row — bullet-separated, no icons */}
              <div className="flex flex-wrap items-center text-sm text-gray-500">
                <span className="font-medium text-gray-700">{call.account}</span>
                <span className="mx-2 text-gray-300">•</span>
                <span>{formatDateTime(call.dateTime)}</span>
                <span className="mx-2 text-gray-300">•</span>
                <span>{call.duration}</span>
                <span className="mx-2 text-gray-300">•</span>
                <span>{call.type}</span>
                <span className="mx-2 text-gray-300">•</span>
                <span>{call.stage}</span>
              </div>

              {/* Participants — inline "Name (Role)" separated by commas */}
              <div className="flex flex-wrap items-baseline text-sm text-gray-500">
                <span className="font-medium text-gray-700 mr-1.5">Participants:</span>
                {call.participants.map((p, i) => (
                  <span key={p.name} className="mr-0.5">
                    <span className={`font-medium ${PARTICIPANT_COLORS[p.role] ?? 'text-gray-700'}`}>
                      {p.name}
                    </span>
                    <span className="text-gray-500"> ({p.role})</span>
                    {i < call.participants.length - 1 && (
                      <span className="text-gray-400">,&nbsp;</span>
                    )}
                  </span>
                ))}
              </div>
            </div>

            {/* AI Score */}
            {call.score > 0 && (
              <div className="flex flex-col items-end shrink-0">
                <div className="text-sm mb-1" style={{ color: '#6B7280' }}>AI Score</div>
                <div className={`text-3xl font-semibold ${getScoreTextColor(call.score)}`}>
                  {call.score}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="pb-4">
            <div className="h-7 w-72 bg-gray-100 rounded animate-pulse mb-2" />
            <div className="h-4 w-96 bg-gray-100 rounded animate-pulse mb-1.5" />
            <div className="h-4 w-80 bg-gray-100 rounded animate-pulse" />
          </div>
        )}

        {/* Tab Bar */}
        <div className="flex gap-0 -mb-px">
          {tabs.map((tab) => (
            <Link
              key={tab.label}
              href={tab.href}
              className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.label
                  ? 'border-blue-600 text-blue-700'
                  : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {children}
      </div>
    </div>
  );
}
