import React, { useState } from 'react';
import { X, Loader2 } from 'lucide-react';

interface ExportCSVModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: () => void;
}

export default function ExportCSVModal({ isOpen, onClose, onExport }: ExportCSVModalProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [fields, setFields] = useState({
    callMetadata: { callName: true, dateAndDuration: true, participants: true, account: true, recordingUrl: false },
    crmFields: { dealStage: true, outcome: true, dealAmount: true, opportunityOwner: false },
    trackerData: { trackerNames: true, trackerCounts: true, trackerMoments: false },
    interactionMetrics: { talkRatio: true, topicDurations: true, questionsAsked: false, patienceDuringCall: false }
  });

  if (!isOpen) return null;

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      onExport(); // notifies success
      onClose();
    }, 1500); // simulate API
  };

  const toggleField = (group: keyof typeof fields, field: string) => {
    setFields(prev => ({
      ...prev,
      [group]: { ...prev[group], [field]: !prev[group][field as keyof typeof prev[typeof group]] }
    }));
  };

  const renderGroup = (title: string, groupKey: keyof typeof fields, options: { key: string, label: string }[]) => (
    <div className="flex-1 min-w-[200px] mb-6">
      <h3 className="text-[11px] font-bold text-slate-500 tracking-widest uppercase mb-4">{title}</h3>
      <div className="space-y-3">
        {options.map(opt => (
          <label key={opt.key} className="flex items-center gap-3 cursor-pointer group">
            <input 
              type="checkbox" 
              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              checked={fields[groupKey][opt.key as keyof typeof fields[typeof groupKey]]}
              onChange={() => toggleField(groupKey, opt.key)}
            />
            <span className="text-[14px] text-slate-700 group-hover:text-slate-900">{opt.label}</span>
          </label>
        ))}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between shrink-0">
          <h2 className="text-xl font-bold font-serif text-slate-900">Export CSV</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-full text-slate-500 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto flex-1">
          <div className="flex flex-wrap gap-x-8 gap-y-2">
            {renderGroup('Call Metadata', 'callMetadata', [
              { key: 'callName', label: 'Call name' },
              { key: 'dateAndDuration', label: 'Date & duration' },
              { key: 'participants', label: 'Participants' },
              { key: 'account', label: 'Account' },
              { key: 'recordingUrl', label: 'Recording URL' },
            ])}
            {renderGroup('CRM Fields', 'crmFields', [
              { key: 'dealStage', label: 'Deal stage' },
              { key: 'outcome', label: 'Outcome' },
              { key: 'dealAmount', label: 'Deal amount' },
              { key: 'opportunityOwner', label: 'Opportunity owner' },
            ])}
            {renderGroup('Tracker Data', 'trackerData', [
              { key: 'trackerNames', label: 'Tracker names' },
              { key: 'trackerCounts', label: 'Tracker counts' },
              { key: 'trackerMoments', label: 'Tracker moments (time)' },
            ])}
            {renderGroup('Interaction Metrics', 'interactionMetrics', [
              { key: 'talkRatio', label: 'Talk ratio' },
              { key: 'topicDurations', label: 'Topic durations' },
              { key: 'questionsAsked', label: 'Questions asked' },
              { key: 'patienceDuringCall', label: 'Patience during call' },
            ])}
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-xl flex flex-col gap-4 shrink-0">
          <p className="text-[13px] text-slate-500">
            Export will be processed async. You'll receive an in-app notification when ready to download.
          </p>
          <div className="flex justify-end gap-3">
            <button 
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={handleExport}
              disabled={isExporting}
              className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              {isExporting && <Loader2 className="w-4 h-4 animate-spin" />}
              {isExporting ? 'Starting...' : 'Start export'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
