'use client';

import { useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Task } from './types/engage.types';
import { MOCK_TASK_DETAILS } from './mocks/engage.mock';

interface QueueModeProps {
  tasks: Task[];
  onClose: () => void;
  onQueueComplete: (completedTaskIds: string[]) => void;
}

export default function QueueMode({ tasks, onClose, onQueueComplete }: QueueModeProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completedIds, setCompletedIds] = useState<string[]>([]);

  const currentTask = tasks[currentIndex];
  const detail = currentTask ? MOCK_TASK_DETAILS[currentTask.taskId] : undefined;

  const handleMarkComplete = () => {
    if (!currentTask) return;
    const updated = [...completedIds, currentTask.taskId];
    setCompletedIds(updated);

    if (currentIndex < tasks.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      onQueueComplete(updated);
    }
  };

  const handleSkip = () => {
    if (currentIndex < tasks.length - 1) {
      setCurrentIndex((i) => i + 1);
    }
  };

  const formattedDue = currentTask
    ? new Date(currentTask.dueDateTime).toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

  if (!currentTask) return null;

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 cursor-pointer transition-colors"
          >
            <X size={18} />
          </button>
          <div>
            <p className="text-sm font-semibold text-gray-900">Queue Mode</p>
            <p className="text-xs text-gray-400">Complete tasks one by one</p>
          </div>
        </div>

        {/* Navigator */}
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <button
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            disabled={currentIndex === 0}
            className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 cursor-pointer transition-colors"
          >
            <ChevronLeft size={14} />
          </button>
          <span className="font-medium text-gray-700">
            Task {currentIndex + 1} of {tasks.length}
          </span>
          <button
            onClick={() => setCurrentIndex((i) => Math.min(tasks.length - 1, i + 1))}
            disabled={currentIndex === tasks.length - 1}
            className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 cursor-pointer transition-colors"
          >
            <ChevronRight size={14} />
          </button>
        </div>

        <p className="text-sm text-gray-400">
          {completedIds.length} completed
        </p>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-gray-100">
        <div
          className="h-full bg-purple-500 transition-all duration-500"
          style={{ width: `${(completedIds.length / tasks.length) * 100}%` }}
        />
      </div>

      {/* Content — centered */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="text-center max-w-sm w-full">
          {/* Task title */}
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            {detail?.taskTitle ?? currentTask.company}
          </h2>
          <p className="text-sm text-gray-500 mb-1">
            {currentTask.contactName} &middot; {currentTask.company}
          </p>
          <p className="text-xs text-gray-400 mb-8">Due: {formattedDue}</p>

          {/* Actions */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={handleSkip}
              disabled={currentIndex === tasks.length - 1 && completedIds.length < tasks.length}
              className="text-sm font-medium text-gray-600 border border-gray-200 rounded-lg px-7 py-2.5 hover:bg-gray-50 disabled:opacity-40 cursor-pointer transition-colors"
            >
              Skip
            </button>
            <button
              onClick={handleMarkComplete}
              className="text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg px-7 py-2.5 cursor-pointer transition-colors"
            >
              Mark Complete
            </button>
          </div>

          {/* Remaining tasks hint */}
          <p className="text-xs text-gray-400 mt-6">
            {tasks.length - currentIndex - 1} task{tasks.length - currentIndex - 1 !== 1 ? 's' : ''} remaining
          </p>
        </div>
      </div>
    </div>
  );
}
