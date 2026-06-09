'use client';
import { useEffect } from 'react';
import { X } from 'lucide-react';

interface CallsToastProps {
  message: string;
  type?: 'error' | 'success' | 'info';
  onClose: () => void;
}

export default function CallsToast({
  message,
  type = 'error',
  onClose,
}: CallsToastProps) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  const colors = {
    error: 'bg-red-600',
    success: 'bg-green-600',
    info: 'bg-blue-600',
  };

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-lg text-white shadow-lg ${colors[type]}`}
    >
      <span className="text-sm">{message}</span>
      <button onClick={onClose} className="hover:opacity-75">
        <X size={16} />
      </button>
    </div>
  );
}
