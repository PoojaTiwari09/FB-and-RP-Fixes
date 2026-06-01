'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { MOCK_FILTER_OPTIONS } from './mocks/engage.mock';

interface FilterState {
  dueDate: string;
  todoTypes: string[];
  flowIds: string[];
  entityType: string;
}

interface FilterPanelProps {
  onClose: () => void;
  onApply: (filters: FilterState) => void;
}

export default function FilterPanel({ onClose, onApply }: FilterPanelProps) {
  const [dueDate, setDueDate] = useState('');
  const [todoTypes, setTodoTypes] = useState<string[]>([]);
  const [flowIds, setFlowIds] = useState<string[]>([]);
  const [entityType, setEntityType] = useState('');

  const toggleTodoType = (type: string) =>
    setTodoTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );

  const toggleFlow = (id: string) =>
    setFlowIds((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );

  const handleReset = () => {
    setDueDate('');
    setTodoTypes([]);
    setFlowIds([]);
    setEntityType('');
  };

  const handleApply = () => {
    onApply({ dueDate, todoTypes, flowIds, entityType });
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/20 z-40" onClick={onClose} />

      <div className="fixed top-0 right-0 h-full w-80 bg-white z-50 flex flex-col shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-900">Filters</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 cursor-pointer transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Due Date */}
          <div className="px-5 py-4 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-700 mb-3">Due Date</p>
            <div className="space-y-2.5">
              {[
                { value: 'today', label: 'Today' },
                { value: 'tomorrow', label: 'Tomorrow' },
                { value: 'this_week', label: 'This week' },
                { value: 'next_week', label: 'Next week' },
              ].map((opt) => (
                <label key={opt.value} className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="radio"
                    name="dueDate"
                    value={opt.value}
                    checked={dueDate === opt.value}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="accent-purple-600"
                  />
                  <span className="text-sm text-gray-700">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* To-Do Type */}
          <div className="px-5 py-4 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-700 mb-3">To-Do Type</p>
            <div className="space-y-2.5">
              {['FLOW', 'MANUAL', 'RECOMMENDED'].map((type) => (
                <label key={type} className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={todoTypes.includes(type)}
                    onChange={() => toggleTodoType(type)}
                    className="accent-purple-600"
                  />
                  <span className="text-sm text-gray-700">
                    {type.charAt(0) + type.slice(1).toLowerCase()}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Flow Name */}
          <div className="px-5 py-4 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-700 mb-3">Flow Name</p>
            <div className="space-y-2.5">
              {MOCK_FILTER_OPTIONS.flowNames.map((flow) => (
                <label key={flow.flowId} className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={flowIds.includes(flow.flowId)}
                    onChange={() => toggleFlow(flow.flowId)}
                    className="accent-purple-600"
                  />
                  <span className="text-sm text-gray-700">{flow.flowName}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Linked Entity Type */}
          <div className="px-5 py-4 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-700 mb-3">Linked Entity Type</p>
            <div className="space-y-2.5">
              {['CONTACT', 'ACCOUNT', 'DEAL', 'LEAD'].map((type) => (
                <label key={type} className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="radio"
                    name="entityType"
                    value={type}
                    checked={entityType === type}
                    onChange={(e) => setEntityType(e.target.value)}
                    className="accent-purple-600"
                  />
                  <span className="text-sm text-gray-700">
                    {type.charAt(0) + type.slice(1).toLowerCase()}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Prospect Local Time */}
          <div className="px-5 py-4">
            <p className="text-xs font-semibold text-gray-700 mb-3">Prospect Local Time</p>
            <div className="flex items-center gap-3">
              <input
                type="time"
                defaultValue="08:00"
                className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800"
              />
              <span className="text-xs text-gray-400 flex-shrink-0">to</span>
              <input
                type="time"
                defaultValue="18:00"
                className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center gap-3 px-5 py-4 border-t border-gray-200">
          <button
            onClick={handleReset}
            className="flex-1 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg py-2 hover:bg-gray-50 cursor-pointer transition-colors"
          >
            Reset
          </button>
          <button
            onClick={handleApply}
            className="flex-1 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg py-2 cursor-pointer transition-colors"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </>
  );
}
