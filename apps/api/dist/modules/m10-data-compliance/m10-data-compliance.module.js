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
const revenue_graph_module_1 = require("./revenue-graph/revenue-graph.module");
const prisma_module_1 = require("./database/prisma.module");
const event_publisher_module_1 = require("../platform-core/events/event-publisher.module");
const m10_controller_1 = require("./controllers/m10.controller");
const m10_test_controller_1 = require("./controllers/m10-test.controller");
const data_cloud_controller_1 = require("./controllers/data-cloud.controller");
const m10_service_1 = require("./services/m10.service");
const data_cloud_service_1 = require("./services/data-cloud.service");
const export_storage_service_1 = require("./services/export-storage.service");
const warehouse_registry_1 = require("./services/warehouse-registry");
const m10_repository_1 = require("./repositories/m10.repository");
const data_cloud_repository_1 = require("./repositories/data-cloud.repository");
const data_cloud_worker_1 = require("./workers/data-cloud.worker");
const data_cloud_events_1 = require("./events/data-cloud.events");
let M10DataComplianceModule = class M10DataComplianceModule {
};
exports.M10DataComplianceModule = M10DataComplianceModule;
exports.M10DataComplianceModule = M10DataComplianceModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            event_publisher_module_1.EventPublisherModule,
            revenue_graph_module_1.RevenueGraphModule,
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
        controllers: [
            m10_controller_1.M10DataComplianceController,
            m10_test_controller_1.M10TestController,
            data_cloud_controller_1.DataCloudController,
        ],
        providers: [
            m10_service_1.M10DataComplianceService,
            data_cloud_service_1.DataCloudService,
            export_storage_service_1.ExportStorageService,
            warehouse_registry_1.WarehouseRegistry,
            m10_repository_1.M10DataComplianceRepository,
            data_cloud_repository_1.DataCloudRepository,
            data_cloud_worker_1.DataCloudWorker,
        ],
        exports: [
            revenue_graph_module_1.RevenueGraphModule,
            m10_service_1.M10DataComplianceService,
            data_cloud_service_1.DataCloudService,
        ],
    })
], M10DataComplianceModule);
//# sourceMappingURL=m10-data-compliance.module.js.map