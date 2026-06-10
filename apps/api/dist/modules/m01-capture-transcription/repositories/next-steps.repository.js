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
exports.NextStepsRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../database/prisma.service");
let NextStepsRepository = class NextStepsRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findByCallId(callId, tenantId) {
        const transcript = await this.prisma.transcript.findFirst({
            where: { callId, tenantId },
            select: { nextSteps: true },
        });
        return transcript?.nextSteps ?? [];
    }
    async addNextStep(callId, tenantId, step) {
        const current = await this.findByCallId(callId, tenantId);
        const updated = await this.prisma.transcript.updateMany({
            where: { callId, tenantId },
            data: { nextSteps: [...current, step] },
        });
        if (updated.count === 0) {
            throw new common_1.NotFoundException(`Transcript for call ${callId} not found or access denied`);
        }
        return [...current, step];
    }
    async updateNextStep(callId, tenantId, index, step) {
        const current = await this.findByCallId(callId, tenantId);
        if (index < 0 || index >= current.length) {
            throw new common_1.NotFoundException(`Next step at index ${index} not found for call ${callId}`);
        }
        const updated = [...current];
        updated[index] = step;
        await this.prisma.transcript.updateMany({
            where: { callId, tenantId },
            data: { nextSteps: updated },
        });
        return updated;
    }
    async deleteNextStep(callId, tenantId, index) {
        const current = await this.findByCallId(callId, tenantId);
        if (index < 0 || index >= current.length) {
            throw new common_1.NotFoundException(`Next step at index ${index} not found for call ${callId}`);
        }
        const updated = current.filter((_, i) => i !== index);
        await this.prisma.transcript.updateMany({
            where: { callId, tenantId },
            data: { nextSteps: updated },
        });
        return updated;
    }
    async replaceAll(callId, tenantId, nextSteps) {
        await this.prisma.transcript.updateMany({
            where: { callId, tenantId },
            data: { nextSteps },
        });
        return nextSteps;
    }
};
exports.NextStepsRepository = NextStepsRepository;
exports.NextStepsRepository = NextStepsRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], NextStepsRepository);
//# sourceMappingURL=next-steps.repository.js.map