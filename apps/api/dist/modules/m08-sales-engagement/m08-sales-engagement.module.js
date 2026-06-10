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
const m08_rep_bridge_controller_1 = require("./controllers/m08-rep-bridge.controller");
const task_controller_1 = require("./controllers/task.controller");
const workflow_controller_1 = require("./controllers/workflow.controller");
const m08_test_controller_1 = require("./controllers/m08-test.controller");
const m08_service_1 = require("./services/m08.service");
const task_service_1 = require("./services/task.service");
const workflow_service_1 = require("./services/workflow.service");
const m08_worker_1 = require("./workers/m08.worker");
const workflow_runs_worker_1 = require("./workers/workflow-runs.worker");
const m08_queue_constants_1 = require("./queues/m08-queue.constants");
const task_event_subscriber_1 = require("./subscribers/task-event.subscriber");
const m08_repository_1 = require("./repositories/m08.repository");
const task_repository_1 = require("./repositories/task.repository");
const workflow_repository_1 = require("./repositories/workflow.repository");
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
            bullmq_1.BullModule.registerQueue({ name: m08_queue_constants_1.M08_WORKFLOW_RUNS_QUEUE }),
        ],
        controllers: [
            m08_controller_1.M08SalesEngagementController,
            m08_rep_bridge_controller_1.M08RepBridgeController,
            task_controller_1.M08TaskController,
            workflow_controller_1.M08WorkflowController,
            m08_test_controller_1.M08TestController,
        ],
        providers: [
            m08_service_1.M08SalesEngagementService,
            m08_worker_1.M08SalesEngagementWorker,
            workflow_runs_worker_1.WorkflowRunsWorker,
            task_event_subscriber_1.M08TaskEventSubscriber,
            m08_repository_1.M08SalesEngagementRepository,
            task_service_1.M08TaskService,
            task_repository_1.M08TaskRepository,
            workflow_service_1.M08WorkflowService,
            workflow_repository_1.M08WorkflowRepository,
        ],
        exports: [m08_service_1.M08SalesEngagementService, task_service_1.M08TaskService, workflow_service_1.M08WorkflowService],
    })
], M08SalesEngagementModule);
//# sourceMappingURL=m08-sales-engagement.module.js.map