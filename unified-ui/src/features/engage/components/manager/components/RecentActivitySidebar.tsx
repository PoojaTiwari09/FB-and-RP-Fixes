"use client";

import { Phone, Mail, Clock, MessageSquare } from 'lucide-react';

export interface RecentActivityItem {
  id: string;
  contactName: string;
  companyName: string;
  activityType: string;
  description: string;
  timeAgo: string;
}

interface RecentActivitySidebarProps {
  activities?: RecentActivityItem[];
}

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

export default function RecentActivitySidebar({ activities = [] }: RecentActivitySidebarProps) {
  return (
    <div
      className="rounded-lg p-3"
      style={{
        border: '1px solid #E5E7EB',
        backgroundColor: '#FFFFFF',
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-xs font-bold uppercase tracking-wide" style={{ color: '#6B7280' }}>
          Recent Activity
        </h3>
        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: '#F3F4F6', color: '#9CA3AF' }}>
          {activities.length}
        </span>
      </div>

      <div className="space-y-2">
        {activities.length === 0 ? (
          <p className="text-[11px]" style={{ color: '#9CA3AF' }}>
            No recent activity yet.
          </p>
        ) : (
          activities.slice(0, 5).map((activity) => {
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
                className="flex items-start gap-2 pb-2"
                style={{ borderBottom: '1px solid #F3F4F6' }}
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ backgroundColor: iconBg }}
                >
                  <Icon className="w-3 h-3" style={{ color: iconColor }} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 mb-0.5">
                    <span className="text-[11px] font-semibold truncate" style={{ color: '#111827' }}>
                      {activity.contactName}
                    </span>
                    <span style={{ color: '#E5E7EB', fontSize: '8px' }}>•</span>
                    <span className="text-[10px] truncate" style={{ color: '#9CA3AF' }}>
                      {activity.companyName}
                    </span>
                  </div>
                  <p className="text-[10px] mb-0.5 line-clamp-1 leading-tight" style={{ color: '#6B7280' }}>
                    {activity.description}
                  </p>
                  <div className="flex items-center gap-0.5 text-[9px]" style={{ color: '#9CA3AF' }}>
                    <Clock className="w-2.5 h-2.5 text-gray-400" />
                    <span>{activity.timeAgo}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
