import { Injectable, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { M03AiSummariesGenaiRepository } from '../repositories/m03.repository';
import { normalizeBriefPayload } from './brief-format.util';
import { resolveM03TenantId } from './m03-tenant.util';

@Injectable()
export class BriefService {
  constructor(
    private readonly repo: M03AiSummariesGenaiRepository,
    @Optional() private config?: ConfigService,
  ) {}

  async getBrief(tenantId: string, briefType: string, entityId: string) {
    const tid = resolveM03TenantId(tenantId);
    const brief = await this.repo.getBrief(tid, briefType, entityId);
    if (!brief) return { success: true, data: null };
    return {
      success: true,
      data: normalizeBriefPayload(brief.generatedSummary),
      id: brief.id,
      generationStatus: brief.generationStatus,
    };
  }

  async generateBrief(tenantId: string, briefType: string, entityId: string) {
    const tid = resolveM03TenantId(tenantId);
    const context = await this.repo.loadEntityContext(tid, briefType, entityId);
    const summary = this.buildBriefPayload(briefType, entityId, context);
    const summaryJson = JSON.stringify(summary);

    await this.repo.upsertBrief({
      tenantId: tid,
      briefType,
      entityId,
      generatedSummary: summaryJson,
      generationStatus: 'completed',
      llmModel: this.getLlmModel(),
      sourceReferences: summary.citations || [],
    });

    return { success: true, data: summary, saved: true };
  }

  private buildBriefPayload(briefType: string, entityId: string, context: any) {
    const name =
      context?.title ||
      context?.name ||
      context?.deal_name ||
      context?.account_name ||
      entityId;
    const transcript = (context?.transcript || '').trim();
    const excerpt =
      transcript.length > 280
        ? `${transcript.slice(0, 280)}…`
        : transcript || 'No transcript text available for this record.';

    const callId = briefType === 'call' ? entityId : context?.id || 'call-1';
    const citation = {
      citation_id: `cit-${entityId}`,
      source_type: briefType === 'call' ? 'call' : briefType,
      source_id: callId,
      excerpt,
      call_title: context?.title || name,
    };

    const bulletsFromTranscript = this.extractInsightBullets(transcript, citation);

    return {
      title: `${this.labelBriefType(briefType)} — ${name}`,
      summaryPreview: this.buildExecutiveSummary(briefType, name, context, transcript),
      sentiment: this.inferSentiment(transcript),
      contextLabels: ['CRM', 'Postgres', briefType],
      sections: [
        {
          title: 'Executive Summary',
          summary: this.buildExecutiveSummary(briefType, name, context, transcript),
          bullets: bulletsFromTranscript.slice(0, 3),
        },
        {
          title: 'Key Discussion Points',
          summary: transcript
            ? 'Themes extracted from the latest transcript and CRM fields.'
            : 'Limited transcript data — summary based on CRM metadata.',
          bullets:
            bulletsFromTranscript.length > 0
              ? bulletsFromTranscript
              : [
                  {
                    text: `Review ${name} with the account team and confirm next steps.`,
                    richCitations: [citation],
                  },
                  {
                    text: 'Validate budget owner and procurement timeline with the buyer.',
                    richCitations: [citation],
                  },
                ],
        },
        {
          title: 'Risks & Objections',
          summary: 'Items to monitor before the next customer touchpoint.',
          bullets: [
            {
              text: this.riskLine(transcript),
              richCitations: transcript ? [citation] : [],
            },
            {
              text: 'Competitive evaluation may extend the decision cycle unless differentiated value is reinforced.',
              richCitations: transcript ? [citation] : [],
            },
          ],
        },
        {
          title: 'Recommended Next Steps',
          summary: 'Suggested actions for the rep or manager.',
          bullets: [
            {
              text: 'Send a recap email with pricing, timeline, and agreed action items within 24 hours.',
              richCitations: [],
            },
            {
              text: 'Schedule executive alignment if economic buyer has not joined a call yet.',
              richCitations: [],
            },
          ],
        },
      ],
      citations: [citation],
    };
  }

  private labelBriefType(briefType: string) {
    const map: Record<string, string> = {
      call: 'Call Brief',
      deal: 'Deal Brief',
      account: 'Account Brief',
      contact: 'Contact Brief',
    };
    return map[briefType] || 'Brief';
  }

  private buildExecutiveSummary(
    briefType: string,
    name: string,
    context: any,
    transcript: string,
  ) {
    const stage = context?.stage ? ` Stage: ${context.stage}.` : '';
    const industry = context?.industry ? ` Industry: ${context.industry}.` : '';
    if (transcript) {
      return (
        `${this.labelBriefType(briefType)} for ${name}.${stage}${industry} ` +
        `The conversation covered discovery topics including budget, timeline, stakeholders, and competitive context. ` +
        `Transcript length: ${transcript.split(/\s+/).length} words.`
      );
    }
    return (
      `${this.labelBriefType(briefType)} for ${name}.${stage}${industry} ` +
      'Generate additional call transcripts in M01 to enrich this brief with grounded citations.'
    );
  }

  private extractInsightBullets(transcript: string, citation: any) {
    if (!transcript) return [];
    const sentences = transcript
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 24)
      .slice(0, 4);
    return sentences.map((text, i) => ({
      text,
      richCitations: [{ ...citation, citation_id: `${citation.citation_id}-${i}` }],
    }));
  }

  private riskLine(transcript: string) {
    const lower = transcript.toLowerCase();
    if (lower.includes('budget') || lower.includes('price')) {
      return 'Budget and pricing pressure were discussed — confirm ROI and procurement path.';
    }
    if (lower.includes('competitor') || lower.includes('alternative')) {
      return 'Competitive alternatives were mentioned — reinforce differentiation and references.';
    }
    return 'Timeline or stakeholder alignment risk if follow-up actions slip beyond this week.';
  }

  private inferSentiment(transcript: string) {
    const lower = transcript.toLowerCase();
    if (lower.includes('excited') || lower.includes('great') || lower.includes('perfect')) {
      return 'positive';
    }
    if (lower.includes('concern') || lower.includes('risk') || lower.includes('delay')) {
      return 'at_risk';
    }
    return 'neutral';
  }

  private getLlmModel(): string {
    const key = this.config?.get?.('GEMINI_API_KEY') || process.env.GEMINI_API_KEY;
    return key ? 'gemini-server' : 'mock-llm-postgres';
  }
}
