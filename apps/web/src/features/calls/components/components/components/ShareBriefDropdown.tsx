'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Link2, Users, FileDown, ClipboardCopy, Check, Loader2 } from 'lucide-react';
import {
  generateShareLink,
  shareInternally,
  exportBriefAsPdf,
  fetchFormattedSummary,
} from '../services/calls.service';

interface ShareBriefDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  callId: string;
  briefId: string;
  /** Position the dropdown relative to the trigger button */
  anchorRef: React.RefObject<HTMLButtonElement | null>;
}

type ActionKey = 'link' | 'internal' | 'pdf' | 'text';

export default function ShareBriefDropdown({
  isOpen,
  onClose,
  callId,
  briefId,
  anchorRef,
}: ShareBriefDropdownProps) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState<ActionKey | null>(null);
  const [done, setDone] = useState<ActionKey | null>(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [isOpen, onClose, anchorRef]);

  // Reset done state after 2s
  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => setDone(null), 2000);
    return () => clearTimeout(t);
  }, [done]);

  if (!isOpen) return null;

  const handleCopyShareableLink = async () => {
    setLoading('link');
    try {
      const result = await generateShareLink(callId, briefId);
      await navigator.clipboard.writeText(result.shareableLink);
      setDone('link');
    } catch {
      // error already logged in service
    } finally {
      setLoading(null);
    }
  };

  const handleShareInternally = async () => {
    setLoading('internal');
    try {
      await shareInternally(callId, briefId, {
        recipientEmails: [],
        message: '',
      });
      setDone('internal');
    } catch {
      // error already logged in service
    } finally {
      setLoading(null);
    }
  };

  const handleExportPdf = async () => {
    setLoading('pdf');
    try {
      const result = await exportBriefAsPdf(callId, briefId);
      if (result.downloadUrl) {
        window.open(result.downloadUrl, '_blank');
      }
      setDone('pdf');
    } catch {
      // error already logged in service
    } finally {
      setLoading(null);
    }
  };

  const handleCopyFormattedText = async () => {
    setLoading('text');
    try {
      const result = await fetchFormattedSummary(callId, briefId);
      await navigator.clipboard.writeText(result.formattedText);
      setDone('text');
    } catch {
      // error already logged in service
    } finally {
      setLoading(null);
    }
  };

  const items: {
    key: ActionKey;
    label: string;
    icon: React.ReactNode;
    onClick: () => void;
  }[] = [
    {
      key: 'link',
      label: 'Copy Shareable Link',
      icon: <Link2 className="w-4 h-4" />,
      onClick: handleCopyShareableLink,
    },
    {
      key: 'internal',
      label: 'Share Internally',
      icon: <Users className="w-4 h-4" />,
      onClick: handleShareInternally,
    },
    {
      key: 'pdf',
      label: 'Export as PDF',
      icon: <FileDown className="w-4 h-4" />,
      onClick: handleExportPdf,
    },
    {
      key: 'text',
      label: 'Copy Formatted Text',
      icon: <ClipboardCopy className="w-4 h-4" />,
      onClick: handleCopyFormattedText,
    },
  ];

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-full mt-1 z-50 rounded-lg overflow-hidden"
      style={{
        width: '220px',
        backgroundColor: '#FFFFFF',
        border: '1px solid #E5E7EB',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -1px rgba(0,0,0,0.04)',
      }}
    >
      <div className="py-1">
        {items.map((item) => {
          const isLoading = loading === item.key;
          const isDone = done === item.key;
          return (
            <button
              key={item.key}
              onClick={item.onClick}
              disabled={loading !== null}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors disabled:opacity-60"
              style={{ color: '#111827' }}
              onMouseEnter={(e) => {
                if (!loading) e.currentTarget.style.backgroundColor = '#F9FAFB';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <span style={{ color: isDone ? '#10B981' : '#6B7280', flexShrink: 0 }}>
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isDone ? (
                  <Check className="w-4 h-4" />
                ) : (
                  item.icon
                )}
              </span>
              <span className="font-medium" style={{ color: isDone ? '#10B981' : '#111827' }}>
                {isDone
                  ? item.key === 'link'
                    ? 'Link Copied!'
                    : item.key === 'internal'
                    ? 'Shared!'
                    : item.key === 'pdf'
                    ? 'Exported!'
                    : 'Copied!'
                  : item.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
