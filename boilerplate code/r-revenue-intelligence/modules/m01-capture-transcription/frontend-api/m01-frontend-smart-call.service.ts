import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';

const DEMO_CONTACTS = [
  {
    contactId: 'cnt_001',
    name: 'Sarah Chen',
    title: 'VP Sales',
    company: 'Acme Corp',
    lastInteraction: '2 days ago',
  },
  {
    contactId: 'cnt_002',
    name: 'Michael Rodriguez',
    title: 'Director IT',
    company: 'BetaCo',
    lastInteraction: '1 week ago',
  },
];

@Injectable()
export class M01FrontendSmartCallService {
  private readonly sessions = new Map<string, any>();

  listContacts(query: Record<string, string>) {
    const q = (query.q || '').toLowerCase();
    let contacts = DEMO_CONTACTS;
    if (q) {
      contacts = contacts.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
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
      contactName: c.name,
      company: c.company,
      briefing:
        'Recent activity suggests renewal discussion. Focus on ROI and timeline.',
      talkingPoints: [
        'Confirm decision timeline',
        'Address integration concerns',
        'Propose tailored pricing',
      ],
    };
  }

  startSession(body: { contactId: string; taskId?: string }) {
    const sessionId = `session_${randomUUID().slice(0, 8)}`;
    const port = process.env.M01_API_PORT || '3001';
    const wsEndpoint = `ws://localhost:${port}/api/smart-call/ws/${sessionId}`;
    this.sessions.set(sessionId, {
      sessionId,
      contactId: body.contactId,
      status: 'LIVE',
      startedAt: new Date().toISOString(),
      transcript: [],
    });
    return { sessionId, status: 'LIVE', wsEndpoint, startedAt: new Date().toISOString() };
  }

  endSession(sessionId: string) {
    const s = this.sessions.get(sessionId);
    if (!s) throw new NotFoundException('Session not found');
    s.status = 'ENDED';
    s.endedAt = new Date().toISOString();
    return {
      sessionId,
      status: 'ENDED',
      summaryId: `summary_${sessionId}`,
      generateSummary: true,
    };
  }

  getSummary(sessionId: string) {
    const s = this.sessions.get(sessionId);
    if (!s) throw new NotFoundException('Session not found');
    return {
      sessionId,
      overallScore: 78,
      scoreLabel: 'Good',
      highlights: ['Strong discovery questions', 'Missed explicit close'],
      improvements: ['Ask for next meeting before ending'],
      keyMoments: [],
    };
  }

  getTranscript(sessionId: string) {
    const s = this.sessions.get(sessionId);
    if (!s) throw new NotFoundException('Session not found');
    return {
      sessionId,
      segments: s.transcript?.length
        ? s.transcript
        : [
            {
              timestamp: '00:00',
              speaker: 'Rep',
              text: 'Thanks for joining today.',
            },
          ],
    };
  }
}
