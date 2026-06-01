import React from 'react';
import type { CallMetadata } from '../types/calls.types';
import { formatFullDateTime, getStatusStyles, getDealTypeStyles } from '../utils/formatters';
import Link from 'next/link';

interface CallDetailHeaderProps {
  metadata: CallMetadata | null;
  onShareClick: () => void;
}

export default function CallDetailHeader({ metadata, onShareClick }: CallDetailHeaderProps) {
  if (!metadata) return <div className="h-24 bg-white border-b border-gray-200 animate-pulse" />;

  const dealStyle = getDealTypeStyles(metadata.dealType);
  
  // Using a simpler icon replacement since Heroicons import might be missing 
  const ArrowLeftIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
    </svg>
  );

  const ShareIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
      <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
    </svg>
  );

  return (
    <div className="bg-white border-b border-gray-200 px-6 py-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-4">
        <Link href="/calls/list" className="mt-1 text-gray-400 hover:text-gray-600">
          <ArrowLeftIcon />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">{metadata.callTitle}</h1>
          <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
            <span>{formatFullDateTime(metadata.date + 'T' + metadata.time)}</span>
            <span>•</span>
            <span>{metadata.duration}</span>
            <span>•</span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${dealStyle}`}>
              {metadata.dealType}
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button 
          onClick={onShareClick}
          className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <ShareIcon />
          Share Call
        </button>
      </div>
    </div>
  );
}
