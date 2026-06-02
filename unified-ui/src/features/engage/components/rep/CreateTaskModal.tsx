'use client';

import { useState } from 'react';
import { X, ChevronDown } from 'lucide-react';
import type { ChannelType } from './types/engage.types';

interface CreateTaskModalProps {
  onClose: () => void;
  onSave: (taskData: {
    channel: string;
    title: string;
    contactName: string;
    companyName: string;
    dueDate: string;
    dueTime: string;
    description: string;
    assigneeId: string;
  }) => void;
}

export default function CreateTaskModal({ onClose, onSave }: CreateTaskModalProps) {
  const [taskType, setTaskType] = useState<ChannelType>('CALL');
  const [title, setTitle] = useState('');
  const [linkedTo, setLinkedTo] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [description, setDescription] = useState('');
  const [assignTo, setAssignTo] = useState('');

  const parseLinkedTo = (val: string) => {
    const delimiters = [' - ', ' – ', ' | ', ' @ '];
    for (const d of delimiters) {
      if (val.includes(d)) {
        const parts = val.split(d);
        return {
          contactName: parts[0].trim(),
          companyName: parts[1].trim(),
        };
      }
    }
    return {
      contactName: val.trim() || 'New Contact',
      companyName: 'New Company',
    };
  };

  const handleSave = () => {
    if (!title.trim() || !linkedTo.trim()) return;
    const { contactName, companyName } = parseLinkedTo(linkedTo);
    onSave({
      channel: taskType,
      title,
      contactName,
      companyName,
      dueDate,
      dueTime,
      description,
      assigneeId: assignTo || 'me',
    });
    onClose();
  };

  const isValid = title.trim() !== '' && linkedTo.trim() !== '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">Create Task</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 cursor-pointer transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Task Type */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Task Type</label>
            <div className="relative">
              <select
                value={taskType}
                onChange={(e) => setTaskType(e.target.value as ChannelType)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none cursor-pointer text-gray-800 bg-white"
              >
                <option value="CALL">Call</option>
                <option value="EMAIL">Email</option>
                <option value="LINKEDIN">LinkedIn</option>
                <option value="CUSTOM">Custom</option>
              </select>
              <ChevronDown
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title"
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-800"
            />
          </div>

          {/* Linked To */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Linked To</label>
            <input
              type="text"
              value={linkedTo}
              onChange={(e) => setLinkedTo(e.target.value)}
              placeholder="Search contacts, accounts, or deals..."
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-800"
            />
          </div>

          {/* Due Date + Time */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Due Time</label>
              <input
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add task description..."
              rows={3}
              className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none text-gray-800"
            />
          </div>

          {/* Assign To */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Assign To</label>
            <div className="relative">
              <select
                value={assignTo}
                onChange={(e) => setAssignTo(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none cursor-pointer text-gray-800 bg-white"
              >
                <option value="">Assign to...</option>
                <option value="me">Me (You)</option>
                <option value="team-001">Alex Johnson</option>
                <option value="team-002">Sam Williams</option>
              </select>
              <ChevronDown
                size={14}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="text-sm font-medium text-gray-600 border border-gray-200 rounded-lg px-5 py-2 hover:bg-gray-50 cursor-pointer transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!isValid}
            className={`text-sm font-medium text-white rounded-lg px-5 py-2 transition-colors ${
              isValid ? 'bg-purple-600 hover:bg-purple-700 cursor-pointer' : 'bg-gray-300 cursor-not-allowed'
            }`}
          >
            Save Task
          </button>
        </div>
      </div>
    </div>
  );
}
