"use client";

import { Mail, Phone, AlertCircle, Clock, ListTodo } from 'lucide-react';
import type { TaskType, StatusTab } from '../types/engage.types';

function LinkedinIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.25"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={style}
    >
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}


interface TypeTabsProps {
  activeStatusTab: StatusTab;
  onStatusTabChange: (tab: StatusTab) => void;
  tabCounts: Record<StatusTab, number>;
  activeChannel: TaskType;
  onChannelChange: (channel: TaskType) => void;
  statusPills?: { atRisk: number; dueToday: number };
}

const typeConfig = {
  all: { label: 'All', icon: null },
  email: { label: 'Email', icon: Mail },
  call: { label: 'Call', icon: Phone },
  linkedin: { label: 'LinkedIn', icon: LinkedinIcon },
  custom: { label: 'Custom', icon: ListTodo },
};

export default function TypeTabs({
  activeStatusTab,
  onStatusTabChange,
  tabCounts,
  activeChannel,
  onChannelChange,
  statusPills = { atRisk: 0, dueToday: 0 },
}: TypeTabsProps) {
  const types: TaskType[] = ['all', 'email', 'call', 'linkedin', 'custom'];

  const tabs: { id: StatusTab; label: string; countKey: StatusTab }[] = [
    { id: 'today', label: 'Today', countKey: 'today' },
    { id: 'inProgress', label: 'In-Progress', countKey: 'inProgress' },
    { id: 'upcoming', label: 'Upcoming', countKey: 'upcoming' },
    { id: 'completed', label: 'Completed', countKey: 'completed' },
  ];

  return (
    <div
      style={{
        borderBottom: '1px solid #E5E7EB',
        backgroundColor: '#FFFFFF',
      }}
      className="mb-4 rounded-xl border border-gray-200"
    >
      <div className="max-w-[1800px] mx-auto px-6 py-3">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Left: Status Tabs - Segmented Control */}
          <div
            role="tablist"
            aria-label="Status filter tabs"
            className="inline-flex items-center gap-1 rounded-lg p-1"
            style={{
              backgroundColor: '#F3F4F6',
            }}
          >
            {tabs.map((tab) => {
              const isActive = activeStatusTab === tab.id;
              const count = tabCounts[tab.countKey] || 0;

              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => onStatusTabChange(tab.id)}
                  className="inline-flex items-center gap-1.5 rounded-md cursor-pointer outline-none transition-all duration-200"
                  style={{
                    padding: '6px 12px',
                    fontSize: '14px',
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? '#111827' : '#6B7280',
                    backgroundColor: isActive ? '#FFFFFF' : 'transparent',
                    boxShadow: isActive ? '0 1px 2px rgba(0, 0, 0, 0.05)' : 'none',
                    border: 'none',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = '#E5E7EB';
                      e.currentTarget.style.color = '#111827';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#6B7280';
                    }
                  }}
                >
                  <span>{tab.label}</span>
                  <span
                    style={{
                      fontSize: '12px',
                      fontWeight: 500,
                      color: isActive ? '#6B7280' : '#9CA3AF',
                    }}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Center: Status Indicators */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 text-red-600" />
              <span className="text-sm font-medium text-red-600">
                {statusPills.atRisk} at risk
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-500">
                {statusPills.dueToday} due today
              </span>
            </div>
          </div>

          {/* Right: Channel Filters (Underlined Style) */}
          <div className="flex items-center gap-5">
            {types.map((type) => {
              const config = typeConfig[type];
              const Icon = config.icon;
              const isActive = activeChannel === type;

              return (
                <button
                  key={type}
                  onClick={() => onChannelChange(type)}
                  className="inline-flex items-center gap-1.5 text-sm font-medium transition-colors whitespace-nowrap relative pb-0.5"
                  style={{
                    color: isActive ? '#111827' : '#6B7280',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = '#111827';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = '#6B7280';
                    }
                  }}
                >
                  {Icon && <Icon className="w-3.5 h-3.5" />}
                  <span>{config.label}</span>
                  {isActive && (
                    <div
                      className="absolute -bottom-[14px] left-0 right-0"
                      style={{
                        height: '2px',
                        backgroundColor: '#111827',
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
