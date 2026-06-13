'use client';

import { useState } from 'react';
import { X, Sparkles, Send } from 'lucide-react';
import type { Tracker, TrackerDetail } from '../../types/tracker.types';

interface TrackerDetailPanelProps {
  tracker: Tracker;
  detail: TrackerDetail | null;
  detailLoading: boolean;
  closePanel: () => void;
  postQuestion: (question: string) => void;
  aiResponse: string | null;
  aiResponseLoading: boolean;
}

export default function TrackerDetailPanel({
  tracker,
  detail,
  detailLoading,
  closePanel,
  postQuestion,
  aiResponse,
  aiResponseLoading,
}: TrackerDetailPanelProps) {
  const [question, setQuestion] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (question.trim()) {
      postQuestion(question);
      setQuestion('');
    }
  };

  return (
    <div className="w-[340px] shrink-0 bg-white border border-gray-200 rounded-xl sticky top-6 h-fit max-h-[calc(100vh-8rem)] overflow-y-auto">
      <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between z-10">
        <h3 className="font-semibold text-gray-900">{tracker.name}</h3>
        <button
          type="button"
          onClick={closePanel}
          className="p-1 hover:bg-gray-100 rounded-md transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      <div className="p-4 space-y-6">
        {detailLoading ? (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-lg p-4 h-24 animate-pulse" />
            <div className="bg-gray-50 rounded-lg p-4 h-24 animate-pulse" />
          </div>
        ) : detail ? (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Percentage</p>
              <p className="text-2xl font-semibold text-gray-900">{detail.percentage}%</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Mentions</p>
              <p className="text-2xl font-semibold text-gray-900">{detail.mentions}</p>
            </div>
          </div>
        ) : null}

        {detailLoading ? (
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-3">TOP ACCOUNTS</p>
            <div className="space-y-2">
              <div className="h-10 bg-gray-100 rounded-lg animate-pulse" />
              <div className="h-10 bg-gray-100 rounded-lg animate-pulse" />
            </div>
          </div>
        ) : detail ? (
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-3">TOP ACCOUNTS</p>
            <div className="space-y-2">
              {detail.topAccounts.map((account: any) => (
                <div key={account.accountId || account} className="border rounded-lg px-3 py-2 text-sm text-gray-900">
                  {account.accountName || account}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {detailLoading ? (
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-3">TOP REPS</p>
            <div className="space-y-2">
              <div className="h-10 bg-gray-100 rounded-lg animate-pulse" />
              <div className="h-10 bg-gray-100 rounded-lg animate-pulse" />
            </div>
          </div>
        ) : detail ? (
          <div>
            <p className="text-xs font-semibold text-gray-500 mb-3">TOP REPS</p>
            <div className="space-y-2">
              {detail.topReps.map((rep: any) => (
                <div key={rep.repId || rep} className="border rounded-lg px-3 py-2 text-sm text-gray-900">
                  {rep.repName || rep}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {detailLoading ? (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 h-24 animate-pulse" />
        ) : detail ? (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <p className="text-sm font-semibold text-amber-800">AI Insights</p>
            </div>
            <p className="text-sm text-amber-900">{detail.aiInsight}</p>
          </div>
        ) : null}

        <div>
          <p className="text-xs font-semibold text-gray-500 mb-3">ASK ANYTHING</p>
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              placeholder="Ask about this tracker..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={!question.trim() || aiResponseLoading}
              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          {aiResponse && (
            <div className="mt-3 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-900">{aiResponse}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
