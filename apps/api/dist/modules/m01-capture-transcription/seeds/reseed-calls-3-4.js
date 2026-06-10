"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("@rri/database");
const demo_transcript_data_1 = require("./demo-transcript-data");
const prisma = new database_1.PrismaClient();
const TENANT_ID = '00000000-0000-0000-0000-000000000001';
const [CALL_3, CALL_4] = demo_transcript_data_1.DEMO_CALL_IDS.slice(2);
const CALLS = [
    {
        id: CALL_3,
        title: 'Medical CRM Discovery — MedProCRM / Dr. Smith',
        callDate: '2026-05-17T11:00:00Z',
        callType: 'meeting',
        callSource: 'zoom',
        participants: ['MedProCRM Rep (Rep)', 'Dr. Smith (Prospect)'],
        callOwner: 'Sarah Chen',
        accountId: 'medpro-practice',
        audioUrl: demo_transcript_data_1.AUDIO_10MIN,
        bundle: demo_transcript_data_1.DEMO_10MIN,
    },
    {
        id: CALL_4,
        title: 'Customer Service — Parker Scarves Exchange',
        callDate: '2026-05-16T09:30:00Z',
        callType: 'inbound',
        callSource: 'phone',
        participants: ['Parker Scarves Agent (Rep)', 'Charlie Johnson (Customer)'],
        callOwner: 'Michael Rodriguez',
        accountId: 'parker-scarves',
        audioUrl: demo_transcript_data_1.AUDIO_RESOURCES,
        bundle: demo_transcript_data_1.DEMO_RESOURCES,
    },
];
function transcriptCreate(tenantId, bundle) {
    return {
        tenantId: tenantId,
        fullText: bundle.fullText,
        summary: bundle.summary,
        keyHighlights: bundle.keyHighlights,
        nextSteps: bundle.nextSteps,
        talkRatio: bundle.talkRatio,
        utterances: {
            create: bundle.utterances.map((u) => ({
                tenantId: tenantId,
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
async function reseedCall(c) {
    await prisma.utterance.deleteMany({
        where: { transcript: { callId: c.id } },
    });
    await prisma.transcript.deleteMany({ where: { callId: c.id } });
    await prisma.callRecord.update({
        where: { id: c.id },
        data: {
            title: c.title,
            callDate: new Date(c.callDate),
            callType: c.callType,
            callSource: c.callSource,
            participants: c.participants,
            callOwner: c.callOwner,
            accountId: c.accountId,
            durationSeconds: c.bundle.durationSeconds,
            audioUrl: c.audioUrl,
            transcriptStatus: 'completed',
            transcript: { create: transcriptCreate(TENANT_ID, c.bundle) },
        },
    });
    console.log(`  ${c.id} — ${c.bundle.utterances.length} utterances, ${c.bundle.durationSeconds}s`);
}
async function main() {
    console.log('Re-seeding transcripts for calls 3 & 4');
    for (const c of CALLS) {
        await reseedCall(c);
    }
    console.log('Done');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=reseed-calls-3-4.js.map