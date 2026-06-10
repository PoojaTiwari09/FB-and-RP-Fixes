'use client';

import { useState } from 'react';
import { X, Link2, Mail, Download, ClipboardCopy, Check, Loader2 } from 'lucide-react';
import {
  generateShareLink,
  shareInternally,
  fetchFormattedSummary,
} from '../services/calls.service';
import { exportCallBriefPdf, type CallBriefPdfData } from '../../utils/exportCallBriefPdf';

interface ShareBriefModalProps {
  isOpen: boolean;
  onClose: () => void;
  callId: string;
  briefId: string;
  pdfData?: CallBriefPdfData | null;
}

type ActionKey = 'link' | 'internal' | 'pdf' | 'text';

export default function ShareBriefModal({ isOpen, onClose, callId, briefId, pdfData }: ShareBriefModalProps) {
  const [loading, setLoading] = useState<ActionKey | null>(null);
  const [done, setDone] = useState<ActionKey | null>(null);

  if (!isOpen) return null;

  const markDone = (key: ActionKey) => {
    setDone(key);
    setTimeout(() => setDone(null), 2000);
  };

  // ── Copy Shareable Link ── POST /api/v1/conversation-intelligence/calls/:callId/briefs/:briefId/share-link
  const handleCopyShareableLink = async () => {
    setLoading('link');
    try {
      const result = await generateShareLink(callId, briefId);
      await navigator.clipboard.writeText(result.shareableLink);
      markDone('link');
    } finally {
      setLoading(null);
    }
  };

  // ── Share Internally ── POST /api/v1/conversation-intelligence/calls/:callId/briefs/:briefId/share-internal
  const handleShareInternally = async () => {
    setLoading('internal');
    try {
      await shareInternally(callId, briefId, { recipientEmails: [], message: '' });
      markDone('internal');
    } finally {
      setLoading(null);
    }
  };

  // ── Export as PDF — client-side brief with all call + analysis sections
  const handleExportPdf = async () => {
    setLoading('pdf');
    try {
      if (pdfData) {
        exportCallBriefPdf(pdfData);
      } else {
        throw new Error('Call data not loaded');
      }
      markDone('pdf');
    } finally {
      setLoading(null);
    }
  };

  // ── Copy Formatted Summary ── GET /api/v1/conversation-intelligence/calls/:callId/briefs/:briefId/formatted-summary
  const handleCopyFormattedSummary = async () => {
    setLoading('text');
    try {
      const result = await fetchFormattedSummary(callId, briefId);
      await navigator.clipboard.writeText(result.formattedText);
      markDone('text');
    } finally {
      setLoading(null);
    }
  };

  const items: {
    key: ActionKey;
    label: string;
    doneLabel: string;
    icon: React.ReactNode;
    onClick: () => void;
  }[] = [
    {
      key: 'link',
      label: 'Copy Shareable Link',
      doneLabel: 'Link Copied!',
      icon: <Link2 className="w-5 h-5" />,
      onClick: handleCopyShareableLink,
    },
    {
      key: 'internal',
      label: 'Share Internally',
      doneLabel: 'Shared!',
      icon: <Mail className="w-5 h-5" />,
      onClick: handleShareInternally,
    },
    {
      key: 'pdf',
      label: 'Export as PDF',
      doneLabel: 'PDF downloaded',
      icon: <Download className="w-5 h-5" />,
      onClick: handleExportPdf,
    },
    {
      key: 'text',
      label: 'Copy Formatted Summary',
      doneLabel: 'Copied!',
      icon: <ClipboardCopy className="w-5 h-5" />,
      onClick: handleCopyFormattedSummary,
    },
  ];

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
          maxWidth: '520px',
          backgroundColor: '#FFFFFF',
          borderRadius: '16px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-7 pt-7 pb-5"
          style={{ borderBottom: '1px solid #E5E7EB' }}
        >
          <h2 className="text-xl font-bold" style={{ color: '#111827' }}>
            Share Brief
          </h2>
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-full transition-colors"
            style={{ color: '#6B7280' }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#F3F4F6'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Option rows */}
        <div className="px-7 py-6 space-y-3">
          {items.map((item) => {
            const isLoading = loading === item.key;
            const isDone = done === item.key;
            const isDisabled = loading !== null;

            return (
              <button
                key={item.key}
                onClick={item.onClick}
                disabled={isDisabled}
                className="w-full flex items-center gap-4 px-5 py-4 rounded-xl text-left transition-colors disabled:cursor-not-allowed"
                style={{
                  backgroundColor: isDone ? '#F0FDF4' : '#F8FAFC',
                  border: isDone ? '1px solid #BBF7D0' : '1px solid transparent',
                }}
                onMouseEnter={(e) => {
                  if (!isDisabled && !isDone) {
                    e.currentTarget.style.backgroundColor = '#F1F5F9';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isDone) {
                    e.currentTarget.style.backgroundColor = '#F8FAFC';
                  }
                }}
              >
                {/* Icon */}
                <span
                  className="flex-shrink-0"
                  style={{ color: isDone ? '#10B981' : '#64748B' }}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : isDone ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    item.icon
                  )}
                </span>

                {/* Label */}
                <span
                  className="text-sm font-semibold"
                  style={{ color: isDone ? '#10B981' : '#1E293B' }}
                >
                  {isDone ? item.doneLabel : item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
