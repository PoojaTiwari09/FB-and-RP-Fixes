"use client";

import { Mail, Phone, Clock, UserPlus, Flame, AlertCircle } from 'lucide-react';
import type { Task } from '../types/engage.types';

function Linkedin({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

interface TaskCardProps {
  task: Task;
  onTakeAction: (task: Task) => void;
  onReassign: (task: Task) => void;
  isReadOnly?: boolean;
}

export default function TaskCard({ task, onTakeAction, onReassign, isReadOnly = false }: TaskCardProps) {
  const isCompleted = task.status === 'completed';

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'email':
        return Mail;
      case 'call':
        return Phone;
      case 'linkedin':
        return Linkedin;
      default:
        return Flame;
    }
  };

  const IconComponent = getChannelIcon(task.channel);

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-4 border-l-[#EF4444]';
      case 'normal':
      case 'medium':
        return 'border-l-4 border-l-[#F59E0B]';
      default:
        return 'border-l-4 border-l-gray-300';
    }
  };

  return (
    <div
      className={`bg-white rounded-xl border border-gray-200/90 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between p-5 gap-4 relative overflow-hidden ${getPriorityStyle(
        task.priority
      )} ${isCompleted ? 'opacity-60' : ''}`}
    >
      {/* Left side details */}
      <div className="flex-1 flex items-start gap-4">
        {/* Channel Icon Badge (Circular) */}
        <div className="p-3 rounded-full border border-gray-100 bg-gray-50 flex items-center justify-center text-gray-500 shrink-0">
          <IconComponent className="w-4.5 h-4.5" />
        </div>

        {/* Core content */}
        <div className="space-y-1">
          {/* Header row: Contact Name */}
          <h3
            onClick={() => !isReadOnly && onTakeAction(task)}
            className={`text-[15px] font-bold text-gray-900 leading-snug cursor-pointer hover:text-blue-600 transition-colors ${
              isCompleted ? 'line-through text-gray-400' : ''
            }`}
          >
            {task.contactName}
          </h3>

          {/* Subtitle row: Company · Flow Step · Due Time */}
          <p className="text-xs font-semibold text-gray-500">
            <span>{task.companyName}</span>
            {task.workflowName && (
              <>
                <span className="mx-1.5 text-gray-300">·</span>
                <span>{task.workflowName} (Step {task.workflowStep})</span>
              </>
            )}
            {task.scheduledTime && (
              <>
                <span className="mx-1.5 text-gray-300">·</span>
                <span>{task.scheduledTime}</span>
              </>
            )}
          </p>

          {/* Metadata bottom row */}
          <div className="flex flex-wrap items-center gap-3.5 pt-0.5 text-[11px] font-semibold text-gray-500">
            <div className="flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-gray-400" />
              <span>{task.interactionCount} interactions</span>
            </div>

            <span className="text-gray-300">•</span>

            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-gray-400" />
              <span>Due: {task.dueDateTime}</span>
            </div>

            {task.isOverdue && !isCompleted && (
              <>
                <span className="text-gray-300">•</span>
                <span className="inline-flex items-center gap-0.5 text-[#EF4444] font-bold">
                  <AlertCircle className="w-3 h-3 fill-[#EF4444]/10 shrink-0" />
                  <span>Overdue</span>
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Right side actions */}
      <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
        {isCompleted ? (
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-100 px-3.5 py-2 rounded-xl">
            <span>Completed</span>
          </div>
        ) : (
          <>
            {/* Reassign Button */}
            <button
              onClick={() => onReassign(task)}
              disabled={isReadOnly}
              className={`inline-flex items-center gap-1 px-4.5 py-2 border border-gray-200 bg-white hover:bg-[#0F172A] hover:text-white hover:border-[#0F172A] text-gray-700 rounded-xl text-xs font-bold transition-all duration-200 shadow-sm ${
                isReadOnly ? 'cursor-not-allowed opacity-50' : ''
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Reassign</span>
            </button>

            {/* Take Action Button */}
            <button
              onClick={() => onTakeAction(task)}
              disabled={isReadOnly}
              className={`inline-flex items-center justify-center px-4.5 py-2 border border-gray-200 bg-white hover:bg-[#0F172A] hover:text-white hover:border-[#0F172A] text-gray-700 rounded-xl text-xs font-bold transition-all duration-200 shadow-sm ${
                isReadOnly ? 'cursor-not-allowed opacity-50 bg-gray-150' : ''
              }`}
            >
              <span>Take Action</span>
            </button>
          </>
        )}
      </div>
    </div>
  );
}
