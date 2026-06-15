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
Object.defineProperty(exports, "__esModule", { value: true });
exports.M09FrontendTrainingsService = void 0;
const common_1 = require("@nestjs/common");
const zod_1 = require("zod");
const m09_service_1 = require("../services/m09.service");
const m09_repository_1 = require("../repositories/m09.repository");
const m09_frontend_trainings_mapper_1 = require("./m09-frontend-trainings.mapper");
const StartSessionSchema = zod_1.z.object({
    selectedVoiceId: zod_1.z.string().optional(),
    trainingId: zod_1.z.string().optional(),
});
const MessageSchema = zod_1.z.object({
    text: zod_1.z.string().min(1),
    inputType: zod_1.z.enum(['text', 'voice']).optional(),
});
let M09FrontendTrainingsService = class M09FrontendTrainingsService {
    constructor(sessions, scenarios, repo) {
        this.sessions = sessions;
        this.scenarios = scenarios;
        this.repo = repo;
    }
    async listTrainings(userId, orgId, status) {
        const scenarios = await this.scenarios.findAll(orgId);
        const assignments = await this.repo.findAssignmentsByRep(userId, orgId);
        const visibleScenarios = scenarios.filter((s) => {
            const isCustom = s.context_text?.trim().startsWith('{');
            const isAssigned = assignments.some((a) => a.scenario_id === s.id);
            return !isCustom || isAssigned;
        });
        let items = visibleScenarios.map((s) => {
            const a = assignments.find((x) => x.scenario_id === s.id);
            return (0, m09_frontend_trainings_mapper_1.mapTrainingListItem)(s, a);
        });
        if (status && status !== 'all') {
            items = items.filter((i) => i.status === status);
        }
        return { trainings: items };
    }
    async getTraining(trainingId, orgId) {
        const scenario = await this.scenarios.findOne(trainingId, orgId);
        return (0, m09_frontend_trainings_mapper_1.mapTrainingSetup)(scenario);
    }
    async startSession(trainingId, body, userId, orgId) {
        const dto = StartSessionSchema.parse(body);
        const result = await this.sessions.startSession({ scenarioId: trainingId, voiceId: dto.selectedVoiceId, selectedVoiceId: dto.selectedVoiceId }, userId, orgId);
        return {
            sessionId: result.sessionId || result.id,
            status: 'active',
            startedAt: new Date().toISOString(),
        };
    }
    async getSession(trainingId, sessionId, orgId) {
        const session = await this.repo.findSessionById(sessionId, orgId);
        if (session.scenario_id !== trainingId) {
            throw new common_1.NotFoundException('Session not found for this training');
        }
        const messages = typeof session.messages_json === 'string'
            ? JSON.parse(session.messages_json)
            : session.messages_json || [];
        const scenario = await this.scenarios.findOne(trainingId, orgId);
        return (0, m09_frontend_trainings_mapper_1.mapSessionState)(session, scenario, messages);
    }
    async sendMessage(trainingId, sessionId, body, orgId) {
        const dto = MessageSchema.parse(body);
        const session = await this.repo.findSessionById(sessionId, orgId);
        if (session.scenario_id !== trainingId) {
            throw new common_1.NotFoundException('Session not found');
        }
        if (session.lifecycle_status === 'paused') {
            throw new common_1.BadRequestException('Session is paused');
        }
        const result = await this.sessions.sendMessage({ sessionId, message: dto.text, text: dto.text }, orgId);
        const ts = Math.floor((Date.now() - new Date(session.created_at).getTime()) / 1000);
        return {
            userMessage: {
                id: `u_${ts}`,
                sender: 'user',
                text: dto.text,
                timestampSeconds: ts,
            },
            aiResponse: {
                id: `ai_${ts}`,
                sender: 'ai',
                text: result.reply,
                timestampSeconds: ts + 1,
                audioUrl: result.audio ? `data:audio/mp3;base64,${result.audio}` : null,
            },
            scorecardUpdate: { pb_01: 'in-progress' },
        };
    }
    async pauseSession(trainingId, sessionId, orgId) {
        const session = await this.repo.findSessionById(sessionId, orgId);
        if (session.scenario_id !== trainingId)
            throw new common_1.NotFoundException('Session not found');
        const messages = typeof session.messages_json === 'string'
            ? JSON.parse(session.messages_json)
            : session.messages_json || [];
        const elapsed = Math.floor((Date.now() - new Date(session.created_at).getTime()) / 1000);
        await this.repo.updateSessionLifecycle(sessionId, {
            lifecycle_status: 'paused',
            elapsed_seconds: elapsed,
        });
        return { success: true, status: 'paused' };
    }
    async resumeSession(trainingId, sessionId, orgId) {
        const session = await this.repo.findSessionById(sessionId, orgId);
        if (session.scenario_id !== trainingId)
            throw new common_1.NotFoundException('Session not found');
        await this.repo.updateSessionLifecycle(sessionId, { lifecycle_status: 'active' });
        return { success: true, status: 'active' };
    }
    async endSession(trainingId, sessionId, orgId) {
        const session = await this.repo.findSessionById(sessionId, orgId);
        if (session.scenario_id !== trainingId)
            throw new common_1.NotFoundException('Session not found');
        await this.repo.updateSessionLifecycle(sessionId, { lifecycle_status: 'completed' });
        setImmediate(() => {
            this.sessions.endSession(sessionId, orgId).catch(() => undefined);
        });
        return { success: true, status: 'completed' };
    }
    async getResults(trainingId, sessionId, orgId) {
        const session = await this.repo.findSessionById(sessionId, orgId);
        if (session.scenario_id !== trainingId)
            throw new common_1.NotFoundException('Session not found');
        let feedback = session.feedback_json;
        if (typeof feedback === 'string') {
            try {
                feedback = JSON.parse(feedback);
            }
            catch {
                feedback = null;
            }
        }
        return (0, m09_frontend_trainings_mapper_1.mapResults)(session, feedback);
    }
    async getManagerDashboard(orgId) {
        const scenarios = await this.scenarios.findAll(orgId);
        const systemScenarios = scenarios.filter((s) => !s.context_text?.trim().startsWith('{'));
        const allSessions = await this.repo.findAllSessions('rep_01', orgId).catch(() => []);
        return {
            activeTrainings: systemScenarios.slice(0, 3).map((s, i) => ({
                id: s.id,
                repId: 'rep_01',
                repName: 'Sarah Chen',
                trainingTitle: s.persona_name || 'Training',
                assignedDate: new Date().toISOString(),
                dueDateIso: new Date(Date.now() + 14 * 86400000).toISOString(),
            })),
            trainings: systemScenarios.slice(0, 5).map((s) => {
                const scenarioSessions = allSessions.filter((sess) => sess.scenario_id === s.id);
                const lastSessionId = scenarioSessions.length > 0 ? scenarioSessions[0].id : `session_${s.id}`;
                return {
                    id: s.id,
                    repId: 'rep_01',
                    repName: 'Sarah Chen',
                    trainingTitle: s.persona_name || 'Training',
                    completedDate: new Date().toISOString(),
                    overallScore: 82,
                    overallRating: 'Good',
                    lastSessionId,
                    isReassigned: false,
                };
            }),
        };
    }
    async createManagerTraining(body, orgId) {
        const dto = body;
        const created = await this.scenarios.create({
            persona_name: dto.persona?.name || 'Custom Persona',
            persona_type: dto.persona?.jobTitle || 'Decision Maker',
            difficulty: 'medium',
            context_text: JSON.stringify(dto),
            scenario_name: dto.trainingTitle || 'Custom Training',
        }, orgId, 'manager');
        if (dto.repId) {
            await this.repo.bulkCreateAssignments([{
                    rep_id: dto.repId,
                    scenario_id: created.id,
                    manager_id: 'manager',
                    status: 'Pending',
                    deadline: new Date(dto.dueDateIso || Date.now() + 7 * 86400000),
                }]);
        }
        return { success: true, trainingId: created.id };
    }
    async reassignTraining(trainingId, body, orgId) {
        const scenario = await this.scenarios.findOne(trainingId, orgId);
        const newId = `${trainingId}_reassign_${Date.now()}`;
        await this.scenarios.create({
            persona_name: `${scenario.persona_name} (Reassigned)`,
            persona_type: scenario.persona_type,
            difficulty: scenario.difficulty,
            context_text: scenario.context_text,
        }, orgId);
        return { success: true, newTrainingId: newId };
    }
};
exports.M09FrontendTrainingsService = M09FrontendTrainingsService;
exports.M09FrontendTrainingsService = M09FrontendTrainingsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [m09_service_1.SessionsService,
        m09_service_1.ScenariosService,
        m09_repository_1.M09Repository])
], M09FrontendTrainingsService);
//# sourceMappingURL=m09-frontend-trainings.service.js.map