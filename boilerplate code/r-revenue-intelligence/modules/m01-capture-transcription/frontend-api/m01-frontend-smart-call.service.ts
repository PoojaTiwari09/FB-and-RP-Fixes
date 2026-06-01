import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { M01FrontendSmartCallPersistenceService } from './m01-frontend-smart-call-persistence.service';

const DEMO_CONTACTS = [
  {
    contactId: 'cnt_001',
    contactName: 'Sarah Chen',
    jobTitle: 'VP of Sales',
    company: 'Acme Corp',
    avatarUrl: null as string | null,
    lastInteractionLabel: 'Called 2 days ago',
    phone: '+1 (555) 123-4567',
  },
  {
    contactId: 'cnt_002',
    contactName: 'Michael Rodriguez',
    jobTitle: 'CTO',
    company: 'TechFlow Inc',
    avatarUrl: null,
    lastInteractionLabel: 'Emailed 5 days ago',
    phone: '+1 (555) 987-6543',
  },
];

@Injectable()
export class M01FrontendSmartCallService {
  private readonly sessions = new Map<string, Record<string, unknown>>();

  constructor(private readonly persistence: M01FrontendSmartCallPersistenceService) {}

  listContacts(query: Record<string, string>) {
    const q = (query.q || '').toLowerCase();
    let contacts = [...DEMO_CONTACTS];
    if (q) {
      contacts = contacts.filter(
        (c) =>
          c.contactName.toLowerCase().includes(q) ||
          c.company.toLowerCase().includes(q),
      );
    }
    const limit = Math.min(50, parseInt(query.limit || '20', 10));
    const offset = parseInt(query.offset || '0', 10);
    const slice = contacts.slice(offset, offset + limit);
    return {
      contacts: slice,
      total: contacts.length,
      hasMore: offset + slice.length < contacts.length,
    };
  }

  getPreCallBrief(contactId: string) {
    const c = DEMO_CONTACTS.find((x) => x.contactId === contactId);
    if (!c) throw new NotFoundException('Contact not found');
    return {
      contactId,
      contactName: c.contactName,
      contactCompany: c.company,
      supportedIntegrations: ['ZOOM', 'MEET', 'TEAMS'],
      preCallBriefing:
        "Sarah has shown high pricing interest. Last call focused on ROI concerns. Lead with the TechCorp case study — similar use case, 3x ROI in 6 months. She's the decision maker but needs IT sign-off.",
      keyObjections: ['Budget', 'Integration complexity'],
      dealStage: 'Negotiation',
      arrValue: '$240K ARR',
    };
  }

  async startSession(body: { contactId: string; taskId?: string; integration?: string }) {
    const c = DEMO_CONTACTS.find((x) => x.contactId === body.contactId);
    if (!c) throw new NotFoundException('Contact not found');
    const sessionId = randomUUID();
    const port = process.env.UNIFIED_API_PORT ?? process.env.M01_API_PORT ?? '3001';

    this.sessions.set(sessionId, {
      sessionId,
      contactId: body.contactId,
      contactName: c.contactName,
      contactCompany: c.company,
      taskTitle: 'Follow up on Q2 contract renewal',
      status: 'LIVE',
      startedAt: new Date().toISOString(),
      transcript: [],
    });

    try {
      await this.persistence.startPersistedSession({
        externalSessionId: sessionId,
        contactId: body.contactId,
        dealCompany: c.company,
        clientName: c.contactName,
        sessionName: `Live Call - ${c.contactName}`,
      });
    } catch (e) {
      console.warn('[SmartCall] Postgres session create skipped:', (e as Error).message);
    }

    return {
      sessionId,
      contactId: body.contactId,
      contactName: c.contactName,
      contactCompany: c.company,
      taskTitle: 'Follow up on Q2 contract renewal',
      status: 'LIVE',
      wsEndpoint: `ws://localhost:${port}/api/smart-call/ws/${sessionId}`,
      message: 'Live Assist session started',
    };
  }

  endSession(sessionId: string, body?: { endedAt?: string; generateSummary?: boolean }) {
    const s = this.sessions.get(sessionId);
    if (!s) throw new NotFoundException('Session not found');
    s.status = 'ENDED';
    s.endedAt = body?.endedAt || new Date().toISOString();
    return {
      sessionId,
      status: 'ENDED',
      callSummaryId: `summary_${sessionId}`,
      message: 'Session ended. Generating call summary...',
    };
  }

