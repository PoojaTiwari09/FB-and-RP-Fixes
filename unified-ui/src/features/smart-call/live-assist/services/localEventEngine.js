/**
 * LocalEventEngine — Fast, zero-API-cost signal detection layer.
 * Runs client-side every 3–5 seconds on the rolling transcript buffer.
 * Determines WHETHER to call the LLM and WHAT type of analysis to request.
 *
 * Architecture:
 *   Audio → Whisper → Transcript Buffer → [THIS ENGINE] → LLM Gate → AI Layer
 */

// ── Semantic Keyword Buckets ──────────────────────────────────────────
const SEMANTIC_BUCKETS = {
  competitor: {
    weight: 9,
    phrases: ['salesforce', 'hubspot', 'zoho', 'pipedrive', 'freshsales', 'dynamics', 'monday', 'close.io', 'outreach', 'gong', 'chorus', 'clari', 'competitor', 'alternative', 'other solution', 'current vendor', 'existing tool', 'compared to', 'vs ', 'versus', 'other company', 'using another', 'looking at', 'evaluating', 'other service', 'their platform', 'switched from', 'migrating from', 'currently use']
  },
  pricing: {
    weight: 7,
    phrases: ['price', 'pricing', 'cost', 'budget', 'expensive', 'affordable', 'discount', 'deal', 'package', 'tier', 'plan', 'subscription', 'roi', 'investment', 'spend', 'money', 'dollar', 'payment', 'license', 'per seat', 'per user', 'annual', 'monthly', 'hard to justify', 'tight this quarter', 'cost sensitive', 'budget issue', 'total cost of ownership', 'cost effective']
  },
  objection: {
    weight: 8,
    phrases: ['concern', 'worried', 'hesitant', 'not sure', 'risky', 'complicated', 'too complex', 'difficult', 'challenge', 'problem with', 'issue with', 'don\'t think', 'can\'t see', 'not convinced', 'skeptical', 'pushback', 'objection', 'dealbreaker', 'showstopper', 'blocker', 'not the right time', 'need to discuss internally', 'too early', 'not a priority', 'not ready yet']
  },
  buying: {
    weight: 10,
    phrases: ['when can we start', 'implementation', 'onboarding', 'contract', 'timeline', 'next steps', 'ready to', 'move forward', 'sign', 'go ahead', 'let\'s do it', 'sounds good', 'looks great', 'excited', 'interested', 'demo', 'trial', 'pilot', 'proof of concept', 'proposal', 'quote', 'procurement', 'how quickly can', 'what\'s the process', 'who do i contact', 'send me the agreement', 'where do we sign']
  },
  negativeBuying: {
    weight: -6,
    phrases: ['just browsing', 'not ready', 'maybe later', 'just curious', 'just looking', 'no rush', 'no timeline', 'not interested', 'pass on this', 'not for us']
  },
  decisionMaker: {
    weight: 6,
    phrases: ['approval', 'approve', 'manager', 'director', 'vp', 'cfo', 'ceo', 'cto', 'board', 'committee', 'stakeholder', 'decision maker', 'sign off', 'legal', 'procurement', 'finance team', 'leadership', 'executive', 'boss', 'supervisor', 'head of']
  },
  urgency: {
    weight: 8,
    phrases: ['asap', 'urgent', 'deadline', 'end of quarter', 'this month', 'this week', 'right away', 'immediately', 'time sensitive', 'before', 'by friday', 'running out', 'expires', 'limited time', 'before the end of', 'need it by', 'critical timeline', 'can\'t wait', 'time crunch']
  },
  commitment: {
    weight: 5,
    phrases: ['i\'ll send', 'we\'ll send', 'follow up', 'next meeting', 'schedule', 'proposal', 'send over', 'share with', 'get back to', 'circle back', 'touch base', 'reconnect', 'next week', 'tomorrow', 'monday']
  }
};

// ── Signal Detection ──────────────────────────────────────────────

function countMatches(text, bucketKey) {
  const bucket = SEMANTIC_BUCKETS[bucketKey];
  const lower = text.toLowerCase();
  let count = 0;
  let score = 0;
  const matched = [];
  for (const kw of bucket.phrases) {
    const regex = new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    const hits = lower.match(regex);
    if (hits) {
      count += hits.length;
      score += (hits.length * bucket.weight);
      matched.push(kw);
    }
  }
  return { count, score, matched };
}

/**
 * Scan transcript text and return a signal snapshot.
 * Applies 2x recency weighting to signals in the last ~10 seconds of text (approx last 200 chars).
 */
