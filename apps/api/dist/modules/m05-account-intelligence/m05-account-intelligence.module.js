"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.M05AccountIntelligenceModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const bullmq_1 = require("@nestjs/bullmq");
const m05_controller_1 = require("./controllers/m05.controller");
const m05_test_controller_1 = require("./controllers/m05-test.controller");
const m05_env_1 = require("./config/m05-env");
const accounts_controller_1 = require("./controllers/accounts.controller");
const activities_controller_1 = require("./controllers/activities.controller");
const boards_controller_1 = require("./controllers/boards.controller");
const edits_controller_1 = require("./controllers/edits.controller");
const preferences_controller_1 = require("./controllers/preferences.controller");
const sync_controller_1 = require("./controllers/sync.controller");
const todos_controller_1 = require("./controllers/todos.controller");
const webhook_controller_1 = require("./controllers/webhook.controller");
const ai_controller_1 = require("./controllers/ai.controller");
const m05_service_1 = require("./services/m05.service");
const accounts_service_1 = require("./services/accounts.service");
const activities_service_1 = require("./services/activities.service");
const boards_service_1 = require("./services/boards.service");
const edits_service_1 = require("./services/edits.service");
const preferences_service_1 = require("./services/preferences.service");
const sync_service_1 = require("./services/sync.service");
const todos_service_1 = require("./services/todos.service");
const ai_service_1 = require("./services/ai.service");
const m05_worker_1 = require("./workers/m05.worker");
const m05_repository_1 = require("./repositories/m05.repository");
const prisma_module_1 = require("./database/prisma.module");
const event_publisher_module_1 = require("../platform-core/events/event-publisher.module");
let M05AccountIntelligenceModule = class M05AccountIntelligenceModule {
    constructor() {
        (0, m05_env_1.assertM05WebhookSecretConfigured)();
    }
};
exports.M05AccountIntelligenceModule = M05AccountIntelligenceModule;
exports.M05AccountIntelligenceModule = M05AccountIntelligenceModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule,
            prisma_module_1.PrismaModule,
            event_publisher_module_1.EventPublisherModule,
            bullmq_1.BullModule.registerQueue({ name: 'm05-queue' }),
        ],
        controllers: [
            m05_controller_1.M05AccountIntelligenceController,
            m05_test_controller_1.M05TestController,
            accounts_controller_1.AccountsController,
            activities_controller_1.ActivitiesController,
            boards_controller_1.BoardsController,
            edits_controller_1.EditsController,
            preferences_controller_1.PreferencesController,
            sync_controller_1.SyncController,
            todos_controller_1.TodosController,
            webhook_controller_1.WebhookController,
            ai_controller_1.AiController,
        ],
        providers: [
            m05_service_1.M05AccountIntelligenceService,
            m05_worker_1.M05AccountIntelligenceWorker,
            m05_repository_1.M05AccountIntelligenceRepository,
            accounts_service_1.AccountsService,
            activities_service_1.ActivitiesService,
            boards_service_1.BoardsService,
            edits_service_1.EditsService,
            preferences_service_1.PreferencesService,
            sync_service_1.SyncService,
            todos_service_1.TodosService,
            ai_service_1.AiService,
        ],
        exports: [m05_service_1.M05AccountIntelligenceService],
    }),
    __metadata("design:paramtypes", [])
], M05AccountIntelligenceModule);
//# sourceMappingURL=m05-account-intelligence.module.js.map