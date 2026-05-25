"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.M03AiSummariesGenaiModule = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const m03_controller_1 = require("./controllers/m03.controller");
const m03_service_1 = require("./services/m03.service");
const m03_worker_1 = require("./workers/m03.worker");
const m03_repository_1 = require("./repositories/m03.repository");
const prisma_module_1 = require("./database/prisma.module");
const event_publisher_module_1 = require("../platform-core/events/event-publisher.module");
let M03AiSummariesGenaiModule = class M03AiSummariesGenaiModule {
};
exports.M03AiSummariesGenaiModule = M03AiSummariesGenaiModule;
exports.M03AiSummariesGenaiModule = M03AiSummariesGenaiModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            event_publisher_module_1.EventPublisherModule,
            bullmq_1.BullModule.registerQueue({ name: 'm03-queue' }),
        ],
        controllers: [m03_controller_1.M03AiSummariesGenaiController],
        providers: [m03_service_1.M03AiSummariesGenaiService, m03_worker_1.M03AiSummariesGenaiWorker, m03_repository_1.M03AiSummariesGenaiRepository],
        exports: [m03_service_1.M03AiSummariesGenaiService],
    })
], M03AiSummariesGenaiModule);
