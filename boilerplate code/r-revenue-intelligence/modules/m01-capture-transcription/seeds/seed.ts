/**
 * M01 Seed Script — populates a realistic demo call with full transcript,
 * speaker labels, timestamps, highlights, notes, and talk ratio so the
 * dashboard works end-to-end on first load.
 *
 * Idempotent: re-runs cleanly. We delete every M01-owned row for the
 * demo tenant before reseeding so callId / transcriptId stay stable.
 *
 * Run:  pnpm exec tsx modules/m01-capture-transcription/seeds/seed.ts
 */
import { PrismaClient } from '@rri/database';

const prisma = new PrismaClient();

const TENANT_ID = '00000000-0000-0000-0000-000000000001';

// Stable IDs so smoke tests can reference them deterministically.
const CALL_1 = '11111111-1111-1111-1111-000000000001';
const CALL_2 = '11111111-1111-1111-1111-000000000002';
const CALL_3 = '11111111-1111-1111-1111-000000000003';

const DEMO_CALL_IDS = [CALL_1, CALL_2, CALL_3];

async function clean() {
  // Remove stable demo rows even if an older seed used a different tenantId (e.g. dev-tenant-001).
  await prisma.callShare.deleteMany({ where: { callId: { in: DEMO_CALL_IDS } } });
  await prisma.callNote.deleteMany({ where: { callId: { in: DEMO_CALL_IDS } } });
  await prisma.callRecord.deleteMany({ where: { id: { in: DEMO_CALL_IDS } } });
  await prisma.callShare.deleteMany({ where: { tenantId: TENANT_ID } });
  await prisma.callNote.deleteMany({ where: { tenantId: TENANT_ID } });
  // Utterances cascade from Transcript; Transcript cascades from CallRecord.
  await prisma.callRecord.deleteMany({ where: { tenantId: TENANT_ID } });
}

