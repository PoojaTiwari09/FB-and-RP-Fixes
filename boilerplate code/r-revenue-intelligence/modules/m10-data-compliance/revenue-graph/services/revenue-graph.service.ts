// M10 Revenue Graph — Core Service (Entity Linking Pipeline)
// Owned by: modules/m10-data-compliance/ (TDD Doc #11a v3.0)
// Linking precedence (TDD §5.2):
//   1. Exact email match → contacts
//   2. Domain-to-account mapping (skip free domains)
//   3. Active opportunity linkage via account
//   4. AI semantic fallback (Python service) — only when deterministic score is ambiguous
//   5. Durable save + publish revenue_graph.entity.linked

import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { randomUUID } from 'crypto';

import { RevenueGraphRepository } from '../repositories/revenue-graph.repository';
import { EventPublisherService } from '../../platform-core/events/event-publisher.service';
import { M10_REVENUE_GRAPH_EVENTS } from '../events/revenue-graph.events';

import {
  NormalizedIntake,
  EntityLinkResult,
  AiResolutionRequestSchema,
  AiResolutionResponseSchema,
  ConfidenceLevel,
} from '../schemas/revenue-graph.schema';

import type {
  AccountResponseDto,
  DealResponseDto,
  ContactResponseDto,
  CrmSyncStatusResponseDto,
  PaginatedResponseDto,
  RelationshipGraphDto,
} from '../dto/response-revenue-graph.dto';

// Env-driven configuration — M10_ prefix per monorepo convention (TDD §8)
const MIN_CONFIDENCE = parseFloat(process.env.M10_ENTITY_RESOLUTION_MIN_CONFIDENCE ?? '0.78');
const AI_ENABLED = process.env.M10_REVENUE_GRAPH_ENABLED !== 'false';
const WRITE_ENABLED = process.env.M10_REVENUE_GRAPH_WRITE_ENABLED !== 'false';
const PUBLISH_EVENTS = process.env.M10_REVENUE_GRAPH_PUBLISH_EVENTS !== 'false';
const AI_SERVICE_BASE_URL = process.env.M10_AI_SERVICE_BASE_URL ?? 'http://localhost:8000';

@Injectable()
export class RevenueGraphService {
  private readonly logger = new Logger(RevenueGraphService.name);

  constructor(
    private readonly repo: RevenueGraphRepository,
    private readonly events: EventPublisherService,
    private readonly http: HttpService,
  ) {}

  // ─── PUBLIC READ APIs (TDD §7) ────────────────────────────────────────────────

  async getAccounts(
    tenantId: string,
    opts: { page?: number; limit?: number; search?: string } = {},
  ): Promise<PaginatedResponseDto<AccountResponseDto>> {
    const { data, total } = await this.repo.findAccounts(tenantId, opts);
    return {
      data: data.map((a: any) => ({
        accountId: a.id,
        tenantId: a.tenantId,
        name: a.name,
        domain: a.domain ?? undefined,
        region: a.region ?? undefined,
        industry: a.industry ?? undefined,
        crmSource: a.crmSource ?? undefined,
        crmSyncedAt: a.crmSyncedAt?.toISOString(),
      })),
      total,
      page: opts.page ?? 1,
      limit: opts.limit ?? 20,
    };
  }

  async getAccountById(tenantId: string, accountId: string): Promise<AccountResponseDto> {
    const a = await this.repo.findAccountById(tenantId, accountId);
    if (!a) throw new HttpException(`Account ${accountId} not found`, HttpStatus.NOT_FOUND);
    return {
      accountId: a.id,
      tenantId: a.tenantId,
      name: a.name,
      domain: a.domain ?? undefined,
      region: a.region ?? undefined,
      industry: a.industry ?? undefined,
      crmSource: a.crmSource ?? undefined,
      crmSyncedAt: a.crmSyncedAt?.toISOString(),
    };
  }

  async getDeals(
    tenantId: string,
    opts: { accountId?: string; isActive?: boolean; stage?: string; page?: number; limit?: number } = {},
  ): Promise<PaginatedResponseDto<DealResponseDto>> {
    const { data, total } = await this.repo.findDeals(tenantId, opts);
    return {
      data: data.map((d: any) => this.mapDeal(d)),
      total,
      page: opts.page ?? 1,
      limit: opts.limit ?? 20,
    };
  }

