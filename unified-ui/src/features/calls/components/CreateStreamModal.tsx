import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';

interface CreateStreamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
  appliedFilters: Record<string, string>;
}

export default function CreateStreamModal({ isOpen, onClose, onSave, appliedFilters }: CreateStreamModalProps) {
  const [streamName, setStreamName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [notifications, setNotifications] = useState({ inApp: true, slack: true, email: false });
  const [sharing, setSharing] = useState({ team: false });

  if (!isOpen) return null;

  const handleSave = () => {
    if (!streamName.trim()) return;
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      onSave(streamName);
      onClose();
      setStreamName("");
    }, 1500);
  };

  const activeFiltersList = Object.entries(appliedFilters).filter(([k, v]) => v !== 'all' && v !== '' && k !== 'phraseMatchType');

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md flex flex-col">
        <div className="p-6 pb-2">
          <h2 className="text-xl font-bold font-serif text-slate-900 mb-1">Save as stream</h2>
          <p className="text-[13px] text-slate-500">Auto-collect new calls matching these filters</p>
        </div>
        
        <div className="p-6 pt-4">
          <div className="mb-6">
            <label className="block text-[11px] text-slate-500 font-bold tracking-widest uppercase mb-2">STREAM NAME</label>
            <input 
              type="text" 
              placeholder="Q4 Competitor Objections"
              value={streamName}
              onChange={e => setStreamName(e.target.value)}
              className="w-full bg-white border border-slate-300 text-slate-900 text-sm rounded-lg py-2.5 px-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="mb-6 bg-[#f8fafc] p-4 rounded-xl border border-slate-100">
            <h3 className="text-[12px] font-medium text-slate-500 mb-3">Active filters in this stream</h3>
            {activeFiltersList.length === 0 ? (
              <p className="text-[13px] text-slate-400">No filters applied.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {activeFiltersList.map(([k, v]) => (
                  <span key={k} className="px-3 py-1.5 bg-[#eff6ff] text-[#3b82f6] rounded-full text-[12px] font-medium whitespace-nowrap">
                    {k.charAt(0).toUpperCase() + k.slice(1)}: {v.charAt(0).toUpperCase() + v.slice(1)}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="mb-6">
            <h3 className="text-[11px] font-bold text-slate-500 tracking-widest uppercase mb-3">NOTIFICATIONS</h3>
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" checked={notifications.inApp} onChange={() => setNotifications(n => ({...n, inApp: !n.inApp}))} className="w-4 h-4 rounded border-slate-300 text-[#10338D] focus:ring-[#10338D] cursor-pointer" />
                <span className="text-[14px] text-slate-700 group-hover:text-slate-900">In-app notifications</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" checked={notifications.slack} onChange={() => setNotifications(n => ({...n, slack: !n.slack}))} className="w-4 h-4 rounded border-slate-300 text-[#10338D] focus:ring-[#10338D] cursor-pointer" />
                <span className="text-[14px] text-slate-700 group-hover:text-slate-900">Slack alerts</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" checked={notifications.email} onChange={() => setNotifications(n => ({...n, email: !n.email}))} className="w-4 h-4 rounded border-slate-300 text-[#10338D] focus:ring-[#10338D] cursor-pointer" />
                <span className="text-[14px] text-slate-700 group-hover:text-slate-900">Email digest</span>
              </label>
            </div>
          </div>

          <div>
            <h3 className="text-[11px] font-bold text-slate-500 tracking-widest uppercase mb-3">SHARING</h3>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input type="checkbox" checked={sharing.team} onChange={() => setSharing(s => ({...s, team: !s.team}))} className="w-4 h-4 rounded border-slate-300 text-[#10338D] focus:ring-[#10338D] cursor-pointer" />
              <span className="text-[14px] text-slate-700 group-hover:text-slate-900">Share with team members</span>
            </label>
          </div>
        </div>

        <div className="p-6 pt-2 pb-8">
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={onClose}
              className="py-2.5 text-sm font-bold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              disabled={isSaving || !streamName.trim()}
              className="py-2.5 text-sm font-bold text-white bg-[#10338D] rounded-xl hover:bg-[#0d2a75] transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
              {isSaving ? 'Saving...' : 'Save stream'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
