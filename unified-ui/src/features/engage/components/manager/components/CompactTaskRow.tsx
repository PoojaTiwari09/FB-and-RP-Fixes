"use client";

import { Phone, Mail, Clock, Flame, UserPlus, Timer, CheckCircle2 } from 'lucide-react';
import type { Task } from '../types/engage.types';

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


interface CompactTaskRowProps {
  task: Task;
  onClick: () => void;
  isViewOnly?: boolean;
  onReassignClick?: (task: Task) => void;
}

const channelIcons = {
  call: Phone,
  email: Mail,
  linkedin: LinkedinIcon,
  custom: CheckCircle2,
};

export default function CompactTaskRow({
  task,
  onClick,
  isViewOnly = false,
  onReassignClick,
}: CompactTaskRowProps) {
  const ChannelIcon = channelIcons[task.channel] || CheckCircle2;
  const isCompleted = task.status === 'completed';
  const showHighPriority = task.priority === 'high';
  const showInProgress = task.status === 'in_progress' && !showHighPriority;

  // Determine border color based on priority/status
  let borderColor = 'transparent';
  if (task.isOverdue || showHighPriority) {
    borderColor = '#DC2626'; // Red for high priority/overdue
  } else if (showInProgress) {
    borderColor = '#F59E0B'; // Yellow for in-progress
  }

  const formatDueDate = () => {
    if (!task.dueDate) {
      return task.dueTime ? `Due: ${task.dueTime}` : 'No due date';
    }

    const taskDate = new Date(task.dueDate);
    if (isNaN(taskDate.getTime())) {
      return task.dueTime ? `Due: ${task.dueTime}` : 'No due date';
    }

    const today = new Date().toDateString();
    const taskDateString = taskDate.toDateString();

    if (today === taskDateString) {
      return `Due: Today, ${task.dueTime}`;
    }

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (tomorrow.toDateString() === taskDateString) {
      return `Due: Tomorrow, ${task.dueTime}`;
    }

    return `Due: ${taskDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}, ${task.dueTime}`;
  };

  const hasHighEngagement = task.interactionCount >= 5;

  const handleContactClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Action if needed
  };

  return (
    <div
      onClick={onClick}
      className="group flex items-center gap-6 px-4 py-3 cursor-pointer relative"
      style={{
        borderBottom: '1px solid #F3F4F6',
        backgroundColor: '#FFFFFF',
        minHeight: '72px',
        transition: 'background-color 0.15s ease, box-shadow 0.15s ease',
        borderLeft: `3px solid ${borderColor}`,
        opacity: isCompleted ? 0.5 : 1,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = '#FAFAFA';
        e.currentTarget.style.boxShadow = '0 1px 2px rgba(0, 0, 0, 0.03)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = '#FFFFFF';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* LEFT ZONE - Icon */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="flex-shrink-0">
          <ChannelIcon className="w-4 h-4 text-gray-400" />
        </div>
      </div>

      {/* CENTER ZONE - Flexible Content */}
      <div className="flex-1 min-w-0">
        {/* Line 1: Contact/Lead Name with In-Progress Icon */}
        <div className="mb-1 flex items-center gap-1.5">
          {showInProgress && (
            <Timer className="w-3.5 h-3.5 flex-shrink-0 text-amber-500" />
          )}
          <button
            onClick={handleContactClick}
            className="font-semibold hover:underline transition-colors text-left truncate max-w-fit"
            style={{
              color: isCompleted ? '#9CA3AF' : '#111827',
              fontSize: '14.5px',
              fontWeight: 600,
            }}
            title={task.contactName}
          >
            {task.contactName}
          </button>
        </div>

        {/* Line 2: Account, Flow, Local Time */}
        <div className="flex items-center gap-2.5 mb-1.5 overflow-hidden text-gray-500" style={{ fontSize: '12.5px' }}>
          <span className="truncate flex-shrink-0 opacity-85">
            {task.companyName}
          </span>

          {task.workflowName && (
            <>
              <span className="text-gray-300 opacity-60">•</span>
              <span className="truncate opacity-85" title={task.workflowName}>
                {task.workflowName}
                {task.workflowStep && ` (Step ${task.workflowStep})`}
              </span>
            </>
          )}

          {task.localTime && (
            <>
              <span className="text-gray-300 opacity-60">•</span>
              <span className="flex-shrink-0 hidden md:inline opacity-75">
                {task.localTime}
              </span>
            </>
          )}
        </div>

        {/* Line 3: Metadata - Engagement, Due Date, Status */}
        <div className="flex items-center gap-2.5 flex-wrap text-gray-500" style={{ fontSize: '11.5px' }}>
          {task.interactionCount > 0 && (
            <span
              className="inline-flex items-center gap-1 hidden sm:inline-flex"
              style={{
                color: hasHighEngagement ? '#111827' : '#6B7280',
                fontWeight: hasHighEngagement ? 600 : 500,
              }}
            >
              {task.interactionCount} interaction{task.interactionCount !== 1 ? 's' : ''}
            </span>
          )}

          {task.interactionCount > 0 && (
            <span className="text-gray-300">•</span>
          )}

          <span
            className="inline-flex items-center gap-1.5"
            style={{
              color: task.isOverdue ? '#DC2626' : '#6B7280',
              fontWeight: task.isOverdue ? 600 : 500,
            }}
          >
            <Clock className="w-3 h-3 text-gray-400" />
            {formatDueDate()}
          </span>

          {task.isOverdue && !isCompleted && (
            <>
              <span className="text-gray-300">•</span>
              <span
                style={{
                  color: '#DC2626',
                  fontSize: '11px',
                  fontWeight: 600,
                }}
              >
                Overdue
              </span>
            </>
          )}
        </div>
      </div>

      {/* RIGHT ZONE - Action Buttons */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {onReassignClick && !isCompleted && (
          <button
            className="inline-flex items-center gap-1.5 justify-center rounded-md text-sm font-medium whitespace-nowrap transition-all border border-gray-250 bg-white text-gray-600 px-3 py-1.5 hover:bg-[#111827] hover:text-white hover:border-[#111827]"
            onClick={(e) => {
              e.stopPropagation();
              onReassignClick(task);
            }}
          >
            <UserPlus className="w-3.5 h-3.5" />
            Reassign
          </button>
        )}

        {!isCompleted && (
          <button
            className="inline-flex items-center justify-center rounded-md text-xs font-semibold whitespace-nowrap border border-gray-250 bg-white text-gray-600 px-2.5 py-1.5 transition-all group-hover:bg-[#111827] group-hover:text-white group-hover:border-[#111827]"
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
          >
            View Details
          </button>
        )}

        {isCompleted && (
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-3.5 py-2 rounded-xl shrink-0">
            <span>Completed</span>
          </div>
        )}
      </div>
    </div>
  );
}
