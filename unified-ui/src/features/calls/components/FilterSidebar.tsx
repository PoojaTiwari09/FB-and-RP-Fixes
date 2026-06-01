import React, { useState } from 'react';
import { Search, ChevronDown, Plus, X } from 'lucide-react';
import { FilterOptions } from '@calls/types';

interface FilterSidebarProps {
  options: FilterOptions;
  appliedFilters: Record<string, string>;
  onApply: (filters: Record<string, string>) => void;
  onClearAll: () => void;
  onClearFilter: (key: string) => void;
}

function CustomSelect({ label, options, value, onChange }: { label: string, options: any[], value: string, onChange: (v: string) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const selected = options.find((o: any) => o.value === value);

  return (
    <div className="mb-4 relative">
      <label className="block text-[13px] text-slate-700 mb-1.5 font-medium">{label}</label>
      <div 
        className="w-full bg-white border border-slate-300 text-slate-900 text-[13px] rounded-lg px-3 py-2 flex items-center justify-between cursor-pointer focus:ring-2 focus:ring-blue-500/20 shadow-sm"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>{selected?.label || 'Select...'}</span>
        <ChevronDown className="w-4 h-4 text-slate-500" />
      </div>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-slate-200 shadow-[0_4px_12px_rgba(0,0,0,0.1)] rounded-md py-1 max-h-60 overflow-y-auto">
            {options.map((opt: any) => (
              <div 
                key={opt.value}
                className={`px-3 py-2 text-[13px] cursor-pointer transition-colors ${value === opt.value ? 'bg-gray-500 text-white' : 'text-slate-800 hover:bg-slate-100'}`}
                onClick={() => { onChange(opt.value); setIsOpen(false); }}
              >
                {opt.label}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function FilterSidebar({ options, appliedFilters, onApply, onClearAll, onClearFilter }: FilterSidebarProps) {
  const handleUpdate = (key: string, value: string) => {
    onApply({
      ...appliedFilters,
      [key]: value
    });
  };

  const activeChips = Object.entries(appliedFilters).filter(([k, v]) => v !== 'all' && v !== '' && k !== 'phraseMatchType');

  const getLabelForKey = (key: string, value: string) => {
    switch (key) {
      case 'team': return `Team: ${options.teams.find(o => o.value === value)?.label}`;
      case 'rep': return `Rep: ${options.reps.find(o => o.value === value)?.label}`;
      case 'stage': return `Stage: ${options.stages.find(o => o.value === value)?.label}`;
      case 'topic': return `Topic: ${options.topics.find(o => o.value === value)?.label}`;
      case 'tracker': return `Tracker: ${options.trackers.find(o => o.value === value)?.label}`;
      case 'scorecard': return `Score: ${options.scorecardResults.find(o => o.value === value)?.label}`;
      case 'callType': return `Type: ${options.callTypes.find(o => o.value === value)?.label}`;
      case 'wordsOrPhrases': return `Words: ${value}`;
      case 'participants': return `Participant: ${value}`;
      case 'callTitle': return `Title: ${value}`;
      case 'phraseMatchType': return null;
      default: return `${key}: ${value}`;
    }
  };

  return (
    <div className="w-[280px] bg-white border-r border-slate-200 flex flex-col h-full shrink-0 z-10 shadow-[2px_0_10px_rgba(0,0,0,0.02)]">
      <div className="pt-6 pb-4 px-5 flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-900 font-serif tracking-wide">Filters</h2>
      </div>
      
      <div className="flex-1 overflow-y-auto px-5 pb-6 scrollbar-thin scrollbar-thumb-slate-200">
        
        {/* APPLIED FILTERS */}
        {activeChips.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[13px] text-slate-500 font-medium">{activeChips.filter(([k]) => k !== 'phraseMatchType').length} applied filters</span>
              <button onClick={onClearAll} className="text-[13px] text-blue-600 font-medium hover:text-blue-800 transition-colors">
                Clear
              </button>
            </div>
            <div className="flex flex-col gap-2.5">
              {activeChips.map(([key, value]) => {
                const label = getLabelForKey(key, value);
                if (!label) return null;
                return (
                  <div key={key} className="inline-flex items-center justify-between px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200 text-[13px] text-blue-800 w-full gap-3">
                    <span className="truncate" title={label}>{label}</span>
                    <button className="text-blue-500 hover:text-blue-700 shrink-0" onClick={() => onClearFilter(key)}>
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <CustomSelect label="Team" options={options.teams} value={appliedFilters.team || 'all'} onChange={(v) => handleUpdate('team', v)} />
        <CustomSelect label="Rep" options={options.reps} value={appliedFilters.rep || 'all'} onChange={(v) => handleUpdate('rep', v)} />
        <CustomSelect label="Stage" options={options.stages} value={appliedFilters.stage || 'all'} onChange={(v) => handleUpdate('stage', v)} />
        
        <div className="mb-4">
          <label className="block text-[13px] text-slate-700 mb-1.5 font-medium">Participants</label>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search for participants"
              value={appliedFilters.participants || ''}
              onChange={(e) => handleUpdate('participants', e.target.value)}
              className="w-full bg-white border border-slate-300 text-slate-900 text-sm rounded-lg py-2 pl-9 pr-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
        
        <div className="mb-4">
          <label className="block text-[13px] text-[#0f172a] mb-1.5 font-medium">Words or phrases</label>
          <div className="relative mb-3">
            <input 
              type="text" 
              placeholder="Enter words or phrases"
              value={appliedFilters.wordsOrPhrases || ''}
              onChange={(e) => handleUpdate('wordsOrPhrases', e.target.value)}
              className="w-full bg-white border border-slate-300 text-slate-900 text-[13px] rounded-lg py-2 px-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 pr-8 shadow-sm"
            />
            {appliedFilters.wordsOrPhrases && (
              <X 
                className="w-4 h-4 text-slate-400 absolute right-2.5 top-2.5 cursor-pointer hover:text-slate-600" 
                onClick={() => handleUpdate('wordsOrPhrases', '')}
              />
            )}
          </div>
          
          <div className="flex flex-col gap-1.5 pl-1">
            <div className="flex items-center justify-between text-[12px] text-slate-500 cursor-pointer hover:text-slate-900" onClick={() => handleUpdate('phraseMatchType', 'contains')}>
              <span>Results contain the term</span> {appliedFilters.phraseMatchType === 'contains' && <ChevronDown className="w-3.5 h-3.5 text-blue-600" />}
            </div>
            <div className="flex items-center justify-between text-[12px] text-slate-500 cursor-pointer hover:text-slate-900" onClick={() => handleUpdate('phraseMatchType', 'mentioned')}>
              <span>Mentioned by any party</span> {appliedFilters.phraseMatchType === 'mentioned' && <ChevronDown className="w-3.5 h-3.5 text-blue-600" />}
            </div>
            <div className="flex items-center justify-between text-[12px] text-slate-500 cursor-pointer hover:text-slate-900" onClick={() => handleUpdate('phraseMatchType', 'said_anytime')}>
              <span>Said anytime in call</span> {appliedFilters.phraseMatchType === 'said_anytime' && <ChevronDown className="w-3.5 h-3.5 text-blue-600" />}
            </div>
          </div>
        </div>
        
        <CustomSelect label="Topics" options={options.topics} value={appliedFilters.topic || 'all'} onChange={(v) => handleUpdate('topic', v)} />
        <CustomSelect label="Trackers" options={options.trackers} value={appliedFilters.tracker || 'all'} onChange={(v) => handleUpdate('tracker', v)} />
        <CustomSelect label="Scorecard Results" options={options.scorecardResults} value={appliedFilters.scorecard || 'all'} onChange={(v) => handleUpdate('scorecard', v)} />
        
        <div className="mb-4">
          <label className="block text-[13px] text-slate-700 mb-1.5 font-medium">Call title or email subject</label>
          <input 
            type="text" 
            placeholder="Enter words or phrases"
            value={appliedFilters.callTitle || ''}
            onChange={(e) => handleUpdate('callTitle', e.target.value)}
            className="w-full bg-white border border-slate-300 text-slate-900 text-[13px] rounded-lg py-2 px-3 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm"
          />
        </div>
        
        <CustomSelect label="Internal calls / Calls with customers" options={options.callTypes} value={appliedFilters.callType || 'all'} onChange={(v) => handleUpdate('callType', v)} />

        <button 
          className="w-full mt-2 py-2 border border-dashed border-[#1e3a8a] rounded-lg text-[13px] font-medium text-[#1e3a8a] hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add filters
        </button>
      </div>
    </div>
  );
}
