import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import {
  ConversationRecord,
  SavedSearchRecord,
  SearchSyncLog,
  SavedSearchDto,
} from '../interfaces/search.interface';

/**
 * Demo tenant UUID used by the seed script. Only valid as a *seed* identifier —
 * the runtime resolution of tenantId always comes from the request context via
 * `TenantGuard`. The string is intentionally a real UUID so seeded rows pass
 * Prisma uuid validation; it is **not** a fallback for unauthenticated calls.
 */
const DEV_SEED_TENANT_ID = '00000000-0000-0000-0000-000000000001';

@Injectable()
export class M02ConversationIntelligenceRepository {
  private static readonly logger = new Logger(M02ConversationIntelligenceRepository.name);
  private static demoCorpusByTenant: Map<string, ConversationRecord[]> = new Map();
  private static savedSearchesByTenant: Map<string, SavedSearchRecord[]> = new Map();
  private static syncLogsByTenant: Map<string, SearchSyncLog[]> = new Map();

  constructor(private readonly prisma: PrismaService) {}

  // ── Delegate helpers ─────────────────────────────────────────────────────
  // The unified `@rri/database` PrismaClient exposes M01 models as `callRecord`,
  // `transcript`, `utterance`, etc. Older module schemas referenced `m01Call`,
  // `m02Email`, `m02Tracker`, `m02SavedSearch` — those don't exist on the
  // unified client. We probe each delegate before use to stay crash-safe.

  private get callRecordDelegate(): any | null {
    const p = this.prisma as any;
    return p?.callRecord ?? p?.m01Call ?? null;
  }

  private get transcriptDelegate(): any | null {
    const p = this.prisma as any;
    return p?.transcript ?? null;
  }

  private get emailDelegate(): any | null {
    // The unified DB has `emails` but no Prisma model is exported yet.
    // M02 returns [] for the email channel until M08 finalises the Email model.
    const p = this.prisma as any;
    return p?.email ?? p?.m02Email ?? null;
  }

  private get savedSearchDelegate(): any | null {
    const p = this.prisma as any;
    return p?.savedSearch ?? p?.m02SavedSearch ?? null;
  }

  private get syncLogDelegate(): any | null {
    const p = this.prisma as any;
    return p?.searchIndexSyncLog ?? p?.m02SearchIndexSyncLog ?? null;
  }

  // Lazy demo corpus accessor — only generated on first access per tenant.
  private demoCorpusFor(tenantId: string): ConversationRecord[] {
    const cached = M02ConversationIntelligenceRepository.demoCorpusByTenant.get(tenantId);
    if (cached) return cached;
    const corpus = this.generateSampleCorpus(tenantId);
    M02ConversationIntelligenceRepository.demoCorpusByTenant.set(tenantId, corpus);
    M02ConversationIntelligenceRepository.savedSearchesByTenant.set(
      tenantId,
      this.generateSampleSavedSearches(tenantId),
    );
    M02ConversationIntelligenceRepository.syncLogsByTenant.set(
      tenantId,
      this.generateSampleSyncLogs(tenantId),
    );
    M02ConversationIntelligenceRepository.logger.log(
      `Generated ${corpus.length} demo conversations for tenant ${tenantId} (DB delegates unavailable).`,
    );
    return corpus;
  }

  private mapCallToConversation(c: any): ConversationRecord {
    const company = c.title?.split(' ')[0] || 'Client Corp';
    const durationSec = Number(c.durationSeconds ?? c.durationSec ?? 0);
    const durationMinutes = Math.floor(durationSec / 60);
    const remSeconds = durationSec % 60;
    const duration = `${durationMinutes}m ${remSeconds}s`;
    const transcriptText = c.transcript?.fullText ?? c.transcript ?? c.transcriptText ?? '';

    return {
      id: c.id,
      tenantId: c.tenantId,
      title: c.title ?? 'Untitled call',
      channel: 'call',
      customerName: `${company} Team`,
      agentName: c.callOwner ?? c.ownerName ?? 'Jessica',
      date: (c.callDate ?? c.occurredAt ?? c.createdAt)?.toISOString?.() ?? new Date().toISOString(),
      duration,
      sentiment: 'Positive',
      sentimentScore: 0.85,
      overallScore: 88,
      topics: ['Pricing Strategy', 'Feature Discovery'],
      summary: `Call regarding ${c.title}. ${transcriptText.substring(0, 100)}...`,
      transcript: transcriptText,
      diarizedTranscript: [
        { speaker: 'Speaker 1 (Agent)', text: `Hi there, great to connect with you.`, start: 0, end: 5 },
        { speaker: 'Speaker 2 (Customer)', text: transcriptText, start: 6, end: 80 },
      ],
      scorecard: {
        greeting: 9.0,
        problemUnderstanding: 8.5,
        productExplanation: 8.8,
        objectionHandling: 8.2,
        nextStep: 9.0,
        closingQuality: 8.7,
      },
      competitorsDetected: [],
      coachingSuggestion: 'Excellent talk-to-listen ratio.',
      keywords: ['Pricing', 'SLA', 'Uptime'],
    };
  }

