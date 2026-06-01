'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useCallsList } from '../hooks/useCallsList';
import { useCallDetail } from '../hooks/useCallDetail';
import { useTranscript } from '../hooks/useTranscript';
import { useAccountsDropdown, useParticipantsDropdown } from '../hooks/useFilterDropdown';
import CallsTable from '../components/CallsTable';
import GenerateBriefModal from '../components/GenerateBriefModal';
import ShareBriefModal from '../components/ShareBriefModal';
import { generateBrief, regenerateBrief, saveCallNote } from '../services/calls.service';
import type { BriefDetail } from '../types/calls.types';
import {
  ArrowLeft,
  Share2,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Search,
  Check,
  CheckCircle,
  Sparkles,
  AlertTriangle,
  Filter,
  User,
  Calendar,
  Clock,
  ChevronDown,
  ChevronUp,
  X,
  RotateCw,
  FileText,
  MessageSquare,
  Target,
  Users,
  Activity,
} from 'lucide-react';

// ─── MOCK DATA FALLBACKS ──────────────────────────────────────────────────────

const MOCK_FALLBACK_BRIEF: BriefDetail = {
  briefId: 'brief_default',
  briefTemplate: 'Executive Summary',
  period: 'Last 30 days',
  generatedAt: '2026-05-27T08:15:00Z',
  generatedFrom: 'Executive Summary',
  overview: {
    text: "This call focused on Acme Corp's Q3 budget planning and their evaluation of our enterprise plan. The customer demonstrated strong interest in our offering and requested detailed ROI analysis to support the business case."
  },
  keyDiscussionPoints: [
    { timestamp: '1:45', description: 'Enterprise plan pricing structure and tier comparison' },
    { timestamp: '5:20', description: 'Salesforce CRM integration requirements and capabilities' },
    { timestamp: '8:10', description: 'Data migration timeline and support process' },
    { timestamp: '12:30', description: 'ROI analysis request for internal stakeholders' },
    { timestamp: '18:45', description: 'Technical demo scheduling with IT team' }
  ],
  customerNeeds: [
    { title: 'Seamless CRM Integration', description: 'Native Salesforce integration is critical for adoption across sales team' },
    { title: 'ROI Justification', description: 'Need detailed analysis showing cost savings and efficiency gains for executive approval' },
    { title: 'Quick Implementation', description: 'Looking to deploy before Q4 starts; timeline is a key factor' },
    { title: 'Scalability', description: 'Solution must support 50+ users initially with room to expand to 200+' }
  ],
  risks: [
    { title: 'Data Migration Complexity', description: 'Customer concerned about timeline and resource requirements for migrating data from legacy system', severity: 'medium' },
    { title: 'Integration Testing', description: 'IT team wants thorough testing period before full rollout to sales team', severity: 'low' },
    { title: 'Budget Approval Timeline', description: 'ROI analysis needed by end of week for executive committee review', severity: 'medium' }
  ],
  commitments: [
    { description: 'Deliver detailed ROI analysis by Friday, May 22', assigneeType: 'rep', dueDate: 'May 22, 2026' },
    { description: 'Schedule technical demo with IT team for next week', assigneeType: 'rep', dueDate: 'Week of May 24' },
    { description: 'Review integration documentation and prepare questions', assigneeType: 'customer', dueDate: 'May 21, 2026' },
    { description: 'Share current data architecture overview', assigneeType: 'customer', dueDate: 'May 20, 2026' },
    { description: 'Provide migration timeline estimate and support plan', assigneeType: 'rep', dueDate: 'May 23, 2026' }
  ],
  stakeholders: [
    { name: 'John Smith', title: 'VP of Sales', company: 'Acme Corp', avatarInitials: 'JS' },
    { name: 'Sarah Chen', title: 'Director of IT', company: 'Acme Corp', avatarInitials: 'SC' },
    { name: 'Alex Rodriguez', title: 'Account Executive', company: 'Our Company', avatarInitials: 'AR' }
  ],
  activityContext: [
    { date: 'May 18', type: 'email', description: 'Sent product overview and pricing deck' },
    { date: 'May 15', type: 'call', description: 'Initial discovery call - 15 min intro' },
    { date: 'May 12', type: 'email', description: 'Introduced by mutual connection at TechConf 2026' },
    { date: 'May 10', type: 'meeting', description: 'Met at TechConf 2026 networking event' }
  ]
};

const getDealTypeBadgeStyle = (dealType: string) => {
  const styles: Record<string, { bg: string; color: string }> = {
    'New Business': { bg: '#DBEAFE', color: '#1E40AF' },
    'Renewal': { bg: '#D1FAE5', color: '#065F46' },
    'Expansion': { bg: '#E9D5FF', color: '#6B21A8' },
    'Cross-Sell': { bg: '#FED7AA', color: '#C2410C' },
  };
  return styles[dealType] || { bg: '#F3F4F6', color: '#6B7280' };
};

// ─── Call Detail Panel ────────────────────────────────────────────────────────

interface CallDetailPanelProps {
  callId: string;
  onBack: () => void;
}

