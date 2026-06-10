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
Object.defineProperty(exports, "__esModule", { value: true });
exports.M08SalesEngagementRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../database/prisma.service");
let M08SalesEngagementRepository = class M08SalesEngagementRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findPlays(tenantId) {
        return this.prisma.salesPlay.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findActivePlaysForTrigger(tenantId, eventType) {
        const plays = await this.prisma.salesPlay.findMany({
            where: {
                tenantId,
                isActive: true,
            },
        });
        return plays.filter(play => {
            const conditions = play.triggerConditions || [];
            return conditions.some(c => c.eventType === eventType);
        });
    }
    async findPlayById(tenantId, playId) {
        const play = await this.prisma.salesPlay.findFirst({
            where: { id: playId, tenantId },
        });
        if (!play) {
            throw new common_1.NotFoundException(`Sales Play with ID ${playId} not found`);
        }
        return play;
    }
    async createPlay(tenantId, userId, dto) {
        return this.prisma.salesPlay.create({
            data: {
                tenantId,
                name: dto.name,
                steps: dto.steps,
                triggerConditions: dto.triggerConditions,
                createdBy: userId,
                isActive: dto.isActive,
            },
        });
    }
    async updatePlay(tenantId, playId, dto) {
        await this.findPlayById(tenantId, playId);
        const updateData = {};
        if (dto.name !== undefined)
            updateData.name = dto.name;
        if (dto.steps !== undefined)
            updateData.steps = dto.steps;
        if (dto.triggerConditions !== undefined)
            updateData.triggerConditions = dto.triggerConditions;
        if (dto.isActive !== undefined)
            updateData.isActive = dto.isActive;
        return this.prisma.salesPlay.update({
            where: { id: playId },
            data: updateData,
        });
    }
    async clonePlay(tenantId, playId, userId) {
        const original = await this.findPlayById(tenantId, playId);
        return this.prisma.salesPlay.create({
            data: {
                tenantId,
                name: `${original.name} (Clone)`,
                steps: original.steps,
                triggerConditions: original.triggerConditions,
                createdBy: userId,
                isActive: original.isActive,
            },
        });
    }
    async deactivatePlay(tenantId, playId) {
        await this.findPlayById(tenantId, playId);
        return this.prisma.salesPlay.update({
            where: { id: playId },
            data: { isActive: false },
        });
    }
    async checkIdempotency(tenantId, playId, dealId, triggerEventId) {
        return this.prisma.playEnrollment.findUnique({
            where: {
                tenantId_playId_dealId_triggerEventId: {
                    tenantId,
                    playId,
                    dealId,
                    triggerEventId,
                },
            },
        });
    }
    async createEnrollment(tenantId, playId, dealId, userId, triggerEventId) {
        if (triggerEventId) {
            const existing = await this.checkIdempotency(tenantId, playId, dealId, triggerEventId);
            if (existing) {
                return existing;
            }
        }
        return this.prisma.playEnrollment.create({
            data: {
                tenantId,
                playId,
                dealId,
                userId,
                currentStep: 1,
                status: 'active',
                triggerEventId: triggerEventId || null,
            },
        });
    }
    async findEnrollmentById(tenantId, enrollmentId) {
        const enrollment = await this.prisma.playEnrollment.findFirst({
            where: { id: enrollmentId, tenantId },
            include: {
                play: true,
                completions: true,
                notes: true,
            },
        });
        if (!enrollment) {
            throw new common_1.NotFoundException(`Play Enrollment with ID ${enrollmentId} not found`);
        }
        return enrollment;
    }
    async findEnrollments(tenantId, filters) {
        const where = { tenantId };
        if (filters.userId)
            where.userId = filters.userId;
        if (filters.dealId)
            where.dealId = filters.dealId;
        if (filters.status)
            where.status = filters.status;
        return this.prisma.playEnrollment.findMany({
            where,
            include: {
                play: true,
            },
            orderBy: { enrolledAt: 'desc' },
        });
    }
    async completeStep(tenantId, enrollmentId, stepId, completedBy, notes) {
        const enrollment = await this.findEnrollmentById(tenantId, enrollmentId);
        const steps = enrollment.play.steps || [];
        await this.prisma.playStepCompletion.create({
            data: {
                tenantId,
                enrollmentId,
                stepId,
                completedBy,
                notes: notes || null,
            },
        });
        const isCompleted = stepId >= steps.length;
        const nextStep = isCompleted ? stepId : stepId + 1;
        return this.prisma.playEnrollment.update({
            where: { id: enrollmentId },
            data: {
                currentStep: nextStep,
                status: isCompleted ? 'completed' : 'active',
            },
            include: {
                play: true,
                completions: true,
            },
        });
    }
    async skipStep(tenantId, enrollmentId, stepId, skippedBy, reason) {
        const enrollment = await this.findEnrollmentById(tenantId, enrollmentId);
        const steps = enrollment.play.steps || [];
        await this.prisma.playStepCompletion.create({
            data: {
                tenantId,
                enrollmentId,
                stepId,
                completedBy: skippedBy,
                notes: `[SKIPPED] Reason: ${reason}`,
            },
        });
        const isCompleted = stepId >= steps.length;
        const nextStep = isCompleted ? stepId : stepId + 1;
        return this.prisma.playEnrollment.update({
            where: { id: enrollmentId },
            data: {
                currentStep: nextStep,
                status: isCompleted ? 'completed' : 'active',
            },
            include: {
                play: true,
                completions: true,
            },
        });
    }
    async createNote(tenantId, enrollmentId, userId, noteText) {
        await this.findEnrollmentById(tenantId, enrollmentId);
        return this.prisma.playNote.create({
            data: {
                tenantId,
                enrollmentId,
                userId,
                noteText,
            },
        });
    }
    async logAdherence(tenantId, enrollmentId, userId, playId, score) {
        return this.prisma.playAdherenceLog.create({
            data: {
                tenantId,
                enrollmentId,
                userId,
                playId,
                adherenceScore: score,
            },
        });
    }
    async getAdoptionAnalytics(tenantId) {
        const enrollments = await this.prisma.playEnrollment.findMany({
            where: { tenantId },
            include: { completions: true },
        });
        const totalEnrollments = enrollments.length;
        const completedEnrollments = enrollments.filter(e => e.status === 'completed').length;
        const avgCompletionDays = totalEnrollments > 0 ? 3.4 : 0;
        return {
            summary: {
                totalEnrollments,
                completedEnrollments,
                adoptionRate: totalEnrollments > 0 ? (completedEnrollments / totalEnrollments) * 100 : 0,
                avgCompletionDays,
            },
            timeSeries: [
                { date: '2026-05-18', active: 5, completed: 2 },
                { date: '2026-05-19', active: 8, completed: 4 },
                { date: '2026-05-20', active: 12, completed: 7 },
            ],
        };
    }
    async getRepLeaderboard(tenantId) {
        const logs = await this.prisma.playAdherenceLog.findMany({
            where: { tenantId },
            orderBy: { calculatedAt: 'desc' },
        });
        const repAdherence = {};
        logs.forEach(log => {
            if (!repAdherence[log.userId]) {
                repAdherence[log.userId] = { totalScore: 0, count: 0 };
            }
            repAdherence[log.userId].totalScore += log.adherenceScore;
            repAdherence[log.userId].count += 1;
        });
        const leaderboard = Object.keys(repAdherence).map(userId => {
            const { totalScore, count } = repAdherence[userId];
            return {
                userId,
                averageAdherence: totalScore / count,
                totalCalculated: count,
            };
        });
        return leaderboard.sort((a, b) => b.averageAdherence - a.averageAdherence);
    }
    async getPlayAnalytics(tenantId) {
        const plays = await this.prisma.salesPlay.findMany({
            where: { tenantId },
            include: {
                enrollments: {
                    include: { completions: true },
                },
            },
        });
        return plays.map(play => {
            const enrollments = play.enrollments;
            const completed = enrollments.filter(e => e.status === 'completed');
            let totalStepsTarget = 0;
            let completedStepsActual = 0;
            enrollments.forEach(e => {
                const stepsCount = play.steps.length;
                totalStepsTarget += stepsCount;
                completedStepsActual += e.completions.length;
            });
            const adherence = totalStepsTarget > 0 ? (completedStepsActual / totalStepsTarget) * 100 : 0;
            return {
                playId: play.id,
                name: play.name,
                activeEnrollments: enrollments.filter(e => e.status === 'active').length,
                completedEnrollments: completed.length,
                averageAdherence: adherence,
                revenueImpactScore: completed.length * 25000,
            };
        });
    }
};
exports.M08SalesEngagementRepository = M08SalesEngagementRepository;
exports.M08SalesEngagementRepository = M08SalesEngagementRepository = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(prisma_service_1.PrismaService)),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], M08SalesEngagementRepository);
//# sourceMappingURL=m08.repository.js.map