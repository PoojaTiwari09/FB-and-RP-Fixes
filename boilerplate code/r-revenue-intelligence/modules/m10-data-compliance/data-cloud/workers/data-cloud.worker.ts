// M10 Data Cloud — BullMQ Worker
// Owned by: modules/m10-data-compliance/ (TDD Doc #11c v3.0)
//
// Handles scheduled (cron) and manual replay export jobs.
// Business logic lives in DataCloudService — worker just validates + delegates.

import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

import { DataCloudService } from '../services/data-cloud.service';
import { M10_DATA_CLOUD_QUEUES } from '../events/data-cloud.events';
import { ExportJobSchema } from '../schemas/data-cloud.schema';

@Processor(M10_DATA_CLOUD_QUEUES.EXPORT)
export class DataCloudWorker extends WorkerHost {
  private readonly logger = new Logger(DataCloudWorker.name);

  constructor(private readonly service: DataCloudService) {
    super();
  }

  async process(job: Job): Promise<void> {
    this.logger.log(`Processing export job [id=${job.id}] [attempt=${job.attemptsMade + 1}]`);

    // Validate job payload
    const parsed = ExportJobSchema.safeParse(job.data);
    if (!parsed.success) {
      const msg = `UNRECOVERABLE: Invalid job payload — ${JSON.stringify(parsed.error.flatten())}`;
      this.logger.error(msg);
      throw new Error(msg);
    }

    const { tenantId, connectionId } = parsed.data;

    if (!tenantId) {
      throw new Error('UNRECOVERABLE: tenantId required for data export job');
    }

    await this.service.runScheduledExport(tenantId, connectionId);
    this.logger.log(`Export job [id=${job.id}] completed for tenant=${tenantId}`);
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job): void {
    this.logger.debug(`Job [id=${job.id}] completed`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job | undefined, error: Error): void {
    const isUnrecoverable = error.message.startsWith('UNRECOVERABLE:');
    this.logger.error(`Job [id=${job?.id}] failed (attempt ${job?.attemptsMade ?? '?'}): ${error.message}`);
    if (isUnrecoverable) {
      this.logger.error(`Job [id=${job?.id}] is unrecoverable — will NOT be retried`);
    }
  }

  @OnWorkerEvent('stalled')
  onStalled(jobId: string): void {
    this.logger.warn(`Job [id=${jobId}] stalled — BullMQ will re-queue`);
  }
}
