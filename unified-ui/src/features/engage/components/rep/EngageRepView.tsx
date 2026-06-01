'use client';

import { useState, useMemo } from 'react';
import {
  Phone, Mail, MessageSquare, Zap,
  Filter, Search, Plus, ChevronDown,
  AlertCircle, Clock, Flame,
} from 'lucide-react';
import type { Task, TabStatus, ChannelType, RecentActivity } from './types/engage.types';
import { MOCK_TASKS, MOCK_TASK_SUMMARY, MOCK_RECENT_ACTIVITY, MOCK_CONTACT_DETAILS } from './mocks/engage.mock';
import TakeActionDrawer from './TakeActionDrawer';
import EmailTaskScreen from './EmailTaskScreen';
import LinkedInTaskScreen from './LinkedInTaskScreen';
import BulkActionBar from './BulkActionBar';
import QueueMode from './QueueMode';
import FilterPanel from './FilterPanel';
import CreateTaskModal from './CreateTaskModal';

// ─── Tokens ───────────────────────────────────────────────────────────────────

const C = {
  white:       '#FFFFFF',
  pageBg:      '#F9FAFB',
  border:      '#E5E7EB',
  borderHover: '#D1D5DB',
  subtleBg:    '#F3F4F6',
  darkText:    '#111827',
  grayText:    '#6B7280',
  lightGray:   '#9CA3AF',
  primary:     '#7C3AED',
  primaryBg:   '#F5F3FF',
  primaryBd:   '#EDE9FE',
};

type ChannelFilter = ChannelType | 'ALL';

const CH: Record<ChannelType, { color: string; label: string }> = {
  CALL:     { color: '#059669', label: 'Call'     },
  EMAIL:    { color: '#2563EB', label: 'Email'    },
  LINKEDIN: { color: '#0EA5E9', label: 'LinkedIn' },
  CUSTOM:   { color: '#D97706', label: 'Custom'   },
};

function LinkedInIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  );
}

function channelIcon(type: ChannelType, size = 13): React.ReactNode {
  if (type === 'CALL')  return <Phone size={size} />;
  if (type === 'EMAIL') return <Mail  size={size} />;
  return <LinkedInIcon size={size} />;  // LINKEDIN and CUSTOM both show LinkedIn icon
}

const TABS: { id: TabStatus; label: string }[] = [
  { id: 'TODAY',       label: 'Today'       },
  { id: 'IN_PROGRESS', label: 'In Progress' },
  { id: 'UPCOMING',    label: 'Upcoming'    },
  { id: 'COMPLETED',   label: 'Completed'   },
];

const CHIP_FILTERS: { id: ChannelFilter; label: string; type?: ChannelType }[] = [
  { id: 'ALL',      label: 'All'      },
  { id: 'EMAIL',    label: 'Email',    type: 'EMAIL'    },
  { id: 'CALL',     label: 'Call',     type: 'CALL'     },
  { id: 'LINKEDIN', label: 'LinkedIn', type: 'LINKEDIN' },
];

// ─── Task card ────────────────────────────────────────────────────────────────

interface TaskCardProps {
  task:           Task;
  isSelected:     boolean;
  isCompleted:    boolean;
  isActive:       boolean;
  onToggleSelect: (id: string) => void;
  onTakeAction:   (task: Task) => void;
  onEmail:        (task: Task) => void;
  onLinkedIn:     (task: Task) => void;
}

