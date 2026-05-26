// M10 Data Cloud — Core Service
// Owned by: modules/m10-data-compliance/ (TDD Doc #11c v3.0)
//
// V1 design: PostgreSQL is the source. Export is a structured extraction
// logged into export_runs + checkpoints. Destination adapters (Snowflake etc.)
// are swapped in later — service interface stays the same.
//
// Key rules from TDD:
//   - Daily Sync Lock: Redis key m10_data_export:lock:<tenantId> (TDD §5.1)
//   - Idempotency key: tenantId:connectionId:dataset:date_window (TDD §5.2)
//   - Fail-closed: if lock is held → abort immediately, log warning

import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { randomUUID } from 'crypto';
import { Redis } from 'ioredis';

import { DataCloudRepository } from '../repositories/data-cloud.repository';
import { M10_DATA_CLOUD_QUEUES } from '../events/data-cloud.events';
import type { RegisterConnectionDto, ReplayExportDto } from '../schemas/data-cloud.schema';

// Env-driven config — M10_ prefix per monorepo convention (TDD §8)
const EXPORT_ENABLED = process.env.M10_DATA_EXPORT_ENABLED !== 'false';
const LOCK_TTL_SECONDS = 4 * 60 * 60; // 4 hours per TDD §5.1

const DATASETS = ['accounts', 'contacts', 'deals', 'activities'] as const;
type Dataset = typeof DATASETS[number];

@Injectable()
export class DataCloudService {
  private readonly logger = new Logger(DataCloudService.name);
  private readonly redis: Redis;