export function detectLocalSignals(transcriptText) {
  if (!transcriptText || transcriptText.trim().length < 10) {
    return {
      competitor: { count: 0, score: 0, matched: [] },
      pricing: { count: 0, score: 0, matched: [] },
      objection: { count: 0, score: 0, matched: [] },
      buying: { count: 0, score: 0, matched: [] },
      negativeBuying: { count: 0, score: 0, matched: [] },
      decisionMaker: { count: 0, score: 0, matched: [] },
      urgency: { count: 0, score: 0, matched: [] },
      commitment: { count: 0, score: 0, matched: [] },
      totalSignalScore: 0,
      timestamp: Date.now()
    };
  }

  const competitor = countMatches(transcriptText, 'competitor');
  const pricing = countMatches(transcriptText, 'pricing');
  const objection = countMatches(transcriptText, 'objection');
  const buying = countMatches(transcriptText, 'buying');
  const negativeBuying = countMatches(transcriptText, 'negativeBuying');
  const decisionMaker = countMatches(transcriptText, 'decisionMaker');
  const urgency = countMatches(transcriptText, 'urgency');
  const commitment = countMatches(transcriptText, 'commitment');

  // Apply recency weighting: signals in last 200 chars get 2x score boost
  const recentWindow = transcriptText.slice(-200);
  if (recentWindow.length > 20) {
    const recentBuying = countMatches(recentWindow, 'buying');
    const recentObjection = countMatches(recentWindow, 'objection');
    const recentCompetitor = countMatches(recentWindow, 'competitor');
    buying.score += recentBuying.score; // effectively 2x for recent
    objection.score += recentObjection.score;
    competitor.score += recentCompetitor.score;
  }

  // Net buying score = buying - negative buying signals
  const netBuyingScore = Math.max(0, buying.score - negativeBuying.score);

  const totalSignalScore = competitor.score + pricing.score + objection.score +
    netBuyingScore + decisionMaker.score + urgency.score + commitment.score;

  return {
    competitor,
    pricing,
    objection,
    buying: { ...buying, score: netBuyingScore },
    negativeBuying,
    decisionMaker,
    urgency,
    commitment,
    totalSignalScore,
    timestamp: Date.now()
  };
}

// ── Signal Delta Computation ──────────────────────────────────────

/**
 * Compare two signal snapshots and determine the delta.
 * Returns { delta, reasons[], hasNewCompetitor, hasCriticalEvent }
 */
export function computeSignalDelta(current, previous) {
  if (!previous) {
    return {
      deltaScore: current.totalSignalScore,
      reasons: ['initial_scan'],
      hasNewCompetitor: current.competitor.count > 0,
      hasCriticalEvent: current.objection.count > 0 || current.competitor.count > 0
    };
  }

  const reasons = [];
  let deltaScore = 0;

  // Semantic Weighted Delta Calculation
  const newCompetitorScore = current.competitor.score - previous.competitor.score;
  if (newCompetitorScore > 0) { deltaScore += newCompetitorScore; reasons.push(`competitor_mentioned:${current.competitor.matched.slice(-1)[0]}`); }

  const newObjectionScore = current.objection.score - previous.objection.score;
  if (newObjectionScore > 0) { deltaScore += newObjectionScore; reasons.push('new_objection'); }

  const newBuyingScore = current.buying.score - previous.buying.score;
  if (newBuyingScore > 0) { deltaScore += newBuyingScore; reasons.push('buying_signal'); }

  const newPricingScore = current.pricing.score - previous.pricing.score;
  if (newPricingScore > 0) { deltaScore += newPricingScore; reasons.push('pricing_discussion'); }

  const newDMScore = current.decisionMaker.score - previous.decisionMaker.score;
  if (newDMScore > 0) { deltaScore += newDMScore; reasons.push('decision_maker_reference'); }

  const newUrgencyScore = current.urgency.score - previous.urgency.score;
  if (newUrgencyScore > 0) { deltaScore += newUrgencyScore; reasons.push('urgency_detected'); }

  const newCommitmentScore = current.commitment.score - previous.commitment.score;
  if (newCommitmentScore > 0) { deltaScore += newCommitmentScore; reasons.push('commitment_made'); }

  return {
    deltaScore,
    reasons,
    hasNewCompetitor: newCompetitorScore > 0,
    hasCriticalEvent: newCompetitorScore > 0 || newObjectionScore > 0
  };
}

// ── Advanced Turn Transition Detection ──────────────────────────────

let _lastTurnTriggerTs = 0;
const MINIMUM_TURN_GAP_MS = 2000; // Reduced for fast back-and-forth detection

// Trailing phrases that strongly indicate the speaker is done and awaiting response
const TURN_HANDOFF_PHRASES = [
  'what do you think', 'does that make sense', 'any questions',
  'how does that sound', 'would that work', 'what are your thoughts',
  'does that help', 'do you agree', 'shall we proceed',
  'what would you prefer', 'is that clear', 'fair enough',
  'let me know', 'over to you', 'your turn'
];

/**
 * Weighted turnTransitionConfidence scoring.
 * Uses transcript stabilization, punctuation, word-count delta, and trailing phrase detection.
 */
