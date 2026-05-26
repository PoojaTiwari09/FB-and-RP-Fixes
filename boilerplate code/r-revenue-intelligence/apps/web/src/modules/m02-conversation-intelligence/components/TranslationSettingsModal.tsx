import React, { useState, useEffect } from 'react';
import { X, Globe, AlertCircle } from 'lucide-react';

interface TranslationSettingsModalProps {
  onClose: () => void;
  tenantId: string;
}

export const TranslationSettingsModal: React.FC<TranslationSettingsModalProps> = ({ onClose, tenantId }) => {
  const [defaultLanguage, setDefaultLanguage] = useState('English');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const SUPPORTED_LANGUAGES = ['English', 'Spanish', 'French', 'German', 'Japanese', 'Chinese'];

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:3001/api/v1/m02-conversation-intelligence/translate/settings`, {
        headers: { 'x-tenant-id': tenantId }
      });
      if (res.ok) {
        const data = await res.json();
        setDefaultLanguage(data.defaultLanguage || 'English');
      }
    } catch (e) {
      console.error(e);
      setError('Failed to load settings');
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess(false);
    try {
      const res = await fetch(`http://localhost:3001/api/v1/m02-conversation-intelligence/translate/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': tenantId
        },
        body: JSON.stringify({ defaultLanguage })
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => onClose(), 1500);
      } else {
        setError('Failed to save settings');
      }
    } catch (e) {
      console.error(e);
      setError('An error occurred while saving.');
    }
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-[60] bg-slate-950/80 flex items-center justify-center p-4 backdrop-blur-sm transition-all duration-300">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative animate-in fade-in zoom-in-95 duration-250">
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
              <Globe className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">Translation Settings</h3>
              <p className="text-xs text-slate-400 mt-0.5">Configure workspace-wide AI language preferences</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 bg-slate-800/50 hover:bg-slate-700 p-2 rounded-xl transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
            </div>
          ) : (
            <div className="space-y-5">
              
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wide">
                  Workspace Default Language
                </label>
                <div className="relative">
                  <select
                    value={defaultLanguage}
                    onChange={(e) => setDefaultLanguage(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-slate-300 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 appearance-none text-sm"
                  >
                    {SUPPORTED_LANGUAGES.map(lang => (
                      <option key={lang} value={lang}>{lang}</option>
                    ))}
                  </select>
                  <Globe className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  All conversations and insights will be automatically translated to this language. Selecting English defaults to the original transcript language.
                </p>
              </div>

              {error && (
                <div className="flex items-start gap-2 text-xs text-rose-400 bg-rose-500/10 p-3 rounded-xl border border-rose-500/20">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <p>{error}</p>
                </div>
              )}
              
              {success && (
                <div className="flex items-start gap-2 text-xs text-emerald-400 bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <p>Settings saved successfully.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-800/80 bg-slate-900/50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-all"
            disabled={saving}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading || saving}
            className="px-4 py-2 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 border border-indigo-500 rounded-xl transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2"
          >
            {saving ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
        
      </div>
    </div>
  );
};
