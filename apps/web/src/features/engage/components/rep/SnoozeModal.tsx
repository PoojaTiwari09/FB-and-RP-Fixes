'use client';

import { useState } from 'react';
import { X, Clock, Calendar } from 'lucide-react';

interface SnoozeModalProps {
  onClose: () => void;
  onSave: (snoozedUntil: string) => void;
  selectedCount: number;
}

export default function SnoozeModal({ onClose, onSave, selectedCount }: SnoozeModalProps) {
  const [customDate, setCustomDate] = useState('');
  const [customTime, setCustomTime] = useState('09:00');
  const [mode, setMode] = useState<'quick' | 'custom'>('quick');

  const handleQuickSnooze = (hoursOrDays: '4h' | '1d' | 'nextWeek') => {
    const now = new Date();
    if (hoursOrDays === '4h') {
      now.setHours(now.getHours() + 4);
    } else if (hoursOrDays === '1d') {
      now.setDate(now.getDate() + 1);
      now.setHours(9, 0, 0, 0); // Tomorrow at 9 AM
    } else if (hoursOrDays === 'nextWeek') {
      // Next Monday at 9 AM
      const resultDate = new Date();
      resultDate.setDate(now.getDate() + ((7 - now.getDay() + 1) % 7 || 7));
      resultDate.setHours(9, 0, 0, 0);
      onSave(resultDate.toISOString());
      return;
    }
    onSave(now.toISOString());
  };

  const handleCustomSave = () => {
    if (!customDate) return;
    const isoString = new Date(`${customDate}T${customTime || '09:00'}:00`).toISOString();
    onSave(isoString);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden border border-gray-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/50">
          <div>
            <h2 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <Clock size={16} className="text-purple-600" />
              Snooze {selectedCount} {selectedCount === 1 ? 'Task' : 'Tasks'}
            </h2>
            <p className="text-[11px] text-gray-500 mt-0.5">Choose when this task should reappear</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 cursor-pointer transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          {mode === 'quick' ? (
            <div className="space-y-2">
              <button
                onClick={() => handleQuickSnooze('4h')}
                className="w-full text-left text-xs font-semibold px-4 py-3 rounded-xl border border-gray-200 hover:bg-purple-50/40 hover:border-purple-200 transition-all flex items-center justify-between group cursor-pointer text-gray-800"
              >
                <span>Later Today</span>
                <span className="text-[10px] text-gray-400 font-normal group-hover:text-purple-500">+4 hours</span>
              </button>

              <button
                onClick={() => handleQuickSnooze('1d')}
                className="w-full text-left text-xs font-semibold px-4 py-3 rounded-xl border border-gray-200 hover:bg-purple-50/40 hover:border-purple-200 transition-all flex items-center justify-between group cursor-pointer text-gray-800"
              >
                <span>Tomorrow Morning</span>
                <span className="text-[10px] text-gray-400 font-normal group-hover:text-purple-500">9:00 AM</span>
              </button>

              <button
                onClick={() => handleQuickSnooze('nextWeek')}
                className="w-full text-left text-xs font-semibold px-4 py-3 rounded-xl border border-gray-200 hover:bg-purple-50/40 hover:border-purple-200 transition-all flex items-center justify-between group cursor-pointer text-gray-800"
              >
                <span>Next Week</span>
                <span className="text-[10px] text-gray-400 font-normal group-hover:text-purple-500">Mon 9:00 AM</span>
              </button>

              <button
                onClick={() => setMode('custom')}
                className="w-full text-center text-xs font-semibold px-4 py-2.5 mt-2 rounded-xl text-purple-600 hover:bg-purple-50 border border-transparent transition-all cursor-pointer"
              >
                Choose Custom Date & Time...
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Calendar size={11} /> Date
                </label>
                <input
                  type="date"
                  value={customDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setCustomDate(e.target.value)}
                  className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                  <Clock size={11} /> Time
                </label>
                <input
                  type="time"
                  value={customTime}
                  onChange={(e) => setCustomTime(e.target.value)}
                  className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-purple-500 text-gray-800"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={() => setMode('quick')}
                  className="text-xs font-semibold text-gray-500 hover:text-gray-700 cursor-pointer"
                >
                  &larr; Back
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={onClose}
                    className="text-xs font-semibold text-gray-500 border border-gray-200 hover:bg-gray-50 rounded-xl px-4 py-2 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCustomSave}
                    disabled={!customDate}
                    className={`text-xs font-semibold text-white rounded-xl px-4 py-2 transition-all ${
                      customDate ? 'bg-purple-600 hover:bg-purple-700 cursor-pointer' : 'bg-gray-300 cursor-not-allowed'
                    }`}
                  >
                    Snooze
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