  private mapEmailToConversation(e: any): ConversationRecord {
    return {
      id: e.id,
      tenantId: e.tenantId,
      title: e.subject,
      channel: 'email',
      customerName: `${e.recipient.split('@')[0] || 'Client'} Contact`,
      agentName: e.sender.split('@')[0] || 'Jessica',
      date: e.createdAt.toISOString(),
      duration: 'N/A (Email)',
      sentiment: 'Positive',
      sentimentScore: 0.75,
      overallScore: 82,
      topics: ['Pricing Strategy', 'Objection Handling'],
      summary: `Email regarding ${e.subject}. ${e.body.substring(0, 100)}...`,
      transcript: e.body,
      diarizedTranscript: [
        { speaker: 'Sender', text: e.body, start: 0, end: 0 }
      ],
      scorecard: {
        greeting: 9.2,
        problemUnderstanding: 8.4,
        productExplanation: 8.6,
        objectionHandling: 8.0,
        nextStep: 8.8,
        closingQuality: 8.5
      },
      competitorsDetected: [],
      coachingSuggestion: 'Clear follow-up and next steps outlined.',
      keywords: ['Proposal', 'Contract', 'SLA']
    };
  }

  async findAllConversations(tenantId: string): Promise<ConversationRecord[]> {
    if (!tenantId) throw new Error('tenantId is required');

    const calls = await this.safeFindCalls(tenantId);
    const emails = await this.safeFindEmails(tenantId);

    if (calls.length === 0 && emails.length === 0) {
      // Real DB has no data for this tenant — surface the demo corpus only when
      // tenantId is the documented dev seed so we never leak data across tenants.
      if (tenantId === DEV_SEED_TENANT_ID) {
        return this.demoCorpusFor(tenantId);
      }
      return [];
    }

    return [
      ...calls.map((c: any) => this.mapCallToConversation(c)),
      ...emails.map((e: any) => this.mapEmailToConversation(e)),
    ];
  }

  async findConversationById(id: string, tenantId: string): Promise<ConversationRecord | undefined> {
    if (!tenantId) throw new Error('tenantId is required');

    try {
      const callDelegate = this.callRecordDelegate;
      if (callDelegate?.findFirst) {
        const c = await callDelegate.findFirst({
          where: { id, tenantId },
          include: callDelegate === (this.prisma as any).callRecord ? { transcript: true } : undefined,
        });
        if (c) return this.mapCallToConversation(c);
      }

      const emailDelegate = this.emailDelegate;
      if (emailDelegate?.findFirst) {
        const e = await emailDelegate.findFirst({ where: { id, tenantId } });
        if (e) return this.mapEmailToConversation(e);
      }
    } catch (err: any) {
      M02ConversationIntelligenceRepository.logger.warn(
        `DB fetch for single conversation failed: ${err.message}`,
      );
    }

    // Fall back to demo corpus only for the dev tenant.
    if (tenantId !== DEV_SEED_TENANT_ID) return undefined;
    return this.demoCorpusFor(tenantId).find((c) => c.id === id);
  }

  async findSavedSearches(tenantId: string, _userId: string): Promise<SavedSearchRecord[]> {
    if (!tenantId) throw new Error('tenantId is required');

    try {
      const delegate = this.savedSearchDelegate;
      if (delegate?.findMany) {
        const searches = await delegate.findMany({ where: { tenantId } });
        if (searches.length > 0) {
          return searches.map((s: any) => ({
            id: s.id,
            tenantId: s.tenantId,
            userId: s.userId,
            name: s.name,
            queryString: s.queryString || '',
            filters:
              typeof s.filters === 'string'
                ? JSON.parse(s.filters)
                : (s.filters as Record<string, any>),
            createdAt: s.createdAt.toISOString(),
            updatedAt: s.updatedAt.toISOString(),
          }));
        }
      }
    } catch (err: any) {
      M02ConversationIntelligenceRepository.logger.warn(
        `DB fetch for saved searches failed: ${err.message}`,
      );
    }

    if (tenantId !== DEV_SEED_TENANT_ID) return [];
    return M02ConversationIntelligenceRepository.savedSearchesByTenant.get(tenantId) ?? [];
  }

