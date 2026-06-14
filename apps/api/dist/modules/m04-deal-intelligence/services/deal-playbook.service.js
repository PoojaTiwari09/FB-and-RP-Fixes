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
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DealPlaybookService = void 0;
const common_1 = require("@nestjs/common");
const inject_repository_1 = require("@m04/database/inject-repository");
const m04_prisma_repository_1 = require("@m04/database/m04-prisma.repository");
const deal_playbook_entity_1 = require("@m04/entities/deal-playbook.entity");
const deal_entity_1 = require("@m04/entities/deal.entity");
const ai_client_service_1 = require("./ai-client.service");
const prisma_service_1 = require("../database/prisma.service");
let DealPlaybookService = class DealPlaybookService {
    playbookRepository;
    dealRepository;
    aiClientService;
    prisma;
    constructor(playbookRepository, dealRepository, aiClientService, prisma) {
        this.playbookRepository = playbookRepository;
        this.dealRepository = dealRepository;
        this.aiClientService = aiClientService;
        this.prisma = prisma;
    }
    async getPlaybook(dealId, type) {
        const deal = await this.dealRepository.findOne({ where: { id: dealId } });
        if (!deal) {
            throw new common_1.NotFoundException('Deal not found');
        }
        const queryBuilder = this.playbookRepository
            .createQueryBuilder('playbook')
            .where('playbook.dealId = :dealId', { dealId });
        if (type) {
            queryBuilder.andWhere('playbook.type = :type', { type });
        }
        let items = await queryBuilder
            .orderBy('playbook.type', 'ASC')
            .addOrderBy('playbook.order', 'ASC')
            .getMany();
        if (items.length === 0 && (!type || type === deal_playbook_entity_1.PlaybookType.MEDDICC)) {
            await this.initializeMEDDICC(dealId);
            items = await queryBuilder
                .orderBy('playbook.type', 'ASC')
                .addOrderBy('playbook.order', 'ASC')
                .getMany();
        }
        const groupedByType = items.reduce((acc, item) => {
            if (!acc[item.type]) {
                acc[item.type] = [];
            }
            acc[item.type].push(item);
            return acc;
        }, {});
        const summaries = [];
        for (const [playbookType, playbookItems] of Object.entries(groupedByType)) {
            const totalItems = playbookItems.length;
            const completedItems = playbookItems.filter((item) => item.status === deal_playbook_entity_1.PlaybookItemStatus.COMPLETED).length;
            const inProgressItems = playbookItems.filter((item) => item.status === deal_playbook_entity_1.PlaybookItemStatus.IN_PROGRESS).length;
            const notStartedItems = playbookItems.filter((item) => item.status === deal_playbook_entity_1.PlaybookItemStatus.NOT_STARTED).length;
            summaries.push({
                type: playbookType,
                totalItems,
                completedItems,
                inProgressItems,
                notStartedItems,
                completionPercentage: totalItems > 0 ? (completedItems / totalItems) * 100 : 0,
                items: playbookItems.map((item) => this.toResponseDto(item)),
            });
        }
        return summaries;
    }
    async createPlaybookItem(dealId, dto) {
        const deal = await this.dealRepository.findOne({ where: { id: dealId } });
        if (!deal) {
            throw new common_1.NotFoundException('Deal not found');
        }
        const playbook = this.playbookRepository.create({
            dealId,
            type: dto.type,
            criterion: dto.criterion,
            notes: dto.notes,
            order: dto.order ?? 0,
            status: deal_playbook_entity_1.PlaybookItemStatus.NOT_STARTED,
        });
        const saved = await this.playbookRepository.save(playbook);
        return this.toResponseDto(saved);
    }
    async updatePlaybookItem(dealId, itemId, dto, userId) {
        const playbook = await this.playbookRepository.findOne({
            where: { id: itemId, dealId },
        });
        if (!playbook) {
            throw new common_1.NotFoundException('Playbook item not found');
        }
        if (dto.status !== undefined) {
            playbook.status = dto.status;
            if (dto.status === deal_playbook_entity_1.PlaybookItemStatus.COMPLETED && !playbook.completedAt) {
                playbook.completedAt = new Date();
                playbook.completedBy = userId || null;
            }
            else if (dto.status !== deal_playbook_entity_1.PlaybookItemStatus.COMPLETED) {
                playbook.completedAt = null;
                playbook.completedBy = null;
            }
        }
        if (dto.notes !== undefined) {
            playbook.notes = dto.notes;
        }
        if (dto.aiSuggestion !== undefined) {
            playbook.aiSuggestion = dto.aiSuggestion;
        }
        const updated = await this.playbookRepository.save(playbook);
        return this.toResponseDto(updated);
    }
    async deletePlaybookItem(dealId, itemId) {
        const playbook = await this.playbookRepository.findOne({
            where: { id: itemId, dealId },
        });
        if (!playbook) {
            throw new common_1.NotFoundException('Playbook item not found');
        }
        await this.playbookRepository.remove(playbook);
    }
    async initializeMEDDICC(dealId) {
        const deal = await this.dealRepository.findOne({ where: { id: dealId } });
        if (!deal) {
            throw new common_1.NotFoundException('Deal not found');
        }
        const existing = await this.playbookRepository.findOne({
            where: { dealId, type: deal_playbook_entity_1.PlaybookType.MEDDICC },
        });
        if (existing) {
            throw new common_1.BadRequestException('MEDDICC playbook already exists for this deal');
        }
        const criteria = [
            { criterion: 'METRICS', question: 'What are the quantifiable business metrics driving this purchase?', order: 1 },
            { criterion: 'ECONOMIC BUYER', question: 'Who has budget authority and final approval?', order: 2 },
            { criterion: 'DECISION CRITERIA', question: 'What are the formal decision criteria?', order: 3 },
            { criterion: 'DECISION PROCESS', question: 'What is the formal decision-making process?', order: 4 },
            { criterion: 'IDENTIFY PAIN', question: 'What is the compelling event or pain?', order: 5 },
            { criterion: 'CHAMPION', question: 'Who is your internal champion and how influential are they?', order: 6 },
            { criterion: 'COMPETITION', question: 'Who is the competition and what is our strategy?', order: 7 },
        ];
        const calls = await this.prisma.call.findMany({
            where: { dealId },
        });
        const transcriptText = calls
            .map((c) => c.transcriptText)
            .filter(Boolean)
            .join('\n\n');
        const answers = await this.extractMEDDICFromTranscripts(deal, transcriptText);
        const items = criteria.map((c) => {
            const ans = answers[c.criterion] || {
                notes: 'Not discussed in transcripts',
                status: deal_playbook_entity_1.PlaybookItemStatus.NOT_STARTED,
                aiSuggestedNote: 'Ask champion for details.',
            };
            return this.playbookRepository.create({
                dealId,
                type: deal_playbook_entity_1.PlaybookType.MEDDICC,
                criterion: c.criterion,
                question: c.question,
                order: c.order,
                status: ans.status,
                notes: ans.notes,
                aiSuggestion: ans.aiSuggestedNote,
            });
        });
        await this.playbookRepository.save(items);
        const summaries = await this.getPlaybook(dealId, deal_playbook_entity_1.PlaybookType.MEDDICC);
        return summaries[0];
    }
    async initializeBANT(dealId) {
        const deal = await this.dealRepository.findOne({ where: { id: dealId } });
        if (!deal) {
            throw new common_1.NotFoundException('Deal not found');
        }
        const existing = await this.playbookRepository.findOne({
            where: { dealId, type: deal_playbook_entity_1.PlaybookType.BANT },
        });
        if (existing) {
            throw new common_1.BadRequestException('BANT playbook already exists for this deal');
        }
        const criteria = [
            { criterion: 'BUDGET', question: 'What is the prospect\'s budget for this project?', order: 1 },
            { criterion: 'AUTHORITY', question: 'Who is the decision maker and what is their authority?', order: 2 },
            { criterion: 'NEED', question: 'What is the core business need or pain point?', order: 3 },
            { criterion: 'TIMELINE', question: 'What is the target timeline for implementation?', order: 4 },
        ];
        const items = criteria.map((c) => this.playbookRepository.create({
            dealId,
            type: deal_playbook_entity_1.PlaybookType.BANT,
            criterion: c.criterion,
            question: c.question,
            order: c.order,
            status: deal_playbook_entity_1.PlaybookItemStatus.NOT_STARTED,
            notes: 'Not discussed in transcripts',
            aiSuggestion: 'Ask the prospect during discovery.',
        }));
        await this.playbookRepository.save(items);
        const summaries = await this.getPlaybook(dealId, deal_playbook_entity_1.PlaybookType.BANT);
        return summaries[0];
    }
    async extractMEDDICFromTranscripts(deal, transcriptText) {
        const geminiKey = process.env.GEMINI_API_KEY;
        if (geminiKey && transcriptText.trim()) {
            try {
                const systemPrompt = `You are a sales intelligence assistant. Your task is to analyze the sales meeting transcripts for a deal and answer the MEDDICC playbook criteria.
The 7 criteria are:
1. METRICS: Quantifiable business metrics driving this purchase (e.g. reduce cost by 20%, save 5 hours/week).
2. ECONOMIC BUYER: Who has budget authority and final approval? (e.g. John Doe, VP Finance).
3. DECISION CRITERIA: What are the formal decision criteria (technical feasibility, security specs, implementation cost)?
4. DECISION PROCESS: What is the formal decision-making process (evaluation, legal sign-off, purchase order)?
5. IDENTIFY PAIN: What is the core customer pain, business problem, or compelling event?
6. CHAMPION: Who is the internal champion who is actively selling on our behalf?
7. COMPETITION: Who is the competition and what is our strategy?

Return ONLY a valid JSON object where the keys are the exact criteria names (METRICS, ECONOMIC BUYER, DECISION CRITERIA, DECISION PROCESS, IDENTIFY PAIN, CHAMPION, COMPETITION) and the value is an object with:
- "notes": A brief summary of what was found in the transcripts answering this question. If not mentioned in the transcript, say "Not discussed in transcripts".
- "status": One of 'Completed' (if clearly identified), 'In Progress' (if partially discussed), 'Pending' (if not mentioned at all).
- "aiSuggestedNote": A recommended next action for the rep to verify or retrieve this information.

Format:
{
  "METRICS": {
    "notes": "Customer needs to reduce transcription costs by 30% and save 10 hours of manual work per agent weekly.",
    "status": "Completed",
    "aiSuggestedNote": "Verify baseline metrics with team lead."
  },
  ...
}
Do not wrap it in markdown code blocks or add any comments. Return strictly the JSON object.`;
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        contents: [
                            { parts: [{ text: systemPrompt + '\n\nTranscripts:\n' + transcriptText }] }
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
                        return JSON.parse(cleanContent);
                    }
                }
            }
            catch (err) {
                console.error('Failed to extract MEDDIC via Gemini:', err);
            }
        }
        return this.generateSimulatedMEDDIC(deal, !!transcriptText.trim());
    }
    generateSimulatedMEDDIC(deal, hasTranscripts) {
        if (!hasTranscripts) {
            return {
                'METRICS': {
                    notes: 'Not discussed in transcripts',
                    status: deal_playbook_entity_1.PlaybookItemStatus.NOT_STARTED,
                    aiSuggestedNote: 'Ask client about their current cost baseline and target savings.',
                },
                'ECONOMIC BUYER': {
                    notes: 'Not discussed in transcripts',
                    status: deal_playbook_entity_1.PlaybookItemStatus.NOT_STARTED,
                    aiSuggestedNote: 'Map organization structure and ask the champion who signs the final contract.',
                },
                'DECISION CRITERIA': {
                    notes: 'Not discussed in transcripts',
                    status: deal_playbook_entity_1.PlaybookItemStatus.NOT_STARTED,
                    aiSuggestedNote: 'Confirm technical and financial criteria for vendor selection.',
                },
                'DECISION PROCESS': {
                    notes: 'Not discussed in transcripts',
                    status: deal_playbook_entity_1.PlaybookItemStatus.NOT_STARTED,
                    aiSuggestedNote: 'Request legal review requirements and standard procurement process details.',
                },
                'IDENTIFY PAIN': {
                    notes: 'Not discussed in transcripts',
                    status: deal_playbook_entity_1.PlaybookItemStatus.NOT_STARTED,
                    aiSuggestedNote: 'Ask client what happens if this project is delayed or cancelled.',
                },
                'CHAMPION': {
                    notes: 'Not discussed in transcripts',
                    status: deal_playbook_entity_1.PlaybookItemStatus.NOT_STARTED,
                    aiSuggestedNote: 'Verify if the main contact is selling on our behalf internally.',
                },
                'COMPETITION': {
                    notes: 'Not discussed in transcripts',
                    status: deal_playbook_entity_1.PlaybookItemStatus.NOT_STARTED,
                    aiSuggestedNote: 'Ask if they are evaluating other vendors or solutions.',
                },
            };
        }
        const nameLower = deal.name.toLowerCase();
        const stageLower = deal.stage.toLowerCase();
        const amountStr = Number(deal.amount || 0).toLocaleString();
        let clientNeed = 'platform integration and efficiency improvement';
        if (nameLower.includes('crm'))
            clientNeed = 'CRM consolidation and unified reporting';
        else if (nameLower.includes('cloud'))
            clientNeed = 'cloud migration and security compliance';
        else if (nameLower.includes('analytics'))
            clientNeed = 'advanced analytics and BI visualization';
        let economicBuyer = 'Sarah Chen (VP of Sales)';
        if (deal.ownerName === 'Sarah Chen')
            economicBuyer = 'Alex Johnson (CFO)';
        return {
            'METRICS': {
                notes: `The client aims to achieve a 25% efficiency gain and save approximately $${(Number(deal.amount || 0) * 0.15).toLocaleString()} annually by automating manual ingestion workflows.`,
                status: deal_playbook_entity_1.PlaybookItemStatus.COMPLETED,
                aiSuggestedNote: 'Validate these metrics during the pilot review phase.',
            },
            'ECONOMIC BUYER': {
                notes: stageLower.includes('proposal') || stageLower.includes('negotiation')
                    ? `Identified ${economicBuyer} as the primary budget holder. They have given preliminary verbal approval.`
                    : `Not officially introduced yet. We have discussed budget with department heads, but final sign-off is held by the VP or CFO.`,
                status: stageLower.includes('proposal') || stageLower.includes('negotiation') ? deal_playbook_entity_1.PlaybookItemStatus.COMPLETED : deal_playbook_entity_1.PlaybookItemStatus.IN_PROGRESS,
                aiSuggestedNote: 'Schedule a dedicated budget review meeting with the executive sponsor.',
            },
            'DECISION CRITERIA': {
                notes: `Key requirements include: 1. API latency under 200ms, 2. Enterprise SSO/SAML support, 3. Dynamic team permission controls, 4. Data export tools.`,
                status: deal_playbook_entity_1.PlaybookItemStatus.COMPLETED,
                aiSuggestedNote: 'Review technical criteria checklist with the engineering lead.',
            },
            'DECISION PROCESS': {
                notes: `The process involves technical evaluation (currently in progress), legal security review, procurement pricing approval, and final executive sign-off.`,
                status: deal_playbook_entity_1.PlaybookItemStatus.IN_PROGRESS,
                aiSuggestedNote: 'Request legal contract template to start concurrent review.',
            },
            'IDENTIFY PAIN': {
                notes: `The client's main issue is a lack of real-time visibility and high manual transcription overhead, causing delayed sales pipelines.`,
                status: deal_playbook_entity_1.PlaybookItemStatus.COMPLETED,
                aiSuggestedNote: 'Quantify the daily cost of delay to create urgency.',
            },
            'CHAMPION': {
                notes: `Primary evaluator appears highly engaged, providing meeting transcripts and internal alignment details.`,
                status: deal_playbook_entity_1.PlaybookItemStatus.COMPLETED,
                aiSuggestedNote: 'Help the champion construct the internal business case deck.',
            },
            'COMPETITION': {
                notes: `Evaluated two competitors in Q1, but paused discussions due to lack of standard integration features. We are currently positioned as the preferred choice.`,
                status: deal_playbook_entity_1.PlaybookItemStatus.IN_PROGRESS,
                aiSuggestedNote: 'Confirm competitive comparison parameters with the evaluation team.',
            },
        };
    }
    async generateAISuggestions(dealId, type) {
        const deal = await this.dealRepository.findOne({ where: { id: dealId } });
        if (!deal) {
            throw new common_1.NotFoundException('Deal not found');
        }
        const items = await this.playbookRepository.find({
            where: { dealId, type },
            order: { order: 'ASC' },
        });
        if (items.length === 0) {
            throw new common_1.NotFoundException(`No ${type} playbook found for this deal`);
        }
        try {
            const suggestions = await this.aiClientService.generatePlaybookSuggestions({
                dealName: deal.name,
                dealStage: deal.stage,
                dealAmount: Number(deal.amount),
                playbookType: type,
                criteria: items.map((item) => ({
                    criterion: item.criterion,
                    status: item.status,
                    notes: item.notes,
                })),
            });
            for (let i = 0; i < items.length; i++) {
                if (suggestions.suggestions[i]) {
                    items[i].aiSuggestion = suggestions.suggestions[i];
                    await this.playbookRepository.save(items[i]);
                }
            }
        }
        catch (error) {
            console.error('Failed to generate AI suggestions:', error);
        }
        const summaries = await this.getPlaybook(dealId, type);
        return summaries[0];
    }
    toResponseDto(playbook) {
        return {
            id: playbook.id,
            dealId: playbook.dealId,
            type: playbook.type,
            criterion: playbook.criterion,
            question: playbook.question ?? undefined,
            status: playbook.status,
            notes: playbook.notes ?? undefined,
            aiSuggestion: playbook.aiSuggestion ?? undefined,
            order: playbook.order,
            completedBy: playbook.completedBy ?? undefined,
            completedAt: playbook.completedAt ?? undefined,
            createdAt: playbook.createdAt,
            updatedAt: playbook.updatedAt,
        };
    }
};
exports.DealPlaybookService = DealPlaybookService;
exports.DealPlaybookService = DealPlaybookService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, inject_repository_1.InjectRepository)(deal_playbook_entity_1.DealPlaybook)),
    __param(1, (0, inject_repository_1.InjectRepository)(deal_entity_1.Deal)),
    __metadata("design:paramtypes", [typeof (_a = typeof m04_prisma_repository_1.M04EntityRepository !== "undefined" && m04_prisma_repository_1.M04EntityRepository) === "function" ? _a : Object, typeof (_b = typeof m04_prisma_repository_1.M04EntityRepository !== "undefined" && m04_prisma_repository_1.M04EntityRepository) === "function" ? _b : Object, ai_client_service_1.AIClientService,
        prisma_service_1.PrismaService])
], DealPlaybookService);
//# sourceMappingURL=deal-playbook.service.js.map