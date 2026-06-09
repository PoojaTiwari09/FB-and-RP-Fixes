"use client";

import { ChevronDown, ChevronRight } from 'lucide-react';
import CompactTaskRow from './CompactTaskRow';
import EmptyState from './EmptyState';
import LoadingState from './LoadingState';
import type { Task, StatusTab, TaskType, GroupByOption } from '../types/engage.types';

interface TaskListProps {
  groups: { groupLabel: string; count: number; tasks: Task[] }[];
  collapsedGroups: Set<string>;
  toggleGroup: (groupKey: string) => void;
  onTakeAction: (task: Task) => void;
  onReassign: (task: Task) => void;
  isEmpty: boolean;
  emptyStateReason: 'no-results' | 'no-matches' | 'no-tasks' | null;
  activeChannel: TaskType;
  activeStatusTab: StatusTab;
  onClearFilters: () => void;
  isReadOnly?: boolean;
  isLoading?: boolean;
  groupBy?: GroupByOption;
}

export default function TaskList({
  groups,
  collapsedGroups,
  toggleGroup,
  onTakeAction,
  onReassign,
  isEmpty,
  emptyStateReason,
  activeChannel,
  activeStatusTab,
  onClearFilters,
  isReadOnly = false,
  isLoading = false,
  groupBy = 'none',
}: TaskListProps) {
  // Loading state
  if (isLoading) {
    return <LoadingState />;
  }

  // Empty state
  if (isEmpty && emptyStateReason) {
    return (
      <EmptyState
        reason={emptyStateReason}
        activeChannel={activeChannel}
        activeStatusTab={activeStatusTab}
        onClearFilters={onClearFilters}
      />
    );
  }

  // Render non-grouped view
  if (groupBy === 'none') {
    const highPriorityGroup = groups.find((g) => g.groupLabel === 'High Priority');
    const allTasksGroup = groups.find((g) => g.groupLabel === 'All Tasks');

    const highPriorityTasks = highPriorityGroup?.tasks || [];
    const allOtherTasks = allTasksGroup?.tasks || [];

    return (
      <div>
        {highPriorityTasks.length > 0 && renderSection('High Priority', highPriorityTasks)}
        {allOtherTasks.length > 0 && renderSection('All Tasks', allOtherTasks)}
      </div>
    );
  }

  // Render grouped view
  return (
    <div className="space-y-6">
      {groups.map((group) => {
        const isExpanded = !collapsedGroups.has(group.groupLabel);
        if (!group.tasks || group.tasks.length === 0) return null;

        return (
          <div key={group.groupLabel}>
            {/* Group Header */}
            <button
              onClick={() => toggleGroup(group.groupLabel)}
              className="w-full flex items-center gap-2 px-4 py-3 mb-2 rounded-lg transition-colors text-left"
              style={{
                backgroundColor: '#F9FAFB',
                border: '1px solid #E5E7EB',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#F3F4F6';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#F9FAFB';
              }}
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-500" />
              )}
              <h3 className="text-sm font-semibold text-gray-900">
                {group.groupLabel}
              </h3>
              <span className="text-xs font-medium text-gray-400">
                {group.tasks.length}
              </span>
            </button>

            {/* Group Tasks */}
            {isExpanded && (
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  overflow: 'hidden',
                }}
              >
                {group.tasks.map((task) => (
                  <CompactTaskRow
                    key={task.id}
                    task={task}
                    onClick={() => onTakeAction(task)}
                    isViewOnly={isReadOnly}
                    onReassignClick={onReassign}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  function renderSection(title: string, sectionTasks: Task[]) {
    if (sectionTasks.length === 0) return null;

    return (
      <div className="mb-6">
        {/* Section Header */}
        <div
          className="flex items-center gap-2 px-4 py-3 mb-0 rounded-t-lg border border-gray-200"
          style={{
            backgroundColor: '#F9FAFB',
            borderBottom: '1px solid #E5E7EB',
          }}
        >
          <h2 className="text-sm font-semibold text-gray-900">
            {title}
          </h2>
          <span
            className="text-xs font-medium px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: '#E5E7EB',
              color: '#6B7280',
            }}
          >
            {sectionTasks.length}
          </span>
        </div>

        {/* Section Tasks */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E5E7EB',
            borderTop: 'none',
            borderRadius: '0 0 8px 8px',
            overflow: 'hidden',
          }}
        >
          {sectionTasks.map((task) => (
            <CompactTaskRow
              key={task.id}
              task={task}
              onClick={() => onTakeAction(task)}
              isViewOnly={isReadOnly}
              onReassignClick={onReassign}
            />
          ))}
        </div>
      </div>
    );
  }
}
