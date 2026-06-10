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
const executive_controller_1 = require("./controllers/executive.controller");
const hubspot_controller_1 = require("./controllers/hubspot.controller");
const admin_forecast_boards_controller_1 = require("./controllers/admin-forecast-boards.controller");
const forecast_boards_controller_1 = require("./controllers/forecast-boards.controller");
const m06_service_1 = require("./services/m06.service");
const forecast_boards_service_1 = require("./services/forecast-boards.service");
const admin_forecast_boards_service_1 = require("./services/admin-forecast-boards.service");
const hubspot_service_1 = require("./services/hubspot.service");
const m06_prediction_queue_service_1 = require("./services/m06-prediction-queue.service");
const m06_worker_1 = require("./workers/m06.worker");
const m06_repository_1 = require("./repositories/m06.repository");
const forecast_boards_repository_1 = require("./repositories/forecast-boards.repository");
const forecast_submitted_listener_1 = require("./listeners/forecast-submitted.listener");
const prisma_module_1 = require("./database/prisma.module");
const event_publisher_module_1 = require("../platform-core/events/event-publisher.module");
const hubspot_integration_module_1 = require("../platform-core/integrations/hubspot-integration.module");
const forecast_upgrade_controller_1 = require("./controllers/forecast-upgrade.controller");
const forecast_upgrade_service_1 = require("./services/forecast-upgrade.service");
let M06ForecastingPredictionModule = class M06ForecastingPredictionModule {
};
exports.M06ForecastingPredictionModule = M06ForecastingPredictionModule;
exports.M06ForecastingPredictionModule = M06ForecastingPredictionModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            event_publisher_module_1.EventPublisherModule,
            hubspot_integration_module_1.HubSpotIntegrationModule,
            bullmq_1.BullModule.registerQueue({ name: 'm06-queue' }),
        ],
        controllers: [
            m06_controller_1.M06ForecastingPredictionController,
            executive_controller_1.M06ExecutiveController,
            hubspot_controller_1.HubSpotController,
            admin_forecast_boards_controller_1.AdminForecastBoardsController,
            forecast_boards_controller_1.ForecastBoardsController,
            forecast_upgrade_controller_1.ForecastUpgradeController,
        ],
        providers: [
            forecast_boards_repository_1.ForecastBoardsRepository,
            forecast_boards_service_1.ForecastBoardsService,
            admin_forecast_boards_service_1.AdminForecastBoardsService,
            m06_service_1.M06ForecastingPredictionService,
            m06_prediction_queue_service_1.M06PredictionQueueService,
            hubspot_service_1.HubSpotService,
            m06_worker_1.M06ForecastingPredictionWorker,
            m06_repository_1.M06ForecastingPredictionRepository,
            forecast_submitted_listener_1.ForecastSubmittedListener,
            forecast_upgrade_service_1.ForecastUpgradeService,
        ],
        exports: [
            forecast_boards_service_1.ForecastBoardsService,
            m06_service_1.M06ForecastingPredictionService,
            m06_prediction_queue_service_1.M06PredictionQueueService,
        ],
    })
], M06ForecastingPredictionModule);
//# sourceMappingURL=m06-forecasting-prediction.module.js.map