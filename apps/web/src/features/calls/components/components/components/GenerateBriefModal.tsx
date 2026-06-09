'use client';

import { useState } from 'react';
import { ChevronDown, Loader2 } from 'lucide-react';

interface GenerateBriefModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (template: string, period: string) => Promise<void>;
}

const BRIEF_TEMPLATES = [
  'Executive Summary',
  'Sales Playbook',
  'Customer Success',
  'Technical Review',
  'Deal Risk Assessment',
  'Competitive Analysis',
  'Onboarding Checklist',
];

const BRIEF_PERIODS = [
  'Last 7 days',
  'Last 30 days',
  'Last 90 days',
  'Last 6 months',
  'Last 1 year',
  'All time',
];

export default function GenerateBriefModal({ isOpen, onClose, onGenerate }: GenerateBriefModalProps) {
  const [template, setTemplate] = useState('Executive Summary');
  const [period, setPeriod] = useState('Last 30 days');
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await onGenerate(template, period);
      onClose();
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    /* Overlay */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.45)' }}
      onClick={onClose}
    >
      {/* Modal card */}
      <div
        className="relative w-full flex flex-col"
        style={{
          maxWidth: '540px',
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="px-8 pt-8 pb-5"
          style={{ borderBottom: '1px solid #E5E7EB' }}
        >
          <h2 className="text-xl font-bold mb-1" style={{ color: '#111827' }}>
            Generate Brief
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: '#6B7280' }}>
            Generate an AI-powered summary using a selected brief template and time range.
          </p>
        </div>

        {/* Body */}
        <div className="px-8 py-7 space-y-6">
          {/* Brief Template */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#111827' }}>
              Brief Template <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <div className="relative">
              <select
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                className="w-full appearance-none px-4 py-3 pr-10 text-sm rounded-xl focus:outline-none transition-colors"
                style={{
                  border: '1.5px solid #D1D5DB',
                  backgroundColor: '#FFFFFF',
                  color: '#111827',
                  cursor: 'pointer',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#2563EB'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#D1D5DB'; }}
              >
                {BRIEF_TEMPLATES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <ChevronDown
                className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                style={{ color: '#6B7280' }}
              />
            </div>
          </div>

          {/* Period */}
          <div>
            <label className="block text-sm font-semibold mb-2" style={{ color: '#111827' }}>
              Period <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <div className="relative">
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="w-full appearance-none px-4 py-3 pr-10 text-sm rounded-xl focus:outline-none transition-colors"
                style={{
                  border: '1.5px solid #D1D5DB',
                  backgroundColor: '#FFFFFF',
                  color: '#111827',
                  cursor: 'pointer',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = '#2563EB'; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = '#D1D5DB'; }}
              >
                {BRIEF_PERIODS.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <ChevronDown
                className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                style={{ color: '#6B7280' }}
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-end gap-3 px-8 py-5"
          style={{ borderTop: '1px solid #E5E7EB' }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={isGenerating}
            className="px-6 py-2.5 text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
            style={{
              border: '1.5px solid #D1D5DB',
              backgroundColor: '#FFFFFF',
              color: '#374151',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F9FAFB'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#FFFFFF'; }}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-xl transition-colors disabled:opacity-60"
            style={{
              backgroundColor: '#1E3A8A',
              color: '#FFFFFF',
            }}
            onMouseEnter={(e) => { if (!isGenerating) e.currentTarget.style.backgroundColor = '#1e40af'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#1E3A8A'; }}
          >
            {isGenerating && <Loader2 className="w-4 h-4 animate-spin" />}
            {isGenerating ? 'Generating...' : 'Generate Brief'}
          </button>
        </div>
      </div>
    </div>
  );
}
