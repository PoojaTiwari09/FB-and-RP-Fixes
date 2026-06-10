"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataCloudModule = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const data_cloud_controller_1 = require("./controllers/data-cloud.controller");
const data_cloud_service_1 = require("./services/data-cloud.service");
const data_cloud_worker_1 = require("./workers/data-cloud.worker");
const data_cloud_repository_1 = require("./repositories/data-cloud.repository");
const data_cloud_events_1 = require("./events/data-cloud.events");
const prisma_service_1 = require("../database/prisma.service");
const export_storage_service_1 = require("./export/export-storage.service");
const warehouse_registry_1 = require("./warehouse/warehouse-registry");
let DataCloudModule = class DataCloudModule {
};
exports.DataCloudModule = DataCloudModule;
exports.DataCloudModule = DataCloudModule = __decorate([
    (0, common_1.Module)({
        imports: [
            bullmq_1.BullModule.registerQueue({
                name: data_cloud_events_1.M10_DATA_CLOUD_QUEUES.EXPORT,
                defaultJobOptions: {
                    attempts: 3,
                    backoff: { type: 'exponential', delay: 3000 },
                    removeOnComplete: { count: 100 },
                    removeOnFail: { count: 200 },
                },
            }),
            bullmq_1.BullModule.registerQueue({ name: 'platform-events' }),
        ],
        controllers: [data_cloud_controller_1.DataCloudController],
        providers: [data_cloud_service_1.DataCloudService, data_cloud_worker_1.DataCloudWorker, data_cloud_repository_1.DataCloudRepository, prisma_service_1.PrismaService, export_storage_service_1.ExportStorageService, warehouse_registry_1.WarehouseRegistry],
        exports: [data_cloud_service_1.DataCloudService],
    })
], DataCloudModule);
//# sourceMappingURL=data-cloud.module.js.map