export function detectTurnTransition(currentTranscript, previousTranscript, lastTranscriptChangeTs = 0) {
  if (!currentTranscript || currentTranscript === previousTranscript) {
    return { confidence: 0, isTurnTransition: false };
  }

  const now = Date.now();
  // Enforce minimum gap between turn triggers
  if (now - _lastTurnTriggerTs < MINIMUM_TURN_GAP_MS) {
    return { confidence: 0, isTurnTransition: false };
  }

  const trimmed = currentTranscript.trim();
  const newContent = previousTranscript ? currentTranscript.replace(previousTranscript, '').trim() : trimmed;
  const newWordCount = newContent.split(/\s+/).filter(Boolean).length;

  // DIRECT OVERRIDE: If the client ends their sentence with a question mark, they are waiting for a response!
  const endsWithQuestion = /[?]$/.test(trimmed);
  if (endsWithQuestion) {
    _lastTurnTriggerTs = now;
    return { confidence: 0.98, isTurnTransition: true };
  }

  // TRAILING PHRASE OVERRIDE: Detect turn-handoff phrases in the last ~80 chars
  const tail = trimmed.slice(-80).toLowerCase();
  const hasHandoffPhrase = TURN_HANDOFF_PHRASES.some(p => tail.includes(p));
  if (hasHandoffPhrase) {
    _lastTurnTriggerTs = now;
    return { confidence: 0.92, isTurnTransition: true };
  }

  // 1. Punctuation confidence (sentence completion)
  const endsWithPunctuation = /[.!?]$/.test(trimmed);
  const sentenceCompletionScore = endsWithPunctuation ? 1.0 : 0.2;

  // 2. Transcript stabilization (if very few new words, speaker may have stopped)
  const transcriptStableScore = newWordCount < 4 ? 0.8 : newWordCount < 8 ? 0.5 : 0.2;

  // 3. Silence duration estimate (time since last transcript change)
  const silenceDuration = lastTranscriptChangeTs ? (now - lastTranscriptChangeTs) : 0;
  const silenceScore = silenceDuration > 4000 ? 1.0 : silenceDuration > 2000 ? 0.6 : 0.1;

  // 4. Speech rate drop (fewer new words = speech slowing)
  const speechRateDropScore = newWordCount <= 2 ? 0.9 : newWordCount <= 5 ? 0.5 : 0.15;

  // 5. Word-count threshold: if >15 new words, speaker said a full thought → boost
  const fullThoughtBonus = newWordCount > 15 ? 0.15 : 0;

  // Weighted formula
  const confidence = (
    silenceScore * 0.22 +
    sentenceCompletionScore * 0.28 +
    transcriptStableScore * 0.13 +
    speechRateDropScore * 0.10 +
    fullThoughtBonus +
    (endsWithPunctuation && silenceDuration > 2000 ? 0.20 : 0.0) // speaker switch proxy
  );

  const isTurnTransition = confidence > 0.58;
  if (isTurnTransition) _lastTurnTriggerTs = now;

  return { confidence: Math.round(confidence * 100) / 100, isTurnTransition };
}

// ── Structured Conversation Memory ──────────────────────────────────

/**
 * Persistent structured memory that accumulates across the call.
 * Created once per call, updated each local engine tick.
 */
export class ConversationMemory {
  constructor() {
    this.objections = [];
    this.unresolvedObjections = [];
    this.commitments = [];
    this.stakeholders = [];
    this.competitors = [];
    this.momentumHistory = [];
    this.stageHistory = [];
    this.buyingSignals = [];
    this.risks = [];
    this.nextSteps = [];
    this._repQuestionCount = 0;
    this._repInterruptionCount = 0;
  }

  addObjection(text, matched, timestamp = Date.now()) {
    const existing = this.objections.find(o => o.text === text);
    if (existing) {
      existing.mentionCount++;
      existing.lastMentionedAt = timestamp;
      if (existing.mentionCount > 2) existing.severity = 'high';
      existing.status = 'recurring';
      return;
    }
    const obj = { text, matched, firstDetectedAt: timestamp, lastMentionedAt: timestamp, severity: 'medium', status: 'raised', mentionCount: 1, confidence: 'medium' };
    this.objections.push(obj);
    this.unresolvedObjections.push(obj);
  }

  addCompetitor(name, timestamp = Date.now()) {
    if (!this.competitors.find(c => c.name === name)) {
      this.competitors.push({ name, mentionedAt: timestamp, objectionsTriggered: [], confidence: 'medium' });
    }
  }

  addBuyingSignal(text, timestamp = Date.now()) {
    this.buyingSignals.push({ text, timestamp, confidence: 'medium' });
  }

  addCommitment(text, timestamp = Date.now()) {
    this.commitments.push({ commitment: text, timestamp, status: 'pending', confidence: 'medium' });
  }

