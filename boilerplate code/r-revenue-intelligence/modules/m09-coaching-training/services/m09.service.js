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
exports.M09CoachingTrainingService = void 0;
const common_1 = require("@nestjs/common");
const m09_repository_1 = require("../repositories/m09.repository");
const event_publisher_service_1 = require("../../platform-core/events/event-publisher.service");
let M09CoachingTrainingService = class M09CoachingTrainingService {
    constructor(repo, events) {
        this.repo = repo;
        this.events = events;
    }
    async findAll(tenantId) {
        return this.repo.findAll(tenantId);
    }
    async create(dto, tenantId) {
        const record = await this.repo.create({ ...dto, tenantId });
        await this.events.publish('coaching.recommendation.created', { tenantId, recordId: record.id });
        return record;
    }
};
exports.M09CoachingTrainingService = M09CoachingTrainingService;
exports.M09CoachingTrainingService = M09CoachingTrainingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [m09_repository_1.M09CoachingTrainingRepository,
        event_publisher_service_1.EventPublisherService])
], M09CoachingTrainingService);