  async getDealById(tenantId: string, dealId: string): Promise<DealResponseDto> {
    const d = await this.repo.findDealById(tenantId, dealId);
    if (!d) throw new HttpException(`Deal ${dealId} not found`, HttpStatus.NOT_FOUND);
    return this.mapDeal(d);
  }

  async getDealRelationship(tenantId: string, dealId: string): Promise<RelationshipGraphDto> {
    const d = await this.repo.findDealById(tenantId, dealId);
    if (!d) throw new HttpException(`Deal ${dealId} not found`, HttpStatus.NOT_FOUND);
    return {
      dealId: d.id,
      dealName: d.name,
      stage: d.stage ?? 'Unknown',
      amount: d.amount ?? undefined,
      account: d.account ? { accountId: d.account.id, name: d.account.name, domain: d.account.domain } : undefined,
      contacts: (d.dealContacts ?? []).map((dc: any) => ({
        contactId: dc.contact.id,
        name: dc.contact.name ?? undefined,
        email: dc.contact.email,
        role: dc.role ?? undefined,
      })),
      recentActivities: (d.activities ?? []).slice(0, 10).map((a: any) => ({
        activityId: a.id,
        sourceType: a.sourceType,
        sourcePlatform: a.sourcePlatform ?? undefined,
        occurredAt: a.occurredAt.toISOString(),
        status: a.status,
      })),
    };
  }

  async getContactById(tenantId: string, contactId: string): Promise<ContactResponseDto> {
    const c = await this.repo.findContactById(tenantId, contactId);
    if (!c) throw new HttpException(`Contact ${contactId} not found`, HttpStatus.NOT_FOUND);
    return {
      contactId: c.id,
      tenantId: c.tenantId,
      email: c.email,
      name: c.name ?? undefined,
      title: c.title ?? undefined,
      accountId: c.accountId ?? undefined,
      crmSource: c.crmSource ?? undefined,
    };
  }

  async getCrmSyncStatus(tenantId: string): Promise<CrmSyncStatusResponseDto> {
    const states = await this.repo.getCrmSyncStates(tenantId);
    return {
      tenantId,
      syncStates: states.map((s: any) => ({
        crmSource: s.crmSource,
        entityType: s.entityType,
        status: s.status,
        lastSyncedAt: s.lastSyncedAt?.toISOString(),
        recordsSynced: s.recordsSynced,
        errorMessage: s.errorMessage ?? undefined,
      })),
    };
  }

  async triggerCrmSync(
    tenantId: string,
    crmSource: string,
    entityTypes: string[],
  ): Promise<{ message: string; jobIds: string[] }> {
    const jobIds: string[] = [];
    for (const entityType of entityTypes) {
      await this.repo.upsertCrmSyncState(tenantId, crmSource, entityType, { status: 'syncing' });
      jobIds.push(randomUUID());
    }
    this.logger.log(`CRM sync triggered for tenant ${tenantId}, source ${crmSource}`);
    return { message: `CRM sync initiated for ${entityTypes.join(', ')}`, jobIds };
  }

  // ─── CORE ENTITY LINKING PIPELINE (TDD §5.2) ─────────────────────────────────

