'use client';

import { useState } from 'react';
import { X, Search, ChevronDown, ChevronUp } from 'lucide-react';

interface FilterState {
  dueDate: 'today' | 'tomorrow' | 'this-week' | 'overdue' | 'custom' | null;
  entityTypes: Set<'account' | 'deal' | 'lead'>;
  localTime: 'morning' | 'business_hours' | 'custom' | null;
}

interface FilterPanelProps {
  onClose: () => void;
  onApply: (filters: FilterState) => void;
  initialFilters?: FilterState | null;
}

export default function FilterPanel({ onClose, onApply, initialFilters }: FilterPanelProps) {
  const [dueDate, setDueDate] = useState<'today' | 'tomorrow' | 'this-week' | 'overdue' | 'custom' | null>(
    initialFilters?.dueDate || null
  );
  
  const [entityTypes, setEntityTypes] = useState<Set<'account' | 'deal' | 'lead'>>(
    new Set(initialFilters?.entityTypes || [])
  );
  
  const [localTime, setLocalTime] = useState<'morning' | 'business_hours' | 'custom' | null>(
    initialFilters?.localTime || null
  );

  // CRM Accordion States
  const [crmOpen, setCrmOpen] = useState<Record<string, boolean>>({
    account: false,
    contact: false,
    lead: false,
    opportunity: false,
  });

  const toggleCrmCategory = (cat: string) => {
    setCrmOpen((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  const handleEntityTypeToggle = (val: 'account' | 'deal' | 'lead') => {
    setEntityTypes((prev) => {
      const next = new Set(prev);
      if (next.has(val)) next.delete(val);
      else next.add(val);
      return next;
    });
  };

  const handleReset = () => {
    setDueDate(null);
    setEntityTypes(new Set());
    setLocalTime(null);
  };

  const handleApply = () => {
    onApply({
      dueDate,
      entityTypes,
      localTime,
    });
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />

      <div className="fixed top-0 right-0 h-full w-[380px] bg-white z-50 flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-150">
          <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
          <div className="flex items-center gap-4">
            <button
              onClick={handleReset}
              className="text-xs font-semibold text-gray-500 hover:text-gray-900 transition-colors"
            >
              Clear All
            </button>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Due Date */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Due Date</h3>
            <div className="flex flex-col gap-2.5">
              {[
                { value: 'today', label: 'Today' },
                { value: 'tomorrow', label: 'Tomorrow' },
                { value: 'this-week', label: 'This Week' },
                { value: 'overdue', label: 'Overdue' },
                { value: 'custom', label: 'Custom Range' },
              ].map((opt) => (
                <label key={opt.value} className="flex items-center gap-3 text-sm font-medium text-gray-700 cursor-pointer">
                  <input
                    type="radio"
                    name="dueDate"
                    checked={dueDate === opt.value}
                    onChange={() => setDueDate(opt.value as any)}
                    className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          <hr className="border-gray-100" />

          {/* Linked Entity Type */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Linked Entity Type</h3>
            <div className="flex flex-col gap-2.5">
              {(['account', 'deal', 'lead'] as const).map((type) => {
                const labels = { account: 'Account', deal: 'Deal', lead: 'Lead' };
                return (
                  <label key={type} className="flex items-center gap-3 text-sm font-medium text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={entityTypes.has(type)}
                      onChange={() => handleEntityTypeToggle(type)}
                      className="w-4 h-4 rounded text-purple-600 border-gray-300 focus:ring-purple-500"
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
            <div className="flex flex-col gap-2.5">
              {[
                { val: 'morning', label: 'Morning (6–12)' },
                { val: 'business_hours', label: 'Business Hours (9–6)' },
                { val: 'custom', label: 'Custom Range' },
              ].map((opt) => (
                <label key={opt.val} className="flex items-center gap-3 text-sm font-medium text-gray-700 cursor-pointer">
                  <input
                    type="radio"
                    name="localTime"
                    checked={localTime === opt.val}
                    onChange={() => setLocalTime(opt.val as any)}
                    className="w-4 h-4 text-purple-600 border-gray-300 focus:ring-purple-500"
                  />
                  <span>{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-5 border-t border-gray-150 flex items-center justify-between bg-gray-50/50">
          <button
            onClick={handleReset}
            className="px-4 py-2 border border-gray-200 hover:bg-gray-100 rounded-lg text-sm font-medium text-gray-700 transition-colors"
          >
            Clear All
          </button>
          <button
            onClick={handleApply}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-sm"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </>
  );
}
