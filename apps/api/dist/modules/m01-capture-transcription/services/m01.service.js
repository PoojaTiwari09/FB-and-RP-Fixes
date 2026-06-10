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
exports.M01CaptureTranscriptionService = void 0;
const common_1 = require("@nestjs/common");
const m01_repository_1 = require("../repositories/m01.repository");
const event_publisher_service_1 = require("../../platform-core/events/event-publisher.service");
let M01CaptureTranscriptionService = class M01CaptureTranscriptionService {
    repo;
    events;
    constructor(repo, events) {
        this.repo = repo;
        this.events = events;
    }
    async findAll(tenantId) {
        return this.repo.findAll(tenantId);
    }
    async create(dto, tenantId) {
        const record = await this.repo.create({ ...dto, tenantId });
        await this.events.publish('call.transcription.completed', { tenantId, recordId: record.id });
        return record;
    }
};
exports.M01CaptureTranscriptionService = M01CaptureTranscriptionService;
exports.M01CaptureTranscriptionService = M01CaptureTranscriptionService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [m01_repository_1.M01CaptureTranscriptionRepository,
        event_publisher_service_1.EventPublisherService])
], M01CaptureTranscriptionService);
//# sourceMappingURL=m01.service.js.map