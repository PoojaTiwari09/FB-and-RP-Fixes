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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = __importDefault(require("axios"));
const m03_repository_1 = require("../repositories/m03.repository");
const m03_tenant_util_1 = require("./m03-tenant.util");
let QueryService = class QueryService {
    repo;
    config;
    fastapiUrl;
    constructor(repo, config) {
        this.repo = repo;
        this.config = config;
        this.fastapiUrl =
            this.config?.get?.('FASTAPI_URL') ||
                process.env.FASTAPI_URL ||
                'http://localhost:8000';
    }
    useLocalFallback() {
        const flag = process.env.M03_USE_LOCAL_FALLBACK;
        if (flag === 'false')
            return false;
        if (flag === 'true')
            return true;
        return process.env.M03_REQUIRE_FASTAPI !== 'true';
    }
    formatErr(err) {
        if (axios_1.default.isAxiosError(err)) {
            return err.code || err.message || `HTTP ${err.response?.status ?? 'unreachable'}`;
        }
        if (err instanceof Error)
            return err.message || err.name;
        return String(err);
    }
    async processQuery(params) {
        if (this.useLocalFallback()) {
            return this.mockAnswer(params);
        }
        try {
            const response = await axios_1.default.post(`${this.fastapiUrl}/api/v1/query`, {
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
        }
        catch (err) {
            console.warn(`[M03 Query] FastAPI unavailable at ${this.fastapiUrl}, using mock — ${this.formatErr(err)}`);
            return this.mockAnswer(params);
        }
    }
    async mockAnswer(params) {
        const tid = (0, m03_tenant_util_1.resolveM03TenantId)(params.orgId);
        const ws = await this.repo.getWorkspace(tid);
        const calls = ws.calls || [];
        const primary = (params.contextId && calls.find((c) => c.id === params.contextId)) ||
            calls[0] ||
            null;
        const title = primary?.title || 'Recent call';
        const transcript = (primary?.transcript || '').trim();
        const snippet = transcript.length > 320 ? `${transcript.slice(0, 320)}…` : transcript;
        const q = params.query.toLowerCase();
        let focus = 'recent CRM and conversation activity';
        if (q.includes('objection'))
            focus = 'buyer objections and risk signals';
        else if (q.includes('last call') || q.includes('john'))
            focus = 'the most recent customer call';
        else if (q.includes('acme') || q.includes('deal'))
            focus = 'deal momentum and stakeholder alignment';
        const bullets = [];
        if (transcript) {
            const sentences = transcript.split(/(?<=[.!?])\s+/).filter((s) => s.length > 20).slice(0, 3);
            bullets.push(...sentences.map((s) => `- ${s}`));
        }
        else {
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
};
exports.QueryService = QueryService;
exports.QueryService = QueryService = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [m03_repository_1.M03AiSummariesGenaiRepository,
        config_1.ConfigService])
], QueryService);
//# sourceMappingURL=query.service.js.map