"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.M09CoachingTrainingModule = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const m09_controller_1 = require("./controllers/m09.controller");
const m09_service_1 = require("./services/m09.service");
const m09_worker_1 = require("./workers/m09.worker");
const m09_repository_1 = require("./repositories/m09.repository");
const prisma_module_1 = require("./database/prisma.module");
const event_publisher_module_1 = require("../platform-core/events/event-publisher.module");
let M09CoachingTrainingModule = class M09CoachingTrainingModule {
};
exports.M09CoachingTrainingModule = M09CoachingTrainingModule;
exports.M09CoachingTrainingModule = M09CoachingTrainingModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            event_publisher_module_1.EventPublisherModule,
            bullmq_1.BullModule.registerQueue({ name: 'm09-queue' }),
        ],
        controllers: [m09_controller_1.M09CoachingTrainingController],
        providers: [m09_service_1.M09CoachingTrainingService, m09_worker_1.M09CoachingTrainingWorker, m09_repository_1.M09CoachingTrainingRepository],
        exports: [m09_service_1.M09CoachingTrainingService],
    })
], M09CoachingTrainingModule);
