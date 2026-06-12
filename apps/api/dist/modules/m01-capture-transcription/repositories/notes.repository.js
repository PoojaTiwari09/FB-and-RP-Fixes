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
exports.NotesRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../database/prisma.service");
let NotesRepository = class NotesRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(callId, tenantId, authorId, dto) {
        return this.prisma.callNote.create({
            data: { callId, tenantid: tenantId, authorId, content: dto.content },
        });
    }
    async update(noteId, tenantId, dto) {
        return this.prisma.callNote.update({
            where: { id: noteId },
            data: { content: dto.content },
        });
    }
    async delete(noteId, tenantId) {
        return this.prisma.callNote.delete({ where: { id: noteId } });
    }
    async findByCallId(callId, tenantId, authorId) {
        const where = { callId, tenantid: tenantId };
        if (authorId) {
            where.authorId = authorId;
        }
        return this.prisma.callNote.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });
    }
};
exports.NotesRepository = NotesRepository;
exports.NotesRepository = NotesRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], NotesRepository);
//# sourceMappingURL=notes.repository.js.map