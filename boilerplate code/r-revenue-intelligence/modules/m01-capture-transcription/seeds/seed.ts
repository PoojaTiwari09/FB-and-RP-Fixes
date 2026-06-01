/**
 * M01 Seed — 4 demo calls with real S3 recordings and AssemblyAI-aligned transcripts.
 *
 * Recordings:
 *   2mins_sales.mp3 — Emily (ABC Sales) / John (XYZ Corp)
 *   3mins_sales.mp3 — Alex (Salesforce Solutions) / enterprise buyer
 *
 * Run: pnpm exec tsx modules/m01-capture-transcription/seeds/seed.ts
 */
import { PrismaClient } from '@rri/database';
import {
  AUDIO_2MIN,
  AUDIO_3MIN,
  DEMO_2MIN,
  DEMO_3MIN,
  type DemoTranscriptBundle,
} from './demo-transcript-data';

const prisma = new PrismaClient();

const TENANT_ID = '00000000-0000-0000-0000-000000000001';

const CALL_1 = '11111111-1111-1111-1111-000000000001';
const CALL_2 = '11111111-1111-1111-1111-000000000002';
const CALL_3 = '11111111-1111-1111-1111-000000000003';
const CALL_4 = '11111111-1111-1111-1111-000000000004';

const DEMO_CALL_IDS = [CALL_1, CALL_2, CALL_3, CALL_4];

type CallSeed = {
  id: string;
  title: string;
  callDate: string;
  callType: string;
  callSource: string;
  participants: string[];
  callOwner: string;
  accountId: string;
  dealType: string;
  audioUrl: string;
  bundle: DemoTranscriptBundle;
};

const CALLS: CallSeed[] = [
  {
    id: CALL_1,
    title: 'Enterprise CRM Discovery — XYZ Corporation',
    callDate: '2026-05-19T10:00:00Z',
    callType: 'meeting',
    callSource: 'zoom',
    participants: ['Emily Thompson (Rep)', 'John Smith (XYZ Corp)'],
    callOwner: 'Emily Thompson',
    accountId: 'xyz-corp',
    dealType: 'New Business',
    audioUrl: AUDIO_2MIN,
    bundle: DEMO_2MIN,
  },
  {
    id: CALL_2,
    title: 'Enterprise CRM Evaluation — Salesforce Solutions',
    callDate: '2026-05-18T14:30:00Z',
    callType: 'outbound',
    callSource: 'teams',
    participants: ['Alex Rodriguez (Rep)', 'Michael Chen (Prospect)'],
    callOwner: 'Alex Rodriguez',
    accountId: 'northwind-systems',
    dealType: 'New Business',
    audioUrl: AUDIO_3MIN,
    bundle: DEMO_3MIN,
  },
  {
    id: CALL_3,
    title: 'CRM Pricing & Demo Scheduling — Globex Inc',
    callDate: '2026-05-17T11:15:00Z',
    callType: 'outbound',
    callSource: 'dialer',
    participants: ['Emily Thompson (Rep)', 'Tom Bradley (Globex)'],
    callOwner: 'Emily Thompson',
    accountId: 'globex-inc',
    dealType: 'Renewal',
    audioUrl: AUDIO_2MIN,
    bundle: DEMO_2MIN,
  },
  {
    id: CALL_4,
    title: 'Security, ROI & Implementation — Initech',
    callDate: '2026-05-16T09:45:00Z',
    callType: 'inbound',
    callSource: 'zoom',
    participants: ['Alex Rodriguez (Rep)', 'Lisa Park (Initech)'],
    callOwner: 'Alex Rodriguez',
    accountId: 'initech',
    dealType: 'Expansion',
    audioUrl: AUDIO_3MIN,
    bundle: DEMO_3MIN,
  },
];

async function clean() {
  await prisma.callShare.deleteMany({ where: { callId: { in: DEMO_CALL_IDS } } });
  await prisma.callNote.deleteMany({ where: { callId: { in: DEMO_CALL_IDS } } });
  await prisma.callRecord.deleteMany({ where: { id: { in: DEMO_CALL_IDS } } });
  await prisma.callShare.deleteMany({ where: { tenantId: TENANT_ID } });
  await prisma.callNote.deleteMany({ where: { tenantId: TENANT_ID } });
  await prisma.callRecord.deleteMany({ where: { tenantId: TENANT_ID } });
}

function transcriptCreate(tenantId: string, bundle: DemoTranscriptBundle) {
  return {
    tenantId,
    fullText: bundle.fullText,
    summary: bundle.summary,
    keyHighlights: bundle.keyHighlights,
    nextSteps: bundle.nextSteps,
    talkRatio: bundle.talkRatio,
    utterances: {
      create: bundle.utterances.map((u) => ({
        tenantId,
        speaker: u.speaker,
        text: u.text,
        startMs: u.startMs,
        endMs: u.endMs,
        confidence: u.confidence,
        isLowConfidence: u.isLowConfidence,
        sequenceIndex: u.sequenceIndex,
      })),
    },
  };
}

async function main() {
  console.log('M01 seed — cleaning previous data for', TENANT_ID);
  await clean();

  console.log('M01 seed — creating 4 completed calls with S3 recordings + transcripts');
  for (const c of CALLS) {
    await prisma.callRecord.create({
      data: {
        id: c.id,
        tenantId: TENANT_ID,
        title: c.title,
        callDate: new Date(c.callDate),
        durationSeconds: c.bundle.durationSeconds,
        callType: c.callType,
        callSource: c.callSource,
        participants: c.participants,
        callOwner: c.callOwner,
        accountId: c.accountId,
        audioUrl: c.audioUrl,
        transcriptStatus: 'completed',
        transcript: { create: transcriptCreate(TENANT_ID, c.bundle) },
      },
    });
    console.log(`  ${c.id} — ${c.title} (${c.bundle.durationSeconds}s, ${c.bundle.utterances.length} utterances)`);
  }

  console.log('M01 seed — done (4 calls, 2 unique S3 recordings)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
