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
exports.TranscriptRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../database/prisma.service");
const LOW_CONFIDENCE_THRESHOLD = 0.80;
let TranscriptRepository = class TranscriptRepository {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(data) {
        return this.prisma.transcript.create({
            data: {
                tenantId: data.tenantId,
                callId: data.callId,
                fullText: data.fullText,
                assemblyAiJobId: data.assemblyAiJobId,
                utterances: {
                    create: data.utterances.map((u) => ({
                        speaker: u.speaker,
                        text: u.text,
                        startMs: u.startMs,
                        endMs: u.endMs,
                        confidence: u.confidence,
                        isLowConfidence: u.confidence < LOW_CONFIDENCE_THRESHOLD,
                        sequenceIndex: u.sequenceIndex,
                    })),
                },
            },
            include: { utterances: { orderBy: { sequenceIndex: 'asc' } } },
        });
    }
    async patchAiFields(callId, fields) {
        return this.prisma.transcript.update({
            where: { callId },
            data: fields,
        });
    }
    async findByCallId(callId, tenantId) {
        return this.prisma.transcript.findFirst({
            where: { callId, tenantId },
            include: { utterances: { orderBy: { sequenceIndex: 'asc' } } },
        });
    }
};
exports.TranscriptRepository = TranscriptRepository;
exports.TranscriptRepository = TranscriptRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TranscriptRepository);
