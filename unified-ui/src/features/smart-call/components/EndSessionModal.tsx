'use client';

interface Props {
  onCancel: () => void;
  onConfirm: () => Promise<void>;
}

export default function EndSessionModal({ onCancel, onConfirm }: Props) {
  return (
    /* Backdrop */
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      {/* Modal card */}
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6 space-y-4">
        <div className="space-y-1.5">
          <h2 className="text-base font-semibold text-gray-900">
            End this session and generate summary?
          </h2>
          <p className="text-sm text-gray-500">
            We&apos;ll analyze your conversation and provide insights to help you improve.
          </p>
        </div>

        <div className="flex items-center gap-3 pt-1">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors"
          >
            End &amp; Generate Summary
          </button>
        </div>
      </div>
    </div>
  );
}
