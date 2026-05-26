"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.M05AccountIntelligenceModule = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const m05_controller_1 = require("./controllers/m05.controller");
const m05_service_1 = require("./services/m05.service");
const m05_worker_1 = require("./workers/m05.worker");
const m05_repository_1 = require("./repositories/m05.repository");
const prisma_module_1 = require("./database/prisma.module");
const event_publisher_module_1 = require("../platform-core/events/event-publisher.module");
let M05AccountIntelligenceModule = class M05AccountIntelligenceModule {
};
exports.M05AccountIntelligenceModule = M05AccountIntelligenceModule;
exports.M05AccountIntelligenceModule = M05AccountIntelligenceModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            event_publisher_module_1.EventPublisherModule,
            bullmq_1.BullModule.registerQueue({ name: 'm05-queue' }),
        ],
        controllers: [m05_controller_1.M05AccountIntelligenceController],
        providers: [m05_service_1.M05AccountIntelligenceService, m05_worker_1.M05AccountIntelligenceWorker, m05_repository_1.M05AccountIntelligenceRepository],
        exports: [m05_service_1.M05AccountIntelligenceService],
    })
], M05AccountIntelligenceModule);
