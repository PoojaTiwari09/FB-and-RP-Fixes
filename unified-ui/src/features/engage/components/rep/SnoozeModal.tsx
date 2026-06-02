'use client';

import { useState, useMemo } from 'react';
import { X, Calendar, Clock } from 'lucide-react';

interface SnoozeModalProps {
  onClose: () => void;
  onConfirm: (dateString: string) => void;
}

export default function SnoozeModal({ onClose, onConfirm }: SnoozeModalProps) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [error, setError] = useState('');

  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  // Quick Snooze Helpers
  const snoozeLaterToday = () => {
    const d = new Date();
    d.setHours(d.getHours() + 4);
    onConfirm(d.toISOString());
  };

  const snoozeTomorrowMorning = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    d.setHours(9, 0, 0, 0);
    onConfirm(d.toISOString());
  };

  const snoozeNextWeek = () => {
    const d = new Date();
    // Go to next Monday
    const day = d.getDay();
    const diff = (day === 0 ? 1 : 8 - day);
    d.setDate(d.getDate() + diff);
    d.setHours(9, 0, 0, 0);
    onConfirm(d.toISOString());
  };

  const handleCustomConfirm = () => {
    if (!date || !time) {
      setError('Please select both date and time');
      return;
    }
    const selected = new Date(`${date}T${time}`);
    if (selected <= new Date()) {
      setError('Snooze time must be in the future');
      return;
    }
    setError('');
    onConfirm(selected.toISOString());
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-100 flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Snooze Tasks</h3>
            <p className="text-xs text-gray-500 mt-0.5">Choose when these tasks should reappear</p>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 p-1.5 hover:bg-gray-100 rounded-lg transition-all cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Quick Snooze Options */}
          <div>
            <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2.5">
              Quick Snooze
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={snoozeLaterToday}
                className="flex flex-col items-center justify-center p-3 border border-gray-200 rounded-xl hover:border-purple-300 hover:bg-purple-50/30 transition-all text-left cursor-pointer group"
              >
                <Clock size={16} className="text-gray-400 group-hover:text-purple-600 mb-1" />
                <span className="text-xs font-semibold text-gray-800 group-hover:text-purple-700">Later Today</span>
                <span className="text-[10px] text-gray-400 mt-0.5">+4 hours</span>
              </button>
              <button
                type="button"
                onClick={snoozeTomorrowMorning}
                className="flex flex-col items-center justify-center p-3 border border-gray-200 rounded-xl hover:border-purple-300 hover:bg-purple-50/30 transition-all text-left cursor-pointer group"
              >
                <Calendar size={16} className="text-gray-400 group-hover:text-purple-600 mb-1" />
                <span className="text-xs font-semibold text-gray-800 group-hover:text-purple-700">Tomorrow</span>
                <span className="text-[10px] text-gray-400 mt-0.5">9:00 AM</span>
              </button>
              <button
                type="button"
                onClick={snoozeNextWeek}
                className="flex flex-col items-center justify-center p-3 border border-gray-200 rounded-xl hover:border-purple-300 hover:bg-purple-50/30 transition-all text-left cursor-pointer group"
              >
                <Calendar size={16} className="text-gray-400 group-hover:text-purple-600 mb-1" />
                <span className="text-xs font-semibold text-gray-800 group-hover:text-purple-700">Next Week</span>
                <span className="text-[10px] text-gray-400 mt-0.5">Mon 9:00 AM</span>
              </button>
            </div>
          </div>

          <div className="relative flex items-center justify-center py-1">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100"></div>
            </div>
            <span className="relative bg-white px-3 text-xs text-gray-400 font-medium">or set custom date & time</span>
          </div>

          {/* Custom Picker */}
          <div className="space-y-4">
            <div className="relative">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">
                Date
              </label>
              <div className="relative group">
                <input
                  type="date"
                  value={date}
                  min={todayStr}
                  onChange={e => {
                    setDate(e.target.value);
                    setError('');
                  }}
                  className="w-full px-4 py-2.5 pl-10 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:outline-none bg-white transition-all group-hover:border-gray-300 text-sm font-medium text-gray-900"
                />
                <Calendar size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-focus-within:text-purple-500 transition-colors" />
              </div>
            </div>

            <div className="relative">
              <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 ml-1">
                Time
              </label>
              <div className="relative group">
                <input
                  type="time"
                  value={time}
                  onChange={e => {
                    setTime(e.target.value);
                    setError('');
                  }}
                  className="w-full px-4 py-2.5 pl-10 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 focus:outline-none bg-white transition-all group-hover:border-gray-300 text-sm font-medium text-gray-900"
                />
                <Clock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none group-focus-within:text-purple-500 transition-colors" />
              </div>
            </div>

            {error && (
              <p className="text-xs font-medium text-red-500 bg-red-50 px-3 py-2 rounded-lg border border-red-100 animate-in fade-in duration-200">
                {error}
              </p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center gap-3">
          <button 
            type="button"
            onClick={onClose} 
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 hover:text-gray-700 transition-colors cursor-pointer bg-white"
          >
            Cancel
          </button>
          <button 
            type="button"
            onClick={handleCustomConfirm} 
            disabled={!date || !time}
            className="flex-1 px-4 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-semibold hover:bg-purple-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-md shadow-purple-600/10 cursor-pointer"
          >
            Snooze Tasks
          </button>
        </div>
      </div>
    </div>
  );
}
