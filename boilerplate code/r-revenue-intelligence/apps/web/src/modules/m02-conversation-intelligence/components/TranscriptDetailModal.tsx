import React from 'react';
import { X, Calendar, User, Phone, Mail, Award, AlertCircle, Compass, Smile, Eye, Globe, Target } from 'lucide-react';
import { SearchResult } from './types';
import { m02ApiV1 } from '../lib/api-env';

interface TranscriptDetailModalProps {
  conversation: any;
  onClose: () => void;
}

export const TranscriptDetailModal: React.FC<TranscriptDetailModalProps> = ({
  conversation,
  onClose,
}) => {
  if (!conversation) return null;

  const scorecard = conversation.scorecard || {};
  const competitors = conversation.competitorsDetected || [];

  const [topics, setTopics] = React.useState<any[]>([]);
  const [availableTopics, setAvailableTopics] = React.useState<string[]>([]);
  const [isEditingTopics, setIsEditingTopics] = React.useState(false);
  const [loadingTopics, setLoadingTopics] = React.useState(true);
  const [newTopic, setNewTopic] = React.useState('');
  
  // Translation state
  const [activeLanguageMode, setActiveLanguageMode] = React.useState<'original' | 'preferred'>('original');
  const [preferredLanguage, setPreferredLanguage] = React.useState<string | null>(null);
  const [isTranslating, setIsTranslating] = React.useState(false);
  const [translatedData, setTranslatedData] = React.useState<any>(null);
  
  const [isEditingTranscript, setIsEditingTranscript] = React.useState(false);
  const [editedTranscriptText, setEditedTranscriptText] = React.useState(conversation.transcript || '');
  const [editingTurnIndex, setEditingTurnIndex] = React.useState<number | null>(null);
  const [editedTurnText, setEditedTurnText] = React.useState('');
  const [isSavingTranscript, setIsSavingTranscript] = React.useState(false);
  const [trackerDetections, setTrackerDetections] = React.useState<any[]>([]);
  const [loadingDetections, setLoadingDetections] = React.useState(false);

  const tenantId = '00000000-0000-0000-0000-000000000001';

  // Dynamically determine which speaker is agent and which is customer
  const determineSpeakerRole = (speakerName: string, allSpeakers: string[]) => {
    const speakerLower = speakerName.toLowerCase();
    const agentNameLower = conversation.agentName?.toLowerCase() || '';
    const customerNameLower = conversation.customerName?.toLowerCase() || '';

    console.log('[Speaker Detection]', {
      speakerName,
      agentName: conversation.agentName,
      customerName: conversation.customerName,
      allSpeakers
    });

    // Try exact match with known names (most reliable)
    if (agentNameLower && speakerLower === agentNameLower) return 'agent';
    if (customerNameLower && speakerLower === customerNameLower) return 'customer';

    // Try substring match with known names
    if (agentNameLower && agentNameLower.includes(speakerLower) && speakerLower.length > 2) return 'agent';
    if (customerNameLower && customerNameLower.includes(speakerLower) && speakerLower.length > 2) return 'customer';

    // Try pattern matching
    if (speakerLower.includes('agent') || speakerLower.includes('sales') || speakerLower.includes('rep')) return 'agent';
    if (speakerLower.includes('customer') || speakerLower.includes('client') || speakerLower.includes('prospect')) return 'customer';

    // Fallback: use heuristic based on speaker frequency (most frequent = agent)
    const speakerCounts = allSpeakers.reduce((acc, s) => {
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const sortedSpeakers = Object.entries(speakerCounts).sort((a, b) => b[1] - a[1]);
    const mostFrequentSpeaker = sortedSpeakers[0]?.[0];
    
    console.log('[Speaker Frequency]', { speakerCounts, mostFrequentSpeaker });
    
    if (speakerName === mostFrequentSpeaker) return 'agent';
    return 'customer';
  };

  // Get unique speakers from diarized transcript
  const uniqueSpeakers = React.useMemo(() => {
    if (!conversation.diarizedTranscript) return [];
    return Array.from(new Set(conversation.diarizedTranscript.map((t: any) => t.speaker))) as string[];
  }, [conversation.diarizedTranscript]);

  React.useEffect(() => {
    if (conversation?.id) {
      if (conversation.topicTags && conversation.topicTags.length > 0) {
        setTopics(conversation.topicTags);
        setLoadingTopics(false);
      } else {
        fetchTopics();
      }
      fetchAvailableTopics();
      fetchWorkspaceLanguage();
      fetchTrackerDetections();
    }
  }, [conversation?.id]);

  const fetchTrackerDetections = async () => {
    setLoadingDetections(true);
    try {
      const res = await fetch(
        `${m02ApiV1()}/conversation-intelligence/trackers/detections/${conversation.id}?entityType=${conversation.channel}`,
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

  const fetchWorkspaceLanguage = async () => {
    try {
      const res = await fetch(`${m02ApiV1()}/m02-conversation-intelligence/translate/settings`, {
        headers: { 'x-tenant-id': tenantId }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.defaultLanguage && data.defaultLanguage.toLowerCase() !== 'english') {
          setPreferredLanguage(data.defaultLanguage);
        }
      }
    } catch (e) {
      console.error('Failed to fetch workspace language', e);
    }
  };

  const handleLanguageToggle = async (mode: 'original' | 'preferred') => {
    setActiveLanguageMode(mode);
    if (mode === 'original' || !preferredLanguage) {
      setTranslatedData(null);
      return;
    }
    
    setIsTranslating(true);
    try {
      const res = await fetch(`${m02ApiV1()}/conversation-intelligence/conversations/${conversation.id}?targetLanguage=${preferredLanguage}`, {
        headers: { 'x-tenant-id': tenantId }
      });
      if (res.ok) {
        const data = await res.json();
        setTranslatedData(data);
      }
    } catch (e) {
      console.error('Failed to translate conversation', e);
    }
    setIsTranslating(false);
  };

  const fetchTopics = async () => {
    setLoadingTopics(true);
    try {
      const res = await fetch(`${m02ApiV1()}/conversation-intelligence/conversations/${conversation.id}/topics`, {
        headers: { 'x-tenant-id': tenantId },
      });
      if (res.ok) {
        const data = await res.json();
        setTopics(data);
      } else {
        console.error('Failed to fetch topics:', res.status);
      }
    } catch (e) {
      console.error('Error fetching topics:', e);
    }
    setLoadingTopics(false);
  };

  const fetchAvailableTopics = async () => {
    try {
      // Get all available topics from the topic models
      console.log('Fetching available topics from topic-models endpoint');
      const res = await fetch(`${m02ApiV1()}/m02-conversation-intelligence/topic-models?tenantId=${tenantId}`);
      if (res.ok) {
        const data = await res.json();
        console.log('Topic models response:', data);
        // Extract all topic names from all models
        const allTopics = data.flatMap((model: any) => model.topics?.map((t: any) => t.name) || []);
        console.log('Available topics:', allTopics);
        setAvailableTopics(Array.from(new Set(allTopics)));
      } else {
        console.error('Failed to fetch topic models:', res.status);
      }
    } catch (e) {
      console.error('Failed to fetch available topics:', e);
    }
  };

  const handleDeleteTopic = async (tagId: string) => {
    try {
      await fetch(`${m02ApiV1()}/m02-conversation-intelligence/topics/tags/${tagId}`, { method: 'DELETE' });
      setTopics(topics.filter(t => t.id !== tagId));
    } catch (e) {}
  };

  const handleAddTopic = async () => {
    if (!newTopic) return;
    try {
      const res = await fetch(`${m02ApiV1()}/conversation-intelligence/conversations/${conversation.id}/topics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-tenant-id': tenantId },
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

  const getScoreColor = (val: number) => {
    if (val >= 9.0) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25';
    if (val >= 7.5) return 'text-amber-400 bg-amber-500/10 border-amber-500/25';
    return 'text-rose-400 bg-rose-500/10 border-rose-500/25';
  };

  const handleSaveTranscript = async () => {
    setIsSavingTranscript(true);
    try {
      const res = await fetch(`${m02ApiV1()}/conversation-intelligence/conversations/${conversation.id}/transcript`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-tenant-id': tenantId },
        body: JSON.stringify({ transcript: editedTranscriptText })
      });
      if (res.ok) {
        setIsEditingTranscript(false);
        conversation.transcript = editedTranscriptText; // Optimistic update
      } else {
        alert('Failed to save transcript');
      }
    } catch (e) {
      console.error(e);
      alert('Error saving transcript');
    }
    setIsSavingTranscript(false);
  };

  const handleSaveDiarizedTurn = async (idx: number) => {
    setIsSavingTranscript(true);
    try {
      const currentTranscript = activeLanguageMode === 'preferred' && translatedData?.diarizedTranscript 
        ? translatedData.diarizedTranscript 
        : conversation.diarizedTranscript;
      
      const updatedTranscript = [...currentTranscript];
      updatedTranscript[idx] = { ...updatedTranscript[idx], text: editedTurnText };
      
      const res = await fetch(`${m02ApiV1()}/conversation-intelligence/conversations/${conversation.id}/transcript`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-tenant-id': tenantId },
        body: JSON.stringify({ diarizedTranscript: updatedTranscript })
      });
      if (res.ok) {
        setEditingTurnIndex(null);
        conversation.diarizedTranscript = updatedTranscript;
        conversation.transcript = updatedTranscript.map((t: any) => `${t.speaker}: ${t.text}`).join('\n');
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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 md:p-6 transition-all duration-300">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-5xl h-[88vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-250">
        
        {/* Header Section */}
        <div className="bg-slate-950/40 p-6 border-b border-slate-800/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
              {conversation.channel === 'call' ? (
                <Phone className="w-5 h-5 text-indigo-400" />
              ) : (
                <Mail className="w-5 h-5 text-teal-400" />
              )}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">{conversation.title}</h2>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-400 mt-1 font-medium">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  {new Date(conversation.date).toLocaleDateString()}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-slate-500" />
                  Client: <strong className="text-slate-300 font-semibold">{conversation.customerName}</strong>
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isTranslating && <span className="text-xs text-indigo-400 font-semibold animate-pulse">Translating...</span>}
            
            {preferredLanguage && (
              <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-xl p-1 text-xs">
                <span className="text-slate-400 pl-2 pr-1 flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5" />
                  Viewing in: <span className="font-semibold text-slate-300">{activeLanguageMode === 'preferred' ? preferredLanguage : 'Original'}</span>
                </span>
                <div className="flex bg-slate-950 rounded-lg p-0.5 ml-2">
                  <button
                    onClick={() => handleLanguageToggle('original')}
                    className={`px-3 py-1 rounded-md font-medium transition-all ${
                      activeLanguageMode === 'original' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Original
                  </button>
                  <button
                    onClick={() => handleLanguageToggle('preferred')}
                    className={`px-3 py-1 rounded-md font-medium transition-all ${
                      activeLanguageMode === 'preferred' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    My language
                  </button>
                </div>
              </div>
            )}
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-800 p-2.5 rounded-xl transition-all active:scale-95 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Layout */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-3">
          
          {/* Main Transcript / Details */}
          <div className="lg:col-span-2 p-6 border-r border-slate-800/60 flex flex-col gap-6">
            
            {/* AI Summary Block */}
            <div className="bg-indigo-600/5 border border-indigo-500/20 rounded-2xl p-5 shadow-inner relative pb-8">
              <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
                <Compass className="w-4 h-4" />
                AI Generated Conversation Summary
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                {activeLanguageMode === 'preferred' && translatedData?.summary ? translatedData.summary : conversation.summary}
              </p>
              {activeLanguageMode === 'preferred' && translatedData?.summary && (
                <div className="absolute bottom-2 left-5 text-[9px] text-indigo-400/80 font-medium italic">
                  ✱ Translated automatically
                </div>
              )}
            </div>

            {/* Conversation Logs / Audio Diarization */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Conversation Transcript Logs
                </h3>
                {!(activeLanguageMode === 'preferred' && translatedData?.diarizedTranscript?.length) && !isEditingTranscript && (
                  <button 
                    onClick={() => setIsEditingTranscript(true)}
                    className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1 rounded transition"
                  >
                    Edit
                  </button>
                )}
              </div>
              
              {activeLanguageMode === 'preferred' && translatedData?.translationUnavailable && (
                <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs p-3 rounded-xl mb-4 italic">
                  ⚠️ Translation unavailable. Showing original content.
                </div>
              )}

              {(activeLanguageMode === 'preferred' && translatedData ? translatedData.diarizedTranscript : conversation.diarizedTranscript)?.length > 0 ? (
                <div className="space-y-4 relative pb-8">
                  {(activeLanguageMode === 'preferred' && translatedData ? translatedData.diarizedTranscript : conversation.diarizedTranscript).map((turn: any, idx: number) => {
                    const speakerRole = determineSpeakerRole(turn.speaker, uniqueSpeakers);
                    const isAgent = speakerRole === 'agent';
                    return (
                      <div
                        key={idx}
                        className={`flex gap-3.5 items-start ${
                          isAgent ? 'flex-row' : 'flex-row-reverse'
                        }`}
                      >
                        {/* Avatar */}
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 shadow-md ${
                            isAgent
                              ? 'bg-indigo-600/20 border border-indigo-500/35 text-indigo-300'
                              : 'bg-emerald-600/20 border border-emerald-500/35 text-emerald-300'
                          }`}
                        >
                          {turn.speaker.substring(0, 2).toUpperCase()}
                        </div>
                        {/* Message Box */}
                        <div
                          className={`rounded-2xl p-4 max-w-[80%] border shadow-sm leading-relaxed text-xs ${
                            isAgent
                              ? 'bg-slate-900 border-slate-800 text-slate-200'
                              : 'bg-slate-950/60 border-slate-900/60 text-slate-300'
                          }`}
                        >
                          <div className="flex justify-between items-center gap-2 mb-1">
                            <span className="font-semibold text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-2">
                              {turn.speaker}
                              {editingTurnIndex !== idx && (
                                <button
                                  onClick={() => {
                                    setEditingTurnIndex(idx);
                                    setEditedTurnText(turn.text);
                                  }}
                                  className="text-indigo-400 hover:text-indigo-300 ml-2 bg-slate-800/50 hover:bg-slate-800 px-2 py-0.5 rounded transition"
                                >
                                  Edit
                                </button>
                              )}
                            </span>
                            {turn.start !== undefined && (
                              <span className="text-[9px] font-mono text-slate-500">
                                {turn.start}s - {turn.end}s
                              </span>
                            )}
                          </div>
                          {editingTurnIndex === idx ? (
                            <div className="mt-2">
                              <textarea
                                className="w-full bg-slate-950/50 border border-slate-700 text-slate-300 rounded p-2 text-xs focus:outline-none focus:border-indigo-500 min-h-[60px]"
                                value={editedTurnText}
                                onChange={(e) => setEditedTurnText(e.target.value)}
                                disabled={isSavingTranscript}
                              />
                              <div className="flex justify-end gap-2 mt-2">
                                <button
                                  onClick={() => setEditingTurnIndex(null)}
                                  disabled={isSavingTranscript}
                                  className="px-3 py-1 rounded text-[10px] font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleSaveDiarizedTurn(idx)}
                                  disabled={isSavingTranscript}
                                  className="px-3 py-1 rounded text-[10px] font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition"
                                >
                                  {isSavingTranscript ? 'Saving...' : 'Save'}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p>{turn.text}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {activeLanguageMode === 'preferred' && translatedData?.diarizedTranscript && (
                    <div className="absolute bottom-0 left-0 text-[9px] text-indigo-400/80 font-medium italic mt-2">
                      ✱ Translated automatically
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-6 text-center shadow-inner">
                  {isEditingTranscript ? (
                    <div className="flex flex-col gap-3">
                      <textarea 
                        className="w-full bg-slate-900 border border-slate-700 text-slate-300 rounded-xl p-3 text-xs leading-relaxed focus:outline-none focus:border-indigo-500 min-h-[200px]"
                        value={editedTranscriptText}
                        onChange={(e) => setEditedTranscriptText(e.target.value)}
                        disabled={isSavingTranscript}
                      />
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => {
                            setIsEditingTranscript(false);
                            setEditedTranscriptText(conversation.transcript || '');
                          }}
                          disabled={isSavingTranscript}
                          className="px-4 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={handleSaveTranscript}
                          disabled={isSavingTranscript}
                          className="px-4 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-500 text-white transition"
                        >
                          {isSavingTranscript ? 'Saving...' : 'Save'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-300 leading-relaxed font-mono whitespace-pre-wrap text-left">
                      {conversation.transcript || 'No transcript text logged for this interaction.'}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar Analytics Panel */}
          <div className="p-6 bg-slate-950/30 flex flex-col gap-6 overflow-y-auto">
            
            {/* Scorecard Metrics */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-lg">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-indigo-400" />
                QA Scorecard Breakdown
              </h3>
              <div className="space-y-3.5">
                {Object.entries(scorecard).map(([key, val]: [string, any]) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-xs text-slate-400 capitalize">
                      {key.replace(/([A-Z])/g, ' $1')}
                    </span>
                    <span className={`text-xs font-mono font-bold px-2 py-0.5 border rounded-lg ${getScoreColor(val)}`}>
                      {val * 10}/100
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200">Aggregate Rating</span>
                <span className="text-sm font-bold text-indigo-400 border border-indigo-500/20 bg-indigo-500/5 px-2.5 py-1 rounded-xl">
                  {conversation.overallScore}%
                </span>
              </div>
            </div>

            {/* Coaching Insights */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-lg relative pb-8">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <Smile className="w-4 h-4 text-indigo-400" />
                Coaching Suggestions
              </h3>
              <div className="bg-slate-950 border border-slate-900 rounded-xl p-4 text-xs text-indigo-300 leading-relaxed italic shadow-inner">
                "{activeLanguageMode === 'preferred' && translatedData?.coachingSuggestion ? translatedData.coachingSuggestion : (conversation.coachingSuggestion || 'Outstanding call performance. Keep up this high standard.')}"
              </div>
              {activeLanguageMode === 'preferred' && translatedData?.coachingSuggestion && (
                <div className="absolute bottom-2 left-5 text-[9px] text-indigo-400/80 font-medium italic">
                  ✱ Translated automatically
                </div>
              )}
            </div>

            {/* Competitors and Keywords */}
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 shadow-lg">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3.5">
                Competitors Mentioned
              </h3>
              {competitors.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {competitors.map((c: string) => (
                    <span
                      key={c}
                      className="text-xs bg-rose-500/10 border border-rose-500/20 text-rose-400 px-3 py-1 rounded-xl font-medium"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-slate-500 italic">None detected</span>
              )}

              {/* Tracker Detections */}
              <div className="flex items-center justify-between mb-3.5 mt-5">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-indigo-400" />
                  Tracker Detections
                </h3>
              </div>

              {loadingDetections ? (
                <span className="text-xs text-slate-500 italic">Loading detections...</span>
              ) : trackerDetections.length > 0 ? (
                <div className="flex flex-col gap-2">
                  {trackerDetections.map((detection: any) => (
                    <div key={detection.id} className="bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-indigo-300">{detection.tracker?.name || 'Unknown Tracker'}</span>
                        <span className="text-slate-500 text-[10px]">{new Date(detection.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="bg-indigo-500/10 border border-indigo-500/20 rounded p-2 mb-2">
                        <p className="text-slate-500 text-[10px] uppercase tracking-wider mb-1">Detected keyword:</p>
                        <p className="text-indigo-300 font-semibold">"{detection.keyword}"</p>
                      </div>
                      {detection.context && (
                        <div className="bg-slate-900 border border-slate-800 rounded p-2">
                          <p className="text-slate-500 text-[10px] uppercase tracking-wider mb-1">Context:</p>
                          <p className="text-slate-300 font-mono">"{detection.context}"</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-slate-500 italic">No tracker detections found</span>
              )}

              <div className="flex items-center justify-between mb-3.5 mt-5">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Topics & Keywords
                </h3>
                <button
                  onClick={() => setIsEditingTopics(!isEditingTopics)}
                  className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 px-2 py-1 rounded"
                >
                  {isEditingTopics ? 'Done' : 'Edit'}
                </button>
              </div>
              
              {loadingTopics ? (
                <span className="text-xs text-slate-500 italic">Loading topics...</span>
              ) : (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col gap-2">
                    {topics.map((t: any) => (
                      <div key={t.id} className="group relative bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-300">{t.topicName}</span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${t.source === 'manual' ? 'bg-amber-500/10 text-amber-400' : 'bg-indigo-500/10 text-indigo-400'}`}>
                              {t.source === 'manual' ? 'Manual' : 'AI'}
                            </span>
                            <span className="text-slate-500 font-mono">{(t.confidenceScore * 100).toFixed(0)}%</span>
                          </div>
                          {isEditingTopics && (
                            <button onClick={() => handleDeleteTopic(t.id)} className="text-rose-500 hover:text-rose-400">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                        
                        {/* Explanation */}
                        {t.explanation && (
                          <p className="text-slate-400 leading-relaxed mb-2 italic">{t.explanation}</p>
                        )}
                        
                        {/* Evidence Snippet */}
                        {t.evidenceSnippet && (
                          <div className="bg-slate-900 border border-slate-800 rounded p-2">
                            <p className="text-slate-500 text-[10px] uppercase tracking-wider mb-1">Evidence from transcript:</p>
                            <p className="text-indigo-300 font-mono">"{t.evidenceSnippet}"</p>
                          </div>
                        )}
                      </div>
                    ))}
                    {topics.length === 0 && <span className="text-xs text-slate-500 italic">No topics found</span>}
                  </div>

                  {isEditingTopics && (
                    <div className="flex items-center gap-2 mt-1 bg-slate-950 p-2 rounded-xl border border-slate-800">
                      <select 
                        value={newTopic} 
                        onChange={(e) => setNewTopic(e.target.value)}
                        className="text-xs bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-slate-300 flex-1 outline-none"
                      >
                        <option value="">Select a topic to add...</option>
                        {availableTopics.map(at => (
                          <option key={at} value={at}>{at}</option>
                        ))}
                      </select>
                      <button 
                        onClick={handleAddTopic}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs px-3 py-1.5 rounded-lg font-bold transition-colors disabled:opacity-50"
                        disabled={!newTopic}
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
