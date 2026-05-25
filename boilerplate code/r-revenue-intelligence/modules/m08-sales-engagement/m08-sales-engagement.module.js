"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.M08SalesEngagementModule = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const m08_controller_1 = require("./controllers/m08.controller");
const m08_service_1 = require("./services/m08.service");
const m08_worker_1 = require("./workers/m08.worker");
const m08_repository_1 = require("./repositories/m08.repository");
const prisma_module_1 = require("./database/prisma.module");
const event_publisher_module_1 = require("../platform-core/events/event-publisher.module");
let M08SalesEngagementModule = class M08SalesEngagementModule {
};
exports.M08SalesEngagementModule = M08SalesEngagementModule;
exports.M08SalesEngagementModule = M08SalesEngagementModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            event_publisher_module_1.EventPublisherModule,
            bullmq_1.BullModule.registerQueue({ name: 'm08-queue' }),
        ],
        controllers: [m08_controller_1.M08SalesEngagementController],
        providers: [m08_service_1.M08SalesEngagementService, m08_worker_1.M08SalesEngagementWorker, m08_repository_1.M08SalesEngagementRepository],
        exports: [m08_service_1.M08SalesEngagementService],
    })
], M08SalesEngagementModule);
