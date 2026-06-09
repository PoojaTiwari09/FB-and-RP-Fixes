/**
 * Transcript bundles from AssemblyAI on the curated S3 demo recordings.
 * Regenerate: node scripts/build-demo-transcript-bundle.mjs
 */
import bundle from './demo-transcript-bundle.json';

export const AUDIO_2MIN =
  'https://recordings-buttons.s3.eu-north-1.amazonaws.com/2mins_sales.mp3';
export const AUDIO_3MIN =
  'https://recordings-buttons.s3.eu-north-1.amazonaws.com/3mins_sales.mp3';
export const AUDIO_10MIN =
  'https://recordings-buttons.s3.eu-north-1.amazonaws.com/10mins_sales.wav';
export const AUDIO_RESOURCES =
  'https://recordings-buttons.s3.eu-north-1.amazonaws.com/resources_sample-calls.mp3';

/** Stable demo call IDs — keep in sync with seeds/seed.ts */
export const DEMO_CALL_IDS = [
  '11111111-1111-1111-1111-000000000001',
  '11111111-1111-1111-1111-000000000002',
  '11111111-1111-1111-1111-000000000003',
  '11111111-1111-1111-1111-000000000004',
] as const;

export type DemoUtterance = {
  speaker: string;
  text: string;
  startMs: number;
  endMs: number;
  confidence: number;
  isLowConfidence: boolean;
  sequenceIndex: number;
};

export type DemoTranscriptBundle = {
  fullText: string;
  durationSeconds: number;
  utterances: DemoUtterance[];
  talkRatio: {
    Rep: { durationMs: number; percentage: number };
    Customer: { durationMs: number; percentage: number };
  };
  summary: string;
  keyHighlights: Array<{
    label: string;
    text: string;
    timestampMs: number;
    speaker: string;
  }>;
  nextSteps: string[];
};

function durationFromUtterances(utterances: DemoUtterance[], fallbackSec: number) {
  const last = utterances[utterances.length - 1];
  return last ? Math.ceil(last.endMs / 1000) : fallbackSec;
}

function buildSummaryFromText(fullText: string, fallback: string): string {
  const trimmed = fullText.trim();
  if (trimmed.length < 120) return fallback;
  const sentences = trimmed.match(/[^.!?]+[.!?]+/g) ?? [trimmed];
  return sentences.slice(0, 3).join(' ').trim().slice(0, 480);
}

function buildHighlights(
  utterances: DemoUtterance[],
  keywords: string[],
): DemoTranscriptBundle['keyHighlights'] {
  const highlights: DemoTranscriptBundle['keyHighlights'] = [];
  for (const keyword of keywords) {
    const hit = utterances.find((u) => u.text.toLowerCase().includes(keyword.toLowerCase()));
    if (hit) {
      highlights.push({
        label: keyword.replace(/\s+/g, '_'),
        text: hit.text.slice(0, 160),
        timestampMs: hit.startMs,
        speaker: hit.speaker,
      });
    }
  }
  return highlights;
}

export const DEMO_2MIN: DemoTranscriptBundle = {
  ...(bundle.twoMin as Omit<DemoTranscriptBundle, 'summary' | 'keyHighlights' | 'nextSteps' | 'durationSeconds'>),
  durationSeconds: durationFromUtterances(bundle.twoMin.utterances as DemoUtterance[], 149),
  summary:
    'Emily from ABC Sales reached John at XYZ Corporation about enterprise CRM. They discussed real-time analytics, AI lead scoring, 24/7 support, a 6–8 week implementation window, and pricing starting at $50,000/year with a 10% new-customer discount. John requested a live demo; Emily will send a calendar invite and follow-up materials.',
  keyHighlights: [
    {
      label: 'pricing',
      text: 'Enterprise CRM typically starts at $50,000 per year with volume discounts.',
      timestampMs: 93620,
      speaker: 'Rep',
    },
    {
      label: 'objection',
      text: 'Pricing came in higher than expected; customer asked about promotions.',
      timestampMs: 102900,
      speaker: 'Customer',
    },
    {
      label: 'product',
      text: 'Differentiators include real-time analytics, AI lead scoring, and marketing automation integrations.',
      timestampMs: 32810,
      speaker: 'Rep',
    },
    {
      label: 'next_step',
      text: 'Customer agreed to a live demo; rep will send calendar invite and product information.',
      timestampMs: 120770,
      speaker: 'Rep',
    },
  ],
  nextSteps: [
    'Send calendar invite with live demo time slots',
    'Email CRM solution overview and pricing sheet to John',
    'Confirm IT/security requirements before demo',
  ],
};

