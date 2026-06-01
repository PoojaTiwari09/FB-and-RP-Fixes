"use client";

import { ClipboardList, ArrowRight, Plus } from 'lucide-react';
import type { StatusTab, TaskType } from '../types/engage.types';

interface EmptyStateProps {
  reason: 'no-results' | 'no-matches' | 'no-tasks';
  activeChannel: TaskType;
  activeStatusTab: StatusTab;
  onClearFilters: () => void;
  onCreateTodo?: () => void;
}

export default function EmptyState({
  reason,
  onClearFilters,
  onCreateTodo,
}: EmptyStateProps) {
  if (reason === 'no-tasks') {
    return (
      <div className="flex flex-col items-center justify-center py-24 px-6 animate-in fade-in duration-300">
        <div className="max-w-md text-center">
          {/* Celebration Icon */}
          <div className="mb-4">
            <span className="text-5xl">🎉</span>
          </div>

          {/* Primary Text */}
          <h3 className="text-lg font-semibold mb-2" style={{ color: '#111827' }}>
            All done for today!
          </h3>

          {/* Subtext */}
          <p className="text-sm mb-6" style={{ color: '#6B7280' }}>
            Great work! You've completed all your tasks.
          </p>

          {/* Optional CTA */}
          {onClearFilters && (
            <button
              onClick={onClearFilters}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors"
              style={{
                border: '1px solid #E5E7EB',
                backgroundColor: '#FFFFFF',
                color: '#111827',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#F9FAFB';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#FFFFFF';
              }}
            >
              Reset Filters
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // Empty/Filtered State
  return (
    <div className="flex flex-col items-center justify-center py-24 px-6 animate-in fade-in duration-300">
      <div className="max-w-md text-center">
        {/* Illustration */}
        <div
          className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center"
          style={{ backgroundColor: '#F3F4F6' }}
        >
          <ClipboardList className="w-12 h-12 text-gray-400" />
        </div>

        {/* Primary Text */}
        <h3 className="text-lg font-semibold mb-2" style={{ color: '#111827' }}>
          No to-dos for this view
        </h3>

        {/* Subtext */}
        <p className="text-sm mb-6" style={{ color: '#6B7280' }}>
          Try adjusting your filters or create a new task.
        </p>

        {/* Create Button */}
        {onCreateTodo ? (
          <button
            onClick={onCreateTodo}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors"
            style={{
              border: '1px solid #E5E7EB',
              backgroundColor: '#FFFFFF',
              color: '#111827',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#F9FAFB';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#FFFFFF';
            }}
          >
            <Plus className="w-4 h-4" />
            Create To-Do
          </button>
        ) : (
          <button
            onClick={onClearFilters}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors"
            style={{
              border: '1px solid #E5E7EB',
              backgroundColor: '#FFFFFF',
              color: '#111827',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#F9FAFB';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#FFFFFF';
            }}
          >
            Reset Filters
          </button>
        )}
      </div>
    </div>
  );
}
