/**
 * Query Service — Ask Anything
 * Proxies to FastAPI for AI processing.
 */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class QueryService {
  private fastapiUrl: string;

  constructor(private config: ConfigService) {
    this.fastapiUrl = this.config.get('FASTAPI_URL', 'http://localhost:8000');
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
      return {
        answer: 'Sorry, I could not process your question at this time. Please try again.',
        citations: [],
        follow_up_questions: [],
        session_id: params.sessionId || 'error',
        can_escalate: true,
      };
    }
  }
}