export const DEMO_3MIN: DemoTranscriptBundle = {
  ...(bundle.threeMin as Omit<DemoTranscriptBundle, 'summary' | 'keyHighlights' | 'nextSteps' | 'durationSeconds'>),
  durationSeconds: durationFromUtterances(bundle.threeMin.utterances as DemoUtterance[], 217),
  summary:
    'Alex from Salesforce Solutions spoke with a buyer replacing a homegrown CRM. They covered scalability, customization, ERP and marketing integrations, GDPR/HIPAA/PCI compliance, onboarding and training, 300% average first-year ROI, a 12–16 week implementation timeline, and user-based pricing. Alex will send a full proposal within 24 hours and schedule a follow-up call.',
  keyHighlights: [
    {
      label: 'pain_point',
      text: 'Current homegrown CRM is slow with limited customization and weak integrations.',
      timestampMs: 50250,
      speaker: 'Customer',
    },
    {
      label: 'security',
      text: 'Platform meets GDPR, HIPAA, and PCI DSS with regular audits and penetration testing.',
      timestampMs: 85680,
      speaker: 'Rep',
    },
    {
      label: 'roi',
      text: 'Customers report roughly 300% ROI in the first year after implementation.',
      timestampMs: 128560,
      speaker: 'Rep',
    },
    {
      label: 'timeline',
      text: 'Typical enterprise implementation runs 12–16 weeks depending on scope.',
      timestampMs: 150700,
      speaker: 'Rep',
    },
    {
      label: 'next_step',
      text: 'Rep to send comprehensive proposal within 24 hours and book follow-up call.',
      timestampMs: 191850,
      speaker: 'Rep',
    },
  ],
  nextSteps: [
    'Send proposal with implementation plan, timeline, and pricing within 24 hours',
    'Schedule follow-up call to review proposal',
    'Gather user count and customization requirements for quote',
  ],
};

export const DEMO_10MIN: DemoTranscriptBundle = {
  ...(bundle.tenMin as Omit<DemoTranscriptBundle, 'summary' | 'keyHighlights' | 'nextSteps' | 'durationSeconds'>),
  durationSeconds: durationFromUtterances(
    (bundle.tenMin as { utterances: DemoUtterance[] }).utterances,
    600,
  ),
  summary: buildSummaryFromText(
    (bundle.tenMin as { fullText: string }).fullText,
    'MedProCRM rep discusses medical CRM features, HIPAA compliance, pricing, ROI, and implementation with Dr. Smith over a detailed discovery call.',
  ),
  keyHighlights: buildHighlights((bundle.tenMin as { utterances: DemoUtterance[] }).utterances, [
    'pricing',
    'HIPAA',
    'demo',
    'implementation',
  ]),
  nextSteps: [
    'Send updated contract proposal and legal redlines',
    'Schedule follow-up with legal and procurement stakeholders',
    'Confirm pilot timeline and pricing approval path',
  ],
};

export const DEMO_RESOURCES: DemoTranscriptBundle = {
  ...(bundle.resourcesSample as Omit<
    DemoTranscriptBundle,
    'summary' | 'keyHighlights' | 'nextSteps' | 'durationSeconds'
  >),
  durationSeconds: durationFromUtterances(
    (bundle.resourcesSample as { utterances: DemoUtterance[] }).utterances,
    180,
  ),
  summary: buildSummaryFromText(
    (bundle.resourcesSample as { fullText: string }).fullText,
    'Charlie Johnson called Parker Scarves about a wrong scarf color shipped for his wife\'s birthday; the agent arranged an exchange at Karen\'s Boutique and sent a gift for the inconvenience.',
  ),
  keyHighlights: buildHighlights((bundle.resourcesSample as { utterances: DemoUtterance[] }).utterances, [
    'wrong color',
    'exchange',
    'birthday',
    'gift',
  ]),
  nextSteps: [
    'Share resource library access and sample call playlist',
    'Schedule enablement training for the sales team',
    'Send follow-up with highlighted sample calls',
  ],
};
