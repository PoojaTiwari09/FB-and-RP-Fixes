/**
 * Offline fallback aligned with M01 seed (4 S3 demo calls).
 * Used only when the API is unreachable — not mixed with live API detail.
 */
import type {
  CallsListResponse,
  CallMetadata,
  BriefDetail,
  TranscriptResponse,
  TranscriptSummary,
  TalkRatio,
  TopicsResponse,
  NextStepsResponse,
} from '../types/calls.types';

const AUDIO_2MIN =
  'https://recordings-buttons.s3.eu-north-1.amazonaws.com/2mins_sales.mp3';
const AUDIO_3MIN =
  'https://recordings-buttons.s3.eu-north-1.amazonaws.com/3mins_sales.mp3';
const AUDIO_10MIN =
  'https://recordings-buttons.s3.eu-north-1.amazonaws.com/10mins_sales.wav';
const AUDIO_RESOURCES =
  'https://recordings-buttons.s3.eu-north-1.amazonaws.com/resources_sample-calls.mp3';

const SUMMARY_2MIN =
  'Emily from ABC Sales reached John at XYZ Corporation about enterprise CRM. They discussed real-time analytics, AI lead scoring, 24/7 support, a 6-8 week implementation window, and pricing starting at $50,000/year with a 10% new-customer discount. John requested a live demo; Emily will send a calendar invite and follow-up materials.';

const SUMMARY_3MIN =
  'Alex from Salesforce Solutions spoke with a buyer replacing a homegrown CRM. They covered scalability, customization, ERP and marketing integrations, GDPR/HIPAA/PCI compliance, onboarding and training, 300% average first-year ROI, a 12-16 week implementation timeline, and user-based pricing. Alex will send a full proposal within 24 hours and schedule a follow-up call.';

const SUMMARY_10MIN =
  'Sarah Chen negotiated an enterprise contract with Acme Industries covering competitor comparison, pricing at $85K/year, budget negotiation, phased pilot terms, and legal review of contract and renewal clauses.';

const SUMMARY_RESOURCES =
  'Michael Rodriguez walked GlobalTech Partners through the resource library and sample calls, covering workflow automation demos, CRM integration, training expansion, and customer feedback on resource load times.';

export const DEMO_SEED_CALL_IDS = [
  '11111111-1111-1111-1111-000000000001',
  '11111111-1111-1111-1111-000000000002',
  '11111111-1111-1111-1111-000000000003',
  '11111111-1111-1111-1111-000000000004',
] as const;

