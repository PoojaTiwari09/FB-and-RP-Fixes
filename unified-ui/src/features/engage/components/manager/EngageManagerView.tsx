"use client";

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
    
    // Toasts
    toasts,
    removeToast,
    
    // Computed
    filterCount,
    isEmpty,
    emptyStateReason,
  } = useEngage();

  const isReadOnly = selectedUserId !== 'me';

  return (
    <div className="flex-1 flex flex-col min-w-0" style={{ backgroundColor: '#F9FAFB' }}>
      
      {/* Warning Banner for manager looking at teammate workspaces */}
      {isReadOnly && <ViewOnlyBanner selectedUserId={selectedUserId} />}

      {/* Header */}
      <CompactHeader
        headerAlert={summary.headerAlert}
        onCreateClick={() => setIsCreateModalOpen(true)}
        isLoading={isLoading}
        isViewOnly={isReadOnly}
      />

      {/* Search & Filters */}
      <CompactFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        groupBy={groupBy}
        onGroupByChange={setGroupBy}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        selectedUserId={selectedUserId}
        onUserChange={setSelectedUserId}
        isManagerView={true}
        filterCount={filterCount}
        onFilterClick={() => setIsFilterDrawerOpen(true)}
        onClearFilters={handleClearFilters}
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

      {/* Grid Content: 8 Column Tasks + 4 Column Activity */}
      <div className="max-w-[1800px] mx-auto px-6 py-6 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Tasks */}
          <div className="lg:col-span-8">
            {/* Progress - Only on Today tab */}
            {activeStatusTab === 'today' && !isEmpty && (
              <CompactProgress
                completedCount={summary.completedToday}
                totalCount={summary.totalToday}
                remainingHighPriority={summary.highPriorityRemaining}
              />
            )}

            {/* Task Lists */}
            <TaskList
              groups={groups}
              collapsedGroups={collapsedGroups}
              toggleGroup={toggleGroup}
              onTakeAction={openTakeAction}
              onReassign={(task) => {
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

          {/* Right Column: Recent Activity */}
          <div className="lg:col-span-4">
            <RecentActivitySidebar />
          </div>
        </div>
      </div>

      {/* Overlays / Modals */}
      <FilterDrawer
        isOpen={isFilterDrawerOpen}
        onClose={() => setIsFilterDrawerOpen(false)}
        onApply={handleApplyFilters}
        initialFilters={appliedFilters}
      />

      <CreateToDoModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSave={handleCreateTask}
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
          onReassign={(newAssigneeId, scope, reason) =>
            handleReassignTask(focusedTask.id, newAssigneeId, scope, reason)
          }
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
