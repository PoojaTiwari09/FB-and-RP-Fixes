"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RevenueGraphModule = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const bullmq_1 = require("@nestjs/bullmq");
const revenue_graph_controller_1 = require("./controllers/revenue-graph.controller");
const revenue_graph_service_1 = require("./services/revenue-graph.service");
const revenue_graph_worker_1 = require("./workers/revenue-graph.worker");
const revenue_graph_repository_1 = require("./repositories/revenue-graph.repository");
const revenue_graph_events_1 = require("./events/revenue-graph.events");
const event_publisher_service_1 = require("../../platform-core/events/event-publisher.service");
const prisma_service_1 = require("../database/prisma.service");
let RevenueGraphModule = class RevenueGraphModule {
};
exports.RevenueGraphModule = RevenueGraphModule;
exports.RevenueGraphModule = RevenueGraphModule = __decorate([
    (0, common_1.Module)({
        imports: [
            axios_1.HttpModule,
            bullmq_1.BullModule.registerQueue({
                name: revenue_graph_events_1.M10_REVENUE_GRAPH_QUEUES.INTAKE,
                defaultJobOptions: {
                    attempts: 3,
                    backoff: { type: 'exponential', delay: 2000 },
                    removeOnComplete: { count: 100 },
                    removeOnFail: { count: 200 },
                },
            }),
            bullmq_1.BullModule.registerQueue({ name: revenue_graph_events_1.M10_REVENUE_GRAPH_QUEUES.DEAL_STAGE }),
            bullmq_1.BullModule.registerQueue({ name: 'platform-events' }),
        ],
        controllers: [revenue_graph_controller_1.RevenueGraphController],
        providers: [revenue_graph_service_1.RevenueGraphService, revenue_graph_worker_1.RevenueGraphWorker, revenue_graph_repository_1.RevenueGraphRepository, event_publisher_service_1.EventPublisherService, prisma_service_1.PrismaService],
        exports: [revenue_graph_service_1.RevenueGraphService],
    })
], RevenueGraphModule);
//# sourceMappingURL=revenue-graph.module.js.map