  async createSavedSearch(
    data: SavedSearchDto,
    tenantId: string,
    userId: string,
  ): Promise<SavedSearchRecord> {
    if (!tenantId) throw new Error('tenantId is required');
    if (!userId) throw new Error('userId is required');

    try {
      const delegate = this.savedSearchDelegate;
      if (delegate?.create) {
        const newSearch = await delegate.create({
          data: {
            tenantId,
            userId,
            name: data.name,
            queryString: data.queryString || '',
            filters: data.filters || {},
          },
        });
        return {
          id: newSearch.id,
          tenantId: newSearch.tenantId,
          userId: newSearch.userId,
          name: newSearch.name,
          queryString: newSearch.queryString || '',
          filters: newSearch.filters as Record<string, any>,
          createdAt: newSearch.createdAt.toISOString(),
          updatedAt: newSearch.updatedAt.toISOString(),
        };
      }
    } catch (err: any) {
      M02ConversationIntelligenceRepository.logger.warn(
        `DB create saved search failed: ${err.message}`,
      );
    }

    const newSearch: SavedSearchRecord = {
      id: `saved-search-${Date.now()}`,
      tenantId,
      userId,
      name: data.name,
      queryString: data.queryString || '',
      filters: data.filters || {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const list = M02ConversationIntelligenceRepository.savedSearchesByTenant.get(tenantId) ?? [];
    list.push(newSearch);
    M02ConversationIntelligenceRepository.savedSearchesByTenant.set(tenantId, list);
    return newSearch;
  }

  async findSyncLogs(tenantId: string): Promise<SearchSyncLog[]> {
    if (!tenantId) throw new Error('tenantId is required');
    try {
      const delegate = this.syncLogDelegate;
      if (delegate?.findMany) {
        const logs = await delegate.findMany({ where: { tenantId } });
        if (logs.length > 0) {
          return logs.map((l: any) => ({
            id: l.id,
            tenantId: l.tenantId,
            entityType: l.entityType as 'transcript' | 'email',
            idempotencyKey: l.idempotencyKey,
            indexedAt: l.indexedAt?.toISOString?.(),
          }));
        }
      }
    } catch (err: any) {
      M02ConversationIntelligenceRepository.logger.warn(
        `DB fetch sync logs failed: ${err.message}`,
      );
    }
    if (tenantId !== DEV_SEED_TENANT_ID) return [];
    return M02ConversationIntelligenceRepository.syncLogsByTenant.get(tenantId) ?? [];
  }

  async createSyncLog(
    data: {
      entityType: 'transcript' | 'email';
      entityId?: string;
      idempotencyKey?: string;
      recordsSynced?: number;
    },
    tenantId: string,
  ): Promise<SearchSyncLog> {
    if (!tenantId) throw new Error('tenantId is required');
    if (!data.entityId) {
      throw new Error('entityId is required when creating a sync log');
    }

    try {
      const delegate = this.syncLogDelegate;
      if (delegate?.create) {
        const newLog = await delegate.create({
          data: {
            tenantId,
            entityType: data.entityType,
            entityId: data.entityId,
            syncStatus: 'COMPLETED',
            idempotencyKey: data.idempotencyKey || `key-${Date.now()}`,
            indexedAt: new Date(),
          },
        });
        return {
          id: newLog.id,
          tenantId: newLog.tenantId,
          entityType: newLog.entityType as 'transcript' | 'email',
          idempotencyKey: newLog.idempotencyKey,
          indexedAt: newLog.indexedAt?.toISOString?.(),
        };
      }
    } catch (err: any) {
      M02ConversationIntelligenceRepository.logger.warn(
        `DB create sync log failed: ${err.message}`,
      );
    }

    const newLog: SearchSyncLog = {
      id: `sync-log-${Date.now()}`,
      tenantId,
      entityType: data.entityType,
      lastSyncedAt: new Date().toISOString(),
      recordsSynced: data.recordsSynced || 1,
      idempotencyKey: data.idempotencyKey || `key-${Date.now()}`,
    };
    const list = M02ConversationIntelligenceRepository.syncLogsByTenant.get(tenantId) ?? [];
    list.push(newLog);
    M02ConversationIntelligenceRepository.syncLogsByTenant.set(tenantId, list);
    return newLog;
  }

  // ── private DB probes ────────────────────────────────────────────────────

  private async safeFindCalls(tenantId: string): Promise<any[]> {
    const delegate = this.callRecordDelegate;
    if (!delegate?.findMany) return [];
    try {
      const isUnified = delegate === (this.prisma as any).callRecord;
      return await delegate.findMany({
        where: { tenantId },
        ...(isUnified ? { include: { transcript: true } } : {}),
        orderBy: isUnified ? { callDate: 'desc' } : { createdAt: 'desc' },
      });
    } catch (err: any) {
      M02ConversationIntelligenceRepository.logger.warn(
        `findAllConversations.calls failed: ${err.message}`,
      );
      return [];
    }
  }

  private async safeFindEmails(tenantId: string): Promise<any[]> {
    const delegate = this.emailDelegate;
    if (!delegate?.findMany) return [];
    try {
      return await delegate.findMany({ where: { tenantId }, orderBy: { createdAt: 'desc' } });
    } catch (err: any) {
      M02ConversationIntelligenceRepository.logger.warn(
        `findAllConversations.emails failed: ${err.message}`,
      );
      return [];
    }
  }


  private generateSampleCorpus(tenantId: string): any[] {
    const companyNames = [
      'Acme Corp', 'Globex', 'Initech', 'Umbrella Corp', 'Hooli', 
      'Vehement Capital', 'ApexCorp', 'Cyberdyne', 'Soylent Corp', 
      'InGen', 'Massive Dynamic', 'Virtucon', 'Tyrell Corp', 'Weyland-Yutani'
    ];
    const reps = ['Sarah', 'John', 'Dave', 'Alice', 'Bob', 'Michael', 'Emily', 'David', 'Jessica', 'James'];
    const corpus: any[] = [];

    // 1. Programmatically generate 100 calls
    for (let i = 0; i < 100; i++) {
      const company = companyNames[i % companyNames.length];
      const rep = reps[i % reps.length];
      const durationSeconds = [600, 900, 1200, 1500, 1800, 2400][i % 6];
      const duration = `${Math.floor(durationSeconds / 60)}m ${durationSeconds % 60}s`;
      const theme = i % 10;
      
      let title = '';
      let transcript = '';
      let sentiment: 'Positive' | 'Neutral' | 'Negative' = 'Neutral';
      let sentimentScore = 0.0;
      let overallScore = 75;
      let topics: string[] = [];
      let keywords: string[] = [];
      let competitorsDetected: string[] = [];
      let coachingSuggestion = '';
      
      switch (theme) {
        case 0:
          title = `${company} Competitive Analysis: Apex Systems Pricing`;
          transcript = `Hi everyone, this is ${rep} from the sales engagement team. Today we had a call with the VP of Engineering from ${company}. They are currently comparing us with Apex Systems. Apex is offering an aggressive pricing structure with a flat 25% discount for a multi-year deal. However, their indexing technology is outdated, and their lack of real-time custom smart trackers is a dealbreaker. We need to follow up highlighting our advanced PostgreSQL RLS policies and vector compliance.`;
          sentiment = 'Positive';
          sentimentScore = 0.85;
          overallScore = 88;
          topics = ['Pricing Strategy', 'Feature Discovery', 'Salesforce Integration'];
          keywords = ['Salesforce Integration', 'Seat Pricing', 'Automated Notes', 'Volume Discount'];
          competitorsDetected = ['Apex Systems', 'Gong.io'];
          coachingSuggestion = 'Excellent capture of competitive concerns. Proactively send a battlecard comparing our Postgres pgvector vs Apex.';
          break;
        case 1:
          title = `Enterprise SLA & Q3 Renewal discussion - ${company}`;
          transcript = `Hello team, this is ${rep}. I was in the Q3 renewal sync with ${company} Procurement today. We are reviewing the legal details of their Enterprise renewal. They asked for a dedicated Customer Success Manager and 99.9% API uptime SLAs. We proposed a 15% discount if they extend to a two-year contract. Let us finalize the Master Services Agreement contract and send the updated proposal by tomorrow afternoon.`;
          sentiment = 'Positive';
          sentimentScore = 0.75;
          overallScore = 85;
          topics = ['Pricing Strategy', 'Objection Handling'];
          keywords = ['Enterprise SLA', 'Q3 Renewal', 'Master Agreement', 'Uptime SLA'];
          competitorsDetected = [];
          coachingSuggestion = 'Strong renewal push. Make sure to double check alignment with legal on SLA commitments before dispatch.';
          break;
        case 2:
          title = `Urgent Engineering Escalation: ${company} API Latency Spikes`;
          transcript = `This is the incident response team. We have an escalation from ${company} regarding API latency spikes. Their customer dashboard is loading extremely slowly, hitting 504 Gateway Timeouts. We ran a trace on the database and found an unindexed query on their search history log. Adding a composite HNSW and b-tree index on tenant_id resolved the performance degradation. Let us push this hotfix and update the status page.`;
          sentiment = 'Negative';
          sentimentScore = -0.65;
          overallScore = 55;
          topics = ['Technical Support', 'Onboarding & Training'];
          keywords = ['API Uptime', 'Latency Spikes', 'Gateway Timeout', 'Database Indexing'];
          competitorsDetected = [];
          coachingSuggestion = 'Fast incident containment. Let us follow up with their account lead to confirm the escalation is fully cleared.';
          break;
        case 3:
          title = `${company} CRM Onboarding & Playbook Configuration`;
          transcript = `Welcome back! In today onboarding session with the ${company} team, we configured their first AI auto-playbook. The goal is to coach their reps dynamically. When a competitor like Apex is mentioned on a call, the playbook alerts the rep with real-time battlecards and objection-handling templates. We also set up custom email follow-up templates to boost acquisition conversion rates. They are excited about the automation.`;
          sentiment = 'Positive';
          sentimentScore = 0.90;
          overallScore = 92;
          topics = ['Onboarding & Training', 'Technical Support'];
          keywords = ['CRM Onboarding', 'Playbook Setup', 'Objection Templates', 'Auto Follow-Up'];
          competitorsDetected = ['Apex Systems'];
          coachingSuggestion = 'Superb onboarding session. Guide them on expanding playbooks for competitors next sprint.';
          break;
        case 4:
          title = `Notion and Salesforce Integration Sync - ${company}`;
          transcript = `Hey, this is ${rep} from Integration support. We met with the engineering team at ${company} to resolve their Salesforce and Notion sync issues. They were seeing authentication credential failures on their webhook calls. We re-configured their API tokens and mapped their pipeline stages successfully. Everything is sync in real-time now, and audit logs are fully secure.`;
          sentiment = 'Neutral';
          sentimentScore = 0.20;
          overallScore = 78;
          topics = ['Technical Support', 'Onboarding & Training'];
          keywords = ['Salesforce Integration', 'Notion Webhooks', 'Authentication Token', 'Pipeline Syncing'];
          competitorsDetected = [];
          coachingSuggestion = 'Solid technical debugging. Verify webhook payload retries are fully functional.';
          break;
        case 5:
          title = `Quarterly Forecasting & Quota Review with ${company} leadership`;
          transcript = `Hi all, this is ${rep}. Today we had our executive forecasting session with ${company}. We reviewed their sales performance, pipelines, and upcoming expansion quotas. They are targeting fifty percent growth next quarter and need a unified revenue intelligence dashboard to trace deal health. We scheduled a follow-up demo with their CFO for budget approval.`;
          sentiment = 'Neutral';
          sentimentScore = 0.15;
          overallScore = 80;
          topics = ['Pricing Strategy', 'Objection Handling'];
          keywords = ['Executive Alignment', 'Quarterly Forecast', 'Pipeline Review', 'Expansion Quotas'];
          competitorsDetected = [];
          coachingSuggestion = 'Maintain regular cadence. Keep budget conversations aligned with their growth forecast.';
          break;
        case 6:
          title = `${company} Product Roadmap: Vector Search & AI Chatbot`;
          transcript = `This is the product sync. We discussed the engineering roadmap with ${company}. They requested a custom pgvector integration to enable secure semantic search across their internal document database. They also need HNSW indexes for near-instant latency and compliance with their RLS multi-tenancy requirements. Let us prioritize this task for the Q4 release.`;
          sentiment = 'Positive';
          sentimentScore = 0.80;
          overallScore = 90;
          topics = ['Technical Support', 'Feature Discovery'];
          keywords = ['Vector Search', 'pgvector Integration', 'HNSW Latency', 'RLS Compliance'];
          competitorsDetected = [];
          coachingSuggestion = 'Highly strategic roadmap alignment. Ensure the engineering team has clear pgvector specs.';
          break;
        case 7:
          title = `Customer Feedback & CSAT Review - ${company}`;
          transcript = `Hi customer success team, this is ${rep}. I did a quick health check call with ${company}. They gave us high CSAT scores, praising our auto-playbooks and real-time alerts. However, they asked for a simplified Notion integration workflow and more detailed compliance logging. Let us sync with product to address this.`;
          sentiment = 'Positive';
          sentimentScore = 0.70;
          overallScore = 84;
          topics = ['Onboarding & Training', 'Technical Support'];
          keywords = ['Customer Health', 'CSAT Review', 'Notion Integration', 'Compliance Logging'];
          competitorsDetected = [];
          coachingSuggestion = 'Very strong CSAT feedback. Follow up on Notion workflow simplifications.';
          break;
        case 8:
          title = `Budget Review and CFO Approval - ${company} Deal Expansion`;
          transcript = `Hello everyone, this is ${rep}. I had a brief meeting with the CFO of ${company}. We reviewed the proposed price expansion. They are expanding their seats from 100 to 250 next month. They approved the updated contract scope under the existing Q3 pricing. We just need to send the invoice and secure their signature.`;
          sentiment = 'Positive';
          sentimentScore = 0.88;
          overallScore = 95;
          topics = ['Pricing Strategy', 'Objection Handling'];
          keywords = ['Budget Approval', 'CFO Pricing', 'Seat Expansion', 'Invoice Signature'];
          competitorsDetected = [];
          coachingSuggestion = 'Flawless closing flow. Secure signature and proceed with account provisioning.';
          break;
        case 9:
          title = `Risk & Churn Mitigation Session with ${company}`;
          transcript = `This is CS operations. We flagged ${company} as a churn risk due to lower engagement metrics last month. We did a mitigation session with their sales ops team. The main challenge they face is training new reps. We configured specialized onboarding playbooks to help them scale. They are much more confident now, and the renewal risk has decreased significantly.`;
          sentiment = 'Negative';
          sentimentScore = -0.30;
          overallScore = 60;
          topics = ['Objection Handling', 'Onboarding & Training'];
          keywords = ['Churn Mitigation', 'Engagement Metrics', 'Onboarding Playbooks', 'Renewal Risk'];
          competitorsDetected = [];
          coachingSuggestion = 'Good churn mitigation. Continue monitoring engagement metrics closely next month.';
          break;
      }

      const date = new Date();
      date.setDate(date.getDate() - (i % 90));
      date.setHours(10 + (i % 8), 15 + (i % 40), 0, 0);

      // Generate diarized conversational script
      const diarizedTranscript = [
        { speaker: 'Speaker 1 (Agent)', text: `Hi there, this is ${rep} from the platform team. Great to connect with you.`, start: 0, end: 5 },
        { speaker: 'Speaker 2 (Customer)', text: `Hello ${rep}, yes, we are reviewing our tools for ${company} and wanted to discuss this setup.`, start: 6, end: 12 },
        { speaker: 'Speaker 1 (Agent)', text: transcript.substring(0, Math.floor(transcript.length / 2)), start: 13, end: 35 },
        { speaker: 'Speaker 2 (Customer)', text: `That makes complete sense. We want to ensure that our teams see high alignment and zero data delays.`, start: 36, end: 48 },
        { speaker: 'Speaker 1 (Agent)', text: transcript.substring(Math.floor(transcript.length / 2)), start: 49, end: 80 }
      ];

      corpus.push({
        id: `call-${100 + i}`,
        tenantId,
        title,
        channel: 'call',
        customerName: `${company} Team`,
        agentName: rep,
        date: date.toISOString(),
        duration,
        sentiment,
        sentimentScore,
        overallScore,
        topics,
        summary: `Call regarding ${title}. ${transcript.substring(0, 100)}...`,
        transcript,
        diarizedTranscript,
        scorecard: {
          greeting: 9.0,
          problemUnderstanding: 8.5,
          productExplanation: 8.8,
          objectionHandling: 8.2,
          nextStep: 9.0,
          closingQuality: 8.7
        },
        competitorsDetected,
        coachingSuggestion,
        keywords
      });
    }

    // 2. Programmatically generate 100 emails
    for (let i = 0; i < 100; i++) {
      const company = companyNames[i % companyNames.length];
      const rep = reps[i % reps.length];
      const theme = i % 10;
      
      let subject = '';
      let body = '';
      let sentiment: 'Positive' | 'Neutral' | 'Negative' = 'Neutral';
      let sentimentScore = 0.0;
      let overallScore = 75;
      let topics: string[] = [];
      let keywords: string[] = [];
      let competitorsDetected: string[] = [];
      let coachingSuggestion = '';
      
      switch (theme) {
        case 0:
          subject = `Follow-up: Competitive Intelligence and Pricing comparisons - ${company}`;
          body = `Hi team at ${company},\n\nFollowing up on our discovery call regarding Apex Systems. As discussed, Apex is currently offering aggressive pricing discounts, but they completely lack custom smart trackers, real-time alerts, and pgvector semantic search capabilities. Attached is a comparison matrix showing how our platform delivers 3x higher deal visibility. Let me know if you would like to schedule a deep-dive session.\n\nBest,\n${rep}`;
          sentiment = 'Positive';
          sentimentScore = 0.70;
          overallScore = 82;
          topics = ['Pricing Strategy', 'Objection Handling'];
          keywords = ['Pricing Comparison', 'Apex Competitor', 'pgvector Search', 'Deal Visibility'];
          competitorsDetected = ['Apex Systems'];
          coachingSuggestion = 'Great competitive positioning. Highlight our absolute RLS security features on follow-ups.';
          break;
        case 1:
          subject = `Proposal & Contract Details: Enterprise SLA Renewal - ${company}`;
          body = `Hi Sarah,\n\nFollowing up on our Enterprise renewal call, here are the SLA terms for ${company}. We offer 99.9% uptime, 24/7 technical phone support, and a dedicated Customer Success Manager. The pricing quote is attached reflecting the 15% discount for a 2-year term. Please let us know if your legal team needs any revisions to the Master Services Agreement.\n\nBest,\n${rep}`;
          sentiment = 'Positive';
          sentimentScore = 0.65;
          overallScore = 80;
          topics = ['Pricing Strategy', 'Objection Handling'];
          keywords = ['Enterprise SLA', 'Agreement Renewal', 'CS Manager', 'Uptime SLA'];
          competitorsDetected = [];
          coachingSuggestion = 'Strong renewal follow-up email. Ensure pricing terms match standard corporate guidelines.';
          break;
        case 2:
          subject = `Hotfix Confirmed: Resolution of API Latency Escalation - ${company}`;
          body = `Hi all,\n\nThe hotfix has been successfully deployed to all staging and production pods for ${company}. Latency is back to baseline (<100ms). The issue was caused by an unindexed query on the database. Thank you to the incident response team for the rapid triage and deployment of the indexing fix.\n\nCheers,\n${rep}`;
          sentiment = 'Neutral';
          sentimentScore = 0.30;
          overallScore = 85;
          topics = ['Technical Support', 'Onboarding & Training'];
          keywords = ['Hotfix Deployed', 'Database Indexing', 'Latency baseline', 'Triage Tally'];
          competitorsDetected = [];
          coachingSuggestion = 'Excellent closure email. Confirm with the client account manager that their team is happy.';
          break;
        case 3:
          subject = `Implementation details: Onboarding Auto-Playbook Configuration - ${company}`;
          body = `Dear Mr. Henderson,\n\nI have drafted the implementation plan for the ${company} Revenue Intelligence Dashboard. The platform will sync your Salesforce data in real-time, compute deal health scores, and generate automated playbooks for your sales reps. This matches your requirements for unified pipeline visibility. I look forward to your VP of Finance reviewing the budget proposal.\n\nBest regards,\n${rep}`;
          sentiment = 'Positive';
          sentimentScore = 0.80;
          overallScore = 88;
          topics = ['Onboarding & Training', 'Technical Support'];
          keywords = ['Playbook Setup', 'Pipeline Visibility', 'Budget Proposal', 'Salesforce Sync'];
          competitorsDetected = [];
          coachingSuggestion = 'Very structured follow-up. Anchors well to their business problem.';
          break;
        case 4:
          subject = `Webhook Integration Success: Salesforce and Notion sync active - ${company}`;
          body = `Hi integration team,\n\nWe have successfully established the Salesforce and Notion synchronization webhook for ${company}. Authentication credentials are now secure, and all pipeline transitions are syncing in real-time. Let us know if you observe any sync delays.\n\nRegards,\n${rep}`;
          sentiment = 'Positive';
          sentimentScore = 0.85;
          overallScore = 90;
          topics = ['Technical Support', 'Onboarding & Training'];
          keywords = ['Webhook Syncing', 'Notion Integration', 'Secure Credentials', 'Realtime Sync'];
          competitorsDetected = [];
          coachingSuggestion = 'Clear summary of the technical onboarding task milestone.';
          break;
        case 5:
          subject = `Q3 Forecasting and Revenue Alignment Review - ${company}`;
          body = `Team,\n\nHere is the summary of our forecasting review with ${company} leadership. They are on track to exceed their growth quotas, and our CRM analytics are providing key visibility for their CFO. We have scheduled their premium expansion onboarding for next week.\n\nThanks,\n${rep}`;
          sentiment = 'Neutral';
          sentimentScore = 0.15;
          overallScore = 78;
          topics = ['Pricing Strategy', 'Objection Handling'];
          keywords = ['Revenue Forecast', 'Alignment Review', 'Expansion Onboarding', 'CFO Analytics'];
          competitorsDetected = [];
          coachingSuggestion = 'Good operational report. Prepare expansion slides for their next review.';
          break;
        case 6:
          subject = `Compliance Documentation: Semantic Search isolation & RLS - ${company}`;
          body = `Hi security team,\n\nAttached is our compliance documentation regarding semantic search for ${company}. All customer text data converted into 1536-dimensional embeddings is isolated inside our multi-tenant PostgreSQL database via Row-Level Security (RLS) policies. We do not transmit customer conversations to external training APIs. HNSW indexing is fully local and secure.\n\nRegards,\n${rep}`;
          sentiment = 'Neutral';
          sentimentScore = 0.10;
          overallScore = 85;
          topics = ['Technical Support', 'Feature Discovery'];
          keywords = ['Compliance Document', 'pgvector Isolation', 'Multi-tenant RLS', 'HNSW indexing'];
          competitorsDetected = [];
          coachingSuggestion = 'Superb response on security. Send as a template for other enterprise compliance requests.';
          break;
        case 7:
          subject = `Follow-up: Customer Feedback and Roadmap Items - ${company}`;
          body = `Hi product team,\n\nI gathered some valuable feedback from the ${company} customer success lead. They are extremely satisfied with the playbook automation, but have requested a more intuitive UI for managing Notion webhooks. Let's review this for our upcoming sprint planning.\n\nBest,\n${rep}`;
          sentiment = 'Neutral';
          sentimentScore = 0.20;
          overallScore = 76;
          topics = ['Onboarding & Training', 'Technical Support'];
          keywords = ['Customer Feedback', 'Product Roadmap', 'Notion Webhooks', 'Playbook satisfaction'];
          competitorsDetected = [];
          coachingSuggestion = 'Valuable product feedback loop. Connect with engineering during weekly standup.';
          break;
        case 8:
          subject = `Contract Approved: Deal Expansion and CFO Signature - ${company}`;
          body = `Hi finance,\n\nWe have received the signed contract from the CFO of ${company} approving their seat expansion to 250 users next month. The updated invoice has been dispatched. Outstanding work by the account team!\n\nCheers,\n${rep}`;
          sentiment = 'Positive';
          sentimentScore = 0.95;
          overallScore = 98;
          topics = ['Pricing Strategy', 'Objection Handling'];
          keywords = ['Contract Approved', 'Seat Expansion', 'Invoice Dispatched', 'CFO Signature'];
          competitorsDetected = [];
          coachingSuggestion = 'Flawless expansion win! Highlight as a team win in Q3 review.';
          break;
        case 9:
          subject = `Engagement Restoration: Onboarding Playbook Active - ${company}`;
          body = `Hi all,\n\nWe successfully restored user engagement metrics at ${company} by delivering targeted playbook training. Their sales reps are actively using the coaching cards, and we are confident the renewal risk has resolved.\n\nRegards,\n${rep}`;
          sentiment = 'Positive';
          sentimentScore = 0.75;
          overallScore = 82;
          topics = ['Objection Handling', 'Onboarding & Training'];
          keywords = ['Engagement Restored', 'Coaching Cards', 'Playbook Training', 'Renewal Risk Resolved'];
          competitorsDetected = [];
          coachingSuggestion = 'Strong customer mitigation execution. Keep a bi-weekly health pulse.';
          break;
      }

      const date = new Date();
      date.setDate(date.getDate() - (i % 90));
      date.setHours(9 + (i % 8), 10 + (i % 40), 0, 0);

      corpus.push({
        id: `email-${200 + i}`,
        tenantId,
        title: subject,
        channel: 'email',
        customerName: `${company} Contact`,
        agentName: rep,
        date: date.toISOString(),
        duration: 'N/A (Email)',
        sentiment,
        sentimentScore,
        overallScore,
        topics,
        summary: `Email regarding ${subject}. ${body.substring(0, 100)}...`,
        transcript: body,
        diarizedTranscript: [
          { speaker: 'Sender', text: body, start: 0, end: 0 }
        ],
        scorecard: {
          greeting: 9.2,
          problemUnderstanding: 8.4,
          productExplanation: 8.6,
          objectionHandling: 8.0,
          nextStep: 8.8,
          closingQuality: 8.5
        },
        competitorsDetected,
        coachingSuggestion,
        keywords
      });
    }

    return corpus;
  }

  /** Demo saved searches use the documented seed user UUID, never a literal "user-456". */
  private static readonly DEV_SEED_USER_ID = '00000000-0000-0000-0000-000000000002';

  private generateSampleSavedSearches(tenantId: string): any[] {
    return [
      {
        id: 'saved-search-001',
        tenantId,
        userId: M02ConversationIntelligenceRepository.DEV_SEED_USER_ID,
        name: 'Enterprise Pricing Calls',
        queryString: 'pricing volume discount',
        filters: { topic: 'Pricing Strategy', sentiment: 'Positive' },
        createdAt: '2026-05-18T12:00:00Z',
        updatedAt: '2026-05-18T12:00:00Z'
      },
      {
        id: 'saved-search-002',
        tenantId,
        userId: M02ConversationIntelligenceRepository.DEV_SEED_USER_ID,
        name: 'Negative Sentiment Alerts',
        queryString: '',
        filters: { sentiment: 'Negative' },
        createdAt: '2026-05-17T09:00:00Z',
        updatedAt: '2026-05-17T09:00:00Z'
      }
    ];
  }

  private generateSampleSyncLogs(tenantId: string): any[] {
    return [
      {
        id: 'sync-log-001',
        tenantId,
        entityType: 'transcript',
        lastSyncedAt: '2026-05-19T02:00:00Z',
        recordsSynced: 100,
        idempotencyKey: 'sync-1'
      },
      {
        id: 'sync-log-002',
        tenantId,
        entityType: 'email',
        lastSyncedAt: '2026-05-19T03:00:00Z',
        recordsSynced: 100,
        idempotencyKey: 'sync-2'
      }
    ];
  }
}
