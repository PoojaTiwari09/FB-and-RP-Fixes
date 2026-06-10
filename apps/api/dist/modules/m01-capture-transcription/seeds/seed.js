"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("@rri/database");
const demo_transcript_data_1 = require("./demo-transcript-data");
const prisma = new database_1.PrismaClient();
const TENANT_ID = '00000000-0000-0000-0000-000000000001';
const [CALL_1, CALL_2, CALL_3, CALL_4] = demo_transcript_data_1.DEMO_CALL_IDS;
const CALLS = [
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
        audioUrl: demo_transcript_data_1.AUDIO_2MIN,
        bundle: demo_transcript_data_1.DEMO_2MIN,
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
        audioUrl: demo_transcript_data_1.AUDIO_3MIN,
        bundle: demo_transcript_data_1.DEMO_3MIN,
    },
    {
        id: CALL_3,
        title: 'Medical CRM Discovery — MedProCRM / Dr. Smith',
        callDate: '2026-05-17T11:00:00Z',
        callType: 'meeting',
        callSource: 'zoom',
        participants: ['MedProCRM Rep (Rep)', 'Dr. Smith (Prospect)'],
        callOwner: 'Sarah Chen',
        accountId: 'medpro-practice',
        dealType: 'New Business',
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
        dealType: 'Support',
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
async function upsertCall(c) {
    const existing = await prisma.callRecord.findUnique({
        where: { id: c.id },
        select: { id: true },
    });
    if (existing) {
        console.log(`  skip ${c.id} — already seeded (unchanged)`);
        return;
    }
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
async function main() {
    console.log('M01 seed — upserting demo calls for', TENANT_ID);
    for (const c of CALLS) {
        await upsertCall(c);
    }
    const total = await prisma.callRecord.count({
        where: { tenantId: TENANT_ID, id: { in: [...demo_transcript_data_1.DEMO_CALL_IDS] } },
    });
    console.log(`M01 seed — done (${total} demo calls in DB)`);
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=seed.js.map