function TaskCard({ task, isSelected, isCompleted, isActive, onToggleSelect, onTakeAction, onEmail, onLinkedIn }: TaskCardProps) {
  const [hv,      setHv]      = useState(false);
  const [emailHv, setEmailHv] = useState(false);
  const [liHv,    setLiHv]    = useState(false);

  const contact = MOCK_CONTACT_DETAILS[task.contactId];
  const due = new Date(task.dueDateTime);
  const dueStr =
    due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
    ', ' +
    due.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

  const metaLine = [
    task.company,
    task.sequenceName ? `${task.sequenceName} (${task.sequenceStep})` : null,
    task.scheduledTime ? `${task.scheduledTime} (PST)` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  const isHighPriority = task.priority === 'HIGH';

  return (
    <div
      className="flex items-stretch overflow-hidden"
      onMouseEnter={() => setHv(true)}
      onMouseLeave={() => setHv(false)}
      style={{
        border:          `1px solid ${isActive ? C.primaryBd : hv ? C.borderHover : C.border}`,
        borderRadius:    '10px',
        boxShadow:       isActive ? `0 0 0 3px rgba(124,58,237,0.1)` : hv ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
        opacity:         isCompleted ? 0.5 : 1,
        backgroundColor: C.white,
        transition:      'all 0.12s ease',
      }}
    >
      {/* Left priority bar */}
      <div style={{ width: 3, flexShrink: 0, backgroundColor: isHighPriority ? '#EF4444' : 'transparent', borderRadius: '10px 0 0 10px' }} />

      {/* Body */}
      <div className="flex items-start gap-3 px-4 py-3 flex-1 min-w-0">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onToggleSelect(task.taskId)}
          className="cursor-pointer flex-shrink-0"
          style={{ accentColor: C.primary, marginTop: 3 }}
        />

        {/* Channel icon — flat, no circle */}
        <span className="flex-shrink-0" style={{ color: CH[task.channelType].color, marginTop: 2 }}>
          {channelIcon(task.channelType)}
        </span>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p
            className="text-sm font-semibold leading-snug"
            style={{ color: C.darkText, textDecoration: isCompleted ? 'line-through' : 'none' }}
          >
            {task.contactName}
          </p>
          <p className="text-xs mt-0.5 truncate" style={{ color: C.grayText }}>
            {metaLine}
          </p>
          <div className="flex items-center gap-1 mt-1.5 flex-wrap text-xs" style={{ color: C.lightGray }}>
            <Flame size={10} style={{ color: '#F97316', flexShrink: 0 }} />
            <span>{task.interactionCount} interactions</span>
            <span>&nbsp;·&nbsp;</span>
            <Clock size={10} style={{ flexShrink: 0, color: task.isOverdue ? '#DC2626' : C.lightGray }} />
            <span style={{ color: task.isOverdue ? '#DC2626' : C.lightGray }}>Due: {dueStr}</span>
            {task.isOverdue && (
              <span style={{ color: '#DC2626', fontWeight: 500 }}>&nbsp;· Overdue</span>
            )}
            {task.isAtRisk && !task.isOverdue && (
              <span style={{ color: '#D97706', fontWeight: 500 }}>&nbsp;· At Risk</span>
            )}
          </div>
        </div>

        {/* Channel-matched shortcuts: EMAIL→mail, LINKEDIN→linkedin, CUSTOM→both */}
        <div className="flex items-center gap-1 self-center flex-shrink-0">
          {task.channelType === 'EMAIL' && (
            <button
              onClick={e => { e.stopPropagation(); onEmail(task); }}
              onMouseEnter={() => setEmailHv(true)}
              onMouseLeave={() => setEmailHv(false)}
              disabled={isCompleted}
              className="flex items-center justify-center w-7 h-7 rounded-lg flex-shrink-0 cursor-pointer"
              style={{
                color:           emailHv ? '#2563EB' : C.grayText,
                border:          `1px solid ${emailHv ? '#BFDBFE' : C.border}`,
                backgroundColor: emailHv ? '#EFF6FF'  : C.white,
                transition:      'all 0.12s',
                opacity:         isCompleted ? 0.4 : 1,
              }}
              title={`Email ${task.contactName}`}
            >
              <Mail size={13} />
            </button>
          )}
          {(task.channelType === 'LINKEDIN' || task.channelType === 'CUSTOM') && (
            <button
              onClick={e => { e.stopPropagation(); onLinkedIn(task); }}
              onMouseEnter={() => setLiHv(true)}
              onMouseLeave={() => setLiHv(false)}
              disabled={isCompleted}
              className="flex items-center justify-center w-7 h-7 rounded-lg flex-shrink-0 cursor-pointer"
              style={{
                color:           liHv ? '#0077B5' : C.grayText,
                border:          `1px solid ${liHv ? '#BAE6FD' : C.border}`,
                backgroundColor: liHv ? '#F0F9FF'  : C.white,
                transition:      'all 0.12s',
                opacity:         isCompleted ? 0.4 : 1,
              }}
              title={`LinkedIn: ${task.contactName}`}
            >
              <LinkedInIcon size={13} />
            </button>
          )}
        </div>

        {/* Take Action — outlined ghost */}
        <TakeActionBtn onClick={() => onTakeAction(task)} disabled={isCompleted} isActive={isActive} />
      </div>
    </div>
  );
}

