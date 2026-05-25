/**
 * M01 Seed Script — populates a realistic demo call with full transcript,
 * speaker labels, timestamps, highlights, notes, and talk ratio so the
 * dashboard works end-to-end on first load.
 *
 * Run:  npx ts-node modules/m01-capture-transcription/seeds/seed.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TENANT_ID = 'dev-tenant-001';

async function main() {
  console.log('🌱 Seeding M01 demo data…');

  // ── 1. Create a completed call with audio ──────────────────────────────
  const call = await prisma.callRecord.create({
    data: {
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
      audioUrl:         'https://github.com/AssemblyAI-Examples/audio-examples/raw/main/2_speakers_1.wav',
      transcriptStatus: 'completed',
    },
  });
  console.log(`  ✅ CallRecord created: ${call.id}`);

  // ── 2. Create the transcript with utterances ───────────────────────────
  const transcript = await prisma.transcript.create({
    data: {
      tenantId:     TENANT_ID,
      callId:       call.id,
      fullText:     `Good morning John, thanks for joining the call today. I wanted to walk through our Q2 product roadmap and discuss pricing for the enterprise tier. Our platform now offers advanced analytics and real-time dashboards. The pricing for the enterprise plan starts at fifteen thousand per year. That sounds interesting but we're also evaluating a competitor solution from DataViz Pro. They quoted us twelve thousand. I understand the concern. Let me highlight what sets us apart — our AI-powered insights engine which automatically surfaces deal risks. That actually addresses one of our key pain points. Can you send over a detailed comparison document? Absolutely, I'll have that ready by end of week. What are the next steps on your side? We need to present to our CFO by June 15th. If you can get the comparison doc and a custom demo scheduled, we should be in good shape. Perfect, I'll coordinate both. Is there anything else you'd like to cover today? No I think we're good. Thanks Sarah, this was very productive. Thank you John, looking forward to moving this forward!`,
      summary:      'Sarah presented the Q2 product roadmap and enterprise pricing ($15K/yr) to John from Acme Corp. John mentioned evaluating DataViz Pro ($12K quote). Sarah differentiated with AI-powered insights engine. John needs comparison doc and custom demo before CFO presentation by June 15th.',
      keyHighlights: [
        { label: 'pricing', text: 'The pricing for the enterprise plan starts at fifteen thousand per year.', timestampMs: 28000, speaker: 'Rep' },
        { label: 'competitor', text: "We're also evaluating a competitor solution from DataViz Pro. They quoted us twelve thousand.", timestampMs: 45000, speaker: 'Customer' },
        { label: 'objection', text: 'That sounds interesting but we\'re also evaluating a competitor solution.', timestampMs: 42000, speaker: 'Customer' },
        { label: 'pricing', text: 'Let me highlight what sets us apart — our AI-powered insights engine.', timestampMs: 68000, speaker: 'Rep' },
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
          { speaker: 'Rep',      text: 'Good morning John, thanks for joining the call today. I wanted to walk through our Q2 product roadmap and discuss pricing for the enterprise tier.', startMs: 0,     endMs: 12000, confidence: 0.96, isLowConfidence: false, sequenceIndex: 0 },
          { speaker: 'Rep',      text: 'Our platform now offers advanced analytics and real-time dashboards.', startMs: 12000, endMs: 20000, confidence: 0.94, isLowConfidence: false, sequenceIndex: 1 },
          { speaker: 'Rep',      text: 'The pricing for the enterprise plan starts at fifteen thousand per year.', startMs: 20000, endMs: 28000, confidence: 0.97, isLowConfidence: false, sequenceIndex: 2 },
          { speaker: 'Customer', text: "That sounds interesting but we're also evaluating a competitor solution from DataViz Pro.", startMs: 30000, endMs: 42000, confidence: 0.91, isLowConfidence: false, sequenceIndex: 3 },
          { speaker: 'Customer', text: 'They quoted us twelve thousand.', startMs: 42000, endMs: 48000, confidence: 0.88, isLowConfidence: false, sequenceIndex: 4 },
          { speaker: 'Rep',      text: "I understand the concern. Let me highlight what sets us apart — our AI-powered insights engine which automatically surfaces deal risks.", startMs: 50000, endMs: 68000, confidence: 0.95, isLowConfidence: false, sequenceIndex: 5 },
          { speaker: 'Customer', text: 'That actually addresses one of our key pain points. Can you send over a detailed comparison document?', startMs: 70000, endMs: 82000, confidence: 0.92, isLowConfidence: false, sequenceIndex: 6 },
          { speaker: 'Rep',      text: "Absolutely, I'll have that ready by end of week. What are the next steps on your side?", startMs: 84000, endMs: 96000, confidence: 0.93, isLowConfidence: false, sequenceIndex: 7 },
          { speaker: 'Customer', text: 'We need to present to our CFO by June 15th. If you can get the comparison doc and a custom demo scheduled, we should be in good shape.', startMs: 98000, endMs: 115000, confidence: 0.90, isLowConfidence: false, sequenceIndex: 8 },
          { speaker: 'Rep',      text: "Perfect, I'll coordinate both. Is there anything else you'd like to cover today?", startMs: 117000, endMs: 128000, confidence: 0.94, isLowConfidence: false, sequenceIndex: 9 },
          { speaker: 'Customer', text: 'No I think we\'re good. Thanks Sarah, this was very productive.', startMs: 130000, endMs: 140000, confidence: 0.72, isLowConfidence: true, sequenceIndex: 10 },
          { speaker: 'Rep',      text: 'Thank you John, looking forward to moving this forward!', startMs: 142000, endMs: 150000, confidence: 0.96, isLowConfidence: false, sequenceIndex: 11 },
        ],
      },
    },
  });
  console.log(`  ✅ Transcript created with ${12} utterances`);

  // ── 3. Add a note ────────────────────────────────────────────────────────
  await prisma.callNote.create({
    data: {
      tenantId: TENANT_ID,
      callId:   call.id,
      authorId: 'sarah-chen',
      content:  'Strong interest from Acme. Key blocker is CFO approval by June 15th. Need to position against DataViz Pro on AI capabilities. Priority: HIGH',
    },
  });
  console.log('  ✅ Note added');

  // ── 4. Create a second call (pending transcription) ────────────────────
  const call2 = await prisma.callRecord.create({
    data: {
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
  console.log(`  ✅ Pending call created: ${call2.id}`);

  // ── 5. Create a third call (processing) ────────────────────────────────
  const call3 = await prisma.callRecord.create({
    data: {
      tenantId:         TENANT_ID,
      title:            'Discovery Call — Gamma Solutions',
      callDate:         new Date('2026-05-19T08:00:00Z'),
      durationSeconds:  320,
      callType:         'inbound',
      callSource:       'teams',
      participants:     ['David Park (Rep)', 'Lisa Wang (Gamma)'],
      callOwner:        'David Park',
      audioUrl:         'https://github.com/AssemblyAI-Examples/audio-examples/raw/main/2_speakers_1.wav',
      transcriptStatus: 'processing',
    },
  });
  console.log(`  ✅ Processing call created: ${call3.id}`);

  console.log('\n🎉 Seeding complete! Refresh your browser at http://localhost:3000/calls');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
