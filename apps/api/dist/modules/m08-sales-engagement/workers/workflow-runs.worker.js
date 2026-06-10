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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowRunsWorker = exports.EXECUTE_WORKFLOW_RUN_JOB = exports.M08_WORKFLOW_RUNS_QUEUE = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const workflow_service_1 = require("../services/workflow.service");
const m08_queue_constants_1 = require("../queues/m08-queue.constants");
Object.defineProperty(exports, "EXECUTE_WORKFLOW_RUN_JOB", { enumerable: true, get: function () { return m08_queue_constants_1.EXECUTE_WORKFLOW_RUN_JOB; } });
Object.defineProperty(exports, "M08_WORKFLOW_RUNS_QUEUE", { enumerable: true, get: function () { return m08_queue_constants_1.M08_WORKFLOW_RUNS_QUEUE; } });
let WorkflowRunsWorker = class WorkflowRunsWorker extends bullmq_1.WorkerHost {
    workflowService;
    constructor(workflowService) {
        super();
        this.workflowService = workflowService;
    }
    async process(job) {
        if (job.name !== m08_queue_constants_1.EXECUTE_WORKFLOW_RUN_JOB) {
            return { status: 'ignored', job: job.name };
        }
        const { tenantId, runId } = job.data;
        if (!tenantId || !runId) {
            throw new Error('execute-workflow-run requires tenantId and runId');
        }
        await this.workflowService.executeWorkflowRun(tenantId, runId);
        return { status: 'success', runId, tenantId };
    }
};
exports.WorkflowRunsWorker = WorkflowRunsWorker;
exports.WorkflowRunsWorker = WorkflowRunsWorker = __decorate([
    (0, bullmq_1.Processor)(m08_queue_constants_1.M08_WORKFLOW_RUNS_QUEUE),
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)((0, common_1.forwardRef)(() => workflow_service_1.M08WorkflowService))),
    __metadata("design:paramtypes", [workflow_service_1.M08WorkflowService])
], WorkflowRunsWorker);
//# sourceMappingURL=workflow-runs.worker.js.map