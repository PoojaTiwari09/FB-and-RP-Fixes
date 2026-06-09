import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { Job } from 'bullmq';
import { M08WorkflowService } from '../services/workflow.service';
import { EXECUTE_WORKFLOW_RUN_JOB, M08_WORKFLOW_RUNS_QUEUE } from '../queues/m08-queue.constants';

export { M08_WORKFLOW_RUNS_QUEUE, EXECUTE_WORKFLOW_RUN_JOB };

@Processor(M08_WORKFLOW_RUNS_QUEUE)
@Injectable()
export class WorkflowRunsWorker extends WorkerHost {
  constructor(
    @Inject(forwardRef(() => M08WorkflowService))
    private readonly workflowService: M08WorkflowService,
  ) {
    super();
  }

  async process(job: Job<{ tenantId: string; runId: string }>): Promise<unknown> {
    if (job.name !== EXECUTE_WORKFLOW_RUN_JOB) {
      return { status: 'ignored', job: job.name };
    }
    const { tenantId, runId } = job.data;
    if (!tenantId || !runId) {
      throw new Error('execute-workflow-run requires tenantId and runId');
    }
    await this.workflowService.executeWorkflowRun(tenantId, runId);
    return { status: 'success', runId, tenantId };
  }
}
