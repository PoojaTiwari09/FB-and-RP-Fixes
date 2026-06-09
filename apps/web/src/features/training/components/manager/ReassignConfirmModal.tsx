'use client';

import { Loader2, RefreshCw, X } from 'lucide-react';
import { useEffect, useRef } from 'react';

interface ReassignConfirmModalProps {
  trainingTitle: string;
  repName: string;
  isLoading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ReassignConfirmModal({
  trainingTitle,
  repName,
  isLoading,
  onConfirm,
  onCancel,
}: ReassignConfirmModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) onCancel();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isLoading, onCancel]);

  // Close on overlay click
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current && !isLoading) onCancel();
  };

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      style={{ animation: 'fadeIn 150ms ease-out' }}
    >
      <div
        className="bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-md mx-4 p-6"
        style={{ animation: 'scaleIn 200ms ease-out' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center">
              <RefreshCw size={16} className="text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Reassign Training</h3>
          </div>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <p className="text-sm text-gray-600 leading-relaxed mb-6">
          Are you sure you want to reassign{' '}
          <span className="font-semibold text-gray-900">&ldquo;{trainingTitle}&rdquo;</span>{' '}
          to <span className="font-semibold text-gray-900">{repName}</span>?
          This will create a new in-progress training on their dashboard.
        </p>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium bg-gray-900 text-white hover:bg-gray-800 shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-70"
          >
            {isLoading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Reassigning…
              </>
            ) : (
              <>
                <RefreshCw size={14} />
                Confirm Reassign
              </>
            )}
          </button>
        </div>
      </div>

      {/* Inline keyframes for modal animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