function CallDetailPanel({ callId, onBack }: CallDetailPanelProps) {
  const {
    metadata,
    briefs,
    activeBrief,
    reload,
  } = useCallDetail(callId);

  const {
    transcript,
    summary,
    talkRatio,
    topics,
    nextSteps,
    isLoading: isTranscriptLoading,
    searchQuery,
    setSearchQuery,
    showLowConfidenceOnly,
    setShowLowConfidenceOnly,
    toggleStepCompleted,
  } = useTranscript(callId);

  // Tab State
  const [activeTab, setActiveTab] = useState<'briefs' | 'transcript'>('briefs');

  // Accordion State for Briefs Tab
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['overview']));

  // Modal states
  const [generateOpen, setGenerateOpen] = useState(false);
  const [regenerateOpen, setRegenerateOpen] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [shareBriefId, setShareBriefId] = useState<string>('brief_default');

  // Transcript Edit states
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [justEditedId, setJustEditedId] = useState<string | null>(null);
  const [localTranscriptEdits, setLocalTranscriptEdits] = useState<Record<string, string>>({});
  const editInputRef = useRef<HTMLInputElement>(null);

  // Audio Player states
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDurationState] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Notes state
  const [notes, setNotes] = useState('');
  const [noteSaved, setNoteSaved] = useState(false);

  // Auto-focus transcript editor
  useEffect(() => {
    if (editingEntryId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingEntryId]);

  // Flash feedback on edited item
  useEffect(() => {
    if (justEditedId) {
      const timer = setTimeout(() => {
        setJustEditedId(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [justEditedId]);

  // Reset notes when call changes
  useEffect(() => {
    setNotes('');
    setNoteSaved(false);
  }, [callId]);

  // Sync isPlaying state on audio events
  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.play().catch(() => setIsPlaying(false));
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  // Audio Event Handlers
  const handlePlayPause = () => {
    setIsPlaying(prev => !prev);
  };

  const handleMuteToggle = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleTimeUpdate = (e: React.SyntheticEvent<HTMLAudioElement>) => {
    setCurrentTime(Math.floor(e.currentTarget.currentTime));
  };

  const handleLoadedMetadata = (e: React.SyntheticEvent<HTMLAudioElement>) => {
    setDurationState(Math.floor(e.currentTarget.duration));
  };

  const handleSeek = (timeInSeconds: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = timeInSeconds;
    setCurrentTime(timeInSeconds);
  };

  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || duration === 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    const seekTime = Math.floor(percentage * duration);
    handleSeek(seekTime);
  };

  // Convert time format like "24:12", "1:05" to seconds
  const parseTimeToSeconds = (timeStr: string): number => {
    if (!timeStr) return 0;
    const parts = timeStr.split(':').map(Number);
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return parts[0] || 0;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Modal Handlers
  const handleGenerate = useCallback(
    async (template: string, period: string) => {
      await generateBrief(callId, { briefTemplate: template, period });
      reload();
    },
    [callId, reload],
  );

  const handleRegenerate = useCallback(
    async (template: string, period: string) => {
      const briefId = activeBrief?.briefId || 'brief_default';
      setIsRegenerating(true);
      try {
        await regenerateBrief(callId, briefId, { briefTemplate: template, period });
        reload();
      } finally {
        setIsRegenerating(false);
      }
    },
    [callId, activeBrief, reload],
  );

  const handleHeaderShareClick = () => {
    setShareBriefId(activeBrief?.briefId || briefs?.briefs[0]?.briefId || 'brief_default');
    setShareOpen(true);
  };

  const handleBriefShareClick = () => {
    setShareBriefId(activeBrief?.briefId || briefs?.briefs[0]?.briefId || 'brief_default');
    setShareOpen(true);
  };

  // Transcript Inline Editing
  const handleStartEdit = (entryId: string, currentText: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingEntryId(entryId);
    setEditValue(currentText);
  };

  const handleSaveEdit = (entryId: string) => {
    if (editValue.trim()) {
      setLocalTranscriptEdits(prev => ({
        ...prev,
        [entryId]: editValue,
      }));
      setJustEditedId(entryId);
      setEditingEntryId(null);
    }
  };

  const handleCancelEdit = () => {
    setEditingEntryId(null);
    setEditValue('');
  };

  const handleKeyDown = (entryId: string, e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveEdit(entryId);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelEdit();
    }
  };

  const handleRowClick = (entry: any) => {
    if (editingEntryId) return;
    const sec = parseTimeToSeconds(entry.timestamp);
    handleSeek(sec);
  };

  const toggleSection = (sectionId: string) => {
    const newSet = new Set(expandedSections);
    if (newSet.has(sectionId)) {
      newSet.delete(sectionId);
    } else {
      newSet.add(sectionId);
    }
    setExpandedSections(newSet);
  };

  const handleNotesKeyDown = async (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (notes.trim()) {
        try {
          await saveCallNote(callId, notes);
          setNotes('');
          setNoteSaved(true);
          setTimeout(() => setNoteSaved(false), 2000);
        } catch (error) {
          console.error('Error saving note:', error);
        }
      }
    }
  };

  if (!metadata) {
    return (
      <div className="flex flex-col flex-1 p-6 space-y-6 bg-[#F9FAFB]">
        <div className="h-8 w-32 bg-gray-200 animate-pulse rounded" />
        <div className="h-24 bg-white border border-gray-200 rounded-lg animate-pulse" />
      </div>
    );
  }

  const dealStyle = getDealTypeBadgeStyle(metadata.dealType);
  const audioSourceUrl = metadata.audioUrl || 'https://recordings-buttons.s3.eu-north-1.amazonaws.com/3mins_sales.mp3';

  // Brief variables with robust fallbacks
  const currentBrief = activeBrief || MOCK_FALLBACK_BRIEF;
  const overviewText = activeBrief?.overview?.text || MOCK_FALLBACK_BRIEF.overview.text;
  const keyPoints = (activeBrief?.keyDiscussionPoints && activeBrief.keyDiscussionPoints.length > 0)
    ? activeBrief.keyDiscussionPoints
    : MOCK_FALLBACK_BRIEF.keyDiscussionPoints;
  const customerNeeds = (activeBrief?.customerNeeds && activeBrief.customerNeeds.length > 0)
    ? activeBrief.customerNeeds
    : MOCK_FALLBACK_BRIEF.customerNeeds;
  const risks = (activeBrief?.risks && activeBrief.risks.length > 0)
    ? activeBrief.risks
    : MOCK_FALLBACK_BRIEF.risks;
  const commitments = (activeBrief?.commitments && activeBrief.commitments.length > 0)
    ? activeBrief.commitments
    : MOCK_FALLBACK_BRIEF.commitments;
  const stakeholders = (activeBrief?.stakeholders && activeBrief.stakeholders.length > 0)
    ? activeBrief.stakeholders
    : MOCK_FALLBACK_BRIEF.stakeholders;
  const activityContext = (activeBrief?.activityContext && activeBrief.activityContext.length > 0)
    ? activeBrief.activityContext
    : MOCK_FALLBACK_BRIEF.activityContext;

  const generatedDateString = activeBrief 
    ? new Date(activeBrief.generatedAt).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    : 'May 19, 2026 at 2:45 PM';

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-[#F9FAFB] overflow-y-auto px-8 py-6 space-y-6">
      {/* Hidden Audio Player Element */}
      <audio
        ref={audioRef}
        src={audioSourceUrl}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
      />

      {/* Back Navigation */}
      <div>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm font-medium transition-colors cursor-pointer"
          style={{ color: '#6B7280' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#111827';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#6B7280';
          }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Calls List
        </button>
      </div>

      {/* Header Section */}
      <div
        className="rounded-lg p-6 bg-white"
        style={{
          border: '1px solid #E5E7EB',
        }}
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold mb-2" style={{ color: '#111827', fontFamily: 'var(--font-serif)', fontWeight: 600 }}>
              {metadata.callTitle}
            </h1>
            
            <div className="flex flex-col gap-3">
              {/* Row 1 */}
              <div className="flex items-center gap-3.5 flex-wrap text-sm" style={{ color: '#6B7280' }}>
                <div className="flex items-center gap-1.5">
                  <span>Account:</span>
                  <span style={{ color: '#111827' }}>{metadata.account}</span>
                </div>
                <div className="w-1 h-1 rounded-full" style={{ backgroundColor: '#D1D5DB' }} />
                <div className="flex items-center gap-1.5">
                  <span>Type:</span>
                  <span className="capitalize" style={{ color: '#111827' }}>{metadata.type}</span>
                </div>
                <div className="w-1 h-1 rounded-full" style={{ backgroundColor: '#D1D5DB' }} />
                <div className="flex items-center gap-1.5">
                  <span>Deal Type:</span>
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                    style={{
                      backgroundColor: dealStyle.bg,
                      color: dealStyle.color,
                    }}
                  >
                    {metadata.dealType}
                  </span>
                </div>
                <div className="w-1 h-1 rounded-full" style={{ backgroundColor: '#D1D5DB' }} />
                <div className="flex items-center gap-1.5">
                  <span>Date:</span>
                  <span style={{ color: '#111827' }}>{metadata.date}</span>
                </div>
                <div className="w-1 h-1 rounded-full" style={{ backgroundColor: '#D1D5DB' }} />
                <div className="flex items-center gap-1.5">
                  <span>Time:</span>
                  <span style={{ color: '#111827' }}>{metadata.time}</span>
                </div>
              </div>

              {/* Row 2 */}
              <div className="flex items-center gap-3.5 flex-wrap text-sm" style={{ color: '#6B7280' }}>
                <div className="flex items-center gap-1.5">
                  <span>Duration:</span>
                  <span style={{ color: '#111827' }}>{metadata.duration}</span>
                </div>
                <div className="w-1 h-1 rounded-full" style={{ backgroundColor: '#D1D5DB' }} />
                <div className="flex items-center gap-1.5">
                  <span>Source:</span>
                  <span style={{ color: '#111827' }}>{metadata.source}</span>
                </div>
                <div className="w-1 h-1 rounded-full" style={{ backgroundColor: '#D1D5DB' }} />
                <div className="flex items-center gap-1.5">
                  <span>Participants:</span>
                  <span style={{ color: '#111827' }}>
                    {metadata.participants.map(p => p.name).join(', ')}
                  </span>
                </div>
                <div className="w-1 h-1 rounded-full" style={{ backgroundColor: '#D1D5DB' }} />
                <div className="flex items-center gap-2">
                  <span>Owner:</span>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-semibold"
                      style={{
                        backgroundColor: '#3B82F6',
                        color: '#FFFFFF',
                      }}
                    >
                      {metadata.owner.avatarInitials}
                    </div>
                    <span style={{ color: '#111827' }}>{metadata.owner.ownerName}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <button
            onClick={handleHeaderShareClick}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer"
            style={{
              border: '1px solid #E5E7EB',
              backgroundColor: '#FFFFFF',
              color: '#111827',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#F9FAFB';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#FFFFFF';
            }}
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="flex gap-4 border-b border-gray-200" style={{ borderColor: '#E5E7EB' }}>
        <button
          onClick={() => setActiveTab('briefs')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 cursor-pointer ${
            activeTab === 'briefs'
              ? 'border-blue-600 text-blue-600 font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          Briefs
        </button>
        <button
          onClick={() => setActiveTab('transcript')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 cursor-pointer ${
            activeTab === 'transcript'
              ? 'border-blue-600 text-blue-600 font-semibold'
              : 'border-transparent text-gray-500 hover:text-gray-900'
          }`}
        >
          Transcript & Analysis
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'briefs' ? (
        <div className="space-y-6">
          {/* Brief header with generate/share buttons */}
          <div className="flex items-center justify-between bg-white rounded-lg p-6 border border-gray-200">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Call Brief</h2>
              <div className="flex items-center gap-3.5 flex-wrap text-xs" style={{ color: '#6B7280' }}>
                <div className="flex items-center gap-1.5">
                  <span>Generated from:</span>
                  <span className="font-medium" style={{ color: '#111827' }}>{currentBrief.generatedFrom}</span>
                </div>
                <div className="w-1 h-1 rounded-full" style={{ backgroundColor: '#D1D5DB' }} />
                <div className="flex items-center gap-1.5">
                  <span>Period:</span>
                  <span className="font-medium" style={{ color: '#111827' }}>{currentBrief.period}</span>
                </div>
                <div className="w-1 h-1 rounded-full" style={{ backgroundColor: '#D1D5DB' }} />
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" style={{ color: '#9CA3AF' }} />
                  <span>Generated:</span>
                  <span style={{ color: '#111827' }}>{generatedDateString}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => setRegenerateOpen(true)}
                disabled={isRegenerating}
                className="inline-flex items-center justify-center gap-2 h-9 px-4 py-2 border rounded-md text-sm font-medium transition-colors cursor-pointer disabled:opacity-60"
                style={{
                  borderColor: '#D1D5DB',
                  backgroundColor: '#FFFFFF',
                  color: '#374151',
                }}
                onMouseEnter={(e) => {
                  if (!isRegenerating) e.currentTarget.style.backgroundColor = '#F9FAFB';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#FFFFFF';
                }}
              >
                {isRegenerating ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 00-8 8h4z" />
                    </svg>
                    Regenerating...
                  </>
                ) : (
                  <>
                    <RotateCw className="w-4 h-4" />
                    Regenerate
                  </>
                )}
              </button>

              <button
                  onClick={handleBriefShareClick}
                  className="inline-flex items-center justify-center gap-2 h-9 px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer"
                  style={{
                    backgroundColor: '#2563EB',
                    color: '#FFFFFF',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#1D4ED8';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#2563EB';
                  }}
                >
                  <Share2 className="w-4 h-4" />
                  Share
                </button>
            </div>
          </div>

          {/* Expandable Accordions */}
          <div className="space-y-4">
            {/* 1. Overview */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <button
                onClick={() => toggleSection('overview')}
                className="w-full flex items-center justify-between px-6 py-4 bg-gray-50/50 hover:bg-gray-50 cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: '#3B82F6' }}>
                    <FileText className="w-5 h-5" />
                  </div>
                  <span className="font-semibold text-gray-900" style={{ fontFamily: 'var(--font-serif)' }}>Overview</span>
                </div>
                {expandedSections.has('overview') ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
              </button>
              
              {expandedSections.has('overview') && (
                <div className="px-6 py-4 border-t border-gray-200 text-sm text-gray-700 leading-relaxed">
                  {overviewText}
                </div>
              )}
            </div>

            {/* 2. Key Discussion Points */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <button
                onClick={() => toggleSection('discussion')}
                className="w-full flex items-center justify-between px-6 py-4 bg-gray-50/50 hover:bg-gray-50 cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: '#7C3AED' }}>
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <span className="font-semibold text-gray-900" style={{ fontFamily: 'var(--font-serif)' }}>Key Discussion Points</span>
                </div>
                {expandedSections.has('discussion') ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
              </button>
              
              {expandedSections.has('discussion') && (
                <div className="px-6 py-4 border-t border-gray-200 space-y-3">
                  {keyPoints.map((pt, i) => (
                    <div key={i} className="flex items-start gap-4 p-3 rounded-lg" style={{ backgroundColor: '#F9FAFB', border: '1px solid #F3F4F6' }}>
                      <button
                        onClick={() => handleSeek(parseTimeToSeconds(pt.timestamp))}
                        className="inline-flex items-center justify-center px-2.5 py-0.5 rounded text-xs font-semibold cursor-pointer flex-shrink-0"
                        style={{ backgroundColor: '#DBEAFE', color: '#1D4ED8' }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#BFDBFE'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#DBEAFE'; }}
                      >
                        {pt.timestamp}
                      </button>
                      <p className="text-sm" style={{ color: '#374151' }}>{pt.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 3. Customer Needs & Goals */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <button
                onClick={() => toggleSection('needs')}
                className="w-full flex items-center justify-between px-6 py-4 bg-gray-50/50 hover:bg-gray-50 cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: '#0D9488' }}>
                    <Target className="w-5 h-5" />
                  </div>
                  <span className="font-semibold text-gray-900" style={{ fontFamily: 'var(--font-serif)' }}>Customer Needs & Goals</span>
                </div>
                {expandedSections.has('needs') ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
              </button>
              
              {expandedSections.has('needs') && (
                <div className="px-6 py-4 border-t border-gray-200 space-y-3">
                  {customerNeeds.map((need, i) => (
                    <div key={i} className="p-4 rounded-lg" style={{ backgroundColor: '#EFF6FF', border: '1px solid #DBEAFE' }}>
                      <h4 className="text-sm font-semibold mb-1" style={{ color: '#1D4ED8' }}>{need.title}</h4>
                      <p className="text-sm" style={{ color: '#6B7280' }}>{need.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 4. Risks & Objections */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <button
                onClick={() => toggleSection('risks')}
                className="w-full flex items-center justify-between px-6 py-4 bg-gray-50/50 hover:bg-gray-50 cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: '#F59E0B' }}>
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <span className="font-semibold text-gray-900" style={{ fontFamily: 'var(--font-serif)' }}>Risks & Objections</span>
                </div>
                {expandedSections.has('risks') ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
              </button>
              
              {expandedSections.has('risks') && (
                <div className="px-6 py-4 border-t border-gray-200 space-y-3">
                  {risks.map((risk, i) => (
                    <div key={i} className="flex items-start gap-3 p-4 rounded-lg" style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A' }}>
                      <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#D97706' }} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="text-sm font-semibold" style={{ color: '#D97706' }}>{risk.title}</h4>
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize"
                            style={{
                              backgroundColor: risk.severity === 'high' ? '#FEE2E2' : risk.severity === 'medium' ? '#FEF3C7' : '#DBEAFE',
                              color: risk.severity === 'high' ? '#DC2626' : risk.severity === 'medium' ? '#B45309' : '#1D4ED8',
                            }}
                          >
                            {risk.severity}
                          </span>
                        </div>
                        <p className="text-sm" style={{ color: '#6B7280' }}>{risk.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 5. Decisions & Commitments */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <button
                onClick={() => toggleSection('commitments')}
                className="w-full flex items-center justify-between px-6 py-4 bg-gray-50/50 hover:bg-gray-50 cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: '#10B981' }}>
                    <CheckCircle className="w-5 h-5" />
                  </div>
                  <span className="font-semibold text-gray-900" style={{ fontFamily: 'var(--font-serif)' }}>Decisions & Commitments</span>
                </div>
                {expandedSections.has('commitments') ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
              </button>
              
              {expandedSections.has('commitments') && (
                <div className="px-6 py-4 border-t border-gray-200 space-y-3">
                  {commitments.map((com, i) => (
                    <div key={i} className="flex items-start gap-3 p-4 rounded-lg" style={{ backgroundColor: '#F0FDF4', border: '1px solid #D1FAE5' }}>
                      <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: '#10B981' }} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize"
                            style={{
                              backgroundColor: com.assigneeType === 'rep' ? '#EFF6FF' : '#EDE9FE',
                              color: com.assigneeType === 'rep' ? '#3B82F6' : '#6D28D9',
                            }}
                          >
                            {com.assigneeType === 'rep' ? 'Rep' : 'Customer'}
                          </span>
                          <span className="text-xs" style={{ color: '#9CA3AF' }}>{com.dueDate}</span>
                        </div>
                        <p className="text-sm" style={{ color: '#374151' }}>{com.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 6. Key Stakeholders */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <button
                onClick={() => toggleSection('stakeholders')}
                className="w-full flex items-center justify-between px-6 py-4 bg-gray-50/50 hover:bg-gray-50 cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: '#EC4899' }}>
                    <Users className="w-5 h-5" />
                  </div>
                  <span className="font-semibold text-gray-900">Key Stakeholders</span>
                </div>
                {expandedSections.has('stakeholders') ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
              </button>
              
              {expandedSections.has('stakeholders') && (
                <div className="px-6 py-4 border-t border-gray-200 divide-y divide-gray-100">
                  {stakeholders.map((sh, i) => (
                    <div key={i} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white"
                        style={{
                          backgroundColor: sh.name === 'Alex Rodriguez' ? '#10B981' : sh.name === 'John Smith' ? '#3B82F6' : '#8B5CF6',
                        }}
                      >
                        {sh.avatarInitials}
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900">{sh.name}</h4>
                        <p className="text-xs text-gray-500">{sh.title} • {sh.company}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 7. Recent Activity Context */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <button
                onClick={() => toggleSection('activity')}
                className="w-full flex items-center justify-between px-6 py-4 bg-gray-50/50 hover:bg-gray-50 cursor-pointer text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: '#F97316' }}>
                    <Activity className="w-5 h-5" />
                  </div>
                  <span className="font-semibold text-gray-900">Recent Activity Context</span>
                </div>
                {expandedSections.has('activity') ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
              </button>
              
              {expandedSections.has('activity') && (
                <div className="px-6 py-4 border-t border-gray-200 divide-y divide-gray-100">
                  {activityContext.map((act, i) => (
                    <div key={i} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize mt-0.5"
                        style={{
                          backgroundColor: act.type === 'email' ? '#EFF6FF' : act.type === 'call' ? '#FEF3C7' : '#E9D5FF',
                          color: act.type === 'email' ? '#3B82F6' : act.type === 'call' ? '#D97706' : '#6B7280',
                        }}
                      >
                        {act.type}
                      </span>
                      <div className="flex-1">
                        <p className="text-sm text-gray-700 leading-tight">{act.description}</p>
                        <span className="text-xs text-gray-400 mt-1 block">{act.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* Transcript & Analysis Tab Content */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column (AI Summary, Player, Transcript) */}
          <div className="lg:col-span-2 space-y-6">
            {/* AI Summary */}
            <div
              className="rounded-lg p-6 bg-white"
              style={{
                border: '1px solid #E5E7EB',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
              }}
            >
              <h2 className="text-lg font-bold mb-3 flex items-center gap-2" style={{ color: '#111827' }}>
                <Sparkles className="w-5 h-5 text-[#3B82F6]" />
                AI Summary
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: '#6B7280' }}>
                {activeBrief?.overview?.text || summary?.summary || 'Generating AI brief summary...'}
              </p>
            </div>

            {/* Audio Player */}
            <div
              className="rounded-lg p-6 bg-white"
              style={{
                border: '1px solid #E5E7EB',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
              }}
            >
              <div className="flex items-center gap-4">
                <button
                  onClick={handlePlayPause}
                  className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-colors cursor-pointer"
                  style={{
                    backgroundColor: '#111827',
                    color: '#FFFFFF',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#1F2937';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#111827';
                  }}
                >
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                </button>

                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold" style={{ color: '#6B7280' }}>
                      {formatTime(currentTime)}
                    </span>
                    <span className="text-xs font-semibold" style={{ color: '#6B7280' }}>
                      {duration > 0 ? formatTime(duration) : metadata.duration}
                    </span>
                  </div>
                  <div
                    onClick={handleProgressBarClick}
                    className="relative h-2 rounded-full cursor-pointer"
                    style={{ backgroundColor: '#E5E7EB' }}
                  >
                    <div
                      className="absolute top-0 left-0 h-2 rounded-full"
                      style={{
                        backgroundColor: '#3B82F6',
                        width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>

                <button
                  onClick={handleMuteToggle}
                  className="flex-shrink-0 p-2 rounded-md transition-colors cursor-pointer text-gray-500 hover:bg-gray-100"
                >
                  {isMuted ? <VolumeX className="w-5 h-5 text-red-500" /> : <Volume2 className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Transcript Panel */}
            <div
              className="rounded-lg bg-white"
              style={{
                border: '1px solid #E5E7EB',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
              }}
            >
              {/* Search and Filters */}
              <div className="p-4 border-b space-y-3.5" style={{ borderColor: '#E5E7EB' }}>
                <div className="relative" style={{ width: '320px' }}>
                  <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                    style={{ color: '#9CA3AF' }}
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search transcript..."
                    className="w-full pl-9 pr-4 py-2 border rounded-md text-sm transition-colors focus:outline-none"
                    style={{
                      borderColor: '#E5E7EB',
                      backgroundColor: '#FFFFFF',
                      color: '#111827',
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.borderColor = '#9CA3AF';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.borderColor = '#E5E7EB';
                    }}
                  />
                </div>

                {/* Low Confidence Filter Toggle */}
                <button
                  onClick={() => setShowLowConfidenceOnly(!showLowConfidenceOnly)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors border cursor-pointer"
                  style={{
                    backgroundColor: showLowConfidenceOnly ? '#FEF3C7' : 'transparent',
                    color: showLowConfidenceOnly ? '#D97706' : '#6B7280',
                    borderColor: showLowConfidenceOnly ? '#FCD34D' : '#E5E7EB',
                  }}
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Show low-confidence only
                </button>
              </div>

              {/* Transcript Entries List */}
              <div className="p-4 space-y-4.5 max-h-[600px] overflow-y-auto">
                {isTranscriptLoading ? (
                  <div className="text-center text-gray-500 py-10 font-medium animate-pulse">Loading call transcript...</div>
                ) : transcript.length === 0 ? (
                  <div className="text-center text-gray-500 py-10">No transcript matches found.</div>
                ) : (
                  transcript.map((entry) => {
                    const entryText = localTranscriptEdits[entry.entryId] || entry.text;
                    const isLowConfidence = entry.confidence === 'low';
                    const isBeingEdited = editingEntryId === entry.entryId;
                    const isJustEdited = justEditedId === entry.entryId;
                    const isActive = currentTime >= parseTimeToSeconds(entry.timestamp) &&
                                     (transcript.indexOf(entry) === transcript.length - 1 ||
                                      currentTime < parseTimeToSeconds(transcript[transcript.indexOf(entry) + 1].timestamp));

                    return (
                      <div
                        key={entry.entryId}
                        onClick={() => handleRowClick(entry)}
                        className="relative p-3 rounded-md transition-colors cursor-pointer"
                        style={{
                          backgroundColor: isActive ? '#EFF6FF' : 'transparent',
                        }}
                        onMouseEnter={(e) => {
                          if (!isActive && !isBeingEdited) {
                            e.currentTarget.style.backgroundColor = '#F9FAFB';
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isActive && !isBeingEdited) {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }
                        }}
                      >
                        <div className="flex items-center gap-2.5 mb-1.5">
                          <span className="text-xs font-semibold" style={{ color: '#9CA3AF' }}>
                            {entry.timestamp}
                          </span>
                          <span className="text-sm font-bold" style={{ color: '#111827' }}>
                            {entry.speakerName}
                          </span>
                          {isLowConfidence && !isJustEdited && !localTranscriptEdits[entry.entryId] && (
                            <span className="text-xs font-semibold inline-flex items-center gap-1" style={{ color: '#D97706' }}>
                              <AlertTriangle className="w-3 h-3" />
                              Low Confidence
                            </span>
                          )}
                          {localTranscriptEdits[entry.entryId] && (
                            <span className="text-xs italic inline-flex items-center gap-1" style={{ color: '#10B981' }}>
                              <Check className="w-3 h-3" />
                              Reviewed & Edited
                            </span>
                          )}
                        </div>

                        {isBeingEdited ? (
                          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                            <input
                              ref={editInputRef}
                              type="text"
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              onKeyDown={(e) => handleKeyDown(entry.entryId, e)}
                              className="flex-grow px-2 py-1 text-sm border rounded"
                              style={{
                                borderColor: '#3B82F6',
                                backgroundColor: '#FFFFFF',
                                color: '#111827',
                              }}
                            />
                            <button
                              onClick={() => handleSaveEdit(entry.entryId)}
                              className="px-2.5 py-1 bg-blue-600 text-white text-xs font-bold rounded hover:bg-blue-700 cursor-pointer"
                            >
                              Save
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="px-2.5 py-1 border border-gray-300 text-gray-700 text-xs font-bold rounded hover:bg-gray-100 cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div
                            className="text-sm rounded px-1.5 py-0.5 inline-block"
                            style={{
                              color: '#4B5563',
                              backgroundColor: isLowConfidence && !localTranscriptEdits[entry.entryId] ? '#FEF9C3' : 'transparent',
                            }}
                            onClick={(e) => handleStartEdit(entry.entryId, entryText, e)}
                            title="Click to edit transcription line"
                          >
                            {entryText}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Right Column Sidebar Panels */}
          <div className="space-y-6">
            {/* Suggested Next Steps Checklist */}
            <div
              className="rounded-lg p-6 bg-white"
              style={{
                border: '1px solid #E5E7EB',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
              }}
            >
              <h2 className="text-lg font-bold mb-4" style={{ color: '#111827' }}>
                Suggested Next Steps
              </h2>
              <div className="space-y-3.5">
                {nextSteps.length === 0 ? (
                  <div className="text-sm text-gray-500">No suggestions generated.</div>
                ) : (
                  nextSteps.map((step) => (
                    <div key={step.stepId} className="flex items-start gap-3">
                      <button
                        onClick={() => toggleStepCompleted(step.stepId)}
                        className="flex-shrink-0 flex items-center justify-center mt-0.5 transition-all cursor-pointer"
                        style={{
                          width: '16px',
                          height: '16px',
                          borderRadius: '3px',
                          border: step.completed ? 'none' : '1.5px solid #D1D5DB',
                          backgroundColor: step.completed ? '#10B981' : '#FFFFFF',
                        }}
                      >
                        {step.completed && (
                          <Check className="w-3 h-3 text-white stroke-[3px]" />
                        )}
                      </button>
                      <span
                        className="text-sm font-semibold leading-tight"
                        style={{
                          color: step.completed ? '#9CA3AF' : '#374151',
                          textDecoration: step.completed ? 'line-through' : 'none',
                        }}
                      >
                        {step.description}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Talk Ratio Visual breakdown */}
            <div
              className="rounded-lg p-6 bg-white"
              style={{
                border: '1px solid #E5E7EB',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
              }}
            >
              <h3 className="text-sm font-bold mb-4" style={{ color: '#111827' }}>
                Talk Ratio
              </h3>
              <div className="space-y-3.5">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span style={{ color: '#6B7280' }}>Rep</span>
                  <span style={{ color: '#111827' }}>
                    {talkRatio?.rep?.percentage ?? 50}%
                  </span>
                </div>
                <div className="flex h-2 rounded-full overflow-hidden">
                  <div
                    style={{
                      width: `${talkRatio?.rep?.percentage ?? 50}%`,
                      backgroundColor: '#3B82F6',
                    }}
                  />
                  <div
                    style={{
                      width: `${talkRatio?.customer?.percentage ?? 50}%`,
                      backgroundColor: '#10B981',
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span style={{ color: '#6B7280' }}>Customer</span>
                  <span style={{ color: '#111827' }}>
                    {talkRatio?.customer?.percentage ?? 50}%
                  </span>
                </div>
              </div>
            </div>

            {/* Key Topics tag list */}
            <div
              className="rounded-lg p-6 bg-white"
              style={{
                border: '1px solid #E5E7EB',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
              }}
            >
              <h3 className="text-sm font-bold mb-4" style={{ color: '#111827' }}>
                Topics
              </h3>
              <div className="space-y-3">
                {topics.length === 0 ? (
                  <div className="text-sm text-gray-500">No topics discussed.</div>
                ) : (
                  topics.map((topic) => (
                    <div
                      key={topic.topicId}
                      onClick={() => handleSeek(parseTimeToSeconds(topic.timestamp))}
                      className="p-3 rounded-md transition-colors cursor-pointer bg-[#F9FAFB] hover:bg-[#F3F4F6]"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: topic.color || '#3B82F6' }}
                        />
                        <span className="text-xs font-bold" style={{ color: '#111827' }}>
                          {topic.label}
                        </span>
                        <span className="text-xs font-semibold" style={{ color: '#9CA3AF' }}>
                          {topic.timestamp}
                        </span>
                      </div>
                      <p className="text-xs font-semibold leading-normal" style={{ color: '#6B7280' }}>
                        {topic.description || `Discussion around ${topic.label}`}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Notes Section Card */}
            <div
              className="rounded-lg p-6 bg-white"
              style={{
                border: '1px solid #E5E7EB',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)',
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold" style={{ color: '#111827' }}>
                  Notes
                </h3>
                {noteSaved && (
                  <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: '#10B981' }}>
                    <Check className="w-3.5 h-3.5" />
                    Notes saved
                  </div>
                )}
              </div>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onKeyDown={handleNotesKeyDown}
                placeholder="Add your notes here... (Ctrl+Enter to save)"
                rows={6}
                className="w-full px-3.5 py-2.5 border rounded-md text-sm resize-none focus:outline-none transition-colors"
                style={{
                  borderColor: '#E5E7EB',
                  backgroundColor: '#FFFFFF',
                  color: '#111827',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#9CA3AF';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#E5E7EB';
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Share Brief Modal */}
      <ShareBriefModal
        isOpen={shareOpen}
        onClose={() => setShareOpen(false)}
        callId={callId}
        briefId={shareBriefId}
      />

      {/* Generate Brief Modal */}
      <GenerateBriefModal
        isOpen={generateOpen}
        onClose={() => setGenerateOpen(false)}
        onGenerate={handleGenerate}
      />

      {/* Regenerate Brief Modal */}
      <GenerateBriefModal
        isOpen={regenerateOpen}
        onClose={() => setRegenerateOpen(false)}
        onGenerate={handleRegenerate}
      />
    </div>
  );
}

// ─── Calls List View (root) ───────────────────────────────────────────────────

export default function CallsListRepView() {
  const [selectedCallId, setSelectedCallId] = useState<string | null>(null);

  const {
    calls,
    totalCount,
    isLoading,
    error,
    filters,
    setStatus,
    setDuration,
    setSearch,
    setDateRange,
    toggleAccount,
    toggleDealType,
    toggleParticipantId,
    clearAccount,
    clearDealType,
    clearParticipantId,
  } = useCallsList();

  const { options: accounts } = useAccountsDropdown();
  const { options: participants } = useParticipantsDropdown();

  // Dropdown States
  const [showDealTypeMenu, setShowDealTypeMenu] = useState(false);
  const [showAccountMenu, setShowAccountMenu] = useState(false);
  const [showParticipantsMenu, setShowParticipantsMenu] = useState(false);
  const [showDateMenu, setShowDateMenu] = useState(false);
  const [showOwnerMenu, setShowOwnerMenu] = useState(false);

  // Local Custom Date Picker states
  const [localStartDate, setLocalStartDate] = useState('');
  const [localEndDate, setLocalEndDate] = useState('');

  // Local My Calls toggle state
  const [myCallsActive, setMyCallsActive] = useState(false);

  const clearAllFilters = () => {
    clearAccount();
    clearDealType();
    clearParticipantId();
    setMyCallsActive(false);
  };

  // Filter in-memory if My Calls is active (Alex Rodriguez is the AE owner)
  const displayedCalls = myCallsActive
    ? calls.filter((call) => call.owner.ownerName === 'Alex Rodriguez')
    : calls;

  // ── If a call is selected, show detail panel ──
  if (selectedCallId) {
    return (
      <CallDetailPanel
        callId={selectedCallId}
        onBack={() => setSelectedCallId(null)}
      />
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 bg-[#F9FAFB] overflow-y-auto px-8 py-6 space-y-5">
      {/* Page Title & Search Bar */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold mb-1" style={{ color: '#111827' }}>
            Calls
          </h1>
          <p className="text-sm" style={{ color: '#6B7280' }}>
            Review conversations, transcripts, and insights
          </p>
        </div>

        {/* Search */}
        <div className="relative" style={{ width: '320px' }}>
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
            style={{ color: '#9CA3AF' }}
          />
          <input
            value={filters.search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by keyword, account, or owner..."
            className="w-full pl-9 pr-4 py-2 rounded-md text-sm transition-colors focus:outline-none"
            style={{
              border: '1px solid #E5E7EB',
              backgroundColor: '#FFFFFF',
              color: '#111827',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#9CA3AF';
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#E5E7EB';
            }}
          />
        </div>
      </div>

      {/* Filters Row */}
      <div className="flex items-center gap-3">
        {/* Owner Dropdown Filter */}
        <div className="relative">
          <button
            onClick={() => setShowOwnerMenu(!showOwnerMenu)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer"
            style={{
              border: '1px solid #E5E7EB',
              backgroundColor: myCallsActive ? '#EFF6FF' : '#FFFFFF',
              color: myCallsActive ? '#3B82F6' : '#6B7280',
            }}
          >
            <User className="w-4 h-4" />
            Owner
            {myCallsActive && (
              <span
                className="inline-flex items-center justify-center px-1.5 py-0.5 rounded text-xs font-semibold"
                style={{ backgroundColor: '#3B82F6', color: '#FFFFFF', minWidth: '18px' }}
              >
                1
              </span>
            )}
            <ChevronDown className="w-3.5 h-3.5" />
          </button>

          {showOwnerMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowOwnerMenu(false)} />
              <div
                className="absolute left-0 top-full mt-1 w-48 rounded-md shadow-lg z-50 bg-white border border-gray-200"
              >
                <div className="py-1">
                  <button
                    onClick={() => {
                      setMyCallsActive(!myCallsActive);
                      setShowOwnerMenu(false);
                    }}
                    className="w-full flex items-center justify-between px-4 py-2 text-sm transition-colors text-left"
                    style={{ color: '#111827' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#F9FAFB';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <span>My Calls</span>
                    {myCallsActive && (
                      <Check className="w-4 h-4 text-[#3B82F6]" />
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Deal Type Dropdown Filter */}
        <div className="relative">
          <button
            onClick={() => setShowDealTypeMenu(!showDealTypeMenu)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer"
            style={{
              border: '1px solid #E5E7EB',
              backgroundColor: filters.dealType.length > 0 ? '#EFF6FF' : '#FFFFFF',
              color: filters.dealType.length > 0 ? '#3B82F6' : '#6B7280',
            }}
          >
            <Filter className="w-4 h-4" />
            Deal Type
            {filters.dealType.length > 0 && (
              <span
                className="inline-flex items-center justify-center px-1.5 py-0.5 rounded text-xs font-semibold"
                style={{ backgroundColor: '#3B82F6', color: '#FFFFFF', minWidth: '18px' }}
              >
                {filters.dealType.length}
              </span>
            )}
            <ChevronDown className="w-3.5 h-3.5" />
          </button>

          {showDealTypeMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowDealTypeMenu(false)} />
              <div
                className="absolute left-0 top-full mt-1 w-56 rounded-md shadow-lg z-50 bg-white border border-gray-200"
              >
                <div className="py-1">
                  {['New Business', 'Renewal', 'Expansion', 'Cross-Sell'].map((dealType) => (
                    <button
                      key={dealType}
                      onClick={() => toggleDealType(dealType)}
                      className="w-full flex items-center justify-between px-4 py-2 text-sm transition-colors text-left"
                      style={{ color: '#111827' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#F9FAFB';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                        style={{
                          backgroundColor: getDealTypeBadgeStyle(dealType).bg,
                          color: getDealTypeBadgeStyle(dealType).color,
                        }}
                      >
                        {dealType}
                      </span>
                      {filters.dealType.includes(dealType) && (
                        <Check className="w-4 h-4 text-[#3B82F6]" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Account Dropdown Filter */}
        <div className="relative">
          <button
            onClick={() => setShowAccountMenu(!showAccountMenu)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer"
            style={{
              border: '1px solid #E5E7EB',
              backgroundColor: filters.account.length > 0 ? '#EFF6FF' : '#FFFFFF',
              color: filters.account.length > 0 ? '#3B82F6' : '#6B7280',
            }}
          >
            <Filter className="w-4 h-4" />
            Account
            {filters.account.length > 0 && (
              <span
                className="inline-flex items-center justify-center px-1.5 py-0.5 rounded text-xs font-semibold"
                style={{ backgroundColor: '#3B82F6', color: '#FFFFFF', minWidth: '18px' }}
              >
                {filters.account.length}
              </span>
            )}
            <ChevronDown className="w-3.5 h-3.5" />
          </button>

          {showAccountMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowAccountMenu(false)} />
              <div
                className="absolute left-0 top-full mt-1 w-56 rounded-md shadow-lg z-50 bg-white border border-gray-200"
              >
                <div className="py-1 max-h-60 overflow-y-auto">
                  {accounts.map((acc) => (
                    <button
                      key={acc.accountId}
                      onClick={() => toggleAccount(acc.accountId)}
                      className="w-full flex items-center justify-between px-4 py-2 text-sm transition-colors text-left"
                      style={{ color: '#111827' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#F9FAFB';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <span>{acc.accountName}</span>
                      {filters.account.includes(acc.accountId) && (
                        <Check className="w-4 h-4 text-[#3B82F6]" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Participants Dropdown Filter */}
        <div className="relative">
          <button
            onClick={() => setShowParticipantsMenu(!showParticipantsMenu)}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors cursor-pointer"
            style={{
              border: '1px solid #E5E7EB',
              backgroundColor: filters.participantId.length > 0 ? '#EFF6FF' : '#FFFFFF',
              color: filters.participantId.length > 0 ? '#3B82F6' : '#6B7280',
            }}
          >
            <Filter className="w-4 h-4" />
            Participants
            {filters.participantId.length > 0 && (
              <span
                className="inline-flex items-center justify-center px-1.5 py-0.5 rounded text-xs font-semibold"
                style={{ backgroundColor: '#3B82F6', color: '#FFFFFF', minWidth: '18px' }}
              >
                {filters.participantId.length}
              </span>
            )}
            <ChevronDown className="w-3.5 h-3.5" />
          </button>

          {showParticipantsMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowParticipantsMenu(false)} />
              <div
                className="absolute left-0 top-full mt-1 w-56 rounded-md shadow-lg z-50 bg-white border border-gray-200"
              >
                <div className="py-1 max-h-60 overflow-y-auto">
                  {participants.map((p) => (
                    <button
                      key={p.participantId}
                      onClick={() => toggleParticipantId(p.participantId)}
                      className="w-full flex items-center justify-between px-4 py-2 text-sm transition-colors text-left"
                      style={{ color: '#111827' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#F9FAFB';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <span>{p.name}</span>
                      {filters.participantId.includes(p.participantId) && (
                        <Check className="w-4 h-4 text-[#3B82F6]" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Clear All Filters Button */}
        {(filters.dealType.length > 0 || filters.account.length > 0 || filters.participantId.length > 0 || myCallsActive) && (
          <button
            onClick={clearAllFilters}
            className="text-xs font-medium transition-colors cursor-pointer text-gray-500 hover:text-gray-800"
          >
            Clear all filters
          </button>
        )}
      </div>

      {/* Filter Chips Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          {/* Status Filters */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold" style={{ color: '#6B7280' }}>
              STATUS:
            </span>
            {[
              { value: 'all', label: 'All' },
              { value: 'completed', label: 'Completed' },
              { value: 'processing', label: 'Processing' },
              { value: 'failed', label: 'Failed' },
              { value: 'skipped', label: 'Skipped' },
            ].map((status) => (
              <button
                key={status.value}
                onClick={() => setStatus(status.value as any)}
                className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer"
                style={{
                  backgroundColor: filters.status === status.value ? '#111827' : 'transparent',
                  color: filters.status === status.value ? '#FFFFFF' : '#6B7280',
                }}
              >
                {status.label}
              </button>
            ))}
          </div>

          {/* Duration Filters */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold" style={{ color: '#6B7280' }}>
              DURATION:
            </span>
            {[
              { value: 'all', label: 'All' },
              { value: 'lt2', label: '< 2 min' },
              { value: '2to10', label: '2-10 min' },
              { value: 'gt10', label: '10+ min' },
            ].map((dur) => (
              <button
                key={dur.value}
                onClick={() => setDuration(dur.value as any)}
                className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer"
                style={{
                  backgroundColor: filters.duration === dur.value ? '#111827' : 'transparent',
                  color: filters.duration === dur.value ? '#FFFFFF' : '#6B7280',
                }}
              >
                {dur.label}
              </button>
            ))}
          </div>
        </div>

        {/* Date Picker */}
        <div className="relative">
          <button
            onClick={() => setShowDateMenu(!showDateMenu)}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer"
            style={{
              border: '1px solid #E5E7EB',
              backgroundColor: '#FFFFFF',
              color: '#6B7280',
            }}
          >
            <Calendar className="w-3.5 h-3.5" />
            {filters.dateRange === 'last7days' && 'Last 7 Days'}
            {filters.dateRange === 'last30days' && 'Last 30 Days'}
            {filters.dateRange === 'custom' && 'Custom Dates'}
            {filters.dateRange === 'all' && 'All Dates'}
            <ChevronDown className="w-3.5 h-3.5" />
          </button>

          {showDateMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowDateMenu(false)}
              />

              <div
                className="absolute right-0 top-full mt-1 w-64 rounded-md shadow-lg z-50 bg-white border border-gray-200 animate-in fade-in duration-100"
              >
                <div className="py-1">
                  <button
                    onClick={() => {
                      setDateRange('all');
                      setShowDateMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm transition-colors"
                    style={{
                      color: '#111827',
                      backgroundColor: filters.dateRange === 'all' ? '#F9FAFB' : 'transparent',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#F9FAFB';
                    }}
                    onMouseLeave={(e) => {
                      if (filters.dateRange !== 'all') {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    All Dates
                  </button>

                  <button
                    onClick={() => {
                      setDateRange('last7days');
                      setShowDateMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm transition-colors"
                    style={{
                      color: '#111827',
                      backgroundColor: filters.dateRange === 'last7days' ? '#F9FAFB' : 'transparent',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#F9FAFB';
                    }}
                    onMouseLeave={(e) => {
                      if (filters.dateRange !== 'last7days') {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    Last 7 Days
                  </button>

                  <button
                    onClick={() => {
                      setDateRange('last30days');
                      setShowDateMenu(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm transition-colors"
                    style={{
                      color: '#111827',
                      backgroundColor: filters.dateRange === 'last30days' ? '#F9FAFB' : 'transparent',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#F9FAFB';
                    }}
                    onMouseLeave={(e) => {
                      if (filters.dateRange !== 'last30days') {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    Last 30 Days
                  </button>

                  <div style={{ height: '1px', backgroundColor: '#E5E7EB', margin: '4px 0' }} />

                  <div className="px-4 py-3">
                    <div className="text-xs font-semibold mb-2" style={{ color: '#6B7280' }}>
                      Custom Date Range
                    </div>
                    <div className="space-y-2">
                      <div>
                        <label className="text-xs mb-1 block" style={{ color: '#6B7280' }}>
                          Start Date
                        </label>
                        <input
                          type="date"
                          value={localStartDate}
                          onChange={(e) => setLocalStartDate(e.target.value)}
                          className="w-full px-2 py-1.5 text-xs rounded border"
                          style={{
                            border: '1px solid #E5E7EB',
                            backgroundColor: '#FFFFFF',
                            color: '#111827',
                          }}
                        />
                      </div>
                      <div>
                        <label className="text-xs mb-1 block" style={{ color: '#6B7280' }}>
                          End Date
                        </label>
                        <input
                          type="date"
                          value={localEndDate}
                          onChange={(e) => setLocalEndDate(e.target.value)}
                          className="w-full px-2 py-1.5 text-xs rounded border"
                          style={{
                            border: '1px solid #E5E7EB',
                            backgroundColor: '#FFFFFF',
                            color: '#111827',
                          }}
                        />
                      </div>
                      <button
                        onClick={() => {
                          if (localStartDate && localEndDate) {
                            setDateRange('custom', localStartDate, localEndDate);
                            setShowDateMenu(false);
                          }
                        }}
                        disabled={!localStartDate || !localEndDate}
                        className="w-full px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer"
                        style={{
                          backgroundColor: localStartDate && localEndDate ? '#111827' : '#E5E7EB',
                          color: localStartDate && localEndDate ? '#FFFFFF' : '#9CA3AF',
                        }}
                      >
                        Apply Custom Range
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Calls Table Section */}
      <div className="flex-grow overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-500">Loading calls...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-20 bg-white border border-gray-200 rounded-lg">
            <div className="text-center">
              <p className="text-red-600 font-medium">{error}</p>
              <p className="text-sm text-gray-500 mt-1">Please refresh the page.</p>
            </div>
          </div>
        ) : (
          <CallsTable calls={displayedCalls} onRowClick={setSelectedCallId} />
        )}
      </div>
    </div>
  );
}
