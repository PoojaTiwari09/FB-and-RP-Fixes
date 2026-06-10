import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { M08WorkflowService } from '../services/workflow.service';
import { EXECUTE_WORKFLOW_RUN_JOB, M08_WORKFLOW_RUNS_QUEUE } from '../queues/m08-queue.constants';
export { M08_WORKFLOW_RUNS_QUEUE, EXECUTE_WORKFLOW_RUN_JOB };
export declare class WorkflowRunsWorker extends WorkerHost {
    private readonly workflowService;
    constructor(workflowService: M08WorkflowService);
    process(job: Job<{
        tenantId: string;
        runId: string;
    }>): Promise<unknown>;
}