  addMomentum(score, drivers = []) {
    this.momentumHistory.push({ score, timestamp: Date.now(), drivers });
    if (this.momentumHistory.length > 20) this.momentumHistory.shift();
  }

  getMomentumTrend() {
    const h = this.momentumHistory;
    if (h.length < 2) return { trendDirection: 'stable', trendStrength: 0 };
    const recent = h.slice(-3).map(m => m.score);
    const prev = h.slice(-6, -3).map(m => m.score);
    const avgRecent = recent.reduce((a, b) => a + b, 0) / (recent.length || 1);
    const avgPrev = prev.length ? prev.reduce((a, b) => a + b, 0) / prev.length : avgRecent;
    const ratio = avgPrev > 0 ? avgRecent / avgPrev : 1;
    const trendDirection = ratio > 1.05 ? 'rising' : ratio < 0.95 ? 'declining' : 'stable';
    const trendStrength = Math.round(Math.abs(ratio - 1) * 100);
    return { trendDirection, trendStrength, avgRecent: Math.round(avgRecent), avgPrev: Math.round(avgPrev) };
  }

  getUnresolvedAlerts() {
    const now = Date.now();
    return this.unresolvedObjections
      .filter(o => o.status !== 'resolved' && (now - o.firstDetectedAt) > 2 * 60 * 1000)
      .map(o => ({ message: `⚠ "${o.matched || o.text}" unresolved for ${Math.round((now - o.firstDetectedAt) / 60000)} minutes.`, level: 'important', objection: o }));
  }

  getRepCoachingDeficits(elapsedMinutes) {
    const deficits = [];
    if (elapsedMinutes > 3 && this._repQuestionCount < 2) {
      deficits.push({ message: `⚠ Rep asked only ${this._repQuestionCount} qualification question(s) in ${Math.round(elapsedMinutes)} mins.`, level: 'important' });
    }
    if (this._repInterruptionCount > 4) {
      deficits.push({ message: `⚠ Rep interrupted client ${this._repInterruptionCount} times.`, level: 'informational' });
    }
    return deficits;
  }

  toPayload() {
    return {
      objections: this.objections.slice(-5),
      unresolvedObjections: this.unresolvedObjections.filter(o => o.status !== 'resolved').slice(-3),
      competitors: this.competitors,
      commitments: this.commitments.slice(-5),
      momentumTrend: this.getMomentumTrend(),
      buyingSignals: this.buyingSignals.slice(-5)
    };
  }
}

// ── LLM Trigger Decision ──────────────────────────────────────────

/**
 * The gate: should we call the LLM right now?
 *
 * @param {object} signalDelta - Output of computeSignalDelta
 * @param {object} cooldowns - Map of { [type]: lastCalledTimestamp }
 * @param {number} lastLLMCall - Timestamp of the most recent LLM call
 * @param {string} currentTranscript - Current rolling transcript
 * @param {string} lastAnalyzedTranscript - Previously analyzed transcript
 * @param {boolean} turnTransition - True if client likely finished speaking
 * @returns {{ trigger: boolean, reason: string, requestType: string, isTurn: boolean }}
 */
export function shouldTriggerLLM(signalDelta, cooldowns, lastLLMCall, currentTranscript, lastAnalyzedTranscript, turnTransition = false) {
  const now = Date.now();
  const timeSinceLastLLM = now - (lastLLMCall || 0);

  // ── TRIGGER 1: INSTANT SIGNAL TRIGGERS (bypass cooldown) ──
  if (signalDelta.hasNewCompetitor && timeSinceLastLLM > 5000) {
    return { trigger: true, reason: 'competitor_detected', requestType: 'full', isTurn: false };
  }

  if (signalDelta.hasCriticalEvent && timeSinceLastLLM > 8000) {
    return { trigger: true, reason: 'critical_event', requestType: 'full', isTurn: false };
  }

  // ── TRIGGER 2: TURN TRANSITION (client finishing a thought → suggested responses) ──
  if (turnTransition && timeSinceLastLLM > 2500) {
    return { trigger: true, reason: 'turn_transition_completed', requestType: 'tactical_only', isTurn: true };
  }

  // ── TRIGGER 3: WEIGHTED SIGNAL DELTA ──
  if (signalDelta.deltaScore >= 8 && timeSinceLastLLM > 8000) {
    return { trigger: true, reason: 'signal_delta_spike', requestType: 'full', isTurn: false };
  }

  // ── BASELINE REFRESH: at least every ~12s when transcript is changing ──
  if (timeSinceLastLLM > 12000 && currentTranscript !== lastAnalyzedTranscript) {
    return { trigger: true, reason: 'baseline_refresh', requestType: 'tactical_only', isTurn: false };
  }

  // ── NO TRIGGER — preserve anti-jitter UI ──
  return { trigger: false, reason: 'no_change', requestType: 'none', isTurn: false };
}

