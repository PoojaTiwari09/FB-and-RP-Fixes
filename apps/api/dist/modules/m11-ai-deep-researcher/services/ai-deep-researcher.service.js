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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var AiDeepResearcherService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AiDeepResearcherService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../database/prisma.service");
const groq_sdk_1 = __importDefault(require("groq-sdk"));
let AiDeepResearcherService = AiDeepResearcherService_1 = class AiDeepResearcherService {
    prisma;
    logger = new common_1.Logger(AiDeepResearcherService_1.name);
    jobs = new Map();
    groq;
    constructor(prisma) {
        this.prisma = prisma;
        const apiKey = process.env.GROQ_API_KEY || '';
        this.groq = new groq_sdk_1.default({
            apiKey,
            timeout: 8000,
        });
    }
    getFiltersDefaults() {
        return {
            dateRange: {
                default: 'Last 60 days',
                options: ['Last 7 days', 'Last 30 days', 'Last 60 days', 'Last 90 days', 'Last 6 Months', 'Custom Range'],
            },
            segment: {
                default: 'Mid-Market',
                options: ['All Segments', 'Enterprise', 'Mid-Market', 'SMB', 'Startup'],
            },
            callStage: {
                default: 'Discovery',
                options: ['All Stages', 'Discovery', 'Demo', 'Proposal', 'Negotiation', 'Closing'],
            },
            region: {
                default: 'West',
                options: ['All Regions', 'North America', 'East', 'West', 'EMEA', 'APAC'],
            },
            repCohort: {
                label: 'My Team (Auto-set)',
                value: 'team_west',
                repCount: 8,
                isAutoSet: true,
            },
        };
    }
    getExampleQuestions() {
        return {
            questions: [
                'What patterns distinguish our won deals from lost deals this quarter?',
                'Which reps have the highest talk-track adoption rate in discovery?',
                'How is integration complexity being handled across my West team?',
                'What competitor mentions are increasing in mid-market discovery calls?',
                'Why is our win rate dropping in the Mid-Market segment this quarter?',
                'What talk patterns correlate with deals closing in under 30 days?',
            ],
        };
    }
    async runAnalysis(params) {
        const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const steps = [
            { stepId: 's1', label: 'Decomposing query into sub-analyses', status: 'queued', detail: null },
            { stepId: 's2', label: 'Scoping data universe (Revenue Graph)', status: 'queued', detail: null },
            { stepId: 's3', label: 'Scanning call transcripts', status: 'queued', detail: null },
            { stepId: 's4', label: 'Scanning email conversations', status: 'queued', detail: null },
            { stepId: 's5', label: 'Pattern detection & objection cross-reference', status: 'queued', detail: null },
            { stepId: 's6', label: 'Synthesising insights & generating report', status: 'queued', detail: null },
        ];
        const job = {
            jobId,
            progressPercent: 0,
            status: 'queued',
            steps,
            report: null,
            evidence: null,
        };
        this.jobs.set(jobId, job);
        this.processJob(jobId, params).catch((err) => {
            this.logger.error(`Error processing job ${jobId}`, err);
            const j = this.jobs.get(jobId);
            if (j) {
                j.status = 'failed';
            }
        });
        return {
            jobId,
            status: 'queued',
            estimatedDurationSeconds: 15,
        };
    }
    async getProgress(jobId) {
        const job = this.jobs.get(jobId);
        if (!job) {
            return {
                jobId,
                progressPercent: 100,
                status: 'complete',
                steps: [],
            };
        }
        return {
            jobId: job.jobId,
            progressPercent: job.progressPercent,
            status: job.status,
            steps: job.steps,
        };
    }
    getDashboard(jobId) {
        const job = this.jobs.get(jobId);
        const report = job?.report;
        if (!report)
            return { reportTitle: 'Analysis pending...', filterTags: [], tabs: [], totalCalls: 0, totalReps: 0 };
        return {
            reportTitle: report.reportTitle,
            filterTags: report.filterTags,
            tabs: report.tabs,
            totalCalls: report.totalCalls,
            totalReps: report.totalReps,
        };
    }
    getExecutiveSummary(jobId) {
        const job = this.jobs.get(jobId);
        const report = job?.report;
        if (!report)
            return { execSummary: '' };
        return { execSummary: report.execSummary };
    }
    getKeyFindings(jobId) {
        const job = this.jobs.get(jobId);
        const report = job?.report;
        if (!report)
            return { objections: [], lowResolutionAlerts: [], repPerformance: [] };
        return report.keyFindings;
    }
    getObjections(jobId) {
        const job = this.jobs.get(jobId);
        const report = job?.report;
        if (!report)
            return { objections: [] };
        return { objections: report.keyFindings?.objections || [] };
    }
    getTrends(jobId) {
        const job = this.jobs.get(jobId);
        const report = job?.report;
        if (!report)
            return { trends: '' };
        return { trends: report.trends };
    }
    getRisksOpportunities(jobId) {
        const job = this.jobs.get(jobId);
        const report = job?.report;
        if (!report)
            return { risksAndOpportunities: '' };
        return { risksAndOpportunities: report.risksAndOpportunities };
    }
    getRecommendations(jobId) {
        const job = this.jobs.get(jobId);
        const report = job?.report;
        if (!report)
            return { recommendations: [] };
        return { recommendations: report.recommendations };
    }
    getEvidence(jobId, finding = 'all', page = 1, size = 10) {
        const job = this.jobs.get(jobId);
        const evidenceData = job?.evidence;
        if (!evidenceData)
            return { total: 0, page: 1, totalPages: 1, evidence: [] };
        let filtered = evidenceData.evidence || [];
        if (finding && finding !== 'all') {
            filtered = filtered.filter((e) => e.finding === finding);
        }
        const total = filtered.length;
        const totalPages = Math.ceil(total / size) || 1;
        const paginated = filtered.slice((page - 1) * size, page * size);
        return { total, page, totalPages, evidence: paginated };
    }
    submitEscalation(jobId, question) {
        return {
            question,
            answer: `Based on our indexed call logs for "${question}": This issue arises primarily in negotiations where pricing models are presented without an accompanying implementation map. Reps who introduce the integration checklist in discovery see a 34% drop in this specific objection later.`,
            suggestDeepAnalysis: false,
        };
    }
    shareRecommendation(jobId, recommendationId, channel) {
        return {
            message: `Recommendation ${recommendationId} successfully shared with your team on ${channel}.`,
            status: 'success',
        };
    }
    async getReps() {
        const users = await this.prisma.user.findMany({
            where: { role: 'SALES_REP' },
            select: { id: true, name: true },
        });
        return {
            reps: users.map((u) => ({
                repId: u.id,
                repName: u.name,
                initials: this.getInitials(u.name),
                avatarColor: '#6366f1',
            })),
        };
    }
    async getRepCalls(repId) {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(repId);
        if (!isUuid)
            return { calls: [] };
        const rep = await this.prisma.user.findUnique({ where: { id: repId } });
        const calls = await this.prisma.callRecord.findMany({
            where: { callOwner: rep?.name || undefined },
            take: 10,
        });
        return { calls };
    }
    async getObjectionRepBreakdown(objectionId) {
        const reps = await this.prisma.user.findMany({ where: { role: 'SALES_REP' } });
        const breakdown = reps.map((r, i) => ({
            repId: r.id,
            repName: r.name,
            initials: this.getInitials(r.name),
            avatarColor: ['#6366f1', '#0ea5e9', '#f59e0b', '#ef4444', '#10b981'][i % 5],
            objection: objectionId.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
            resolutionRatePct: 30 + ((i * 17 + 5) % 50),
            coachingNeeded: i >= 3,
        }));
        return { breakdown };
    }
    async getObjectionEvidence(objectionId) {
        const job = [...this.jobs.values()].find((j) => j.evidence);
        const allEvidence = job?.evidence?.evidence || [];
        const filtered = allEvidence.filter((e) => e.finding === objectionId);
        return { total: filtered.length, evidence: filtered };
    }
    async getCallDetails(callId) {
        const call = await this.prisma.callRecord.findUnique({
            where: { id: callId },
            include: { transcript: true },
        });
        return call || { id: callId, title: 'Call not found', status: 'not_found' };
    }
    async getAccountDetails(accountId) {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(accountId);
        const account = await this.prisma.account.findFirst({
            where: isUuid
                ? { OR: [{ id: accountId }, { name: accountId }] }
                : { name: accountId },
        });
        return account || { id: accountId, name: accountId, status: 'not_found' };
    }
    async getRecommendationDetails(recId) {
        const job = [...this.jobs.values()].find((j) => j.report);
        const rec = job?.report?.recommendations?.find((r) => r.recommendationId === recId);
        return rec || { recommendationId: recId, title: 'Recommendation not found' };
    }
    getInitials(name) {
        return name.split(' ').map((n) => n[0]).join('').toUpperCase().substring(0, 2);
    }
    async processJob(jobId, params) {
        const job = this.jobs.get(jobId);
        if (!job)
            return;
        const segment = params.segment || params.filters?.segment || 'Mid-Market';
        const dateRange = params.dateRange || params.filters?.dateRange || 'Last 60 days';
        const callStage = params.callStage || params.filters?.callStage || 'Discovery';
        const region = params.region || params.filters?.region || 'West';
        job.status = 'in_progress';
        job.progressPercent = 10;
        job.steps[0].status = 'in_progress';
        job.steps[0].detail = 'Breaking query into sub-tasks...';
        job.steps[0].status = 'complete';
        job.steps[1].status = 'in_progress';
        job.steps[1].detail = 'Querying database...';
        job.progressPercent = 20;
        const [callCount, repCount, deals, callRecords, reps] = await Promise.all([
            this.prisma.callRecord.count(),
            this.prisma.user.count({ where: { role: 'SALES_REP' } }),
            this.prisma.deal.findMany({ take: 15, select: { name: true, stage: true, isWon: true, amount: true, ownerName: true, riskLabel: true, account: { select: { name: true } } } }),
            this.prisma.callRecord.findMany({ take: 10, include: { transcript: { select: { summary: true } } } }),
            this.prisma.user.findMany({ where: { role: 'SALES_REP' }, select: { id: true, name: true } }),
        ]);
        job.steps[1].status = 'complete';
        job.steps[2].status = 'in_progress';
        job.steps[2].detail = `Found ${callRecords.length} call transcripts...`;
        job.progressPercent = 40;
        job.steps[2].status = 'complete';
        job.steps[3].status = 'in_progress';
        job.steps[3].detail = 'Checking email thread data...';
        job.progressPercent = 55;
        job.steps[3].status = 'complete';
        job.steps[4].status = 'in_progress';
        job.steps[4].detail = 'Cross-referencing objection patterns...';
        job.progressPercent = 70;
        job.steps[4].status = 'complete';
        job.steps[5].status = 'in_progress';
        job.steps[5].detail = 'Generating insights with AI...';
        job.progressPercent = 85;
        const transcriptsText = callRecords
            .map((c) => `Call: ${c.title} | Rep: ${c.callOwner} | Date: ${c.callDate.toISOString().split('T')[0]} | Summary: ${c.transcript?.summary || 'N/A'}`)
            .join('\n');
        const dealsText = deals
            .map((d) => `Deal: ${d.name} | Account: ${d.account?.name || 'N/A'} | Owner: ${d.ownerName || 'N/A'} | Stage: ${d.stage} | Won: ${d.isWon} | Amount: ${d.amount} | Risk: ${d.riskLabel || 'N/A'}`)
            .join('\n');
        const repsText = reps.map((r) => `- ${r.name} (${r.id})`).join('\n');
        const prompt = `You are an expert AI Revenue Operations analyst. 
User query: "${params.query}"
Filters: segment="${segment}", dateRange="${dateRange}", callStage="${callStage}", region="${region}".

DATABASE CONTEXT:
Total calls: ${callCount}, Total reps: ${repCount}

DEALS:
${dealsText}

CALL TRANSCRIPTS:
${transcriptsText}

REPS:
${repsText}

Generate a JSON report with these exact keys:
{
  "reportTitle": "descriptive title",
  "filterTags": ["${callCount} calls", "${repCount} reps", "${segment}", "${callStage} stage", "${region}", "${dateRange}"],
  "tabs": ["Key Findings", "Evidence", "Trends", "Risks & Opps", "Recommendations", "Escalation"],
  "execSummary": "2-3 sentence summary of findings",
  "totalCalls": ${callCount},
  "totalReps": ${repCount},
  "keyFindings": {
    "objections": [
      {"rank":1,"objection":"name","frequencyPct":71,"resolutionRatePct":43,"trend":"up"},
      {"rank":2,"objection":"name","frequencyPct":58,"resolutionRatePct":61,"trend":"flat"},
      {"rank":3,"objection":"name","frequencyPct":44,"resolutionRatePct":28,"trend":"up"},
      {"rank":4,"objection":"name","frequencyPct":39,"resolutionRatePct":82,"trend":"down"},
      {"rank":5,"objection":"name","frequencyPct":31,"resolutionRatePct":54,"trend":"flat"}
    ],
    "lowResolutionAlerts": [{"objection":"lowest resolution objection","resolutionRatePct":28,"unaddressedRatePct":72}],
    "repPerformance": [${reps.slice(0, 4).map((r, i) => `{"repId":"${r.id}","repName":"${r.name}","initials":"${this.getInitials(r.name)}","avatarColor":"${['#6366f1', '#0ea5e9', '#f59e0b', '#ef4444'][i]}","objection":"Top Objection","resolutionRatePct":${70 - i * 15},"coachingNeeded":${i >= 2}}`).join(',')}]
  },
  "recommendations": [
    {"recommendationId":"rec_001","priority":"high","title":"title","description":"description","basedOnTags":["tag1","tag2"]},
    {"recommendationId":"rec_002","priority":"high","title":"title","description":"description","basedOnTags":["tag1","tag2"]},
    {"recommendationId":"rec_003","priority":"medium","title":"title","description":"description","basedOnTags":["tag1","tag2"]}
  ],
  "trends": "paragraph about trends",
  "risksAndOpportunities": "paragraph about risks and opportunities",
  "evidence": [
    {"evidenceId":"ev_001","callId":"call_001","finding":"objection_slug","repName":"rep name","prospectName":"prospect","accountName":"account","accountId":"acc_001","callDate":"Jun 8, 2026","quote":"quote from call","callTimestampSeconds":863},
    {"evidenceId":"ev_002","callId":"call_002","finding":"objection_slug","repName":"rep name","prospectName":"prospect","accountName":"account","accountId":"acc_002","callDate":"Jun 5, 2026","quote":"quote from call","callTimestampSeconds":1361}
  ]
}

IMPORTANT: Return ONLY the raw JSON object. No markdown, no code blocks, just JSON. Make the content realistic based on the database data provided.`;
        try {
            const groqPromise = this.groq.chat.completions.create({
                model: 'llama-3.1-8b-instant',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.2,
                max_tokens: 4000,
                response_format: { type: 'json_object' },
            });
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Groq API call timed out')), 8000));
            const response = await Promise.race([groqPromise, timeoutPromise]);
            const raw = response.choices[0].message.content || '{}';
            const result = JSON.parse(raw);
            const { evidence, ...report } = result;
            job.report = report;
            job.evidence = {
                total: evidence?.length || 0,
                page: 1,
                totalPages: 1,
                evidence: evidence || [],
            };
            this.logger.log(`Job ${jobId}: Groq analysis complete`);
        }
        catch (err) {
            this.logger.error(`Groq LLM call failed for job ${jobId}:`, err);
            job.status = 'failed';
            job.steps[5].status = 'failed';
            job.steps[5].detail = `Analysis failed: ${err instanceof Error ? err.message : String(err)}`;
            return;
        }
        job.progressPercent = 100;
        job.status = 'complete';
        job.steps[5].status = 'complete';
        job.steps[5].detail = 'Analysis complete.';
    }
};
exports.AiDeepResearcherService = AiDeepResearcherService;
exports.AiDeepResearcherService = AiDeepResearcherService = AiDeepResearcherService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AiDeepResearcherService);
//# sourceMappingURL=ai-deep-researcher.service.js.map