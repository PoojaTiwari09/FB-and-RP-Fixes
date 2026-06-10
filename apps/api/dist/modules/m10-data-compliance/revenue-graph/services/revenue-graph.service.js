"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var RevenueGraphService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RevenueGraphService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
const crypto_1 = require("crypto");
const revenue_graph_repository_1 = require("../repositories/revenue-graph.repository");
const event_publisher_service_1 = require("../../../platform-core/events/event-publisher.service");
const revenue_graph_events_1 = require("../events/revenue-graph.events");
const revenue_graph_schema_1 = require("../schemas/revenue-graph.schema");
const entity_resolution_engine_1 = require("../entity-resolution/entity-resolution.engine");
const MIN_CONFIDENCE = parseFloat(process.env.M10_ENTITY_RESOLUTION_MIN_CONFIDENCE ?? '0.78');
const AI_ENABLED = process.env.M10_REVENUE_GRAPH_ENABLED !== 'false';
const WRITE_ENABLED = process.env.M10_REVENUE_GRAPH_WRITE_ENABLED !== 'false';
const PUBLISH_EVENTS = process.env.M10_REVENUE_GRAPH_PUBLISH_EVENTS !== 'false';
const AI_SERVICE_BASE_URL = process.env.M10_AI_SERVICE_BASE_URL ?? 'http://localhost:8000';
let RevenueGraphService = RevenueGraphService_1 = class RevenueGraphService {
    repo;
    events;
    http;
    logger = new common_1.Logger(RevenueGraphService_1.name);
    constructor(repo, events, http) {
        this.repo = repo;
        this.events = events;
        this.http = http;
    }
    async getAccounts(tenantId, opts = {}) {
        const { data, total } = await this.repo.findAccounts(tenantId, opts);
        return {
            data: data.map((a) => ({
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
    async getAccountById(tenantId, accountId) {
        const a = await this.repo.findAccountById(tenantId, accountId);
        if (!a)
            throw new common_1.HttpException(`Account ${accountId} not found`, common_1.HttpStatus.NOT_FOUND);
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
    async getDeals(tenantId, opts = {}) {
        const { data, total } = await this.repo.findDeals(tenantId, opts);
        return {
            data: data.map((d) => this.mapDeal(d)),
            total,
            page: opts.page ?? 1,
            limit: opts.limit ?? 20,
        };
    }
    async getDealById(tenantId, dealId) {
        const d = await this.repo.findDealById(tenantId, dealId);
        if (!d)
            throw new common_1.HttpException(`Deal ${dealId} not found`, common_1.HttpStatus.NOT_FOUND);
        return this.mapDeal(d);
    }
    async getDealRelationship(tenantId, dealId) {
        const d = await this.repo.findDealById(tenantId, dealId);
        if (!d)
            throw new common_1.HttpException(`Deal ${dealId} not found`, common_1.HttpStatus.NOT_FOUND);
        return {
            dealId: d.id,
            dealName: d.name,
            stage: d.stage ?? 'Unknown',
            amount: d.amount ?? undefined,
            account: d.account ? { accountId: d.account.id, name: d.account.name, domain: d.account.domain } : undefined,
            contacts: (d.dealContacts ?? []).map((dc) => ({
                contactId: dc.contact.id,
                name: dc.contact.name ?? undefined,
                email: dc.contact.email,
                role: dc.role ?? undefined,
            })),
            recentActivities: (d.activities ?? []).slice(0, 10).map((a) => ({
                activityId: a.id,
                sourceType: a.sourceType,
                sourcePlatform: a.sourcePlatform ?? undefined,
                occurredAt: a.occurredAt.toISOString(),
                status: a.status,
            })),
        };
    }
    async getContactById(tenantId, contactId) {
        const c = await this.repo.findContactById(tenantId, contactId);
        if (!c)
            throw new common_1.HttpException(`Contact ${contactId} not found`, common_1.HttpStatus.NOT_FOUND);
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
    async getCrmSyncStatus(tenantId) {
        const states = await this.repo.getCrmSyncStates(tenantId);
        return {
            tenantId,
            syncStates: states.map((s) => ({
                crmSource: s.crmSource,
                entityType: s.entityType,
                status: s.status,
                lastSyncedAt: s.lastSyncedAt?.toISOString(),
                recordsSynced: s.recordsSynced,
                errorMessage: s.errorMessage ?? undefined,
            })),
        };
    }
    async triggerCrmSync(tenantId, crmSource, entityTypes) {
        const jobIds = [];
        for (const entityType of entityTypes) {
            await this.repo.upsertCrmSyncState(tenantId, crmSource, entityType, { status: 'syncing' });
            jobIds.push((0, crypto_1.randomUUID)());
        }
        this.logger.log(`CRM sync triggered for tenant ${tenantId}, source ${crmSource}`);
        return { message: `CRM sync initiated for ${entityTypes.join(', ')}`, jobIds };
    }
    async processInteractionLinking(intake) {
        if (!AI_ENABLED) {
            this.logger.warn('Revenue Graph disabled — M10_REVENUE_GRAPH_ENABLED=false');
            return;
        }
        const startMs = Date.now();
        const { tenantId, sourceRecordId, eventId } = intake;
        const idempotencyKey = `${tenantId}:${sourceRecordId}:${eventId}`;
        this.logger.log(`[${idempotencyKey}] Starting entity linking`);
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
        if (activity.status === 'linked' || activity.status === 'linked_low_confidence') {
            this.logger.debug(`[${idempotencyKey}] Already linked — skipping`);
            return;
        }
        try {
            await this.repo.updateActivityStatus(activity.id, 'mapping_in_progress');
            const rulesConfig = await this.repo.getActiveMappingRules(tenantId)
                .then((r) => r?.config ?? {});
            const resolvedContacts = await this.resolveContacts(tenantId, intake);
            const resolvedAccount = await this.resolveAccount(tenantId, intake, resolvedContacts, rulesConfig);
            const resolvedDeal = await this.resolveDeal(tenantId, intake, resolvedAccount, resolvedContacts, rulesConfig);
            let finalLinks = [
                ...resolvedContacts.map(c => ({ entityType: 'contact', entityId: c.id, confidence: c.confidence, signals: c.signals, aiAssisted: false })),
                ...(resolvedAccount ? [{ entityType: 'account', entityId: resolvedAccount.id, confidence: resolvedAccount.confidence, signals: resolvedAccount.signals, aiAssisted: false }] : []),
                ...(resolvedDeal ? [{ entityType: 'deal', entityId: resolvedDeal.id, confidence: resolvedDeal.confidence, signals: resolvedDeal.signals, aiAssisted: false }] : []),
            ];
            const overallConfidence = this.calculateOverallConfidence(resolvedContacts, resolvedAccount, resolvedDeal);
            let aiAssisted = false;
            const needsAi = finalLinks.length === 0 ||
                (resolvedAccount === null && resolvedContacts.length > 0) ||
                overallConfidence === 'low';
            if (AI_ENABLED && needsAi) {
                const aiResult = await this.callAiEntityResolution(tenantId, activity.id, intake, resolvedContacts, resolvedAccount, resolvedDeal);
                if (aiResult) {
                    aiAssisted = true;
                    finalLinks = this.mergeAiResults(finalLinks, aiResult);
                }
            }
            if (WRITE_ENABLED && finalLinks.length > 0) {
                await this.repo.upsertInteractionLinks(tenantId, activity.id, finalLinks);
            }
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
            if (PUBLISH_EVENTS && finalStatus !== 'unresolved') {
                await this.publishEntityLinkedEvent(tenantId, activity, finalLinks, finalConfidence, aiAssisted);
            }
            this.logger.log(`[${idempotencyKey}] Done — status: ${finalStatus}, confidence: ${finalConfidence}, links: ${finalLinks.length}, ${processingMs}ms`);
        }
        catch (error) {
            this.logger.error(`[${idempotencyKey}] Failed: ${error.message}`);
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
                failureReason: error.message,
            });
            throw error;
        }
    }
    async resolveContacts(tenantId, intake) {
        const results = [];
        const allContacts = await this.repo.listContactsForMatching(tenantId);
        for (const p of intake.participants) {
            if (p.role !== 'external')
                continue;
            if (p.email) {
                const contact = await this.repo.findContactByEmail(tenantId, p.email);
                if (contact) {
                    results.push({ id: contact.id, confidence: 'high', signals: ['email_exact_match'] });
                    continue;
                }
            }
            if (p.name) {
                const ranked = (0, entity_resolution_engine_1.rankContactCandidates)(p.email, p.name, allContacts);
                const { best, ambiguous } = (0, entity_resolution_engine_1.pickBestCandidate)(ranked);
                if (best && !ambiguous && !results.find(r => r.id === best.id)) {
                    results.push({
                        id: best.id,
                        confidence: best.confidence,
                        signals: [...best.signals, 'layer2_fuzzy_contact'],
                    });
                }
            }
        }
        for (const crmContactId of intake.crmHints?.contactIds ?? []) {
            const contact = await this.repo.findContactById(tenantId, crmContactId);
            if (contact && !results.find(r => r.id === contact.id)) {
                results.push({ id: contact.id, confidence: 'high', signals: ['crm_hint_contact_id'] });
            }
        }
        return results.slice(0, 20);
    }
    async resolveAccount(tenantId, intake, resolvedContacts, rulesConfig) {
        if (intake.crmHints?.accountId) {
            const account = await this.repo.findAccountById(tenantId, intake.crmHints.accountId);
            if (account)
                return { id: account.id, confidence: 'high', signals: ['crm_hint_account_id'] };
        }
        const ignoredDomains = rulesConfig.ignoredDomains ?? ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'];
        const allAccounts = await this.repo.listAccountsForMatching(tenantId);
        const externalDomains = intake.participants
            .filter(p => p.role === 'external' && p.email?.includes('@'))
            .map(p => (0, entity_resolution_engine_1.extractDomain)(p.email))
            .filter(d => d && !ignoredDomains.includes(d) && !(0, entity_resolution_engine_1.isFreeMailDomain)(d));
        for (const domain of [...new Set(externalDomains)]) {
            const match = allAccounts.find((a) => (a.domain ?? '').toLowerCase() === domain.toLowerCase());
            if (match) {
                return { id: match.id, confidence: 'high', signals: ['email_domain_exact_match'] };
            }
        }
        const companyHints = intake.participants
            .filter(p => p.role === 'external' && p.name)
            .map(p => (0, entity_resolution_engine_1.normalizeName)(p.name))
            .filter(Boolean);
        for (const hint of companyHints) {
            const ranked = (0, entity_resolution_engine_1.rankAccountCandidates)(hint, undefined, allAccounts, { ignoredDomains });
            const { best, ambiguous } = (0, entity_resolution_engine_1.pickBestCandidate)(ranked);
            if (best && !ambiguous) {
                return {
                    id: best.id,
                    confidence: best.confidence,
                    signals: [...best.signals, 'layer2_fuzzy_account'],
                };
            }
        }
        const contactRows = await this.repo.listContactsForMatching(tenantId);
        const linked = resolvedContacts
            .map(rc => contactRows.find((c) => c.id === rc.id))
            .filter(Boolean);
        const inferredId = (0, entity_resolution_engine_1.inferAccountFromContacts)(linked);
        if (inferredId) {
            return {
                id: inferredId,
                confidence: 'medium',
                signals: ['layer3_contact_account_inference'],
            };
        }
        return null;
    }
    async resolveDeal(tenantId, intake, resolvedAccount, resolvedContacts, rulesConfig) {
        if (intake.crmHints?.dealId) {
            const { data: deals } = await this.repo.findDeals(tenantId, {});
            const deal = deals.find((d) => d.id === intake.crmHints.dealId);
            if (deal)
                return { id: deal.id, confidence: 'high', signals: ['crm_hint_deal_id'] };
        }
        if (resolvedAccount) {
            const openDeals = await this.repo.findOpenDealsByAccount(tenantId, resolvedAccount.id);
            const preferOpen = rulesConfig.preferOpenDeals !== false;
            if (preferOpen && openDeals.length === 1) {
                return { id: openDeals[0].id, confidence: 'high', signals: ['single_open_deal_on_account'] };
            }
            else if (openDeals.length > 1) {
                return { id: openDeals[0].id, confidence: 'medium', signals: ['most_recent_open_deal_on_account', 'ambiguous_multiple_open_deals'] };
            }
        }
        if (resolvedContacts.length > 0 && !resolvedAccount) {
            const contactRows = await this.repo.listContactsForMatching(tenantId);
            for (const rc of resolvedContacts) {
                const row = contactRows.find((c) => c.id === rc.id);
                if (row?.accountId) {
                    const openDeals = await this.repo.findOpenDealsByAccount(tenantId, row.accountId);
                    if (openDeals.length === 1) {
                        return { id: openDeals[0].id, confidence: 'medium', signals: ['layer3_deal_via_contact_account'] };
                    }
                }
            }
        }
        return null;
    }
    calculateOverallConfidence(contacts, account, deal) {
        const score = (l) => l === 'high' ? 1.0 : l === 'medium' ? 0.65 : 0.35;
        const scores = [
            ...contacts.map(c => score(c.confidence)),
            ...(account ? [score(account.confidence)] : []),
            ...(deal ? [score(deal.confidence)] : []),
        ];
        if (scores.length === 0)
            return 'low';
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
        return avg >= MIN_CONFIDENCE ? 'high' : avg >= 0.5 ? 'medium' : 'low';
    }
    async callAiEntityResolution(tenantId, activityId, intake, contacts, account, deal) {
        try {
            const body = revenue_graph_schema_1.AiResolutionRequestSchema.parse({
                tenantId, activityId,
                transcriptId: intake.artifacts.transcriptId,
                participants: intake.participants,
                candidateAccounts: account ? [{ id: account.id, name: 'unknown' }] : [],
                candidateDeals: deal ? [{ id: deal.id, name: 'unknown' }] : [],
                candidateContacts: contacts.map(c => ({ id: c.id, email: 'unknown' })),
            });
            const response = await (0, rxjs_1.firstValueFrom)(this.http.post(`${AI_SERVICE_BASE_URL}/v1/resolve-entities`, body, { timeout: 10000 }));
            const parsed = revenue_graph_schema_1.AiResolutionResponseSchema.safeParse(response.data);
            return parsed.success ? parsed.data : null;
        }
        catch (err) {
            this.logger.warn(`AI resolution failed (non-fatal): ${err.message}`);
            return null;
        }
    }
    mergeAiResults(existing, ai) {
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
    async publishEntityLinkedEvent(tenantId, activity, links, confidence, aiAssisted) {
        const accountLink = links.find(l => l.entityType === 'account');
        const dealLink = links.find(l => l.entityType === 'deal');
        const contactLinks = links.filter(l => l.entityType === 'contact');
        await this.events.publish(revenue_graph_events_1.M10_REVENUE_GRAPH_EVENTS.PUBLISHED.ENTITY_LINKED, {
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
        this.logger.log(`Published ${revenue_graph_events_1.M10_REVENUE_GRAPH_EVENTS.PUBLISHED.ENTITY_LINKED} — activity ${activity.id}`);
    }
    mapDeal(d) {
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
            contacts: (d.dealContacts ?? []).map((dc) => ({
                contactId: dc.contact.id,
                name: dc.contact.name ?? undefined,
                email: dc.contact.email,
            })),
            recentActivities: (d.activities ?? []).map((a) => ({
                activityId: a.id,
                sourceType: a.sourceType,
                sourcePlatform: a.sourcePlatform ?? undefined,
                occurredAt: a.occurredAt.toISOString(),
                status: a.status,
            })),
        };
    }
};
exports.RevenueGraphService = RevenueGraphService;
exports.RevenueGraphService = RevenueGraphService = RevenueGraphService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [revenue_graph_repository_1.RevenueGraphRepository,
        event_publisher_service_1.EventPublisherService,
        axios_1.HttpService])
], RevenueGraphService);
//# sourceMappingURL=revenue-graph.service.js.map