  async persistSession(sessionId: string, body: Record<string, unknown>) {
    if (body.action === 'start') {
      return this.persistence.startPersistedSession({
        externalSessionId: sessionId,
        contactId: body.contactId as string | undefined,
        dealCompany: body.dealCompany as string | undefined,
        clientName: body.clientName as string | undefined,
        sessionName: body.sessionName as string | undefined,
      });
    }
    if (body.action === 'complete') {
      return this.persistence.completeSession(sessionId, {
        finalSummary: body.finalSummary as string | undefined,
        totalSegments: body.totalSegments as number | undefined,
        salesRepName: body.salesRepName as string | undefined,
        clientName: body.clientName as string | undefined,
        transcript: body.transcript as unknown[] | undefined,
      });
    }
    return { ok: false };
  }

  async persistChunk(sessionId: string, body: Record<string, unknown>) {
    return this.persistence.insertChunk(sessionId, body as Parameters<M01FrontendSmartCallPersistenceService['insertChunk']>[1]);
  }

  async listSummaries(sessionId: string) {
    try {
      return await this.persistence.listChunks(sessionId);
    } catch (e) {
      if ((e as { status?: number }).status === 404) return [];
      throw e;
    }
  }

  getSummary(sessionId: string) {
    const s = this.sessions.get(sessionId);
    if (!s) throw new NotFoundException('Session not found');
    return {
      sessionId,
      callSummaryId: `summary_${sessionId}`,
      duration: '3:46',
      callType: (s.taskTitle as string) || 'Follow up on Q2 contract renewal',
      signalLabel: 'Positive Signal',
      signalType: 'POSITIVE',
      overallScore: 78,
      dimensionScores: [
        { dimension: 'DISCOVERY', score: 82, maxScore: 100 },
        { dimension: 'OBJECTION_HANDLING', score: 75, maxScore: 100 },
        { dimension: 'CLOSING', score: 77, maxScore: 100 },
      ],
      aiSummary:
        'Strong opening with good rapport building. Successfully navigated price sensitivity by focusing on ROI and value proposition.',
      keyMoments: [
        {
          timestamp: '2:25',
          type: 'OBJECTION',
          color: 'yellow',
          description: 'Price concern raised - handled well with ROI breakdown',
        },
        {
          timestamp: '3:50',
          type: 'INTEREST_SIGNAL',
          color: 'green',
          description: 'Strong buying signal detected when discussing integration capabilities',
        },
      ],
      missedOpportunities: {
        title: 'Missed Opportunities',
        subLabel: 'Key questions you could have asked:',
        questions: [
          'When is the decision being made?',
          'Who else is involved in the decision-making process?',
        ],
      },
      suggestedImprovements: [
        'Ask more open-ended questions early to uncover deeper pain points',
        'Confirm budget authority before diving into pricing details',
      ],
      conversationTimeline: [
        { startTime: '0:00', endTime: '0:30', topic: 'Introduction and rapport building' },
        { startTime: '0:30', endTime: '1:00', topic: 'Discussed current challenges' },
      ],
      transcriptUrl: `https://app.relanto.ai/transcripts/${sessionId}`,
    };
  }

  getTranscript(sessionId: string) {
    const s = this.sessions.get(sessionId);
    if (!s) throw new NotFoundException('Session not found');
    const contact = DEMO_CONTACTS.find((x) => x.contactId === s?.contactId);
    const transcript = s?.transcript as { timestamp: string; speaker: string; text: string }[] | undefined;
    return {
      sessionId,
      contactName: contact?.contactName || 'Contact',
      duration: '3:46',
      segments: transcript?.length
        ? transcript
        : [
            {
              timestamp: '0:00',
              speaker: 'REP',
              text: 'Hi Sarah, thanks for taking the time to connect today.',
            },
            {
              timestamp: '0:08',
              speaker: 'CUSTOMER',
              text: "I'm doing well, thanks. I wanted to discuss the renewal terms.",
            },
          ],
    };
  }
}
