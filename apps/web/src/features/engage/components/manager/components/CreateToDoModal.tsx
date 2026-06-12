"use client";

import { useState, useEffect, useRef } from 'react';
import { X, Search } from 'lucide-react';
import * as engageService from '../services/engage.service';
interface CreateToDoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (body: {
    taskType: string;
    title: string;
    linkedToId: string;
    linkedToType: string;
    contactName?: string;
    companyName?: string;
    dueDate: string;
    dueTime: string;
    description?: string;
    assigneeId?: string;
    priority?: string;
  }) => void;
  teamMembers?: { id: string; name: string; role: string }[];
}

// Auto-derive priority: today/overdue = HIGH, future = NORMAL
function computePriority(dueDate: string): string {
  if (!dueDate) return 'NORMAL';
  const today = new Date().toISOString().split('T')[0];
  return dueDate <= today ? 'HIGH' : 'NORMAL';
}

export default function CreateToDoModal({ isOpen, onClose, onSave, teamMembers = [] }: CreateToDoModalProps) {
  const [taskType, setTaskType] = useState('email');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [dueTime, setDueTime] = useState('17:00');
  const [assigneeId, setAssigneeId] = useState('me');

  // Autocomplete search states for "Linked To"
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ id: string; name: string; type: string; subLabel: string }[]>([]);
  const [selectedEntity, setSelectedEntity] = useState<{ id: string; name: string; type: string; company: string } | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);

  const autocompleteRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (autocompleteRef.current && !autocompleteRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search entities when typing
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      try {
        const results = await engageService.searchLinkedEntities(searchQuery);
        setSearchResults(results);
      } catch (e) {
        // Silent catch
      }
    }, 250);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const handleSelectEntity = (entity: { id: string; name: string; type: string; subLabel: string }) => {
    // Extract company name from subLabel (format: "Job Title · Company Name")
    const parts = entity.subLabel.split('·');
    const company = parts.length > 1 ? parts[parts.length - 1].trim() : '';
    setSelectedEntity({ id: entity.id, name: entity.name, type: entity.type, company });
    setSearchQuery(entity.name);
    setShowDropdown(false);
  };

  const handleFormSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskType || !title || !selectedEntity) return;

    onSave({
      taskType,
      title,
      linkedToId: selectedEntity.id,
      linkedToType: selectedEntity.type,
      // Pass names directly so backend doesn't need to do a DB lookup
      contactName: selectedEntity.name,
      companyName: selectedEntity.company,
      dueDate,
      dueTime,
      description,
      assigneeId,
      priority: computePriority(dueDate),
    });

    // Reset Form
    setTitle('');
    setDescription('');
    setSearchQuery('');
    setSelectedEntity(null);
    setDueDate(new Date().toISOString().split('T')[0]);
    setDueTime('17:00');
    setAssigneeId('me');
  };

  if (!isOpen) return null;

  const isValid = taskType && title.trim() && selectedEntity;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-2xl max-w-lg w-full flex flex-col relative max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900">Create To-Do</h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-150 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleFormSave} className="flex-1 overflow-y-auto p-6 space-y-4">
          
          {/* Task Type */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Task Type <span className="text-red-500">*</span>
            </label>
            <select
              value={taskType}
              onChange={(e) => setTaskType(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="email">Email</option>
              <option value="call">Call</option>
              <option value="linkedin_message">LinkedIn Message</option>
              <option value="linkedin_connection">LinkedIn Connection</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Enter task title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              required
            />
          </div>

          {/* Linked To Autocomplete */}
          <div ref={autocompleteRef} className="space-y-1.5 relative">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Linked To <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="Search contacts, accounts, deals..."
                value={searchQuery}
                onFocus={() => setShowDropdown(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSelectedEntity(null);
                  setShowDropdown(true);
                }}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                required
              />
            </div>

            {/* Suggestions dropdown */}
            {showDropdown && searchResults.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto divide-y divide-gray-150">
                {searchResults.map((entity) => (
                  <button
                    key={entity.id}
                    type="button"
                    onClick={() => handleSelectEntity(entity)}
                    className="w-full text-left px-4 py-2.5 hover:bg-gray-50 flex flex-col transition-colors"
                  >
                    <span className="text-sm font-semibold text-gray-800">{entity.name}</span>
                    <span className="text-xs text-gray-500">{entity.subLabel}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Due Date & Due Time */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Due Date
              </label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Due Time
              </label>
              <input
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Priority is auto-derived from due date */}

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Description
            </label>
            <textarea
              placeholder="Add more context (optional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Assign To */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Assign To
            </label>
            <select
              value={assigneeId}
              onChange={(e) => setAssigneeId(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              {teamMembers.length === 0 && (
                <option value="me">Me</option>
              )}
              {teamMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name} ({member.role})
                </option>
              ))}
            </select>
          </div>

          {/* Priority is auto-derived from due date — no manual selection */}
        </form>

        {/* Footer */}
        <div className="px-6 py-5 border-t border-gray-100 flex items-center justify-end gap-3 bg-gray-50 rounded-b-2xl">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-200 hover:bg-gray-100 rounded-xl text-sm font-medium text-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleFormSave}
            disabled={!isValid}
            className={`px-5 py-2 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm ${
              isValid ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-300 cursor-not-allowed'
            }`}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
