'use client';

import { create } from 'zustand';
import { useEffect, useState } from 'react';

// ── Toast Store ─────────────────────────────────────────────────────
interface Toast {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

interface ToastStore {
  toasts: Toast[];
  add: (toast: Omit<Toast, 'id'>) => void;
  remove: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  add: (toast) => {
    const id = Math.random().toString(36).slice(2);
    set((state) => ({ toasts: [...state.toasts, { ...toast, id }] }));
    // Auto-remove after 3.5s
    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) }));
    }, 3500);
  },
  remove: (id) =>
    set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}));

// ── Helper hook ──────────────────────────────────────────────────────
export function useToast() {
  const add = useToastStore((s) => s.add);
  return {
    success: (message: string) => add({ type: 'success', message }),
    error: (message: string) => add({ type: 'error', message }),
    info: (message: string) => add({ type: 'info', message }),
  };
}

// ── Toast Container Component ────────────────────────────────────────
export default function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const remove = useToastStore((s) => s.remove);

  if (toasts.length === 0) return null;

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast ${toast.type}`}
          onClick={() => remove(toast.id)}
          style={{ cursor: 'pointer' }}
        >
          {toast.type === 'success' && '✓ '}
          {toast.type === 'error' && '✗ '}
          {toast.type === 'info' && 'ℹ '}
          {toast.message}
        </div>
      ))}
    </div>
  );
}
