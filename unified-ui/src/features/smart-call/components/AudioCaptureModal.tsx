'use client';

import { useState } from 'react';
import { X, Monitor, Mic, Volume2 } from 'lucide-react';

export type AudioCapturePrefs = {
  includeSystemAudio: boolean;
  includeMicrophone: boolean;
};

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (prefs: AudioCapturePrefs) => void;
}

export default function AudioCaptureModal({ open, onClose, onConfirm }: Props) {
  const [includeSystemAudio, setIncludeSystemAudio] = useState(true);
  const [includeMicrophone, setIncludeMicrophone] = useState(true);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Share audio for Live Assist</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={18} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <p className="text-sm text-gray-600 leading-relaxed">
            Next, your browser will ask you to pick a <strong>tab</strong>, <strong>window</strong>, or{' '}
            <strong>entire screen</strong>. Choose what to capture below, then enable the matching
            options in the browser dialog.
          </p>

          <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50">
            <input
              type="checkbox"
              checked={includeSystemAudio}
              onChange={(e) => setIncludeSystemAudio(e.target.checked)}
              className="mt-1"
            />
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
                <Volume2 size={16} className="text-blue-600" />
                System / tab audio
              </div>
              <p className="text-xs text-gray-500 mt-1">
                For a <strong>browser tab</strong>, check <strong>“Share tab audio”</strong> in the picker.
                For a <strong>window</strong>, enable audio if shown. For <strong>entire screen</strong>, enable
                <strong> “Share system audio”</strong>.
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50">
            <input
              type="checkbox"
              checked={includeMicrophone}
              onChange={(e) => setIncludeMicrophone(e.target.checked)}
              className="mt-1"
            />
            <div>
              <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
                <Mic size={16} className="text-green-600" />
                My microphone
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Mixes your voice with shared audio (recommended for full-screen share). You may be
                prompted to allow microphone access.
              </p>
            </div>
          </label>

          {!includeSystemAudio && !includeMicrophone && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
              Select at least one audio source, or transcription will not work.
            </p>
          )}

          <div className="flex items-start gap-2 text-xs text-gray-400 bg-gray-50 rounded-lg px-3 py-2">
            <Monitor size={14} className="shrink-0 mt-0.5" />
            <span>
              Tip: Sharing a <strong>Chrome tab</strong> with Meet/Teams and tab audio enabled gives the
              clearest customer audio.
            </span>
          </div>
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
            disabled={!includeSystemAudio && !includeMicrophone}
            onClick={() =>
              onConfirm({ includeSystemAudio, includeMicrophone })
            }
            className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg disabled:opacity-50"
          >
            Continue to browser picker
          </button>
        </div>
      </div>
    </div>
  );
}
