"use client";
import { useEffect } from 'react';
import { useEngage } from './hooks/useEngage';
import CompactHeader from './components/CompactHeader';
import CompactFilters from './components/CompactFilters';
import TypeTabs from './components/TypeTabs';
import CompactProgress from './components/CompactProgress';
import TaskList from './components/TaskList';
import RecentActivitySidebar from './components/RecentActivitySidebar';
import ViewOnlyBanner from './components/ViewOnlyBanner';
import FilterDrawer from './components/FilterDrawer';
import CreateToDoModal from './components/CreateToDoModal';
import Toast from './components/Toast';
import ReassignTaskModal from './components/ReassignTaskModal';

// Manager specific workspace components
import CallWorkspace from './workspaces/CallWorkspace';
import EmailWorkspace from './workspaces/EmailWorkspace';
import LinkedInWorkspace from './workspaces/LinkedInWorkspace';
import CustomWorkspace from './workspaces/CustomWorkspace';

export default function EngageManagerView() {
  const {
    // Data
    groups,
    tabCounts,
    statusPills,
    summary,
    recentActivity,
    
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
    toggleGroup,
    openTakeAction,
    logActivity,
    
    // Toasts
    toasts,
    removeToast,
    
    // Computed
    filterCount,
    isEmpty,
    emptyStateReason,
  } = useEngage();

  // Activity tracking side-effects
  useEffect(() => {
    if (activeStatusTab) {
      logActivity(`Switched to ${activeStatusTab} tab`, 'Status', 'Navigation', 'system');
    }
  }, [activeStatusTab, logActivity]);

  useEffect(() => {
    if (activeChannel !== 'all') {
      logActivity(`Filtered by ${activeChannel} channel`, 'Channel', 'Filter', activeChannel);
    }
  }, [activeChannel, logActivity]);

  useEffect(() => {
    if (searchQuery) {
      logActivity(`Searched for "${searchQuery}"`, 'Search', 'Filter', 'system');
    }
  }, [searchQuery, logActivity]);

  const isReadOnly = selectedUserId !== 'me';

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden" style={{ backgroundColor: '#F9FAFB' }}>
      
      {/* Warning Banner for manager looking at teammate workspaces */}
      {isReadOnly && <ViewOnlyBanner selectedUserId={selectedUserId} />}

      {/* Header */}
      <div className="shrink-0">
      <CompactHeader
        headerAlert={summary.headerAlert}
        onCreateClick={() => {
          logActivity('Opened Create To-Do modal', 'Action', 'Manager', 'system');
          setIsCreateModalOpen(true);
        }}
        isLoading={isLoading}
        isViewOnly={isReadOnly}
      />

      {/* Search & Filters */}
      <CompactFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        groupBy={groupBy}
        onGroupByChange={(val) => {
          logActivity(`Changed grouping to ${val}`, 'View', 'Manager', 'system');
          setGroupBy(val);
        }}
        sortBy={sortBy}
        onSortByChange={(val) => {
          logActivity(`Changed sorting to ${val}`, 'View', 'Manager', 'system');
          setSortBy(val);
        }}
        selectedUserId={selectedUserId}
        onUserChange={(val) => {
          logActivity(`Viewing workspace for ${val}`, 'User', 'Navigation', 'system');
          setSelectedUserId(val);
        }}
        isManagerView={true}
        filterCount={filterCount}
        onFilterClick={() => {
          logActivity('Opened Filter drawer', 'Action', 'Manager', 'system');
          setIsFilterDrawerOpen(true);
        }}
        onClearFilters={() => {
          logActivity('Cleared all filters', 'Action', 'Manager', 'system');
          handleClearFilters();
        }}
      />

      {/* Status Tabs and Channels Selection */}
      <TypeTabs
        activeStatusTab={activeStatusTab}
        onStatusTabChange={setActiveStatusTab}
        tabCounts={tabCounts}
        activeChannel={activeChannel}
        onChannelChange={setActiveChannel}
        statusPills={statusPills}
      />
      </div>

      {/* Grid Content: scrollable task list + activity sidebar */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <div className="flex-1 min-w-0 overflow-y-auto px-6 py-6">
          <div className="max-w-[1200px] mx-auto w-full space-y-6">
            {activeStatusTab === 'today' && !isEmpty && (
              <CompactProgress
                completedCount={summary.completedToday}
                totalCount={summary.totalToday}
                remainingHighPriority={summary.highPriorityRemaining}
              />
            )}

            <TaskList
              groups={groups}
              collapsedGroups={collapsedGroups}
              toggleGroup={(val) => {
                logActivity(`${collapsedGroups.has(val) ? 'Expanded' : 'Collapsed'} group ${val}`, 'List', 'View', 'system');
                toggleGroup(val);
              }}
              onTakeAction={(task) => {
                logActivity(`Opened task: ${task.title}`, task.contactName, task.companyName, task.channel);
                openTakeAction(task);
              }}
              onReassign={(task) => {
                logActivity(`Started reassigning task: ${task.title}`, task.contactName, task.companyName, 'system');
                setFocusedTask(task);
                setIsReassignModalOpen(true);
              }}
              isEmpty={isEmpty}
              emptyStateReason={emptyStateReason}
              activeChannel={activeChannel}
              activeStatusTab={activeStatusTab}
              onClearFilters={handleClearFilters}
              isReadOnly={isReadOnly}
              isLoading={isLoading}
              groupBy={groupBy}
            />
          </div>
        </div>

        <div className="w-72 shrink-0 overflow-y-auto border-l border-gray-200 bg-white px-3 py-4 hidden lg:block">
          <RecentActivitySidebar activities={recentActivity} />
        </div>
      </div>

      {/* Overlays / Modals */}
      <FilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        onApply={(filters) => {
          logActivity('Applied filters', 'Action', 'Manager', 'system');
          handleApplyFilters(filters);
        }}
        initialFilters={appliedFilters}
      />

      <CreateToDoModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={(task) => {
          logActivity(`Created new task: ${task.title}`, 'Task', 'Manager', 'system');
          handleCreateTask(task);
        }}
      />

      {/* Generalized Reassign Modal */}
      {isReassignModalOpen && focusedTask && (
        <ReassignTaskModal
          isOpen={isReassignModalOpen}
          onClose={() => {
            setIsReassignModalOpen(false);
            setFocusedTask(null);
          }}
          taskTitle={focusedTask.title}
          contactName={focusedTask.contactName}
          currentAssignee={{
            id: focusedTask.assigneeId,
            name: focusedTask.assigneeName,
            role: focusedTask.assigneeRole,
          }}
          onReassign={(newAssigneeId, scope, reason) => {
            logActivity(`Reassigned task ${focusedTask.title} to ${newAssigneeId}`, focusedTask.contactName, focusedTask.companyName, 'system');
            handleReassignTask(focusedTask.id, newAssigneeId, scope, reason);
          }}
        />
      )}

      {/* Call & Custom/Manual Workspaces */}
      {isTakeActionDrawerOpen && focusedTask && (
        <>
          {focusedTask.channel === 'call' || focusedTask.channel === 'email' || focusedTask.channel === 'linkedin' ? (
            <CallWorkspace
              isOpen={isTakeActionDrawerOpen}
              onClose={() => {
                setIsTakeActionDrawerOpen(false);
                setFocusedTask(null);
              }}
              task={focusedTask}
              onSaveNotes={handleSaveNotes}
              onMarkComplete={handleMarkComplete}
              onSnooze={handleSnoozeTask}
              isViewOnly={isReadOnly}
            />
          ) : (
            <CustomWorkspace
              isOpen={isTakeActionDrawerOpen}
              onClose={() => {
                setIsTakeActionDrawerOpen(false);
                setFocusedTask(null);
              }}
              task={focusedTask}
              onSaveNotes={handleSaveNotes}
              onMarkComplete={handleMarkComplete}
              onSnooze={handleSnoozeTask}
              isViewOnly={isReadOnly}
            />
          )}
        </>
      )}

      {/* Email Workspace Review */}
      {activeComposerTask && (
        <EmailWorkspace
          isOpen={!!activeComposerTask}
          onClose={() => {
            setActiveComposerTask(null);
            setFocusedTask(activeComposerTask);
            setIsTakeActionDrawerOpen(true);
          }}
          task={activeComposerTask}
          onSend={(taskId, body) => {
            handleSendEmail(taskId, body);
            setActiveComposerTask(null);
            setFocusedTask(activeComposerTask);
            setIsTakeActionDrawerOpen(true);
          }}
          onSaveDraft={(taskId, body) => {
            handleSaveEmailDraft(taskId, body);
            setActiveComposerTask(null);
            setFocusedTask(activeComposerTask);
            setIsTakeActionDrawerOpen(true);
          }}
          onSkip={(taskId) => {
            handleSkipTask(taskId);
            setActiveComposerTask(null);
            setFocusedTask(activeComposerTask);
            setIsTakeActionDrawerOpen(true);
          }}
          onDismiss={(taskId) => {
            handleDismissTask(taskId);
            setActiveComposerTask(null);
            setFocusedTask(activeComposerTask);
            setIsTakeActionDrawerOpen(true);
          }}
          isViewOnly={isReadOnly}
        />
      )}

      {/* LinkedIn Workspace Review */}
      {activeLinkedInComposerTask && (
        <LinkedInWorkspace
          isOpen={!!activeLinkedInComposerTask}
          onClose={() => {
            const task = activeLinkedInComposerTask;
            setActiveLinkedInComposerTask(null);
            setFocusedTask(task);
            setIsTakeActionDrawerOpen(true);
          }}
          task={activeLinkedInComposerTask}
          onMarkComplete={(taskId) => {
            handleMarkComplete(taskId);
            const task = activeLinkedInComposerTask;
            setActiveLinkedInComposerTask(null);
            setFocusedTask(task);
            setIsTakeActionDrawerOpen(true);
          }}
          onSkip={(taskId) => {
            handleSkipTask(taskId);
            const task = activeLinkedInComposerTask;
            setActiveLinkedInComposerTask(null);
            setFocusedTask(task);
            setIsTakeActionDrawerOpen(true);
          }}
          onDismiss={(taskId) => {
            handleDismissTask(taskId);
            const task = activeLinkedInComposerTask;
            setActiveLinkedInComposerTask(null);
            setFocusedTask(task);
            setIsTakeActionDrawerOpen(true);
          }}
          isViewOnly={isReadOnly}
        />
      )}

      {/* Toast Alert Notifications */}
      <Toast toasts={toasts} onRemove={removeToast} />
    </div>
  );
}
