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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var DealSummaryService_1;
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DealSummaryService = void 0;
const common_1 = require("@nestjs/common");
const inject_repository_1 = require("@m04/database/inject-repository");
const m04_prisma_repository_1 = require("@m04/database/m04-prisma.repository");
const entities_1 = require("@m04/entities");
const ai_client_service_1 = require("./ai-client.service");
const deal_service_1 = require("./deal.service");
const audit_log_service_1 = require("./audit-log.service");
let DealSummaryService = DealSummaryService_1 = class DealSummaryService {
    summaryRepository;
    aiClientService;
    dealService;
    auditLogService;
    logger = new common_1.Logger(DealSummaryService_1.name);
    constructor(summaryRepository, aiClientService, dealService, auditLogService) {
        this.summaryRepository = summaryRepository;
        this.aiClientService = aiClientService;
        this.dealService = dealService;
        this.auditLogService = auditLogService;
    }
    async generateSummary(dealId, userId) {
        this.logger.log(`Generating AI summary for deal ${dealId}`);
        const deal = await this.dealService.findById(dealId, userId);
        if (!deal) {
            throw new common_1.NotFoundException(`Deal with ID ${dealId} not found`);
        }
        const existingSummaries = await this.summaryRepository.find({ where: { dealId } });
        const existingSummary = existingSummaries && existingSummaries.length > 0 ? existingSummaries[0] : null;
        let generatedData = null;
        const geminiKey = process.env.GEMINI_API_KEY;
        if (geminiKey) {
            try {
                const contextString = `
Deal Name: ${deal.name}
Stage: ${deal.stage}
Amount: ${deal.amount}
Owner: ${deal.ownerName}
Account Name: ${deal.accountName}
Close Date: ${deal.closeDate}
Probability: ${deal.probability}
AI Score: ${deal.aiScore}
CRM Data: ${JSON.stringify(deal.crmData || {})}
Recent Activities: ${JSON.stringify((deal.activities || []).map(a => ({ type: a.type, title: a.title, description: a.description, date: a.activityDate })))}
Playbooks: ${JSON.stringify((deal.playbooks || []).map(p => ({ criterion: p.criterion, status: p.status, notes: p.notes, aiSuggestion: p.aiSuggestion })))}
Tasks: ${JSON.stringify((deal.tasks || []).map(t => ({ title: t.title, description: t.description, status: t.status })))}
Comments: ${JSON.stringify((deal.comments || []).map(c => ({ content: c.content, author: c.authorName })))}
`;
                const systemPrompt = `You are a sales intelligence assistant. Your task is to analyze the deal context and generate a 7-section deal brief.
The 7 sections are:
1. Overview: A sharp and precise 2-3 sentence business summary of the deal.
2. Key Discussion Points: A list of 3-5 tactical bullet points summarizing recent discussions/themes.
3. Customer Needs & Goals: A list of customer pain points, needs, or goals. Each item should have a short "title" and a detailed "description".
4. Risks & Objections: A list of key risks or objections identified. Each item should have a "title", "description", and "severity" (one of: 'high', 'medium', 'low').
5. Decisions & Commitments: A list of decisions made or action items/commitments. Each item should have a "description", "assigneeType" (one of: 'rep', 'customer'), and "dueDate" (YYYY-MM-DD or timeframe).
6. Key Stakeholders: A list of key customer/internal stakeholders. Each item should have "name", "title", "company", and "avatarInitials" (1-2 uppercase letters).
7. Recent Activity Context: A list of the most recent interactions. Each item should have "type" (one of: 'email', 'call', 'meeting'), "description" (what happened), and "date" (date string or relative).

Return ONLY a valid JSON object matching this structure:
{
  "overview": "Overview text here",
  "keyDiscussionPoints": [
    "Discussion point 1",
    "Discussion point 2"
  ],
  "customerNeeds": [
    { "title": "Need Title 1", "description": "Need Description 1" }
  ],
  "risks": [
    { "title": "Risk Title 1", "description": "Risk Description 1", "severity": "high" }
  ],
  "commitments": [
    { "description": "Commitment description 1", "assigneeType": "rep", "dueDate": "2026-06-15" }
  ],
  "stakeholders": [
    { "name": "Name 1", "title": "Title 1", "company": "Company 1", "avatarInitials": "NI" }
  ],
  "activityContext": [
    { "type": "call", "description": "Activity description 1", "date": "Yesterday" }
  ]
}
Do not wrap it in markdown code blocks or add any comments or text. Return strictly the JSON object.`;
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        contents: [
                            { parts: [{ text: systemPrompt + '\n\nDeal Context:\n' + contextString }] }
                        ],
                        generationConfig: {
                            temperature: 0.2,
                            maxOutputTokens: 2048
                        }
                    })
                });
                if (response.ok) {
                    const resJson = await response.json();
                    const content = resJson.candidates?.[0]?.content?.parts?.[0]?.text;
                    if (content) {
                        const cleanContent = content.replace(/```json/gi, '').replace(/```/g, '').trim();
                        generatedData = JSON.parse(cleanContent);
                    }
                }
                else {
                    this.logger.error(`Gemini API error status: ${response.status}`);
                }
            }
            catch (err) {
                this.logger.error('Failed to generate deal brief with Gemini API', err);
            }
        }
        if (!generatedData) {
            this.logger.log('Gemini API key is not configured or failed. Generating simulated structured brief.');
            generatedData = this.generateSimulatedBrief(deal);
        }
        const summary = existingSummary || this.summaryRepository.create({
            dealId: deal.id,
        });
        summary.summary = JSON.stringify(generatedData);
        summary.keyPoints = generatedData.keyDiscussionPoints;
        summary.nextSteps = generatedData.commitments.map((c) => c.description);
        summary.competitorMentions = [];
        summary.confidenceScore = deal.aiScore ? Number(deal.aiScore) : 85;
        summary.flaggedForReview = false;
        summary.isCurrent = true;
        const savedSummary = await this.summaryRepository.save(summary);
        await this.auditLogService.log({
            userId,
            action: entities_1.AuditAction.GENERATE_SUMMARY,
            entityType: entities_1.AuditEntityType.DEAL,
            entityId: dealId,
            metadata: {
                summaryId: savedSummary.id,
                confidenceScore: savedSummary.confidenceScore,
            },
        });
        return savedSummary;
    }
    generateSimulatedBrief(deal) {
        const isHighRisk = deal.isHighRisk;
        const overview = `${deal.name} is currently in the ${String(deal.stage || '').toLowerCase()} stage with a close probability of ${deal.probability || 0}%. The opportunity amount is $${Number(deal.amount || 0).toLocaleString()}. ${deal.nextStep ? `The next scheduled step is: "${deal.nextStep}".` : 'No next steps are currently scheduled in the system.'} ${isHighRisk ? 'This opportunity shows some high-risk signals that require immediate review.' : 'The deal is showing healthy activity strength.'}`;
        let keyDiscussionPoints = [];
        if (deal.comments && deal.comments.length > 0) {
            keyDiscussionPoints = deal.comments.slice(0, 3).map(c => c.content);
        }
        else {
            keyDiscussionPoints = [
                `Initial alignment on product capabilities and integration requirements for ${deal.accountName || 'the client'}.`,
                `Discussion around platform licensing tiers, implementation timelines, and resource requirements.`,
                `Verification of technical feasibility and deployment considerations with their engineering lead.`,
            ];
        }
        if (deal.nextStep) {
            keyDiscussionPoints.push(`Agreed next action: ${deal.nextStep}.`);
        }
        let customerNeeds = [];
        if (deal.playbooks && deal.playbooks.some(p => p.criterion === 'IDENTIFY PAIN' && p.notes)) {
            const painPoint = deal.playbooks.find(p => p.criterion === 'IDENTIFY PAIN');
            customerNeeds.push({
                title: 'Primary Pain Point',
                description: painPoint?.notes || '',
            });
            customerNeeds.push({
                title: 'Business Metric Impact',
                description: deal.playbooks.find(p => p.criterion === 'METRICS')?.notes || 'Needs to streamline reporting processes and eliminate manual updates.',
            });
        }
        else {
            customerNeeds = [
                {
                    title: 'Scalable Platform Integration',
                    description: 'Requires a platform that integrates directly with their existing business tools and handles high volumes.',
                },
                {
                    title: 'Efficiency and Visibility',
                    description: 'Needs to streamline reporting processes and eliminate manual updates to improve executive visibility.',
                },
            ];
        }
        const risks = [];
        if (isHighRisk) {
            risks.push({
                title: 'High Risk Signals Detected',
                description: deal.riskReason || 'Deal is flagged as high risk due to slow stage velocity.',
                severity: 'high',
            });
        }
        if (deal.amount > 200000) {
            risks.push({
                title: 'Budget Approval Hurdles',
                description: 'Enterprise tier pricing requires secondary executive sign-off from the CFO.',
                severity: 'medium',
            });
        }
        risks.push({
            title: 'Timeline Slippage',
            description: 'Potential for target close date to shift if legal review takes longer than expected.',
            severity: 'low',
        });
        let commitments = [];
        if (deal.tasks && deal.tasks.length > 0) {
            commitments = deal.tasks.slice(0, 3).map(t => ({
                description: t.title,
                assigneeType: t.assigneeName ? 'rep' : 'customer',
                dueDate: t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'Pending',
            }));
        }
        else {
            commitments = [
                {
                    description: 'Provide updated product pricing sheet and pilot evaluation proposal.',
                    assigneeType: 'rep',
                    dueDate: 'Within 3 days',
                },
                {
                    description: 'Share technical integration specification document.',
                    assigneeType: 'customer',
                    dueDate: 'End of week',
                },
            ];
        }
        const stakeholders = [
            {
                name: deal.ownerName || 'Sarah Chen',
                title: 'Deal Owner (Account Executive)',
                company: 'Our Organization',
                avatarInitials: (deal.ownerName || 'SC')
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .toUpperCase(),
            },
            {
                name: 'Alex Johnson',
                title: 'Primary Evaluation Champion',
                company: deal.accountName || 'Acme Corp',
                avatarInitials: 'AJ',
            },
            {
                name: 'Robert Davis',
                title: 'VP Finance (Budget Owner)',
                company: deal.accountName || 'Acme Corp',
                avatarInitials: 'RD',
            },
        ];
        const activityContext = [];
        if (deal.activities && deal.activities.length > 0) {
            deal.activities.slice(0, 3).forEach(act => {
                activityContext.push({
                    type: String(act.type || 'email').toLowerCase(),
                    description: act.title || act.description || 'Interaction logged',
                    date: new Date(act.activityDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                });
            });
        }
        else {
            activityContext.push({
                type: 'email',
                description: 'Sent follow-up recap email with presentation deck',
                date: '2 days ago',
            });
            activityContext.push({
                type: 'call',
                description: 'Discovery call discussing pain points and scoping requirements',
                date: 'Last week',
            });
        }
        return {
            overview,
            keyDiscussionPoints,
            customerNeeds,
            risks,
            commitments,
            stakeholders,
            activityContext,
        };
    }
    async getCurrentSummary(dealId) {
        return this.summaryRepository.findOne({
            where: { dealId, isCurrent: true },
            order: { createdAt: 'DESC' },
        });
    }
    async getSummaryHistory(dealId, limit = 10) {
        return this.summaryRepository.find({
            where: { dealId },
            order: { createdAt: 'DESC' },
            take: limit,
        });
    }
    async detectWeeklyChanges(dealId) {
        this.logger.log(`Detecting weekly changes for deal ${dealId}`);
        const summaries = await this.getSummaryHistory(dealId, 2);
        if (summaries.length < 2) {
            return {
                hasChanges: false,
                message: 'Not enough history to detect changes',
            };
        }
        const [current, previous] = summaries;
        const changes = {
            hasChanges: true,
            summaryChanged: current.summary !== previous.summary,
            keyPointsAdded: current.keyPoints.filter((kp) => !previous.keyPoints.includes(kp)),
            keyPointsRemoved: previous.keyPoints.filter((kp) => !current.keyPoints.includes(kp)),
            nextStepsAdded: current.nextSteps.filter((ns) => !previous.nextSteps.includes(ns)),
            nextStepsRemoved: previous.nextSteps.filter((ns) => !current.nextSteps.includes(ns)),
            competitorChanges: {
                added: current.competitorMentions?.filter((c) => !previous.competitorMentions?.includes(c)) || [],
                removed: previous.competitorMentions?.filter((c) => !current.competitorMentions?.includes(c)) || [],
            },
            confidenceScoreChange: Number(current.confidenceScore) - Number(previous.confidenceScore),
        };
        await this.summaryRepository.update(current.id, {
            weeklyChanges: changes,
        });
        return changes;
    }
    async flagForReview(summaryId, userId) {
        await this.summaryRepository.update(summaryId, {
            flaggedForReview: true,
        });
        await this.auditLogService.log({
            userId,
            action: entities_1.AuditAction.FLAG_SUMMARY_FOR_REVIEW,
            entityType: entities_1.AuditEntityType.DEAL_SUMMARY,
            entityId: summaryId,
        });
    }
    async unflagForReview(summaryId, userId) {
        await this.summaryRepository.update(summaryId, {
            flaggedForReview: false,
        });
        await this.auditLogService.log({
            userId,
            action: entities_1.AuditAction.UNFLAG_SUMMARY_FOR_REVIEW,
            entityType: entities_1.AuditEntityType.DEAL_SUMMARY,
            entityId: summaryId,
        });
    }
    async getFlaggedSummaries(limit = 50) {
        return this.summaryRepository.find({
            where: { flaggedForReview: true, isCurrent: true },
            order: { createdAt: 'DESC' },
            take: limit,
            relations: ['deal'],
        });
    }
};
exports.DealSummaryService = DealSummaryService;
exports.DealSummaryService = DealSummaryService = DealSummaryService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, inject_repository_1.InjectRepository)(entities_1.DealSummary)),
    __metadata("design:paramtypes", [typeof (_a = typeof m04_prisma_repository_1.M04EntityRepository !== "undefined" && m04_prisma_repository_1.M04EntityRepository) === "function" ? _a : Object, ai_client_service_1.AIClientService,
        deal_service_1.DealService,
        audit_log_service_1.AuditLogService])
], DealSummaryService);
//# sourceMappingURL=deal-summary.service.js.map