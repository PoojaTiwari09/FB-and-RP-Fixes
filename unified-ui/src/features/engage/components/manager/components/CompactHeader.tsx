"use client";

import { Plus } from 'lucide-react';

interface CompactHeaderProps {
  headerAlert?: string;
  onCreateClick: () => void;
  isLoading?: boolean;
  isViewOnly?: boolean;
}

function RelantoLogo() {
  return (
    <span
      className="flex-shrink-0 px-2.5 py-1 rounded-md text-xs font-bold tracking-wide"
      style={{ backgroundColor: '#F5F3FF', color: '#7C3AED', border: '1px solid #EDE9FE' }}
    >
      Relanto
    </span>
  );
}

export default function CompactHeader({
  headerAlert,
  onCreateClick,
  isLoading = false,
  isViewOnly = false,
}: CompactHeaderProps) {
  return (
    <div style={{ borderBottom: '1px solid #E5E7EB', backgroundColor: '#FFFFFF' }} className="mb-4 rounded-xl shadow-sm">
      <div className="max-w-[1800px] mx-auto px-6 py-4">
        <div className="flex items-center justify-between gap-6">
          {/* Left: Logo + Title + AI Insight */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <button
                onClick={() => console.log('Navigate to home')}
                className="flex-shrink-0 transition-opacity hover:opacity-70 flex items-center"
              >
                <RelantoLogo />
              </button>
              
              <div className="h-4 w-px bg-gray-200" />

              <h1 className="text-lg font-semibold truncate flex items-center gap-2" style={{ color: '#111827', fontFamily: '"Source Serif 4", serif', fontWeight: 600 }}>
                <span style={{ fontFamily: '"Source Serif 4", serif', fontWeight: 600 }}>Sales Command Center</span>
                <span className="w-2 h-2 rounded-full bg-blue-600 inline-block animate-pulse shrink-0" />
                {isLoading && (
                  <span className="inline-block h-2 w-2 animate-ping rounded-full bg-blue-600 shrink-0" />
                )}
              </h1>
            </div>
            {headerAlert && (
              <p className="text-sm" style={{ color: '#6B7280' }}>
                {headerAlert}
              </p>
            )}
          </div>

          {/* Right: Create Task Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={onCreateClick}
              disabled={isViewOnly}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors"
              style={{
                backgroundColor: isViewOnly ? '#E5E7EB' : '#111827',
                color: isViewOnly ? '#9CA3AF' : '#FFFFFF',
                cursor: isViewOnly ? 'not-allowed' : 'pointer',
              }}
              onMouseEnter={(e) => {
                if (!isViewOnly) {
                  e.currentTarget.style.backgroundColor = '#1F2937';
                }
              }}
              onMouseLeave={(e) => {
                if (!isViewOnly) {
                  e.currentTarget.style.backgroundColor = '#111827';
                }
              }}
            >
              <Plus className="w-4 h-4" />
              Create Task
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
