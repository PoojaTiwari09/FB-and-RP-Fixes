/**
 * Query Service — Ask Anything
 * Proxies to FastAPI for AI processing; falls back to Postgres-grounded mock.
 */
import { Injectable, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { M03AiSummariesGenaiRepository } from '../repositories/m03.repository';
import { resolveM03TenantId } from './m03-tenant.util';

@Injectable()
export class QueryService {
  private fastapiUrl: string;

  constructor(
    private readonly repo: M03AiSummariesGenaiRepository,
    @Optional() private config?: ConfigService,
  ) {
    this.fastapiUrl =
      (this.config?.get?.('FASTAPI_URL') as string) ||
      process.env.FASTAPI_URL ||
      'http://localhost:8000';
  }

  private useLocalFallback(): boolean {
    const flag = process.env.M03_USE_LOCAL_FALLBACK;
    if (flag === 'false') return false;
    if (flag === 'true') return true;
    return process.env.M03_REQUIRE_FASTAPI !== 'true';
  }

  private formatErr(err: unknown): string {
    if (axios.isAxiosError(err)) {
      return err.code || err.message || `HTTP ${err.response?.status ?? 'unreachable'}`;
    }
    if (err instanceof Error) return err.message || err.name;
    return String(err);
  }

  async processQuery(params: {
    query: string;
    contextType: string;
    contextId?: string;
    sessionId?: string;
    orgId: string;
    userId: string;
  }) {
    if (this.useLocalFallback()) {
      return this.mockAnswer(params);
    }

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
      console.warn(
        `[M03 Query] FastAPI unavailable at ${this.fastapiUrl}, using mock — ${this.formatErr(err)}`,
      );
      return this.mockAnswer(params);
    }
  }

  private async mockAnswer(params: {
    query: string;
    contextType?: string;
    contextId?: string;
    sessionId?: string;
    orgId: string;
  }) {
    const tid = resolveM03TenantId(params.orgId);
    const ws = await this.repo.getWorkspace(tid);
    const calls = ws.calls || [];
    const primary =
      (params.contextId && calls.find((c: any) => c.id === params.contextId)) ||
      calls[0] ||
      null;

    const title = primary?.title || 'Recent call';
    const transcript = (primary?.transcript || '').trim();
    const snippet =
      transcript.length > 320 ? `${transcript.slice(0, 320)}…` : transcript;
    const q = params.query.toLowerCase();

    let focus = 'recent CRM and conversation activity';
    if (q.includes('objection')) focus = 'buyer objections and risk signals';
    else if (q.includes('last call') || q.includes('john')) focus = 'the most recent customer call';
    else if (q.includes('acme') || q.includes('deal')) focus = 'deal momentum and stakeholder alignment';

    const bullets: string[] = [];
    if (transcript) {
      const sentences = transcript.split(/(?<=[.!?])\s+/).filter((s) => s.length > 20).slice(0, 3);
      bullets.push(...sentences.map((s) => `- ${s}`));
    } else {
      bullets.push('- Upload or complete transcription in M01 to ground answers in real dialogue.');
      bullets.push('- Review deal stage and account health in CRM before the next customer meeting.');
    }

    const answer = [
      `## Answer`,
      '',
      `Based on **${focus}** for *${title}*:`,
      '',
      bullets.join('\n'),
      '',
      '### Recommended next steps',
      '1. Confirm economic buyer and procurement timeline in writing.',
      '2. Send a recap with pricing, risks, and agreed action items within 24 hours.',
      '3. Schedule technical validation if product fit questions remain open.',
      '',
      snippet ? `### Transcript excerpt\n> ${snippet.replace(/\n/g, ' ')}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    return {
      answer,
      citations: primary
        ? [
            {
              source_type: 'call',
              source_id: primary.id,
              excerpt: snippet || 'Call record from Postgres',
              call_title: title,
            },
          ]
        : [],
      follow_up_questions: [
        'What objections were raised on the last call?',
        'Who is the economic buyer for this opportunity?',
        'What changed in deal stage over the last 30 days?',
      ],
      session_id: params.sessionId || `sess-${Date.now()}`,
      can_escalate: false,
    };
  }
}