  /**
   * Main entity linking pipeline — called by BullMQ Worker after consuming
   * call.transcription.completed. Implements FR1-FR6 from TDD §4.
   */
  async processInteractionLinking(intake: NormalizedIntake): Promise<void> {
    if (!AI_ENABLED) {
      this.logger.warn('Revenue Graph disabled — M10_REVENUE_GRAPH_ENABLED=false');
      return;
    }

    const startMs = Date.now();
    const { tenantId, sourceRecordId, eventId } = intake;
    const idempotencyKey = `${tenantId}:${sourceRecordId}:${eventId}`;
    this.logger.log(`[${idempotencyKey}] Starting entity linking`);

    // Step 1: Upsert activity (FR-5: idempotency gate)
    const activity = await this.repo.upsertActivity(tenantId, {
      idempotencyKey,
      sourceType: intake.sourceType,
      sourcePlatform: intake.sourcePlatform,
      sourceRecordId: intake.sourceRecordId,
      occurredAt: new Date(intake.occurredAt),
      transcriptId: intake.artifacts.transcriptId,
      calendarEventId: intake.artifacts.calendarEventId,
      emailThreadId: intake.artifacts.emailThreadId,
      status: 'mapping_in_progress',
    });

    // Guard: already linked — skip idempotently
    if (activity.status === 'linked' || activity.status === 'linked_low_confidence') {
      this.logger.debug(`[${idempotencyKey}] Already linked — skipping`);
      return;
    }

    try {
      await this.repo.updateActivityStatus(activity.id, 'mapping_in_progress');

      const rulesConfig = await this.repo.getActiveMappingRules(tenantId)
        .then((r: any) => (r?.config as Record<string, any>) ?? {});

      // Step 2: Resolve contacts — email exact match (TDD §5.2.1, FR-3)
      const resolvedContacts = await this.resolveContacts(tenantId, intake);

      // Step 3: Resolve account — domain match (TDD §5.2.2)
      const resolvedAccount = await this.resolveAccount(tenantId, intake, resolvedContacts, rulesConfig);

      // Step 4: Resolve deal — open deals on account (TDD §5.2.3)
      const resolvedDeal = await this.resolveDeal(tenantId, intake, resolvedAccount, rulesConfig);

      // Step 5: Build link array
      let finalLinks: EntityLinkResult[] = [
        ...resolvedContacts.map(c => ({ entityType: 'contact' as const, entityId: c.id, confidence: c.confidence, signals: c.signals, aiAssisted: false })),
        ...(resolvedAccount ? [{ entityType: 'account' as const, entityId: resolvedAccount.id, confidence: resolvedAccount.confidence, signals: resolvedAccount.signals, aiAssisted: false }] : []),
        ...(resolvedDeal ? [{ entityType: 'deal' as const, entityId: resolvedDeal.id, confidence: resolvedDeal.confidence, signals: resolvedDeal.signals, aiAssisted: false }] : []),
      ];

      // Step 6: AI fallback — only when deterministic is insufficient (TDD §5.2.4, FR-3)
      const overallConfidence = this.calculateOverallConfidence(resolvedContacts, resolvedAccount, resolvedDeal);
      let aiAssisted = false;

      if (AI_ENABLED && overallConfidence !== 'high' && finalLinks.length === 0) {
        const aiResult = await this.callAiEntityResolution(tenantId, activity.id, intake, resolvedContacts, resolvedAccount, resolvedDeal);
        if (aiResult) {
          aiAssisted = true;
          finalLinks = this.mergeAiResults(finalLinks, aiResult);
        }
      }

      // Step 7: Persist links (FR-5: idempotent upsert)
      if (WRITE_ENABLED && finalLinks.length > 0) {
        await this.repo.upsertInteractionLinks(tenantId, activity.id, finalLinks);
      }

      // Step 8: Update activity status
      const finalConfidence = finalLinks.length > 0 ? overallConfidence : 'low';
      const finalStatus = finalLinks.length === 0
        ? 'unresolved'
        : finalConfidence === 'low' ? 'linked_low_confidence' : 'linked';

      const primaryAccount = finalLinks.find(l => l.entityType === 'account');
      const primaryContact = finalLinks.find(l => l.entityType === 'contact');
      const primaryDeal = finalLinks.find(l => l.entityType === 'deal');

      await this.repo.updateActivityStatus(activity.id, finalStatus, {
        accountId: primaryAccount?.entityId,
        contactId: primaryContact?.entityId,
        dealId: primaryDeal?.entityId,
      });

      // Step 9: Audit log (FR-4: explainable confidence mapping)
      const processingMs = Date.now() - startMs;
      await this.repo.createLinkDecisionLog(tenantId, {
        activityId: activity.id,
        idempotencyKey,
        candidatesJson: { contacts: resolvedContacts, account: resolvedAccount, deal: resolvedDeal },
        selectedLinks: finalLinks,
        rejectedLinks: {},
        aiRequestSent: aiAssisted,
        processingMs,
        outcome: finalStatus,
      });

      // Step 10: Publish event — ONLY after durable write (TDD §5.2.5)
      if (PUBLISH_EVENTS && finalStatus !== 'unresolved') {
        await this.publishEntityLinkedEvent(tenantId, activity, finalLinks, finalConfidence as ConfidenceLevel, aiAssisted);
      }

      this.logger.log(`[${idempotencyKey}] Done — status: ${finalStatus}, confidence: ${finalConfidence}, links: ${finalLinks.length}, ${processingMs}ms`);
    } catch (error) {
      this.logger.error(`[${idempotencyKey}] Failed: ${(error as Error).message}`);
      await this.repo.updateActivityStatus(activity.id, 'failed');
      await this.repo.createLinkDecisionLog(tenantId, {
        activityId: activity.id,
        idempotencyKey,
        candidatesJson: {},
        selectedLinks: {},
        rejectedLinks: {},
        aiRequestSent: false,
        processingMs: Date.now() - startMs,
        outcome: 'failed',
        failureReason: (error as Error).message,
      });
      throw error; // Re-throw for BullMQ retry
    }
  }