function TakeActionBtn({ onClick, disabled, isActive }: { onClick: () => void; disabled: boolean; isActive: boolean }) {
  const [hv, setHv] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHv(true)}
      onMouseLeave={() => setHv(false)}
      className="text-xs font-medium px-3 py-1.5 rounded-lg flex-shrink-0 self-center"
      style={{
        backgroundColor: isActive ? C.primaryBg : hv ? C.subtleBg : C.white,
        color:           isActive ? C.primary : C.darkText,
        border:          `1px solid ${isActive ? C.primaryBd : hv ? C.borderHover : C.border}`,
        opacity:         disabled ? 0.4 : 1,
        cursor:          disabled ? 'not-allowed' : 'pointer',
        transition:      'all 0.12s ease',
      }}
    >
      Take Action
    </button>
  );
}

// ─── Task group ───────────────────────────────────────────────────────────────

function TaskGroup({ label, count, tasks, selectedIds, completedIds, activeTaskId, onToggleSelect, onTakeAction, onEmail, onLinkedIn }: {
  label: string; count: number; tasks: Task[];
  selectedIds: string[]; completedIds: string[]; activeTaskId?: string;
  onToggleSelect: (id: string) => void;
  onTakeAction:   (task: Task) => void;
  onEmail:        (task: Task) => void;
  onLinkedIn:     (task: Task) => void;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <h3 className="text-sm font-semibold" style={{ color: C.darkText }}>{label}</h3>
        <span
          className="text-xs font-medium px-1.5 py-0.5 rounded-full"
          style={{ backgroundColor: C.subtleBg, color: C.grayText }}
        >
          {count}
        </span>
      </div>
      <div className="space-y-2">
        {tasks.map(task => (
          <TaskCard
            key={task.taskId}
            task={task}
            isSelected={selectedIds.includes(task.taskId)}
            isCompleted={completedIds.includes(task.taskId)}
            isActive={activeTaskId === task.taskId}
            onToggleSelect={onToggleSelect}
            onTakeAction={onTakeAction}
            onEmail={onEmail}
            onLinkedIn={onLinkedIn}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Recent activity panel ────────────────────────────────────────────────────

function RecentActivityPanel() {
  return (
    <div
      className="w-72 flex-shrink-0 flex flex-col"
      style={{ borderLeft: `1px solid ${C.border}`, backgroundColor: C.white }}
    >
      <div className="flex items-center justify-between px-4 py-3.5" style={{ borderBottom: `1px solid ${C.border}` }}>
        <p className="text-sm font-semibold" style={{ color: C.darkText }}>Recent Activity</p>
        <span className="text-xs font-medium px-1.5 py-0.5 rounded-full" style={{ backgroundColor: C.subtleBg, color: C.grayText }}>
          {MOCK_RECENT_ACTIVITY.length}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto">
        {MOCK_RECENT_ACTIVITY.map((act: RecentActivity) => (
          <div key={act.activityId} className="px-4 py-3" style={{ borderBottom: '1px solid #F9FAFB' }}>
            <div className="flex items-start gap-2.5">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ backgroundColor: C.subtleBg, color: CH[act.channelType].color }}
              >
                {channelIcon(act.channelType, 12)}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1 flex-wrap">
                  <span className="text-xs font-semibold" style={{ color: C.darkText }}>{act.contactName}</span>
                  <span className="text-xs" style={{ color: C.lightGray }}>·</span>
                  <span className="text-xs" style={{ color: C.lightGray }}>{act.company}</span>
                </div>
                <p className="text-xs mt-0.5 leading-relaxed" style={{ color: C.grayText }}>{act.summary}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Clock size={10} style={{ color: C.lightGray }} />
                  <span className="text-[10px]" style={{ color: C.lightGray }}>{act.timeAgoLabel}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main view ────────────────────────────────────────────────────────────────

export default function EngageRepView() {
  const [activeTab,      setActiveTab]      = useState<TabStatus>('TODAY');
  const [channelFilter,  setChannelFilter]  = useState<ChannelFilter>('ALL');
  const [searchQuery,    setSearchQuery]    = useState('');
  const [groupBy,        setGroupBy]        = useState<'None' | 'Flow' | 'Step'>('None');
  const [selectedIds,    setSelectedIds]    = useState<string[]>([]);
  const [drawerTask,     setDrawerTask]     = useState<Task | null>(null);
  const [emailTask,      setEmailTask]      = useState<Task | null>(null);
  const [linkedInTask,   setLinkedInTask]   = useState<Task | null>(null);
  const [queueOpen,      setQueueOpen]      = useState(false);
  const [filterOpen,     setFilterOpen]     = useState(false);
  const [createTaskOpen, setCreateTaskOpen] = useState(false);
  const [completedIds,   setCompletedIds]   = useState<string[]>([]);

  const filteredTasks = useMemo(() => {
    return MOCK_TASKS.filter(task => {
      if (activeTab === 'COMPLETED')               return completedIds.includes(task.taskId);
      if (completedIds.includes(task.taskId))      return false;
      if (activeTab === 'IN_PROGRESS')             return task.status === 'IN_PROGRESS';
      if (activeTab === 'UPCOMING')                return !task.isOverdue && new Date(task.dueDateTime) > new Date();
      if (channelFilter !== 'ALL' && task.channelType !== channelFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return task.contactName.toLowerCase().includes(q) || task.company.toLowerCase().includes(q);
      }
      return true;
    });
  }, [activeTab, channelFilter, searchQuery, completedIds]);

  const highPriority = filteredTasks.filter(t => t.priority === 'HIGH');
  const normal       = filteredTasks.filter(t => t.priority !== 'HIGH');

  const taskGroups = useMemo(() => {
    if (groupBy === 'None') return null;
    const map = new Map<string, Task[]>();
    filteredTasks.forEach(task => {
      const key = groupBy === 'Flow'
        ? (task.sequenceName || 'No Flow')
        : (task.sequenceStep  || 'No Step');
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(task);
    });
    return [...map.entries()].sort(([a], [b]) => {
      if (a.startsWith('No ') && !b.startsWith('No ')) return 1;
      if (!a.startsWith('No ') && b.startsWith('No ')) return -1;
      return a.localeCompare(b);
    });
  }, [filteredTasks, groupBy]);

  const tabCounts: Record<TabStatus, number> = {
    TODAY:       Math.max(0, MOCK_TASK_SUMMARY.totalTasksToday - completedIds.length),
    IN_PROGRESS: MOCK_TASK_SUMMARY.inProgressCount,
    UPCOMING:    MOCK_TASK_SUMMARY.upcomingCount,
    COMPLETED:   completedIds.length,
  };

  const toggleSelect = (id: string) =>
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const handleMarkComplete = (taskId: string) => {
    setCompletedIds(prev => [...prev, taskId]);
    if (drawerTask?.taskId === taskId) setDrawerTask(null);
  };

  const handleBulkMarkComplete = () => {
    setCompletedIds(prev => [...prev, ...selectedIds]);
    setSelectedIds([]);
    setDrawerTask(null);
  };

  const handleQueueComplete = (ids: string[]) => {
    setCompletedIds(prev => [...prev, ...ids]);
    setQueueOpen(false);
    setSelectedIds([]);
  };

  const queueTasks  = selectedIds.length > 0 ? MOCK_TASKS.filter(t => selectedIds.includes(t.taskId)) : filteredTasks;
  const emailIdx    = emailTask    ? filteredTasks.findIndex(t => t.taskId === emailTask.taskId)    : -1;
  const linkedInIdx = linkedInTask ? filteredTasks.findIndex(t => t.taskId === linkedInTask.taskId) : -1;
  const total       = MOCK_TASK_SUMMARY.totalTasksToday;
  const progressPct = total > 0 ? Math.round((completedIds.length / total) * 100) : 0;
  const hpTotal     = MOCK_TASKS.filter(t => t.priority === 'HIGH').length;
  const atRisk      = MOCK_TASK_SUMMARY.atRiskCount;
  const dueToday    = MOCK_TASK_SUMMARY.dueTodayCount;

  return (
    <>
      <div className="flex flex-col h-full" style={{ backgroundColor: C.pageBg }}>

        {/* ── Header ─────────────────────────────────────────────────── */}
        <div style={{ backgroundColor: C.white, borderBottom: `1px solid ${C.border}` }}>

          {/* Title row */}
          <div className="flex items-center justify-between px-6 pt-5 pb-3">
            <div>
              <div className="flex items-center gap-3">
                <span
                  className="flex-shrink-0 px-2.5 py-1 rounded-md text-xs font-bold tracking-wide"
                  style={{ backgroundColor: C.primaryBg, color: C.primary, border: `1px solid ${C.primaryBd}` }}
                >
                  Relanto
                </span>
                <h1 className="text-lg font-semibold truncate" style={{ color: C.darkText }}>Sales Command Center</h1>
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: '#3B82F6' }} />
              </div>
              <p className="text-sm mt-0.5" style={{ color: C.grayText }}>
                {hpTotal} high-priority deals need attention today
                {atRisk > 0 ? ` — ${atRisk} at risk of slipping` : ''}
              </p>
            </div>
            <CreateTaskBtn onClick={() => setCreateTaskOpen(true)} />
          </div>

          {/* Toolbar */}
          <div className="flex items-center gap-3 px-6 pb-3">
            <FilterIconBtn onClick={() => setFilterOpen(true)} />
            <div className="flex-1 relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: C.lightGray }} />
              <input
                type="text"
                placeholder="Search tasks, contacts, companies..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full text-sm pl-9 pr-3 py-1.5 rounded-lg focus:outline-none"
                style={{ border: `1px solid ${C.border}`, color: C.darkText, backgroundColor: C.white }}
                onFocus={e => { e.currentTarget.style.border = `1px solid ${C.primary}`; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.08)'; }}
                onBlur={e =>  { e.currentTarget.style.border = `1px solid ${C.border}`;  e.currentTarget.style.boxShadow = 'none'; }}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm" style={{ color: C.grayText }}>Group By</span>
              <PickerSelect
                value={groupBy}
                onChange={v => setGroupBy(v as 'None' | 'Flow' | 'Step')}
                options={['None', 'Flow', 'Step']}
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm" style={{ color: C.grayText }}>Sort By</span>
              <PickerSelect value="Due Date" onChange={() => {}} options={['Due Date', 'Priority', 'Activity']} />
            </div>
          </div>

          {/* ── Combined row: Tabs | Alerts | Channel chips ─────────── */}
          <div
            className="flex items-center px-6"
            style={{ borderTop: `1px solid ${C.border}` }}
          >
            {/* Tabs */}
            {TABS.map(tab => {
              const on  = activeTab === tab.id;
              const cnt = tabCounts[tab.id];
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="flex items-center gap-1.5 px-4 py-3 text-sm border-b-2 cursor-pointer whitespace-nowrap"
                  style={{
                    borderBottomColor: on ? C.primary : 'transparent',
                    color:             on ? C.primary : C.grayText,
                    fontWeight:        on ? 600 : 400,
                    marginBottom:      -1,
                    transition:        'all 0.12s',
                  }}
                >
                  {tab.label}
                  {cnt > 0 && (
                    <span
                      className="text-xs px-1.5 py-0.5 rounded-full"
                      style={{
                        backgroundColor: on ? C.primaryBg : C.subtleBg,
                        color:           on ? C.primary   : C.lightGray,
                        fontWeight: 500,
                      }}
                    >
                      {cnt}
                    </span>
                  )}
                </button>
              );
            })}

            <div className="flex-1" />

            {/* Alert indicators */}
            <div className="flex items-center gap-5 mr-6 text-xs">
              <span
                className="flex items-center gap-1.5"
                style={{ color: atRisk > 0 ? '#DC2626' : C.lightGray }}
              >
                <AlertCircle size={13} />
                {atRisk} at risk
              </span>
              <span
                className="flex items-center gap-1.5"
                style={{ color: dueToday > 0 ? C.grayText : C.lightGray }}
              >
                <Clock size={13} />
                {dueToday} due today
              </span>
            </div>

            {/* Channel chips — underline style, right side */}
            <div
              className="flex items-center"
              style={{ borderLeft: `1px solid ${C.border}`, paddingLeft: 16 }}
            >
              {CHIP_FILTERS.map(ch => {
                const on = channelFilter === ch.id;
                return (
                  <button
                    key={ch.id}
                    onClick={() => setChannelFilter(ch.id)}
                    className="flex items-center gap-1.5 px-3 py-3 text-xs border-b-2 cursor-pointer whitespace-nowrap"
                    style={{
                      borderBottomColor: on ? C.darkText : 'transparent',
                      color:             on ? C.darkText  : C.grayText,
                      fontWeight:        on ? 600 : 400,
                      marginBottom:      -1,
                      transition:        'all 0.12s',
                    }}
                  >
                    {ch.type && ch.type !== 'CUSTOM' && (
                      <span style={{ color: CH[ch.type].color }}>{channelIcon(ch.type, 12)}</span>
                    )}
                    {ch.type === 'CUSTOM' && (
                      <Zap size={12} style={{ color: CH.CUSTOM.color }} />
                    )}
                    {ch.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Content ────────────────────────────────────────────────── */}
        <div className="flex flex-1 min-h-0 overflow-hidden">

          {/* Task list */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 pb-24">

            {/* Progress card */}
            <div
              className="rounded-xl p-4"
              style={{ backgroundColor: C.white, border: `1px solid ${C.border}` }}
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold flex items-center gap-2" style={{ color: C.darkText }}>
                  <span style={{ color: C.lightGray, fontSize: 16 }}>⊙</span>
                  Today&apos;s Progress
                </p>
                <p className="text-sm font-semibold" style={{ color: C.darkText }}>
                  {completedIds.length}/{total}
                </p>
              </div>
              <div className="h-2 rounded-full overflow-hidden mb-2" style={{ backgroundColor: C.subtleBg }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${progressPct}%`, backgroundColor: C.darkText }}
                />
              </div>
              <div className="flex items-center justify-between text-xs">
                <p style={{ color: C.grayText }}>
                  {progressPct === 100
                    ? 'All high-priority tasks complete!'
                    : `${highPriority.length} high-priority task${highPriority.length !== 1 ? 's' : ''} remaining`}
                </p>
                <p style={{ color: C.lightGray }}>{progressPct}% complete</p>
              </div>
            </div>

            {/* Task groups */}
            {filteredTasks.length === 0 ? (
              <div className="flex flex-col items-center py-16 gap-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: C.subtleBg }}>
                  <Filter size={20} style={{ color: C.lightGray }} />
                </div>
                <p className="text-sm font-semibold" style={{ color: C.darkText }}>No tasks match your filters</p>
                <p className="text-xs" style={{ color: C.lightGray }}>
                  {channelFilter !== 'ALL'
                    ? `No ${CH[channelFilter as ChannelType]?.label ?? channelFilter} tasks found`
                    : 'Try adjusting your search or filters'}
                </p>
                {(channelFilter !== 'ALL' || searchQuery) && (
                  <button
                    onClick={() => { setChannelFilter('ALL'); setSearchQuery(''); }}
                    className="text-xs font-medium px-4 py-1.5 rounded-lg cursor-pointer"
                    style={{ backgroundColor: C.darkText, color: C.white }}
                  >
                    Clear filters
                  </button>
                )}
              </div>
            ) : taskGroups ? (
              <div className="space-y-4">
                {taskGroups.map(([label, tasks]) => (
                  <CollapsibleGroup
                    key={label} label={label} count={tasks.length}
                    tasks={tasks} selectedIds={selectedIds} completedIds={completedIds}
                    activeTaskId={drawerTask?.taskId}
                    onToggleSelect={toggleSelect} onTakeAction={setDrawerTask}
                    onEmail={setEmailTask} onLinkedIn={setLinkedInTask}
                  />
                ))}
              </div>
            ) : (
              <>
                {highPriority.length > 0 && (
                  <TaskGroup
                    label="High Priority" count={highPriority.length}
                    tasks={highPriority} selectedIds={selectedIds} completedIds={completedIds}
                    activeTaskId={drawerTask?.taskId}
                    onToggleSelect={toggleSelect} onTakeAction={setDrawerTask}
                    onEmail={setEmailTask} onLinkedIn={setLinkedInTask}
                  />
                )}
                {normal.length > 0 && (
                  <TaskGroup
                    label="All Tasks" count={normal.length}
                    tasks={normal} selectedIds={selectedIds} completedIds={completedIds}
                    activeTaskId={drawerTask?.taskId}
                    onToggleSelect={toggleSelect} onTakeAction={setDrawerTask}
                    onEmail={setEmailTask} onLinkedIn={setLinkedInTask}
                  />
                )}
              </>
            )}
          </div>

          {/* Right panel */}
          {!drawerTask && <RecentActivityPanel />}
        </div>

        {/* TakeActionDrawer — fixed full height overlay on the right */}
        {drawerTask && (
          <TakeActionDrawer
            task={drawerTask}
            onClose={() => setDrawerTask(null)}
            onEmail={setEmailTask}
            onMessage={setLinkedInTask}
          />
        )}

      </div>

      {/* ── Overlays ───────────────────────────────────────────────── */}
      {queueOpen && (
        <QueueMode tasks={queueTasks} onClose={() => setQueueOpen(false)} onQueueComplete={handleQueueComplete} />
      )}
      {emailTask && (
        <EmailTaskScreen
          task={emailTask} allTasks={filteredTasks}
          currentIndex={emailIdx >= 0 ? emailIdx : 0}
          onClose={() => setEmailTask(null)}
          onNavigate={i => setEmailTask(filteredTasks[i])}
        />
      )}
      {linkedInTask && (
        <LinkedInTaskScreen
          task={linkedInTask} allTasks={filteredTasks}
          currentIndex={linkedInIdx >= 0 ? linkedInIdx : 0}
          onClose={() => setLinkedInTask(null)}
          onNavigate={i => setLinkedInTask(filteredTasks[i])}
          onMarkComplete={handleMarkComplete}
        />
      )}
      {filterOpen     && <FilterPanel    onClose={() => setFilterOpen(false)}     onApply={() => {}} />}
      {createTaskOpen && <CreateTaskModal onClose={() => setCreateTaskOpen(false)} onSave={() => {}}  />}

      <BulkActionBar
        selectedCount={selectedIds.length}
        onClear={() => setSelectedIds([])}
        onStartQueue={() => setQueueOpen(true)}
        onMarkComplete={handleBulkMarkComplete}
        onUpdateDueDate={() => {}} onSnooze={() => {}}
        onDismiss={() => setSelectedIds([])} onSkipStep={() => setSelectedIds([])}
        onRemoveFromFlow={() => setSelectedIds([])} onPauseFlow={() => setSelectedIds([])}
      />
    </>
  );
}

// ─── Collapsible group (for Group By mode) ────────────────────────────────────

function CollapsibleGroup({ label, count, tasks, selectedIds, completedIds, activeTaskId, onToggleSelect, onTakeAction, onEmail, onLinkedIn }: {
  label: string; count: number; tasks: Task[];
  selectedIds: string[]; completedIds: string[]; activeTaskId?: string;
  onToggleSelect: (id: string) => void;
  onTakeAction:   (task: Task) => void;
  onEmail:        (task: Task) => void;
  onLinkedIn:     (task: Task) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <div>
      <button
        onClick={() => setCollapsed(c => !c)}
        className="flex items-center gap-2 mb-3 w-full text-left cursor-pointer"
      >
        <ChevronDown
          size={14}
          style={{ color: C.grayText, transform: collapsed ? 'rotate(-90deg)' : 'rotate(0deg)', transition: 'transform 0.15s' }}
        />
        <h3 className="text-sm font-semibold" style={{ color: C.darkText }}>{label}</h3>
        <span className="text-xs font-medium px-1.5 py-0.5 rounded-full" style={{ backgroundColor: C.subtleBg, color: C.grayText }}>
          {count}
        </span>
      </button>
      {!collapsed && (
        <div className="space-y-2">
          {tasks.map(task => (
            <TaskCard
              key={task.taskId}
              task={task}
              isSelected={selectedIds.includes(task.taskId)}
              isCompleted={completedIds.includes(task.taskId)}
              isActive={activeTaskId === task.taskId}
              onToggleSelect={onToggleSelect}
              onTakeAction={onTakeAction}
              onEmail={onEmail}
              onLinkedIn={onLinkedIn}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Tiny shared helpers ──────────────────────────────────────────────────────

function CreateTaskBtn({ onClick }: { onClick: () => void }) {
  const [hv, setHv] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHv(true)}
      onMouseLeave={() => setHv(false)}
      className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-lg cursor-pointer"
      style={{
        backgroundColor: hv ? '#1F2937' : '#111827',
        color:           '#FFFFFF',
        transition:      'background-color 0.15s',
      }}
    >
      <Plus size={14} /> Create Task
    </button>
  );
}

function FilterIconBtn({ onClick }: { onClick: () => void }) {
  const [hv, setHv] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHv(true)}
      onMouseLeave={() => setHv(false)}
      className="flex items-center justify-center w-8 h-8 rounded-lg cursor-pointer flex-shrink-0"
      style={{
        backgroundColor: hv ? C.subtleBg : C.white,
        color:           C.grayText,
        border:          `1px solid ${hv ? C.borderHover : C.border}`,
        transition:      'all 0.12s',
      }}
    >
      <Filter size={14} />
    </button>
  );
}

function PickerSelect({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="text-sm pl-3 pr-7 py-1.5 rounded-lg appearance-none cursor-pointer focus:outline-none"
        style={{ backgroundColor: C.white, color: C.darkText, border: `1px solid ${C.border}`, fontWeight: 500 }}
      >
        {options.map(o => <option key={o}>{o}</option>)}
      </select>
      <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: C.lightGray }} />
    </div>
  );
}
