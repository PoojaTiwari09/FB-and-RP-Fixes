"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.M02ConversationIntelligenceModule = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const m02_controller_1 = require("./controllers/m02.controller");
const m02_service_1 = require("./services/m02.service");
const m02_worker_1 = require("./workers/m02.worker");
const m02_repository_1 = require("./repositories/m02.repository");
const prisma_module_1 = require("./database/prisma.module");
const event_publisher_module_1 = require("../platform-core/events/event-publisher.module");
let M02ConversationIntelligenceModule = class M02ConversationIntelligenceModule {
};
exports.M02ConversationIntelligenceModule = M02ConversationIntelligenceModule;
exports.M02ConversationIntelligenceModule = M02ConversationIntelligenceModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            event_publisher_module_1.EventPublisherModule,
            bullmq_1.BullModule.registerQueue({ name: 'm02-queue' }),
        ],
        controllers: [m02_controller_1.M02ConversationIntelligenceController],
        providers: [m02_service_1.M02ConversationIntelligenceService, m02_worker_1.M02ConversationIntelligenceWorker, m02_repository_1.M02ConversationIntelligenceRepository],
        exports: [m02_service_1.M02ConversationIntelligenceService],
    })
], M02ConversationIntelligenceModule);