// ── Suggestion Deduplication ──────────────────────────────────────

/**
 * Simple string similarity (Jaccard on word sets).
 */
function jaccardSimilarity(a, b) {
  const setA = new Set(a.toLowerCase().split(/\s+/));
  const setB = new Set(b.toLowerCase().split(/\s+/));
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  return union.size > 0 ? intersection.size / union.size : 0;
}

/**
 * Filter out suggestions that are >55% similar to any recent suggestion.
 * @param {string[]} newSuggestions - Incoming suggestions from LLM
 * @param {string[][]} recentHistory - Array of previous suggestion arrays (last 5 sets)
 * @returns {string[]} Deduplicated suggestions
 */
export function deduplicateSuggestions(newSuggestions, recentHistory) {
  if (!newSuggestions?.length) return [];
  if (!recentHistory?.length) return newSuggestions;

  const flatHistory = recentHistory.flat();
  return newSuggestions.filter(suggestion => {
    return !flatHistory.some(prev => jaccardSimilarity(suggestion, prev) > 0.55);
  });
}

// ── Alert Priority Queue ──────────────────────────────────────────

const ALERT_PRIORITY = { critical: 3, important: 2, informational: 1 };
const MAX_ACTIVE_ALERTS = 3;
const ALERT_DEDUP_WINDOW_MS = 120000; // 2 minutes

/**
 * Process incoming alerts: prioritize, deduplicate, and cap.
 * @param {object[]} newAlerts - Incoming alerts from LLM
 * @param {object[]} activeAlerts - Currently displayed alerts with timestamps
 * @returns {object[]} Processed alert list
 */
export function processAlerts(newAlerts, activeAlerts = []) {
  if (!newAlerts?.length) return activeAlerts;

  const now = Date.now();

  // Remove expired informational alerts (>30s old)
  const filtered = activeAlerts.filter(a => {
    if (a.level === 'informational' && (now - a._ts) > 30000) return false;
    return true;
  });

  // Deduplicate: don't show same message within 2 minutes
  const recentMessages = new Set(filtered.map(a => a.message.toLowerCase()));
  const dedupedNew = newAlerts.filter(a => {
    const msgLower = a.message.toLowerCase();
    if (recentMessages.has(msgLower)) return false;
    // Also check similarity
    return !filtered.some(existing =>
      jaccardSimilarity(a.message, existing.message) > 0.6
    );
  });

  // Merge and sort by priority
  const combined = [
    ...filtered,
    ...dedupedNew.map(a => ({ ...a, _ts: now }))
  ].sort((a, b) => (ALERT_PRIORITY[b.level] || 0) - (ALERT_PRIORITY[a.level] || 0));

  // Cap at MAX_ACTIVE_ALERTS
  return combined.slice(0, MAX_ACTIVE_ALERTS);
}

export function estimateCallStage(signals, elapsedSeconds = 0) {
  const { pricing, buying, objection, commitment, decisionMaker, urgency, competitor } = signals;

  // Time bias weights (0-1) for each stage based on elapsed time
  const timeBias = {
    discovery:     elapsedSeconds < 120 ? 0.8 : elapsedSeconds < 300 ? 0.3 : 0.1,
    qualification: elapsedSeconds > 30 && elapsedSeconds < 300 ? 0.6 : 0.2,
    demo:          elapsedSeconds > 60 && elapsedSeconds < 420 ? 0.7 : 0.2,
    objection:     elapsedSeconds > 90 ? 0.5 : 0.15,
    negotiation:   elapsedSeconds > 180 ? 0.6 : 0.1,
    closing:       elapsedSeconds > 240 ? 0.7 : 0.05
  };

  // Semantic signal scores (normalized 0-1 from raw counts)
  const norm = (v, max = 5) => Math.min(v / max, 1);
  const sem = {
    discovery:     norm(decisionMaker.count, 3) * 0.3 + (1 - norm(pricing.count, 4)) * 0.3,
    qualification: norm(decisionMaker.count, 3) * 0.5 + norm(urgency.count, 3) * 0.3,
    demo:          norm(buying.count, 3) * 0.4 + (1 - norm(objection.count, 3)) * 0.3,
    objection:     norm(objection.count, 4) * 0.6 + norm(competitor.count, 3) * 0.2,
    negotiation:   norm(pricing.count, 4) * 0.5 + norm(objection.count, 3) * 0.3,
    closing:       norm(commitment.count, 3) * 0.5 + norm(buying.count, 4) * 0.4
  };

  const stages = ['discovery', 'qualification', 'demo', 'objection', 'negotiation', 'closing'];
  const raw = {};
  for (const s of stages) {
    raw[s] = (sem[s] * 0.6) + (timeBias[s] * 0.4);
  }

  // Normalize to 0-1 range
  const total = Object.values(raw).reduce((a, b) => a + b, 0) || 1;
  const stageBreakdown = {};
  for (const s of stages) stageBreakdown[s] = Math.round((raw[s] / total) * 100) / 100;

  const dominantStage = stages.reduce((a, b) => stageBreakdown[a] >= stageBreakdown[b] ? a : b);
  const confidence = stageBreakdown[dominantStage] >= 0.4 ? 'high' : stageBreakdown[dominantStage] >= 0.25 ? 'medium' : 'low';

  return { dominantStage, confidence, stageBreakdown };
}

