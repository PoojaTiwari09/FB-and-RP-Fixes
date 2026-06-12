// M10 Data Cloud — Scheduled Export Cron Service
// Owned by: modules/m10-data-compliance/ (TDD Doc #11c v3.0 §5.1)
// Runs daily at 02:00 UTC (M10_DATA_EXPORT_SYNC_CRON env var).

import { Injectable, Logger } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { InjectQueue } from "@nestjs/bullmq";
import { Queue } from "bullmq";
import { DataCloudRepository } from "../repositories/data-cloud.repository";
import { M10_DATA_CLOUD_QUEUES } from "../events/data-cloud.events";

const SCHEDULED_EXPORT_ENABLED =
  process.env.M10_DATA_EXPORT_SCHEDULED_EXPORT_ENABLED !== "false";
const CRON_EXPRESSION = process.env.M10_DATA_EXPORT_SYNC_CRON ?? "0 2 * * *";

@Injectable()
export class DataCloudSchedulerService {
  private readonly logger = new Logger(DataCloudSchedulerService.name);

  constructor(
    private readonly repo: DataCloudRepository,
    @InjectQueue(M10_DATA_CLOUD_QUEUES.EXPORT)
    private readonly exportQueue: Queue,
  ) {}

  /**
   * Daily scheduled export trigger — strictly 02:00 UTC (TDD FR-3).
   * Iterates over all active tenant connections and queues export jobs into BullMQ.
   */
  @Cron(CRON_EXPRESSION, {
    name: "m10-data-cloud-daily-export",
    timeZone: "UTC",
  })
  async triggerDailyExport(): Promise<void> {
    if (!SCHEDULED_EXPORT_ENABLED) {
      this.logger.warn(
        "[DataCloud Scheduler] Skipped — M10_DATA_EXPORT_SCHEDULED_EXPORT_ENABLED=false",
      );
      return;
    }

    this.logger.log(
      "[DataCloud Scheduler] 02:00 UTC trigger fired — queuing export jobs for all active connections",
    );

    try {
      const activeConnections = await this.repo.findAllActiveConnections();
      this.logger.log(
        `[DataCloud Scheduler] Found ${activeConnections.length} active connections to export`,
      );

      for (const connection of activeConnections) {
        const idempotencyKey = `${connection.tenantId}:${connection.id}:scheduled:${new Date().toISOString().split("T")[0]}`;
        await this.exportQueue.add(
          "data-cloud-export",
          {
            tenantId: connection.tenantId,
            connectionId: connection.id,
            datasetName: "all",
            syncMode: "incremental",
            idempotencyKey,
          },
          {
            jobId: idempotencyKey,
            attempts: 3,
            backoff: { type: "exponential", delay: 5000 },
          },
        );
        this.logger.log(
          `[DataCloud Scheduler] Queued export job: tenant=${connection.tenantId} conn=${connection.id}`,
        );
      }
    } catch (err) {
      this.logger.error(
        `[DataCloud Scheduler] Failed to queue export jobs: ${(err as Error).message}`,
      );
    }
  }
}
