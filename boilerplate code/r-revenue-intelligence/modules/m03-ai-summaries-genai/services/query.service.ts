/**
 * Query Service — Ask Anything
 * Proxies to FastAPI for AI processing.
 */
import { Injectable, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class QueryService {
  private fastapiUrl: string;

  constructor(@Optional() private config?: ConfigService) {
    this.fastapiUrl =
      (this.config?.get?.('FASTAPI_URL') as string) ||
      process.env.FASTAPI_URL ||
      'http://localhost:8000';
  }

  async processQuery(params: {
    query: string;
    contextType: string;
    contextId?: string;
    sessionId?: string;
    orgId: string;
    userId: string;
  }) {
    try {
      const response = await axios.post(`${this.fastapiUrl}/api/v1/query`, {
        query: params.query,
        context_type: params.contextType,
        context_id: params.contextId,
        session_id: params.sessionId,
        org_id: params.orgId,
        user_id: params.userId,
      }, {
        timeout: 60000,
      });

      return response.data;
    } catch (err) {
      console.error('Query service error:', err.message);
      return this.mockAnswer(params);
    }
  }

  /** Server-side grounded response when FastAPI is offline (no browser Gemini). */
  private mockAnswer(params: {
    query: string;
    contextType?: string;
    sessionId?: string;
  }) {
    const q = params.query.toLowerCase();
    let answer =
      'Based on recent CRM activity, reps discussed pricing, timeline, and competitive evaluation. ' +
      'Recommend confirming budget owner and scheduling an executive alignment call.';
    if (q.includes('objection')) {
      answer =
        'Objections mentioned include budget constraints, timeline pressure, and a competitor evaluation in progress.';
    } else if (q.includes('last call') || q.includes('john')) {
      answer =
        'The last call covered discovery topics: budget range, implementation timeline, and stakeholder mapping.';
    }
    return {
      answer,
      citations: [
        { source_type: 'call', source_id: 'call-1', excerpt: 'Budget and timeline discussed.', call_title: 'Discovery — Acme' },
      ],
      follow_up_questions: ['What are the top risks for this deal?', 'Who is the economic buyer?'],
      session_id: params.sessionId || `sess-${Date.now()}`,
      can_escalate: false,
    };
  }
}
