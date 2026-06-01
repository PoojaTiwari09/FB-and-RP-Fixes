"use client";

import { Phone, Mail, Clock, MessageSquare } from 'lucide-react';
import { MOCK_RECENT_ACTIVITY } from '../mocks/engage.mock';

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


interface RecentActivitySidebarProps {
  activities?: typeof MOCK_RECENT_ACTIVITY;
}

const iconMap = {
  call: Phone,
  email: Mail,
  linkedin: LinkedinIcon,
};

const iconColorMap = {
  call: '#6B7280',
  email: '#4F46E5',
  linkedin: '#0A66C2',
};

const iconBgMap = {
  call: '#F3F4F6',
  email: '#EEF2FF',
  linkedin: '#EFF6FF',
};

export default function RecentActivitySidebar({ activities = MOCK_RECENT_ACTIVITY }: RecentActivitySidebarProps) {
  return (
    <div
      className="rounded-lg p-4"
      style={{
        border: '1px solid #E5E7EB',
        backgroundColor: '#FFFFFF',
      }}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold" style={{ color: '#111827' }}>
          Recent Activity
        </h3>
        <span className="text-xs font-medium" style={{ color: '#9CA3AF' }}>
          {activities.length}
        </span>
      </div>

      <div className="space-y-3">
        {activities.map((activity) => {
          // Normalize activity type
          const rawType = activity.activityType.toLowerCase();
          const activityType = rawType.includes('email') 
            ? 'email' 
            : rawType.includes('linkedin') 
              ? 'linkedin' 
              : 'call';

          const Icon = iconMap[activityType] || MessageSquare;
          const iconColor = iconColorMap[activityType] || '#6B7280';
          const iconBg = iconBgMap[activityType] || '#F3F4F6';

          return (
            <div
              key={activity.id}
              className="flex items-start gap-3 pb-3"
              style={{
                borderBottom: '1px solid #F3F4F6',
              }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: iconBg }}
              >
                <Icon className="w-4 h-4" style={{ color: iconColor }} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-sm font-semibold truncate" style={{ color: '#111827' }}>
                    {activity.contactName}
                  </span>
                  <span style={{ color: '#D1D5DB' }}>•</span>
                  <span className="text-xs truncate" style={{ color: '#9CA3AF' }}>
                    {activity.companyName}
                  </span>
                </div>
                <p className="text-xs mb-1 line-clamp-2 leading-relaxed" style={{ color: '#6B7280' }}>
                  {activity.description}
                </p>
                <div className="flex items-center gap-1 text-xs" style={{ color: '#9CA3AF' }}>
                  <Clock className="w-3 h-3 text-gray-400" />
                  <span>{activity.timeAgo}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
