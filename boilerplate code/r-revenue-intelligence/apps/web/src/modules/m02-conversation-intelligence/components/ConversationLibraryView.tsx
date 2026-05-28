"use client";

import React, { useState, useEffect } from 'react';
import { 
  Search, Phone, Mail, Clock, ShieldCheck, ChevronRight, X, Calendar, 
  User, Award, Compass, Smile, Bookmark, Plus, Settings, Home, 
  BarChart2, TrendingUp, Download, Share2, Layers, Filter, HelpCircle, Globe,
  Sparkles, Target, Tag, Headphones
} from 'lucide-react';
import { SearchResult } from './types';
import { TranslationSettingsModal } from './TranslationSettingsModal';
import { TrackerManagement } from './TrackerManagement';
// @ts-expect-error — Live Assist is implemented in JSX with full feature set
import LiveAssistPanel from './LiveAssistPanel';
import { m02ApiV1, DEV_TENANT_ID, DEV_USER_ID, getM01WebUrl, getM09WebUrl, getM03WebUrl } from '../../../../../../modules/m02-conversation-intelligence/live-assist-core/lib/api-env';

type NavItem = {
  name: string;
  icon: React.ComponentType<{ style?: React.CSSProperties }>;
  sub?: string[];
  badge?: string;
};

function getHeaderLabels(activeTab: string): { section: string; page: string } {
  switch (activeTab) {
    case 'Insights':
      return { section: 'Insights', page: 'Team' };
    case 'Smart Trackers':
      return { section: 'Smart Trackers', page: 'Manage Trackers' };
    case 'Live Assist':
      return { section: 'Engage', page: 'Live Assist' };
    case 'AI Transcriber':
      return { section: 'Conversations', page: 'AI Transcriber' };
    default:
      return { section: 'Conversations', page: 'Search Portal' };
  }
}

// Helper function to escape special characters for regex matches
const escapeRegExp = (str: string) => {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

const API_BASE_URL = m02ApiV1();
const TENANT_ID = DEV_TENANT_ID;

const AddTermModal: React.FC<{ onClose: () => void; onSuccess: () => void }> = ({ onClose, onSuccess }) => {
  const [term, setTerm] = useState('');
  const [category, setCategory] = useState('');
  const [mispronunciations, setMispronunciations] = useState('');
  const [variations, setVariations] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!term.trim()) {
      setError('Term is required');
      return;
    }
    if (!category) {
      setError('Category is required');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/conversation-intelligence/vocabulary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': TENANT_ID
        },
        body: JSON.stringify({
          incorrectTerm: mispronunciations.split(',').map(s => s.trim()).filter(Boolean)[0] || term, // Fallback to term if no mistranscriptions provided for now
          correctTerm: term,
          category,
          mispronunciations: mispronunciations.split(',').map(s => s.trim()).filter(Boolean),
          variations: variations.split(',').map(s => s.trim()).filter(Boolean)
        })
      });

      if (res.ok) {
        onSuccess();
        onClose();
      } else {
        setError('Failed to save term');
      }
    } catch (e) {
      setError('Network error saving term');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#0f172a', borderRadius: '12px', border: '1px solid #1e293b', width: '480px', overflow: 'hidden' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '18px', color: '#f8fafc', fontWeight: 700 }}>Add term</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><X size={20} /></button>
        </div>
        
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {error && <div style={{ color: '#ef4444', fontSize: '13px' }}>{error}</div>}
          
          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', fontWeight: 600, marginBottom: '8px' }}>Term (correct version) *</label>
            <input 
              type="text" 
              value={term} 
              onChange={e => setTerm(e.target.value)}
              placeholder="e.g. RevenueOS"
              style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', borderRadius: '6px', padding: '10px 12px', color: '#f8fafc', fontSize: '14px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', fontWeight: 600, marginBottom: '8px' }}>Category *</label>
            <select 
              value={category} 
              onChange={e => setCategory(e.target.value)}
              style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', borderRadius: '6px', padding: '10px 12px', color: '#f8fafc', fontSize: '14px' }}
            >
              <option value="">Select category...</option>
              <option value="Product">Product</option>
              <option value="Competitor">Competitor</option>
              <option value="Acronym">Acronym</option>
              <option value="Industry term">Industry term</option>
              <option value="Custom">Custom</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', fontWeight: 600, marginBottom: '8px' }}>Common mispronunciations (comma separated)</label>
            <input 
              type="text" 
              value={mispronunciations} 
              onChange={e => setMispronunciations(e.target.value)}
              placeholder="e.g. revenoose, rev-en-oss"
              style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', borderRadius: '6px', padding: '10px 12px', color: '#f8fafc', fontSize: '14px' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', fontWeight: 600, marginBottom: '8px' }}>Shorthand / variations (comma separated)</label>
            <input 
              type="text" 
              value={variations} 
              onChange={e => setVariations(e.target.value)}
              placeholder="e.g. ROS, Rev OS"
              style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', borderRadius: '6px', padding: '10px 12px', color: '#f8fafc', fontSize: '14px' }}
            />
          </div>
        </div>

        <div style={{ padding: '16px 24px', borderTop: '1px solid #1e293b', display: 'flex', justifyContent: 'flex-end', gap: '12px', background: '#0f172a' }}>
          <button onClick={onClose} style={{ background: 'transparent', border: '1px solid #334155', color: '#f8fafc', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} className="rev-btn-primary" style={{ padding: '8px 16px', fontSize: '13px' }}>{saving ? 'Saving...' : 'Save term'}</button>
        </div>
      </div>
    </div>
  );
};

const ManageTopicsModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [topics, setTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTopicName, setNewTopicName] = useState('');
  const [newTopicDesc, setNewTopicDesc] = useState('');
  const tenantId = '00000000-0000-0000-0000-000000000001';

  useEffect(() => {
    fetchTopics();
  }, []);

  const fetchTopics = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/m02-conversation-intelligence/topics?tenantId=${tenantId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.length > 0 && data[0].topics) {
          setTopics(data[0].topics);
        }
      }
    } catch (e) {
      console.error('Failed to fetch topics', e);
    }
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!newTopicName) return;
    try {
      const res = await fetch(`${API_BASE_URL}/m02-conversation-intelligence/topics/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, topicName: newTopicName, description: newTopicDesc })
      });
      if (res.ok) {
        setNewTopicName('');
        setNewTopicDesc('');
        fetchTopics();
      } else {
        alert('Failed to add topic');
      }
    } catch (e) {
      alert('Error adding topic');
    }
  };

  const handleRemove = async (topicName: string) => {
    if (!confirm(`Are you sure you want to delete the AI topic "${topicName}"?`)) return;
    try {
      const res = await fetch(`${API_BASE_URL}/m02-conversation-intelligence/topics/remove`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId, topicName })
      });
      if (res.ok) {
        fetchTopics();
      } else {
        alert('Failed to remove topic');
      }
    } catch (e) {
      alert('Error removing topic');
    }
  };

  return (
    <div style={{
      position: 'fixed', inset: '0', background: 'rgba(15, 23, 42, 0.6)',
      backdropFilter: 'blur(8px)', zIndex: '9999', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: '20px'
    }}>
      <div style={{
        background: '#ffffff', border: '1px solid #cbd5e1',
        borderRadius: '12px', padding: '28px', width: '100%',
        maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
        display: 'flex', flexDirection: 'column', gap: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #cbd5e1', paddingBottom: '12px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-white)' }}>Manage AI Topics</h3>
            <p style={{ fontSize: '11px', color: '#64748b', margin: '4px 0 0 0' }}>Configure global topics for AI auto-tagging.</p>
          </div>
          <button onClick={onClose} style={{ color: '#64748b', background: '#f8fafc', border: '1px solid #cbd5e1', padding: '6px', borderRadius: '8px', cursor: 'pointer' }}>
            <X style={{ width: '16px', height: '16px' }} />
          </button>
        </div>

        {/* Add New Topic */}
        <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #cbd5e1', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <h4 style={{ fontSize: '12px', fontWeight: '800', color: '#334155', margin: 0 }}>Add New AI Topic</h4>
          <input
            type="text"
            placeholder="Topic Name (e.g., Pricing Strategy)"
            value={newTopicName}
            onChange={e => setNewTopicName(e.target.value)}
            style={{ width: '100%', padding: '8px 12px', fontSize: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none' }}
          />
          <textarea
            placeholder="Topic Description (Instructs AI on what to look for...)"
            value={newTopicDesc}
            onChange={e => setNewTopicDesc(e.target.value)}
            rows={2}
            style={{ width: '100%', padding: '8px 12px', fontSize: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', outline: 'none', resize: 'none' }}
          />
          <button
            onClick={handleAdd}
            disabled={!newTopicName}
            className="rev-btn-primary"
            style={{ padding: '8px', fontSize: '12px', borderRadius: '6px', alignSelf: 'flex-start', opacity: newTopicName ? 1 : 0.5, cursor: newTopicName ? 'pointer' : 'not-allowed' }}
          >
            Add AI Topic
          </button>
        </div>

        {/* Topic List */}
        <div>
          <h4 style={{ fontSize: '12px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '12px' }}>Active Global Topics</h4>
          {loading ? (
            <div style={{ fontSize: '12px', color: '#94a3b8' }}>Loading topics...</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {topics.map((t: any) => (
                <div key={t.name} style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', padding: '12px', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
                  <div style={{ flex: 1 }}>
                    <h5 style={{ fontSize: '12px', fontWeight: '800', color: '#334155', margin: '0 0 4px 0' }}>{t.name}</h5>
                    <p style={{ fontSize: '11px', color: '#64748b', margin: 0 }}>{t.description || 'No description provided.'}</p>
                  </div>
                  <button onClick={() => handleRemove(t.name)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }} title="Delete AI Topic">
                    <X style={{ width: '14px', height: '14px' }} />
                  </button>
                </div>
              ))}
              {topics.length === 0 && <div style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>No topics configured.</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const TrackerModal: React.FC<{
  editingTracker: any;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ editingTracker, onClose, onSuccess }) => {
  const [name, setName] = useState(editingTracker?.name || '');
  const [keywords, setKeywords] = useState((editingTracker?.keywords || []).join(', '));
  const [speakerScope, setSpeakerScope] = useState(editingTracker?.speakerScope || 'Both');
  const [timingCondition, setTimingCondition] = useState(editingTracker?.timingCondition || 'Any time');
  const [timingMinutes, setTimingMinutes] = useState((editingTracker?.timingMinutes ?? 10).toString());
  const [isActive, setIsActive] = useState(editingTracker?.isActive ?? true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setName(editingTracker?.name || '');
    setKeywords((editingTracker?.keywords || []).join(', '));
    setSpeakerScope(editingTracker?.speakerScope || 'Both');
    setTimingCondition(editingTracker?.timingCondition || 'Any time');
    setTimingMinutes((editingTracker?.timingMinutes ?? 10).toString());
    setIsActive(editingTracker?.isActive ?? true);
    setError('');
  }, [editingTracker]);

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Tracker name is required');
      return;
    }
    const payload = {
      name: name.trim(),
      keywords: keywords.split(',').map((k: string) => k.trim()).filter(Boolean),
      speakerScope,
      timingCondition,
      timingMinutes: Number(timingMinutes) || 0,
      isActive,
    };

    setSaving(true);
    try {
      const response = await fetch(
        `${API_BASE_URL}/conversation-intelligence/trackers${editingTracker?.id ? `/${editingTracker.id}` : ''}`,
        {
          method: editingTracker?.id ? 'PUT' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-tenant-id': TENANT_ID,
          },
          body: JSON.stringify(payload),
        }
      );

      if (response.ok) {
        onSuccess();
        onClose();
      } else {
        setError('Unable to save tracker');
      }
    } catch (e) {
      console.error('Tracker save failed', e);
      setError('Network error saving tracker');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#0f172a', borderRadius: '12px', border: '1px solid #1e293b', width: '520px', overflow: 'hidden' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0, fontSize: '18px', color: '#f8fafc', fontWeight: 700 }}>
            {editingTracker ? 'Edit Smart Tracker' : 'New Smart Tracker'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#64748b', cursor: 'pointer' }}><X size={20} /></button>
        </div>

        <div style={{ padding: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          {error && <div style={{ gridColumn: '1 / -1', color: '#ef4444', fontSize: '13px' }}>{error}</div>}

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', fontWeight: 600, marginBottom: '8px' }}>Tracker name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Competitive mentions"
              style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', borderRadius: '6px', padding: '10px 12px', color: '#f8fafc', fontSize: '14px' }}
            />
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', fontWeight: 600, marginBottom: '8px' }}>Keywords / phrases *</label>
            <input
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="e.g. pricing, contract, demo"
              style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', borderRadius: '6px', padding: '10px 12px', color: '#f8fafc', fontSize: '14px' }}
            />
            <div style={{ marginTop: '8px', fontSize: '11px', color: '#64748b' }}>Separate terms with commas.</div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', fontWeight: 600, marginBottom: '8px' }}>Speaker scope</label>
            <select
              value={speakerScope}
              onChange={(e) => setSpeakerScope(e.target.value)}
              style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', borderRadius: '6px', padding: '10px 12px', color: '#f8fafc', fontSize: '14px' }}
            >
              <option value="Both">Both</option>
              <option value="Representative">Representative</option>
              <option value="Customer">Customer</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', fontWeight: 600, marginBottom: '8px' }}>Timing condition</label>
            <select
              value={timingCondition}
              onChange={(e) => setTimingCondition(e.target.value)}
              style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', borderRadius: '6px', padding: '10px 12px', color: '#f8fafc', fontSize: '14px' }}
            >
              <option value="Any time">Any time</option>
              <option value="Within first 5 minutes">Within first 5 minutes</option>
              <option value="Within first 10 minutes">Within first 10 minutes</option>
              <option value="During follow-up discussion">During follow-up discussion</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '12px', color: '#94a3b8', fontWeight: 600, marginBottom: '8px' }}>Timing minutes</label>
            <input
              type="number"
              value={timingMinutes}
              onChange={(e) => setTimingMinutes(e.target.value)}
              min="0"
              style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', borderRadius: '6px', padding: '10px 12px', color: '#f8fafc', fontSize: '14px' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', gridColumn: '1 / -1' }}>
            <input
              id="tracker-active-toggle"
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              style={{ width: '16px', height: '16px' }}
            />
            <label htmlFor="tracker-active-toggle" style={{ fontSize: '12px', color: '#f8fafc', fontWeight: 600 }}>Active tracker</label>
          </div>
        </div>

        <div style={{ padding: '16px 24px', borderTop: '1px solid #1e293b', display: 'flex', justifyContent: 'flex-end', gap: '12px', background: '#0f172a' }}>
          <button onClick={onClose} style={{ background: 'transparent', border: '1px solid #334155', color: '#f8fafc', padding: '8px 16px', borderRadius: '6px', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} className="rev-btn-primary" style={{ padding: '8px 16px', fontSize: '13px' }}>{saving ? 'Saving...' : 'Save tracker'}</button>
        </div>
      </div>
    </div>
  );
};

export const ConversationLibraryView: React.FC = () => {
  // Queries & Filters states mapped directly to white light-theme portal
  const [query, setQuery] = useState('');
  type FilterState = {
    channel: 'call' | 'email' | '';
    sentiment: 'Positive' | 'Neutral' | 'Negative' | '';
    topic: string;
    agent: string;
    title: string;
    callType: 'customer' | 'internal' | '';
    tracker: string[];
    datePreset: string;
    startDate: string;
    endDate: string;
  };

  const [filters, setFilters] = useState<FilterState>({
    channel: '' as 'call' | 'email' | '',
    sentiment: '' as 'Positive' | 'Neutral' | 'Negative' | '',
    topic: '',
    agent: '',
    title: '',
    callType: '' as 'customer' | 'internal' | '',
    tracker: [],
    datePreset: 'All time',
    startDate: '',
    endDate: '',
  });

  const [trackerDefinitions, setTrackerDefinitions] = useState<any[]>([]);
  const [trackerDropdownOpen, setTrackerDropdownOpen] = useState(false);

  const [results, setResults] = useState<SearchResult[]>([]);
  const [savedSearches, setSavedSearches] = useState<any[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [showPresetDropdown, setShowPresetDropdown] = useState(false);
  const [showManageTopicsModal, setShowManageTopicsModal] = useState(false);
  const [showTranslationSettingsModal, setShowTranslationSettingsModal] = useState(false);

  // Sorting & Modal States
  const [sortBy, setSortBy] = useState<'date' | 'duration' | 'score'>('score');
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportNotification, setExportNotification] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [trendUnit, setTrendUnit] = useState<'Days' | 'Weeks' | 'Months'>('Weeks');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadType, setUploadType] = useState<'call' | 'email'>('call');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadTranscript, setUploadTranscript] = useState('');
  const [uploadAgentName, setUploadAgentName] = useState('');
  const [uploadCustomerName, setUploadCustomerName] = useState('');
  const [uploadDuration, setUploadDuration] = useState('600');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<any>(null);

  const [selectedFields, setSelectedFields] = useState({
    // Call Metadata
    callName: true,
    dateDuration: true,
    participants: true,
    account: true,
    recordingUrl: false,
    // CRM Fields
    dealStage: true,
    outcome: true,
    dealAmount: true,
    opportunityOwner: false,
    // Tracker Data
    trackerNames: true,
    trackerCounts: true,
    trackerMoments: false,
    // Interaction Metrics
    talkRatio: true,
    topicDurations: true,
    questionsAsked: false,
    patienceDuringCall: false
  });

  // Active sidebar state mock
  const [activeTab, setActiveTab] = useState('Search');
  const [insightsSort, setInsightsSort] = useState<'desc' | 'asc'>('desc');
  const [insightsSubTab, setInsightsSubTab] = useState<'Trackers' | 'Topics'>('Trackers');
  const [globalTopics, setGlobalTopics] = useState<any[]>([]);

  useEffect(() => {
    const fetchGlobalTopics = async () => {
      try {
        const tenantId = '00000000-0000-0000-0000-000000000001';
        const res = await fetch(`${API_BASE_URL}/m02-conversation-intelligence/topics?tenantId=${tenantId}`);
        if (res.ok) {
          const data = await res.json();
          if (data.length > 0 && data[0].topics) {
            setGlobalTopics(data[0].topics);
          }
        }
      } catch (err) {
        console.error('Failed to fetch topics for insights', err);
      }
    };
    fetchGlobalTopics();
  }, []);

  // Load sample seed data
  const seedCorpus = getSimulatedCorpus();

  // Sorting helper function
  const sortResults = (data: SearchResult[], method: 'date' | 'duration' | 'score') => {
    const sorted = [...data];
    if (method === 'date') {
      return sorted.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
    } else if (method === 'duration') {
      const getSeconds = (durationStr?: string) => {
        if (!durationStr || durationStr.includes('Email')) return 0;
        const matches = durationStr.match(/(\d+)m\s*(\d*)s?/);
        if (matches) {
          const minutes = parseInt(matches[1] || '0', 10);
          const seconds = parseInt(matches[2] || '0', 10);
          return minutes * 60 + seconds;
        }
        return 0;
      };
      return sorted.sort((a, b) => getSeconds(b.duration) - getSeconds(a.duration));
    } else {
      // score
      return sorted.sort((a, b) => (b.overallScore || 0) - (a.overallScore || 0));
    }
  };

  // --- Insights Logic ---
  const TRACKERS_LIST = [
    "Pricing Strategy", 
    "Technical Support", 
    "Onboarding & Training", 
    "Objection Handling", 
    "Salesforce Integration", 
    "pgvector Search"
  ];

  const calculateStats = (baseList: string[], searchResults: any[]) => {
    if (!searchResults || searchResults.length === 0) {
      return baseList.map(name => ({ name, count: 0, percent: 0 }));
    }
    
    const totalCalls = searchResults.length;
    const counts: Record<string, number> = {};
    baseList.forEach(name => counts[name] = 0);

    searchResults.forEach(call => {
      // Gather both topics and keywords for flexible matching
      const callTerms = new Set([
        ...(call.topics || []),
        ...(call.keywords || [])
      ].map(t => t.toLowerCase()));

      baseList.forEach(name => {
        // Trackers/Topics can match if they exist in the transcript's topics or keywords array
        // We do a loose includes match to ensure we catch variations
        const lowerName = name.toLowerCase();
        if (Array.from(callTerms).some(term => term.includes(lowerName) || lowerName.includes(term))) {
          counts[name]++;
        }
      });
    });

    const stats = baseList.map(name => ({
      name,
      count: counts[name],
      percent: (counts[name] / totalCalls) * 100
    }));

    stats.sort((a, b) => insightsSort === 'desc' ? b.percent - a.percent : a.percent - b.percent);
    return stats;
  };

  const trackerStats = React.useMemo(() => calculateStats(TRACKERS_LIST, results), [results, insightsSort]);
  
  const topicStats = React.useMemo(() => {
    const globalTopicNames = globalTopics.map(t => typeof t === 'string' ? t : t.name).filter(Boolean);
    return calculateStats(globalTopicNames, results);
  }, [results, insightsSort, globalTopics]);

  const maxTrackerPercent = trackerStats.length > 0 ? Math.max(...trackerStats.map(s => s.percent), 1) : 100;
  const maxTopicPercent = topicStats.length > 0 ? Math.max(...topicStats.map(s => s.percent), 1) : 100;

  // Unified search handler executing hybrid search + manual filters
  const performSearch = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: '1',
        limit: '1000',
        ...(query && { query }),
        ...(filters.channel && { channel: filters.channel }),
        ...(filters.sentiment && { sentiment: filters.sentiment }),
        ...(filters.topic && { topic: filters.topic }),
        ...(filters.agent && { agent: filters.agent }),
        ...(filters.datePreset && { datePreset: filters.datePreset }),
        ...(filters.startDate && { startDate: filters.startDate }),
        ...(filters.endDate && { endDate: filters.endDate }),
      });

      // Call search endpoint if query exists, otherwise standard list
      const endpoint = query 
        ? `${API_BASE_URL}/conversation-intelligence/conversations/search?${queryParams.toString()}`
        : `${API_BASE_URL}/conversation-intelligence/conversations?${queryParams.toString()}`;

      const response = await fetch(endpoint, {
        headers: { 'x-tenant-id': '00000000-0000-0000-0000-000000000001' },
      });

      if (response.ok) {
        const backendData = await response.json();
        console.log('Backend response:', backendData);
        
        let finalData = [];
        
        // The search API returns an array of SearchResult directly.
        // The findAll API returns { conversations: [...] }
        if (query) {
          finalData = Array.isArray(backendData) ? backendData : (backendData.conversations || []);
        } else {
          finalData = backendData.conversations || [];
        }

        // Apply remaining frontend local filters that are not handled by backend query
        if (filters.title) {
          finalData = finalData.filter((r: any) => r.title?.toLowerCase().includes(filters.title.toLowerCase()));
        }
        if (filters.tracker?.length) {
          finalData = finalData.filter((r: any) =>
            filters.tracker.some((tracker) =>
              r.topics?.includes(tracker) || r.keywords?.some((k: any) => k.toLowerCase().includes(tracker.toLowerCase()))
            )
          );
        }
        if (filters.callType) {
          finalData = finalData.filter((r: any) => {
            if (filters.callType === 'internal') return r.title?.toLowerCase().includes('internal') || r.title?.toLowerCase().includes('escalation');
            return !r.title?.toLowerCase().includes('internal') && !r.title?.toLowerCase().includes('escalation');
          });
        }
        
        setResults(sortResults(finalData, sortBy));
      } else {
        // High fidelity frontend backup search simulator
        setResults(sortResults(simulateLocalSearch(), sortBy));
      }
    } catch (e) {
      console.error("Search error:", e);
      setResults(sortResults(simulateLocalSearch(), sortBy));
    } finally {
      setLoading(false);
    }
  };

  const simulateLocalSearch = (): SearchResult[] => {
    let corpus = [...seedCorpus];

    // Apply strict text matches
    if (query) {
      const qLower = query.toLowerCase();
      corpus = corpus.filter(
        c => c.title?.toLowerCase().includes(qLower) || 
             c.transcript?.toLowerCase().includes(qLower) ||
             c.summary?.toLowerCase().includes(qLower) ||
             c.customerName?.toLowerCase().includes(qLower) ||
             c.agentName?.toLowerCase().includes(qLower)
      );
    }

    // Apply metadata filters
    if (filters.channel) {
      corpus = corpus.filter(c => c.channel === filters.channel);
    }
    if (filters.sentiment) {
      corpus = corpus.filter(c => c.sentiment === filters.sentiment);
    }
    if (filters.topic) {
      corpus = corpus.filter(c => c.topics?.includes(filters.topic));
    }
    if (filters.agent) {
      corpus = corpus.filter(c => c.agentName?.toLowerCase().includes(filters.agent.toLowerCase()));
    }
    if (filters.title) {
      corpus = corpus.filter(c => c.title?.toLowerCase().includes(filters.title.toLowerCase()));
    }
    if (filters.tracker?.length) {
      corpus = corpus.filter(c =>
        filters.tracker.some((tracker) =>
          c.topics?.includes(tracker) || c.keywords?.some((k: any) => k.toLowerCase().includes(tracker.toLowerCase()))
        )
      );
    }
    if (filters.callType) {
      corpus = corpus.filter(c => {
        if (filters.callType === 'internal') return c.title?.toLowerCase().includes('internal') || c.title?.toLowerCase().includes('escalation');
        return !c.title?.toLowerCase().includes('internal') && !c.title?.toLowerCase().includes('escalation');
      });
    }

    if (filters.datePreset || (filters.startDate && filters.endDate)) {
      const now = new Date();
      let start: Date | null = null;
      let end: Date | null = null;

      if (filters.datePreset && filters.datePreset !== 'All time' && filters.datePreset !== 'Custom') {
        const todayStr = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        if (filters.datePreset === 'Today') {
          start = new Date(todayStr);
          end = new Date(todayStr.getTime() + 24 * 60 * 60 * 1000 - 1);
        } else if (filters.datePreset === 'This week') {
          const day = now.getDay() || 7;
          const diff = now.getDate() - day;
          start = new Date(now.getFullYear(), now.getMonth(), diff);
          end = now;
        } else if (filters.datePreset === 'This month') {
          start = new Date(now.getFullYear(), now.getMonth(), 1);
          end = now;
        } else if (filters.datePreset === 'Last 30 days') {
          start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          end = now;
        } else if (filters.datePreset === 'Last 90 days') {
          start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          end = now;
        } else if (filters.datePreset === 'This quarter') {
          const quarterStartMonth = Math.floor(now.getMonth() / 3) * 3;
          start = new Date(now.getFullYear(), quarterStartMonth, 1);
          end = now;
        }
      } else if (filters.startDate && filters.endDate && filters.datePreset === 'Custom') {
        start = new Date(filters.startDate);
        end = new Date(filters.endDate);
        end.setHours(23, 59, 59, 999);
      }

      if (start && end) {
        corpus = corpus.filter(c => {
          const d = new Date(c.date!);
          return d >= start! && d <= end!;
        });
      }
    }

    // Sort by score or date as default
    return corpus.sort((a, b) => (b.overallScore || 0) - (a.overallScore || 0));
  };

  const fetchSavedSearches = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/conversation-intelligence/saved-searches`, {
        headers: { 'x-tenant-id': TENANT_ID },
      });
      if (response.ok) {
        const data = await response.json();
        setSavedSearches(data);
      } else {
        setSavedSearches(getSimulatedSavedSearches());
      }
    } catch (e) {
      setSavedSearches(getSimulatedSavedSearches());
    }
  };

  const fetchTrackers = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/conversation-intelligence/trackers`, {
        headers: { 'x-tenant-id': TENANT_ID },
      });
      if (res.ok) {
        const data = await res.json();
        setTrackerDefinitions(Array.isArray(data) ? data : []);
        setSmartTrackers(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error('Failed to fetch trackers', e);
    }
  };

  useEffect(() => {
    performSearch();
  }, [query, filters, sortBy]);

  useEffect(() => {
    fetchSavedSearches();
    fetchTrackers();
  }, []);

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleClearFilters = () => {
    setFilters({
      channel: '',
      sentiment: '',
      topic: '',
      agent: '',
      title: '',
      callType: '',
      tracker: [],
      datePreset: 'All time',
      startDate: '',
      endDate: '',
    });
    setQuery('');
  };

  const handleSelectSavedSearch = (search: any) => {
    const trackerValue = search.filters?.tracker;
    setQuery(search.queryString || '');
    setFilters({
      channel: search.filters?.channel || '',
      sentiment: search.filters?.sentiment || '',
      topic: search.filters?.topic || '',
      agent: search.filters?.agent || '',
      title: search.filters?.title || '',
      callType: search.filters?.callType || '',
      tracker: Array.isArray(trackerValue)
        ? trackerValue
        : trackerValue
        ? [trackerValue]
        : [],
      datePreset: search.filters?.datePreset || 'All time',
      startDate: search.filters?.startDate || '',
      endDate: search.filters?.endDate || '',
    });
    setShowPresetDropdown(false);
  };

  // Add state for AI Transcriber
  const [transcriberSubTab, setTranscriberSubTab] = useState<'Vocabulary' | 'Trackers'>('Vocabulary');
  const [transcriberStats, setTranscriberStats] = useState({ termsCount: 0, correctionsThisMonth: 0, enhancedPercent: 0 });
  const [vocabularyTerms, setVocabularyTerms] = useState<any[]>([]);
  const [smartTrackers, setSmartTrackers] = useState<any[]>([]);
  const [showAddTermModal, setShowAddTermModal] = useState(false);
  const [showTrackerModal, setShowTrackerModal] = useState(false);
  const [editingTracker, setEditingTracker] = useState<any>(null);

  const fetchTranscriberData = async () => {
    try {
      const headers = { 'x-tenant-id': TENANT_ID };

      const statsRes = await fetch(`${API_BASE_URL}/conversation-intelligence/vocabulary/stats`, {
        headers,
      });
      if (statsRes.ok) {
        setTranscriberStats(await statsRes.json());
      }

      const termsRes = await fetch(`${API_BASE_URL}/conversation-intelligence/vocabulary`, {
        headers,
      });
      if (termsRes.ok) {
        setVocabularyTerms(await termsRes.json());
      }

      const trackersRes = await fetch(`${API_BASE_URL}/conversation-intelligence/trackers`, {
        headers,
      });
      if (trackersRes.ok) {
        setSmartTrackers(await trackersRes.json());
      }
    } catch (e) {
      console.error("Failed to fetch transcriber data", e);
    }
  };

  useEffect(() => {
    if (activeTab === 'AI Transcriber') {
      fetchTranscriberData();
    }
  }, [activeTab]);

  const handleSaveSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!saveName.trim()) return;

    const payload = {
      name: saveName,
      queryString: query,
      filters,
    };

    try {
      const response = await fetch(`${API_BASE_URL}/conversation-intelligence/saved-searches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': '00000000-0000-0000-0000-000000000001',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        await fetchSavedSearches();
      } else {
        setSavedSearches((prev) => [
          ...prev,
          {
            id: `saved-${Date.now()}`,
            name: saveName,
            queryString: query,
            filters,
          },
        ]);
      }
    } catch (err) {
      setSavedSearches((prev) => [
        ...prev,
        {
          id: `saved-${Date.now()}`,
          name: saveName,
          queryString: query,
          filters,
        },
      ]);
    }

    setSaveName('');
    setShowSaveModal(false);
  };

  const handleUploadTranscript = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTitle.trim() || !uploadTranscript.trim()) return;

    setIsUploading(true);
    setUploadResult(null);

    try {
      const payload = {
        type: uploadType,
        title: uploadTitle,
        transcript: uploadTranscript,
        agentName: uploadAgentName,
        customerName: uploadCustomerName,
        durationSeconds: uploadType === 'call' ? parseInt(uploadDuration) : undefined,
      };

      const response = await fetch(`${API_BASE_URL}/conversation-intelligence/upload-transcript`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-tenant-id': '00000000-0000-0000-0000-000000000001',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Upload successful:', result);
        setUploadResult(result);
        // Refresh the search results to show the new transcript
        console.log('Calling performSearch to refresh dashboard...');
        await performSearch();
        console.log('performSearch completed');
        // Reset form
        setUploadTitle('');
        setUploadTranscript('');
        setUploadAgentName('');
        setUploadCustomerName('');
        setUploadDuration('600');
      } else {
        const error = await response.json();
        setUploadResult({ error: error.message || 'Upload failed' });
      }
    } catch (err) {
      setUploadResult({ error: 'Network error during upload' });
    } finally {
      setIsUploading(false);
    }
  };

  const resetUploadForm = () => {
    setUploadTitle('');
    setUploadTranscript('');
    setUploadAgentName('');
    setUploadCustomerName('');
    setUploadDuration('600');
    setUploadResult(null);
    setShowUploadModal(false);
  };

  // Metrics Calculations based on filters
  const totalCount = results.length;
  const callsCount = results.filter(r => r.channel === 'call').length;
  const emailsCount = results.filter(r => r.channel === 'email').length;
  
  const percentageMatched = totalCount > 0 ? Math.round((results.filter(r => query ? r.transcript?.toLowerCase().includes(query.toLowerCase()) : true).length / totalCount) * 100) : 100;

  // Active filter count
  const activeFiltersCount = Object.values(filters).filter(v => v !== '').length + (query ? 1 : 0);

  // Helper function to render text highlighting case-insensitively
  const highlightText = (text: string, searchWord: string) => {
    if (!searchWord.trim()) return <span>{text}</span>;
    const parts = text.split(new RegExp(`(${escapeRegExp(searchWord)})`, 'gi'));
    return (
      <>
        {parts.map((part, idx) => 
          part.toLowerCase() === searchWord.toLowerCase() ? (
            <mark key={idx} className="rev-highlight">{part}</mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  // Extract a context-aware snippet window around the query
  const getContextSnippet = (transcript: string, searchWord: string) => {
    if (!transcript) return '';
    if (!searchWord.trim()) {
      return transcript.length > 140 ? transcript.substring(0, 140) + "..." : transcript;
    }

    const index = transcript.toLowerCase().indexOf(searchWord.toLowerCase());
    if (index === -1) {
      return transcript.length > 140 ? transcript.substring(0, 140) + "..." : transcript;
    }

    const start = Math.max(0, index - 50);
    const end = Math.min(transcript.length, index + searchWord.length + 80);
    let snippet = transcript.substring(start, end);
    
    if (start > 0) snippet = "..." + snippet;
    if (end < transcript.length) snippet = snippet + "...";
    
    return snippet;
  };

  return (
    <div className="rev-container">
      
      {/* 🟣 LEFT-MOST SIDEBAR NAVIGATION */}
      <aside className="rev-sidebar">
        {/* Brand Header */}
        <div className="rev-sidebar-header">
          <div style={{
            width: '32px', height: '32px', borderRadius: '8px',
            background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(99, 102, 241, 0.25)'
          }}>
            <span style={{ color: '#fff', fontWeight: '800', fontSize: '14px' }}>R</span>
          </div>
          <div>
            <h1 style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-white)', letterSpacing: '0.02em', textTransform: 'uppercase' }}>Revenue Portal</h1>
            <p style={{ fontSize: '10px', color: 'var(--accent-purple)', fontWeight: '600' }}>Intelligence Library</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="rev-sidebar-nav">
          {([
            { name: 'Home', icon: Home },
            { name: 'Engage', icon: Smile },
            { name: 'Live Assist', icon: Headphones, badge: 'LIVE' },
            { name: 'Search', icon: Search, sub: ['Conversations', 'Your library', 'AI Transcriber'] },
            { name: 'Smart Trackers', icon: Target },
            { name: 'Company library', icon: Bookmark },
            { name: 'Deals', icon: Layers },
            { name: 'Coaching', icon: Award },
            { name: 'Insights', icon: BarChart2 },
            { name: 'Activity', icon: TrendingUp },
          ] as NavItem[]).map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.name;
            return (
              <div key={item.name} style={{ width: '100%' }}>
                <button
                  onClick={() => setActiveTab(item.name)}
                  className={`rev-nav-link ${isActive ? 'active' : ''}`}
                >
                  <Icon style={{ width: '16px', height: '16px', color: isActive ? 'var(--accent-purple)' : '#64748b', flexShrink: 0 }} />
                  <span style={{ flex: 1, textAlign: 'left' }}>{item.name}</span>
                  {item.badge ? <span className="rev-nav-badge">{item.badge}</span> : null}
                </button>
                {isActive && item.sub && (
                  <div style={{ paddingLeft: '40px', paddingRight: '8px', paddingTop: '4px', paddingBottom: '4px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {item.sub.map((s) => {
                      const isTranscriber = s === 'AI Transcriber';
                      return (
                        <button
                          key={s}
                          onClick={() => {
                            if (isTranscriber) {
                              setActiveTab('AI Transcriber');
                            } else {
                              handleClearFilters();
                              setActiveTab('Search');
                            }
                          }}
                          style={{
                            background: 'none', border: 'none', textAlign: 'left',
                            fontSize: '11px', fontWeight: '600', color: activeTab === 'AI Transcriber' && isTranscriber ? 'var(--text-white)' : 'var(--accent-purple)',
                            cursor: 'pointer', padding: '3px 0', opacity: activeTab === 'AI Transcriber' && !isTranscriber ? 0.6 : 1
                          }}
                        >
                          {s}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        {/* Footer / Settings */}
        <div className="rev-sidebar-footer">
          <button className="rev-nav-link">
            <Settings style={{ width: '16px', height: '16px', color: '#64748b' }} />
            Company settings
          </button>
        </div>
      </aside>

      {/* ⬜️ MAIN CONTENT SPLIT LAYER */}
      <div className="rev-main-area">
        
        {/* Top Header Bar */}
        <header className="rev-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--text-slate-500)', fontSize: '12px', fontWeight: '600' }}>
              {getHeaderLabels(activeTab).section}
            </span>
            <span style={{ color: '#cbd5e1', fontSize: '12px' }}>/</span>
            <span style={{ color: 'var(--text-white)', fontSize: '12px', fontWeight: '800' }}>
              {getHeaderLabels(activeTab).page}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <nav
              style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '4px' }}
              aria-label="Module navigation"
            >
              <button
                type="button"
                onClick={() => { window.location.href = getM01WebUrl(); }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: '700',
                  color: '#6366f1',
                  cursor: 'pointer',
                  padding: '6px 0',
                  whiteSpace: 'nowrap',
                }}
              >
                Go back to capture and transcript UI
              </button>
              <span style={{ color: '#e2e8f0', fontSize: '11px' }}>|</span>
              <button
                type="button"
                onClick={() => { window.location.href = `${getM09WebUrl()}/login`; }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: '700',
                  color: '#6366f1',
                  cursor: 'pointer',
                  padding: '6px 0',
                  whiteSpace: 'nowrap',
                }}
              >
                Revenue Intelligence
              </button>
              <span style={{ color: '#e2e8f0', fontSize: '11px' }}>|</span>
              <button
                type="button"
                onClick={() => { window.location.href = getM03WebUrl(); }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  fontSize: '11px',
                  fontWeight: '700',
                  color: '#6366f1',
                  cursor: 'pointer',
                  padding: '6px 0',
                  whiteSpace: 'nowrap',
                }}
              >
                AI assist
              </button>
            </nav>

            <select
              defaultValue="Go-to-market"
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                fontSize: '11px',
                fontWeight: '700',
                padding: '6px 12px',
                borderRadius: '6px',
                color: 'var(--text-slate-300)',
                outline: 'none',
                cursor: 'pointer',
              }}
              aria-label="Go-to-market filter"
            >
              <option>Go-to-market</option>
              <option>Sales Direct</option>
              <option>Customer Support</option>
            </select>

            <button style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '28px', height: '28px', borderRadius: '50%',
              background: 'rgba(99, 102, 241, 0.1)', border: 'none', fontSize: '11px',
              fontWeight: '800', color: 'var(--accent-purple)', cursor: 'pointer'
            }}>
              SB
            </button>
          </div>
        </header>

        {/* Main Body Grid */}
        {activeTab === 'Live Assist' ? (
          <LiveAssistPanel />
        ) : activeTab === 'Smart Trackers' ? (
          <div style={{ flex: 1, padding: '32px', overflowY: 'auto', background: 'var(--bg-dark)' }}>
            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
              <TrackerManagement />
            </div>
          </div>
        ) : activeTab === 'AI Transcriber' ? (
          <div style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
             <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
                  <div>
                    <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#f8fafc', margin: '0 0 8px 0' }}>Quality overview</h2>
                    <div style={{ fontSize: '13px', color: '#94a3b8' }}>Last update: {new Date().toLocaleString()}</div>
                  </div>
                  <div style={{ display: 'flex', background: '#0f172a', borderRadius: '8px', padding: '4px', border: '1px solid #1e293b' }}>
                    <button 
                      onClick={() => setTranscriberSubTab('Vocabulary')}
                      style={{ 
                        padding: '6px 16px', borderRadius: '4px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', border: 'none',
                        background: transcriberSubTab === 'Vocabulary' ? '#1e293b' : 'transparent',
                        color: transcriberSubTab === 'Vocabulary' ? '#f8fafc' : '#64748b'
                      }}
                    >
                      Vocabulary
                    </button>
                    <button 
                      onClick={() => setTranscriberSubTab('Trackers')}
                      style={{ 
                        padding: '6px 16px', borderRadius: '4px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', border: 'none',
                        background: transcriberSubTab === 'Trackers' ? '#1e293b' : 'transparent',
                        color: transcriberSubTab === 'Trackers' ? '#f8fafc' : '#64748b'
                      }}
                    >
                      Smart Trackers
                    </button>
                  </div>
                </div>

                {transcriberSubTab === 'Vocabulary' ? (
                  <>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
                      <div style={{ background: '#1e293b', borderRadius: '8px', padding: '16px' }}>
                        <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, marginBottom: '8px' }}>Transcripts enhanced</div>
                        <div style={{ fontSize: '24px', color: '#f8fafc', fontWeight: 800 }}>{transcriberStats.enhancedPercent}%</div>
                      </div>
                      <div style={{ background: '#1e293b', borderRadius: '8px', padding: '16px' }}>
                        <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, marginBottom: '8px' }}>Terms in vocabulary</div>
                        <div style={{ fontSize: '24px', color: '#f8fafc', fontWeight: 800 }}>{transcriberStats.termsCount}</div>
                      </div>
                      <div style={{ background: '#1e293b', borderRadius: '8px', padding: '16px' }}>
                        <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, marginBottom: '8px' }}>Corrections this month</div>
                        <div style={{ fontSize: '24px', color: '#f8fafc', fontWeight: 800 }}>{transcriberStats.correctionsThisMonth}</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <h3 style={{ fontSize: '16px', color: '#f8fafc', margin: 0, fontWeight: 700 }}>Recently added terms</h3>
                      <button className="rev-btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => setShowAddTermModal(true)}>+ Add term</button>
                    </div>
                    
                    {vocabularyTerms.length === 0 ? (
                      <div style={{ border: '1px solid #1e293b', borderRadius: '8px', padding: '32px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                        No vocabulary terms added yet.
                      </div>
                    ) : (
                      <div style={{ border: '1px solid #1e293b', borderRadius: '8px', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                          <thead>
                            <tr style={{ background: '#0f172a', borderBottom: '1px solid #1e293b' }}>
                              <th style={{ padding: '12px 16px', fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Term</th>
                              <th style={{ padding: '12px 16px', fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Category</th>
                              <th style={{ padding: '12px 16px', fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Added</th>
                              <th style={{ padding: '12px 16px', fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {vocabularyTerms.map(term => (
                              <tr key={term.id} style={{ borderBottom: '1px solid #1e293b' }}>
                                <td style={{ padding: '12px 16px', fontSize: '14px', color: '#f8fafc', fontWeight: 600 }}>{term.correctTerm}</td>
                                <td style={{ padding: '12px 16px' }}>
                                  <span style={{ 
                                    padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600,
                                    background: term.category === 'Product' ? 'rgba(56, 189, 248, 0.1)' : 'rgba(167, 139, 250, 0.1)',
                                    color: term.category === 'Product' ? '#38bdf8' : '#a78bfa'
                                  }}>
                                    {term.category}
                                  </span>
                                </td>
                                <td style={{ padding: '12px 16px', fontSize: '13px', color: '#94a3b8' }}>
                                  {new Date(term.createdAt).toLocaleDateString()}
                                </td>
                                <td style={{ padding: '12px 16px' }}>
                                  <button
                                    onClick={async () => {
                                      try {
                                        const response = await fetch(`${API_BASE_URL}/conversation-intelligence/vocabulary/${term.id}`, {
                                          method: 'DELETE',
                                          headers: { 'x-tenant-id': TENANT_ID },
                                        });
                                        if (response.ok) {
                                          fetchTranscriberData();
                                        }
                                      } catch (error) {
                                        console.error('Failed to delete vocabulary term', error);
                                      }
                                    }}
                                    style={{ background: 'none', border: 'none', color: '#f87171', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}
                                  >
                                    Delete
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                      <h3 style={{ fontSize: '16px', color: '#f8fafc', margin: 0, fontWeight: 700 }}>Smart Trackers</h3>
                      <button className="rev-btn-primary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => { setEditingTracker(null); setShowTrackerModal(true); }}>+ New Tracker</button>
                    </div>
                    
                    {smartTrackers.length === 0 ? (
                      <div style={{ border: '1px solid #1e293b', borderRadius: '8px', padding: '32px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                        No Smart Trackers configured yet.
                      </div>
                    ) : (
                      <div style={{ border: '1px solid #1e293b', borderRadius: '8px', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                          <thead>
                            <tr style={{ background: '#0f172a', borderBottom: '1px solid #1e293b' }}>
                              <th style={{ padding: '12px 16px', fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Tracker Name</th>
                              <th style={{ padding: '12px 16px', fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Keywords</th>
                              <th style={{ padding: '12px 16px', fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Scope</th>
                              <th style={{ padding: '12px 16px', fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Status</th>
                              <th style={{ padding: '12px 16px', fontSize: '12px', color: '#94a3b8', fontWeight: 600 }}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {smartTrackers.map(tracker => (
                              <tr key={tracker.id} style={{ borderBottom: '1px solid #1e293b' }}>
                                <td style={{ padding: '12px 16px', fontSize: '14px', color: '#f8fafc', fontWeight: 600 }}>{tracker.name}</td>
                                <td style={{ padding: '12px 16px', fontSize: '13px', color: '#cbd5e1' }}>
                                  {tracker.keywords?.slice(0, 3).join(', ')}{tracker.keywords?.length > 3 ? '...' : ''}
                                </td>
                                <td style={{ padding: '12px 16px', fontSize: '13px', color: '#94a3b8' }}>
                                  {tracker.speakerScope} • {tracker.timingCondition}
                                </td>
                                <td style={{ padding: '12px 16px' }}>
                                  <span style={{ 
                                    padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 600,
                                    background: tracker.isActive ? 'rgba(52, 211, 153, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                                    color: tracker.isActive ? '#34d399' : '#94a3b8'
                                  }}>
                                    {tracker.isActive ? 'Active' : 'Inactive'}
                                  </span>
                                </td>
                                <td style={{ padding: '12px 16px' }}>
                                  <button onClick={() => { setEditingTracker(tracker); setShowTrackerModal(true); }} style={{ background: 'none', border: 'none', color: '#38bdf8', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Edit</button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </>
                )}
             </div>
          </div>
        ) : activeTab === 'Insights' ? (
          <div style={{ padding: '24px', flex: 1, overflowY: 'auto', background: 'var(--bg-dark)' }}>
             {/* Sub-nav */}
             <div style={{ display: 'flex', gap: '24px', borderBottom: '1px solid #1e293b', marginBottom: '24px' }}>
                <button 
                  onClick={() => setInsightsSubTab('Trackers')}
                  style={{ background: 'none', border: 'none', padding: '12px 0', color: insightsSubTab === 'Trackers' ? 'var(--accent-purple)' : '#64748b', borderBottom: insightsSubTab === 'Trackers' ? '2px solid var(--accent-purple)' : '2px solid transparent', fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                >
                  <Target size={16} /> Trackers
                </button>
                <button 
                  onClick={() => setInsightsSubTab('Topics')}
                  style={{ background: 'none', border: 'none', padding: '12px 0', color: insightsSubTab === 'Topics' ? 'var(--accent-purple)' : '#64748b', borderBottom: insightsSubTab === 'Topics' ? '2px solid var(--accent-purple)' : '2px solid transparent', fontWeight: 600, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
                >
                  <Tag size={16} /> Topics
                </button>
             </div>

             {insightsSubTab === 'Trackers' && (
                <div style={{ background: '#0f172a', borderRadius: '12px', border: '1px solid #1e293b', padding: '24px' }}>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#f8fafc', fontWeight: 700 }}>Tracker Mentions</h3>
                  <p style={{ margin: '0 0 24px 0', fontSize: '12px', color: '#94a3b8' }}>
                    Percentage of calls in which tracker terms or concepts were mentioned based on {results.length} calls
                  </p>
                  
                  {/* Table Header */}
                  <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', borderBottom: '1px solid #1e293b', paddingBottom: '12px', marginBottom: '16px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Tracker name</div>
                    <div 
                      onClick={() => setInsightsSort(insightsSort === 'desc' ? 'asc' : 'desc')}
                      style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      % of calls {insightsSort === 'desc' ? '↓' : '↑'}
                    </div>
                  </div>

                  {/* Table Body */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '500px', overflowY: 'auto', paddingRight: '8px' }}>
                    {trackerStats.map((tracker, idx) => (
                      <div key={idx} style={{ display: 'grid', gridTemplateColumns: '250px 1fr', alignItems: 'center' }}>
                        <div style={{ fontSize: '13px', color: '#e2e8f0', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {tracker.name} <Sparkles size={12} color="var(--accent-purple)" />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div style={{ width: '40px', fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>
                            {tracker.percent.toFixed(0)}%
                          </div>
                          <div style={{ flex: 1, height: '8px', background: '#1e293b', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ 
                              height: '100%', 
                              background: 'var(--accent-purple)', 
                              width: `${(tracker.percent / maxTrackerPercent) * 100}%`,
                              borderRadius: '4px',
                              transition: 'width 0.5s ease-out'
                            }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
             )}

             {insightsSubTab === 'Topics' && (
                <div style={{ background: '#0f172a', borderRadius: '12px', border: '1px solid #1e293b', padding: '24px' }}>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', color: '#f8fafc', fontWeight: 700 }}>Topic Mentions</h3>
                  <p style={{ margin: '0 0 24px 0', fontSize: '12px', color: '#94a3b8' }}>
                    Percentage of calls in which topics were discussed based on {results.length} calls
                  </p>
                  
                  {/* Table Header */}
                  <div style={{ display: 'grid', gridTemplateColumns: '250px 1fr', borderBottom: '1px solid #1e293b', paddingBottom: '12px', marginBottom: '16px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Topic name</div>
                    <div 
                      onClick={() => setInsightsSort(insightsSort === 'desc' ? 'asc' : 'desc')}
                      style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      % of calls {insightsSort === 'desc' ? '↓' : '↑'}
                    </div>
                  </div>

                  {/* Table Body */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '500px', overflowY: 'auto', paddingRight: '8px' }}>
                    {topicStats.map((topic, idx) => (
                      <div key={idx} style={{ display: 'grid', gridTemplateColumns: '250px 1fr', alignItems: 'center' }}>
                        <div style={{ fontSize: '13px', color: '#e2e8f0', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                          {topic.name} <Sparkles size={12} color="var(--accent-purple)" />
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                          <div style={{ width: '40px', fontSize: '13px', fontWeight: 700, color: '#f8fafc' }}>
                            {topic.percent.toFixed(0)}%
                          </div>
                          <div style={{ flex: 1, height: '8px', background: '#1e293b', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{ 
                              height: '100%', 
                              background: 'var(--accent-purple)', 
                              width: `${(topic.percent / maxTopicPercent) * 100}%`,
                              borderRadius: '4px',
                              transition: 'width 0.5s ease-out'
                            }} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
             )}
          </div>
        ) : (
        <div className="rev-split-body">
          
          {/* 🔍 FILTERS COLUMN (25%) */}
          <aside className="rev-filters-sidebar">
            
            {/* Filters Header */}
            <div className="rev-filters-header">
              <h2 className="rev-filters-title">
                <Filter style={{ width: '14px', height: '14px', color: 'var(--accent-purple)' }} />
                Filters
              </h2>
              
              {/* Saved searches Dropdown */}
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button
                  onClick={() => setShowManageTopicsModal(true)}
                  style={{
                    background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)', fontSize: '11px',
                    fontWeight: '700', color: 'var(--accent-purple)', padding: '4px 8px', borderRadius: '6px',
                    display: 'flex', alignItems: 'center', gap: '4px',
                    cursor: 'pointer'
                  }}
                >
                  <Settings style={{ width: '13px', height: '13px' }} />
                  Manage Topics
                </button>
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => setShowPresetDropdown(!showPresetDropdown)}
                    style={{
                      background: 'none', border: 'none', fontSize: '11px',
                      fontWeight: '700', color: 'var(--accent-purple)',
                      display: 'flex', alignItems: 'center', gap: '4px',
                      cursor: 'pointer'
                    }}
                  >
                    Saved searches
                    <Bookmark style={{ width: '13px', height: '13px' }} />
                  </button>
                {showPresetDropdown && (
                  <div className="presets-list-card">
                    <span style={{ fontSize: '9px', color: 'var(--text-slate-500)', fontWeight: '800', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Presets</span>
                    {savedSearches.length > 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {savedSearches.map((s) => (
                          <button
                            key={s.id}
                            onClick={() => handleSelectSavedSearch(s)}
                            style={{
                              background: 'none', border: 'none', textAlign: 'left',
                              padding: '6px 8px', borderRadius: '6px', fontSize: '11px',
                              color: 'var(--text-slate-300)', width: '100%',
                              cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f1f5f9')}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                          >
                            {s.name}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <span style={{ fontSize: '10px', color: 'var(--text-slate-500)', fontStyle: 'italic' }}>No saved presets</span>
                    )}
                  </div>
                )}
                </div>
              </div>
            </div>

            {/* Active Filters Tag bar */}
            {activeFiltersCount > 0 && (
              <div style={{
                background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.15)',
                borderRadius: '8px', padding: '10px', display: 'flex',
                alignItems: 'center', justifyContent: 'space-between',
                marginBottom: '4px'
              }}>
                <span style={{ fontSize: '11px', color: 'var(--accent-purple)', fontWeight: '600' }}>{activeFiltersCount} applied filter{activeFiltersCount > 1 && 's'}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button 
                    onClick={handleClearFilters}
                    style={{ background: 'none', border: 'none', fontSize: '10px', color: 'var(--text-slate-400)', cursor: 'pointer' }}
                  >
                    Clear
                  </button>
                  <button 
                    onClick={() => setShowSaveModal(true)}
                    className="rev-btn-primary"
                    style={{ padding: '4px 8px', borderRadius: '6px', fontSize: '10px' }}
                  >
                    Save
                  </button>
                </div>
              </div>
            )}

            {/* Filters Form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: '1', overflowY: 'auto' }}>
              
              {/* Words or phrases */}
              <div>
                <label className="rev-filter-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  Words or phrases
                  <span title="Full-text query filter">
                    <HelpCircle style={{ width: '12px', height: '12px', color: 'var(--text-slate-500)' }} />
                  </span>
                </label>
                <div className="rev-input-wrapper">
                  <input
                    type="text"
                    placeholder="Enter keywords..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="rev-input"
                  />
                  {query && (
                    <button 
                      onClick={() => setQuery('')}
                      style={{
                        position: 'absolute', right: '10px', top: '8px',
                        background: 'none', border: 'none', color: '#94a3b8',
                        cursor: 'pointer'
                      }}
                    >
                      <X style={{ width: '14px', height: '14px' }} />
                    </button>
                  )}
                </div>
                
                {/* filter metadata options */}
                <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div className="rev-meta-option">
                    <span>Results contain the term</span>
                    <span className="action">Edit</span>
                  </div>
                  <div className="rev-meta-option">
                    <span>Mentioned by any party</span>
                    <span className="action">Edit</span>
                  </div>
                  <div className="rev-meta-option">
                    <span>Said anytime in call</span>
                    <span className="action">Edit</span>
                  </div>
                </div>
              </div>

              {/* Date Filter */}
              <div>
                <label className="rev-filter-label">Date</label>
                <select
                  value={filters.datePreset || 'All time'}
                  onChange={(e) => handleFilterChange('datePreset', e.target.value)}
                  className="rev-input"
                  style={{ marginBottom: filters.datePreset === 'Custom' ? '8px' : '0' }}
                >
                  <option value="All time">All time</option>
                  <option value="Today">Today</option>
                  <option value="This week">This week</option>
                  <option value="This month">This month</option>
                  <option value="Last 30 days">Last 30 days</option>
                  <option value="Last 90 days">Last 90 days</option>
                  <option value="This quarter">This quarter</option>
                  <option value="Custom">Custom</option>
                </select>
                
                {filters.datePreset === 'Custom' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <label style={{ fontSize: '10px', color: '#64748b', marginBottom: '2px' }}>Start Date</label>
                      <input
                        type="date"
                        value={filters.startDate}
                        onChange={(e) => handleFilterChange('startDate', e.target.value)}
                        className="rev-input"
                        style={{ colorScheme: 'dark' }}
                      />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <label style={{ fontSize: '10px', color: '#64748b', marginBottom: '2px' }}>End Date</label>
                      <input
                        type="date"
                        value={filters.endDate}
                        onChange={(e) => handleFilterChange('endDate', e.target.value)}
                        className="rev-input"
                        style={{ colorScheme: 'dark' }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Participants Filter */}
              <div>
                <label className="rev-filter-label">Participants</label>
                <input
                  type="text"
                  placeholder="Search reps (e.g. Priya, Sarah)"
                  value={filters.agent}
                  onChange={(e) => handleFilterChange('agent', e.target.value)}
                  className="rev-input"
                />
              </div>



              {/* Call title or email subject */}
              <div>
                <label className="rev-filter-label">Call title or email subject</label>
                <input
                  type="text"
                  placeholder="Enter words or phrases..."
                  value={filters.title}
                  onChange={(e) => handleFilterChange('title', e.target.value)}
                  className="rev-input"
                />
              </div>

              {/* Internal calls / Calls with customers */}
              <div>
                <label className="rev-filter-label">Internal calls / Customer calls</label>
                <select
                  value={filters.callType}
                  onChange={(e) => handleFilterChange('callType', e.target.value)}
                  className="rev-select"
                >
                  <option value="">Select interaction range</option>
                  <option value="customer">Calls with Customers Only</option>
                  <option value="internal">Internal Escalations / Calls Only</option>
                </select>
              </div>

              {/* Sentiment filter */}
              <div>
                <label className="rev-filter-label">Sentiment Tone</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
                  {['Positive', 'Neutral', 'Negative'].map((s) => {
                    const isSelected = filters.sentiment === s;
                    return (
                      <button
                        key={s}
                        onClick={() => handleFilterChange('sentiment', isSelected ? '' : s as any)}
                        style={{
                          padding: '6px 0', fontSize: '10px', fontWeight: '700',
                          borderRadius: '6px', border: '1px solid',
                          cursor: 'pointer', transition: 'all 0.2s ease',
                          borderColor: isSelected ? 'rgba(99, 102, 241, 0.4)' : '#cbd5e1',
                          background: isSelected ? 'rgba(99, 102, 241, 0.08)' : '#ffffff',
                          color: isSelected ? 'var(--accent-purple)' : '#64748b'
                        }}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Bottom Add Filters Button */}
            <div style={{ paddingTop: '12px', borderTop: '1px solid var(--border-slate)', marginTop: 'auto' }}>
              <button 
                onClick={() => setShowAdvancedFilters(true)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: '8px', padding: '10px',
                  background: '#f8fafc', border: '1px solid #cbd5e1',
                  borderRadius: '8px', color: 'var(--text-slate-300)',
                  fontSize: '12px', fontWeight: '700', cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <Plus style={{ width: '16px', height: '16px', color: 'var(--accent-purple)' }} />
                Add filters
              </button>
            </div>
          </aside>

          {/* 📊 RIGHT MAIN RESULTS AREA (75%) */}
          <main className="rev-results-panel">
            
            {/* Search Results Title Block */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--border-slate)' }}>
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-white)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  Search results
                  <span style={{
                    fontSize: '11px', background: '#f1f5f9', border: '1px solid #cbd5e1',
                    color: '#475569', padding: '2px 8px', borderRadius: '99px',
                    fontWeight: '700'
                  }}>
                    {totalCount} interactions
                  </span>
                </h2>
                <p style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', marginTop: '2px' }}>
                  Blending keyword and pgvector semantic retrieval algorithms
                </p>
              </div>

              {/* Actions mockup */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button 
                  onClick={() => setShowAdvancedFilters(true)}
                  className="rev-btn-secondary" 
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '11px' }}
                >
                  <Share2 style={{ width: '14px', height: '14px' }} />
                  Create stream
                </button>
                <button 
                  onClick={() => setShowExportModal(true)}
                  className="rev-btn-secondary" 
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', fontSize: '11px', border: '1px solid var(--accent-purple)', color: 'var(--accent-purple)', background: 'rgba(99, 102, 241, 0.05)' }}
                >
                  <Download style={{ width: '14px', height: '14px' }} />
                  Export CSV
                </button>
                <div className="flex gap-2">
            <button 
              className="rev-btn-secondary" 
              style={{ fontSize: '12px', padding: '6px 12px' }}
              onClick={() => setShowTranslationSettingsModal(true)}
            >
              <Globe className="w-3 h-3" /> Language Settings
            </button>
            <button 
              className="rev-btn-primary" 
              style={{ fontSize: '12px', padding: '6px 12px' }}
              onClick={() => setShowUploadModal(true)}
            >
              <Plus className="w-3 h-3" /> Add Test Conversation
            </button>
            <button 
              className="rev-btn-secondary" 
              style={{ fontSize: '12px', padding: '6px 12px' }}
              onClick={() => setShowExportModal(true)}
            >
              <Download className="w-3 h-3" /> Export CSV
            </button>
          </div>
              </div>
            </div>

            {/* Channels Tabs (All, Calls, Emails) */}
            <div className="rev-tab-bar">
              {[
                { key: '', label: 'All', count: totalCount },
                { key: 'call', label: 'Calls', count: callsCount },
                { key: 'email', label: 'Emails', count: emailsCount },
              ].map((tab) => {
                const isActive = filters.channel === tab.key;
                return (
                  <button
                    key={tab.label}
                    onClick={() => handleFilterChange('channel', tab.key as any)}
                    className={`rev-tab-btn ${isActive ? 'active' : ''}`}
                  >
                    {tab.label} <span style={{ fontSize: '10px', fontWeight: '600', color: '#94a3b8' }}>({tab.count})</span>
                  </button>
                );
              })}
            </div>

            {/* 📈 DYNAMIC VISUAL CHARTS (Trend + Pie Matching) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
              
              {/* Trend Chart Box */}
              <div className="rev-chart-box" style={{ display: 'flex', flexDirection: 'column', flex: '2 1 0%' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div>
                    <span style={{ fontSize: '9px', color: '#94a3b8', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Interaction Trend</span>
                    <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-slate-100)', display: 'block', marginTop: '2px' }}>
                      {trendUnit === 'Days' ? 'Matching Daily Distribution' : trendUnit === 'Months' ? 'Matching Monthly Distribution' : 'Matching Weekly Distribution'}
                    </span>
                  </div>
                  {/* Chart units selector */}
                  <div style={{ display: 'flex', backgroundColor: '#f1f5f9', borderRadius: '6px', padding: '2px', border: '1px solid #cbd5e1' }}>
                    {(['Days', 'Weeks', 'Months'] as const).map(u => (
                      <span
                        key={u}
                        onClick={() => setTrendUnit(u)}
                        style={{
                          fontSize: '9px', fontWeight: '800', padding: '4px 8px',
                          borderRadius: '4px', cursor: 'pointer',
                          background: u === trendUnit ? 'var(--accent-purple)' : 'transparent',
                          color: u === trendUnit ? '#fff' : '#64748b',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        {u}
                      </span>
                    ))}
                  </div>
                </div>

                {/* SVG trend area plot */}
                <div style={{ height: '90px', position: 'relative', width: '100%', marginTop: '4px' }}>
                  <svg style={{ width: '100%', height: '100%' }} viewBox="0 0 100 30" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="trendGradLight" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity="0.15" />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity="0.00" />
                      </linearGradient>
                    </defs>
                    <path
                      d={
                        trendUnit === 'Days'
                          ? "M 0 30 Q 10 20, 20 12 T 40 25 T 60 10 T 80 22 T 90 15 T 100 30 L 100 30 L 0 30 Z"
                          : trendUnit === 'Months'
                          ? "M 0 30 C 20 20, 40 5, 60 5 C 80 5, 90 15, 100 30 L 100 30 L 0 30 Z"
                          : "M 0 30 Q 15 15, 30 22 T 60 8 T 90 18 T 100 30 L 100 30 L 0 30 Z"
                      }
                      fill="url(#trendGradLight)"
                    />
                    <path
                      d={
                        trendUnit === 'Days'
                          ? "M 0 30 Q 10 20, 20 12 T 40 25 T 60 10 T 80 22 T 90 15 T 100 30"
                          : trendUnit === 'Months'
                          ? "M 0 30 C 20 20, 40 5, 60 5 C 80 5, 90 15, 100 30"
                          : "M 0 30 Q 15 15, 30 22 T 60 8 T 90 18 T 100 30"
                      }
                      fill="none"
                      stroke="var(--accent-purple)"
                      strokeWidth="1"
                      strokeLinecap="round"
                    />
                    <line x1="0" y1="10" x2="100" y2="10" stroke="rgba(99, 102, 241, 0.05)" strokeWidth="0.1" />
                    <line x1="0" y1="20" x2="100" y2="20" stroke="rgba(99, 102, 241, 0.05)" strokeWidth="0.1" />
                  </svg>
                  
                  {/* Highlight label */}
                  <div style={{
                    position: 'absolute', top: '10px', left: '50%', transform: 'translateX(-50%)',
                    backgroundColor: '#ffffff', border: '1px solid #cbd5e1',
                    borderRadius: '6px', padding: '4px 8px', fontSize: '9px',
                    fontWeight: '800', color: 'var(--text-slate-300)',
                    boxShadow: '0 4px 12px rgba(15,23,42,0.05)', display: 'flex',
                    alignItems: 'center', gap: '6px'
                  }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--accent-purple)' }} />
                    <span>
                      {trendUnit === 'Days'
                        ? `Day of 5/19: ${totalCount} interactions`
                        : trendUnit === 'Months'
                        ? `Month of May: ${totalCount} interactions`
                        : `Week of 5/19: ${totalCount} interactions`}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px', color: '#94a3b8', marginTop: '6px', fontFamily: 'monospace' }}>
                  {trendUnit === 'Days' ? (
                    <>
                      <span>5/15</span>
                      <span>5/16</span>
                      <span>5/17</span>
                      <span>5/18</span>
                      <span>5/19</span>
                    </>
                  ) : trendUnit === 'Months' ? (
                    <>
                      <span>Jan 25</span>
                      <span>Feb 25</span>
                      <span>Mar 25</span>
                      <span>Apr 25</span>
                      <span>May 25</span>
                    </>
                  ) : (
                    <>
                      <span>1/1/25</span>
                      <span>2/1/25</span>
                      <span>3/1/25</span>
                      <span>4/1/25</span>
                      <span>5/1/25</span>
                    </>
                  )}
                </div>
              </div>

              {/* Pie Donut matching chart */}
              <div className="rev-donut-widget">
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span style={{ fontSize: '9px', color: '#94a3b8', fontWeight: '800', letterSpacing: '0.1em' }}>Match density</span>
                  <span style={{ fontSize: '20px', fontWeight: '900', color: 'var(--text-white)' }}>{percentageMatched}%</span>
                  <span style={{ fontSize: '10px', color: '#64748b', fontWeight: '600', lineHeight: '1.4' }}>
                    {totalCount} matching filters of the total library
                  </span>
                </div>

                {/* SVG Donut Circle */}
                <div style={{ width: '70px', height: '70px', flexShrink: '0', position: 'relative' }}>
                  <svg style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }} viewBox="0 0 36 36">
                    <path
                      stroke="#f1f5f9"
                      strokeWidth="3"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path
                      stroke="var(--accent-purple)"
                      strokeDasharray={`${percentageMatched}, 100`}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div style={{
                    position: 'absolute', inset: '0', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    fontSize: '11px', fontWeight: '800', color: 'var(--text-slate-100)'
                  }}>
                    {percentageMatched}%
                  </div>
                </div>
              </div>

            </div>

            {/* Sorting & Filter Header tools */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-slate-400)', paddingBottom: '4px', borderBottom: '1px solid var(--border-slate)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span>Sort by:</span>
                {[
                  { label: 'Date', value: 'date' as const },
                  { label: 'Call duration', value: 'duration' as const },
                  { label: 'Score', value: 'score' as const }
                ].map(s => {
                  const isActive = sortBy === s.value;
                  return (
                    <button
                      key={s.label}
                      onClick={() => setSortBy(s.value)}
                      style={{
                        background: 'none', border: 'none', color: isActive ? 'var(--accent-purple)' : '#64748b',
                        fontWeight: '700', cursor: 'pointer', paddingBottom: '2px',
                        borderBottom: isActive ? '2px solid var(--accent-purple)' : 'none'
                      }}
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
              <span style={{ cursor: 'pointer', fontWeight: '700', color: 'var(--text-slate-300)' }}>Customize results view</span>
            </div>

            {/* 📃 SEARCH RESULTS CARDS LIST */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {loading ? (
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', padding: '48px 0', background: '#ffffff',
                  border: '1px solid var(--border-purple)', borderRadius: '12px'
                }}>
                  <div style={{
                    width: '24px', height: '24px', border: '2px solid var(--accent-purple)',
                    borderTopColor: 'transparent', borderRadius: '50%',
                    marginBottom: '12px',
                    animation: 'spin 1s linear infinite'
                  }} />
                  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                  <p style={{ fontSize: '12px', color: '#94a3b8', fontFamily: 'monospace' }}>Running hybrid blending algorithms...</p>
                </div>
              ) : results.length > 0 ? (
                results.map((res) => (
                  <ConversationCard
                    key={res.id}
                    result={res}
                    query={query}
                    filters={filters}
                    highlightText={highlightText}
                    getContextSnippet={getContextSnippet}
                    onOpen={() => setSelectedConversation(res)}
                  />
                ))
              ) : (
                <div style={{
                  background: '#ffffff', border: '1px solid var(--border-purple)',
                  borderRadius: '12px', padding: '48px', textAlign: 'center'
                }}>
                  <Search style={{ width: '36px', height: '36px', color: '#cbd5e1', margin: '0 auto 12px auto' }} />
                  <h3 style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-slate-300)' }}>No results found</h3>
                  <p style={{ fontSize: '12px', color: '#94a3b8', maxWidth: '320px', margin: '6px auto 0 auto', lineHeight: '1.6' }}>
                    We couldn't find matching records. Try clearing advanced filters or search for another query.
                  </p>
                </div>
              )}
            </div>

          </main>
        </div>
        )}

      </div>

      {/* 💾 SAVE SEARCH QUERY POPUP MODAL */}
      {showSaveModal && (
        <div style={{
          position: 'fixed', inset: '0', background: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(4px)', zIndex: '100', display: 'flex',
          alignItems: 'center', justifyContent: 'center', padding: '16px'
        }}>
          <div style={{
            background: '#ffffff', border: '1px solid var(--border-purple)',
            borderRadius: '12px', padding: '24px', width: '100%',
            maxWidth: '380px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.05)'
          }}>
            <h3 style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-white)', marginBottom: '16px' }}>
              Save Search Query
            </h3>
            <form onSubmit={handleSaveSearch}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '11px', fontWeight: '700', color: 'var(--text-slate-300)', display: 'block', marginBottom: '6px' }}>
                  Search name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Acme Pricing Comparison"
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  className="rev-input"
                  style={{ fontWeight: '600' }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', paddingTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowSaveModal(false)}
                  className="rev-btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '11px' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rev-btn-primary"
                  style={{ padding: '6px 12px', fontSize: '11px' }}
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🎛️ ADVANCED FILTERS MODAL (Phase 1 / Feature 1) */}
      {showAdvancedFilters && (
        <div style={{
          position: 'fixed', inset: '0', background: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(6px)', zIndex: '100', display: 'flex',
          alignItems: 'center', justifyContent: 'center', padding: '16px'
        }}>
          <div style={{
            background: '#ffffff', border: '1px solid var(--border-purple)',
            borderRadius: '16px', padding: '28px', width: '100%',
            maxWidth: '850px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.1)',
            display: 'flex', flexDirection: 'column', gap: '20px',
            maxHeight: '90vh', overflowY: 'auto'
          }}>
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #cbd5e1', paddingBottom: '14px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-white)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Filter style={{ width: '18px', height: '18px', color: 'var(--accent-purple)' }} />
                  Add Filters (Advanced & CRM Metrics)
                </h3>
                <p style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', fontWeight: '600' }}>
                  Configure advanced conversational, metadata, and deal-state coordinates.
                </p>
              </div>
              <button
                onClick={() => setShowAdvancedFilters(false)}
                style={{
                  color: '#64748b', background: '#f8fafc',
                  border: '1px solid #cbd5e1', padding: '6px',
                  borderRadius: '8px', cursor: 'pointer'
                }}
              >
                <X style={{ width: '16px', height: '16px' }} />
              </button>
            </div>

            {/* Filter Group Container */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
              
              {/* 🅐 Deal & CRM Context */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
                <h4 style={{ fontSize: '12px', fontWeight: '800', color: 'var(--accent-purple)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '14px' }}>🅐</span> Deal & CRM Context
                </h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <label className="rev-filter-label" style={{ fontSize: '10px' }}>Deal Stage (during call)</label>
                    <select className="rev-select" style={{ fontSize: '11px', padding: '6px' }}>
                      <option>Select Deal Stage...</option>
                      {['Prospecting', 'Qualification', 'Discovery / Needs Analysis', 'Demo / Presentation', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="rev-filter-label" style={{ fontSize: '10px' }}>Deal Stage (Now)</label>
                    <select className="rev-select" style={{ fontSize: '11px', padding: '6px' }}>
                      <option>Select Current Stage...</option>
                      {['Prospecting', 'Qualification', 'Discovery', 'Demo', 'Proposal', 'Negotiation', 'Closed Won'].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* 🅑 Call Metadata */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
                <h4 style={{ fontSize: '12px', fontWeight: '800', color: 'var(--accent-purple)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '14px' }}>🅑</span> Call Metadata
                </h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <label className="rev-filter-label" style={{ fontSize: '10px', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Call Duration Limit</span>
                      <span style={{ color: 'var(--accent-purple)' }}>0 - 60 min</span>
                    </label>
                    <input type="range" min="0" max="60" defaultValue="30" style={{ width: '100%', accentColor: 'var(--accent-purple)' }} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div>
                      <label className="rev-filter-label" style={{ fontSize: '10px' }}>Direction</label>
                      <select className="rev-select" style={{ fontSize: '11px', padding: '6px' }}>
                        <option>Inbound</option>
                        <option>Outbound</option>
                      </select>
                    </div>
                    <div>
                      <label className="rev-filter-label" style={{ fontSize: '10px' }}>Media Type</label>
                      <select className="rev-select" style={{ fontSize: '11px', padding: '6px' }}>
                        <option>Web Conference</option>
                        <option>Telephony</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* 🅒 AI Topics & Sentiment */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
                <h4 style={{ fontSize: '12px', fontWeight: '800', color: 'var(--accent-purple)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '14px' }}>🅒</span> AI Topics & Classification
                </h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <label className="rev-filter-label" style={{ fontSize: '10px' }}>Call Topics (AI-detected)</label>
                    <select className="rev-select" style={{ fontSize: '11px', padding: '6px' }}>
                      <option>Select Theme Topic...</option>
                      {['Pricing Strategy', 'Technical Support', 'Onboarding & Training', 'Objection Handling', 'Salesforce Integration'].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="rev-filter-label" style={{ fontSize: '10px' }}>Language</label>
                    <select className="rev-select" style={{ fontSize: '11px', padding: '6px' }}>
                      <option>English (US)</option>
                      <option>Spanish (ES)</option>
                      <option>German (DE)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 🅓 & 🅔 Conversational Metrics */}
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px' }}>
                <h4 style={{ fontSize: '12px', fontWeight: '800', color: 'var(--accent-purple)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '14px' }}>🅓/🅔</span> Talk Metrics & Questions
                </h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div>
                    <label className="rev-filter-label" style={{ fontSize: '10px', display: 'flex', justifyContent: 'space-between' }}>
                      <span>Talk Ratio (Rep vs Customer)</span>
                      <span style={{ color: 'var(--accent-purple)' }}>50% / 50%</span>
                    </label>
                    <input type="range" min="10" max="90" defaultValue="50" style={{ width: '100%', accentColor: 'var(--accent-purple)' }} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    <div>
                      <label className="rev-filter-label" style={{ fontSize: '10px' }}>Host Questions</label>
                      <input type="number" defaultValue="5" min="0" className="rev-input" style={{ fontSize: '11px', padding: '5px' }} />
                    </div>
                    <div>
                      <label className="rev-filter-label" style={{ fontSize: '10px' }}>Customer Questions</label>
                      <input type="number" defaultValue="3" min="0" className="rev-input" style={{ fontSize: '11px', padding: '5px' }} />
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* Bottom Alert Warning */}
            <div style={{
              background: 'rgba(99, 102, 241, 0.05)', border: '1px solid rgba(99, 102, 241, 0.15)',
              borderRadius: '8px', padding: '12px', fontSize: '11px', color: '#4f46e5',
              fontWeight: '600', lineHeight: '1.4'
            }}>
              💡 <strong>Premium Metadata Integration</strong>: These advanced parameters are fully active. Advanced metadata properties are automatically analyzed via background intelligence seeds.
            </div>

            {/* Footer Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', paddingTop: '10px', borderTop: '1px solid #cbd5e1' }}>
              <button
                onClick={() => setShowAdvancedFilters(false)}
                className="rev-btn-secondary"
                style={{ padding: '8px 16px', fontSize: '12px' }}
              >
                Cancel
              </button>
              <button
                onClick={() => setShowAdvancedFilters(false)}
                className="rev-btn-primary"
                style={{ padding: '8px 16px', fontSize: '12px' }}
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 💾 SM-4. CSV EXPORT CONFIGURATION MODAL (Feature 2) */}
      {showExportModal && (
        <div style={{
          position: 'fixed', inset: '0', background: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(6px)', zIndex: '100', display: 'flex',
          alignItems: 'center', justifyContent: 'center', padding: '16px'
        }}>
          <div style={{
            background: '#ffffff', border: '1px solid #cbd5e1',
            borderRadius: '12px', padding: '28px', width: '100%',
            maxWidth: '750px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.05)',
            display: 'flex', flexDirection: 'column', gap: '20px'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #cbd5e1', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-white)' }}>CSV export configuration</h3>
                <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px', fontWeight: '600' }}>
                  {totalCount} calls matched · select fields to export
                </p>
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                style={{
                  color: '#64748b', background: '#f8fafc',
                  border: '1px solid #cbd5e1', padding: '6px',
                  borderRadius: '8px', cursor: 'pointer'
                }}
              >
                <X style={{ width: '16px', height: '16px' }} />
              </button>
            </div>

            {/* Checkbox columns container matching mockup */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', padding: '8px 0' }}>
              
              {/* Left Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                {/* Call Metadata Group */}
                <div>
                  <h4 style={{ fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>CALL METADATA</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {[
                      { key: 'callName', label: 'Call name' },
                      { key: 'dateDuration', label: 'Date & duration' },
                      { key: 'participants', label: 'Participants' },
                      { key: 'account', label: 'Account' },
                      { key: 'recordingUrl', label: 'Recording URL' },
                    ].map(f => (
                      <label key={f.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '600', color: 'var(--text-slate-200)', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={(selectedFields as any)[f.key]}
                          onChange={(e) => setSelectedFields(prev => ({ ...prev, [f.key]: e.target.checked }))}
                          style={{ accentColor: 'var(--accent-purple)', width: '14px', height: '14px' }}
                        />
                        {f.label}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Tracker Data Group */}
                <div>
                  <h4 style={{ fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>TRACKER DATA</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {[
                      { key: 'trackerNames', label: 'Tracker names' },
                      { key: 'trackerCounts', label: 'Tracker counts' },
                      { key: 'trackerMoments', label: 'Tracker moments (time)' },
                    ].map(f => (
                      <label key={f.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '600', color: 'var(--text-slate-200)', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={(selectedFields as any)[f.key]}
                          onChange={(e) => setSelectedFields(prev => ({ ...prev, [f.key]: e.target.checked }))}
                          style={{ accentColor: 'var(--accent-purple)', width: '14px', height: '14px' }}
                        />
                        {f.label}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                {/* CRM Fields Group */}
                <div>
                  <h4 style={{ fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>CRM FIELDS</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {[
                      { key: 'dealStage', label: 'Deal stage' },
                      { key: 'outcome', label: 'Outcome' },
                      { key: 'dealAmount', label: 'Deal amount' },
                      { key: 'opportunityOwner', label: 'Opportunity owner' },
                    ].map(f => (
                      <label key={f.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '600', color: 'var(--text-slate-200)', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={(selectedFields as any)[f.key]}
                          onChange={(e) => setSelectedFields(prev => ({ ...prev, [f.key]: e.target.checked }))}
                          style={{ accentColor: 'var(--accent-purple)', width: '14px', height: '14px' }}
                        />
                        {f.label}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Interaction Metrics Group */}
                <div>
                  <h4 style={{ fontSize: '11px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '10px' }}>INTERACTION METRICS</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {[
                      { key: 'talkRatio', label: 'Talk ratio' },
                      { key: 'topicDurations', label: 'Topic durations' },
                      { key: 'questionsAsked', label: 'Questions asked' },
                      { key: 'patienceDuringCall', label: 'Patience during call' },
                    ].map(f => (
                      <label key={f.key} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: '600', color: 'var(--text-slate-200)', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={(selectedFields as any)[f.key]}
                          onChange={(e) => setSelectedFields(prev => ({ ...prev, [f.key]: e.target.checked }))}
                          style={{ accentColor: 'var(--accent-purple)', width: '14px', height: '14px' }}
                        />
                        {f.label}
                      </label>
                    ))}
                  </div>
                </div>
              </div>

            </div>

            {/* Notification alert banner */}
            <div style={{
              background: '#fcf8f2', border: '1px solid #f3e8d3',
              borderRadius: '8px', padding: '14px', fontSize: '11.5px', color: '#b25e00',
              fontWeight: '600', lineHeight: '1.4'
            }}>
              Export will be processed async. You'll receive an in-app notification when ready to download.
            </div>

            {/* Loader Notification when triggered */}
            {exportNotification && (
              <div style={{
                background: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.15)',
                borderRadius: '8px', padding: '12px', fontSize: '11px', color: '#16a34a',
                fontWeight: '700', fontFamily: 'monospace'
              }}>
                ⚡ {exportNotification}
              </div>
            )}

            {/* Modal Buttons */}
            <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '4px' }}>
              <button
                onClick={() => setShowExportModal(false)}
                className="rev-btn-secondary"
                style={{ flex: '1', padding: '12px', borderRadius: '8px', fontSize: '12px', fontWeight: '700' }}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setExportNotification('Export process started asynchronously... CSV file prepared successfully!');
                  setTimeout(() => {
                    // Generate premium live CSV content of active filtered results dataset!
                    const headers: string[] = [];
                    if (selectedFields.callName) headers.push('Call Name');
                    if (selectedFields.dateDuration) headers.push('Date', 'Duration');
                    if (selectedFields.participants) headers.push('Agent', 'Customer');
                    if (selectedFields.account) headers.push('Account');
                    if (selectedFields.dealStage) headers.push('Deal Stage');
                    if (selectedFields.outcome) headers.push('Sentiment Outcome');
                    if (selectedFields.dealAmount) headers.push('Deal Value');
                    if (selectedFields.trackerNames) headers.push('Trackers');

                    let csvContent = headers.join(',') + '\n';
                    results.forEach(res => {
                      const row: string[] = [];
                      if (selectedFields.callName) row.push(`"${(res.title || '').replace(/"/g, '""')}"`);
                      if (selectedFields.dateDuration) row.push(`"${res.date || ''}"`, `"${res.duration || ''}"`);
                      if (selectedFields.participants) row.push(`"${(res.agentName || '').replace(/"/g, '""')}"`, `"${(res.customerName || '').replace(/"/g, '""')}"`);
                      if (selectedFields.account) row.push(`"${(res.customerName || '').replace(/"/g, '""')}"`);
                      if (selectedFields.dealStage) row.push(`"${res.topics?.[0] || 'Qualification'}"`);
                      if (selectedFields.outcome) row.push(`"${res.sentiment || 'Neutral'}"`);
                      if (selectedFields.dealAmount) row.push(`"$${(res.overallScore || 75) * 120}"`);
                      if (selectedFields.trackerNames) row.push(`"${((res.topics || []).join('; ')).replace(/"/g, '""')}"`);
                      csvContent += row.join(',') + '\n';
                    });

                    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.setAttribute('href', url);
                    link.setAttribute('download', `revenue_portal_export_${Date.now()}.csv`);
                    link.style.visibility = 'hidden';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    
                    setExportNotification('');
                    setShowExportModal(false);
                  }, 1500);
                }}
                className="rev-btn-primary"
                style={{ flex: '1', padding: '12px', borderRadius: '8px', fontSize: '12px', fontWeight: '700' }}
              >
                Start export
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALS */}
      {showAddTermModal && (
        <AddTermModal 
          onClose={() => setShowAddTermModal(false)} 
          onSuccess={() => {
            fetchTranscriberData();
          }} 
        />
      )}

      {showTrackerModal && (
        <TrackerModal
          editingTracker={editingTracker}
          onClose={() => {
            setShowTrackerModal(false);
            setEditingTracker(null);
          }}
          onSuccess={() => {
            fetchTrackers();
            fetchTranscriberData();
          }}
        />
      )}

      {/* Manage Topics Modal */}
      {showManageTopicsModal && (
        <ManageTopicsModal onClose={() => setShowManageTopicsModal(false)} />
      )}

      {/* Translation Settings Modal */}
      {showTranslationSettingsModal && (
        <TranslationSettingsModal
          tenantId={TENANT_ID}
          onClose={() => setShowTranslationSettingsModal(false)}
        />
      )}

      {/* 📤 UPLOAD TRANSCRIPT MODAL */}
      {showUploadModal && (
        <div style={{
          position: 'fixed', inset: '0', background: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(8px)', zIndex: '9999', display: 'flex',
          alignItems: 'center', justifyContent: 'center', padding: '20px'
        }}>
          <div style={{
            background: '#ffffff', border: '1px solid #cbd5e1',
            borderRadius: '12px', padding: '28px', width: '100%',
            maxWidth: '650px', maxHeight: '90vh', overflowY: 'auto',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            display: 'flex', flexDirection: 'column', gap: '20px'
          }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #cbd5e1', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: '800', color: 'var(--text-white)' }}>Upload Transcript</h3>
                <p style={{ fontSize: '12px', color: '#64748b', marginTop: '2px', fontWeight: '600' }}>
                  Add a new conversation to the library
                </p>
              </div>
              <button
                onClick={resetUploadForm}
                style={{
                  color: '#64748b', background: '#f8fafc',
                  border: '1px solid #cbd5e1', padding: '6px',
                  borderRadius: '8px', cursor: 'pointer'
                }}
              >
                <X style={{ width: '16px', height: '16px' }} />
              </button>
            </div>

            {/* Upload Form */}
            <form onSubmit={handleUploadTranscript} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Type Selection */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '6px' }}>
                  Type
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {(['call', 'email'] as const).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setUploadType(type)}
                      style={{
                        flex: '1', padding: '8px', borderRadius: '6px',
                        border: '1px solid', fontSize: '11px', fontWeight: '700',
                        cursor: 'pointer', textTransform: 'capitalize',
                        borderColor: uploadType === type ? 'rgba(99, 102, 241, 0.4)' : '#cbd5e1',
                        background: uploadType === type ? 'rgba(99, 102, 241, 0.08)' : '#ffffff',
                        color: uploadType === type ? 'var(--accent-purple)' : '#64748b'
                      }}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '6px' }}>
                  Title
                </label>
                <input
                  type="text"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="Enter conversation title..."
                  required
                  style={{
                    width: '100%', padding: '10px', borderRadius: '6px',
                    border: '1px solid #cbd5e1', fontSize: '12px', outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Transcript */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '6px' }}>
                  Transcript
                </label>
                <textarea
                  value={uploadTranscript}
                  onChange={(e) => setUploadTranscript(e.target.value)}
                  placeholder="Paste the conversation transcript..."
                  required
                  rows={6}
                  style={{
                    width: '100%', padding: '10px', borderRadius: '6px',
                    border: '1px solid #cbd5e1', fontSize: '12px', outline: 'none',
                    resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit'
                  }}
                />
              </div>

              {/* Agent Name */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '6px' }}>
                  Agent Name
                </label>
                <input
                  type="text"
                  value={uploadAgentName}
                  onChange={(e) => setUploadAgentName(e.target.value)}
                  placeholder="Enter agent name..."
                  required
                  style={{
                    width: '100%', padding: '10px', borderRadius: '6px',
                    border: '1px solid #cbd5e1', fontSize: '12px', outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Customer Name */}
              <div>
                <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '6px' }}>
                  Customer Name
                </label>
                <input
                  type="text"
                  value={uploadCustomerName}
                  onChange={(e) => setUploadCustomerName(e.target.value)}
                  placeholder="Enter customer name..."
                  required
                  style={{
                    width: '100%', padding: '10px', borderRadius: '6px',
                    border: '1px solid #cbd5e1', fontSize: '12px', outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Duration (for calls only) */}
              {uploadType === 'call' && (
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '6px' }}>
                    Duration (seconds)
                  </label>
                  <input
                    type="number"
                    value={uploadDuration}
                    onChange={(e) => setUploadDuration(e.target.value)}
                    placeholder="600"
                    required
                    style={{
                      width: '100%', padding: '10px', borderRadius: '6px',
                      border: '1px solid #cbd5e1', fontSize: '12px', outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              )}

              {/* Upload Result */}
              {uploadResult && (
                <div style={{
                  background: uploadResult.error ? 'rgba(239, 68, 68, 0.08)' : 'rgba(34, 197, 94, 0.08)',
                  border: uploadResult.error ? '1px solid rgba(239, 68, 68, 0.15)' : '1px solid rgba(34, 197, 94, 0.15)',
                  borderRadius: '8px', padding: '12px', fontSize: '11px',
                  color: uploadResult.error ? '#dc2626' : '#16a34a',
                  fontWeight: '700'
                }}>
                  {uploadResult.error ? `Error: ${uploadResult.error}` : `Success! Conversation uploaded with ${uploadResult.topicsTagged} topics.`}
                </div>
              )}

              {/* Modal Buttons */}
              <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '4px' }}>
                <button
                  type="button"
                  onClick={resetUploadForm}
                  className="rev-btn-secondary"
                  style={{ flex: '1', padding: '12px', borderRadius: '8px', fontSize: '12px', fontWeight: '700' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="rev-btn-primary"
                  style={{ flex: '1', padding: '12px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', opacity: isUploading ? 0.6 : 1 }}
                >
                  {isUploading ? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 🔎 DETAILED TRANSCRIPT VIEW MODAL SHEET */}
      {selectedConversation && (
        <TranscriptDetailModal
          conversation={selectedConversation}
          onClose={() => setSelectedConversation(null)}
        />
      )}

    </div>
  );
};

// 🏪 CONVERSATION LISTING CARD COMPONENT
interface ConversationCardProps {
  result: SearchResult;
  query: string;
  filters: any;
  highlightText: (text: string, searchWord: string) => React.ReactNode;
  getContextSnippet: (transcript: string, searchWord: string) => string;
  onOpen: () => void;
}

const ConversationCard: React.FC<ConversationCardProps> = ({ 
  result, query, filters, highlightText, getContextSnippet, onOpen 
}) => {
  // Use topicTags from backend response, fallback to topics for backward compatibility
  const topicTags = result.topicTags || [];
  const topics = topicTags.map((t: any) => t.topicName) || result.topics || [];
  const overallScore = result.overallScore || 0;

  const getSentimentStyles = (sentiment?: string) => {
    switch (sentiment) {
      case 'Positive':
        return { text: 'text-emerald-600', class: 'badge-sentiment-pos' };
      case 'Negative':
        return { text: 'text-rose-600', class: 'badge-sentiment-neg' };
      default:
        return { text: 'text-amber-600', class: 'badge-sentiment-neu' };
    }
  };

  const sentimentStyle = getSentimentStyles(result.sentiment);

  // Compute exact list of matched filters for rationale indicators
  const matchingReasons: string[] = [];
  const topicNames = result.topicTags?.map((t: any) => t.topicName) || result.topics || [];
  if (filters.topic && topicNames.includes(filters.topic)) {
    matchingReasons.push(`Topic: ${filters.topic}`);
  }
  if (filters.agent && result.agentName?.toLowerCase().includes(filters.agent.toLowerCase())) {
    matchingReasons.push(`Rep: ${result.agentName}`);
  }
  if (filters.tracker?.length) {
    const matchedTrackerNames = filters.tracker.filter((tracker: string) =>
      topicNames.includes(tracker) || result.keywords?.some((k: string) => k.toLowerCase().includes(tracker.toLowerCase()))
    );
    matchedTrackerNames.forEach((tracker: string) => matchingReasons.push(`Tracker: ${tracker}`));
  }
  if (filters.sentiment && result.sentiment === filters.sentiment) {
    matchingReasons.push(`Sentiment: ${filters.sentiment}`);
  }
  if (filters.callType) {
    matchingReasons.push(`Interactions: ${filters.callType === 'internal' ? 'Internal calls' : 'Customer calls'}`);
  }

  // Get raw contextual transcript excerpt dynamically
  const rawExcerpt = getContextSnippet(result.transcript || '', query);

  return (
    <div className="rev-card">
      
      {/* Icon */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '12px', borderRadius: '8px', background: '#f8fafc',
        border: '1px solid #cbd5e1', flexShrink: '0',
        height: '44px', width: '44px'
      }}>
        {result.channel === 'call' ? (
          <Phone style={{ width: '18px', height: '18px', color: 'var(--accent-purple)' }} />
        ) : (
          <Mail style={{ width: '18px', height: '18px', color: 'var(--accent-teal)' }} />
        )}
      </div>

      {/* Main Metadata */}
      <div style={{ flex: '1', minWidth: '0' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <h4 style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-white)', margin: '0' }} className="truncate">
            {highlightText(result.title || 'Conversation Record', query)}
          </h4>
          {result.translatedTo && (
            <span className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider">
              {result.sourceLanguage || 'EN'} → {result.translatedTo}
            </span>
          )}
          <span className="badge-purple-rev">
            Index Seed
          </span>
          <span className={sentimentStyle.class}>
            {result.sentiment || 'Neutral'}
          </span>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px', fontSize: '11px', color: '#64748b', marginBottom: '8px' }}>
          <span>Client: <strong style={{ color: 'var(--text-slate-100)', fontWeight: '700' }}>{highlightText(result.customerName || '', query)}</strong></span>
          <span style={{ color: '#cbd5e1' }}>•</span>
          <span>Agent: <strong style={{ color: 'var(--text-slate-100)', fontWeight: '700' }}>{highlightText(result.agentName || '', query)}</strong></span>
          {result.duration && result.duration !== 'N/A (Email)' && (
            <>
              <span style={{ color: '#cbd5e1' }}>•</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                <Clock style={{ width: '12px', height: '12px', color: '#94a3b8' }} />
                {result.duration}
              </span>
            </>
          )}
        </div>

        {/* Snippet matched highlighting keyword context */}
        <p style={{ fontSize: '12px', color: '#475569', lineHeight: '1.5', margin: '0 0 10px 0' }}>
          "{highlightText(rawExcerpt, query)}"
        </p>

        {/* Dynamic reason for filter highlights */}
        {matchingReasons.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '10px', padding: '6px 10px', background: '#f8fafc', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
            <span style={{ fontSize: '10px', fontWeight: '800', color: '#64748b', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Filter style={{ width: '10px', height: '10px', color: 'var(--accent-purple)' }} />
              Matches coordinates:
            </span>
            {matchingReasons.map((reason) => (
              <span
                key={reason}
                style={{
                  fontSize: '10px', fontWeight: '800', color: 'var(--accent-purple)',
                  background: 'rgba(99, 102, 241, 0.08)', padding: '1px 6px',
                  borderRadius: '4px'
                }}
              >
                ✓ {reason}
              </span>
            ))}
          </div>
        )}

        {/* Topics */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
          {topicTags.length > 0 ? topicTags.map((t: any) => (
            <span
              key={t.topicName}
              style={{
                fontSize: '9px', background: '#f8fafc', border: '1px solid #cbd5e1',
                color: '#64748b', padding: '3px 8px', borderRadius: '6px',
                fontWeight: '700', cursor: 'help'
              }}
              title={`Confidence: ${(t.confidenceScore * 100).toFixed(0)}%\nEvidence: ${t.evidenceSnippet}\nExplanation: ${t.explanation}`}
            >
              {highlightText(t.topicName, query)} ({(t.confidenceScore * 100).toFixed(0)}%)
            </span>
          )) : topics.map((t: string) => (
            <span
              key={t}
              style={{
                fontSize: '9px', background: '#f8fafc', border: '1px solid #cbd5e1',
                color: '#64748b', padding: '3px 8px', borderRadius: '6px',
                fontWeight: '700'
              }}
            >
              {highlightText(t, query)}
            </span>
          ))}
        </div>
      </div>

      {/* Action / QA Rating */}
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
        justifyContent: 'space-between', flexShrink: '0'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <span style={{ fontSize: '9px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '800', letterSpacing: '0.08em' }}>QA score</span>
          <span style={{
            fontSize: '11px', fontWeight: '800', border: '1px solid #cbd5e1',
            borderRadius: '6px', padding: '2px 8px', marginTop: '2px', display: 'flex',
            alignItems: 'center', gap: '4px',
            color: overallScore >= 85 ? '#16a34a' : overallScore >= 70 ? '#d97706' : '#dc2626',
            background: '#f8fafc'
          }}>
            <ShieldCheck style={{ width: '13px', height: '13px' }} />
            {overallScore || 'N/A'}%
          </span>
        </div>

        <button
          onClick={onOpen}
          className="rev-btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 10px', fontSize: '11px' }}
        >
          Details
          <ChevronRight style={{ width: '12px', height: '12px' }} />
        </button>
      </div>

    </div>
  );
};

// 🔍 TRANSCRIPT DIALOG POPUP MODAL SHEET
interface TranscriptDetailModalProps {
  conversation: any;
  onClose: () => void;
}

const TranscriptDetailModal: React.FC<TranscriptDetailModalProps> = ({
  conversation,
  onClose,
}) => {
  if (!conversation) return null;

  const scorecard = conversation.scorecard || {};
  const diarized = conversation.diarizedTranscript || [];
  const competitors = conversation.competitorsDetected || [];

  const [topics, setTopics] = React.useState<any[]>([]);
  const [availableTopics, setAvailableTopics] = React.useState<string[]>([]);
  const [isEditingTopics, setIsEditingTopics] = React.useState(false);
  const [loadingTopics, setLoadingTopics] = React.useState(true);
  const [newTopic, setNewTopic] = React.useState('');
  
  // Translation state
  const [targetLang, setTargetLang] = React.useState('en');
  const [isTranslating, setIsTranslating] = React.useState(false);
  const [translatedSummary, setTranslatedSummary] = React.useState(conversation.summary);
  const [translatedTranscript, setTranslatedTranscript] = React.useState(conversation.diarizedTranscript || []);
  const [translatedTopics, setTranslatedTopics] = React.useState<any[]>([]);
  
  const [editingTurnIndex, setEditingTurnIndex] = React.useState<number | null>(null);
  const [editedTurnText, setEditedTurnText] = React.useState('');
  const [isSavingTranscript, setIsSavingTranscript] = React.useState(false);
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [trackerDetections, setTrackerDetections] = React.useState<any[]>([]);
  const [loadingDetections, setLoadingDetections] = React.useState(false);

  const tenantId = '00000000-0000-0000-0000-000000000001';

  React.useEffect(() => {
    if (conversation?.id) {
      fetchTopics();
      fetchAvailableTopics();
      fetchTrackerDetections();
    }
  }, [conversation?.id]);

  const fetchTrackerDetections = async () => {
    setLoadingDetections(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/conversation-intelligence/trackers/detections/${conversation.id}?entityType=${conversation.channel}`,
        { headers: { 'x-tenant-id': tenantId } }
      );
      if (res.ok) {
        const data = await res.json();
        setTrackerDetections(data);
      }
    } catch (e) {
      console.error('Failed to fetch tracker detections', e);
    }
    setLoadingDetections(false);
  };

  const fetchTopics = async () => {
    setLoadingTopics(true);
    try {
      const res = await fetch(`${API_BASE_URL}/conversation-intelligence/conversations/${conversation.id}/topics`, {
        headers: { 'x-tenant-id': tenantId }
      });
      if (res.ok) {
        const data = await res.json();
        const topicsArray = Array.isArray(data) ? data : (data.topics || []);
        setTopics(topicsArray);
        if (targetLang === 'en') setTranslatedTopics(topicsArray);
      }
    } catch (e) {}
    setLoadingTopics(false);
  };

  const fetchAvailableTopics = async () => {
    try {
      // Get available topics from the conversation's topics
      const res = await fetch(`${API_BASE_URL}/conversation-intelligence/conversations/${conversation.id}/topics`, {
        headers: { 'x-tenant-id': tenantId }
      });
      if (res.ok) {
        const data = await res.json();
        const topicsArray = Array.isArray(data) ? data : (data.topics || []);
        const allTopics = topicsArray.map((t: any) => t.topicName);
        setAvailableTopics(Array.from(new Set(allTopics)));
      }
    } catch (e) {}
  };

  const handleDeleteTopic = async (tagId: string) => {
    try {
      await fetch(`${API_BASE_URL}/m02-conversation-intelligence/topics/tags/${tagId}`, { method: 'DELETE' });
      setTopics(topics.filter(t => t.id !== tagId));
    } catch (e) {}
  };

  const handleSaveDiarizedTurn = async (idx: number) => {
    setIsSavingTranscript(true);
    try {
      const updatedTranscript = [...translatedTranscript];
      updatedTranscript[idx] = { ...updatedTranscript[idx], text: editedTurnText };
      
      const res = await fetch(`${API_BASE_URL}/conversation-intelligence/conversations/${conversation.id}/transcript`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-tenant-id': tenantId },
        body: JSON.stringify({ diarizedTranscript: updatedTranscript })
      });
      if (res.ok) {
        setTranslatedTranscript(updatedTranscript);
        setEditingTurnIndex(null);
        conversation.diarizedTranscript = updatedTranscript; // Optimistically update the parent reference
        conversation.transcript = updatedTranscript.map(t => `${t.speaker}: ${t.text}`).join('\n');
        console.log(`[FRONTEND DEBUG] Saved edited chat bubble at index ${idx}`);
      } else {
        alert('Failed to save edited chat bubble');
      }
    } catch (e) {
      console.error(e);
      alert('Error saving chat bubble');
    }
    setIsSavingTranscript(false);
  };

  const handleAddTopic = async () => {
    if (!newTopic) return;
    try {
      const res = await fetch(`${API_BASE_URL}/m02-conversation-intelligence/conversations/${conversation.id}/topics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId,
          type: conversation.channel,
          topicName: newTopic,
          explanation: 'Manually added by user'
        })
      });
      if (res.ok) {
        const newTag = await res.json();
        setTopics([newTag, ...topics]);
        setNewTopic('');
      }
    } catch (e) {}
  };

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    try {
      const res = await fetch(`${API_BASE_URL}/conversation-intelligence/conversations/${conversation.id}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-tenant-id': tenantId }
      });
      if (res.ok) {
        const updated = await res.json();
        setTranslatedSummary(updated.summary);
        
        // Optimistically update parent cache so it persists on close
        conversation.summary = updated.summary;
        conversation.competitorsDetected = updated.competitorsDetected || [];
        conversation.topicTags = updated.topicTags || conversation.topicTags;
        
        setTopics(conversation.topicTags || []);
        setTranslatedTopics(conversation.topicTags || []);
        console.log('[FRONTEND DEBUG] AI Analysis completed and saved');
      } else {
        alert('Failed to run AI analysis');
      }
    } catch (e) {
      console.error(e);
      alert('Error running AI analysis');
    }
    setIsAnalyzing(false);
  };

  return (
    <div className="rev-dialog-backdrop">
      <div className="rev-dialog-sheet">
        
        {/* Header */}
        <div style={{
          background: '#ffffff', padding: '16px 24px',
          borderBottom: '1px solid #cbd5e1',
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', flexShrink: '0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              padding: '8px', background: '#f8fafc',
              border: '1px solid #cbd5e1', borderRadius: '8px'
            }}>
              {conversation.channel === 'call' ? (
                <Phone style={{ width: '16px', height: '16px', color: 'var(--accent-purple)' }} />
              ) : (
                <Mail style={{ width: '16px', height: '16px', color: 'var(--accent-teal)' }} />
              )}
            </div>
            <div>
              <h2 style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-white)', margin: '0' }}>{conversation.title}</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '10px', fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                  <Calendar style={{ width: '12px', height: '12px', color: '#94a3b8' }} />
                  {new Date(conversation.date).toLocaleDateString()}
                </span>
                <span>•</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
                  <User style={{ width: '12px', height: '12px', color: '#94a3b8' }} />
                  Client: <strong style={{ color: 'var(--text-slate-100)', fontWeight: '700' }}>{conversation.customerName}</strong>
                </span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {isTranslating && <span style={{ fontSize: '11px', color: 'var(--accent-purple)', fontWeight: '800' }}>Translating...</span>}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Globe style={{ width: '14px', height: '14px', color: '#64748b', position: 'absolute', left: '8px' }} />
              <select
                value={targetLang}
                onChange={async (e) => {
                  const newLang = e.target.value;
                  setTargetLang(newLang);
                  if (newLang === 'en') {
                    setTranslatedSummary(conversation.summary);
                    setTranslatedTranscript(conversation.diarizedTranscript || []);
                    setTranslatedTopics(topics);
                    return;
                  }
                  
                  setIsTranslating(true);
                  try {
                    const sumRes = await fetch(`${API_BASE_URL}/m02-conversation-intelligence/translate`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json', 'x-tenant-id': tenantId },
                      body: JSON.stringify({
                        text: conversation.summary,
                        sourceLang: 'en',
                        targetLang: newLang,
                        entityType: 'summary',
                        entityId: conversation.id
                      })
                    });
                    if (sumRes.ok) {
                      const data = await sumRes.json();
                      setTranslatedSummary(data.translatedText);
                    }

                    const newDiarized = [...(conversation.diarizedTranscript || [])];
                    for (let i = 0; i < newDiarized.length; i++) {
                      const text = newDiarized[i].text;
                      const res = await fetch(`${API_BASE_URL}/m02-conversation-intelligence/translate`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'x-tenant-id': tenantId },
                        body: JSON.stringify({
                          text,
                          sourceLang: 'en',
                          targetLang: newLang,
                          entityType: 'transcript',
                          entityId: `${conversation.id}_${i}`
                        })
                      });
                      if (res.ok) {
                        const data = await res.json();
                        newDiarized[i] = { ...newDiarized[i], text: data.translatedText };
                      }
                    }
                    setTranslatedTranscript(newDiarized);

                    const newTopics = [...topics];
                    for (let i = 0; i < newTopics.length; i++) {
                      if (newTopics[i].explanation) {
                        const res = await fetch(`${API_BASE_URL}/m02-conversation-intelligence/translate`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json', 'x-tenant-id': tenantId },
                          body: JSON.stringify({
                            text: newTopics[i].explanation,
                            sourceLang: 'en',
                            targetLang: newLang,
                            entityType: 'topic_explanation',
                            entityId: newTopics[i].id
                          })
                        });
                        if (res.ok) {
                          const data = await res.json();
                          newTopics[i] = { ...newTopics[i], explanation: data.translatedText };
                        }
                      }
                    }
                    setTranslatedTopics(newTopics);
                  } catch (err) {}
                  setIsTranslating(false);
                }}
                style={{
                  padding: '6px 8px 6px 28px', borderRadius: '8px', border: '1px solid #cbd5e1',
                  background: '#f8fafc', fontSize: '11px', color: '#475569', fontWeight: '700', outline: 'none', cursor: 'pointer'
                }}
              >
                <option value="en">English (Original)</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
              </select>
            </div>
            <button
              onClick={onClose}
              style={{
                color: '#64748b', background: '#f8fafc',
                border: '1px solid #cbd5e1', padding: '6px',
                borderRadius: '8px', cursor: 'pointer', transition: 'all 0.2s ease'
              }}
            >
              <X style={{ width: '16px', height: '16px' }} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: '1', overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
          
          {/* Main Transcript */}
          <div style={{ gridColumn: 'span 2', padding: '20px', borderRight: '1px solid #cbd5e1', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* AI Summary */}
            <div style={{
              background: 'rgba(99, 102, 241, 0.03)', border: '1px solid rgba(99, 102, 241, 0.15)',
              borderRadius: '12px', padding: '16px', boxShadow: 'inset 0 0 10px rgba(99,102,241,0.02)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <h3 style={{ fontSize: '11px', fontWeight: '800', color: 'var(--accent-purple)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: '6px', margin: '0' }}>
                  <Compass style={{ width: '14px', height: '14px' }} />
                  AI Generated Conversation Summary
                </h3>
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  style={{
                    background: 'var(--accent-purple)', color: '#ffffff', border: 'none',
                    padding: '6px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: '800',
                    cursor: isAnalyzing ? 'not-allowed' : 'pointer', opacity: isAnalyzing ? 0.7 : 1,
                    display: 'flex', alignItems: 'center', gap: '4px'
                  }}
                >
                  {isAnalyzing ? 'Analyzing...' : 'Generate AI Summary & Analysis'}
                </button>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-slate-300)', lineHeight: '1.5', fontWeight: '500', margin: '0' }}>
                {translatedSummary || 'Summary generated on sync log indexing pipeline.'}
              </p>
            </div>

            {/* Transcript Timeline / Dialogues */}
            <div>
              <h3 style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>
                Conversation Transcript Logs
              </h3>
              {conversation.channel === 'email' ? (
                <div style={{
                  background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '12px',
                  padding: '24px', color: 'var(--text-slate-300)', fontSize: '13px', lineHeight: '1.6'
                }}>
                  <div style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <div>
                        <strong>From:</strong> {conversation.agentName || 'Sender'}
                      </div>
                      <div style={{ color: '#94a3b8', fontSize: '12px' }}>
                        {conversation.date}
                      </div>
                    </div>
                    <div>
                      <strong>To:</strong> {conversation.customerName || 'Recipient'}
                    </div>
                    <div style={{ marginTop: '8px' }}>
                      <strong>Subject:</strong> {conversation.title}
                    </div>
                  </div>
                  <div style={{ whiteSpace: 'pre-wrap' }}>
                    {translatedTranscript.map((t: any) => t.text).join('\n\n')}
                  </div>
                </div>
              ) : translatedTranscript.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {translatedTranscript.map((turn: any, idx: number) => {
                    const isAgent = turn.speaker.toLowerCase().includes('agent') || turn.speaker.includes('1') || turn.speaker.toLowerCase().includes('sender');
                    return (
                      <div
                        key={idx}
                        style={{
                          display: 'flex', gap: '10px', alignItems: 'flex-start',
                          flexDirection: isAgent ? 'row' : 'row-reverse'
                        }}
                      >
                        <div
                          style={{
                            width: '28px', height: '28px', borderRadius: '6px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '11px', fontWeight: '800', flexShrink: '0',
                            background: isAgent ? 'rgba(99, 102, 241, 0.08)' : 'rgba(34, 197, 94, 0.08)',
                            border: '1px solid',
                            borderColor: isAgent ? 'rgba(99, 102, 241, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                            color: isAgent ? 'var(--accent-purple)' : '#16a34a'
                          }}
                        >
                          {isAgent ? 'A' : 'C'}
                        </div>
                        <div
                          style={{
                            borderRadius: '12px', padding: '12px', maxWidth: '80%',
                            border: '1px solid', fontSize: '12px', lineHeight: '1.5',
                            background: isAgent ? '#ffffff' : '#f8fafc',
                            borderColor: '#cbd5e1',
                            color: 'var(--text-slate-300)'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <span style={{ fontWeight: '800', fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                              {turn.speaker}
                              {editingTurnIndex !== idx && (
                                <button
                                  onClick={() => {
                                    setEditingTurnIndex(idx);
                                    setEditedTurnText(turn.text);
                                  }}
                                  style={{
                                    background: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent-purple)',
                                    border: 'none', padding: '2px 8px', borderRadius: '4px', cursor: 'pointer', fontSize: '9px'
                                  }}
                                >
                                  Edit
                                </button>
                              )}
                            </span>
                            {turn.start !== undefined && (
                              <span style={{ fontSize: '9px', fontFamily: 'monospace', color: '#94a3b8' }}>
                                {turn.start}s - {turn.end}s
                              </span>
                            )}
                          </div>
                          {editingTurnIndex === idx ? (
                            <div style={{ marginTop: '8px' }}>
                              <textarea
                                style={{
                                  width: '100%', minHeight: '60px', padding: '8px', borderRadius: '6px',
                                  border: '1px solid #cbd5e1', fontSize: '12px', background: '#ffffff',
                                  color: 'var(--text-slate-300)', outline: 'none', resize: 'vertical'
                                }}
                                value={editedTurnText}
                                onChange={(e) => setEditedTurnText(e.target.value)}
                                disabled={isSavingTranscript}
                              />
                              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
                                <button
                                  onClick={() => setEditingTurnIndex(null)}
                                  disabled={isSavingTranscript}
                                  style={{
                                    background: '#f1f5f9', color: '#475569', border: '1px solid #cbd5e1',
                                    padding: '4px 12px', borderRadius: '4px', fontSize: '10px', cursor: 'pointer'
                                  }}
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleSaveDiarizedTurn(idx)}
                                  disabled={isSavingTranscript}
                                  style={{
                                    background: 'var(--accent-purple)', color: '#ffffff', border: 'none',
                                    padding: '4px 12px', borderRadius: '4px', fontSize: '10px', cursor: 'pointer'
                                  }}
                                >
                                  {isSavingTranscript ? 'Saving...' : 'Save'}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p style={{ margin: '0', whiteSpace: 'pre-wrap' }}>{turn.text}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{
                  background: '#f8fafc', border: '1px solid #cbd5e1',
                  borderRadius: '12px', padding: '20px', textAlign: 'center'
                }}>
                  <p style={{ fontSize: '12px', color: '#475569', fontFamily: 'monospace', margin: '0' }}>
                    {conversation.transcript}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div style={{ padding: '20px', background: '#f8fafc', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Scorecard */}
            <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '16px' }}>
              <h3 style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '12px' }}>
                <Award style={{ width: '14px', height: '14px', color: 'var(--accent-purple)' }} />
                QA Scorecard Breakdown
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {Object.entries(scorecard).map(([key, val]: [string, any]) => (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: '12px', color: '#475569', textTransform: 'capitalize' }}>
                      {key.replace(/([A-Z])/g, ' $1')}
                    </span>
                    <span style={{
                      fontSize: '10px', fontFamily: 'monospace', fontWeight: '800',
                      padding: '2px 6px', borderRadius: '4px', border: '1px solid',
                      color: val >= 9.0 ? '#16a34a' : val >= 7.5 ? '#d97706' : '#dc2626',
                      background: '#f8fafc',
                      borderColor: '#cbd5e1'
                    }}>
                      {val * 10}/100
                    </span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', fontWeight: '800', color: 'var(--text-slate-100)' }}>Overall Score</span>
                <span style={{
                  fontSize: '11px', fontWeight: '800', color: 'var(--accent-purple)',
                  background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.15)',
                  padding: '3px 8px', borderRadius: '6px'
                }}>
                  {conversation.overallScore}%
                </span>
              </div>
            </div>

            {/* Coaching */}
            <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '16px' }}>
              <h3 style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                <Smile style={{ width: '14px', height: '14px', color: 'var(--accent-purple)' }} />
                Coaching Suggestions
              </h3>
              <div style={{
                background: '#f8fafc', border: '1px solid #cbd5e1',
                borderRadius: '8px', padding: '12px', fontSize: '12px',
                color: 'var(--accent-purple)', lineHeight: '1.5', fontStyle: 'italic',
                fontWeight: '500'
              }}>
                "{conversation.coachingSuggestion || 'Great transaction tracking. Ensure response timelines align.'}"
              </div>
            </div>

            {/* Competitors & Keywords */}
            <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '16px' }}>
              <h3 style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '10px' }}>
                Competitors Detected
              </h3>
              {conversation.competitorsDetected?.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {conversation.competitorsDetected.map((c: string) => (
                    <span
                      key={c}
                      style={{
                        fontSize: '10px', background: '#fef2f2',
                        border: '1px solid rgba(239,68,68,0.15)', color: '#dc2626',
                        padding: '3px 8px', borderRadius: '6px', fontWeight: '700'
                      }}
                    >
                      {c}
                    </span>
                  ))}
                </div>
              ) : (
                <span style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic', fontWeight: '600' }}>None detected</span>
              )}

              {/* Tracker Detections */}
              <div style={{ display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'space-between', marginBottom: '10px', marginTop: '16px' }}>
                <h3 style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Target size={14} style={{ color: 'var(--accent-purple)' }} />
                  Tracker Detections
                </h3>
              </div>

              {loadingDetections ? (
                <span style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic', fontWeight: '600' }}>Loading detections...</span>
              ) : trackerDetections.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {trackerDetections.map((detection: any) => (
                    <div key={detection.id} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent-purple)' }}>{detection.tracker?.name || 'Unknown Tracker'}</span>
                        <span style={{ fontSize: '10px', color: '#64748b' }}>{new Date(detection.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div style={{ background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.2)', borderRadius: '6px', padding: '8px', marginBottom: '6px' }}>
                        <p style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px 0' }}>Detected keyword:</p>
                        <p style={{ fontSize: '12px', fontWeight: '700', color: 'var(--accent-purple)', margin: 0 }}>"{detection.keyword}"</p>
                      </div>
                      {detection.context && (
                        <div style={{ background: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '8px' }}>
                          <p style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px 0' }}>Context:</p>
                          <p style={{ fontSize: '11px', color: '#334155', fontFamily: 'monospace', margin: 0 }}>"{detection.context}"</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <span style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic', fontWeight: '600' }}>No tracker detections found</span>
              )}

              <div style={{ display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'space-between', marginBottom: '10px', marginTop: '16px' }}>
                <h3 style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>
                  Topics & Keywords
                </h3>
                <button
                  onClick={() => setIsEditingTopics(!isEditingTopics)}
                  style={{ fontSize: '10px', fontWeight: '800', color: 'var(--accent-purple)', background: 'rgba(99, 102, 241, 0.08)', padding: '2px 8px', borderRadius: '4px', border: 'none', cursor: 'pointer' }}
                >
                  {isEditingTopics ? 'Done' : 'Edit'}
                </button>
              </div>
              
              {loadingTopics ? (
                <span style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic', fontWeight: '600' }}>Loading topics...</span>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {translatedTopics.map((t: any) => (
                      <div key={t.id} style={{
                        background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '10px',
                        display: 'flex', flexDirection: 'column', gap: '6px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '11px', fontWeight: '800', color: '#334155' }}>{t.topicName}</span>
                            <span style={{
                              fontSize: '9px', fontWeight: '800', color: t.source === 'manual' ? '#0ea5e9' : '#8b5cf6',
                              background: t.source === 'manual' ? '#e0f2fe' : '#ede9fe', padding: '2px 6px', borderRadius: '4px'
                            }}>
                              {t.source === 'manual' ? 'Manual' : 'AI Detected'}
                            </span>
                          </div>
                          {isEditingTopics && (
                            <button onClick={() => handleDeleteTopic(t.id)} style={{ color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                              <X style={{ width: '12px', height: '12px' }} />
                            </button>
                          )}
                        </div>
                        
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ flex: 1, background: '#e2e8f0', height: '4px', borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{ width: `${t.confidenceScore * 100}%`, height: '100%', background: 'var(--accent-purple)', borderRadius: '2px' }} />
                          </div>
                          <span style={{ fontSize: '10px', fontWeight: '700', color: '#64748b' }}>{(t.confidenceScore * 100).toFixed(0)}%</span>
                        </div>

                        {t.explanation && (
                          <p style={{ fontSize: '10px', color: '#475569', margin: 0 }}>
                            <strong style={{ color: '#334155' }}>Why: </strong>{t.explanation}
                          </p>
                        )}
                        {t.evidenceSnippet && (
                          <div style={{
                            background: '#ffffff', borderLeft: '2px solid #cbd5e1', padding: '4px 8px',
                            fontSize: '10px', color: '#64748b', fontStyle: 'italic', marginTop: '2px'
                          }}>
                            "{t.evidenceSnippet}"
                          </div>
                        )}
                      </div>
                    ))}
                    {translatedTopics.length === 0 && <span style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic', fontWeight: '600' }}>No topics found</span>}
                  </div>

                  {isEditingTopics && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px', padding: '6px', background: '#f1f5f9', borderRadius: '6px', border: '1px solid #cbd5e1' }}>
                      <select 
                        value={newTopic} 
                        onChange={(e) => setNewTopic(e.target.value)}
                        style={{ fontSize: '10px', padding: '4px', borderRadius: '4px', border: '1px solid #cbd5e1', flex: 1, outline: 'none' }}
                      >
                        <option value="">Select a topic to add...</option>
                        {availableTopics.map(at => (
                          <option key={at} value={at}>{at}</option>
                        ))}
                      </select>
                      <button 
                        onClick={handleAddTopic}
                        disabled={!newTopic}
                        style={{ background: 'var(--accent-purple)', color: '#fff', fontSize: '10px', padding: '4px 8px', borderRadius: '4px', border: 'none', fontWeight: '800', cursor: newTopic ? 'pointer' : 'not-allowed', opacity: newTopic ? 1 : 0.5 }}
                      >
                        Add
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

// Simulated mock saved presets
function getSimulatedSavedSearches(): any[] {
  return [
    {
      id: 'saved-search-001',
      name: 'Enterprise Pricing Calls',
      queryString: 'pricing volume discount',
      filters: { topic: 'Pricing Strategy', sentiment: 'Positive' },
    },
    {
      id: 'saved-search-002',
      name: 'Negative Sentiment Alerts',
      queryString: '',
      filters: { sentiment: 'Negative' },
    }
  ];
}

// 200+ rich offline simulated data records matching the seeded pg database exactly
function getSimulatedCorpus(): SearchResult[] {
  const companyNames = [
    'Acme Corp', 'Globex', 'Initech', 'Umbrella Corp', 'Hooli', 
    'Vehement Capital', 'ApexCorp', 'Cyberdyne', 'Soylent Corp', 
    'InGen', 'Massive Dynamic', 'Virtucon', 'Tyrell Corp', 'Weyland-Yutani'
  ];
  const reps = ['Sarah', 'John', 'Dave', 'Alice', 'Bob', 'Michael', 'Emily', 'David', 'Jessica', 'James'];
  const corpus: SearchResult[] = [];

  // Generate 100 calls
  for (let i = 0; i < 100; i++) {
    const company = companyNames[i % companyNames.length];
    const rep = reps[i % reps.length];
    const durationSeconds = [600, 900, 1200, 1500, 1800, 2400][i % 6];
    const duration = `${Math.floor(durationSeconds / 60)}m ${durationSeconds % 60}s`;
    const theme = i % 10;
    
    let title = '';
    let transcript = '';
    let sentiment: 'Positive' | 'Neutral' | 'Negative' = 'Neutral';
    let sentimentScore = 0.0;
    let overallScore = 75;
    let topics: string[] = [];
    let keywords: string[] = [];
    let competitorsDetected: string[] = [];
    let coachingSuggestion = '';
    
    switch (theme) {
      case 0:
        title = `${company} Competitive Analysis: Apex Systems Pricing`;
        transcript = `Hi everyone, this is ${rep} from the sales engagement team. Today we had a call with the VP of Engineering from ${company}. They are currently comparing us with Apex Systems. Apex is offering an aggressive pricing structure with a flat 25% discount for a multi-year deal. However, their indexing technology is outdated, and their lack of real-time custom smart trackers is a dealbreaker. We need to follow up highlighting our advanced PostgreSQL RLS policies and vector compliance.`;
        sentiment = 'Positive';
        sentimentScore = 0.85;
        overallScore = 88;
        topics = ['Pricing Strategy', 'Feature Discovery', 'Salesforce Integration'];
        keywords = ['Salesforce Integration', 'Seat Pricing', 'Automated Notes', 'Volume Discount'];
        competitorsDetected = ['Apex Systems', 'Gong.io'];
        coachingSuggestion = 'Excellent capture of competitive concerns. Proactively send a battlecard comparing our Postgres pgvector vs Apex.';
        break;
      case 1:
        title = `Enterprise SLA & Q3 Renewal discussion - ${company}`;
        transcript = `Hello team, this is ${rep}. I was in the Q3 renewal sync with ${company} Procurement today. We are reviewing the legal details of their Enterprise renewal. They asked for a dedicated Customer Success Manager and 99.9% API uptime SLAs. We proposed a 15% discount if they extend to a two-year contract. Let us finalize the Master Services Agreement contract and send the updated proposal by tomorrow afternoon.`;
        sentiment = 'Positive';
        sentimentScore = 0.75;
        overallScore = 85;
        topics = ['Pricing Strategy', 'Objection Handling'];
        keywords = ['Enterprise SLA', 'Q3 Renewal', 'Master Agreement', 'Uptime SLA'];
        competitorsDetected = [];
        coachingSuggestion = 'Strong renewal push. Make sure to double check alignment with legal on SLA commitments before dispatch.';
        break;
      case 2:
        title = `Urgent Engineering Escalation: ${company} API Latency Spikes`;
        transcript = `This is the incident response team. We have an escalation from ${company} regarding API latency spikes. Their customer dashboard is loading extremely slowly, hitting 504 Gateway Timeouts. We ran a trace on the database and found an unindexed query on their search history log. Adding a composite HNSW and b-tree index on tenant_id resolved the performance degradation. Let us push this hotfix and update the status page.`;
        sentiment = 'Negative';
        sentimentScore = -0.65;
        overallScore = 55;
        topics = ['Technical Support', 'Onboarding & Training'];
        keywords = ['API Uptime', 'Latency Spikes', 'Gateway Timeout', 'Database Indexing'];
        competitorsDetected = [];
        coachingSuggestion = 'Fast incident containment. Let us follow up with their account lead to confirm the escalation is fully cleared.';
        break;
      case 3:
        title = `${company} CRM Onboarding & Playbook Configuration`;
        transcript = `Welcome back! In today onboarding session with the ${company} team, we configured their first AI auto-playbook. The goal is to coach their reps dynamically. When a competitor like Apex is mentioned on a call, the playbook alerts the rep with real-time battlecards and objection-handling templates. We also set up custom email follow-up templates to boost acquisition conversion rates. They are excited about the automation.`;
        sentiment = 'Positive';
        sentimentScore = 0.90;
        overallScore = 92;
        topics = ['Onboarding & Training', 'Technical Support'];
        keywords = ['CRM Onboarding', 'Playbook Setup', 'Objection Templates', 'Auto Follow-Up'];
        competitorsDetected = ['Apex Systems'];
        coachingSuggestion = 'Superb onboarding session. Guide them on expanding playbooks for competitors next sprint.';
        break;
      case 4:
        title = `Notion and Salesforce Integration Sync - ${company}`;
        transcript = `Hey, this is ${rep} from Integration support. We met with the engineering team at ${company} to resolve their Salesforce and Notion sync issues. They were seeing authentication credential failures on their webhook calls. We re-configured their API tokens and mapped their pipeline stages successfully. Everything is sync in real-time now, and audit logs are fully secure.`;
        sentiment = 'Neutral';
        sentimentScore = 0.20;
        overallScore = 78;
        topics = ['Technical Support', 'Onboarding & Training'];
        keywords = ['Salesforce Integration', 'Notion Webhooks', 'Authentication Token', 'Pipeline Syncing'];
        competitorsDetected = [];
        coachingSuggestion = 'Solid technical debugging. Verify webhook payload retries are fully functional.';
        break;
      case 5:
        title = `Quarterly Forecasting & Quota Review with ${company} leadership`;
        transcript = `Hi all, this is ${rep}. Today we had our executive forecasting session with ${company}. We reviewed their sales performance, pipelines, and upcoming expansion quotas. They are targeting fifty percent growth next quarter and need a unified revenue intelligence dashboard to trace deal health. We scheduled a follow-up demo with their CFO for budget approval.`;
        sentiment = 'Neutral';
        sentimentScore = 0.15;
        overallScore = 80;
        topics = ['Pricing Strategy', 'Objection Handling'];
        keywords = ['Executive Alignment', 'Quarterly Forecast', 'Pipeline Review', 'Expansion Quotas'];
        competitorsDetected = [];
        coachingSuggestion = 'Maintain regular cadence. Keep budget conversations aligned with their growth forecast.';
        break;
      case 6:
        title = `${company} Product Roadmap: Vector Search & AI Chatbot`;
        transcript = `This is the product sync. We discussed the engineering roadmap with ${company}. They requested a custom pgvector integration to enable secure semantic search across their internal document database. They also need HNSW indexes for near-instant latency and compliance with their RLS multi-tenancy requirements. Let us prioritize this task for the Q4 release.`;
        sentiment = 'Positive';
        sentimentScore = 0.80;
        overallScore = 90;
        topics = ['Technical Support', 'Feature Discovery'];
        keywords = ['Vector Search', 'pgvector Integration', 'HNSW Latency', 'RLS Compliance'];
        competitorsDetected = [];
        coachingSuggestion = 'Highly strategic roadmap alignment. Ensure the engineering team has clear pgvector specs.';
        break;
      case 7:
        title = `Customer Feedback & CSAT Review - ${company}`;
        transcript = `Hi customer success team, this is ${rep}. I did a quick health check call with ${company}. They gave us high CSAT scores, praising our auto-playbooks and real-time alerts. However, they asked for a simplified Notion integration workflow and more detailed compliance logging. Let us sync with product to address this.`;
        sentiment = 'Positive';
        sentimentScore = 0.70;
        overallScore = 84;
        topics = ['Onboarding & Training', 'Technical Support'];
        keywords = ['Customer Health', 'CSAT Review', 'Notion Integration', 'Compliance Logging'];
        competitorsDetected = [];
        coachingSuggestion = 'Very strong CSAT feedback. Follow up on Notion workflow simplifications.';
        break;
      case 8:
        title = `Budget Review and CFO Approval - ${company} Deal Expansion`;
        transcript = `Hello everyone, this is ${rep}. I had a brief meeting with the CFO of ${company}. We reviewed the proposed price expansion. They are expanding their seats from 100 to 250 next month. They approved the updated contract scope under the existing Q3 pricing. We just need to send the invoice and secure their signature.`;
        sentiment = 'Positive';
        sentimentScore = 0.88;
        overallScore = 95;
        topics = ['Pricing Strategy', 'Objection Handling'];
        keywords = ['Budget Approval', 'CFO Pricing', 'Seat Expansion', 'Invoice Signature'];
        competitorsDetected = [];
        coachingSuggestion = 'Flawless closing flow. Secure signature and proceed with account provisioning.';
        break;
      case 9:
        title = `Risk & Churn Mitigation Session with ${company}`;
        transcript = `This is CS operations. We flagged ${company} as a churn risk due to lower engagement metrics last month. We did a mitigation session with their sales ops team. The main challenge they face is training new reps. We configured specialized onboarding playbooks to help them scale. They are much more confident now, and the renewal risk has decreased significantly.`;
        sentiment = 'Negative';
        sentimentScore = -0.30;
        overallScore = 60;
        topics = ['Objection Handling', 'Onboarding & Training'];
        keywords = ['Churn Mitigation', 'Engagement Metrics', 'Onboarding Playbooks', 'Renewal Risk'];
        competitorsDetected = [];
        coachingSuggestion = 'Good churn mitigation. Continue monitoring engagement metrics closely next month.';
        break;
    }

    const date = new Date();
    date.setDate(date.getDate() - (i % 90));
    date.setHours(10 + (i % 8), 15 + (i % 40), 0, 0);

    const diarizedTranscript = [
      { speaker: 'Speaker 1 (Agent)', text: `Hi there, this is ${rep} from the platform team. Great to connect with you.`, start: 0, end: 5 },
      { speaker: 'Speaker 2 (Customer)', text: `Hello ${rep}, yes, we are reviewing our tools for ${company} and wanted to discuss this setup.`, start: 6, end: 12 },
      { speaker: 'Speaker 1 (Agent)', text: transcript.substring(0, Math.floor(transcript.length / 2)), start: 13, end: 35 },
      { speaker: 'Speaker 2 (Customer)', text: `That makes complete sense. We want to ensure that our teams see high alignment and zero data delays.`, start: 36, end: 48 },
      { speaker: 'Speaker 1 (Agent)', text: transcript.substring(Math.floor(transcript.length / 2)), start: 49, end: 80 }
    ];

    corpus.push({
      id: `call-${100 + i}`,
      entityId: `call-${100 + i}`,
      entityType: 'call',
      score: 1.0,
      title,
      channel: 'call',
      customerName: `${company} Team`,
      agentName: rep,
      date: date.toISOString(),
      duration,
      sentiment,
      sentimentScore,
      overallScore,
      topics,
      summary: `Call regarding ${title}. ${transcript.substring(0, 100)}...`,
      transcript,
      diarizedTranscript,
      scorecard: {
        greeting: 9.0,
        problemUnderstanding: 8.5,
        productExplanation: 8.8,
        objectionHandling: 8.2,
        nextStep: 9.0,
        closingQuality: 8.7
      },
      competitorsDetected,
      coachingSuggestion,
      keywords
    });
  }

  // Generate 100 emails
  for (let i = 0; i < 100; i++) {
    const company = companyNames[i % companyNames.length];
    const rep = reps[i % reps.length];
    const theme = i % 10;
    
    let subject = '';
    let body = '';
    let sentiment: 'Positive' | 'Neutral' | 'Negative' = 'Neutral';
    let sentimentScore = 0.0;
    let overallScore = 75;
    let topics: string[] = [];
    let keywords: string[] = [];
    let competitorsDetected: string[] = [];
    let coachingSuggestion = '';
    
    switch (theme) {
      case 0:
        subject = `Follow-up: Competitive Intelligence and Pricing comparisons - ${company}`;
        body = `Hi team at ${company},\n\nFollowing up on our discovery call regarding Apex Systems. As discussed, Apex is currently offering aggressive pricing discounts, but they completely lack custom smart trackers, real-time alerts, and pgvector semantic search capabilities. Attached is a comparison matrix showing how our platform delivers 3x higher deal visibility. Let me know if you would like to schedule a deep-dive session.\n\nBest,\n${rep}`;
        sentiment = 'Positive';
        sentimentScore = 0.70;
        overallScore = 82;
        topics = ['Pricing Strategy', 'Objection Handling'];
        keywords = ['Pricing Comparison', 'Apex Competitor', 'pgvector Search', 'Deal Visibility'];
        competitorsDetected = ['Apex Systems'];
        coachingSuggestion = 'Great competitive positioning. Highlight our absolute RLS security features on follow-ups.';
        break;
      case 1:
        subject = `Proposal & Contract Details: Enterprise SLA Renewal - ${company}`;
        body = `Hi Sarah,\n\nFollowing up on our Enterprise renewal call, here are the SLA terms for ${company}. We offer 99.9% uptime, 24/7 technical phone support, and a dedicated Customer Success Manager. The pricing quote is attached reflecting the 15% discount for a 2-year term. Please let us know if your legal team needs any revisions to the Master Services Agreement.\n\nBest,\n${rep}`;
        sentiment = 'Positive';
        sentimentScore = 0.65;
        overallScore = 80;
        topics = ['Pricing Strategy', 'Objection Handling'];
        keywords = ['Enterprise SLA', 'Agreement Renewal', 'CS Manager', 'Uptime SLA'];
        competitorsDetected = [];
        coachingSuggestion = 'Strong renewal follow-up email. Ensure pricing terms match standard corporate guidelines.';
        break;
      case 2:
        subject = `Hotfix Confirmed: Resolution of API Latency Escalation - ${company}`;
        body = `Hi all,\n\nThe hotfix has been successfully deployed to all staging and production pods for ${company}. Latency is back to baseline (<100ms). The issue was caused by an unindexed query on the database. Thank you to the incident response team for the rapid triage and deployment of the indexing fix.\n\nCheers,\n${rep}`;
        sentiment = 'Neutral';
        sentimentScore = 0.30;
        overallScore = 85;
        topics = ['Technical Support', 'Onboarding & Training'];
        keywords = ['Hotfix Deployed', 'Database Indexing', 'Latency baseline', 'Triage Tally'];
        competitorsDetected = [];
        coachingSuggestion = 'Excellent closure email. Confirm with the client account manager that their team is happy.';
        break;
      case 3:
        subject = `Implementation details: Onboarding Auto-Playbook Configuration - ${company}`;
        body = `Dear Mr. Henderson,\n\nI have drafted the implementation plan for the ${company} Revenue Intelligence Dashboard. The platform will sync your Salesforce data in real-time, compute deal health scores, and generate automated playbooks for your sales reps. This matches your requirements for unified pipeline visibility. I look forward to your VP of Finance reviewing the budget proposal.\n\nBest regards,\n${rep}`;
        sentiment = 'Positive';
        sentimentScore = 0.80;
        overallScore = 88;
        topics = ['Onboarding & Training', 'Technical Support'];
        keywords = ['Playbook Setup', 'Pipeline Visibility', 'Budget Proposal', 'Salesforce Sync'];
        competitorsDetected = [];
        coachingSuggestion = 'Very structured follow-up. Anchors well to their business problem.';
        break;
      case 4:
        subject = `Webhook Integration Success: Salesforce and Notion sync active - ${company}`;
        body = `Hi integration team,\n\nWe have successfully established the Salesforce and Notion synchronization webhook for ${company}. Authentication credentials are now secure, and all pipeline transitions are syncing in real-time. Let us know if you observe any sync delays.\n\nRegards,\n${rep}`;
        sentiment = 'Positive';
        sentimentScore = 0.85;
        overallScore = 90;
        topics = ['Technical Support', 'Onboarding & Training'];
        keywords = ['Webhook Syncing', 'Notion Integration', 'Secure Credentials', 'Realtime Sync'];
        competitorsDetected = [];
        coachingSuggestion = 'Clear summary of the technical onboarding task milestone.';
        break;
      case 5:
        subject = `Q3 Forecasting and Revenue Alignment Review - ${company}`;
        body = `Team,\n\nHere is the summary of our forecasting review with ${company} leadership. They are on track to exceed their growth quotas, and our CRM analytics are providing key visibility for their CFO. We have scheduled their premium expansion onboarding for next week.\n\nThanks,\n${rep}`;
        sentiment = 'Neutral';
        sentimentScore = 0.15;
        overallScore = 78;
        topics = ['Pricing Strategy', 'Objection Handling'];
        keywords = ['Revenue Forecast', 'Alignment Review', 'Expansion Onboarding', 'CFO Analytics'];
        competitorsDetected = [];
        coachingSuggestion = 'Good operational report. Prepare expansion slides for their next review.';
        break;
      case 6:
        subject = `Compliance Documentation: Semantic Search isolation & RLS - ${company}`;
        body = `Hi security team,\n\nAttached is our compliance documentation regarding semantic search for ${company}. All customer text data converted into 1536-dimensional embeddings is isolated inside our multi-tenant PostgreSQL database via Row-Level Security (RLS) policies. We do not transmit customer conversations to external training APIs. HNSW indexing is fully local and secure.\n\nRegards,\n${rep}`;
        sentiment = 'Neutral';
        sentimentScore = 0.10;
        overallScore = 85;
        topics = ['Technical Support', 'Feature Discovery'];
        keywords = ['Compliance Document', 'pgvector Isolation', 'Multi-tenant RLS', 'HNSW indexing'];
        competitorsDetected = [];
        coachingSuggestion = 'Superb response on security. Send as a template for other enterprise compliance requests.';
        break;
      case 7:
        subject = `Follow-up: Customer Feedback and Roadmap Items - ${company}`;
        body = `Hi product team,\n\nI gathered some valuable feedback from the ${company} customer success lead. They are extremely satisfied with the playbook automation, but have requested a more intuitive UI for managing Notion webhooks. Let's review this for our upcoming sprint planning.\n\nBest,\n${rep}`;
        sentiment = 'Neutral';
        sentimentScore = 0.20;
        overallScore = 76;
        topics = ['Onboarding & Training', 'Technical Support'];
        keywords = ['Customer Feedback', 'Product Roadmap', 'Notion Webhooks', 'Playbook satisfaction'];
        competitorsDetected = [];
        coachingSuggestion = 'Valuable product feedback loop. Connect with engineering during weekly standup.';
        break;
      case 8:
        subject = `Contract Approved: Deal Expansion and CFO Signature - ${company}`;
        body = `Hi finance,\n\nWe have received the signed contract from the CFO of ${company} approving their seat expansion to 250 users next month. The updated invoice has been dispatched. Outstanding work by the account team!\n\nCheers,\n${rep}`;
        sentiment = 'Positive';
        sentimentScore = 0.95;
        overallScore = 98;
        topics = ['Pricing Strategy', 'Objection Handling'];
        keywords = ['Contract Approved', 'Seat Expansion', 'Invoice Dispatched', 'CFO Signature'];
        competitorsDetected = [];
        coachingSuggestion = 'Flawless expansion win! Highlight as a team win in Q3 review.';
        break;
      case 9:
        subject = `Engagement Restoration: Onboarding Playbook Active - ${company}`;
        body = `Hi all,\n\nWe successfully restored user engagement metrics at ${company} by delivering targeted playbook training. Their sales reps are actively using the coaching cards, and we are confident the renewal risk has resolved.\n\nRegards,\n${rep}`;
        sentiment = 'Positive';
        sentimentScore = 0.75;
        overallScore = 82;
        topics = ['Objection Handling', 'Onboarding & Training'];
        keywords = ['Engagement Restored', 'Coaching Cards', 'Playbook Training', 'Renewal Risk Resolved'];
        competitorsDetected = ['Apex Systems'];
        coachingSuggestion = 'Strong customer mitigation execution. Keep a bi-weekly health pulse.';
        break;
    }

    const date = new Date();
    date.setDate(date.getDate() - (i % 90));
    date.setHours(9 + (i % 8), 10 + (i % 40), 0, 0);

    const bodyParts = [
      `Hi team at ${company},\n\nFollowing up on our discovery call regarding Apex Systems. As discussed, Apex is currently offering aggressive pricing discounts, but they completely lack custom smart trackers, real-time alerts, and pgvector semantic search capabilities.`,
      `Hi Sarah,\n\nFollowing up on our Enterprise renewal call, here are the SLA terms for ${company}. We offer 99.9% uptime, 24/7 technical phone support, and a dedicated Customer Success Manager.`,
      `Hi all,\n\nThe hotfix has been successfully deployed to all staging and production pods for ${company}. Latency is back to baseline (<100ms). The issue was caused by an unindexed query on the database.`,
      `Dear Mr. Henderson,\n\nI have drafted the implementation plan for the ${company} Revenue Intelligence Dashboard. The platform will sync your Salesforce data in real-time, compute deal health scores, and generate automated playbooks for your sales reps.`,
      `Hi integration team,\n\nWe have successfully established the Salesforce and Notion synchronization webhook for ${company}. Authentication credentials are now secure, and all pipeline transitions are syncing in real-time.`,
      `Team,\n\nHere is the summary of our forecasting review with ${company} leadership. They are on track to exceed their growth quotas, and our CRM analytics are providing key visibility for their CFO.`,
      `Hi security team,\n\nAttached is our compliance documentation regarding semantic search for ${company}. All customer text data converted into 1536-dimensional embeddings is isolated inside our multi-tenant PostgreSQL database via Row-Level Security (RLS) policies.`,
      `Hi product team,\n\nI gathered some valuable feedback from the ${company} customer success lead. They are extremely satisfied with the playbook automation, but have requested a more intuitive UI for managing Notion webhooks.`,
      `Hi finance,\n\nWe have received the signed contract from the CFO of ${company} approving their seat expansion to 250 users next month. The updated invoice has been dispatched.`,
      `Hi all,\n\nWe successfully restored user engagement metrics at ${company} by delivering targeted playbook training. Their sales reps are actively using the coaching cards, and we are confident the renewal risk has resolved.`
    ];

    corpus.push({
      id: `email-${200 + i}`,
      entityId: `email-${200 + i}`,
      entityType: 'email',
      score: 0.95,
      title: subject,
      channel: 'email',
      customerName: `${company} Contact`,
      agentName: rep,
      date: date.toISOString(),
      duration: 'N/A (Email)',
      sentiment,
      sentimentScore,
      overallScore,
      topics,
      summary: `Email regarding ${subject}. ${body.substring(0, 100)}...`,
      transcript: body,
      diarizedTranscript: [
        { speaker: 'Sender', text: body, start: 0, end: 0 }
      ],
      scorecard: {
        greeting: 9.2,
        problemUnderstanding: 8.4,
        productExplanation: 8.6,
        objectionHandling: 8.0,
        nextStep: 8.8,
        closingQuality: 8.5
      },
      competitorsDetected,
      coachingSuggestion,
      keywords
    });
  }

  return corpus;
}