async function main() {
  console.log('M01 seed — cleaning previous data for', TENANT_ID);
  await clean();

  console.log('M01 seed — creating completed call with transcript');
  await prisma.callRecord.create({
    data: {
      id:               CALL_1,
      tenantId:         TENANT_ID,
      title:            'Q2 Product Sync with Acme Corp',
      callDate:         new Date('2026-05-19T10:00:00Z'),
      durationSeconds:  192,
      callType:         'meeting',
      callSource:       'zoom',
      participants:     ['Sarah Chen (Rep)', 'John Smith (Acme)'],
      callOwner:        'Sarah Chen',
      accountId:        'acme-corp-001',
      opportunityId:    'opp-acme-q2',
      audioUrl:         'https://recordings-buttons.s3.eu-north-1.amazonaws.com/2mins_sales.mp3',
      transcriptStatus: 'completed',
      transcript: {
        create: {
          tenantId:     TENANT_ID,
          fullText:     "Good morning John, thanks for joining the call today. I wanted to walk through our Q2 product roadmap and discuss pricing for the enterprise tier. Our platform now offers advanced analytics and real-time dashboards. The pricing for the enterprise plan starts at fifteen thousand per year. That sounds interesting but we're also evaluating a competitor solution from DataViz Pro. They quoted us twelve thousand. I understand the concern. Let me highlight what sets us apart — our AI-powered insights engine which automatically surfaces deal risks. That actually addresses one of our key pain points. Can you send over a detailed comparison document? Absolutely, I'll have that ready by end of week. What are the next steps on your side? We need to present to our CFO by June 15th. If you can get the comparison doc and a custom demo scheduled, we should be in good shape. Perfect, I'll coordinate both. Is there anything else you'd like to cover today? No I think we're good. Thanks Sarah, this was very productive. Thank you John, looking forward to moving this forward!",
          summary:      'Sarah presented the Q2 product roadmap and enterprise pricing ($15K/yr) to John from Acme Corp. John mentioned evaluating DataViz Pro ($12K quote). Sarah differentiated with AI-powered insights engine. John needs comparison doc and custom demo before CFO presentation by June 15th.',
          keyHighlights: [
            { label: 'pricing',    text: 'The pricing for the enterprise plan starts at fifteen thousand per year.', timestampMs: 28000, speaker: 'Rep' },
            { label: 'competitor', text: "We're also evaluating a competitor solution from DataViz Pro. They quoted us twelve thousand.", timestampMs: 45000, speaker: 'Customer' },
            { label: 'objection',  text: "That sounds interesting but we're also evaluating a competitor solution.", timestampMs: 42000, speaker: 'Customer' },
            { label: 'pricing',    text: 'Let me highlight what sets us apart — our AI-powered insights engine.', timestampMs: 68000, speaker: 'Rep' },
          ],
          nextSteps: [
            'Send comparison document to John by end of week',
            'Schedule custom demo for Acme Corp team',
            'Prepare CFO presentation materials before June 15th deadline',
          ],
          talkRatio: {
            Rep:      { durationMs: 105000, percentage: 0.55 },
            Customer: { durationMs: 87000,  percentage: 0.45 },
          },
          utterances: {
            create: [
              { tenantId: TENANT_ID, speaker: 'Rep',      text: 'Good morning John, thanks for joining the call today. I wanted to walk through our Q2 product roadmap and discuss pricing for the enterprise tier.', startMs: 0,     endMs: 12000,  confidence: 0.96, isLowConfidence: false, sequenceIndex: 0 },
              { tenantId: TENANT_ID, speaker: 'Rep',      text: 'Our platform now offers advanced analytics and real-time dashboards.',                                                                                  startMs: 12000, endMs: 20000,  confidence: 0.94, isLowConfidence: false, sequenceIndex: 1 },
              { tenantId: TENANT_ID, speaker: 'Rep',      text: 'The pricing for the enterprise plan starts at fifteen thousand per year.',                                                                              startMs: 20000, endMs: 28000,  confidence: 0.97, isLowConfidence: false, sequenceIndex: 2 },
              { tenantId: TENANT_ID, speaker: 'Customer', text: "That sounds interesting but we're also evaluating a competitor solution from DataViz Pro.",                                                              startMs: 30000, endMs: 42000,  confidence: 0.91, isLowConfidence: false, sequenceIndex: 3 },
              { tenantId: TENANT_ID, speaker: 'Customer', text: 'They quoted us twelve thousand.',                                                                                                                       startMs: 42000, endMs: 48000,  confidence: 0.88, isLowConfidence: false, sequenceIndex: 4 },
              { tenantId: TENANT_ID, speaker: 'Rep',      text: 'I understand the concern. Let me highlight what sets us apart — our AI-powered insights engine which automatically surfaces deal risks.',              startMs: 50000, endMs: 68000,  confidence: 0.95, isLowConfidence: false, sequenceIndex: 5 },
              { tenantId: TENANT_ID, speaker: 'Customer', text: 'That actually addresses one of our key pain points. Can you send over a detailed comparison document?',                                                  startMs: 70000, endMs: 82000,  confidence: 0.92, isLowConfidence: false, sequenceIndex: 6 },
              { tenantId: TENANT_ID, speaker: 'Rep',      text: "Absolutely, I'll have that ready by end of week. What are the next steps on your side?",                                                                 startMs: 84000, endMs: 96000,  confidence: 0.93, isLowConfidence: false, sequenceIndex: 7 },
              { tenantId: TENANT_ID, speaker: 'Customer', text: 'We need to present to our CFO by June 15th. If you can get the comparison doc and a custom demo scheduled, we should be in good shape.',                startMs: 98000, endMs: 115000, confidence: 0.90, isLowConfidence: false, sequenceIndex: 8 },
              { tenantId: TENANT_ID, speaker: 'Rep',      text: "Perfect, I'll coordinate both. Is there anything else you'd like to cover today?",                                                                       startMs: 117000,endMs: 128000, confidence: 0.94, isLowConfidence: false, sequenceIndex: 9 },
              { tenantId: TENANT_ID, speaker: 'Customer', text: "No I think we're good. Thanks Sarah, this was very productive.",                                                                                         startMs: 130000,endMs: 140000, confidence: 0.72, isLowConfidence: true,  sequenceIndex: 10 },
              { tenantId: TENANT_ID, speaker: 'Rep',      text: 'Thank you John, looking forward to moving this forward!',                                                                                                 startMs: 142000,endMs: 150000, confidence: 0.96, isLowConfidence: false, sequenceIndex: 11 },
            ],
          },
        },
      },
      notes: {
        create: [
          {
            tenantId: TENANT_ID,
            authorId: 'sarah-chen',
            content:  'Strong interest from Acme. Key blocker is CFO approval by June 15th. Need to position against DataViz Pro on AI capabilities. Priority: HIGH',
          },
        ],
      },
    },
  });
  console.log(`  call_1=${CALL_1} (completed)`);

  await prisma.callRecord.create({
    data: {
      id:               CALL_2,
      tenantId:         TENANT_ID,
      title:            'Follow-up: Pricing Negotiation with Beta Inc',
      callDate:         new Date('2026-05-18T14:30:00Z'),
      durationSeconds:  450,
      callType:         'outbound',
      callSource:       'dialer',
      participants:     ['Sarah Chen (Rep)', 'Mike Johnson (Beta Inc)'],
      callOwner:        'Sarah Chen',
      audioUrl:         null,
      transcriptStatus: 'pending',
    },
  });
  console.log(`  call_2=${CALL_2} (pending)`);

  await prisma.callRecord.create({
    data: {
      id:               CALL_3,
      tenantId:         TENANT_ID,
      title:            'Discovery Call — Gamma Solutions',
      callDate:         new Date('2026-05-19T08:00:00Z'),
      durationSeconds:  320,
      callType:         'inbound',
      callSource:       'teams',
      participants:     ['David Park (Rep)', 'Lisa Wang (Gamma)'],
      callOwner:        'David Park',
      audioUrl:         'https://recordings-buttons.s3.eu-north-1.amazonaws.com/3mins_sales.mp3',
      transcriptStatus: 'processing',
    },
  });
  console.log(`  call_3=${CALL_3} (processing)`);

  console.log('M01 seed — done');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
