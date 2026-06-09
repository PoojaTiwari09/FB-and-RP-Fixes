'use client';

import { useState, useEffect } from 'react';
import {
  Activity,
  AlertTriangle,
  ClipboardCheck,
  FileText,
  Plus,
  RefreshCcw,
  X,
  Phone,
  Mail,
  MessageSquare,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';
import type { Deal, DealDetail, DealTaskPayload, DealStage, DealCategory } from '../types/deal.types';
import { ActivityOverTimeChart } from './ActivityChart';
import BriefTab from '../../components/deal-detail/tabs/BriefTab';

type DealDetailTab = 'brief' | 'warnings' | 'playbook' | 'activity' | 'crm';

interface DealDetailsDrawerProps {
  deal: Deal;
  detail: DealDetail;
  activeTab: DealDetailTab;
  onTabChange: (tab: DealDetailTab) => void;
  onCreateTask: (payload: DealTaskPayload) => Promise<void>;
  onClose: () => void;
  onUpdatePlaybook?: (dealId: string, meddic: DealDetail['meddic']) => void;
  onUpdateCrm?: (
    dealId: string,
    updates: { stage: DealStage; category: DealCategory; amount: string; nextStep: string }
  ) => void;
}

const tabs: Array<{
  id: DealDetailTab;
  label: string;
  icon: typeof FileText;
  disabled?: boolean;
}> = [
  { id: 'brief', label: 'Brief', icon: FileText },
  { id: 'warnings', label: 'Warnings', icon: AlertTriangle },
  { id: 'playbook', label: 'Playbook', icon: ClipboardCheck },
  { id: 'activity', label: 'Activity', icon: Activity },
  { id: 'crm', label: 'Update CRM', icon: RefreshCcw },
];



function WarningsTab({
  deal,
  detail,
  onCreateTask,
}: {
  deal: Deal;
  detail: DealDetail;
  onCreateTask: (payload: DealTaskPayload) => Promise<void>;
}) {
  const [taskName, setTaskName] = useState('');
  const [taskDescription, setTaskDescription] = useState('');
  const [isTaskFormOpen, setIsTaskFormOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleAddTask = async () => {
    if (submitting) return;

    setSubmitting(true);
    await onCreateTask({
      dealId: deal.id,
      title: taskName.trim() || `Follow up on ${deal.name}`,
      description: taskDescription.trim(),
    });
    setTaskName('');
    setTaskDescription('');
    setIsTaskFormOpen(false);
    setSubmitting(false);
  };

  return (
    <div className="space-y-7">
      <section className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <h3 className="mb-5 text-sm font-semibold text-gray-900">Add Task</h3>
        {!isTaskFormOpen ? (
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-md bg-[#153E91] px-4 py-2 text-sm font-semibold text-white hover:bg-[#0f2f70]"
            onClick={() => setIsTaskFormOpen(true)}
          >
            <Plus size={16} />
            Add Task
          </button>
        ) : (
          <div className="space-y-4">
            <label className="block">
              <span className="mb-2 block text-xs font-medium text-gray-600">Task Name</span>
              <input
                value={taskName}
                onChange={(event) => setTaskName(event.target.value)}
                className="h-11 w-full rounded-md border border-gray-300 px-4 text-sm outline-none focus:border-[#153E91] focus:ring-2 focus:ring-blue-100"
                placeholder="Enter task name..."
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-xs font-medium text-gray-600">Task Description</span>
              <textarea
                value={taskDescription}
                onChange={(event) => setTaskDescription(event.target.value)}
                className="min-h-24 w-full resize-none rounded-md border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#153E91] focus:ring-2 focus:ring-blue-100"
                placeholder="Enter task description..."
              />
            </label>
            <div className="flex gap-3">
            <button
              type="button"
              disabled={submitting}
              onClick={handleAddTask}
              className={`rounded-md px-4 py-2 text-sm font-semibold text-white ${
                !submitting ? 'bg-[#153E91] hover:bg-[#0f2f70]' : 'bg-gray-300'
              }`}
            >
              {submitting ? 'Adding...' : 'Add Task'}
            </button>
            <button
              type="button"
              className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
              onClick={() => {
                setTaskName('');
                setTaskDescription('');
                setIsTaskFormOpen(false);
              }}
            >
              Cancel
            </button>
            </div>
          </div>
        )}
      </section>

      <section>
        <h3 className="mb-4 text-sm font-semibold text-gray-900">Active AI Warnings</h3>
        <div className="space-y-3">
          {detail.activeWarnings.length ? (
            detail.activeWarnings.map((warning) => (
              <div
                key={warning}
                className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-4"
              >
                <AlertTriangle size={18} className="mt-0.5 text-amber-500" />
                <div>
                  <p className="text-sm text-gray-800">{warning}</p>
                  <span className="mt-3 inline-block rounded bg-amber-500 px-3 py-1 text-[10px] font-bold uppercase text-white">
                    Warning
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-700">
              No active warnings for this deal.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function PlaybookTab({
  deal,
  detail,
  onUpdatePlaybook,
}: {
  deal: Deal;
  detail: DealDetail;
  onUpdatePlaybook?: (dealId: string, meddic: DealDetail['meddic']) => void;
}) {
  const [meddicItems, setMeddicItems] = useState(detail.meddic);
  const completedCount = meddicItems.filter((item) => item.status === 'Completed').length;
  const playbookScore = Math.round((completedCount / meddicItems.length) * 100);

  useEffect(() => {
    setMeddicItems(detail.meddic);
  }, [detail.meddic]);

  return (
    <div className="space-y-4">
      <section className="rounded-lg border border-gray-200 p-5">
        <div className="mb-3 flex items-start justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">MEDDIC Framework</h3>
            <p className="mt-1 text-xs text-gray-500">{completedCount} of {meddicItems.length} complete</p>
          </div>
          <span className="text-sm font-semibold text-gray-600">{playbookScore}% Score</span>
        </div>
        <div className="h-2 rounded-full bg-gray-200">
          <div
            className="h-2 rounded-full bg-[#3B82F6]"
            style={{ width: `${playbookScore}%` }}
          />
        </div>
      </section>

      {meddicItems.map((item, index) => (
        <section
          key={item.label}
          className={`rounded-lg border p-4 ${
            item.status === 'Completed'
              ? 'border-emerald-200 bg-emerald-50/40'
              : 'border-gray-200 bg-white'
          }`}
        >
          <div className="mb-3 flex items-start justify-between gap-4">
            <div>
              <p
                className={`text-[11px] font-bold uppercase tracking-wide ${
                  item.status === 'Completed' ? 'text-emerald-600' : 'text-gray-400'
                }`}
              >
                {item.label}
              </p>
            </div>
            <select
              value={item.status}
              onChange={(event) => {
                const newStatus = event.target.value as 'Completed' | 'Pending';
                const updatedMeddic = meddicItems.map((entry, entryIndex) =>
                  entryIndex === index ? { ...entry, status: newStatus } : entry
                );
                setMeddicItems(updatedMeddic);
                if (onUpdatePlaybook) {
                  onUpdatePlaybook(deal.id, updatedMeddic);
                }
              }}
              className={`h-9 rounded-full border px-3 text-sm font-medium outline-none ${
                item.status === 'Completed'
                  ? 'border-emerald-400 bg-emerald-100 text-emerald-700'
                  : 'border-[#7C8DC8] bg-white text-gray-700'
              }`}
            >
              <option value="Completed">Completed</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
          <p className="mb-3 text-sm text-gray-800">{item.question}</p>
          <div className="rounded-md bg-gray-50 px-4 py-3 text-sm text-gray-600">
            {item.answer}
          </div>
          {item.note && (
            <div className="mt-3 rounded-md border border-violet-200 bg-violet-50 px-4 py-3 text-sm text-violet-700">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide">AI Suggested Note</p>
              {item.note}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}

function getActivityIcon(title: string) {
  const lower = title.toLowerCase();
  if (lower.includes('call') || lower.includes('phone') || lower.includes('demo') || lower.includes('discovery')) {
    return Phone;
  }
  if (lower.includes('email') || lower.includes('mail') || lower.includes('follow-up')) {
    return Mail;
  }
  return MessageSquare;
}

function ActivityTab({ detail }: { detail: DealDetail }) {
  return (
    <div className="space-y-6">
      {/* Activity Over Time Line Chart */}
      <div className="bg-white border border-gray-150 rounded-xl p-5 shadow-sm">
        <ActivityOverTimeChart detail={detail} />
      </div>

      {/* Interaction Metrics summary cards row */}
      <div className="grid grid-cols-3 gap-4">
        {/* Our Interactions */}
        <div className="bg-white border border-gray-150 rounded-xl p-5 shadow-sm text-center flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-[#4F46E5] mb-1">
            {detail.activity.interactionCount}
          </span>
          <span className="text-xs font-semibold text-gray-400">
            Our Interactions
          </span>
        </div>

        {/* Customer Interactions */}
        <div className="bg-white border border-gray-150 rounded-xl p-5 shadow-sm text-center flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-[#10B981] mb-1">
            {detail.activity.customerInteractionCount}
          </span>
          <span className="text-xs font-semibold text-gray-400">
            Customer Interactions
          </span>
        </div>

        {/* Total Minutes */}
        <div className="bg-white border border-gray-150 rounded-xl p-5 shadow-sm text-center flex flex-col items-center justify-center">
          <span className="text-3xl font-bold text-[#F59E0B] mb-1">
            {detail.activity.totalTime}
          </span>
          <span className="text-xs font-semibold text-gray-400">
            Total Minutes
          </span>
        </div>
      </div>

      {/* Timeline detail vertical list */}
      <div className="relative space-y-0 pl-1 pt-4">
        {detail.activity.details.map((item, index) => {
          const Icon = getActivityIcon(item.title);
          const isOutbound = item.direction === 'outbound' || item.type === 'our';
          
          const iconColorClass = isOutbound
            ? 'border-indigo-100 bg-indigo-50/50 text-[#4F46E5]'
            : 'border-emerald-100 bg-emerald-50/50 text-[#10B981]';

          return (
            <div key={`${item.title}-${item.date}-${index}`} className="flex gap-5 relative">
              {/* Vertical line and dot icon column */}
              <div className="flex flex-col items-center">
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 bg-white shadow-sm ${iconColorClass}`}>
                  <Icon size={18} />
                </div>
                {index !== detail.activity.details.length - 1 && (
                  <div className="w-[2px] grow bg-gray-100 my-2" />
                )}
              </div>

              {/* Text content details column */}
              <div className="pb-8 flex-1 space-y-1">
                <div className="flex items-center gap-3">
                  <span className="font-bold text-[15px] text-[#1E293B]">{item.title}</span>
                  <span
                    className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                      isOutbound
                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                    }`}
                  >
                    {isOutbound ? (
                      <>
                        <ArrowUpRight size={10} className="stroke-[3]" />
                        outbound
                      </>
                    ) : (
                      <>
                        <ArrowDownLeft size={10} className="stroke-[3]" />
                        inbound
                      </>
                    )}
                  </span>
                  <span className="text-xs font-semibold text-gray-400">{item.duration}</span>
                </div>
                <div className="text-xs font-semibold text-gray-400">{item.date}</div>
                <p className="text-sm font-medium text-gray-600 leading-relaxed pt-1">
                  {item.subtitle}
                </p>
                {item.participants && item.participants.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {item.participants.map((p) => (
                      <span
                        key={p}
                        className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600 border border-gray-200"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CrmTab({
  deal,
  detail,
  onUpdateCrm,
}: {
  deal: Deal;
  detail: DealDetail;
  onUpdateCrm?: (
    dealId: string,
    updates: { stage: DealStage; category: DealCategory; amount: string; nextStep: string }
  ) => void;
}) {
  const [stage, setStage] = useState<DealStage>(deal.stage);
  const [category, setCategory] = useState<DealCategory>(deal.category);
  const [amount, setAmount] = useState(deal.amount);
  const [nextStep, setNextStep] = useState(detail.crm.nextStep || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    if (onUpdateCrm) {
      onUpdateCrm(deal.id, { stage, category, amount, nextStep });
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h3 className="text-base font-semibold text-gray-900 border-b pb-3">Update CRM Fields</h3>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500">
            Deal Stage
          </label>
          <select
            value={stage}
            onChange={(e) => setStage(e.target.value as DealStage)}
            className="h-11 w-full rounded-md border border-gray-300 px-4 text-sm font-medium outline-none focus:border-[#153E91] focus:ring-2 focus:ring-blue-100"
          >
            <option value="Qualification">Qualification</option>
            <option value="Discovery">Discovery</option>
            <option value="Proposal">Proposal</option>
            <option value="Negotiation">Negotiation</option>
            <option value="Closed Won">Closed Won</option>
            <option value="Closed Lost">Closed Lost</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500">
            Forecast Category
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as DealCategory)}
            className="h-11 w-full rounded-md border border-gray-300 px-4 text-sm font-medium outline-none focus:border-[#153E91] focus:ring-2 focus:ring-blue-100"
          >
            <option value="Open">Open</option>
            <option value="Commit">Commit</option>
            <option value="Most Likely">Most Likely</option>
            <option value="Best Case">Best Case</option>
            <option value="Closed Won">Closed Won</option>
            <option value="Closed Lost">Closed Lost</option>
          </select>
        </div>
      </div>

      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500">
          Deal Amount
        </label>
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="h-11 w-full rounded-md border border-gray-300 px-4 text-sm font-medium outline-none focus:border-[#153E91] focus:ring-2 focus:ring-blue-100"
          placeholder="e.g. $250K"
        />
      </div>

      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-gray-500">
          Next Step
        </label>
        <textarea
          value={nextStep}
          onChange={(e) => setNextStep(e.target.value)}
          className="min-h-24 w-full resize-none rounded-md border border-gray-300 px-4 py-3 text-sm outline-none focus:border-[#153E91] focus:ring-2 focus:ring-blue-100"
          placeholder="Describe the next step for this deal..."
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className={`rounded-md px-6 py-2.5 text-sm font-semibold text-white ${
            !saving ? 'bg-[#153E91] hover:bg-[#0f2f70]' : 'bg-gray-300'
          }`}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}

const stageColors: Record<string, string> = {
  Qualification: 'bg-gray-100 text-gray-700',
  Discovery: 'bg-blue-100 text-blue-700',
  Proposal: 'bg-amber-100 text-amber-700',
  Negotiation: 'bg-purple-100 text-purple-700',
  'Closed Won': 'bg-emerald-100 text-emerald-700',
  'Closed Lost': 'bg-rose-100 text-rose-700',
};

export default function DealDetailsDrawer({
  deal,
  detail,
  activeTab,
  onTabChange,
  onCreateTask,
  onClose,
  onUpdatePlaybook,
  onUpdateCrm,
}: DealDetailsDrawerProps) {
  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <button
        type="button"
        aria-label="Close deal details"
        className="absolute inset-0 bg-black/45"
        onClick={onClose}
      />
      <aside className="relative z-10 flex h-full w-full max-w-[56vw] min-w-[720px] flex-col bg-white shadow-2xl">
        <header className="border-b border-gray-200 px-8 py-7 relative">
          <button
            type="button"
            aria-label="Close"
            className="absolute right-8 top-8 rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            onClick={onClose}
          >
            <X size={24} />
          </button>
          <h2 className="pr-12 text-2xl font-bold text-[#1E3A5F] tracking-tight">{deal.name}</h2>
          <div className="mt-3 flex items-center gap-2 text-sm text-gray-500 font-medium">
            <span>{detail.company}</span>
            <span>•</span>
            <span className="font-bold text-gray-900">{deal.amount}</span>
            <span>•</span>
            <span className={`rounded px-2.5 py-1 text-xs font-bold ${stageColors[deal.stage] || 'bg-blue-100 text-blue-700'}`}>
              {deal.stage}
            </span>
          </div>
        </header>

        <nav className="flex border-b border-gray-200 px-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                type="button"
                disabled={tab.disabled}
                onClick={() => !tab.disabled && onTabChange(tab.id as DealDetailTab)}
                className={`flex items-center gap-2 border-b-2 px-4 py-4 text-sm font-medium transition-colors ${
                  isActive
                    ? 'border-[#153E91] text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-900'
                } ${tab.disabled ? 'cursor-not-allowed opacity-45 hover:text-gray-500' : ''}`}
              >
                <Icon size={18} />
                {tab.label}
                {tab.id === 'warnings' && deal.warnings > 0 && (
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-600">
                    {deal.warnings}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="flex-1 overflow-y-auto px-8 py-7">
          {activeTab === 'brief' && <BriefTab data={detail.briefData || null} loading={false} />}
          {activeTab === 'warnings' && (
            <WarningsTab deal={deal} detail={detail} onCreateTask={onCreateTask} />
          )}
          {activeTab === 'playbook' && (
            <PlaybookTab deal={deal} detail={detail} onUpdatePlaybook={onUpdatePlaybook} />
          )}
          {activeTab === 'activity' && <ActivityTab detail={detail} />}
          {activeTab === 'crm' && (
            <CrmTab deal={deal} detail={detail} onUpdateCrm={onUpdateCrm} />
          )}
        </div>
      </aside>
    </div>
  );
}