  // ─── PRIVATE: DETERMINISTIC RESOLUTION (TDD §5.2) ────────────────────────────

  private async resolveContacts(tenantId: string, intake: NormalizedIntake) {
    const results: Array<{ id: string; confidence: ConfidenceLevel; signals: string[] }> = [];

    for (const p of intake.participants) {
      if (p.role === 'external' && p.email) {
        const contact = await this.repo.findContactByEmail(tenantId, p.email);
        if (contact) results.push({ id: contact.id, confidence: 'high', signals: ['email_exact_match'] });
      }
    }

    for (const crmContactId of (intake.crmHints?.contactIds ?? [])) {
      const contact = await this.repo.findContactById(tenantId, crmContactId);
      if (contact && !results.find(r => r.id === contact.id)) {
        results.push({ id: contact.id, confidence: 'high', signals: ['crm_hint_contact_id'] });
      }
    }

    return results.slice(0, 20);
  }

  private async resolveAccount(
    tenantId: string,
    intake: NormalizedIntake,
    _contacts: Array<{ id: string }>,
    rulesConfig: Record<string, any>,
  ) {
    if (intake.crmHints?.accountId) {
      const account = await this.repo.findAccountById(tenantId, intake.crmHints.accountId);
      if (account) return { id: account.id, confidence: 'high' as ConfidenceLevel, signals: ['crm_hint_account_id'] };
    }

    const ignoredDomains: string[] = rulesConfig.ignoredDomains ?? ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'];
    const externalDomains = intake.participants
      .filter(p => p.role === 'external' && p.email.includes('@'))
      .map(p => p.email.split('@')[1])
      .filter(d => d && !ignoredDomains.includes(d));

    for (const domain of externalDomains) {
      const { data: accounts } = await this.repo.findAccounts(tenantId, { search: domain });
      const match = accounts.find((a: any) => a.domain === domain);
      if (match) return { id: match.id, confidence: 'high' as ConfidenceLevel, signals: ['email_domain_exact_match'] };
    }
    return null;
  }

  private async resolveDeal(
    tenantId: string,
    intake: NormalizedIntake,
    resolvedAccount: { id: string } | null,
    rulesConfig: Record<string, any>,
  ) {
    if (intake.crmHints?.dealId) {
      const { data: deals } = await this.repo.findDeals(tenantId, {});
      const deal = deals.find((d: any) => d.id === intake.crmHints!.dealId);
      if (deal) return { id: deal.id, confidence: 'high' as ConfidenceLevel, signals: ['crm_hint_deal_id'] };
    }

    if (resolvedAccount) {
      const openDeals = await this.repo.findOpenDealsByAccount(tenantId, resolvedAccount.id);
      const preferOpen: boolean = rulesConfig.preferOpenDeals !== false;
      if (preferOpen && openDeals.length === 1) {
        return { id: openDeals[0].id, confidence: 'high' as ConfidenceLevel, signals: ['single_open_deal_on_account'] };
      } else if (openDeals.length > 1) {
        return { id: openDeals[0].id, confidence: 'medium' as ConfidenceLevel, signals: ['most_recent_open_deal_on_account'] };
      }
    }
    return null;
  }

  private calculateOverallConfidence(
    contacts: Array<{ confidence: ConfidenceLevel }>,
    account: { confidence: ConfidenceLevel } | null,
    deal: { confidence: ConfidenceLevel } | null,
  ): ConfidenceLevel {
    const score = (l: ConfidenceLevel) => l === 'high' ? 1.0 : l === 'medium' ? 0.65 : 0.35;
    const scores = [
      ...contacts.map(c => score(c.confidence)),
      ...(account ? [score(account.confidence)] : []),
      ...(deal ? [score(deal.confidence)] : []),
    ];
    if (scores.length === 0) return 'low';
    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
    return avg >= MIN_CONFIDENCE ? 'high' : avg >= 0.5 ? 'medium' : 'low';
  }