function clock(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export const DEMO_SEED_CALLS_LIST: CallsListResponse = {
  totalCount: 4,
  page: 1,
  size: 20,
  calls: [
    {
      callId: DEMO_SEED_CALL_IDS[0],
      callTitle: 'Enterprise CRM Discovery — XYZ Corporation',
      dealType: 'New Business',
      account: 'xyz-corp',
      owner: { ownerId: 'Emily Thompson', ownerName: 'Emily Thompson', avatarInitials: 'ET' },
      dateTime: '2026-05-19T10:00:00.000Z',
      duration: clock(149),
      keyInsight: SUMMARY_2MIN,
      status: 'completed',
    },
    {
      callId: DEMO_SEED_CALL_IDS[1],
      callTitle: 'Enterprise CRM Evaluation — Salesforce Solutions',
      dealType: 'New Business',
      account: 'northwind-systems',
      owner: { ownerId: 'Alex Rodriguez', ownerName: 'Alex Rodriguez', avatarInitials: 'AR' },
      dateTime: '2026-05-18T14:30:00.000Z',
      duration: clock(217),
      keyInsight: SUMMARY_3MIN,
      status: 'completed',
    },
    {
      callId: DEMO_SEED_CALL_IDS[2],
      callTitle: 'Enterprise Contract Negotiation — Acme Industries',
      dealType: 'Expansion',
      account: 'acme-industries',
      owner: { ownerId: 'Sarah Chen', ownerName: 'Sarah Chen', avatarInitials: 'SC' },
      dateTime: '2026-05-17T11:00:00.000Z',
      duration: clock(600),
      keyInsight: SUMMARY_10MIN,
      status: 'completed',
    },
    {
      callId: DEMO_SEED_CALL_IDS[3],
      callTitle: 'Resource Library Walkthrough — GlobalTech Partners',
      dealType: 'New Business',
      account: 'globaltech-partners',
      owner: { ownerId: 'Michael Rodriguez', ownerName: 'Michael Rodriguez', avatarInitials: 'MR' },
      dateTime: '2026-05-16T09:30:00.000Z',
      duration: clock(240),
      keyInsight: SUMMARY_RESOURCES,
      status: 'completed',
    },
  ],
};

const META: Record<string, CallMetadata & { audioUrl: string }> = {
  [DEMO_SEED_CALL_IDS[0]]: {
    callId: DEMO_SEED_CALL_IDS[0],
    callTitle: 'Enterprise CRM Discovery — XYZ Corporation',
    account: 'xyz-corp',
    type: 'outbound',
    dealType: 'New Business',
    date: 'May 19, 2026',
    time: '10:00 AM UTC',
    duration: clock(149),
    source: 'zoom',
    audioUrl: AUDIO_2MIN,
    participants: [{ name: 'Emily Thompson (Rep)' }, { name: 'John Smith (XYZ Corp)' }],
    owner: { ownerId: 'Emily Thompson', ownerName: 'Emily Thompson', avatarInitials: 'ET' },
  },
  [DEMO_SEED_CALL_IDS[1]]: {
    callId: DEMO_SEED_CALL_IDS[1],
    callTitle: 'Enterprise CRM Evaluation — Salesforce Solutions',
    account: 'northwind-systems',
    type: 'outbound',
    dealType: 'New Business',
    date: 'May 18, 2026',
    time: '2:30 PM UTC',
    duration: clock(217),
    source: 'teams',
    audioUrl: AUDIO_3MIN,
    participants: [{ name: 'Alex Rodriguez (Rep)' }, { name: 'Michael Chen (Prospect)' }],
    owner: { ownerId: 'Alex Rodriguez', ownerName: 'Alex Rodriguez', avatarInitials: 'AR' },
  },
  [DEMO_SEED_CALL_IDS[2]]: {
    callId: DEMO_SEED_CALL_IDS[2],
    callTitle: 'Enterprise Contract Negotiation — Acme Industries',
    account: 'acme-industries',
    type: 'outbound',
    dealType: 'Expansion',
    date: 'May 17, 2026',
    time: '11:00 AM UTC',
    duration: clock(600),
    source: 'zoom',
    audioUrl: AUDIO_10MIN,
    participants: [{ name: 'Sarah Chen (Rep)' }, { name: 'Lisa Park (Acme Industries)' }],
    owner: { ownerId: 'Sarah Chen', ownerName: 'Sarah Chen', avatarInitials: 'SC' },
  },
  [DEMO_SEED_CALL_IDS[3]]: {
    callId: DEMO_SEED_CALL_IDS[3],
    callTitle: 'Resource Library Walkthrough — GlobalTech Partners',
    account: 'globaltech-partners',
    type: 'inbound',
    dealType: 'New Business',
    date: 'May 16, 2026',
    time: '9:30 AM UTC',
    duration: clock(240),
    source: 'webex',
    audioUrl: AUDIO_RESOURCES,
    participants: [{ name: 'Michael Rodriguez (Rep)' }, { name: 'James Wu (GlobalTech)' }],
    owner: { ownerId: 'Michael Rodriguez', ownerName: 'Michael Rodriguez', avatarInitials: 'MR' },
  },
};

export const DEMO_SEED_METADATA_MAP = META;

function briefFor(callId: string, summary: string, account: string): BriefDetail {
  return {
    briefId: `auto-${callId}`,
    briefTemplate: 'Transcript Analysis',
    period: 'Full Call',
    generatedAt: new Date().toISOString(),
    generatedFrom: 'transcript',
    overview: { text: summary },
    keyDiscussionPoints: [{ timestamp: '0:45', description: summary.slice(0, 120) + '…' }],
    customerNeeds: [{ title: 'From call summary', description: summary }],
    risks: [],
    commitments: [{ description: 'Follow up per call conversation', assigneeType: 'rep', dueDate: '' }],
    stakeholders: [{ name: 'Rep', title: '', company: account, avatarInitials: 'RE' }],
    activityContext: [],
  };
}

export const DEMO_SEED_BRIEF_MAP: Record<string, BriefDetail> = {
  [DEMO_SEED_CALL_IDS[0]]: briefFor(DEMO_SEED_CALL_IDS[0], SUMMARY_2MIN, 'xyz-corp'),
  [DEMO_SEED_CALL_IDS[1]]: briefFor(DEMO_SEED_CALL_IDS[1], SUMMARY_3MIN, 'northwind-systems'),
};

const TRANSCRIPT_2MIN: TranscriptResponse = {
  totalCount: 4,
  transcript: [
    { entryId: 's1', timestamp: '00:00', speakerName: 'Rep', speakerType: 'rep', text: 'Good morning. Is this John from XYZ Corporation?', confidence: 'high' },
    { entryId: 's2', timestamp: '00:03', speakerName: 'Customer', speakerType: 'customer', text: "Yes, that's me. How can I help you?", confidence: 'high' },
    { entryId: 's3', timestamp: '00:06', speakerName: 'Rep', speakerType: 'rep', text: "Hi John. My name is Emily and I'm calling from ABC Sales.", confidence: 'high' },
    { entryId: 's4', timestamp: '00:12', speakerName: 'Customer', speakerType: 'customer', text: 'We are looking at implementing a new CRM system soon.', confidence: 'high' },
  ],
};

export const DEMO_SEED_TRANSCRIPT_MAP: Record<string, TranscriptResponse> = {
  [DEMO_SEED_CALL_IDS[0]]: TRANSCRIPT_2MIN,
  [DEMO_SEED_CALL_IDS[1]]: {
    totalCount: 3,
    transcript: [
      { entryId: 't1', timestamp: '00:00', speakerName: 'Rep', speakerType: 'rep', text: 'Thanks for joining — I understand you are evaluating CRM platforms.', confidence: 'high' },
      { entryId: 't2', timestamp: '00:08', speakerName: 'Customer', speakerType: 'customer', text: 'We need something that scales with our enterprise team.', confidence: 'high' },
      { entryId: 't3', timestamp: '00:15', speakerName: 'Rep', speakerType: 'rep', text: 'Our platform includes ERP integration and compliance tooling.', confidence: 'high' },
    ],
  },
};

export const DEMO_SEED_TRANSCRIPT_SUMMARY_MAP: Record<string, TranscriptSummary> = {
  [DEMO_SEED_CALL_IDS[0]]: { summary: SUMMARY_2MIN, generatedAt: '2026-05-19T10:00:00.000Z' },
  [DEMO_SEED_CALL_IDS[1]]: { summary: SUMMARY_3MIN, generatedAt: '2026-05-18T14:30:00.000Z' },
};

export const DEMO_SEED_TALK_RATIO_MAP: Record<string, TalkRatio> = {
  [DEMO_SEED_CALL_IDS[0]]: { rep: { percentage: 52 }, customer: { percentage: 48 } },
  [DEMO_SEED_CALL_IDS[1]]: { rep: { percentage: 55 }, customer: { percentage: 45 } },
};

export const DEMO_SEED_TOPICS_MAP: Record<string, TopicsResponse> = {
  [DEMO_SEED_CALL_IDS[0]]: {
    topics: [
      { topicId: 't1', label: 'pricing', timestamp: '01:05', description: 'Pricing discussion', color: 'blue' },
      { topicId: 't2', label: 'product', timestamp: '00:45', description: 'CRM capabilities', color: 'green' },
    ],
  },
  [DEMO_SEED_CALL_IDS[1]]: {
    topics: [
      { topicId: 't1', label: 'integration', timestamp: '01:20', description: 'ERP integration', color: 'orange' },
    ],
  },
};

export const DEMO_SEED_NEXT_STEPS_MAP: Record<string, NextStepsResponse> = {
  [DEMO_SEED_CALL_IDS[0]]: {
    nextSteps: [
      { stepId: 'ns1', description: 'Send calendar invite for live demo', completed: false },
      { stepId: 'ns2', description: 'Email follow-up materials', completed: false },
    ],
  },
  [DEMO_SEED_CALL_IDS[1]]: {
    nextSteps: [{ stepId: 'ns1', description: 'Send full proposal within 24 hours', completed: false }],
  },
};

export function isDemoSeedCallId(callId: string): boolean {
  return (DEMO_SEED_CALL_IDS as readonly string[]).includes(callId);
}