  constructor(
    private readonly repo: DataCloudRepository,
    @InjectQueue(M10_DATA_CLOUD_QUEUES.EXPORT) private readonly exportQueue: Queue,
  ) {
    // V1: use same Redis instance as BullMQ
    this.redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
      maxRetriesPerRequest: null,
    });
  }

  // ─── CONNECTION MANAGEMENT ────────────────────────────────────────────────────

  async registerConnection(tenantId: string, dto: RegisterConnectionDto): Promise<any> {
    const conn = await this.repo.createConnection(tenantId, {
      destination: dto.destination,
      config: dto.config ?? {},
    });
    this.logger.log(`Connection registered tenant=${tenantId} dest=${dto.destination} id=${conn.id}`);
    return {
      connectionId: conn.id,
      destination: conn.destination,
      isActive: conn.isActive,
      createdAt: conn.createdAt,
    };
  }

  async getConnections(tenantId: string): Promise<any[]> {
    const conns = await this.repo.findConnections(tenantId);
    return conns.map(c => ({
      connectionId: c.id,
      destination: c.destination,
      isActive: c.isActive,
      createdAt: c.createdAt,
    }));
  }

  async testConnection(tenantId: string, connectionId: string): Promise<{ success: boolean; message: string }> {
    const conn = await this.repo.findConnectionById(tenantId, connectionId);
    if (!conn) throw new HttpException('Connection not found', HttpStatus.NOT_FOUND);

    // V1: test by verifying we can read at least 1 account from the source DB
    try {
      const sample = await this.repo.extractAccounts(tenantId);
      return {
        success: true,
        message: `Connection OK — source has ${sample.length} account records available for export`,
      };
    } catch (err) {
      return { success: false, message: `Connection test failed: ${(err as Error).message}` };
    }
  }

  // ─── EXPORT RUN HISTORY ───────────────────────────────────────────────────────

  async getExportRuns(tenantId: string, connectionId?: string): Promise<any[]> {
    const runs = await this.repo.findExportRuns(tenantId, connectionId);
    return runs.map(r => ({
      runId: r.id,
      connectionId: r.connectionId,
      destination: r.connection?.destination,
      status: r.status,
      rowsExported: r.rowsExported,
      startedAt: r.startedAt,
      completedAt: r.completedAt ?? null,
      errorMessage: r.errorMessage ?? null,
    }));
  }

  // ─── MANUAL REPLAY TRIGGER ────────────────────────────────────────────────────

  async triggerReplay(tenantId: string, dto: ReplayExportDto): Promise<{ status: string; runId: string; message: string }> {
    const conn = await this.repo.findConnectionById(tenantId, dto.connectionId);
    if (!conn) throw new HttpException('Connection not found', HttpStatus.NOT_FOUND);

    const idempotencyKey = `${tenantId}:${dto.connectionId}:${dto.datasetName}:${dto.windowStart}:${dto.windowEnd}`;
    const runId = randomUUID();

    await this.exportQueue.add(
      'data-cloud-export',
      {
        tenantId,
        connectionId: dto.connectionId,
        datasetName: dto.datasetName,
        syncMode: 'full_backfill',
        windowStart: dto.windowStart,
        windowEnd: dto.windowEnd,
        idempotencyKey,
        runId,
      },
      {
        jobId: idempotencyKey, // BullMQ deduplication
        attempts: 3,
        backoff: { type: 'exponential', delay: 3000 },
      },
    );

    this.logger.log(`Replay queued tenant=${tenantId} dataset=${dto.datasetName} window=${dto.windowStart}→${dto.windowEnd}`);
    return { status: 'queued', runId, message: 'Replay run queued for execution.' };
  }

  // ─── SCHEDULED DAILY EXPORT (called by Worker at 02:00 UTC) ─────────────────

  async runScheduledExport(tenantId: string, connectionId: string): Promise<void> {
    if (!EXPORT_ENABLED) {
      this.logger.warn('Data export disabled — M10_DATA_EXPORT_ENABLED=false');
      return;
    }

    const lockKey = `m10_data_export:lock:${tenantId}:${connectionId}`;

    // TDD §5.1 — Daily Sync Lock: abort if already running
    const existing = await this.redis.get(lockKey);
    if (existing) {
      this.logger.warn(`Export aborted: Active sync lock exists for tenant=${tenantId} conn=${connectionId} sync_id=${existing}`);
      return;
    }

    const syncId = randomUUID();
    await this.redis.set(lockKey, syncId, 'EX', LOCK_TTL_SECONDS);
    this.logger.log(`Sync lock acquired tenant=${tenantId} syncId=${syncId}`);

    const run = await this.repo.createExportRun({ tenantId, connectionId, status: 'running' });

    let totalRows = 0;
    try {
      for (const dataset of DATASETS) {
        const rows = await this.exportDataset(tenantId, dataset);
        totalRows += rows;
        this.logger.log(`Exported ${rows} ${dataset} rows for tenant=${tenantId}`);
      }

      await this.repo.updateExportRun(run.id, {
        status: 'success',
        rowsExported: totalRows,
        completedAt: new Date(),
      });

      this.logger.log(`Export SUCCESS tenant=${tenantId} totalRows=${totalRows}`);
    } catch (err) {
      const msg = (err as Error).message;
      this.logger.error(`Export FAILED tenant=${tenantId}: ${msg}`);
      await this.repo.updateExportRun(run.id, {
        status: 'failed',
        errorMessage: msg,
        completedAt: new Date(),
      });
    } finally {
      // Always release lock (TDD §5.1 — release on success OR failure)
      await this.redis.del(lockKey);
      this.logger.log(`Sync lock released tenant=${tenantId} syncId=${syncId}`);
    }
  }

  // ─── PRIVATE: EXTRACT + CHECKPOINT EACH DATASET ──────────────────────────────

  private async exportDataset(tenantId: string, dataset: Dataset): Promise<number> {
    // Load last checkpoint watermark (incremental sync)
    const checkpoint = await this.repo.getCheckpoint(tenantId, dataset);
    const since = checkpoint?.lastCursor ? new Date(checkpoint.lastCursor) : undefined;

    let rows: any[] = [];
    switch (dataset) {
      case 'accounts':   rows = await this.repo.extractAccounts(tenantId, since); break;
      case 'contacts':   rows = await this.repo.extractContacts(tenantId, since); break;
      case 'deals':      rows = await this.repo.extractDeals(tenantId, since); break;
      case 'activities': rows = await this.repo.extractActivities(tenantId, since); break;
    }

    if (rows.length === 0) {
      this.logger.debug(`No new rows for dataset=${dataset} since=${since?.toISOString() ?? 'beginning'}`);
      return 0;
    }

    // V1: "export" = log row count + update checkpoint watermark
    // In V2+: this is where Snowflake/BigQuery upsert adapters plug in
    const latestUpdatedAt = rows.reduce((max, r) =>
      new Date(r.updatedAt) > max ? new Date(r.updatedAt) : max,
      new Date(0),
    );

    await this.repo.upsertCheckpoint(tenantId, dataset, latestUpdatedAt.toISOString());
    return rows.length;
  }
}