// ── Speaker Identity Registry ─────────────────────────────────────────
// Prevents rapid name-flipping during transcript generation.

const SPEAKER_LOCK_THRESHOLD = 0.60; // Lowered for faster name detection

// Regex patterns to extract speaker names from transcript text
const NAME_INTRO_PATTERNS = [
  /\b(?:hi|hello|hey),?\s+(?:i'?m|this is|my name is)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
  /\b(?:i'?m|this is)\s+([A-Z][a-z]+)\s+(?:from|at|with)\s+/gi,
  /\bmy name is\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/gi,
  /\bspeaking with\s+([A-Z][a-z]+)/gi,
  /\bthanks?,?\s+([A-Z][a-z]+)/gi
];

/**
 * Extract potential speaker names from raw transcript text.
 * Returns an array of detected name strings.
 */
export function extractNamesFromTranscript(transcriptText) {
  if (!transcriptText || transcriptText.length < 10) return [];
  const names = [];
  for (const pattern of NAME_INTRO_PATTERNS) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(transcriptText)) !== null) {
      const name = match[1]?.trim();
      if (name && name.length >= 2 && name.length <= 30) {
        // Filter out common false positives
        const lower = name.toLowerCase();
        if (!['sales rep', 'client', 'sir', 'madam', 'everyone', 'all', 'team'].includes(lower)) {
          names.push(name);
        }
      }
    }
  }
  return [...new Set(names)];
}

export class SpeakerIdentityRegistry {
  constructor() {
    this.rep = { lockedName: null, confidence: 0, lockedAt: null, candidates: {} };
    this.client = { lockedName: null, confidence: 0, lockedAt: null, candidates: {} };
  }

  // Feed a new LLM speaker identification result into the registry.
  update(speakerIdPayload) {
    if (!speakerIdPayload) return;
    const { salesRepName, clientName, speakerConfidence = {} } = speakerIdPayload;
    const repConf = speakerConfidence.rep ?? 0.5;
    const clientConf = speakerConfidence.client ?? 0.5;

    this._updateSlot(this.rep, salesRepName, repConf, 'Sales Rep');
    this._updateSlot(this.client, clientName, clientConf, 'Client');
  }

  // Feed names extracted from transcript (local extraction, no LLM needed)
  feedTranscriptNames(names) {
    if (!names?.length) return;
    // First detected name goes to client slot (most common in sales calls)
    for (const name of names) {
      if (!this.client.lockedName) {
        this.client.candidates[name] = (this.client.candidates[name] || 0) + 1;
        if (this.client.candidates[name] >= 2) {
          this.client.lockedName = name;
          this.client.confidence = 0.65;
          this.client.lockedAt = Date.now();
          console.log(`[SpeakerRegistry] Client name locked from transcript: ${name}`);
        }
      }
    }
  }

  _updateSlot(slot, name, confidence, defaultName) {
    // Track candidate names and their occurrence
    if (name && name !== defaultName && name !== 'Sales Rep' && name !== 'Client') {
      slot.candidates[name] = (slot.candidates[name] || 0) + 1;
    }

    // If already locked, only allow high-confidence overrides (>=0.80)
    if (slot.lockedName && confidence < 0.80) return;

    // Lock if threshold exceeded
    if (confidence >= SPEAKER_LOCK_THRESHOLD && name && name !== defaultName) {
      const consistentName = this._getMostFrequentCandidate(slot.candidates);
      if (consistentName && (!slot.lockedName || consistentName === slot.lockedName || slot.candidates[consistentName] >= 2)) {
        slot.lockedName = consistentName;
        slot.confidence = confidence;
        slot.lockedAt = Date.now();
      }
    }
  }

  _getMostFrequentCandidate(candidates) {
    const entries = Object.entries(candidates);
    if (!entries.length) return null;
    return entries.sort((a, b) => b[1] - a[1])[0][0];
  }

  // Get the stable resolved names for use in the UI.
  getResolved() {
    return {
      salesRepName: this.rep.lockedName || 'Sales Rep',
      clientName: this.client.lockedName || 'Client',
      repLocked: !!this.rep.lockedName,
      clientLocked: !!this.client.lockedName,
      repConfidence: this.rep.confidence,
      clientConfidence: this.client.confidence
    };
  }

  reset() {
    this.rep = { lockedName: null, confidence: 0, lockedAt: null, candidates: {} };
    this.client = { lockedName: null, confidence: 0, lockedAt: null, candidates: {} };
  }
}