  // ─── PRIVATE: AI RESOLUTION (TDD §5.2.4) — Python HTTP only ─────────────────

  private async callAiEntityResolution(
    tenantId: string, activityId: string, intake: NormalizedIntake,
    contacts: any[], account: any, deal: any,
  ) {
    try {
      const body = AiResolutionRequestSchema.parse({
        tenantId, activityId,
        transcriptId: intake.artifacts.transcriptId,
        participants: intake.participants,
        candidateAccounts: account ? [{ id: account.id, name: 'unknown' }] : [],
        candidateDeals: deal ? [{ id: deal.id, name: 'unknown' }] : [],
        candidateContacts: contacts.map(c => ({ id: c.id, email: 'unknown' })),
      });
      const response = await firstValueFrom(
        this.http.post(`${AI_SERVICE_BASE_URL}/v1/resolve-entities`, body, { timeout: 10000 }),
      );
      const parsed = AiResolutionResponseSchema.safeParse(response.data);
      return parsed.success ? parsed.data : null;
    } catch (err) {
      this.logger.warn(`AI resolution failed (non-fatal): ${(err as Error).message}`);
      return null;
    }
  }

  private mergeAiResults(existing: EntityLinkResult[], ai: any): EntityLinkResult[] {
    const merged = [...existing];
    if (ai.accountId && !merged.find(l => l.entityType === 'account'))
      merged.push({ entityType: 'account', entityId: ai.accountId, confidence: ai.confidence, signals: ai.signals, aiAssisted: true });
    if (ai.dealId && !merged.find(l => l.entityType === 'deal'))
      merged.push({ entityType: 'deal', entityId: ai.dealId, confidence: ai.confidence, signals: ai.signals, aiAssisted: true });
    for (const cId of (ai.contactIds ?? [])) {
      if (!merged.find(l => l.entityType === 'contact' && l.entityId === cId))
        merged.push({ entityType: 'contact', entityId: cId, confidence: ai.confidence, signals: ai.signals, aiAssisted: true });
    }
    return merged;
  }

  // ─── PRIVATE: EVENT PUBLICATION (TDD §5.2.5) ─────────────────────────────────

  private async publishEntityLinkedEvent(
    tenantId: string, activity: any, links: EntityLinkResult[],
    confidence: ConfidenceLevel, aiAssisted: boolean,
  ) {
    const accountLink = links.find(l => l.entityType === 'account');
    const dealLink = links.find(l => l.entityType === 'deal');
    const contactLinks = links.filter(l => l.entityType === 'contact');

    await this.events.publish(M10_REVENUE_GRAPH_EVENTS.PUBLISHED.ENTITY_LINKED, {
      tenantId,
      activityId: activity.id,
      sourceType: activity.sourceType,
      sourceRecordId: activity.sourceRecordId,
      accountId: accountLink?.entityId ?? null,
      dealId: dealLink?.entityId ?? null,
      contactIds: contactLinks.map(l => l.entityId),
      confidence,
      linkedAt: new Date().toISOString(),
      explanation: { signals: [...new Set(links.flatMap(l => l.signals))], aiAssisted },
    });

    this.logger.log(`Published ${M10_REVENUE_GRAPH_EVENTS.PUBLISHED.ENTITY_LINKED} — activity ${activity.id}`);
  }

  // ─── PRIVATE: HELPERS ─────────────────────────────────────────────────────────

  private mapDeal(d: any): DealResponseDto {
    return {
      dealId: d.id,
      tenantId: d.tenantId,
      name: d.name,
      stage: d.stage ?? undefined,
      amount: d.amount ?? undefined,
      currency: d.currency ?? undefined,
      closeDate: d.closeDate?.toISOString(),
      isActive: d.isActive,
      account: d.account ? { accountId: d.account.id, name: d.account.name } : undefined,
      contacts: (d.dealContacts ?? []).map((dc: any) => ({
        contactId: dc.contact.id,
        name: dc.contact.name ?? undefined,
        email: dc.contact.email,
      })),
      recentActivities: (d.activities ?? []).map((a: any) => ({
        activityId: a.id,
        sourceType: a.sourceType,
        sourcePlatform: a.sourcePlatform ?? undefined,
        occurredAt: a.occurredAt.toISOString(),
        status: a.status,
      })),
    };
  }
}
