import React, { useState, useRef, useEffect, useMemo } from 'react';
import { X, Download, Share2, Play, Pause, SkipBack, Volume2, ChevronDown, Sparkles, MessageSquare, Loader2, Trophy } from 'lucide-react';
import { CallDetail, AiAskResponse } from '@calls/types';

interface CallDetailDrawerProps {
  call: CallDetail | null;
  onClose: () => void;
  onAskAi: (question: string) => Promise<AiAskResponse>;
}

export default function CallDetailDrawer({ call, onClose, onAskAi }: CallDetailDrawerProps) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    nextSteps: true,
    aiInsights: true,
    keyHighlights: true,
    convHighlights: true,
    timeline: true,
    aiAsk: true
  });

  const [aiQuestion, setAiQuestion] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<{q: string, a: string} | null>(null);



  const audioRef = useRef<HTMLAudioElement>(null);
  const animationRef = useRef<number>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(call?.durationSeconds || 0);

  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(call?.durationSeconds || 0);
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    if (audioRef.current) {
      audioRef.current.load();
    }
  }, [call?.id]);

  useEffect(() => {
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  const updateProgress = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      animationRef.current = requestAnimationFrame(updateProgress);
    }
  };

  const handleDownloadAudio = async () => {
    if (!call?.recordingUrl) return;
    try {
      const response = await fetch(call.recordingUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${call.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_audio.mp3`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.warn("CORS prevented blob download, falling back to new tab", err);
      const a = document.createElement('a');
      a.href = call.recordingUrl;
      a.download = `${call.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_audio.mp3`;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.error("Audio playback error:", err);
      });
    }
  };



  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const formatTime = (seconds: number) => {
    if (isNaN(seconds) || !isFinite(seconds)) return "0:00";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const newTime = pos * duration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const waveformHeights = useMemo(() => [
    32, 45, 20, 60, 85, 30, 25, 40, 70, 95, 20, 15, 35, 55, 75, 40, 25, 45, 65, 80, 
    30, 50, 20, 40, 60, 90, 45, 35, 55, 75, 15, 25, 45, 65, 85, 40, 30, 50, 70, 90, 
    25, 45, 65, 85, 30, 50, 70, 95, 40, 60, 20, 40, 60, 80, 35, 55, 75, 25, 45, 65, 
    85, 30, 50, 70, 90, 40, 60, 80, 20, 40, 60, 85, 35, 55, 75, 25, 45, 65, 80, 30, 
    50, 70, 95, 40, 60, 80, 25, 45, 65, 85, 35, 55, 75, 20, 40, 60, 80, 30, 50, 70
  ], []);

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleAsk = async (q: string) => {
    if (!q.trim()) return;
    setAiLoading(true);
    setAiQuestion(q);
    const res = await onAskAi(q);
    setAiResult({ q: q, a: res.answer });
    setAiLoading(false);
    setAiQuestion("");
  };

  if (!call) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/20 backdrop-blur-sm transition-opacity">
      <div className="w-[840px] h-full bg-[#fcfcfd] shadow-2xl flex flex-col overflow-y-auto transform transition-transform border-l border-slate-200">
        
        {/* Header */}
        <div className="p-8 border-b border-slate-200 shrink-0 bg-white sticky top-0 z-10 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
          <div className="flex items-start justify-between mb-4">
            <h2 className="text-[26px] font-bold font-serif text-[#0f172a]">{call.title}</h2>
            <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="text-[13px] text-slate-500 mb-5 font-medium flex items-center gap-2">
            <span>
              {new Date(call.date).toLocaleString('en-US', {
                weekday: 'short', day: '2-digit', month: 'short', year: 'numeric',
                hour: 'numeric', minute: '2-digit', hour12: true
              })}
            </span> <span>•</span>
            <span>{call.durationLabel}</span> <span>•</span>
            <span>
              {call.participants?.map(p => p.name).join(', ')} {call.account ? `(${call.account})` : ''}
            </span>
          </div>
          <div className="flex flex-wrap gap-3">
            <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-[12px] font-medium"><span className="text-slate-400 font-normal mr-1">Type:</span> {call.type}</span>
            <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-[12px] font-medium"><span className="text-slate-400 font-normal mr-1">Status:</span> {call.status}</span>
            <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-[12px] font-medium"><span className="text-slate-400 font-normal mr-1">Accounts:</span> {call.account}</span>
            <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-[12px] font-medium">
              <span className="text-slate-400 font-normal mr-1">Score:</span> {call.score}%
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-8 space-y-6">
          
          {/* RECORDING */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[11px] font-bold text-slate-500 tracking-wider uppercase">RECORDING</h3>
              <div className="flex items-center gap-4 text-slate-500">
                <Download onClick={handleDownloadAudio} className="w-[18px] h-[18px] cursor-pointer hover:text-slate-800" />
                <Share2 className="w-[18px] h-[18px] cursor-pointer hover:text-slate-800" />
              </div>
            </div>
            
            <audio 
              ref={audioRef} 
              src={call.recordingUrl} 
              onLoadedMetadata={handleLoadedMetadata}
              onTimeUpdate={() => {
                if (audioRef.current) {
                  setCurrentTime(audioRef.current.currentTime);
                }
              }}
              onEnded={() => {
                setIsPlaying(false);
              }}
            />

            <div className="h-16 flex items-center gap-[3px] mb-6 opacity-80 px-2 cursor-pointer" onClick={handleSeek}>
               {waveformHeights.map((h, i) => (
                 <div key={i} className={`w-1 rounded-full transition-colors ${(i / waveformHeights.length) <= (duration ? currentTime / duration : 0) ? 'bg-[#10338D]' : 'bg-slate-200'}`} style={{ height: `${h}%` }}></div>
               ))}
            </div>

            <div className="flex items-center gap-5 text-slate-500">
              <button onClick={togglePlay} className="w-[42px] h-[42px] shrink-0 rounded-full bg-[#10338D] text-white flex items-center justify-center hover:bg-[#0c2870] transition-colors shadow-sm">
                {isPlaying ? <Pause className="w-5 h-5 fill-white" /> : <Play className="w-5 h-5 ml-1 fill-white" />}
              </button>
              <SkipBack className="w-[18px] h-[18px] cursor-pointer shrink-0" onClick={() => { if(audioRef.current) { audioRef.current.currentTime = Math.max(0, currentTime - 10); setCurrentTime(audioRef.current.currentTime); } }} />
              <span className="text-[13px] font-medium text-slate-600 min-w-[36px] text-right">{formatTime(currentTime)}</span>
              <div className="flex-1 h-1 bg-slate-200 rounded-full relative cursor-pointer" onClick={handleSeek}>
                <div className="absolute left-0 top-0 h-full bg-[#10338D] rounded-full" style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}></div>
                <div className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white border-2 border-[#10338D] rounded-full shadow-sm" style={{ left: `calc(${duration ? (currentTime / duration) * 100 : 0}% - 7px)` }}></div>
              </div>
              <span className="text-[13px] font-medium text-slate-600 min-w-[36px]">{formatTime(duration)}</span>
              <SkipBack className="w-[18px] h-[18px] rotate-180 cursor-pointer shrink-0" onClick={() => { if(audioRef.current) { audioRef.current.currentTime = Math.min(duration, currentTime + 10); setCurrentTime(audioRef.current.currentTime); } }} />
              <Volume2 className="w-[18px] h-[18px] cursor-pointer shrink-0" />
            </div>
          </div>

          {/* NEXT STEPS */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleSection('nextSteps')}>
              <h3 className="text-[11px] font-bold text-slate-500 tracking-wider uppercase">NEXT STEPS</h3>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${openSections.nextSteps ? 'rotate-180' : ''}`} />
            </div>
            {openSections.nextSteps && (
              <ul className="list-disc pl-5 mt-6 space-y-4 text-[14px] text-slate-600">
                {call.nextSteps.map((step, i) => (
                  <li key={i}>{step}</li>
                ))}
              </ul>
            )}
          </div>

          {/* AI INSIGHTS */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleSection('aiInsights')}>
              <div className="flex items-center gap-2">
                <Sparkles className="w-[18px] h-[18px] text-[#10338D]" />
                <h3 className="text-[11px] font-bold text-[#10338D] tracking-wider uppercase">AI INSIGHTS</h3>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${openSections.aiInsights ? 'rotate-180' : ''}`} />
            </div>
            {openSections.aiInsights && (
              <p className="mt-6 text-[14px] text-slate-600 leading-relaxed">
                {call.keyHighlights.map(h => h.text).join(' ')}
              </p>
            )}
          </div>

          {/* KEY HIGHLIGHTS */}
          <div className="bg-[#f4f7ff] rounded-xl border border-[#dbeafe] p-6 shadow-sm">
            <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleSection('keyHighlights')}>
              <div className="flex items-center gap-2">
                <Trophy className="w-[18px] h-[18px] text-[#10338D]" />
                <h3 className="text-[11px] font-bold text-[#10338D] tracking-wider uppercase">KEY HIGHLIGHTS</h3>
              </div>
              <ChevronDown className={`w-4 h-4 text-[#93c5fd] transition-transform ${openSections.keyHighlights ? 'rotate-180' : ''}`} />
            </div>
            {openSections.keyHighlights && (
              <ul className="list-disc pl-5 mt-5 space-y-3.5 text-[14px] text-[#10338D]">
                {call.keyHighlights.map((hl, i) => (
                  <li key={i}><span className="font-semibold">{hl.label}:</span> {hl.text}</li>
                ))}
              </ul>
            )}
          </div>

          {/* CONVERSATION HIGHLIGHTS */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleSection('convHighlights')}>
              <h3 className="text-[11px] font-bold text-slate-500 tracking-wider uppercase">CONVERSATION HIGHLIGHTS — CLICK TO LISTEN TO MOMENT</h3>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${openSections.convHighlights ? 'rotate-180' : ''}`} />
            </div>
            {openSections.convHighlights && (
              <div className="space-y-4 mt-6">
                {call.conversationHighlights.map((ch, i) => {
                  let borderColor = "border-[#fcd34d]";
                  let bgHover = "hover:bg-[#fffbeb]";
                  let tagBg = "bg-[#fef3c7]";
                  let tagText = "text-[#92400e]";
                  if (ch.tagColor === 'red') {
                    borderColor = "border-[#fca5a5]";
                    bgHover = "hover:bg-[#fef2f2]";
                    tagBg = "bg-[#fee2e2]";
                    tagText = "text-[#991b1b]";
                  } else if (ch.tagColor === 'green') {
                    borderColor = "border-[#86efac]";
                    bgHover = "hover:bg-[#f0fdf4]";
                    tagBg = "bg-[#dcfce7]";
                    tagText = "text-[#166534]";
                  } else if (ch.tagColor === 'blue') {
                    borderColor = "border-[#93c5fd]";
                    bgHover = "hover:bg-[#eff6ff]";
                    tagBg = "bg-[#dbeafe]";
                    tagText = "text-[#1e3a8a]";
                  }
                  
                  return (
                    <div key={i} onClick={() => { 
                      if (audioRef.current) { 
                        const seekTime = audioRef.current.duration ? Math.min(ch.timestampSeconds, audioRef.current.duration - 1) : ch.timestampSeconds;
                        audioRef.current.currentTime = seekTime; 
                        setCurrentTime(seekTime);
                        if (!isPlaying) {
                          audioRef.current.play().then(() => {
                            setIsPlaying(true);
                          }).catch(err => console.error(err));
                        }
                      } 
                    }} className={`border ${borderColor} rounded-xl p-4 cursor-pointer ${bgHover} transition-colors bg-white`}>
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-[13px] font-bold text-[#10338D]">{ch.timestampLabel}</span>
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${tagBg} ${tagText}`}>{ch.tag}</span>
                      </div>
                      <p className="text-[14px] text-slate-600">"{ch.quote}"</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>


          {/* TALK RATIO */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-[11px] font-bold text-slate-500 tracking-wider uppercase mb-6">TALK RATIO</h3>
            
            <div className="mb-5">
              <div className="flex justify-between text-[14px] font-medium text-[#10338D] mb-2.5">
                <span>Rep</span>
                <span>42%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div className="bg-[#10338D] h-2 rounded-full" style={{width: '42%'}}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[14px] font-medium text-slate-600 mb-2.5">
                <span>Customer</span>
                <span>58%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div className="bg-[#10b981] h-2 rounded-full" style={{width: '58%'}}></div>
              </div>
            </div>
          </div>

          {/* TIMELINE */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
             <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleSection('timeline')}>
              <h3 className="text-[11px] font-bold text-slate-500 tracking-wider uppercase">TIMELINE</h3>
              <div className="flex items-center gap-3 text-slate-500 text-[13px]">
                <span>{call.timelineLabel}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${openSections.timeline ? 'rotate-180' : ''}`} />
              </div>
            </div>
            {openSections.timeline && (
              <div className="relative border-l-2 border-slate-100 ml-2 pl-6 space-y-8 mt-6">
                {call.transcript.map((t, i) => (
                  <div key={i} className="relative">
                    <div className={`absolute -left-[31px] top-1 w-3 h-3 rounded-full border-2 border-white ${t.role === 'Rep' ? 'bg-[#10338D]' : 'bg-[#10b981]'}`}></div>
                    <div className={`flex items-center gap-2 text-[13px] font-bold ${t.role === 'Rep' ? 'text-[#10338D]' : 'text-[#10b981]'} mb-2`}>
                      <span>{t.timestampLabel}</span> 
                      <span className="text-slate-600 font-normal">{t.speaker}</span> 
                      <span className={`text-[11px] px-2 py-0.5 rounded font-medium ${t.role === 'Rep' ? 'bg-[#f0f4ff] text-[#10338D]' : 'bg-[#ecfdf5] text-[#10b981]'}`}>{t.role}</span>
                    </div>
                    <p className="text-[14px] text-slate-600 leading-relaxed">{t.text}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI ASK ANYTHING */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm mb-10">
             <div className="flex items-center justify-between cursor-pointer" onClick={() => toggleSection('aiAsk')}>
              <div className="flex items-center gap-2">
                <MessageSquare className="w-[18px] h-[18px] text-[#10338D]" />
                <h3 className="text-[11px] font-bold text-[#10338D] tracking-wider uppercase">AI Ask Anything</h3>
              </div>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${openSections.aiAsk ? 'rotate-180' : ''}`} />
            </div>
            {openSections.aiAsk && (
              <div className="mt-6">
                
                {aiResult && (
                  <div className="mb-6 space-y-3">
                    <div className="bg-[#eff6ff] text-[#10338D] p-4 rounded-xl text-[14px] border border-[#bfdbfe]">
                      Q: {aiResult.q}
                    </div>
                    <div className="bg-white p-4 rounded-xl text-[14px] text-slate-600 leading-relaxed border border-slate-200 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
                      {aiResult.a}
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-5">
                  <div className="flex gap-3">
                    <input 
                      type="text" 
                      placeholder="Ask about this call..." 
                      value={aiQuestion}
                      onChange={e => setAiQuestion(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAsk(aiQuestion)}
                      className={`flex-1 bg-white border rounded-xl px-4 py-2.5 text-[14px] text-slate-700 focus:outline-none transition-all ${aiQuestion.trim() ? 'border-[#10338D] ring-1 ring-[#10338D]' : 'border-slate-300'}`}
                    />
                    <button 
                      onClick={() => handleAsk(aiQuestion)}
                      disabled={aiLoading || !aiQuestion.trim()}
                      className={`px-6 py-2.5 rounded-xl text-[14px] font-medium transition-all flex items-center justify-center min-w-[80px] ${aiQuestion.trim() ? 'bg-[#152c6e] text-white hover:bg-[#0f172a]' : 'bg-[#8ba3d6] text-white cursor-not-allowed opacity-90'}`}
                    >
                      {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Ask'}
                    </button>
                  </div>
                  
                  <div>
                    <div className="text-[13px] text-slate-500 mb-3">Suggested questions:</div>
                    <div className="flex flex-col gap-2.5">
                      <button onClick={() => handleAsk("What objections came up most?")} className="w-full text-left bg-[#f8fafc] hover:bg-slate-100 text-slate-600 px-4 py-3 rounded-xl text-[14px] transition-colors">What objections came up most?</button>
                      <button onClick={() => handleAsk("Where did the rep struggle?")} className="w-full text-left bg-[#f8fafc] hover:bg-slate-100 text-slate-600 px-4 py-3 rounded-xl text-[14px] transition-colors">Where did the rep struggle?</button>
                      <button onClick={() => handleAsk("What were the key customer concerns?")} className="w-full text-left bg-[#f8fafc] hover:bg-slate-100 text-slate-600 px-4 py-3 rounded-xl text-[14px] transition-colors">What were the key customer concerns?</button>
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
}
