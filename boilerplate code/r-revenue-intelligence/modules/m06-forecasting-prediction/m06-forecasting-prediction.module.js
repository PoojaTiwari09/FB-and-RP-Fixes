"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.M06ForecastingPredictionModule = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const m06_controller_1 = require("./controllers/m06.controller");
const m06_service_1 = require("./services/m06.service");
const m06_worker_1 = require("./workers/m06.worker");
const m06_repository_1 = require("./repositories/m06.repository");
const prisma_module_1 = require("./database/prisma.module");
const event_publisher_module_1 = require("../platform-core/events/event-publisher.module");
let M06ForecastingPredictionModule = class M06ForecastingPredictionModule {
};
exports.M06ForecastingPredictionModule = M06ForecastingPredictionModule;
exports.M06ForecastingPredictionModule = M06ForecastingPredictionModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            event_publisher_module_1.EventPublisherModule,
            bullmq_1.BullModule.registerQueue({ name: 'm06-queue' }),
        ],
        controllers: [m06_controller_1.M06ForecastingPredictionController],
        providers: [m06_service_1.M06ForecastingPredictionService, m06_worker_1.M06ForecastingPredictionWorker, m06_repository_1.M06ForecastingPredictionRepository],
        exports: [m06_service_1.M06ForecastingPredictionService],
    })
], M06ForecastingPredictionModule);
