"use client";

import { useState, useEffect, useCallback, useMemo, startTransition } from 'react';
import type { Task, FilterState, TaskType, SortOption, GroupByOption, StatusTab } from '../types/engage.types';
import * as engageService from '../services/engage.service';
import { useRole } from '@shared/hooks/useRole';

export function useEngage(initialAssigneeId?: string) {
  const { session, isManager } = useRole();
  const [teamMembers, setTeamMembers] = useState<{ id: string; name: string; role: string }[]>([]);

  // Dynamically resolve default assignee:
  const resolvedInitialId = useMemo(() => {
    return initialAssigneeId || session?.id || 'me';
  }, [initialAssigneeId, session?.id]);

  // Master Date (matches local time/Figma specs)
  const getTodayDateStr = () => new Date().toISOString().split('T')[0];
  const todayStr = getTodayDateStr();

  // Task lists and counters state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [groups, setGroups] = useState<{ groupLabel: string; count: number; tasks: Task[] }[]>([]);
  const [tabCounts, setTabCounts] = useState<Record<StatusTab, number>>({
    today: 0,
    inProgress: 0,
    upcoming: 0,
    completed: 0,
    snoozed: 0,
  });
  const [statusPills, setStatusPills] = useState({ atRisk: 0, dueToday: 0 });
  const [summary, setSummary] = useState({
    totalToday: 0,
    completedToday: 0,
    atRisk: 0,
    dueToday: 0,
    highPriorityRemaining: 0,
    completionPercentage: 0,
    headerAlert: '',
  });

  // Filter/Sort/Group States
  const [selectedUserId, setSelectedUserId] = useState<string>(resolvedInitialId);
  const [activeStatusTab, setActiveStatusTab] = useState<StatusTab>('today');
  const [activeChannel, setActiveChannel] = useState<TaskType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [groupBy, setGroupBy] = useState<GroupByOption>('none');
  const [sortBy, setSortBy] = useState<SortOption>('due_date');
  const [appliedFilters, setAppliedFilters] = useState<FilterState | null>(null);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  // Modal / Drawer Overlay States
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isReassignModalOpen, setIsReassignModalOpen] = useState(false);
  const [isTakeActionDrawerOpen, setIsTakeActionDrawerOpen] = useState(false);
  const [focusedTask, setFocusedTask] = useState<Task | null>(null);
  const [activeComposerTask, setActiveComposerTask] = useState<Task | null>(null);
  const [activeLinkedInComposerTask, setActiveLinkedInComposerTask] = useState<Task | null>(null);

  // Toast Notifications State
  const [toasts, setToasts] = useState<{ id: string; type: 'success' | 'info' | 'warning' | 'error'; message: string }[]>([]);

  const showToast = useCallback((type: 'success' | 'info' | 'warning' | 'error', message: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, message }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  // Fetch data from service — always tries real API, falls back to mock on failure
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [tasksData, summaryData] = await Promise.all([
        engageService.fetchTasks({
          assigneeId: selectedUserId,
          date: todayStr,
          tab: activeStatusTab,
          channel: activeChannel,
          search: searchQuery,
          groupBy,
          sortBy,
          filters: appliedFilters,
        }),
        engageService.fetchSummary(selectedUserId, todayStr),
      ]);

      startTransition(() => {
        setGroups(tasksData.groups);
        const tCounts = tasksData.tabCounts || {};
        setTabCounts({
          today: tCounts.today || 0,
          inProgress: tCounts.inProgress || 0,
          upcoming: tCounts.upcoming || 0,
          completed: tCounts.completed || 0,
          snoozed: (tCounts as any).snooze || (tCounts as any).snoozed || 0,
        });
        setStatusPills(tasksData.statusPills || { atRisk: 0, dueToday: 0 });
        setSummary(summaryData || {
          totalToday: 0,
          completedToday: 0,
          atRisk: 0,
          dueToday: 0,
          highPriorityRemaining: 0,
          completionPercentage: 0,
          headerAlert: '',
        });
        const flatTasks: Task[] = [];
        tasksData.groups.forEach(g => flatTasks.push(...g.tasks));
        setTasks(flatTasks);
        setIsLoading(false);
      });
    } catch (e) {
      showToast('error', 'Failed to retrieve engagement tasks');
      setIsLoading(false);
    }
  }, [selectedUserId, activeStatusTab, activeChannel, searchQuery, groupBy, sortBy, appliedFilters, todayStr, showToast]);

  // Load team members on mount
  useEffect(() => {
    async function getMembers() {
      try {
        const members = await engageService.fetchTeamMembers();
        if (members && members.length > 0) {
          setTeamMembers(members);
        }
      } catch (e) {
        console.error('Failed to load team members:', e);
      }
    }
    getMembers();
  }, []);

  // Keep selected user ID in sync if resolved initial ID changes
  useEffect(() => {
    setSelectedUserId(resolvedInitialId);
  }, [resolvedInitialId]);

  // Trigger reloading on state transitions
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Actions
  const handleCreateTask = useCallback(async (body: {
    taskType: string;
    title: string;
    linkedToId: string;
    linkedToType: string;
    dueDate: string;
    dueTime: string;
    description?: string;
    assigneeId?: string;
  }) => {
    try {
      await engageService.createTask(body);
      showToast('success', 'Task created successfully');
      setIsCreateModalOpen(false);
      loadData();
    } catch (e) {
      showToast('error', 'Failed to save task');
    }
  }, [loadData, showToast]);

  const handleReassignTask = useCallback(async (
    taskId: string,
    newAssigneeId: string,
    scope: 'this_task_only' | 'this_and_future_tasks',
    reason?: string
  ) => {
    try {
      const res = await engageService.reassignTask(taskId, { newAssigneeId, scope, reason });
      const scopeText = scope === 'this_and_future_tasks' ? ' and all future tasks for this contact' : '';
      showToast('success', `Task${scopeText} reassigned to ${res.assigneeName}`);
      setIsReassignModalOpen(false);
      setFocusedTask(null);
      loadData();
    } catch (e) {
      showToast('error', 'Reassignment failed');
    }
  }, [loadData, showToast]);

  const handleSaveNotes = useCallback(async (taskId: string, notes: string) => {
    try {
      await engageService.saveTaskNotes(taskId, notes);
      showToast('success', 'Notes saved successfully');
      loadData();
    } catch (e) {
      showToast('error', 'Failed to save notes');
    }
  }, [loadData, showToast]);

  const handleSendEmail = useCallback(async (
    taskId: string,
    body: { to: string; from: string; subject: string; body: string; notes?: string }
  ) => {
    try {
      await engageService.sendEmail(taskId, body);
      showToast('success', 'Email sent successfully');
      setActiveComposerTask(null);
      loadData();
    } catch (e) {
      showToast('error', 'Failed to send email');
    }
  }, [loadData, showToast]);

  const handleSaveEmailDraft = useCallback(async (
    taskId: string,
    body: { to: string; from: string; subject: string; body: string }
  ) => {
    try {
      await engageService.saveEmailDraft(taskId, body);
      showToast('success', 'Draft email saved successfully');
      setActiveComposerTask(null);
      loadData();
    } catch (e) {
      showToast('error', 'Failed to save draft');
    }
  }, [loadData, showToast]);

  const handleMarkComplete = useCallback(async (taskId: string, notes?: string) => {
    try {
      await engageService.markTaskComplete(taskId, notes);
      showToast('success', 'Task marked as completed');
      setIsTakeActionDrawerOpen(false);
      setActiveLinkedInComposerTask(null);
      setFocusedTask(null);
      loadData();
    } catch (e) {
      showToast('error', 'Failed to complete task');
    }
  }, [loadData, showToast]);

  const handleSkipTask = useCallback(async (taskId: string) => {
    try {
      await engageService.skipTask(taskId);
      showToast('success', 'Task skipped');
      setIsTakeActionDrawerOpen(false);
      setActiveComposerTask(null);
      setActiveLinkedInComposerTask(null);
      setFocusedTask(null);
      loadData();
    } catch (e) {
      showToast('error', 'Failed to skip task');
    }
  }, [loadData, showToast]);

  const handleDismissTask = useCallback(async (taskId: string) => {
    try {
      await engageService.dismissTask(taskId);
      showToast('success', 'Task dismissed');
      setIsTakeActionDrawerOpen(false);
      setActiveComposerTask(null);
      setActiveLinkedInComposerTask(null);
      setFocusedTask(null);
      loadData();
    } catch (e) {
      showToast('error', 'Failed to dismiss task');
    }
  }, [loadData, showToast]);

  const handleSnoozeTask = useCallback(async (taskId: string, snoozedUntil: string) => {
    try {
      await engageService.snoozeTask(taskId, snoozedUntil);
      showToast('success', 'Task snoozed successfully');
      setIsTakeActionDrawerOpen(false);
      setFocusedTask(null);
      loadData();
    } catch (e) {
      showToast('error', 'Snooze failed');
    }
  }, [loadData, showToast]);

  const handleApplyFilters = useCallback((filters: FilterState) => {
    setAppliedFilters(filters);
    setIsFilterDrawerOpen(false);
    showToast('success', 'Filters applied');
  }, [showToast]);

  const handleClearFilters = useCallback(() => {
    setAppliedFilters(null);
    setActiveChannel('all');
    setSearchQuery('');
    showToast('info', 'All filters cleared');
  }, [showToast]);

  const handleRemoveFilter = useCallback((filterType: string, value?: string) => {
    if (!appliedFilters) return;

    const next = { ...appliedFilters };
    switch (filterType) {
      case 'dueDate':
        next.dueDate = null;
        break;
      case 'todoType':
        if (value) {
          next.todoTypes = new Set(next.todoTypes);
          next.todoTypes.delete(value as any);
        }
        break;
      case 'flowName':
        if (value) {
          next.flowNames = new Set(next.flowNames);
          next.flowNames.delete(value);
        }
        break;
      case 'entityType':
        if (value) {
          next.entityTypes = new Set(next.entityTypes);
          next.entityTypes.delete(value as any);
        }
        break;
      case 'localTime':
        next.localTime = null;
        break;
    }
    setAppliedFilters(next);
  }, [appliedFilters]);

  const toggleGroup = useCallback((groupKey: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupKey)) {
        next.delete(groupKey);
      } else {
        next.add(groupKey);
      }
      return next;
    });
  }, []);

  const openTakeAction = useCallback(async (task: Task) => {
    setFocusedTask(task);
    setActiveComposerTask(null);
    setActiveLinkedInComposerTask(null);
    setIsTakeActionDrawerOpen(true);
  }, []);

  // Filter Count
  const filterCount = useMemo(() => {
    if (!appliedFilters) return 0;
    return (
      (appliedFilters.dueDate ? 1 : 0) +
      appliedFilters.todoTypes.size +
      appliedFilters.flowNames.size +
      appliedFilters.entityTypes.size +
      (appliedFilters.localTime ? 1 : 0)
    );
  }, [appliedFilters]);

  // Empty state calculations
  const isEmpty = groups.length === 0 || groups.every(g => g.tasks.length === 0);
  const emptyStateReason = useMemo(() => {
    if (!isEmpty) return null;
    if (searchQuery.trim()) return 'no-results' as const;
    if (activeChannel !== 'all' || appliedFilters) return 'no-matches' as const;
    return 'no-tasks' as const;
  }, [isEmpty, searchQuery, activeChannel, appliedFilters]);

  return {
    // Data
    tasks,
    groups,
    tabCounts,
    statusPills,
    summary,
    teamMembers,
    
    // States
    selectedUserId,
    activeStatusTab,
    activeChannel,
    searchQuery,
    groupBy,
    sortBy,
    appliedFilters,
    collapsedGroups,
    isLoading,
    
    // Overlays
    isFilterDrawerOpen,
    isCreateModalOpen,
    isReassignModalOpen,
    isTakeActionDrawerOpen,
    focusedTask,
    activeComposerTask,
    activeLinkedInComposerTask,
    
    // Actions
    setSelectedUserId,
    setActiveStatusTab,
    setActiveChannel,
    setSearchQuery,
    setGroupBy,
    setSortBy,
    setIsFilterDrawerOpen,
    setIsCreateModalOpen,
    setIsReassignModalOpen,
    setIsTakeActionDrawerOpen,
    setFocusedTask,
    setActiveComposerTask,
    setActiveLinkedInComposerTask,
    
    // Operations
    handleCreateTask,
    handleReassignTask,
    handleSaveNotes,
    handleSendEmail,
    handleSaveEmailDraft,
    handleMarkComplete,
    handleSkipTask,
    handleDismissTask,
    handleSnoozeTask,
    handleApplyFilters,
    handleClearFilters,
    handleRemoveFilter,
    toggleGroup,
    openTakeAction,
    
    // Toasts
    toasts,
    removeToast,
    showToast,
    
    // Computed
    filterCount,
    isEmpty,
    emptyStateReason,
  };
}
