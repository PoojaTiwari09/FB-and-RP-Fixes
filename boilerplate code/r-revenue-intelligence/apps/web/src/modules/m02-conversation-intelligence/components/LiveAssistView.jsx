import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { generateLiveAssistInsights, transcribeAudioBlob, analyzeCompetitorThreat } from "../services/gemini";
import { getSupabaseClient } from "../lib/supabase";
import { useLiveAssistPiP } from "../hooks/useLiveAssistPiP";
import { detectLocalSignals, computeSignalDelta, shouldTriggerLLM, deduplicateSuggestions, processAlerts, estimateCallStage, detectTurnTransition, ConversationMemory, SpeakerIdentityRegistry, StrategicTipStabilizer, generateProactiveAlerts, shouldTriggerProactiveCompetitor, resetAlertCooldowns, extractNamesFromTranscript } from "../services/localEventEngine";
import LiveAssistOverlay from "./LiveAssistOverlay";
import styles from "./LiveAssistView.module.css";

// ── Two-Layer Architecture: Cadence Constants ──────────────────────
const CAPTURE_SLICE_MS = 5000;
const ROLLING_WINDOW_SECONDS = 30;
const MIN_TRANSCRIBE_BLOB_BYTES = 3000;
const MIN_ANALYSIS_WORDS = 5;

// Layer 1: Local Event Engine (fast, zero API cost)
const LOCAL_ENGINE_TICK_MS = 3000;    // Scan transcript every 3 seconds (was 4s)

// Layer 2: LLM Reasoning Engine (event-driven)
const MIN_LLM_COOLDOWN_MS = 5000;    // Minimum 5s between LLM calls (was 8s — faster tactical responses)
const BASELINE_LLM_INTERVAL_MS = 15000; // Max 15s without any LLM call (was 20s — prevent staleness)
const SUGGESTION_COOLDOWN_MS = 15000; // 15s cooldown for suggested responses
const STRATEGIC_COOLDOWN_MS = 25000;  // 25s cooldown for strategic tips
const MOMENTUM_COOLDOWN_MS = 20000;   // 20s cooldown for momentum score
const COMPETITOR_COOLDOWN_MS = 45000; // 45s cooldown for competitor intel
const STAGE_COOLDOWN_MS = 60000;      // 60s cooldown for stage changes

function clipSegments(segments, maxAgeMs = 8 * 60 * 1000) {
  const minTs = Date.now() - maxAgeMs;
  return segments.filter(s => s.ts >= minTs);
}

function rollingTranscript(segments, seconds) {
  const minTs = Date.now() - seconds * 1000;
  return segments
    .filter(s => s.ts >= minTs)
    .map(s => s.text)
    .join(" ")
    .trim();
}

function transcriptTail(segments, maxItems = 12) {
  return segments.slice(-maxItems).map(s => s.text).join(" ").trim();
}

