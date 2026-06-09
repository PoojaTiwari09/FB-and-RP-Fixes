// M10 Revenue Graph — BullMQ Worker
// Owned by: modules/m10-data-compliance/ (TDD Doc #11a v3.0)
// Consumes call.transcription.completed events from M1.
// Architecture rules:
//   - Validates event with Zod FIRST (UNRECOVERABLE if schema invalid)
//   - Missing tenantId → quarantine to DLQ (never retry)
//   - All other failures → exponential backoff (max 3 retries per ADR-005)
//   - Business logic lives in service, not here

import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';

import { RevenueGraphService } from '../services/revenue-graph.service';
import { M10_REVENUE_GRAPH_QUEUES, M10_REVENUE_GRAPH_EVENTS } from '../events/revenue-graph.events';
import { TranscriptionCompletedEventSchema, NormalizedIntakeSchema } from '../schemas/revenue-graph.schema';

@Processor(M10_REVENUE_GRAPH_QUEUES.INTAKE)
export class RevenueGraphWorker extends WorkerHost {
  private readonly logger = new Logger(RevenueGraphWorker.name);

  constructor(private readonly service: RevenueGraphService) {
    super();
  }

  async process(job: Job): Promise<void> {
    this.logger.log(`Processing job [id=${job.id}] [name=${job.name}] [attempt=${job.attemptsMade + 1}]`);

    // Only handle events this worker owns
    if (job.name !== M10_REVENUE_GRAPH_EVENTS.CONSUMED.CALL_TRANSCRIPTION_COMPLETED) {
      this.logger.warn(`Unknown job name "${job.name}" — skipping`);
      return;
    }

    // Step 1: Validate event payload (Zod schema — FR-1, FR-2)
    const parsed = TranscriptionCompletedEventSchema.safeParse(job.data);
    if (!parsed.success) {
      this.logger.error(`Job [id=${job.id}] invalid payload: ${JSON.stringify(parsed.error.flatten())}`);
      throw new Error(`UNRECOVERABLE: Invalid event payload — ${JSON.stringify(parsed.error.flatten())}`);
    }

    const event = parsed.data;

    // Step 2: Guard — tenant context MANDATORY (FR-2)
    if (!event.tenantId) {
      this.logger.error(`Job [id=${job.id}] rejected: missing tenantId`);
      throw new Error('UNRECOVERABLE: tenantId is required for Revenue Graph linking');
    }

    // Step 3: Normalize to canonical intake shape
    const intake = NormalizedIntakeSchema.parse({
      eventId: event.eventId,
      tenantId: event.tenantId,
      sourceType: event.sourceType,
      sourcePlatform: event.sourcePlatform,
      sourceRecordId: event.sourceRecordId,
      occurredAt: event.occurredAt,
      participants: event.participants,
      crmHints: event.crmHints ?? {},
      artifacts: event.artifacts ?? {},
    });

    // Step 4: Delegate to service
    await this.service.processInteractionLinking(intake);

    this.logger.log(`Job [id=${job.id}] completed successfully`);
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job): void {
    this.logger.debug(`Job [id=${job.id}] completed`);
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job | undefined, error: Error): void {
    const isUnrecoverable = error.message.startsWith('UNRECOVERABLE:');
    this.logger.error(
      `Job [id=${job?.id}] failed (attempt ${job?.attemptsMade ?? '?'}): ${error.message}`,
    );
    if (isUnrecoverable) {
      this.logger.error(`Job [id=${job?.id}] is unrecoverable — will NOT be retried`);
    }
  }

  @OnWorkerEvent('stalled')
  onStalled(jobId: string): void {
    this.logger.warn(`Job [id=${jobId}] stalled — BullMQ will re-queue`);
  }
}
