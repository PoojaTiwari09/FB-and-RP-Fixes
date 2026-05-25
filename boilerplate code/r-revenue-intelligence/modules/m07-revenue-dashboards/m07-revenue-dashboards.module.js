"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.M07RevenueDashboardsModule = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const m07_controller_1 = require("./controllers/m07.controller");
const m07_service_1 = require("./services/m07.service");
const m07_worker_1 = require("./workers/m07.worker");
const m07_repository_1 = require("./repositories/m07.repository");
const prisma_module_1 = require("./database/prisma.module");
const event_publisher_module_1 = require("../platform-core/events/event-publisher.module");
let M07RevenueDashboardsModule = class M07RevenueDashboardsModule {
};
exports.M07RevenueDashboardsModule = M07RevenueDashboardsModule;
exports.M07RevenueDashboardsModule = M07RevenueDashboardsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            event_publisher_module_1.EventPublisherModule,
            bullmq_1.BullModule.registerQueue({ name: 'm07-queue' }),
        ],
        controllers: [m07_controller_1.M07RevenueDashboardsController],
        providers: [m07_service_1.M07RevenueDashboardsService, m07_worker_1.M07RevenueDashboardsWorker, m07_repository_1.M07RevenueDashboardsRepository],
        exports: [m07_service_1.M07RevenueDashboardsService],
    })
], M07RevenueDashboardsModule);