// ── Strategic Tip Stabilizer ──────────────────────────────────────────
// Prevents tip flickering by staggering replacements.
// Only replaces one tip at a time. Preserves high-confidence tips.

const TIP_SIMILARITY_THRESHOLD = 0.88;
const TIP_MIN_VISIBLE_MS = 6000;

export class StrategicTipStabilizer {
  constructor() {
    this.activeTips = []; // [{ tip, exactScript, reasoning, _shownAt, _confidence }]
  }

  // Returns the 2 stable tips to display.
  getDisplay() {
    return this.activeTips.slice(0, 2);
  }

  // Feed incoming tips from LLM. Returns true if UI should update.
  update(incomingTips) {
    if (!incomingTips?.length) return false;
    const now = Date.now();

    // Normalize incoming tips
    const normalized = incomingTips.map(t => ({
      tip: typeof t === 'string' ? t : (t.tip || ''),
      exactScript: typeof t === 'string' ? '' : (t.exactScript || ''),
      reasoning: typeof t === 'string' ? '' : (t.reasoning || ''),
      _shownAt: now,
      _confidence: 'medium'
    })).filter(t => t.tip.length > 10);

    if (!normalized.length) return false;

    // If no active tips, seed with first 2
    if (this.activeTips.length === 0) {
      this.activeTips = normalized.slice(0, 2);
      return true;
    }

    let changed = false;
    // Try to replace ONE tip at a time (staggered)
    const replaceIndex = this._findReplaceSlot(now);
    if (replaceIndex === -1) return false; // Both tips are still fresh

    // Find the best incoming tip that isn't similar to any active tip
    for (const newTip of normalized) {
      const isSimilar = this.activeTips.some(active =>
        jaccardSimilarity(newTip.tip, active.tip) > TIP_SIMILARITY_THRESHOLD
      );
      if (!isSimilar) {
        this.activeTips[replaceIndex] = newTip;
        changed = true;
        break;
      }
    }

    // If we couldn't find a dissimilar tip, force-replace oldest if it's very old (>45s)
    if (!changed) {
      const oldestIdx = this.activeTips
        .map((t, i) => ({ age: now - t._shownAt, i }))
        .sort((a, b) => b.age - a.age)[0]?.i ?? 0;
      if (now - this.activeTips[oldestIdx]._shownAt > 25000) {
        this.activeTips[oldestIdx] = normalized[0];
        changed = true;
        console.log('[TipStabilizer] Force-replaced stale tip (>25s old)');
      }
    }

    return changed;
  }

  _findReplaceSlot(now) {
    // Find the oldest tip that has been visible for at least MIN_VISIBLE_MS
    let oldestAge = -1, oldestIdx = -1;
    for (let i = 0; i < this.activeTips.length; i++) {
      const age = now - this.activeTips[i]._shownAt;
      if (age >= TIP_MIN_VISIBLE_MS && age > oldestAge) {
        oldestAge = age;
        oldestIdx = i;
      }
    }
    return oldestIdx;
  }

  reset() {
    this.activeTips = [];
  }
}

// ── Proactive Local Alert Engine ──────────────────────────────────────
// Generates alerts from local signals WITHOUT waiting for an LLM call.
// This ensures alerts are always responsive and event-driven.

const ALERT_COOLDOWNS = {}; // { [alertType]: lastFiredTimestamp }
const ALERT_COOLDOWN_MS = {
  pricing_hesitation: 45000,
  competitor_detected: 30000,
  overtalk: 30000,
  decision_maker: 60000,
  momentum_drop: 45000,
  unresolved_objection: 60000,
  buying_signal_missed: 45000,
  commitment_detected: 45000,
  long_silence: 20000,
  rep_qualification_deficit: 60000,
  customer_uncertainty: 45000,
  stakeholder_reference: 60000,
  pricing_focus: 30000,
};

function canFireAlert(type) {
  const now = Date.now();
  const last = ALERT_COOLDOWNS[type] || 0;
  const cooldown = ALERT_COOLDOWN_MS[type] || 60000;
  if (now - last > cooldown) {
    ALERT_COOLDOWNS[type] = now;
    return true;
  }
  return false;
}

