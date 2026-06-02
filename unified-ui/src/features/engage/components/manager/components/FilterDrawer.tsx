"use client";

import { useState } from 'react';
import { X, Search, ChevronDown, ChevronUp } from 'lucide-react';
import type { FilterState } from '../types/engage.types';

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: FilterState) => void;
  initialFilters: FilterState | null;
}

const ALL_FLOWS = [
  'Enterprise Outbound Q2 2026',
  'Mid-Market Follow-up',
  'Social Selling Campaign',
  'Product Launch Sequence',
  'Customer Onboarding',
  'Renewal Outreach',
];

export default function FilterDrawer({ isOpen, onClose, onApply, initialFilters }: FilterDrawerProps) {
  // Local state to track selections before Apply is clicked
  const [dueDate, setDueDate] = useState<'today' | 'tomorrow' | 'this-week' | 'overdue' | 'custom' | null>(
    initialFilters?.dueDate || null
  );
  
  const [todoTypes, setTodoTypes] = useState<Set<'flow' | 'manual' | 'recommended'>>(
    new Set(initialFilters?.todoTypes || [])
  );
  
  const [flowNames, setFlowNames] = useState<Set<string>>(
    new Set(initialFilters?.flowNames || [])
  );
  
  const [entityTypes, setEntityTypes] = useState<Set<'account' | 'deal' | 'lead'>>(
    new Set(initialFilters?.entityTypes || [])
  );
  
  const [localTime, setLocalTime] = useState<'morning' | 'business_hours' | 'custom' | null>(
    initialFilters?.localTime || null
  );

  const [flowSearch, setFlowSearch] = useState('');
  
  // Collapsible Accordion States
  const [crmOpen, setCrmOpen] = useState<Record<string, boolean>>({
    account: false,
    contact: false,
    lead: false,
    opportunity: false,
  });

  const toggleCrmCategory = (cat: string) => {
    setCrmOpen((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  const handleTodoTypeToggle = (val: 'flow' | 'manual' | 'recommended') => {
    setTodoTypes((prev) => {
      const next = new Set(prev);
      if (next.has(val)) next.delete(val);
      else next.add(val);
      return next;
    });
  };

  const handleFlowToggle = (val: string) => {
    setFlowNames((prev) => {
      const next = new Set(prev);
      if (next.has(val)) next.delete(val);
      else next.add(val);
      return next;
    });
  };

  const handleEntityTypeToggle = (val: 'account' | 'deal' | 'lead') => {
    setEntityTypes((prev) => {
      const next = new Set(prev);
      if (next.has(val)) next.delete(val);
      else next.add(val);
      return next;
    });
  };

  const handleClearAll = () => {
    setDueDate(null);
    setTodoTypes(new Set());
    setFlowNames(new Set());
    setEntityTypes(new Set());
    setLocalTime(null);
  };

  const handleApply = () => {
    onApply({
      dueDate,
      todoTypes,
      flowNames,
      entityTypes,
      localTime,
    });
  };

  const filteredFlows = ALL_FLOWS.filter((f) =>
    f.toLowerCase().includes(flowSearch.toLowerCase())
  );

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/30 transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-[400px] bg-white border-l border-gray-200 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out transform ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-150">
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
          <div className="flex items-center gap-4">
            <button
              onClick={handleClearAll}
              className="text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors"
            >
              Clear All
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <span className="sr-only">Close Drawer</span>
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Filters */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Due Date */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Due Date</h3>
            <div className="flex flex-col gap-2">
              {['today', 'tomorrow', 'this-week', 'overdue', 'custom'].map((opt) => {
                const labelMap = {
                  today: 'Today',
                  tomorrow: 'Tomorrow',
                  'this-week': 'This Week',
                  overdue: 'Overdue',
                  custom: 'Custom Range',
                };
                return (
                  <label key={opt} className="flex items-center gap-3 text-sm font-medium text-gray-700 cursor-pointer">
                    <input
                      type="radio"
                      name="dueDateFilter"
                      checked={dueDate === opt}
                      onChange={() => setDueDate(opt as any)}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span>{labelMap[opt as keyof typeof labelMap]}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* To-Do Type - Hidden */}
          {false && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">To-Do Type</h3>
              <div className="flex flex-col gap-2">
                {(['flow', 'manual', 'recommended'] as const).map((type) => {
                  const labels = { flow: 'Flow', manual: 'Manual', recommended: 'Recommended' };
                  return (
                    <label key={type} className="flex items-center gap-3 text-sm font-medium text-gray-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={todoTypes.has(type)}
                        onChange={() => handleTodoTypeToggle(type)}
                        className="w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500"
                      />
                      <span>{labels[type]}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {false && <hr className="border-gray-100" />}

          {/* Flow Name - Hidden */}
          {false && (
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Flow Name</h3>
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search flows..."
                  value={flowSearch}
                  onChange={(e) => setFlowSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
              </div>
              <div className="flex flex-col gap-2 max-h-[160px] overflow-y-auto pr-1">
                {filteredFlows.map((flow) => (
                  <label key={flow} className="flex items-center gap-3 text-sm font-medium text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={flowNames.has(flow)}
                      onChange={() => handleFlowToggle(flow)}
                      className="w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span>{flow}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {false && <hr className="border-gray-100" />}

          {/* Linked Entity Type */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Linked Entity Type</h3>
            <div className="flex flex-col gap-2">
              {(['account', 'deal', 'lead'] as const).map((type) => {
                const labels = { account: 'Account', deal: 'Deal', lead: 'Lead' };
                return (
                  <label key={type} className="flex items-center gap-3 text-sm font-medium text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={entityTypes.has(type)}
                      onChange={() => handleEntityTypeToggle(type)}
                      className="w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <span>{labels[type]}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Prospect Local Time */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Prospect Local Time</h3>
            <div className="flex flex-col gap-2">
              {[
                { val: 'morning', label: 'Morning (6–12)' },
                { val: 'business_hours', label: 'Business Hours (9–6)' },
                { val: 'custom', label: 'Custom Range' },
              ].map((opt) => (
                <label key={opt.val} className="flex items-center gap-3 text-sm font-medium text-gray-700 cursor-pointer">
                  <input
                    type="radio"
                    name="localTimeFilter"
                    checked={localTime === opt.val}
                    onChange={() => setLocalTime(opt.val as any)}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* CRM Entity Fields Accordions */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">CRM Entity Fields</h3>
            <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-200">
              {['Account', 'Contact', 'Lead', 'Opportunity'].map((cat) => {
                const key = cat.toLowerCase();
                const isOpen = crmOpen[key];
                return (
                  <div key={cat} className="flex flex-col">
                    <button
                      type="button"
                      onClick={() => toggleCrmCategory(key)}
                      className="flex items-center justify-between px-4 py-3 bg-gray-50/50 hover:bg-gray-50 text-sm font-semibold text-gray-800 transition-colors"
                    >
                      <span>{cat}</span>
                      {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    {isOpen && (
                      <div className="px-4 py-3 bg-white text-xs text-gray-400 italic">
                        CRM fields for {cat} will appear here
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-5 border-t border-gray-150 flex items-center justify-between bg-gray-50/50">
          <button
            onClick={handleClearAll}
            className="px-4 py-2 border border-gray-200 hover:bg-gray-100 rounded-lg text-sm font-medium text-gray-700 transition-colors"
          >
            Clear All
          </button>
          <button
            onClick={handleApply}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </>
  );
}
