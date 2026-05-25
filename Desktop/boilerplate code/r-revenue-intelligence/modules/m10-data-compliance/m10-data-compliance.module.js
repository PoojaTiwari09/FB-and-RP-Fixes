"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.M10DataComplianceModule = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const m10_controller_1 = require("./controllers/m10.controller");
const m10_service_1 = require("./services/m10.service");
const m10_worker_1 = require("./workers/m10.worker");
const m10_repository_1 = require("./repositories/m10.repository");
const prisma_module_1 = require("./database/prisma.module");
const event_publisher_module_1 = require("../platform-core/events/event-publisher.module");
let M10DataComplianceModule = class M10DataComplianceModule {
};
exports.M10DataComplianceModule = M10DataComplianceModule;
exports.M10DataComplianceModule = M10DataComplianceModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            event_publisher_module_1.EventPublisherModule,
            bullmq_1.BullModule.registerQueue({ name: 'm10-queue' }),
        ],
        controllers: [m10_controller_1.M10DataComplianceController],
        providers: [m10_service_1.M10DataComplianceService, m10_worker_1.M10DataComplianceWorker, m10_repository_1.M10DataComplianceRepository],
        exports: [m10_service_1.M10DataComplianceService],
    })
], M10DataComplianceModule);