function countWords(text) {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function estimateRunningStats(segments) {
  const allText = segments.map(s => s.text).join(" ").toLowerCase();
  const words = countWords(allText);

  const repSignals = (allText.match(/\b(our|we|platform|pricing|plan|roi|solution|contract|implementation)\b/g) || []).length;
  const customerSignals = (allText.match(/\b(price|cost|budget|competitor|concern|not sure|hesitant|need approval|risk)\b/g) || []).length;

  const totalSignals = repSignals + customerSignals;
  const repRatio = totalSignals > 0 ? Math.round((repSignals / totalSignals) * 100) : 50;
  const customerRatio = 100 - repRatio;

  const interruptions = (allText.match(/\b(wait|sorry|hold on|let me finish|one second)\b/g) || []).length;
  const durationMin = Math.max(1, (Date.now() - (segments[0]?.ts || Date.now())) / 60000);
  const wpm = Math.round(words / durationMin);

  return {
    totalWords: words,
    wordsPerMinute: wpm,
    estimatedTalkRatioRep: repRatio,
    estimatedTalkRatioCustomer: customerRatio,
    interruptionMarkers: interruptions,
    segmentCount: segments.length,
    repSignals,
    customerSignals
  };
}

const DEFAULT_INSIGHTS = {
  headline: "Waiting for enough live context…",
  speakerIdentification: { salesRepName: "Sales Rep", clientName: "Client", confidence: "low" },
  intentSignals: [],
  riskSignals: [],
  conversationAnalysis: {
    talkRatioRep: null,
    talkRatioCustomer: null,
    interruptions: null,
    pace: null
  },
  suggestedResponses: [],
  competitorIntelligence: [],
  strategicTips: [],
  alerts: [],
  transcriptWindow: "",
  nextBestAction: { action: "Start the call and share the browser tab audio to activate live coaching.", confidence: "low", reasoning: "", supportingSignals: [] },
  chunkSummary: "",
  buyingIntent: { label: "", reason: "" },
  objectionRisk: { label: "", reason: "" },
  urgency: "",
  decisionMakerPresence: { status: "", confidence: "low", reason: [] },
  dealMomentumScore: { score: 50, trendDirection: "stable", trendStrength: 0, drivers: [], weightedFactors: {} },
  callStage: "Unknown",
  stageConfidence: { dominantStage: "unknown", confidence: "low", breakdown: {} },
  objectionTimeline: [],
  conversationDrift: { detected: false, driftType: "none", severity: "none", durationMinutes: 0, description: "", recommendation: "" }
};

/**
 * Smart merge: only overwrite array fields if the new data is non-empty.
 */
function mergeInsights(prev, incoming) {
  const arrayKeys = ["intentSignals", "riskSignals", "suggestedResponses", "competitorIntelligence", "strategicTips", "alerts", "objectionTimeline"];
  const merged = { ...prev };

  for (const [key, value] of Object.entries(incoming)) {
    if (key === "conversationAnalysis") {
      const prevConv = prev.conversationAnalysis || {};
      const newConv = value || {};
      merged.conversationAnalysis = {
        talkRatioRep: newConv.talkRatioRep ?? prevConv.talkRatioRep,
        talkRatioCustomer: newConv.talkRatioCustomer ?? prevConv.talkRatioCustomer,
        interruptions: newConv.interruptions ?? prevConv.interruptions,
        pace: newConv.pace ?? prevConv.pace
      };
    } else if (key === "speakerIdentification") {
      const prevSp = prev.speakerIdentification || {};
      const newSp = value || {};
      const prevRepName = prevSp.salesRepName;
      const prevClientName = prevSp.clientName;
      const newRepConf = newSp.speakerConfidence?.rep ?? 0;
      const newClientConf = newSp.speakerConfidence?.client ?? 0;
      const repChanged = newSp.salesRepName && newSp.salesRepName !== 'Sales Rep' && newRepConf >= 0.5;
      const clientChanged = newSp.clientName && newSp.clientName !== 'Client' && newClientConf >= 0.5;
      // Allow name update if: (1) no name set yet, OR (2) new name has high confidence (>=0.8)
      const repName = repChanged
        ? ((prevRepName && prevRepName !== 'Sales Rep' && newRepConf < 0.8) ? prevRepName : newSp.salesRepName)
        : (prevRepName || 'Sales Rep');
      const clientName = clientChanged
        ? ((prevClientName && prevClientName !== 'Client' && newClientConf < 0.8) ? prevClientName : newSp.clientName)
        : (prevClientName || 'Client');
      merged.speakerIdentification = {
        ...newSp,
        salesRepName: repName,
        clientName: clientName
      };
    } else if (arrayKeys.includes(key)) {
      if (Array.isArray(value) && value.length > 0) {
        merged[key] = value;
      }
    } else {
      if (value !== undefined && value !== null && value !== "") {
        merged[key] = value;
      }
    }
  }

  return merged;
}

export default function LiveAssistView({ apiKey, openRouterKey, deals, isWideMode }) {
  const [selectedDealId, setSelectedDealId] = useState("new_call");
  const [isCapturing, setIsCapturing] = useState(false);
  const [status, setStatus] = useState("Idle");
  const [error, setError] = useState("");
  const [segments, setSegments] = useState([]);
  const [insights, setInsights] = useState(DEFAULT_INSIGHTS);
  const [analysisAt, setAnalysisAt] = useState(null);
  // New state for summaries, history, speaker names
  const [chunkSummaries, setChunkSummaries] = useState([]);
  const [suggestionHistory, setSuggestionHistory] = useState([]);
  const [sessionId, setSessionId] = useState(null);
  const [chunkIndex, setChunkIndex] = useState(0);
  const [callStartTime, setCallStartTime] = useState(null);
  const [finalSummary, setFinalSummary] = useState(null);
  const [showFinalSummary, setShowFinalSummary] = useState(false);
  const [activeProvider, setActiveProvider] = useState("Initializing...");
  const [competitorFlash, setCompetitorFlash] = useState(null); // Instant competitor alert

  // ── Document Picture-in-Picture overlay (always-on-top over Teams/GMeet) ──
  const { openPiP, closePiP, isOpen: overlayOpen, portalTarget, isSupported: pipSupported } = useLiveAssistPiP({ width: 430, height: 640 });
  const [pipError, setPipError] = useState("");

  async function handleLaunchOverlay() {
    setPipError("");
    try {
      await openPiP();
    } catch (err) {
      if (err.message?.toLowerCase().includes("gesture") || err.name === "NotAllowedError") {
        setPipError("Click the button again — browser requires a direct click to open the overlay window.");
      } else if (!pipSupported) {
        setPipError("Picture-in-Picture overlay requires Chrome 116+. Use Chrome for this feature.");
      } else {
        setPipError(err.message || "Could not open overlay.");
      }
    }
  }

  const streamRef = useRef(null);
  const recorderStreamRef = useRef(null);
  const recorderRef = useRef(null);
  const chunkQueueRef = useRef([]);
  const carryChunkRef = useRef(null);
  const carrySinceRef = useRef(0);
  const containerSeedRef = useRef(null);
  const processingRef = useRef(false);
  const analyzeTimerRef = useRef(null);
  const analysisIntervalRef = useRef(null);
  const sliceTimerRef = useRef(null);
  const lastAnalysisRef = useRef(0);
  const lastAnalyzedContextRef = useRef("");
  const isCapturingRef = useRef(false);
  const isAnalyzingRef = useRef(false);
  const segmentsRef = useRef([]);
  const runningStatsRef = useRef(estimateRunningStats([]));
  const selectedDealRef = useRef(null);
  const chunkSummariesRef = useRef([]);
  const chunkIndexRef = useRef(0);
  const lastAnalyzedSignalsRef = useRef(0);

  // ── Local Event Engine Refs (Layer 1) ──────────────────────────────
  const previousSignalsRef = useRef(null);        // Previous signal snapshot
  const localEngineTimerRef = useRef(null);        // Local engine interval ID
  const lastLLMCallRef = useRef(0);                // Timestamp of last LLM call
  const suggestionHistoryForDedup = useRef([]);    // Last 5 suggestion sets for dedup
  const activeAlertsRef = useRef([]);              // Processed alert queue
  const llmCallCountRef = useRef(0);               // Total LLM calls this session
  const localSignalsRef = useRef(null);            // Current local signal state
  const lastCompetitorAlertRef = useRef({});        // Tracks last alert time per competitor
  const conversationMemoryRef = useRef(new ConversationMemory()); // Structured temporal memory
  const lastTranscriptChangeRef = useRef(0);       // Timestamp of last transcript content change
  // ── Stability Orchestration Systems ──────────────────────────────
  const speakerRegistryRef = useRef(new SpeakerIdentityRegistry());  // Locked speaker identity
  const tipStabilizerRef = useRef(new StrategicTipStabilizer());      // Staggered tip replacement
  const lastProactiveCompetitorRef = useRef(0);    // Last proactive competitor inference time
  const lastStrategicTipRefreshRef = useRef(0);    // Track 15s tip refresh baseline

  // Refs for mic mixing (used only when sharing entire screen)
  const micStreamRef = useRef(null);
  const audioCtxRef = useRef(null);

  const selectedDeal = useMemo(
    () => selectedDealId === "new_call" ? null : (deals.find(d => d.id === selectedDealId) || null),
    [deals, selectedDealId]
  );

  const recentContext = useMemo(
    () => rollingTranscript(segments, ROLLING_WINDOW_SECONDS),
    [segments]
  );

  const runningStats = useMemo(() => estimateRunningStats(segments), [segments]);

  const calculatedMetrics = useMemo(() => {
    const sigs = localSignalsRef.current || {
      pricing: { count: 0 },
      decisionMaker: { count: 0 },
      buying: { count: 0, score: 0 },
      objection: { count: 0, score: 0 },
      urgency: { count: 0 }
    };
    
    // BANT Score computation (25% weight per qualified parameter)
    const budgetScore = sigs.pricing?.count > 0 ? 25 : 0;
    const authorityScore = sigs.decisionMaker?.count > 0 ? 25 : 0;
    const needScore = (sigs.buying?.count > 0 || sigs.objection?.count > 0) ? 25 : 0;
    const timelineScore = sigs.urgency?.count > 0 ? 25 : 0;
    const bantScore = budgetScore + authorityScore + needScore + timelineScore;
    
    // Customer Sentiment computation
    let sentiment = "Neutral";
    if (sigs.buying?.score > sigs.objection?.score) {
      sentiment = "Positive";
    } else if (sigs.objection?.score > 0) {
      sentiment = "Hesitant";
    }
    
    return {
      bantScore,
      sentiment
    };
  }, [segments]);

  useEffect(() => {
    runningStatsRef.current = runningStats;
  }, [runningStats]);

  useEffect(() => {
    selectedDealRef.current = selectedDeal;
  }, [selectedDeal]);

  useEffect(() => {
    chunkSummariesRef.current = chunkSummaries;
  }, [chunkSummaries]);

  // Create a Supabase session when capture starts
  async function createSession() {
    const sb = getSupabaseClient();
    if (!sb) return null;
    try {
      const { data, error } = await sb.from("live_call_sessions").insert({
        session_name: `Live Call - ${new Date().toLocaleString()}`,
        deal_id: selectedDealRef.current?.id || null,
        deal_company: selectedDealRef.current?.company || null,
        status: "active"
      }).select("id").single();
      if (error) { console.warn("[LiveAssist] Session create failed:", error); return null; }
      return data.id;
    } catch (e) { console.warn("[LiveAssist] Session create error:", e); return null; }
  }

  // Store chunk summary in Supabase
  async function storeChunkSummary(sid, chunk) {
    const sb = getSupabaseClient();
    if (!sb || !sid) return;
    try {
      await sb.from("live_call_summaries").insert({
        session_id: sid,
        chunk_index: chunk.chunk_index,
        time_start: chunk.time_start,
        time_end: chunk.time_end,
        summary_text: chunk.summary_text,
        key_topics: chunk.key_topics || [],
        sentiment: chunk.sentiment || "neutral",
        competitors_mentioned: chunk.competitors_mentioned || [],
        raw_transcript: chunk.raw_transcript || ""
      });
    } catch (e) { console.warn("[LiveAssist] Summary store error:", e); }
  }

  // Generate a proper AI-synthesized final summary (not just chunk concatenation)
  // Enhanced: Includes conversation memory + insights snapshot for stateful analysis
  async function generateFinalSummary() {
    const summaries = chunkSummariesRef.current;
    const liveSegments = segmentsRef.current;

    if (!summaries.length && !liveSegments.length) return null;

    const spkNames = insights.speakerIdentification || {};
    const repName = spkNames.salesRepName || "Sales Rep";
    const clientName = spkNames.clientName || "Client";

    let duration = "N/A";
    if (summaries.length > 0) {
      duration = `${summaries[0].time_start} - ${summaries[summaries.length - 1].time_end}`;
    } else if (liveSegments.length > 0) {
      const startMs = liveSegments[0].ts;
      const endMs = liveSegments[liveSegments.length - 1].ts;
      duration = `${formatTimeLabel(startMs)} - ${formatTimeLabel(endMs)}`;
    }

    // Build content sections separately
    let chunkContent = "";
    let transcriptContent = "";
    
    if (summaries.length > 0) {
      chunkContent = summaries.map(s => `[${s.time_start}-${s.time_end}] ${s.summary_text}`).join("\n");
    }
    
    // Always build transcript content for the full transcript section
    if (liveSegments.length > 0) {
      transcriptContent = liveSegments.map((s, idx) => {
        const isRep = idx % 2 === 0;
        const speaker = isRep ? repName : clientName;
        return `${speaker}: ${s.text}`;
      }).join("\n");
    }

    // Content for the LLM to analyze (prefer chunk summaries, fall back to transcript)
    const contentToSummarize = chunkContent || transcriptContent;

    // Try to use the LLM for a synthesized summary
    let aiSummary = null;
    let usedProvider = "Groq";

    // Use the centralized strategic summary engine with conversation memory
    if (apiKey || openRouterKey) {
      try {
        const { generateStrategicSummary } = await import("../services/gemini");
        const result = await generateStrategicSummary(
          { groq: apiKey, openrouter: openRouterKey },
          {
            repName,
            clientName,
            duration,
            chunkTexts: contentToSummarize,
            talkRatioRep: insights.conversationAnalysis?.talkRatioRep || runningStats.estimatedTalkRatioRep,
            talkRatioCustomer: insights.conversationAnalysis?.talkRatioCustomer || runningStats.estimatedTalkRatioCustomer,
            // Enhanced: Pass structured memory for richer analysis
            conversationMemory: conversationMemoryRef.current?.toPayload?.() || null,
            // Enhanced: Pass insights snapshot for context
            insightsSnapshot: {
              buyingIntent: insights.buyingIntent,
              objectionRisk: insights.objectionRisk,
              dealMomentumScore: insights.dealMomentumScore,
              stageConfidence: insights.stageConfidence
            }
          }
        );

        aiSummary = result.text;
        usedProvider = result.provider;
      } catch (e) {
        console.warn("[LiveAssist] AI summary generation failed across all providers:", e);
      }
    }

    // Build clearly sectioned output
    const header = `📋 CALL INTELLIGENCE REPORT — ${new Date().toLocaleString()}\n${"═".repeat(50)}\nDuration: ${duration} | Segments: ${summaries.length || liveSegments.length}\nParticipants: ${repName} (Rep) & ${clientName} (Client) | Provider: ${usedProvider}\n${"═".repeat(50)}`;

    const sections = [header];

    // Section 1: AI-Synthesized Strategic Summary
    if (aiSummary) {
      sections.push(`\n\n━━━ 🧠 AI STRATEGIC ANALYSIS ━━━\n${aiSummary}`);
    }

    // Section 2: Conversation Timeline (chunk summaries)
    if (summaries.length > 0) {
      sections.push(`\n\n━━━ 📝 CONVERSATION TIMELINE ━━━\n${summaries.map(s => `[${s.time_start} → ${s.time_end}] ${s.summary_text}`).join('\n\n')}`);
    }

    // Section 3: Full Transcript
    if (transcriptContent) {
      sections.push(`\n\n━━━ 📜 FULL TRANSCRIPT ━━━\n${transcriptContent}`);
    }

    return sections.join('');
  }

  function formatTimeLabel(ms) {
    if (!callStartTime) return "0:00";
    const elapsed = Math.floor((ms - callStartTime) / 1000);
    const min = Math.floor(elapsed / 60);
    const sec = elapsed % 60;
    return `${min}:${String(sec).padStart(2, "0")}`;
  }

  function cleanupCapture() {
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }

    if (recorderStreamRef.current) {
      recorderStreamRef.current.getTracks().forEach(track => track.stop());
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }

    // Stop microphone if it was captured (entire-screen mode)
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach(track => track.stop());
      micStreamRef.current = null;
    }

    // Close AudioContext if it was created (entire-screen mode)
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {});
      audioCtxRef.current = null;
    }

    if (sliceTimerRef.current) {
      clearInterval(sliceTimerRef.current);
      sliceTimerRef.current = null;
    }

    recorderRef.current = null;
    recorderStreamRef.current = null;
    streamRef.current = null;
    chunkQueueRef.current = [];
    carryChunkRef.current = null;
    carrySinceRef.current = 0;
    containerSeedRef.current = null;
  }

  function mergeBlobs(left, right) {
    if (!left) return right;
    return new Blob([left, right], { type: right?.type || left.type || "audio/webm" });
  }

  function createRecorderWithFallback(targetStream) {
    const options = [
      { mimeType: "audio/webm;codecs=opus" },
      { mimeType: "audio/webm" },
      undefined
    ];

    for (const opt of options) {
      try {
        if (!opt || !opt.mimeType || MediaRecorder.isTypeSupported(opt.mimeType)) {
          return opt ? new MediaRecorder(targetStream, opt) : new MediaRecorder(targetStream);
        }
      } catch {
        // Try the next fallback option.
      }
    }

    throw new Error("This browser cannot start MediaRecorder for captured tab audio.");
  }

  async function stopCapture() {
    if (!isCapturingRef.current) return;
    isCapturingRef.current = false;

    setStatus("Finalizing transcription...");
    console.log('[LiveAssist] stopCapture: Beginning graceful shutdown...');

    // Stop recording and let ondataavailable fire for the last chunk
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }

    // Force-flush any remaining carry blob (even if small)
    if (carryChunkRef.current && carryChunkRef.current.size > 0) {
      console.log(`[LiveAssist] Force-flushing carry blob: ${carryChunkRef.current.size} bytes`);
      chunkQueueRef.current.push(carryChunkRef.current);
      carryChunkRef.current = null;
      carrySinceRef.current = 0;
    }

    // Wait for the last audio chunk to be pushed and process remaining queue
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Secondary drain call to catch any straggler chunks
    if (chunkQueueRef.current.length > 0) {
      console.log(`[LiveAssist] Secondary drain: ${chunkQueueRef.current.length} chunks remaining`);
      try {
        await drainQueue();
      } catch (e) {
        console.warn('[LiveAssist] Secondary drain error (non-fatal):', e);
      }
    }

    cleanupCapture();
    setIsCapturing(false);
    setStatus("Generating final summary...");

    // Generate final summary
    try {
      const summary = await generateFinalSummary();
      if (summary) {
        setFinalSummary(summary);
        setShowFinalSummary(true);
        setStatus("Call complete — summary generated");
        console.log('[LiveAssist] Final summary generated successfully');
        // Update session in Supabase
        const sb = getSupabaseClient();
        if (sb && sessionId) {
          try {
            await sb.from("live_call_sessions").update({
              status: "completed",
              ended_at: new Date().toISOString(),
              final_summary: summary,
              total_segments: chunkSummariesRef.current.length,
              sales_rep_name: insights.speakerIdentification?.salesRepName || "Sales Rep",
              client_name: insights.speakerIdentification?.clientName || "Client"
            }).eq("id", sessionId);
          } catch (e) { console.warn("[LiveAssist] Session update error:", e); }
        }
      } else {
        setStatus("Capture stopped — no transcript to summarize");
      }
    } catch (e) {
      console.error('[LiveAssist] Final summary generation error:', e);
      setStatus("Capture stopped (summary generation failed)");
    }
  }

  const exportToMarkdown = () => {
    const spk = insights.speakerIdentification || {};
    const repName = spk.salesRepName || "Sales Rep";
    const clientName = spk.clientName || "Client";
    const duration = chunkSummaries.length > 0 ? `${chunkSummaries[0].time_start} - ${chunkSummaries[chunkSummaries.length - 1].time_end}` : "N/A";
    
    let md = `# ⚡ DealsIQX Live Call Report\n\n`;
    md += `**Date:** ${new Date().toLocaleString()}\n`;
    md += `**Duration:** ${duration}\n`;
    md += `**Participants:** ${repName} (Sales Rep) & ${clientName} (Client)\n\n`;
    
    if (finalSummary) {
      md += `## 📋 Synthesized AI Summary & Heatmap\n\n${finalSummary}\n\n`;
    }
    
    md += `## 📈 Call Analytics\n\n`;
    md += `- **${repName} Talk Ratio:** ${insights.conversationAnalysis.talkRatioRep || runningStats.estimatedTalkRatioRep}%\n`;
    md += `- **${clientName} Talk Ratio:** ${insights.conversationAnalysis.talkRatioCustomer || runningStats.estimatedTalkRatioCustomer}%\n`;
    md += `- **Interruptions:** ${insights.conversationAnalysis.interruptions || (runningStats.interruptionMarkers > 4 ? "high" : "low")}\n`;
    md += `- **Average Pace:** ${insights.conversationAnalysis.pace || "Balanced"}\n\n`;
    
    if (insights.suggestedResponses?.length > 0) {
      md += `## 💬 Suggested Responses\n\n`;
      insights.suggestedResponses.forEach(r => {
        md += `- "${r}"\n`;
      });
      md += `\n`;
    }

    if (insights.strategicTips?.length > 0) {
      md += `## 💡 Strategic Coaching Tips\n\n`;
      insights.strategicTips.forEach(tip => {
        md += `### ${typeof tip === 'string' ? tip : tip.tip}\n`;
        if (tip.exactScript) md += `**Exact Script:** _"${tip.exactScript}"_\n\n`;
        if (tip.reasoning) md += `**Why:** ${tip.reasoning}\n\n`;
      });
    }

    if (insights.competitorIntelligence?.length > 0) {
      md += `## ⚔️ Competitor Intelligence\n\n`;
      insights.competitorIntelligence.forEach(c => {
        md += `### Competitor: ${c.competitor}\n`;
        md += `- **Context:** ${c.mentionedContext}\n`;
        md += `- **Our Advantage:** ${c.ourAdvantage}\n`;
        md += `- **Talk Track:** _"${c.talkTrack}"_\n\n`;
      });
    }

    if (insights.alerts?.length > 0) {
      md += `## 🚨 Alerts & Conversation Drift\n\n`;
      insights.alerts.forEach(a => {
        md += `- [**${a.level.toUpperCase()}**] ${a.message}\n`;
      });
      md += `\n`;
    }

    if (insights.intentSignals?.length > 0 || insights.riskSignals?.length > 0) {
      md += `## 🚦 Signals (Intent & Risk)\n\n`;
      insights.intentSignals.forEach(s => md += `- **Intent:** ${s.label} (${s.confidence}%) - _"${s.evidence}"_\n`);
      insights.riskSignals.forEach(s => md += `- **Risk:** ${s.label} (${s.severity}) - _"${s.evidence}"_\n`);
      md += `\n`;
    }
    
    if (chunkSummaries.length > 0) {
      md += `## 📝 Conversation Timeline (Summarized)\n\n`;
      chunkSummaries.forEach(s => {
        md += `### [${s.time_start} - ${s.time_end}]\n${s.summary_text}\n\n`;
      });
    }
    
    if (segments.length > 0) {
      md += `## 📜 Full Conversation Transcript\n\n`;
      segments.forEach((seg, i) => {
        const isRep = i % 2 === 0;
        const speaker = isRep ? repName : clientName;
        md += `**${speaker}**: ${seg.text}  \n`;
      });
    }
    
    md += `\n\n---\n*Report generated automatically by DealsIQX Sales Co-Pilot*`;
    
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DealsIQX_Report_${new Date().toISOString().replace(/[:.]/g, "-")}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToPDF = () => {
    const spk = insights.speakerIdentification || {};
    const repName = spk.salesRepName || "Sales Rep";
    const clientName = spk.clientName || "Client";
    const duration = chunkSummaries.length > 0 ? `${chunkSummaries[0].time_start} - ${chunkSummaries[chunkSummaries.length - 1].time_end}` : "N/A";
    
    const printWindow = window.open('', '_blank');
    const html = `
      <html>
        <head>
          <title>DealsIQX Call Report - ${clientName}</title>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
          <style>
            body { font-family: 'Inter', sans-serif; color: #1e293b; line-height: 1.6; padding: 40px; max-width: 900px; margin: 0 auto; background: #fff; }
            .header { border-bottom: 3px solid #8b5cf6; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end; }
            .header h1 { margin: 0; color: #1e1e2f; font-size: 28px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; }
            .meta { font-size: 14px; color: #64748b; }
            .section { margin-bottom: 35px; break-inside: avoid; }
            .section-title { font-size: 18px; font-weight: 700; color: #8b5cf6; text-transform: uppercase; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 15px; }
            .summary-box { background: #f8fafc; border-left: 5px solid #3b82f6; padding: 20px; border-radius: 4px; font-size: 15px; white-space: pre-wrap; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
            .card { border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; background: #fff; }
            .card-title { font-size: 13px; font-weight: 700; color: #475569; text-transform: uppercase; margin-bottom: 10px; border-bottom: 1px solid #f1f5f9; padding-bottom: 5px; }
            .stat-item { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 14px; }
            .stat-label { color: #64748b; }
            .stat-value { font-weight: 600; color: #0f172a; }
            .pill { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; text-transform: uppercase; margin-left: 5px; }
            .pill-resolved { background: #dcfce7; color: #166534; }
            .pill-unresolved { background: #fee2e2; color: #991b1b; }
            .transcript-row { display: grid; grid-template-columns: 100px 140px 1fr; gap: 10px; padding: 8px 0; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
            .ts { color: #94a3b8; font-family: monospace; }
            .spk { font-weight: 700; color: #8b5cf6; }
            .alert-item { padding: 10px; border-radius: 6px; margin-bottom: 8px; font-size: 13px; border: 1px solid #e2e8f0; }
            .critical { background: #fef2f2; border-color: #fecaca; color: #991b1b; }
            .important { background: #fffbeb; border-color: #fef3c7; color: #92400e; }
            .tip-item { margin-bottom: 12px; padding: 10px; background: #f0f9ff; border-radius: 6px; border-left: 4px solid #0ea5e9; }
            @media print { .no-print { display: none; } body { padding: 20px; } }
            .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h1>DealsIQX Call Intelligence</h1>
              <div class="meta">Generated on ${new Date().toLocaleString()}</div>
            </div>
            <div style="text-align: right">
              <div class="stat-value" style="font-size: 20px; color: #8b5cf6">${clientName}</div>
              <div class="meta">Live Call Report</div>
            </div>
          </div>

          <div class="grid">
            <div class="section">
              <div class="section-title">Call Overview</div>
              <div class="stat-item"><span class="stat-label">Sales Rep:</span> <span class="stat-value">${repName}</span></div>
              <div class="stat-item"><span class="stat-label">Client:</span> <span class="stat-value">${clientName}</span></div>
              <div class="stat-item"><span class="stat-label">Duration:</span> <span class="stat-value">${duration}</span></div>
              <div class="stat-item"><span class="stat-label">Call Stage:</span> <span class="stat-value" style="text-transform: capitalize">${insights.stageConfidence?.dominantStage || "Likely Negotiation"} (${insights.stageConfidence?.confidence || "medium"})</span></div>
            </div>
            <div class="section">
              <div class="section-title">Performance Metrics</div>
              <div class="stat-item"><span class="stat-label">${repName} Talk:</span> <span class="stat-value">${insights.conversationAnalysis.talkRatioRep || runningStats.estimatedTalkRatioRep}%</span></div>
              <div class="stat-item"><span class="stat-label">${clientName} Talk:</span> <span class="stat-value">${insights.conversationAnalysis.talkRatioCustomer || runningStats.estimatedTalkRatioCustomer}%</span></div>
              <div class="stat-item"><span class="stat-label">Pace:</span> <span class="stat-value">${insights.conversationAnalysis.pace || "Balanced"}</span></div>
              <div class="stat-item"><span class="stat-label">Interruptions:</span> <span class="stat-value">${insights.conversationAnalysis.interruptions || "Low"}</span></div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Synthesized Summary & Heatmap</div>
            <div class="summary-box">${finalSummary || "No final summary generated."}</div>
          </div>

          <div class="grid">
            <div class="section">
              <div class="section-title">Key Signals</div>
              <div class="card">
                <div class="card-title">Buying Intent</div>
                <div class="stat-value" style="color: #10b981">${insights.buyingIntent?.label || "None detected"} <span class="pill pill-resolved" style="background: rgba(16,185,129,0.1); color: #10b981;">Confidence: ${insights.buyingIntent?.confidence || "N/A"}%</span></div>
                <div class="meta" style="margin-top: 4px">${insights.buyingIntent?.reason || ""}</div>
              </div>
              <div class="card" style="margin-top: 15px">
                <div class="card-title">Objection Risk</div>
                <div class="stat-value" style="color: #ef4444">${insights.objectionRisk?.label || "None detected"} <span class="pill pill-unresolved" style="background: rgba(239,68,68,0.1); color: #ef4444;">Severity: ${insights.objectionRisk?.severity || "High"}</span></div>
                <div class="meta" style="margin-top: 4px">${insights.objectionRisk?.reason || ""}</div>
              </div>
            </div>
            <div class="section">
              <div class="section-title">Deal Momentum</div>
              <div class="card">
                <div class="stat-value" style="font-size: 32px; margin-bottom: 5px">${insights.dealMomentumScore?.score || 0}%</div>
                <div style="font-size: 13px; color: #64748b; margin-bottom: 10px; font-weight: 600;">Confidence: Medium</div>
                <div class="card-title">Primary Drivers</div>
                ${(insights.dealMomentumScore?.drivers || []).map(d => `<div style="font-size: 13px; color: ${d.startsWith('+')?'#10b981':'#ef4444'}">${d}</div>`).join('')}
              </div>
            </div>
          </div>

          ${insights.riskSignals?.length > 0 ? `
          <div class="section">
            <div class="section-title" style="color: #ef4444; border-bottom-color: #fecaca;">Deal Risks & Hesitations</div>
            <ul style="margin: 0; padding-left: 20px; font-size: 14px;">
              ${insights.riskSignals.map(r => `
                <li style="margin-bottom: 8px;">
                  <strong style="color: #b91c1c;">${r.label}</strong> 
                  <span class="pill pill-unresolved" style="background: rgba(239,68,68,0.1); color: #ef4444;">${r.severity}</span>
                  <div style="color: #475569; font-size: 13px; margin-top: 2px;">${r.evidence}</div>
                </li>
              `).join('')}
            </ul>
          </div>
          ` : ''}

          <div class="section">
            <div class="section-title">Strategic Tips & Coaching</div>
            ${insights.strategicTips.map(tip => `
              <div class="tip-item">
                <div style="font-weight: 700; margin-bottom: 4px">${typeof tip === 'string' ? tip : tip.tip}</div>
                ${tip.exactScript ? `<div style="color: #d97706; font-style: italic; font-size: 13px">"Say: ${tip.exactScript}"</div>` : ''}
                ${tip.reasoning ? `<div style="color: #64748b; font-size: 12px; margin-top: 4px">Why: ${tip.reasoning}</div>` : ''}
              </div>
            `).join('')}
          </div>

          ${insights.alerts.length > 0 ? `
            <div class="section">
              <div class="section-title">Critical Alerts & Drift</div>
              ${insights.alerts.map(a => `
                <div class="alert-item ${a.level}">
                  <strong>${a.level.toUpperCase()}:</strong> ${a.message}
                </div>
              `).join('')}
            </div>
          ` : ''}

          ${insights.competitorIntelligence?.length > 0 ? `
            <div class="section">
              <div class="section-title">Competitor Intelligence</div>
              ${insights.competitorIntelligence.map(c => `
                <div class="card" style="margin-bottom: 10px">
                  <div class="card-title">Competitor: ${c.competitor}</div>
                  <div style="font-size: 13px; margin-bottom: 5px"><strong>Context:</strong> ${c.mentionedContext}</div>
                  <div style="font-size: 13px; color: #10b981"><strong>Our Advantage:</strong> ${c.ourAdvantage}</div>
                  <div style="font-size: 13px; color: #8b5cf6; font-style: italic; margin-top: 5px">"Talk Track: ${c.talkTrack}"</div>
                </div>
              `).join('')}
            </div>
          ` : ''}

          <div class="section">
            <div class="section-title">Conversation Timeline (Segment Summaries)</div>
            ${chunkSummaries.map(s => `
              <div style="margin-bottom: 15px; border-left: 3px solid #34d399; padding-left: 15px">
                <div style="font-weight: 700; font-size: 13px; color: #059669">${s.time_start} - ${s.time_end}</div>
                <div style="font-size: 14px">${s.summary_text}</div>
              </div>
            `).join('')}
          </div>

          <div class="section">
            <div class="section-title">Full Transcript</div>
            <div style="border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden">
              ${segments.map((seg, i) => {
                const isRep = i % 2 === 0;
                const spkName = isRep ? repName : clientName;
                return `
                  <div class="transcript-row">
                    <div class="ts">${new Date(seg.ts).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', second:'2-digit'})}</div>
                    <div class="spk">${spkName}</div>
                    <div>${seg.text}</div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>

          <div class="footer">
            Report generated by <strong>DealsIQX AI Sales Co-Pilot</strong>. High-Trust Strategic Sales Intelligence.
          </div>

          <div class="no-print" style="position: fixed; bottom: 20px; right: 20px;">
            <button onclick="window.print()" style="padding: 12px 24px; background: #8b5cf6; color: white; border: none; border-radius: 999px; font-weight: 700; cursor: pointer; box-shadow: 0 4px 14px rgba(139,92,246,0.4)">🖨️ Print to PDF</button>
          </div>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
  };

  /**
   * ── Layer 1: Local Event Engine Tick ──────────────────────────────
   * Runs every 4 seconds. Scans transcript locally for keyword signals.
   * Computes signal delta. Decides whether to trigger LLM (Layer 2).
   * ZERO API cost.
   */
  function localEngineTick() {
    if (!isCapturingRef.current) return;

    const liveSegments = segmentsRef.current;
    const rolling = rollingTranscript(liveSegments, ROLLING_WINDOW_SECONDS);
    if (countWords(rolling) < MIN_ANALYSIS_WORDS) return;

    // Track when transcript last changed for silence detection
    if (rolling !== lastAnalyzedContextRef.current) {
      lastTranscriptChangeRef.current = Date.now();
    }

    const now = Date.now();
    // Detect local signals (fast regex scan)
    const currentSignals = detectLocalSignals(rolling);
    localSignalsRef.current = currentSignals;

    // ── Local Name Extraction (no LLM needed) ──
    const detectedNames = extractNamesFromTranscript(rolling);
    if (detectedNames.length > 0) {
      speakerRegistryRef.current.feedTranscriptNames(detectedNames);
      const resolved = speakerRegistryRef.current.getResolved();
      if (resolved.clientLocked || resolved.repLocked) {
        setInsights(prev => ({
          ...prev,
          speakerIdentification: {
            ...prev.speakerIdentification,
            salesRepName: resolved.salesRepName,
            clientName: resolved.clientName,
            repLocked: resolved.repLocked,
            clientLocked: resolved.clientLocked
          }
        }));
      }
    }

    // Compute delta against previous scan
    const delta = computeSignalDelta(currentSignals, previousSignalsRef.current);
    previousSignalsRef.current = currentSignals;

    // ── Feed Conversation Memory ──
    const mem = conversationMemoryRef.current;
    if (delta.reasons.includes('new_objection') && currentSignals.objection.matched.length > 0) {
      mem.addObjection(currentSignals.objection.matched.slice(-1)[0], currentSignals.objection.matched.slice(-1)[0]);
    }
    if (delta.hasNewCompetitor && currentSignals.competitor.matched.length > 0) {
      mem.addCompetitor(currentSignals.competitor.matched.slice(-1)[0]);
    }
    if (delta.reasons.includes('buying_signal') && currentSignals.buying.matched.length > 0) {
      mem.addBuyingSignal(currentSignals.buying.matched.slice(-1)[0]);
    }
    if (delta.reasons.includes('commitment_made') && currentSignals.commitment.matched.length > 0) {
      mem.addCommitment(currentSignals.commitment.matched.slice(-1)[0]);
    }

    // Track rep behavior (questions end in ?)
    const recentNew = rolling.slice(-200);
    const questionMarks = (recentNew.match(/\?/g) || []).length;
    if (questionMarks > mem._repQuestionCount) mem._repQuestionCount = questionMarks;

    // Hybrid stage estimation with elapsed time
    const elapsed = callStartTime ? Math.floor((now - callStartTime) / 1000) : 0;
    const estimatedStage = estimateCallStage(currentSignals, elapsed);

    // Advanced turn transition detection with silence awareness
    const turnResult = detectTurnTransition(rolling, lastAnalyzedContextRef.current, lastTranscriptChangeRef.current);

    // ── PROACTIVE LOCAL ALERTS (no LLM required — fires every tick) ──
    const proactiveAlerts = generateProactiveAlerts(currentSignals, mem, runningStatsRef.current, elapsed);
    // ALWAYS merge alerts (even if empty) to clear expired informational alerts
    const mergedAlerts = processAlerts(proactiveAlerts, activeAlertsRef.current);
    activeAlertsRef.current = mergedAlerts;
    if (proactiveAlerts.length > 0 || mergedAlerts.length !== (activeAlertsRef.current?.length || 0)) {
      setInsights(prev => ({ ...prev, alerts: mergedAlerts }));
    }

    // ── ALERT FAILSAFE: Ensure system never feels blind ──
    if (mergedAlerts.length === 0 && elapsed > 15 && currentSignals.totalSignalScore > 0) {
      // Generate at least one contextual informational alert
      const topSignal = ['pricing', 'objection', 'buying', 'competitor', 'decisionMaker', 'urgency', 'commitment']
        .filter(k => currentSignals[k].count > 0)
        .sort((a, b) => currentSignals[b].score - currentSignals[a].score)[0];
      if (topSignal) {
        const contextAlerts = {
          pricing: { message: '📊 Pricing discussion active. Monitor client reaction closely.', level: 'informational' },
          objection: { message: '⚠ Client concern detected. Prepare to address directly.', level: 'informational' },
          buying: { message: '✅ Positive buying signals detected. Look for commitment opportunities.', level: 'informational' },
          competitor: { message: '⚔️ Competitive landscape active. Reinforce your differentiation.', level: 'informational' },
          decisionMaker: { message: '👤 Decision-maker dynamics in play. Clarify authority chain.', level: 'informational' },
          urgency: { message: '⏰ Urgency detected. Use timeline pressure constructively.', level: 'informational' },
          commitment: { message: '🤝 Commitment language detected. Lock in next steps.', level: 'informational' }
        };
        const fallbackAlert = contextAlerts[topSignal];
        if (fallbackAlert) {
          activeAlertsRef.current = [{ ...fallbackAlert, _ts: now }];
          setInsights(prev => ({ ...prev, alerts: activeAlertsRef.current }));
        }
      }
    }

    // ── PROACTIVE COMPETITOR INFERENCE (behavioral, no explicit name needed) ──
    const proactiveComp = shouldTriggerProactiveCompetitor(rolling, lastProactiveCompetitorRef.current);
    if (proactiveComp.trigger && !delta.hasNewCompetitor) {
      lastProactiveCompetitorRef.current = now;
      console.log(`[ProactiveCompetitor] Behavioral inference triggered (${proactiveComp.confidence}): ${proactiveComp.matchedPhrases.join(', ')}`);
      const inferredCard = {
        competitor: 'Likely Competitor Evaluation',
        mentionedContext: `Comparison behavior detected: "${proactiveComp.matchedPhrases[0]}"`,
        ourAdvantage: proactiveComp.suggestedFocus.join(', '),
        talkTrack: `"${proactiveComp.suggestedFocus[0]} is where we consistently outperform alternatives — let me show you a quick comparison."`,
        _inferred: true,
        _confidence: proactiveComp.confidence,
        _ts: now
      };
      // REPLACE stale inferred cards instead of blocking — allow refresh
      setInsights(prev => ({
        ...prev,
        competitorIntelligence: [inferredCard, ...(prev.competitorIntelligence || []).filter(c => !c._inferred).slice(0, 1)]
      }));
    }

    // ── NEGOTIATION-STAGE PROACTIVE COMPETITOR ──
    // If pricing + objection active but no competitor card visible, show positioning card
    if (currentSignals.pricing.count >= 2 && currentSignals.objection.count >= 1 && elapsed > 60) {
      setInsights(prev => {
        if (prev.competitorIntelligence?.length > 0) return prev;
        return {
          ...prev,
          competitorIntelligence: [{
            competitor: 'Competitive Positioning',
            mentionedContext: 'Pricing friction and objections suggest comparison shopping behavior.',
            ourAdvantage: 'ROI justification, deployment speed, dedicated support',
            talkTrack: '"Based on what you\'ve shared about your requirements, here\'s how our approach directly addresses those concerns compared to alternatives..."',
            _inferred: true,
            _confidence: 'medium',
            _ts: now
          }]
        };
      });
    }

    // ── STRATEGIC TIP BASELINE REFRESH ──
    // Force a standard LLM call if tips haven't refreshed in 15s OR are stale
    const timeSinceTipRefresh = now - lastStrategicTipRefreshRef.current;
    const tipsAreStale = tipStabilizerRef.current.activeTips.length < 2 ||
      (tipStabilizerRef.current.activeTips.length > 0 && (now - tipStabilizerRef.current.activeTips[0]._shownAt > 30000));
    if (timeSinceTipRefresh > 15000 && !isAnalyzingRef.current && tipsAreStale) {
      console.log('[LocalEngine] Strategic tip baseline refresh triggered (tips stale or insufficient)');
      runAnalysisRef.current('tip_baseline_refresh', [], 'standard');
    }

    // ── LOCAL FALLBACK TIPS (when LLM tips are empty, generate from signals) ──
    if (tipStabilizerRef.current.activeTips.length === 0 && elapsed > 10) {
      const fallbackTips = [];
      if (currentSignals.pricing.count > 0) {
        fallbackTips.push({ tip: 'Client focused on pricing. Shift toward ROI and long-term value framing.', exactScript: '"Let me show you the impact this has on your bottom line over 12 months..."', reasoning: 'Pricing signals detected in transcript', _shownAt: now, _confidence: 'medium' });
      }
      if (currentSignals.objection.count > 0) {
        fallbackTips.push({ tip: 'Address client concerns directly. Acknowledge and redirect to value.', exactScript: '"I hear your concern. Here\'s how we\'ve helped similar teams overcome that..."', reasoning: 'Objection signals detected', _shownAt: now, _confidence: 'medium' });
      }
      if (currentSignals.buying.count > 0) {
        fallbackTips.push({ tip: 'Buying signals detected. Move toward concrete next steps now.', exactScript: '"Based on your interest, shall we schedule a follow-up to discuss implementation?"', reasoning: 'Buying intent signals detected', _shownAt: now, _confidence: 'medium' });
      }
      if (fallbackTips.length === 0) {
        fallbackTips.push({ tip: 'Listen actively and identify the client\'s core pain point before proposing solutions.', exactScript: '"What\'s the biggest challenge your team faces with your current process?"', reasoning: 'Default coaching — no strong signals yet', _shownAt: now, _confidence: 'low' });
      }
      tipStabilizerRef.current.activeTips = fallbackTips.slice(0, 2);
      setInsights(prev => ({ ...prev, strategicTips: fallbackTips.slice(0, 2) }));
      console.log('[LocalEngine] Fallback tips generated from local signals');
    }

    // ── ORCHESTRATION DIAGNOSTICS ──
    console.log(`[OrchDiag] tick | elapsed=${elapsed}s | signals=${currentSignals.totalSignalScore} | deltaScore=${delta.deltaScore} | tips=${tipStabilizerRef.current.activeTips.length} | alerts=${mergedAlerts.length} | competitors=${(localSignalsRef.current?.competitor?.count || 0)} | turnConf=${turnResult.confidence} | analyzing=${isAnalyzingRef.current}`);

    // ── LLM Gate Decision ──
    const decision = shouldTriggerLLM(
      delta,
      {},
      lastLLMCallRef.current,
      rolling,
      lastAnalyzedContextRef.current,
      turnResult.isTurnTransition
    );

    if (decision.trigger) {
      console.log(`[LocalEngine] LLM triggered: ${decision.reason} (deltaScore: ${delta.deltaScore}, turnConf: ${turnResult.confidence}, stage: ${estimatedStage.dominantStage}/${estimatedStage.confidence})`);
      runAnalysisRef.current(decision.reason, delta.reasons, decision.requestType);
    }

    // ── INSTANT Competitor Flash (fires in parallel, before full LLM analysis) ──
    if (delta.hasNewCompetitor && currentSignals.competitor.matched.length > 0) {
      const newCompetitors = currentSignals.competitor.matched.filter(name => {
        const lastAlerted = lastCompetitorAlertRef.current[name] || 0;
        return (now - lastAlerted) > 60000;
      });

      if (newCompetitors.length > 0) {
        const competitorName = newCompetitors[newCompetitors.length - 1];
        lastCompetitorAlertRef.current[competitorName] = now;
        console.log(`[Competitor Flash] Detected: ${competitorName} — firing instant Groq analysis`);

        analyzeCompetitorThreat(apiKey, competitorName, rolling).then(result => {
          if (result) {
            setCompetitorFlash({ ...result, _detectedAt: Date.now() });
            setTimeout(() => {
              setCompetitorFlash(prev => prev?._detectedAt === result._detectedAt ? null : prev);
            }, 30000);
          }
        }).catch(err => console.warn("[Competitor Flash] Error:", err.message));
      }
    }
  }


  /**
   * ── Layer 2: LLM Reasoning Engine ──────────────────────────────
   * Called ONLY when the Local Event Engine approves via signal delta.
   * Includes suggestion deduplication and alert processing.
   */
  async function runAnalysis(triggerReason = 'scheduled', triggerSignals = [], requestType = 'full') {
    if (!apiKey) return;
    if (!segmentsRef.current.length) return;
    if (isAnalyzingRef.current) return;

    const now = Date.now();
    // Tactical-only fast path: skip cooldown for turn transitions (need instant responses)
    const isTacticalFastPath = requestType === 'tactical_only';
    const effectiveCooldown = isTacticalFastPath ? 3000 : MIN_LLM_COOLDOWN_MS;
    if (now - lastLLMCallRef.current < effectiveCooldown) return;

    const liveSegments = segmentsRef.current;
    const rolling = rollingTranscript(liveSegments, ROLLING_WINDOW_SECONDS);
    if (countWords(rolling) < MIN_ANALYSIS_WORDS) return;
    if (rolling === lastAnalyzedContextRef.current && triggerReason !== 'competitor_detected' && triggerReason !== 'turn_transition_completed') return;

    lastAnalyzedContextRef.current = rolling;
    lastLLMCallRef.current = now;
    lastAnalysisRef.current = now;
    llmCallCountRef.current += 1;

    isAnalyzingRef.current = true;
    setStatus(`Analyzing… (${triggerReason})`);

    try {
      // Send more conversation memory for better context continuity
      const recentSummaries = (chunkSummariesRef.current || []).slice(-8);

      // Compute call elapsed time
      const callElapsedSeconds = callStartTime ? Math.floor((now - callStartTime) / 1000) : 0;

      // ── Latency Budget Tracker ──
      const llmCallStart = performance.now();

      const data = await generateLiveAssistInsights({ groq: apiKey, openrouter: openRouterKey }, {
        recentTranscript: rolling,
        fullTranscriptTail: transcriptTail(liveSegments),
        dealContext: selectedDealRef.current,
        runningStats: runningStatsRef.current,
        previousSummaries: recentSummaries,
        requestType: requestType,
        callElapsedSeconds: callElapsedSeconds,
        conversationMemory: conversationMemoryRef.current.toPayload()
      });

      const llmLatency = Math.round(performance.now() - llmCallStart);
      console.log(`[LatencyBudget] trigger=${triggerReason} type=${requestType} | LLM=${llmLatency}ms | total≈${Math.round(performance.now() - now)}ms`);

      // ── Feed Momentum Back into Memory ──
      if (data.dealMomentumScore?.score != null) {
        conversationMemoryRef.current.addMomentum(data.dealMomentumScore.score, data.dealMomentumScore.drivers || []);
      }

      // ── Speaker Identity Stabilization ──
      // Feed into registry; it locks at confidence >0.82 and prevents name flipping.
      if (data.speakerIdentification) {
        speakerRegistryRef.current.update(data.speakerIdentification);
        const resolved = speakerRegistryRef.current.getResolved();
        // Overwrite data with locked stable names before merging into UI state
        data.speakerIdentification = {
          ...data.speakerIdentification,
          salesRepName: resolved.salesRepName,
          clientName: resolved.clientName,
          repLocked: resolved.repLocked,
          clientLocked: resolved.clientLocked
        };
      }

      // ── Strategic Tip Stabilizer ──
      // Feed incoming tips into stabilizer; only updates ONE tip at a time.
      const incomingTipCount = data.strategicTips?.length || 0;
      if (data.strategicTips?.length > 0) {
        const accepted = tipStabilizerRef.current.update(data.strategicTips);
        console.log(`[TipDiag] LLM returned ${incomingTipCount} tips | stabilizer accepted=${accepted} | activeTips=${tipStabilizerRef.current.activeTips.length}`);
      } else {
        console.log(`[TipDiag] LLM returned 0 tips | trigger=${triggerReason}`);
      }
      lastStrategicTipRefreshRef.current = Date.now();
      
      // Always use the stabilized 2-tip set for display (prevents flicker)
      const stableTips = tipStabilizerRef.current.getDisplay();
      if (stableTips.length > 0) {
        data.strategicTips = stableTips;
      }

      // ── Tip failsafe: if LLM returned tips but stabilizer rejected all, force-seed ──
      if (incomingTipCount > 0 && tipStabilizerRef.current.activeTips.length === 0) {
        console.warn('[TipDiag] FAILSAFE: All tips were rejected by stabilizer. Force-seeding.');
        const normalized = data.strategicTips || [];
        tipStabilizerRef.current.activeTips = (Array.isArray(normalized) ? normalized : []).slice(0, 2).map(t => ({
          tip: typeof t === 'string' ? t : (t.tip || ''),
          exactScript: typeof t === 'string' ? '' : (t.exactScript || ''),
          reasoning: typeof t === 'string' ? '' : (t.reasoning || ''),
          _shownAt: Date.now(),
          _confidence: 'medium'
        }));
        data.strategicTips = tipStabilizerRef.current.getDisplay();
      }

      // ── LLM Response Diagnostics ──
      console.log(`[LLMDiag] trigger=${triggerReason} | tips=${data.strategicTips?.length || 0} | alerts=${data.alerts?.length || 0} | competitors=${data.competitorIntelligence?.length || 0} | suggestions=${data.suggestedResponses?.length || 0} | momentum=${data.dealMomentumScore?.score ?? '?'}`);


      // ── Suggestion Deduplication ──
      if (data.suggestedResponses?.length > 0) {
        data.suggestedResponses = deduplicateSuggestions(
          data.suggestedResponses,
          suggestionHistoryForDedup.current
        );
        // Keep last 5 sets for dedup
        suggestionHistoryForDedup.current = [
          data.suggestedResponses,
          ...suggestionHistoryForDedup.current
        ].slice(0, 5);
      }

      // ── Alert Processing (LLM alerts + proactive memory alerts, merged) ──
      const memAlerts = conversationMemoryRef.current.getUnresolvedAlerts();
      const elapsedMin = callElapsedSeconds / 60;
      const coachingDeficits = conversationMemoryRef.current.getRepCoachingDeficits(elapsedMin);
      // Merge LLM alerts with already-active proactive alerts (don't reset active ones)
      const combinedAlerts = [...(data.alerts || []), ...memAlerts, ...coachingDeficits, ...activeAlertsRef.current];
      data.alerts = processAlerts(combinedAlerts, []);
      activeAlertsRef.current = data.alerts;
      
      setInsights(prev => mergeInsights(prev, data));
      setActiveProvider(data._provider || "Unknown");
      setAnalysisAt(new Date());
      setStatus(`Live coaching active (${llmCallCountRef.current} analyses)`);


      // Store suggestion history (keep last 20)
      if (data.suggestedResponses?.length > 0) {
        setSuggestionHistory(prev => [
          { responses: data.suggestedResponses, timestamp: new Date(), headline: data.headline },
          ...prev
        ].slice(0, 20));
      }

      // Store chunk summary
      if (data.chunkSummary) {
        const idx = chunkIndexRef.current;
        chunkIndexRef.current = idx + 1;
        const timeStart = formatTimeLabel(now - 15000);
        const timeEnd = formatTimeLabel(now);
        const chunkData = {
          chunk_index: idx,
          time_start: timeStart,
          time_end: timeEnd,
          summary_text: data.chunkSummary,
          key_topics: [],
          sentiment: "neutral",
          competitors_mentioned: (data.competitorIntelligence || []).map(c => c.competitor),
          raw_transcript: rolling,
          created_at: new Date().toISOString()
        };
        setChunkSummaries(prev => [...prev, chunkData]);
        chunkSummariesRef.current = [...chunkSummariesRef.current, chunkData];
        if (sessionId) storeChunkSummary(sessionId, chunkData);
      }
    } catch (err) {
      // ── Failure Orchestration: Classify and Gracefully Degrade ──
      const isNetworkError = err.message?.includes('fetch') || err.message?.includes('network') || err.message?.includes('ERR_');
      const isModelUnavailable = err.message?.includes('503') || err.message?.includes('overloaded') || err.message?.includes('timeout');
      const isAuthError = err.message?.includes('401') || err.message?.includes('403') || err.message?.includes('key');
      const isPartialCorruption = err.message?.includes('JSON') || err.message?.includes('parse');

      const failureType = isAuthError ? 'auth_error'
        : isModelUnavailable ? 'model_unavailable'
        : isNetworkError ? 'network_degradation'
        : isPartialCorruption ? 'response_corruption'
        : 'unknown_error';

      console.error(`[LiveAssist] runAnalysis FAILURE [${failureType}]:`, err.message);

      // Graceful degradation: do NOT clear UI state on failure — preserve last good state
      // Only show error for hard failures (auth), not transient ones
      if (isAuthError) {
        setError(`API key error: ${err.message}`);
      } else {
        // Soft degradation — preserve suggestions, just update status
        setStatus(`Live (analysis ${failureType === 'model_unavailable' ? 'recovering...' : 'degraded'})`);
      }
    } finally {
      isAnalyzingRef.current = false;
    }
  }

  function scheduleAnalysis() {
    if (analyzeTimerRef.current) return;
    analyzeTimerRef.current = setTimeout(async () => {
      analyzeTimerRef.current = null;
      await runAnalysisRef.current();
    }, 300); // Drastically reduced from 5000ms to 300ms for instant turn responses
  }

  async function drainQueue() {
    if (processingRef.current) return;
    processingRef.current = true;

    try {
      while (chunkQueueRef.current.length > 0) {
        const chunk = chunkQueueRef.current.shift();
        if (!chunk) continue;

        const merged = mergeBlobs(carryChunkRef.current, chunk);
        const shouldForceFlush = carrySinceRef.current > 0 && (Date.now() - carrySinceRef.current > 12000);
        if (!merged || (merged.size < MIN_TRANSCRIBE_BLOB_BYTES && !shouldForceFlush)) {
          carryChunkRef.current = merged;
          if (!carrySinceRef.current) carrySinceRef.current = Date.now();
          continue;
        }

        // Send the merged blob directly — Groq Whisper handles WebM timeslice chunks natively.
        const transcribeBlob = merged;

        try {
          const result = await transcribeAudioBlob(apiKey, transcribeBlob);
          if (!result.text) continue;

          carryChunkRef.current = null;
          carrySinceRef.current = 0;

          const segment = {
            id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
            ts: Date.now(),
            text: result.text
          };

          setSegments(prev => clipSegments([
            ...prev,
            segment
          ]));

          // Keep refs hot so live analysis uses latest transcript immediately.
          segmentsRef.current = clipSegments([
            ...segmentsRef.current,
            segment
          ]);
          runningStatsRef.current = estimateRunningStats(segmentsRef.current);

          setStatus("Listening and transcribing…");
          setError("");
          scheduleAnalysis();
        } catch (err) {
          const msg = err.message || "Transcription failed";
          // We used to accumulate the chunk on 400 Bad Request, but concatenating two separate
          // WebM files creates a corrupt container and causes a permanent 400 loop.
          // Drop the chunk and move on.
          carryChunkRef.current = null;
          carrySinceRef.current = 0;
          setStatus("Listening (dropped silent chunk)");
          setError(msg);
        }
      }
    } finally {
      processingRef.current = false;
      if (chunkQueueRef.current.length > 0) {
        // Avoid a queue race where chunks arrive during processing and never get picked up.
        drainQueue();
      }
    }
  }

  async function startCapture() {
    setError("");

    if (!apiKey) {
      setError("Add your API key first using the settings button in the top bar.");
      return;
    }

    if (!navigator.mediaDevices?.getDisplayMedia) {
      setError("This browser does not support tab audio capture.");
      return;
    }

    try {
      setStatus("Requesting screen/audio access…");
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        }
      });

      const audioTracks = stream.getAudioTracks();

      // ── Detect share type ────────────────────────────────────────────────
      // displaySurface: "monitor" = entire screen, "browser" = tab, "window" = window
      const videoTrack = stream.getVideoTracks()[0];
      const displaySurface = videoTrack?.getSettings()?.displaySurface ?? "unknown";
      const isEntireScreen = displaySurface === "monitor";

      let recordingStream;

      if (isEntireScreen) {
        // ── Entire Screen: Mix system audio + microphone ──────────────────
        setStatus("Entire screen detected — requesting microphone…");

        let micStream = null;
        try {
          micStream = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true
            }
          });
          micStreamRef.current = micStream;
        } catch (micErr) {
          // Microphone permission denied — fall back to system audio only
          console.warn("[LiveAssist] Microphone access denied, using system audio only:", micErr.message);
          setError("Mic permission denied — capturing system audio only (your voice won't be heard).");
        }

        if (micStream && audioTracks.length > 0) {
          // Mix both: system audio (other person) + mic (your voice)
          const audioCtx = new AudioContext();
          audioCtxRef.current = audioCtx;
          const destination = audioCtx.createMediaStreamDestination();

          // Connect system audio track
          const systemSource = audioCtx.createMediaStreamSource(new MediaStream(audioTracks));
          systemSource.connect(destination);

          // Connect microphone track
          const micSource = audioCtx.createMediaStreamSource(micStream);
          micSource.connect(destination);

          recordingStream = destination.stream;
          console.log("[LiveAssist] Entire screen — mixing system audio + mic.");
        } else if (micStream) {
          // No system audio but mic is available (screen shared without audio)
          recordingStream = micStream;
          console.warn("[LiveAssist] No system audio track — recording mic only.");
          if (!audioTracks.length) {
            setError("No system audio captured. Enable 'Share system audio' in the sharing prompt. Recording mic only.");
          }
        } else {
          // No mic and no system audio
          if (!audioTracks.length) {
            stream.getTracks().forEach(t => t.stop());
            throw new Error("No audio detected. Enable 'Share system audio' when sharing your screen.");
          }
          recordingStream = new MediaStream(audioTracks);
        }
      } else {
        // ── Tab or Window: existing behaviour — system audio only ─────────
        if (!audioTracks.length) {
          stream.getTracks().forEach(t => t.stop());
          throw new Error("No tab audio track detected. When sharing, select a browser tab and enable Share tab audio.");
        }
        recordingStream = new MediaStream(audioTracks);
        console.log(`[LiveAssist] ${displaySurface} share — using system audio only (unchanged behaviour).`);
      }

      const recorder = createRecorderWithFallback(recordingStream);

      recorder.ondataavailable = event => {
        if (event.data && event.data.size > 0) {
          chunkQueueRef.current.push(event.data);
          drainQueue();
        }
      };

      recorder.onerror = event => {
        setError(event.error?.message || "Capture error");
        stopCapture();
      };

      stream.getVideoTracks().forEach(track => {
        track.onended = () => {
          console.log('[LiveAssist] Video track ended (user clicked Stop Sharing) — triggering graceful shutdown');
          stopCapture();
        };
      });

      stream.getAudioTracks().forEach(track => {
        track.onended = () => {
          console.log('[LiveAssist] Audio track ended — triggering graceful shutdown');
          stopCapture();
        };
      });

      streamRef.current = stream;
      recorderStreamRef.current = recordingStream;
      recorderRef.current = recorder;

      isCapturingRef.current = true;
      
      // ── BULLETPROOF RECORDING STRATEGY ──
      // Instead of using timeslice (which emits headerless chunks) or stitching blobs,
      // we just record for 5 seconds, stop (which finalizes a valid WebM), and immediately start again.
      // Every chunk is 100% valid for Groq and has NO prepended history (fixes repetition).
      recorder.start();
      
      sliceTimerRef.current = setInterval(() => {
        if (recorder.state === "recording" && isCapturingRef.current) {
          // Stop finalizes the file and triggers ondataavailable
          recorder.stop(); 
          // Wait for state to settle to 'inactive' before restarting
          setTimeout(() => {
            if (isCapturingRef.current && recorder.state === "inactive") {
              try { recorder.start(); } catch(e) {}
            }
          }, 50);
        }
      }, CAPTURE_SLICE_MS);

      setIsCapturing(true);
      setCallStartTime(Date.now());
      setChunkSummaries([]);
      chunkSummariesRef.current = [];
      chunkIndexRef.current = 0;
      setSuggestionHistory([]);
      setFinalSummary(null);
      setShowFinalSummary(false);
      setInsights(DEFAULT_INSIGHTS);
      // Reset Local Event Engine state
      previousSignalsRef.current = null;
      localSignalsRef.current = null;
      lastLLMCallRef.current = 0;
      llmCallCountRef.current = 0;
      suggestionHistoryForDedup.current = [];
      activeAlertsRef.current = [];
      lastAnalyzedContextRef.current = "";
      setStatus(isEntireScreen
        ? "Listening and transcribing… (mic + system audio)"
        : "Listening and transcribing…"
      );
      // Create Supabase session
      createSession().then(sid => { if (sid) setSessionId(sid); });
    } catch (err) {
      setError(err.message || "Could not start capture");
      setStatus("Idle");
      isCapturingRef.current = false;
      cleanupCapture();
    }
  }

  // Keep segmentsRef hot whenever segments state changes.
  // This effect intentionally does NOT manage timers so that scheduleAnalysis()
  // timeouts are never cleared mid-flight by a routine transcript update.
  useEffect(() => {
    segmentsRef.current = segments;
  }, [segments]);

  // Always call the latest runAnalysis from the interval AND localEngineTick
  // so the closure over apiKey (and anything else that might change) stays current.
  const runAnalysisRef = useRef(runAnalysis);
  useEffect(() => {
    runAnalysisRef.current = runAnalysis;
  });

  const localEngineTickRef = useRef(localEngineTick);
  useEffect(() => {
    localEngineTickRef.current = localEngineTick;
  });

  // ── Two-Layer Timer Management ──────────────────────────────────
  // Layer 1: Local Event Engine runs every 4s (fast, zero API cost)
  // Layer 2: LLM calls are triggered BY Layer 1 (event-driven)
  useEffect(() => {
    if (!isCapturing) {
      if (analyzeTimerRef.current) {
        clearTimeout(analyzeTimerRef.current);
        analyzeTimerRef.current = null;
      }
      if (analysisIntervalRef.current) {
        clearInterval(analysisIntervalRef.current);
        analysisIntervalRef.current = null;
      }
      if (localEngineTimerRef.current) {
        clearInterval(localEngineTimerRef.current);
        localEngineTimerRef.current = null;
      }
      // Reset local engine state
      previousSignalsRef.current = null;
      localSignalsRef.current = null;
      lastLLMCallRef.current = 0;
      llmCallCountRef.current = 0;
      suggestionHistoryForDedup.current = [];
      activeAlertsRef.current = [];
      conversationMemoryRef.current = new ConversationMemory();
      lastTranscriptChangeRef.current = 0;
      // Reset stability orchestration systems
      speakerRegistryRef.current.reset();
      tipStabilizerRef.current.reset();
      lastProactiveCompetitorRef.current = 0;
      lastStrategicTipRefreshRef.current = 0;
      resetAlertCooldowns();
      return;
    }

    // ── Layer 1: Local Event Engine (every 4 seconds) ──
    // Scans transcript for keywords, computes signal delta, gates LLM calls
    localEngineTimerRef.current = setInterval(() => {
      localEngineTickRef.current();
    }, LOCAL_ENGINE_TICK_MS);

    // ── Layer 2: Baseline LLM check (every 20 seconds) ──
    // Prevents suggestions from going stale during natural pauses
    analysisIntervalRef.current = setInterval(() => {
      const timeSinceLastLLM = Date.now() - lastLLMCallRef.current;
      if (timeSinceLastLLM > BASELINE_LLM_INTERVAL_MS) {
        console.log(`[LocalEngine] Baseline LLM refresh (no signal-driven call in ${BASELINE_LLM_INTERVAL_MS / 1000}s)`);
        runAnalysisRef.current('baseline_refresh', [], 'standard');
      }
    }, BASELINE_LLM_INTERVAL_MS);

    return () => {
      if (analyzeTimerRef.current) {
        clearTimeout(analyzeTimerRef.current);
        analyzeTimerRef.current = null;
      }
      clearInterval(analysisIntervalRef.current);
      analysisIntervalRef.current = null;
      clearInterval(localEngineTimerRef.current);
      localEngineTimerRef.current = null;
    };
  }, [isCapturing]);

  useEffect(() => {
    return () => {
      cleanupCapture();
    };
  }, []);

  const spk = insights.speakerIdentification || {};

  return (
    <div className={styles.view}>
      <div className={styles.topRow}>
        <div>
          <h1 className={styles.title}>Live AI Sales Co-Pilot</h1>
          <p className={styles.subtitle}>
            Capture browser tab audio from Google Meet or web calls and get real-time guidance.
          </p>
          {isCapturing && (
            <div style={{display:'flex',gap:8,marginTop:6,flexWrap:'wrap'}}>
              <span style={{
                padding:'3px 10px',
                borderRadius:20,
                fontSize:'0.75rem',
                fontWeight:700,
                background: spk.repLocked ? 'rgba(52,211,153,0.15)' : 'rgba(139,92,246,0.15)',
                color: spk.repLocked ? '#34d399' : '#c4b5fd',
                border: `1px solid ${spk.repLocked ? 'rgba(52,211,153,0.3)' : 'rgba(139,92,246,0.3)'}`,
                display: 'flex',
                alignItems: 'center',
                gap: 5
              }}>
                🎙️ Rep: {spk.salesRepName} {spk.repLocked ? "✅" : "⏳ Detecting..."}
              </span>
              <span style={{
                padding:'3px 10px',
                borderRadius:20,
                fontSize:'0.75rem',
                fontWeight:700,
                background: spk.clientLocked ? 'rgba(52,211,153,0.15)' : 'rgba(236,72,153,0.15)',
                color: spk.clientLocked ? '#34d399' : '#f9a8d4',
                border: `1px solid ${spk.clientLocked ? 'rgba(52,211,153,0.3)' : 'rgba(236,72,153,0.3)'}`,
                display: 'flex',
                alignItems: 'center',
                gap: 5
              }}>
                👤 Client: {spk.clientName} {spk.clientLocked ? "✅" : "⏳ Detecting..."}
              </span>
              {insights.dealMomentumScore?.score > 0 && (
                 <div className={styles.momentumBadgeWrap}>
                   <span style={{padding:'3px 10px',borderRadius:20,fontSize:'0.75rem',fontWeight:700,background:'rgba(52,211,153,0.15)',color:'#34d399',border:'1px solid rgba(52,211,153,0.3)',cursor:'help'}} title={insights.dealMomentumScore.drivers?.join('\n')}>🔥 Momentum: {insights.dealMomentumScore.score}%</span>
                   {insights.dealMomentumScore.drivers?.length > 0 && (
                     <div className={styles.momentumTooltip}>
                       <div style={{color:'#34d399', fontWeight:800, marginBottom:8, fontSize:'0.9rem', borderBottom:'1px solid rgba(52,211,153,0.3)', paddingBottom:4}}>🚀 Deal Momentum Drivers</div>
                       {insights.dealMomentumScore.drivers.map((d, i) => (
                         <div key={i} style={{color:d.startsWith('+')?'#10b981':'#ef4444', marginBottom:4, display:'flex', gap:6}}>
                           <span>{d.startsWith('+') ? '✅' : '🔴'}</span>
                           <span style={{fontWeight:500}}>{d.replace(/^[+-]\s*/, '')}</span>
                         </div>
                       ))}
                     </div>
                   )}
                 </div>
              )}
              {insights.stageConfidence?.dominantStage && (
                 <div className={styles.stageBadgeWrap}>
                    <span style={{padding:'3px 10px',borderRadius:20,fontSize:'0.75rem',fontWeight:700,background:'rgba(96,165,250,0.15)',color:'#60a5fa',border:'1px solid rgba(96,165,250,0.3)', textTransform: 'capitalize', cursor:'help'}}>📌 Stage: {insights.stageConfidence.dominantStage} ({insights.stageConfidence.confidence || "medium"})</span>
                    <div className={styles.stageTooltip}>
                      <div style={{color:'#60a5fa', fontWeight:800, marginBottom:8, fontSize:'0.95rem', borderBottom:'1px solid rgba(96,165,250,0.3)', paddingBottom:4}}>🎯 Stage Strategy: {insights.stageConfidence.dominantStage}</div>
                      <div style={{fontSize:'0.85rem', color:'#cbd5e1', display:'flex', flexDirection:'column', gap:8}}>
                        {insights.stageConfidence.dominantStage.toLowerCase().includes('discovery') && (
                          <>
                            <div><strong style={{color:'#fff'}}>Goal:</strong> Identify pain points and qualify budget.</div>
                            <div><strong style={{color:'#fff'}}>Focus:</strong> Ask open-ended questions about their current workflow.</div>
                          </>
                        )}
                        {insights.stageConfidence.dominantStage.toLowerCase().includes('demo') && (
                          <>
                            <div><strong style={{color:'#fff'}}>Goal:</strong> Show value and handle product objections.</div>
                            <div><strong style={{color:'#fff'}}>Focus:</strong> Tailor the features to their specific pain points.</div>
                          </>
                        )}
                        {insights.stageConfidence.dominantStage.toLowerCase().includes('negotiation') && (
                          <>
                            <div><strong style={{color:'#fff'}}>Goal:</strong> Agree on terms and handle pricing friction.</div>
                            <div><strong style={{color:'#fff'}}>Focus:</strong> Reinforce ROI and implementation ease.</div>
                          </>
                        )}
                        {insights.stageConfidence.dominantStage.toLowerCase().includes('closing') && (
                          <>
                            <div><strong style={{color:'#fff'}}>Goal:</strong> Get commitment and sign the deal.</div>
                            <div><strong style={{color:'#fff'}}>Focus:</strong> Ask direct commitment questions and identify blockers.</div>
                          </>
                        )}
                        {!['discovery', 'demo', 'negotiation', 'closing'].some(s => insights.stageConfidence.dominantStage.toLowerCase().includes(s)) && (
                          <div style={{fontStyle:'italic'}}>AI is analyzing the conversation to determine the best tactical approach for this stage.</div>
                        )}
                      </div>
                    </div>
                 </div>
              )}
            </div>
          )}
        </div>
        <div className={styles.controls} style={{flexDirection: 'column', alignItems: 'flex-end'}}>
          <div style={{display:'flex', gap: 10, alignItems: 'center'}}>
            {isCapturing && (
              <span style={{ fontSize: '11px', fontWeight: 700, padding: '6px 12px', background: 'rgba(255,255,255,0.05)', borderRadius: 20, color: '#94a3b8', border: '1px solid rgba(255,255,255,0.1)' }}>
                Text LLM: <strong style={{ color: activeProvider === "OpenRouter" ? "#10b981" : "#f43f5e" }}>{activeProvider}</strong> | Audio: <strong style={{color:'#60a5fa'}}>Whisper</strong>
              </span>
            )}
            <button
              className={overlayOpen ? styles.stopBtn : styles.overlayBtn}
              onClick={overlayOpen ? closePiP : handleLaunchOverlay}
              title={overlayOpen
                ? "Close the always-on-top overlay window"
                : pipSupported
                  ? "Launch an always-on-top mini window that floats above Teams / GMeet"
                  : "Requires Chrome 116+ for Picture-in-Picture overlay"
              }
            >
              {overlayOpen ? "✕ Close Overlay" : "🪟 Launch Overlay"}
            </button>
            <select className={styles.select} value={selectedDealId} onChange={e => setSelectedDealId(e.target.value)}>
              <option value="new_call">✨ New Call (Fresh Context)</option>
              <optgroup label="Existing Deals">
                {deals.map(deal => (
                  <option key={deal.id} value={deal.id}>{deal.company} · {deal.stage} · ${deal.value.toLocaleString()}</option>
                ))}
              </optgroup>
            </select>
            {!isCapturing ? (
              <button className={styles.startBtn} onClick={startCapture}>Start Live Assist</button>
            ) : (
              <button className={styles.stopBtn} onClick={stopCapture}>Stop</button>
            )}
          </div>
          
          <div style={{display:'flex', gap: 10, fontSize: '11px', color: '#94a3b8', marginTop: 4, alignItems: 'center'}}>
            <span className={`${styles.dot} ${isCapturing ? styles.dotLive : ""}`} style={{width: 6, height: 6}} />
            <span>{status}</span>
            <span>•</span>
            <span>Context: {ROLLING_WINDOW_SECONDS}s</span>
            {chunkSummaries.length > 0 && <span>• 📝 {chunkSummaries.length}</span>}
            {analysisAt && <span>• Updated {analysisAt.toLocaleTimeString()}</span>}
          </div>
        </div>
      </div>

      {/* ⚡ INSTANT COMPETITOR FLASH CARD */}
      {competitorFlash && (
        <div style={{
          margin: '0 0 12px 0',
          background: 'linear-gradient(135deg, rgba(239,68,68,0.12) 0%, rgba(220,38,38,0.18) 100%)',
          border: '1.5px solid rgba(239,68,68,0.6)',
          borderRadius: 12,
          padding: '14px 18px',
          animation: 'slideUpFade 0.3s ease-out',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Pulsing left border accent */}
          <div style={{
            position: 'absolute', left: 0, top: 0, bottom: 0, width: 4,
            background: '#ef4444',
            animation: 'pulse 1.5s ease-in-out infinite'
          }} />
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10}}>
            <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
              <span style={{fontSize: 18}}>🚨</span>
              <span style={{color: '#ef4444', fontWeight: 800, fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.08em'}}>
                Competitor Detected
              </span>
              <span style={{
                background: 'rgba(239,68,68,0.2)', color: '#fca5a5',
                padding: '2px 10px', borderRadius: 20, fontSize: '12px', fontWeight: 700,
                border: '1px solid rgba(239,68,68,0.4)'
              }}>
                {competitorFlash.competitor}
              </span>
              {competitorFlash.urgency === 'high' && (
                <span style={{background:'#ef4444', color:'#fff', padding:'2px 8px', borderRadius:20, fontSize:'10px', fontWeight:800}}>
                  HIGH PRIORITY
                </span>
              )}
            </div>
            <button onClick={() => setCompetitorFlash(null)} style={{
              background: 'transparent', border: 'none', color: '#94a3b8',
              cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: 4
            }}>✕</button>
          </div>

          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 10}}>
            <div style={{background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: '8px 10px'}}>
              <div style={{fontSize: '10px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4}}>Their Weakness</div>
              <div style={{fontSize: '13px', color: '#fca5a5'}}>{competitorFlash.theirWeakness || '—'}</div>
            </div>
            <div style={{background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: '8px 10px'}}>
              <div style={{fontSize: '10px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4}}>Our Advantage</div>
              <div style={{fontSize: '13px', color: '#34d399'}}>{competitorFlash.ourAdvantage || '—'}</div>
            </div>
            <div style={{background: 'rgba(0,0,0,0.2)', borderRadius: 8, padding: '8px 10px'}}>
              <div style={{fontSize: '10px', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4}}>Context</div>
              <div style={{fontSize: '13px', color: '#cbd5e1'}}>{competitorFlash.mentionedContext || '—'}</div>
            </div>
          </div>

          <div style={{
            background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: 8, padding: '10px 14px',
            borderLeft: '3px solid #ef4444'
          }}>
            <div style={{fontSize: '10px', color: '#f87171', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6}}>
              ⚡ Say This Now
            </div>
            <div style={{fontSize: '14px', color: '#fff', fontWeight: 600, fontStyle: 'italic'}}>
              "{competitorFlash.talkTrack}"
            </div>
          </div>

          {competitorFlash.battleCard && (
            <div style={{marginTop: 8, fontSize: '12px', color: '#94a3b8', whiteSpace: 'pre-line'}}>
              {competitorFlash.battleCard}
            </div>
          )}
        </div>
      )}

      {/* TIER 1 Horizontal Signals Card */}
      {(insights.buyingIntent?.label || insights.objectionRisk?.label || insights.urgency || insights.decisionMakerPresence?.status || insights.nextBestAction !== DEFAULT_INSIGHTS.nextBestAction) && (
        <div className={styles.statusBar} style={{ justifyContent: 'flex-start', background: 'rgba(26,26,46,0.9)', borderColor: 'rgba(52, 211, 153, 0.4)', padding: '12px 16px', flexWrap: 'wrap' }}>
          <strong style={{color:'#34d399', marginRight: 10, letterSpacing: '0.05em', fontSize: '11px', textTransform: 'uppercase', alignSelf: 'center'}}>⚡ Live Signals:</strong>
          
          {insights.buyingIntent?.label && (
            <div className={styles.signalPillWrap}>
              <span style={{padding:'4px 10px', borderRadius:'6px', background:'rgba(16,185,129,0.15)', color:'#10b981', border:'1px solid rgba(16,185,129,0.25)', fontWeight:600}}>🛒 {insights.buyingIntent.label}</span>
              {insights.buyingIntent.reason && (
                <div className={styles.signalTooltip}>
                  <div style={{color:'#10b981', fontWeight:800, marginBottom:8, fontSize:'0.9rem', borderBottom:'1px solid rgba(16,185,129,0.3)', paddingBottom:4}}>🛒 Buying Intent Detected</div>
                  <div style={{color:'#cbd5e1', fontSize:'0.85rem'}}>**Reasoning:** {insights.buyingIntent.reason}</div>
                </div>
              )}
            </div>
          )}
          
          {insights.objectionRisk?.label && (
            <div className={styles.signalPillWrap}>
              <span style={{padding:'4px 10px', borderRadius:'6px', background:'rgba(239,68,68,0.15)', color:'#ef4444', border:'1px solid rgba(239,68,68,0.25)', fontWeight:600}}>⚠️ {insights.objectionRisk.label}</span>
              {insights.objectionRisk.reason && (
                <div className={styles.signalTooltip}>
                  <div style={{color:'#ef4444', fontWeight:800, marginBottom:8, fontSize:'0.9rem', borderBottom:'1px solid rgba(239,68,68,0.3)', paddingBottom:4}}>⚠️ Objection Risk Detected</div>
                  <div style={{color:'#cbd5e1', fontSize:'0.85rem'}}>**Reasoning:** {insights.objectionRisk.reason}</div>
                </div>
              )}
            </div>
          )}
          
          {insights.urgency && (
            <div className={styles.signalPillWrap}>
              <span style={{padding:'4px 10px', borderRadius:'6px', background:'rgba(245,158,11,0.15)', color:'#f59e0b', border:'1px solid rgba(245,158,11,0.25)', fontWeight:600, alignSelf:'center'}}>⏱️ {insights.urgency}</span>
              <div className={styles.signalTooltip}>
                <div style={{color:'#f59e0b', fontWeight:800, marginBottom:8, fontSize:'0.9rem', borderBottom:'1px solid rgba(245,158,11,0.3)', paddingBottom:4}}>⏱️ Urgency Detected</div>
                <div style={{color:'#cbd5e1', fontSize:'0.85rem'}}>Client expressed time pressure. Use this to create momentum toward closing.</div>
              </div>
            </div>
          )}
          
          {insights.decisionMakerPresence?.status && (
            <div className={styles.signalPillWrap}>
              <span style={{padding:'4px 10px', borderRadius:'6px', background:'rgba(139,92,246,0.15)', color:'#c4b5fd', border:'1px solid rgba(139,92,246,0.25)', fontWeight:600}}>👤 {insights.decisionMakerPresence.status}</span>
              <div className={styles.signalTooltip}>
                <div style={{color:'#c4b5fd', fontWeight:800, marginBottom:8, fontSize:'0.9rem', borderBottom:'1px solid rgba(139,92,246,0.3)', paddingBottom:4}}>👤 Decision Maker Insights</div>
                <div style={{color:'#cbd5e1', fontSize:'0.85rem', marginBottom:8}}><strong style={{color:'#fff'}}>Confidence:</strong> {insights.decisionMakerPresence.confidence}</div>
                {insights.decisionMakerPresence.reason?.length > 0 && (
                  <div style={{color:'#94a3b8', fontSize:'0.8rem', display:'flex', flexDirection:'column', gap:4}}>
                    {insights.decisionMakerPresence.reason.map((r, i) => <div key={i}>• {r}</div>)}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {insights.nextBestAction?.action && insights.nextBestAction.action !== DEFAULT_INSIGHTS.nextBestAction.action && (
            <div className={styles.signalPillWrap}>
              <span style={{padding:'4px 10px', borderRadius:'6px', background:'rgba(59,130,246,0.15)', color:'#60a5fa', border:'1px solid rgba(59,130,246,0.25)', fontWeight:600, alignSelf:'center'}}>▶ {insights.nextBestAction.action}</span>
              <div className={styles.signalTooltip}>
                <div style={{color:'#60a5fa', fontWeight:800, marginBottom:8, fontSize:'0.9rem', borderBottom:'1px solid rgba(59,130,246,0.3)', paddingBottom:4}}>▶ Next Best Action</div>
                <div style={{color:'#cbd5e1', fontSize:'0.85rem', marginBottom:6}}>{insights.nextBestAction.action}</div>
                {insights.nextBestAction.reasoning && <div style={{color:'#94a3b8', fontSize:'0.8rem', marginBottom:6}}>💡 {insights.nextBestAction.reasoning}</div>}
                <div style={{display:'flex', gap:4, flexWrap:'wrap'}}>
                  <span style={{padding:'2px 6px', borderRadius:4, background: insights.nextBestAction.confidence === 'high' ? 'rgba(16,185,129,0.2)' : insights.nextBestAction.confidence === 'medium' ? 'rgba(245,158,11,0.2)' : 'rgba(148,163,184,0.2)', color: insights.nextBestAction.confidence === 'high' ? '#34d399' : insights.nextBestAction.confidence === 'medium' ? '#fbbf24' : '#94a3b8', fontSize:'0.7rem', fontWeight:700}}>{insights.nextBestAction.confidence?.toUpperCase()}</span>
                  {insights.nextBestAction.supportingSignals?.map((s, i) => <span key={i} style={{padding:'2px 6px', borderRadius:4, background:'rgba(139,92,246,0.15)', color:'#c4b5fd', fontSize:'0.7rem'}}>• {s}</span>)}
                </div>
              </div>
            </div>
          )}

          {insights.dealMomentumScore?.score != null && (
            <div className={styles.signalPillWrap}>
              <span style={{padding:'4px 10px', borderRadius:'6px', background: insights.dealMomentumScore.score >= 60 ? 'rgba(16,185,129,0.15)' : insights.dealMomentumScore.score >= 40 ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)', color: insights.dealMomentumScore.score >= 60 ? '#10b981' : insights.dealMomentumScore.score >= 40 ? '#f59e0b' : '#ef4444', border: `1px solid ${insights.dealMomentumScore.score >= 60 ? 'rgba(16,185,129,0.25)' : insights.dealMomentumScore.score >= 40 ? 'rgba(245,158,11,0.25)' : 'rgba(239,68,68,0.25)'}`, fontWeight:600, alignSelf:'center'}}>
                {insights.dealMomentumScore.trendDirection === 'rising' ? '📈' : insights.dealMomentumScore.trendDirection === 'declining' ? '📉' : '➡️'} Momentum: {insights.dealMomentumScore.score}/100
              </span>
              {insights.dealMomentumScore.drivers?.length > 0 && (
                <div className={styles.signalTooltip}>
                  <div style={{color:'#10b981', fontWeight:800, marginBottom:8, fontSize:'0.9rem', borderBottom:'1px solid rgba(16,185,129,0.3)', paddingBottom:4}}>📈 Deal Momentum Analysis</div>
                  <div style={{color:'#94a3b8', fontSize:'0.75rem', marginBottom:6}}>Trend: <span style={{color: insights.dealMomentumScore.trendDirection === 'rising' ? '#34d399' : insights.dealMomentumScore.trendDirection === 'declining' ? '#f87171' : '#94a3b8', fontWeight:700, textTransform:'uppercase'}}>{insights.dealMomentumScore.trendDirection}</span></div>
                  {insights.dealMomentumScore.drivers.map((d, i) => (
                    <div key={i} style={{color: d.startsWith('+') ? '#34d399' : '#fca5a5', fontSize:'0.85rem', marginBottom:4}}>{d}</div>
                  ))}
                </div>
              )}
            </div>
          )}

          {insights.stageConfidence?.dominantStage && insights.stageConfidence.dominantStage !== 'unknown' && (
            <div className={styles.signalPillWrap}>
              <span style={{padding:'4px 10px', borderRadius:'6px', background:'rgba(139,92,246,0.15)', color:'#c4b5fd', border:'1px solid rgba(139,92,246,0.25)', fontWeight:600, alignSelf:'center', textTransform:'capitalize'}}>🎯 {insights.stageConfidence.dominantStage}</span>
              <div className={styles.signalTooltip}>
                <div style={{color:'#c4b5fd', fontWeight:800, marginBottom:8, fontSize:'0.9rem', borderBottom:'1px solid rgba(139,92,246,0.3)', paddingBottom:4}}>🎯 Call Stage Confidence</div>
                <div style={{color:'#94a3b8', fontSize:'0.75rem', marginBottom:6}}>Confidence: <span style={{color:'#fff', fontWeight:700, textTransform:'uppercase'}}>{insights.stageConfidence.confidence}</span></div>
                {Object.entries(insights.stageConfidence.breakdown || {}).sort((a,b) => b[1]-a[1]).map(([stage, score]) => (
                  <div key={stage} style={{display:'flex', justifyContent:'space-between', marginBottom:3}}>
                    <span style={{color:'#94a3b8', fontSize:'0.78rem', textTransform:'capitalize'}}>{stage}</span>
                    <span style={{color: score > 0.3 ? '#c4b5fd' : '#475569', fontSize:'0.78rem', fontWeight:600}}>{Math.round(score * 100)}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {error && <p className={styles.error}>{error}</p>}
      {pipError && (
        <p className={styles.error} style={{ background: 'rgba(239,68,68,0.08)', borderRadius: 8, padding: '8px 12px', border: '1px solid rgba(239,68,68,0.20)' }}>
          ⚠️ {pipError}
        </p>
      )}

      <div className={styles.grid}>
        {/* ═══ LEFT PANEL: Coaching ═══ */}
        <section className={styles.panel}>
          <p className={styles.kicker}>Live guidance</p>
          <h2 className={styles.headline}>{insights.headline}</h2>
          <p className={styles.nextAction}><strong>▶ Next:</strong> {insights.nextBestAction?.action || insights.nextBestAction}</p>

          <div className={`${styles.cardGroup} ${isWideMode ? styles.cardGroupWide : ""}`}>
            <div className={styles.cardColumn}>
              {/* Suggested Responses (4-6) */}
              <div className={styles.card}>
                <p className={styles.cardTitle}>💬 Suggested Responses</p>
                {insights.suggestedResponses.length ? (
                  insights.suggestedResponses.slice(0, 3).map((item, i) => (
                    <p className={styles.item} key={i} style={{borderLeft:'3px solid rgba(139,92,246,0.5)',paddingLeft:12, fontSize:'0.95rem', fontWeight: 500}}>"{item}"</p>
                  ))
                ) : (
                  <p className={styles.empty}>Suggestions will appear as context accumulates.</p>
                )}

                {/* Previous Suggested Responses (inline, below current) */}
                {suggestionHistory.length > 1 && (
                  <div style={{marginTop: 12, borderTop: '1px solid rgba(139,92,246,0.15)', paddingTop: 10}}>
                    <p style={{color:'#94a3b8', fontSize:'0.7rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6}}>Previous Suggestions</p>
                    {suggestionHistory.slice(1, 4).map((entry, i) => (
                      <div key={i} style={{marginBottom:8, paddingBottom:8, borderBottom:'1px solid rgba(255,255,255,0.03)'}}>
                        <div style={{display:'flex', justifyContent:'space-between', marginBottom:3}}>
                          <span style={{color:'#8b5cf6', fontSize:'0.68rem', fontWeight:700}}>{entry.headline?.slice(0,60) || 'Previous context'}</span>
                          <span style={{color:'#64748b', fontSize:'0.62rem'}}>{entry.timestamp?.toLocaleTimeString()}</span>
                        </div>
                        {entry.responses?.slice(0, 2).map((r, j) => (
                          <p key={j} style={{color:'#94a3b8', fontSize:'0.78rem', margin:'3px 0', paddingLeft:10, borderLeft:'2px solid rgba(139,92,246,0.2)', fontStyle:'italic'}}>"{r}"</p>
                        ))}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Competitor Intelligence */}
              {insights.competitorIntelligence?.length > 0 && (
                <div className={styles.card} style={{borderColor:'rgba(248,113,113,0.3)',background:'rgba(248,113,113,0.04)'}}>
                  <p className={styles.cardTitle} style={{color:'#f87171'}}>⚔️ Competitor Intelligence</p>
                  {insights.competitorIntelligence.map((comp, i) => (
                    <div key={i} style={{marginBottom:10,padding:'10px 12px',borderRadius:10,background:'rgba(0,0,0,0.2)',border:'1px solid rgba(248,113,113,0.15)'}}>
                      <div style={{fontWeight:800,color:'#f87171',fontSize:'0.85rem',marginBottom:6}}>🆚 {comp.competitor}</div>
                      {comp.mentionedContext && <p style={{color:'#94a3b8',fontSize:'0.8rem',margin:'0 0 4px 0'}}>📌 {comp.mentionedContext}</p>}
                      <p style={{color:'#34d399',fontSize:'0.82rem',margin:'0 0 4px 0',fontWeight:600}}>✅ Our Edge: {comp.ourAdvantage}</p>
                      {comp.talkTrack && <p style={{color:'#fbbf24',fontSize:'0.82rem',margin:0,fontStyle:'italic',borderLeft:'3px solid #fbbf24',paddingLeft:8}}>🗣️ Say: "{comp.talkTrack}"</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={styles.cardColumn}>
              {/* Strategic Tips with Exact Scripts */}
              <div className={styles.card}>
                <p className={styles.cardTitle}>🎯 Strategic Tips</p>
                {insights.strategicTips.length ? (
                  insights.strategicTips.map((tip, i) => (
                    <div key={i} style={{marginBottom:10,padding:'10px 12px',borderRadius:10,background:'rgba(0,0,0,0.15)',border:'1px solid rgba(139,92,246,0.12)'}}>
                      <p style={{color:'#e2e8f0',fontSize:'0.85rem',margin:'0 0 4px 0',fontWeight:600}}>{typeof tip === 'string' ? tip : tip.tip}</p>
                      {tip.exactScript && (
                        <p style={{color:'#fbbf24',fontSize:'0.82rem',margin:'0 0 4px 0',fontStyle:'italic',borderLeft:'3px solid #fbbf24',paddingLeft:8}}>💬 Say: "{tip.exactScript}"</p>
                      )}
                      {tip.reasoning && (
                        <p style={{color:'#94a3b8',fontSize:'0.75rem',margin:0}}>💡 {tip.reasoning}</p>
                      )}
                    </div>
                  ))
                ) : (
                  <p className={styles.empty}>No tactical tips yet.</p>
                )}
              </div>

              {/* Alerts */}
              <div className={styles.card}>
                <p className={styles.cardTitle}>🚨 Alerts & Drift Detection</p>
                {insights.conversationDrift?.detected && (() => {
                  const drift = insights.conversationDrift;
                  const driftLabels = {
                    feature_drift: 'Feature Drift',
                    discovery_starvation: 'Discovery Starvation',
                    objection_avoidance: 'Objection Avoidance',
                    premature_closing: 'Premature Closing',
                    over_talking: 'Over-Talking',
                    technical_deep_dive: 'Technical Deep Dive',
                  };
                  const severityColor = drift.severity === 'high' ? '#ef4444' : drift.severity === 'medium' ? '#f59e0b' : '#60a5fa';
                  const severityBg = drift.severity === 'high' ? 'rgba(239,68,68,0.1)' : drift.severity === 'medium' ? 'rgba(245,158,11,0.1)' : 'rgba(59,130,246,0.1)';
                  return (
                    <div style={{marginBottom:8,padding:'10px 12px',borderRadius:8,background:severityBg,border:`1px solid ${severityColor}40`,fontSize:'0.8rem'}}>
                      <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4}}>
                        <strong style={{textTransform:'uppercase', fontSize:'0.65rem', color: severityColor}}>⚠️ {driftLabels[drift.driftType] || 'Drift Detected'}</strong>
                        <span style={{padding:'1px 6px', borderRadius:4, background: severityBg, border:`1px solid ${severityColor}50`, color: severityColor, fontSize:'0.6rem', fontWeight:700, textTransform:'uppercase'}}>{drift.severity}</span>
                      </div>
                      {drift.durationMinutes > 0 && <div style={{color:'#94a3b8', fontSize:'0.75rem', marginBottom:4}}>Duration: {drift.durationMinutes} min</div>}
                      <div style={{color:'#e2e8f0', marginBottom:6}}>{drift.description}</div>
                      {drift.recommendation && <div style={{color:'#34d399', fontSize:'0.78rem', borderLeft:'3px solid #34d399', paddingLeft:8, fontStyle:'italic'}}>✅ {drift.recommendation}</div>}
                    </div>
                  );
                })()}
                {insights.alerts.length ? (
                  insights.alerts.map((item, i) => {
                    const levelColors = {
                       critical: { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.3)', color: '#ef4444' },
                       important: { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.3)', color: '#f59e0b' },
                       informational: { bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.3)', color: '#60a5fa' }
                    };
                    const styling = levelColors[item.level] || levelColors.informational;
                    return (
                      <div key={i} style={{marginBottom:8,padding:'8px 10px',borderRadius:8,background:styling.bg,border:`1px solid ${styling.border}`,color:styling.color,fontSize:'0.8rem'}}>
                        <strong style={{textTransform:'uppercase',fontSize:'0.65rem',display:'block',marginBottom:2}}>{item.level}</strong>
                        {item.message}
                      </div>
                    );
                  })
                ) : (
                  !insights.conversationDrift?.detected && <p className={styles.empty}>No active alerts.</p>
                )}
              </div>
              {showFinalSummary && (
                <div style={{display:'flex', gap:10, marginTop:12, justifyContent: 'flex-start'}}>
                  <button onClick={exportToMarkdown} style={{padding:'6px 14px',borderRadius:8,border:'1px solid rgba(139,92,246,0.3)',background:'rgba(139,92,246,0.1)',color:'#c4b5fd',fontSize:'0.8rem',fontWeight:700,cursor:'pointer'}}>📥 Export Report (.MD)</button>
                  <button onClick={exportToPDF} style={{padding:'6px 14px',borderRadius:8,border:'1px solid rgba(236,72,153,0.3)',background:'rgba(236,72,153,0.1)',color:'#f9a8d4',fontSize:'0.8rem',fontWeight:700,cursor:'pointer'}}>📄 Export PDF</button>
                </div>
              )}
            </div>
          </div>

        </section>

        {/* ═══ RIGHT PANEL: Signals + Transcript + Summaries ═══ */}
        <section className={styles.panel}>
          <p className={styles.kicker}>Intent and risk</p>
          <div className={styles.signalGrid}>
            <div className={styles.signalCard}>
              <p className={styles.cardTitle}>Intent signals</p>
              {insights.intentSignals.length ? (
                insights.intentSignals.map((signal, i) => (
                  <div className={styles.signal} key={i} style={{flexDirection:'column', alignItems:'flex-start', gap:4}}>
                    <div style={{display:'flex',justifyContent:'space-between',width:'100%'}}>
                       <span style={{fontWeight:600}}>{signal.label}</span>
                       <span style={{color:'#10b981'}}>{signal.confidence}%</span>
                    </div>
                    {signal.evidence && <p style={{fontSize:'0.7rem',color:'#94a3b8',margin:0,fontStyle:'italic'}}>"{signal.evidence}"</p>}
                  </div>
                ))
              ) : (
                <p className={styles.empty}>No intent signal yet.</p>
              )}
            </div>
            <div className={styles.signalCard}>
              <p className={styles.cardTitle}>Objection Timeline</p>
              {insights.objectionTimeline?.length ? (
                insights.objectionTimeline.map((obj, i) => (
                  <div key={i} style={{marginBottom:8,padding:'6px 10px',borderRadius:8,background:'rgba(239,68,68,0.08)',border:'1px solid rgba(239,68,68,0.15)'}}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:2}}>
                      <span style={{fontSize:'0.7rem',color:'#fca5a5',fontWeight:700}}>{obj.time}</span>
                      <span style={{fontSize:'0.65rem',padding:'2px 6px',borderRadius:4,background:obj.status==='resolved'?'rgba(52,211,153,0.2)':'rgba(248,113,113,0.2)',color:obj.status==='resolved'?'#34d399':'#f87171',textTransform:'uppercase'}}>{obj.status}</span>
                    </div>
                    <p style={{margin:0,fontSize:'0.8rem',color:'#cbd5e1'}}>{obj.objection}</p>
                  </div>
                ))
              ) : (
                <p className={styles.empty}>No objections recorded.</p>
              )}
            </div>
          </div>

          <div className={styles.metrics}>
            <div className={styles.metricBox}><span className={styles.metricLabel}>{spk.salesRepName} talk</span><strong>{insights.conversationAnalysis.talkRatioRep ?? runningStats.estimatedTalkRatioRep}%</strong></div>
            <div className={styles.metricBox}><span className={styles.metricLabel}>{spk.clientName} talk</span><strong>{insights.conversationAnalysis.talkRatioCustomer ?? runningStats.estimatedTalkRatioCustomer}%</strong></div>
            <div className={styles.metricBox}><span className={styles.metricLabel}>BANT Qual</span><strong style={{color: calculatedMetrics.bantScore >= 75 ? "#34d399" : calculatedMetrics.bantScore >= 50 ? "#fbbf24" : "#f43f5e"}}>{calculatedMetrics.bantScore}%</strong></div>
            <div className={styles.metricBox}><span className={styles.metricLabel}>Sentiment</span><strong style={{color: calculatedMetrics.sentiment === "Positive" ? "#34d399" : calculatedMetrics.sentiment === "Hesitant" ? "#f43f5e" : "#cbd5e1"}}>{calculatedMetrics.sentiment}</strong></div>
            <div className={styles.metricBox}><span className={styles.metricLabel}>Interruptions</span><strong>{insights.conversationAnalysis.interruptions ?? (runningStats.interruptionMarkers > 4 ? "high" : runningStats.interruptionMarkers > 2 ? "moderate" : "low")}</strong></div>
            <div className={styles.metricBox}><span className={styles.metricLabel}>Pace</span><strong>{insights.conversationAnalysis.pace ?? (runningStats.wordsPerMinute > 170 ? "fast" : runningStats.wordsPerMinute < 100 ? "slow" : "balanced")}</strong></div>
            <div className={styles.metricBox}><span className={styles.metricLabel}>Words/min</span><strong>{runningStats.wordsPerMinute}</strong></div>
            <div className={styles.metricBox}><span className={styles.metricLabel}>Segments</span><strong>{runningStats.segmentCount}</strong></div>
          </div>

          {/* Transcript */}
          <div className={styles.transcriptWrap}>
            <p className={styles.cardTitle}>LLM transcript context ({ROLLING_WINDOW_SECONDS}s)</p>
            <p className={styles.transcriptNow}>{insights.transcriptWindow || recentContext || "No speech captured yet."}</p>
            <div className={styles.transcriptList}>
              {segments.slice(-8).reverse().map((segment, idx, arr) => {
                // Alternate speaker names based on segment position
                const segIdx = segments.length - arr.length + (arr.length - 1 - idx);
                const isRep = segIdx % 2 === 0;
                const speakerName = isRep ? (spk.salesRepName || "Sales Rep") : (spk.clientName || "Client");
                const speakerColor = isRep ? "#c4b5fd" : "#f9a8d4";
                return (
                  <div className={styles.segment} key={segment.id} style={{gridTemplateColumns:'88px auto 1fr'}}>
                    <span className={styles.segmentTime}>{new Date(segment.ts).toLocaleTimeString()}</span>
                    <span style={{color: speakerColor, fontWeight:700, fontSize:'0.75rem', minWidth:70}}>{speakerName}</span>
                    <span>{segment.text}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ═══ Chunk Summaries (Conversation Memory) ═══ */}
          {chunkSummaries.length > 0 && (
            <div style={{marginTop:16}}>
              <p className={styles.cardTitle} style={{color:'#34d399'}}>📝 Conversation Summaries ({chunkSummaries.length})</p>
              <div style={{maxHeight:250,overflowY:'auto',display:'flex',flexDirection:'column',gap:6}}>
                {[...chunkSummaries].reverse().map((chunk, i) => (
                  <div key={i} style={{padding:'10px 12px',borderRadius:10,background:'rgba(52,211,153,0.06)',border:'1px solid rgba(52,211,153,0.15)',borderLeft:'3px solid rgba(52,211,153,0.5)'}}>
                    <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                      <span style={{color:'#34d399',fontSize:'0.7rem',fontWeight:800,fontFamily:'var(--font-head)',letterSpacing:'0.05em'}}>{chunk.time_start} → {chunk.time_end}</span>
                      {chunk.competitors_mentioned?.length > 0 && (
                        <span style={{fontSize:'0.65rem',color:'#f87171',background:'rgba(248,113,113,0.1)',padding:'1px 6px',borderRadius:8}}>⚔️ {chunk.competitors_mentioned.join(", ")}</span>
                      )}
                    </div>
                    <p style={{color:'#cbd5e1',fontSize:'0.8rem',margin:0,lineHeight:1.5}}>{chunk.summary_text}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══ Final Summary (after stop) ═══ */}
          {showFinalSummary && finalSummary && (
            <div style={{marginTop:16,padding:'16px 18px',borderRadius:14,background:'rgba(59,130,246,0.08)',border:'1px solid rgba(59,130,246,0.25)',borderLeft:'4px solid #3b82f6'}}>
              <p className={styles.cardTitle} style={{color:'#60a5fa',fontSize:'0.8rem'}}>📋 Complete Call Summary</p>
              <pre style={{color:'#e2e8f0',fontSize:'0.82rem',lineHeight:1.7,margin:0,whiteSpace:'pre-wrap',fontFamily:'inherit'}}>{finalSummary}</pre>
               <div style={{display:'flex', gap:10, marginTop:10}}>
                 <button onClick={() => { navigator.clipboard.writeText(finalSummary); }} style={{padding:'6px 14px',borderRadius:8,border:'1px solid rgba(96,165,250,0.3)',background:'rgba(96,165,250,0.1)',color:'#60a5fa',fontSize:'0.8rem',fontWeight:700,cursor:'pointer'}}>📋 Copy Summary</button>
               </div>
            </div>
          )}
        </section>
      </div>

      {/* ── DOCUMENT PICTURE-IN-PICTURE PORTAL ──
           Renders into the always-on-top PiP window floating above Teams/GMeet.
           portalTarget is the <div> inside the PiP window's document. */}
      {overlayOpen && portalTarget && createPortal(
        <LiveAssistOverlay
          insights={insights}
          isCapturing={isCapturing}
          status={status}
          analysisAt={analysisAt}
          segments={segments}
          runningStats={runningStats}
          chunkSummaries={chunkSummaries}
          onClose={closePiP}
        />,
        portalTarget
      )}
    </div>
  );
}