export function generateProactiveAlerts(signals, conversationMemory, runningStats, elapsedSeconds) {
  const alerts = [];
  const { pricing, objection, competitor, buying, decisionMaker, commitment } = signals;
  const elapsedMin = elapsedSeconds / 60;

  // 1. Pricing hesitation (lowered: pricing alone is enough with 2+ mentions in recent window)
  if (pricing.count >= 2 && canFireAlert('pricing_focus')) {
    alerts.push({ message: '⚠ Pricing discussion intensifying. Prepare ROI justification and value anchoring.', level: 'important' });
  }
  if (pricing.count >= 2 && objection.count >= 1 && canFireAlert('pricing_hesitation')) {
    alerts.push({ message: '🚨 Customer showing pricing hesitation combined with objection. Shift to long-term value framing immediately.', level: 'critical' });
  }

  // 2. Competitor mentioned
  if (competitor.count >= 1 && canFireAlert('competitor_detected')) {
    const name = competitor.matched.slice(-1)[0] || 'a competitor';
    alerts.push({ message: `⚠ ${name} referenced. Highlight your key differentiation immediately.`, level: 'critical' });
  }

  // 3. Rep overtalking (lowered from 72% to 68%, lowered time from 45s to 30s)
  const repRatio = runningStats?.estimatedTalkRatioRep;
  if (repRatio && repRatio > 68 && elapsedSeconds > 30 && canFireAlert('overtalk')) {
    alerts.push({ message: `⚠ Rep dominating conversation (${repRatio}% talk time). Ask a discovery question to re-engage the client.`, level: 'important' });
  }

  // 4. Decision maker reference
  if (decisionMaker.count >= 1 && canFireAlert('decision_maker')) {
    alerts.push({ message: '⚠ Multi-stakeholder approval process detected. Confirm who has final sign-off authority.', level: 'important' });
  }

  // 5. Unresolved objection from memory (lowered from 5min to 2min)
  const unresolvedAlerts = conversationMemory?.getUnresolvedAlerts?.() || [];
  unresolvedAlerts.forEach(ua => {
    if (canFireAlert('unresolved_objection')) alerts.push(ua);
  });

  // 9. Customer uncertainty / hesitation phrases
  if (objection.count >= 1 && buying.count === 0 && elapsedSeconds > 20 && canFireAlert('customer_uncertainty')) {
    alerts.push({ message: '⚠ Customer expressing uncertainty. Address concerns directly before advancing.', level: 'informational' });
  }

  // 10. Stakeholder / approval reference
  if (decisionMaker.count >= 1 && commitment.count === 0 && canFireAlert('stakeholder_reference')) {
    alerts.push({ message: '⚠ Stakeholder approval referenced. Confirm decision-making authority and timeline.', level: 'important' });
  }

  // 6. Buying signal without follow-through (buying high, commitment low)
  if (buying.count >= 2 && commitment.count === 0 && elapsedSeconds > 120 && canFireAlert('buying_signal_missed')) {
    alerts.push({ message: '🚨 Buying signal detected but no next-step commitment established. Ask for timeline or next meeting.', level: 'critical' });
  }

  // 7. Commitment made — reinforce
  if (commitment.count >= 1 && canFireAlert('commitment_detected')) {
    alerts.push({ message: '✅ Commitment language detected. Confirm the next step explicitly to lock it in.', level: 'informational' });
  }

  // 8. Rep qualification deficit (>4 min, <2 question marks in transcript)
  const coachingAlerts = conversationMemory?.getRepCoachingDeficits?.(elapsedMin) || [];
  coachingAlerts.forEach(ca => {
    if (canFireAlert('rep_qualification_deficit')) alerts.push(ca);
  });

  return alerts;
}

// ── Proactive Competitor Intelligence Inference ───────────────────────
// Triggers competitor card even when no explicit name mentioned.
// Based on behavioral signals: hesitation, comparison, uncertainty.

const COMPARISON_PHRASES = [
  "not sure if", "still evaluating", "looking at options", "other vendors",
  "comparing", "worth it", "is this the right", "how does this compare",
  "what makes you different", "why should we choose", "we have other offers",
  "need to think about it", "let me check with", "not convinced yet",
  "evaluating alternatives", "seems expensive compared", "others charge",
  "do you offer", "what about support", "what's your implementation time"
];

export function shouldTriggerProactiveCompetitor(transcriptText, lastFiredAt = 0, cooldownMs = 45000) {
  const now = Date.now();
  if (now - lastFiredAt < cooldownMs) return { trigger: false };

  const lower = transcriptText.toLowerCase();
  const matchedPhrases = COMPARISON_PHRASES.filter(p => lower.includes(p));

  if (matchedPhrases.length >= 1) {
    const confidence = matchedPhrases.length >= 3 ? 'high' : matchedPhrases.length === 2 ? 'medium' : 'low';
    return {
      trigger: true,
      confidence,
      inferenceType: 'behavioral_comparison',
      matchedPhrases,
      suggestedFocus: matchedPhrases.some(p => p.includes('expensive') || p.includes('charge') || p.includes('worth'))
        ? ['ROI justification', 'total cost of ownership', 'support responsiveness']
        : ['differentiation', 'deployment speed', 'onboarding simplicity', 'value justification']
    };
  }

  return { trigger: false };
}

export function resetAlertCooldowns() {
  for (const key of Object.keys(ALERT_COOLDOWNS)) {
    delete ALERT_COOLDOWNS[key];
  }
}

