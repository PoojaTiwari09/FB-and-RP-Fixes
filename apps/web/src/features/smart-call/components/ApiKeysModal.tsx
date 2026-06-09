'use client';

import { useState, useEffect } from 'react';
import { X, Key } from 'lucide-react';
import {
  loadSmartCallApiKeys,
  saveSmartCallApiKeys,
  type SmartCallApiKeys,
} from '@smart-call/lib/api-keys';

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved?: (keys: SmartCallApiKeys) => void;
}

export default function ApiKeysModal({ open, onClose, onSaved }: Props) {
  const [groq, setGroq] = useState('');
  const [openRouter, setOpenRouter] = useState('');

  useEffect(() => {
    if (open) {
      const k = loadSmartCallApiKeys();
      setGroq(k.groq);
      setOpenRouter(k.openRouter);
    }
  }, [open]);

  if (!open) return null;

  const handleSave = () => {
    const keys = { groq: groq.trim(), openRouter: openRouter.trim() };
    saveSmartCallApiKeys(keys);
    onSaved?.(keys);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Key size={18} className="text-purple-600" />
            <h2 className="text-sm font-semibold text-gray-900">API keys</h2>
          </div>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>
        <div className="px-5 py-4 space-y-4">
          <p className="text-xs text-gray-500 leading-relaxed">
            Keys are stored in this browser only. Groq powers transcription and fast coaching;
            OpenRouter (optional) powers deeper strategic analysis.
          </p>
          <label className="block">
            <span className="text-xs font-medium text-gray-700">Groq API key</span>
            <input
              type="password"
              value={groq}
              onChange={(e) => setGroq(e.target.value)}
              placeholder="gsk_..."
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              autoComplete="off"
            />
          </label>
          <label className="block">
            <span className="text-xs font-medium text-gray-700">OpenRouter API key (optional)</span>
            <input
              type="password"
              value={openRouter}
              onChange={(e) => setOpenRouter(e.target.value)}
              placeholder="sk-or-..."
              className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
              autoComplete="off"
            />
          </label>
        </div>
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg"
          >
            Save keys
          </button>
        </div>
      </div>
    </div>
  );
}
