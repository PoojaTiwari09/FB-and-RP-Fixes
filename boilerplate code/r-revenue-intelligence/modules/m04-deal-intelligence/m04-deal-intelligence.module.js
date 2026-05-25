"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.M04DealIntelligenceModule = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const m04_controller_1 = require("./controllers/m04.controller");
const m04_service_1 = require("./services/m04.service");
const m04_worker_1 = require("./workers/m04.worker");
const m04_repository_1 = require("./repositories/m04.repository");
const prisma_module_1 = require("./database/prisma.module");
const event_publisher_module_1 = require("../platform-core/events/event-publisher.module");
let M04DealIntelligenceModule = class M04DealIntelligenceModule {
};
exports.M04DealIntelligenceModule = M04DealIntelligenceModule;
exports.M04DealIntelligenceModule = M04DealIntelligenceModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            event_publisher_module_1.EventPublisherModule,
            bullmq_1.BullModule.registerQueue({ name: 'm04-queue' }),
        ],
        controllers: [m04_controller_1.M04DealIntelligenceController],
        providers: [m04_service_1.M04DealIntelligenceService, m04_worker_1.M04DealIntelligenceWorker, m04_repository_1.M04DealIntelligenceRepository],
        exports: [m04_service_1.M04DealIntelligenceService],
    })
], M04DealIntelligenceModule);
