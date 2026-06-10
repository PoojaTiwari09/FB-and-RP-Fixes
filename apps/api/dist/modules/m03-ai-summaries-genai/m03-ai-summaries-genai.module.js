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
const config_1 = require("@nestjs/config");
const m03_controller_1 = require("./controllers/m03.controller");
const research_controller_1 = require("./controllers/research.controller");
const query_controller_1 = require("./controllers/query.controller");
const feedback_controller_1 = require("./controllers/feedback.controller");
const brief_controller_1 = require("./controllers/brief.controller");
const workspace_controller_1 = require("./controllers/workspace.controller");
const m03_test_controller_1 = require("./controllers/m03-test.controller");
const m03_service_1 = require("./services/m03.service");
const research_service_1 = require("./services/research.service");
const report_service_1 = require("./services/report.service");
const query_service_1 = require("./services/query.service");
const feedback_service_1 = require("./services/feedback.service");
const brief_service_1 = require("./services/brief.service");
const workspace_service_1 = require("./services/workspace.service");
const cross_object_joiner_service_1 = require("./services/cross-object-joiner.service");
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
            config_1.ConfigModule,
            prisma_module_1.PrismaModule,
            event_publisher_module_1.EventPublisherModule,
            bullmq_1.BullModule.registerQueue({ name: 'm03-queue' }),
        ],
        controllers: [
            m03_controller_1.M03AiSummariesGenaiController,
            research_controller_1.ResearchController,
            query_controller_1.QueryController,
            feedback_controller_1.FeedbackController,
            brief_controller_1.BriefController,
            brief_controller_1.BriefCompatController,
            workspace_controller_1.WorkspaceController,
            m03_test_controller_1.M03TestController,
        ],
        providers: [
            m03_service_1.M03AiSummariesGenaiService,
            research_service_1.ResearchService,
            report_service_1.ReportService,
            query_service_1.QueryService,
            feedback_service_1.FeedbackService,
            brief_service_1.BriefService,
            workspace_service_1.WorkspaceService,
            cross_object_joiner_service_1.CrossObjectJoinerService,
            m03_worker_1.M03AiSummariesGenaiWorker,
            m03_repository_1.M03AiSummariesGenaiRepository,
        ],
        exports: [
            m03_service_1.M03AiSummariesGenaiService,
            research_service_1.ResearchService,
            query_service_1.QueryService,
            feedback_service_1.FeedbackService,
            brief_service_1.BriefService,
        ],
    })
], M03AiSummariesGenaiModule);
//# sourceMappingURL=m03-ai-summaries-genai.module.js.map