/** Build AI Call Reviewer scorecard from transcript utterances + highlights. */

type Utterance = {
  speaker?: string;
  text?: string;
  startMs?: number;
  endMs?: number;
};

type Highlight = {
  label?: string;
  text?: string;
  timestampMs?: number;
  speaker?: string;
};

type TranscriptLike = {
  fullText?: string;
  summary?: string;
  utterances?: Utterance[];
  keyHighlights?: Highlight[];
  nextSteps?: string[];
  talkRatio?: Record<string, { percentage?: number } | number>;
};

export type GeneratedReviewQuestion = {
  questionText: string;
  managerAnswer: 'Yes' | 'Partial' | 'No';
  score: number;
  maxScore: number;
  managerComments: string;
  aiSuggestion: string;
  transcriptTimestamp: string;
};

export type GeneratedReviewSection = {
  sectionName: string;
  sectionScore: number;
  questions: GeneratedReviewQuestion[];
};

export type GeneratedReview = {
  scorecardName: string;
  scorecardVersion: string;
  reviewedBy: { name: string; role: string };
  reviewDate: string;
  overallScore: number;
  status: string;
  sections: GeneratedReviewSection[];
};

function formatTs(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function normalizeText(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ');
}

function fullTranscriptText(transcript: TranscriptLike | null | undefined): string {
  if (!transcript) return '';
  if (transcript.fullText?.trim()) return transcript.fullText;
  return (transcript.utterances ?? []).map((u) => u.text ?? '').join(' ');
}

function repUtterances(utterances: Utterance[]): Utterance[] {
  return utterances.filter((u) => /rep/i.test(String(u.speaker ?? '')));
}

function customerUtterances(utterances: Utterance[]): Utterance[] {
  return utterances.filter((u) => /customer|buyer|prospect/i.test(String(u.speaker ?? '')));
}

function matchesAny(text: string, patterns: RegExp[]): boolean {
  const lower = normalizeText(text);
  return patterns.some((p) => p.test(lower));
}

function findFirstMatch(
  utterances: Utterance[],
  patterns: RegExp[],
): Utterance | null {
  for (const u of utterances) {
    if (matchesAny(u.text ?? '', patterns)) return u;
  }
  return null;
}

function countMatches(utterances: Utterance[], patterns: RegExp[]): number {
  return utterances.filter((u) => matchesAny(u.text ?? '', patterns)).length;
}

function scoreToAnswer(score: number): 'Yes' | 'Partial' | 'No' {
  if (score >= 4) return 'Yes';
  if (score === 3) return 'Partial';
  return 'No';
}

function clampScore(n: number): number {
  return Math.max(1, Math.min(5, Math.round(n)));
}

function sectionScoreFromQuestions(questions: GeneratedReviewQuestion[]): number {
  if (questions.length === 0) return 0;
  const avg = questions.reduce((sum, q) => sum + q.score, 0) / questions.length;
  return Math.round(avg * 20);
}

function buildQuestion(
  questionText: string,
  score: number,
  evidence: Utterance | null,
  comment: string,
  suggestion: string,
): GeneratedReviewQuestion {
  const clamped = clampScore(score);
  return {
    questionText,
    managerAnswer: scoreToAnswer(clamped),
    score: clamped,
    maxScore: 5,
    managerComments: comment,
    aiSuggestion: clamped >= 4 ? '' : suggestion,
    transcriptTimestamp: evidence?.startMs != null ? formatTs(evidence.startMs) : '',
  };
}

function highlightEvidence(
  highlights: Highlight[],
  labelPattern: RegExp,
): { text: string; timestamp: string } | null {
  const hit = highlights.find((h) => labelPattern.test(String(h.label ?? '')));
  if (!hit) return null;
  return {
    text: hit.text ?? '',
    timestamp: hit.timestampMs != null ? formatTs(hit.timestampMs) : '',
  };
}

function scorecardNameForCall(record: { title?: string; callType?: string }): string {
  const title = String(record.title ?? '').toLowerCase();
  if (title.includes('discovery')) return 'Discovery Call Scorecard';
  if (title.includes('demo')) return 'Demo Call Scorecard';
  if (title.includes('negotiation')) return 'Negotiation Scorecard';
  if (title.includes('evaluation')) return 'Enterprise Evaluation Scorecard';
  return 'Enterprise Sales Scorecard';
}

function repTalkPercent(transcript: TranscriptLike): number | null {
  const ratio = transcript.talkRatio;
  if (!ratio) return null;
  const rep = ratio.Rep ?? ratio.rep;
  if (typeof rep === 'number') return rep <= 1 ? rep * 100 : rep;
  if (rep && typeof rep === 'object' && rep.percentage != null) {
    return rep.percentage <= 1 ? rep.percentage * 100 : rep.percentage;
  }
  return null;
}

function buildOpeningSection(
  repLines: Utterance[],
  allLines: Utterance[],
): GeneratedReviewSection {
  const intro = findFirstMatch(repLines.slice(0, 3), [
    /my name is/i,
    /this is .+ from/i,
    /calling from/i,
    /specialize in/i,
  ]);
  const introScore = intro ? 5 : findFirstMatch(repLines, [/hi |hello |good morning/i]) ? 3 : 1;

  const rapport = findFirstMatch(allLines.slice(0, 6), [
    /how are you/i,
    /good morning/i,
    /thanks for (your time|calling)/i,
    /great to hear/i,
  ]);
  const rapportScore = rapport ? 5 : 2;

  const purpose = findFirstMatch(repLines.slice(0, 4), [
    /crm/i,
    /solution/i,
    /evaluating/i,
    /looking for/i,
    /helped (many|numerous) companies/i,
  ]);
  const purposeScore = purpose ? 5 : 2;

  const questions = [
    buildQuestion(
      'Did the rep introduce themselves and company clearly?',
      introScore,
      intro,
      intro
        ? `Rep introduction found: "${truncate(intro.text ?? '', 120)}"`
        : 'No clear introduction detected in the opening exchanges.',
      'Open with your name, company, and reason for the call within the first 30 seconds.',
    ),
    buildQuestion(
      'Did the rep build rapport with the prospect?',
      rapportScore,
      rapport,
      rapport
        ? `Rapport-building language at ${formatTs(rapport.startMs ?? 0)}: "${truncate(rapport.text ?? '', 100)}"`
        : 'Limited rapport-building phrases in the opening.',
      'Use a brief personal greeting and acknowledge the prospect’s situation before pitching.',
    ),
    buildQuestion(
      'Was the purpose of the call established early?',
      purposeScore,
      purpose,
      purpose
        ? `Purpose stated: "${truncate(purpose.text ?? '', 120)}"`
        : 'Call purpose was not clearly established in early rep turns.',
      'State the call objective explicitly — e.g. discovery, evaluation, or next-step planning.',
    ),
  ];

  return { sectionName: 'Opening', sectionScore: sectionScoreFromQuestions(questions), questions };
}

function buildDiscoverySection(
  repLines: Utterance[],
  customerLines: Utterance[],
  fullText: string,
  highlights: Highlight[],
): GeneratedReviewSection {
  const painCustomer = findFirstMatch(customerLines, [
    /slow/i,
    /outdated/i,
    /difficult/i,
    /pain/i,
    /challenge/i,
    /complain/i,
    /not sure/i,
    /higher than/i,
    /tight for our schedule/i,
    /looking at implementing/i,
    /evaluating/i,
    /homegrown/i,
  ]);
  const painRep = findFirstMatch(repLines, [
    /pain point/i,
    /primary pain/i,
    /challenges are you facing/i,
    /what are your/i,
  ]);
  const painEvidence = painCustomer ?? painRep;
  let painScore = 1;
  if (painCustomer && painRep) painScore = 5;
  else if (painCustomer || painRep) painScore = 4;
  else if (matchesAny(fullText, [/need better integration/i, /looking for something/i])) painScore = 3;

  const openQuestions = countMatches(repLines, [
    /\?$/,
    /what (kind|are|is)/i,
    /how (are|do|does|can)/i,
    /can you tell me/i,
    /walk me through/i,
    /can i ask/i,
  ]);
  const openEvidence = findFirstMatch(repLines, [
    /can you tell me/i,
    /what are your primary/i,
    /what (kind|are)/i,
    /walk me through/i,
  ]);
  const openScore = openQuestions >= 4 ? 5 : openQuestions >= 2 ? 4 : openQuestions >= 1 ? 3 : 2;

  const pricingEvidence =
    findFirstMatch(repLines, [
      /\$[\d,]+/i,
      /cost/i,
      /pricing/i,
      /estimate/i,
      /discount/i,
      /promotion/i,
      /quote/i,
      /priced based/i,
    ]) ??
    (highlightEvidence(highlights, /pricing|budget|cost/i)
      ? { text: highlightEvidence(highlights, /pricing|budget|cost/i)!.text, startMs: 0 }
      : null);
  const pricingScore = pricingEvidence ? (matchesAny(fullText, [/discount|promotion/i]) ? 5 : 4) : 2;

  const decisionEvidence = findFirstMatch(repLines, [
    /decision/i,
    /who else/i,
    /stakeholder/i,
    /committee/i,
    /follow-up call/i,
    /schedule a follow/i,
    /demo/i,
    /proposal/i,
  ]);
  const decisionScore = decisionEvidence ? 4 : matchesAny(fullText, [/demo|proposal|calendar invite/i]) ? 3 : 2;

  const questions = [
    buildQuestion(
      'Did the rep uncover pain points?',
      painScore,
      painEvidence,
      painEvidence
        ? `Pain or need discussed: "${truncate(painEvidence.text ?? '', 120)}"`
        : 'No explicit pain points surfaced in the conversation.',
      'Ask open questions about current workflow challenges before presenting features.',
    ),
    buildQuestion(
      'Were open-ended discovery questions used?',
      openScore,
      openEvidence,
      openEvidence
        ? `Discovery question at ${formatTs(openEvidence.startMs ?? 0)}: "${truncate(openEvidence.text ?? '', 100)}"`
        : `Rep asked ${openQuestions} discovery-style question(s); aim for 3+ per call.`,
      'Use SPIN-style open questions — "What challenges…", "How does your team…"',
    ),
    buildQuestion(
      'Was pricing or budget discussed appropriately?',
      pricingScore,
      pricingEvidence as Utterance | null,
      pricingEvidence
        ? `Pricing discussed: "${truncate(String(pricingEvidence.text ?? ''), 120)}"`
        : 'Pricing was not addressed when the prospect raised cost concerns.',
      'When budget comes up, anchor value before price and confirm decision authority.',
    ),
    buildQuestion(
      'Did the rep confirm next steps or decision process?',
      decisionScore,
      decisionEvidence,
      decisionEvidence
        ? `Next-step language: "${truncate(decisionEvidence.text ?? '', 120)}"`
        : 'Decision process and concrete next steps were not fully confirmed.',
      'Close discovery by asking who else is involved and agreeing on a specific next action.',
    ),
  ];

  return { sectionName: 'Discovery', sectionScore: sectionScoreFromQuestions(questions), questions };
}

function buildObjectionSection(
  repLines: Utterance[],
  customerLines: Utterance[],
  highlights: Highlight[],
): GeneratedReviewSection {
  const objectionCustomer = findFirstMatch(customerLines, [
    /not sure/i,
    /higher than/i,
    /tight for/i,
    /concern/i,
    /but what about/i,
    /security/i,
    /compliance/i,
  ]);
  const objectionResponse = objectionCustomer
    ? repLines.find(
        (u) =>
          (u.startMs ?? 0) > (objectionCustomer.startMs ?? 0) &&
          matchesAny(u.text ?? '', [
            /support/i,
            /discount/i,
            /flexibility/i,
            /work with you/i,
            /gdpr|hipaa|pci/i,
            /security audit/i,
            /comprehensive/i,
          ]),
      )
    : null;
  let objectionScore = 2;
  if (objectionCustomer && objectionResponse) objectionScore = 5;
  else if (objectionResponse || highlightEvidence(highlights, /objection/i)) objectionScore = 4;

  const diffEvidence = findFirstMatch(repLines, [
    /real.?time data analytics/i,
    /ai driven/i,
    /lead scoring/i,
    /integration/i,
    /cloud based/i,
    /customization/i,
    /roi/i,
    /300%/i,
    /gdpr|hipaa|pci/i,
  ]);
  const diffScore = diffEvidence ? 5 : 3;

  const questions = [
    buildQuestion(
      'Did the rep handle objections effectively?',
      objectionScore,
      objectionResponse ?? objectionCustomer,
      objectionCustomer
        ? objectionResponse
          ? `After concern ("${truncate(objectionCustomer.text ?? '', 80)}"), rep responded: "${truncate(objectionResponse.text ?? '', 100)}"`
          : `Customer raised: "${truncate(objectionCustomer.text ?? '', 100)}" — follow-up response could be stronger.`
        : 'No major objections detected in this call.',
      'Acknowledge the concern, then respond with specific proof points or flexibility options.',
    ),
    buildQuestion(
      'Were product differentiators clearly explained?',
      diffScore,
      diffEvidence,
      diffEvidence
        ? `Differentiators cited: "${truncate(diffEvidence.text ?? '', 120)}"`
        : 'Product differentiation was generic; tie features to prospect-stated needs.',
      'Link each differentiator to a pain point the customer already mentioned.',
    ),
  ];

  return {
    sectionName: 'Objection Handling',
    sectionScore: sectionScoreFromQuestions(questions),
    questions,
  };
}

function buildClosingSection(
  repLines: Utterance[],
  transcript: TranscriptLike,
  repPct: number | null,
): GeneratedReviewSection {
  const lateRep = repLines.slice(Math.max(0, repLines.length - 5));
  const nextStepEvidence = findFirstMatch(lateRep.length ? lateRep : repLines, [
    /send you/i,
    /calendar invite/i,
    /schedule a demo/i,
    /proposal within/i,
    /follow.?up call/i,
    /look forward to/i,
    /next 24 hours/i,
  ]);
  const nextSteps = transcript.nextSteps ?? [];
  let nextScore = 2;
  if (nextStepEvidence && nextSteps.length > 0) nextScore = 5;
  else if (nextStepEvidence || nextSteps.length > 0) nextScore = 4;
  else if (matchesAny(fullTranscriptText(transcript), [/demo|proposal|send/i])) nextScore = 3;

  const followUpEvidence = findFirstMatch(repLines, [
    /send (you|over)/i,
    /calendar invite/i,
    /proposal/i,
    /more information/i,
    /follow.?up/i,
  ]);
  const followScore = followUpEvidence ? 5 : 3;

  let listenScore = 4;
  let listenSuggestion = '';
  if (repPct != null) {
    if (repPct > 72) {
      listenScore = 2;
      listenSuggestion = `Rep talk ratio is ${Math.round(repPct)}% — pause more after discovery questions to let the buyer expand.`;
    } else if (repPct > 65) {
      listenScore = 3;
      listenSuggestion = 'Balance talk time — aim for ~45–55% rep talk on discovery calls.';
    } else {
      listenScore = 5;
    }
  }

  const questions = [
    buildQuestion(
      'Were clear next steps agreed with the prospect?',
      nextScore,
      nextStepEvidence,
      nextStepEvidence
        ? `Next step confirmed: "${truncate(nextStepEvidence.text ?? '', 120)}"`
        : nextSteps.length
          ? `Transcript next steps: ${nextSteps.slice(0, 2).join('; ')}`
          : 'No explicit next-step commitment at close.',
      'End with a specific action, owner, and timeframe — e.g. demo invite by EOD.',
    ),
    buildQuestion(
      'Did the rep confirm follow-up deliverables?',
      followScore,
      followUpEvidence,
      followUpEvidence
        ? `Follow-up promised: "${truncate(followUpEvidence.text ?? '', 120)}"`
        : 'Follow-up deliverables were not clearly committed.',
      'Name the exact asset you will send (proposal, recap, security docs) and when.',
    ),
    buildQuestion(
      'Was talk/listen balance appropriate for discovery?',
      listenScore,
      null,
      repPct != null
        ? `Rep talk ratio: ${Math.round(repPct)}% / Customer: ${Math.round(100 - repPct)}%`
        : 'Talk ratio unavailable for this transcript.',
      listenSuggestion || 'Monitor talk ratio — discovery calls should leave room for the buyer to share context.',
    ),
  ];

  return { sectionName: 'Closing', sectionScore: sectionScoreFromQuestions(questions), questions };
}

function truncate(text: string, max: number): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

function formatReviewDate(record: { callDate?: Date | string; updatedAt?: Date | string }): string {
  const raw = record.updatedAt ?? record.callDate ?? new Date();
  const d = raw instanceof Date ? raw : new Date(raw);
  if (Number.isNaN(d.getTime())) return new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/** Generate a full scorecard review from call + transcript data. */
export function buildReviewFromTranscript(record: {
  title?: string;
  callType?: string;
  callDate?: Date | string;
  updatedAt?: Date | string;
  callOwner?: string;
  transcript?: TranscriptLike | null;
  transcriptStatus?: string;
}): GeneratedReview | null {
  const transcript = record.transcript;
  const utterances = transcript?.utterances ?? [];
  if (!utterances.length && !transcript?.fullText) return null;

  const repLines = repUtterances(utterances);
  const customerLines = customerUtterances(utterances);
  const fullText = fullTranscriptText(transcript);
  const highlights = transcript?.keyHighlights ?? [];
  const repPct = transcript ? repTalkPercent(transcript) : null;

  const sections = [
    buildOpeningSection(repLines, utterances),
    buildDiscoverySection(repLines, customerLines, fullText, highlights),
    buildObjectionSection(repLines, customerLines, highlights),
    buildClosingSection(repLines, transcript ?? {}, repPct),
  ];

  const overallScore = Math.round(
    sections.reduce((sum, s) => sum + s.sectionScore, 0) / sections.length,
  );

  return {
    scorecardName: scorecardNameForCall(record),
    scorecardVersion: 'v2.1',
    reviewedBy: {
      name: 'AI Call Reviewer',
      role: 'Transcript Analysis',
    },
    reviewDate: formatReviewDate(record),
    overallScore,
    status: record.transcriptStatus === 'completed' ? 'Reviewed' : 'In Progress',
    sections,
  };
}
