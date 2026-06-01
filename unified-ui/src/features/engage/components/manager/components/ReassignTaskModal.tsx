"use client";

import { useState } from 'react';
import { X, Search, Check } from 'lucide-react';
import { MOCK_TEAM_MEMBERS } from '../mocks/engage.mock';

interface ReassignTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskTitle: string;
  contactName: string;
  currentAssignee: { id: string; name: string; role: string };
  onReassign: (newAssigneeId: string, scope: 'this_task_only' | 'this_and_future_tasks', reason: string) => void;
}

export default function ReassignTaskModal({
  isOpen,
  onClose,
  taskTitle,
  contactName,
  currentAssignee,
  onReassign,
}: ReassignTaskModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRepId, setSelectedRepId] = useState<string>('');
  const [scope, setScope] = useState<'this_task_only' | 'this_and_future_tasks'>('this_task_only');
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  const filteredReps = MOCK_TEAM_MEMBERS.filter(
    (m) =>
      m.id !== currentAssignee.id &&
      (m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.role.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleReassignSubmit = () => {
    if (!selectedRepId) return;
    onReassign(selectedRepId, scope, reason);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-lg w-full flex flex-col relative max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 shrink-0">
          <div className="flex flex-col gap-0.5">
            <h3 className="text-lg font-semibold text-gray-900">Reassign Task</h3>
            <span className="text-xs text-gray-500 font-medium">{taskTitle}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-150 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Current Assignee */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Current Assignee</label>
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200/60">
              <div 
                className="w-9 h-9 rounded-full flex items-center justify-center font-semibold text-sm border"
                style={{ backgroundColor: 'rgba(16, 51, 141, 0.08)', borderColor: 'rgba(16, 51, 141, 0.2)', color: 'rgb(16, 51, 141)' }}
              >
                {currentAssignee.name.substring(0, 2).toUpperCase()}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-gray-800">{currentAssignee.name}</span>
                <span className="text-xs text-gray-500">{currentAssignee.role}</span>
              </div>
            </div>
          </div>

          {/* New Assignee Select */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">New Assignee <span className="text-red-500">*</span></label>
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="Search team members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:border-blue-500"
                style={{ 
                  // Custom focus ring styling for brand blue
                  borderColor: searchQuery ? 'rgb(16, 51, 141)' : undefined
                }}
              />
            </div>
            
            <div className="border border-gray-200 rounded-xl overflow-hidden max-h-[160px] overflow-y-auto divide-y divide-gray-100">
              {filteredReps.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-400 text-center italic">No matching team members</div>
              ) : (
                filteredReps.map((rep) => (
                  <button
                    key={rep.id}
                    type="button"
                    onClick={() => setSelectedRepId(rep.id)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 text-left transition-colors"
                    style={{
                      backgroundColor: selectedRepId === rep.id ? 'rgba(16, 51, 141, 0.08)' : undefined
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-semibold text-xs border border-gray-200">
                        {rep.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-gray-800">{rep.name}</span>
                        <span className="text-xs text-gray-500">{rep.role}</span>
                      </div>
                    </div>
                    {selectedRepId === rep.id && <Check className="w-4 h-4" style={{ color: 'rgb(16, 51, 141)' }} />}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Scope Card Selectors */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Scope <span className="text-red-500">*</span></label>
            <div className="flex flex-col gap-2.5">
              {/* This Task Only */}
              <button
                type="button"
                onClick={() => setScope('this_task_only')}
                className="flex items-start gap-4 p-4 rounded-xl border text-left transition-all"
                style={
                  scope === 'this_task_only'
                    ? { borderColor: 'rgb(16, 51, 141)', backgroundColor: 'rgba(16, 51, 141, 0.04)', boxShadow: '0 0 0 1px rgb(16, 51, 141)' }
                    : { borderColor: '#E5E7EB' }
                }
              >
                <input
                  type="radio"
                  readOnly
                  checked={scope === 'this_task_only'}
                  className="w-4 h-4 border-gray-300 mt-0.5"
                  style={{ accentColor: 'rgb(16, 51, 141)' }}
                />
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold text-gray-800">This task only</span>
                  <span className="text-xs text-gray-500">Reassign only this specific task</span>
                </div>
              </button>

              {/* This task and future tasks */}
              <button
                type="button"
                onClick={() => setScope('this_and_future_tasks')}
                className="flex items-start gap-4 p-4 rounded-xl border text-left transition-all"
                style={
                  scope === 'this_and_future_tasks'
                    ? { borderColor: 'rgb(16, 51, 141)', backgroundColor: 'rgba(16, 51, 141, 0.04)', boxShadow: '0 0 0 1px rgb(16, 51, 141)' }
                    : { borderColor: '#E5E7EB' }
                }
              >
                <input
                  type="radio"
                  readOnly
                  checked={scope === 'this_and_future_tasks'}
                  className="w-4 h-4 border-gray-300 mt-0.5"
                  style={{ accentColor: 'rgb(16, 51, 141)' }}
                />
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm font-semibold text-gray-800">This task + all future tasks for this contact</span>
                  <span className="text-xs text-gray-500">Reassign all current and future tasks related to {contactName}</span>
                </div>
              </button>
            </div>
          </div>

          {/* Reason Commentary */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Reason (Optional)</label>
            <textarea
              placeholder="E.g., Out of office, Territory change, Better expertise match..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm min-h-[70px] focus:outline-none focus:ring-2 focus:border-blue-500"
              style={{
                borderColor: reason ? 'rgb(16, 51, 141)' : undefined
              }}
            />
            <span className="text-[10px] text-gray-400 font-medium block">Add a note to help track why this reassignment was made</span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-5 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50 rounded-b-2xl shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-200 hover:bg-gray-100 rounded-xl text-sm font-medium text-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleReassignSubmit}
            disabled={!selectedRepId}
            className={`px-5 py-2 text-white rounded-xl text-sm font-semibold transition-all shadow-sm ${
              selectedRepId ? 'hover:opacity-90 active:scale-95' : 'bg-gray-300 cursor-not-allowed'
            }`}
            style={selectedRepId ? { backgroundColor: 'rgb(16, 51, 141)' } : undefined}
          >
            Reassign Task
          </button>
        </div>
      </div>
    </div>
  );
}
