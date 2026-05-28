import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit, Search, Target, BarChart3 } from 'lucide-react';
import { m02ApiV1, DEV_TENANT_ID } from '../lib/api-env';

interface Tracker {
  id: string;
  name: string;
  keywords: string[];
  isActive: boolean;
  speakerScope?: string;
  timingCondition?: string;
  timingMinutes?: number;
  createdAt: string;
}

interface TrackerStats {
  totalTrackers: number;
  activeTrackers: number;
  totalDetections: number;
  detectionsThisMonth: number;
}

export const TrackerManagement: React.FC = () => {
  const [trackers, setTrackers] = useState<Tracker[]>([]);
  const [stats, setStats] = useState<TrackerStats | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [editingTracker, setEditingTracker] = useState<Tracker | null>(null);
  const [newTrackerName, setNewTrackerName] = useState('');
  const [newKeywords, setNewKeywords] = useState('');
  const [loading, setLoading] = useState(true);

  const tenantId = DEV_TENANT_ID;
  const api = m02ApiV1();

  useEffect(() => {
    fetchTrackers();
    fetchStats();
  }, []);

  const fetchTrackers = async () => {
    try {
      const res = await fetch(`${api}/conversation-intelligence/trackers`, {
        headers: { 'x-tenant-id': tenantId }
      });
      if (res.ok) {
        const data = await res.json();
        setTrackers(data);
      }
    } catch (e) {
      console.error('Failed to fetch trackers', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch(`${api}/conversation-intelligence/trackers/stats`, {
        headers: { 'x-tenant-id': tenantId }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (e) {
      console.error('Failed to fetch stats', e);
    }
  };

  const handleCreateTracker = async () => {
    if (!newTrackerName || !newKeywords) return;

    try {
      const res = await fetch(`${api}/conversation-intelligence/trackers`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-tenant-id': tenantId 
        },
        body: JSON.stringify({
          name: newTrackerName,
          keywords: newKeywords.split(',').map(k => k.trim()),
          isActive: true
        })
      });

      if (res.ok) {
        setNewTrackerName('');
        setNewKeywords('');
        setIsCreating(false);
        fetchTrackers();
        fetchStats();
      }
    } catch (e) {
      console.error('Failed to create tracker', e);
    }
  };

  const handleDeleteTracker = async (id: string) => {
    try {
      await fetch(`${api}/conversation-intelligence/trackers/${id}`, {
        method: 'DELETE',
        headers: { 'x-tenant-id': tenantId }
      });
      fetchTrackers();
      fetchStats();
    } catch (e) {
      console.error('Failed to delete tracker', e);
    }
  };

  const handleToggleActive = async (tracker: Tracker) => {
    try {
      await fetch(`${api}/conversation-intelligence/trackers/${tracker.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-tenant-id': tenantId 
        },
        body: JSON.stringify({ isActive: !tracker.isActive })
      });
      fetchTrackers();
    } catch (e) {
      console.error('Failed to update tracker', e);
    }
  };

  if (loading) {
    return <div className="text-slate-400 text-sm">Loading trackers...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-indigo-400" />
              <span className="text-xs text-slate-400">Total Trackers</span>
            </div>
            <div className="text-2xl font-bold text-slate-200">{stats.totalTrackers}</div>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Search className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-slate-400">Active</span>
            </div>
            <div className="text-2xl font-bold text-slate-200">{stats.activeTrackers}</div>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-slate-400">Total Detections</span>
            </div>
            <div className="text-2xl font-bold text-slate-200">{stats.totalDetections}</div>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-4 h-4 bg-rose-500/20 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-rose-400 rounded-full" />
              </div>
              <span className="text-xs text-slate-400">This Month</span>
            </div>
            <div className="text-2xl font-bold text-slate-200">{stats.detectionsThisMonth}</div>
          </div>
        </div>
      )}

      {/* Create Tracker Button */}
      {!isCreating && (
        <button
          onClick={() => setIsCreating(true)}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create New Tracker
        </button>
      )}

      {/* Create Tracker Form */}
      {isCreating && (
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 space-y-4">
          <h3 className="text-sm font-semibold text-slate-200">Create New Tracker</h3>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Tracker Name</label>
            <input
              type="text"
              value={newTrackerName}
              onChange={(e) => setNewTrackerName(e.target.value)}
              placeholder="e.g., Competitor Mentions"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Keywords (comma-separated)</label>
            <input
              type="text"
              value={newKeywords}
              onChange={(e) => setNewKeywords(e.target.value)}
              placeholder="e.g., Salesforce, HubSpot, Gong"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-300 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCreateTracker}
              disabled={!newTrackerName || !newKeywords}
              className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Create Tracker
            </button>
            <button
              onClick={() => {
                setIsCreating(false);
                setNewTrackerName('');
                setNewKeywords('');
              }}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Trackers List */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Your Trackers</h3>
        {trackers.length === 0 ? (
          <div className="text-center py-8 text-slate-500 text-sm">
            No trackers created yet. Create one to start tracking keywords.
          </div>
        ) : (
          trackers.map((tracker) => (
            <div
              key={tracker.id}
              className={`bg-slate-900/60 border rounded-xl p-4 transition-all ${
                tracker.isActive ? 'border-slate-800' : 'border-slate-800/50 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-semibold text-slate-200">{tracker.name}</h4>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        tracker.isActive
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-slate-700 text-slate-400'
                      }`}
                    >
                      {tracker.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {tracker.keywords.map((keyword, idx) => (
                      <span
                        key={idx}
                        className="text-xs bg-indigo-500/10 text-indigo-300 px-2 py-0.5 rounded"
                      >
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleToggleActive(tracker)}
                    className="p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                    title={tracker.isActive ? 'Deactivate' : 'Activate'}
                  >
                    {tracker.isActive ? (
                      <div className="w-4 h-4 bg-emerald-400 rounded-full" />
                    ) : (
                      <div className="w-4 h-4 bg-slate-600 rounded-full" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDeleteTracker(tracker.id)}
                    className="p-1.5 rounded-lg hover:bg-rose-500/10 text-rose-400 transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
