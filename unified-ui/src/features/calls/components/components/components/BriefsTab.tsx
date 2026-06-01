import React from 'react';
import type { BriefDetail, BriefsListResponse } from '../types/calls.types';
import { formatDate } from '../utils/formatters';

interface BriefsTabProps {
  briefsData: BriefsListResponse | null;
  activeBrief: BriefDetail | null;
  onLoadBrief: (briefId: string) => void;
  onGenerateClick: () => void;
  onShareClick: (briefId: string) => void;
}

export default function BriefsTab({ briefsData, activeBrief, onLoadBrief, onGenerateClick, onShareClick }: BriefsTabProps) {
  if (!briefsData || briefsData.briefs.length === 0) {
    return (
      <div className="p-8 text-center flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg m-6">
        <h3 className="mt-2 text-sm font-semibold text-gray-900">No briefs generated</h3>
        <p className="mt-1 text-sm text-gray-500">Generate an AI brief to summarize this call.</p>
        <button
          onClick={onGenerateClick}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Generate Brief
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Sidebar for briefs list */}
      <div className="w-64 border-r border-gray-200 bg-gray-50 p-4 overflow-y-auto">
        <button
          onClick={onGenerateClick}
          className="w-full mb-4 inline-flex justify-center items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
        >
          + New Brief
        </button>
        <div className="space-y-2">
          {briefsData.briefs.map((brief) => (
            <button
              key={brief.briefId}
              onClick={() => onLoadBrief(brief.briefId)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                activeBrief?.briefId === brief.briefId
                  ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                  : 'text-gray-700 hover:bg-gray-100 border border-transparent'
              }`}
            >
              <div className="font-medium">{brief.briefTemplate}</div>
              <div className="text-xs text-gray-500">{formatDate(brief.generatedAt)}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Brief Detail Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        {activeBrief ? (
          <div className="max-w-3xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">{activeBrief.briefTemplate}</h2>
              <button
                onClick={() => onShareClick(activeBrief.briefId)}
                className="text-sm text-indigo-600 font-medium hover:text-indigo-800"
              >
                Share
              </button>
            </div>
            
            <section>
              <h3 className="text-lg font-semibold text-gray-900 mb-2 border-b pb-2">Overview</h3>
              <p className="text-gray-700 text-sm whitespace-pre-wrap leading-relaxed">{activeBrief.overview.text}</p>
            </section>

            {activeBrief.keyDiscussionPoints?.length > 0 && (
              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 border-b pb-2">Key Discussion Points</h3>
                <ul className="list-disc pl-5 space-y-2 text-sm text-gray-700">
                  {activeBrief.keyDiscussionPoints.map((pt, i) => (
                    <li key={i}><span className="font-medium text-gray-900 mr-2">{pt.timestamp}</span>{pt.description}</li>
                  ))}
                </ul>
              </section>
            )}

            {activeBrief.customerNeeds?.length > 0 && (
              <section>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 border-b pb-2">Customer Needs</h3>
                <ul className="space-y-3">
                  {activeBrief.customerNeeds.map((need, i) => (
                    <li key={i} className="text-sm">
                      <div className="font-medium text-gray-900">{need.title}</div>
                      <div className="text-gray-700">{need.description}</div>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">Select a brief to view details</div>
        )}
      </div>
    </div>
  );
}
