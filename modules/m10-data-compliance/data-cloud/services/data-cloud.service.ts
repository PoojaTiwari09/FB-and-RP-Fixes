// M10 Data Cloud — Core Service (real CSV/Parquet export + warehouse hooks)

import { Injectable, Logger, HttpException, HttpStatus, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { randomUUID } from 'crypto';
import { Redis } from 'ioredis';
import { createReadStream } from 'fs';

import { DataCloudRepository } from '../repositories/data-cloud.repository';
import { M10_DATA_CLOUD_QUEUES } from '../events/data-cloud.events';
import type { RegisterConnectionDto, ReplayExportDto } from '../schemas/data-cloud.schema';
import { writeCsvExport } from '../export/csv-export.writer';
import { writeParquetExport } from '../export/parquet-export.writer';
import { ExportStorageService } from '../export/export-storage.service';
import { WarehouseRegistry } from '../warehouse/warehouse-registry';

const EXPORT_ENABLED = process.env.M10_DATA_EXPORT_ENABLED !== 'false';
const LOCK_TTL_SECONDS = 4 * 60 * 60;
const DATASETS = ['accounts', 'contacts', 'deals', 'activities'] as const;
type Dataset = (typeof DATASETS)[number];

@Injectable()
export class DataCloudService {
  private readonly logger = new Logger(DataCloudService.name);
  private readonly redis: Redis;

  constructor(
    private readonly repo: DataCloudRepository,
    private readonly storage: ExportStorageService,
    private readonly warehouse: WarehouseRegistry,
    @InjectQueue(M10_DATA_CLOUD_QUEUES.EXPORT) private readonly exportQueue: Queue,
  ) {
    this.redis = new Redis(process.env.REDIS_URL ?? 'redis://localhost:6379', {
      maxRetriesPerRequest: null,
    });
  }

  async registerConnection(tenantId: string, dto: RegisterConnectionDto): Promise<any> {
    const conn = await this.repo.createConnection(tenantId, {
      destination: dto.destination,
      config: dto.config ?? {},
    });
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
    try {
      const sample = await this.repo.extractAccounts(tenantId);
      return { success: true, message: `Connection OK — ${sample.length} accounts available` };
    } catch (err) {
      return { success: false, message: `Connection test failed: ${(err as Error).message}` };
    }
  }

  async getExportRuns(tenantId: string, connectionId?: string): Promise<any[]> {
    const runs = await this.repo.findExportRuns(tenantId, connectionId);
    return runs.map(r => ({
      runId: r.id,
      connectionId: r.connectionId,
      destination: r.connection?.destination,
      status: r.status,
      rowsExported: r.rowsExported,
      filePaths: r.filePaths ?? {},
      startedAt: r.startedAt,
      completedAt: r.completedAt ?? null,
      errorMessage: r.errorMessage ?? null,
      downloadUrls: this.buildDownloadUrls(tenantId, r.id, r.filePaths as Record<string, any> | null),
    }));
  }

  async getExportDownloadStream(
    tenantId: string,
    runId: string,
    dataset: string,
    format: 'csv' | 'parquet',
  ) {
    const run = await this.repo.findExportRunById(tenantId, runId);
    if (!run) throw new NotFoundException('Export run not found');
    const path = this.storage.resolveDownloadPath(tenantId, runId, dataset, format);
    if (!path) throw new NotFoundException('Export file not found');
    return { stream: createReadStream(path), path, contentType: format === 'csv' ? 'text/csv' : 'application/octet-stream' };
  }

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
      { jobId: idempotencyKey, attempts: 3, backoff: { type: 'exponential', delay: 3000 } },
    );

    return { status: 'queued', runId, message: 'Replay run queued for execution.' };
  }

  async runScheduledExport(tenantId: string, connectionId: string, existingRunId?: string): Promise<void> {
    if (!EXPORT_ENABLED) {
      this.logger.warn('Data export disabled — M10_DATA_EXPORT_ENABLED=false');
      return;
    }

    const conn = await this.repo.findConnectionById(tenantId, connectionId);
    if (!conn) throw new HttpException('Connection not found', HttpStatus.NOT_FOUND);

    const lockKey = `m10_data_export:lock:${tenantId}:${connectionId}`;
    const existing = await this.redis.get(lockKey);
    if (existing) {
      this.logger.warn(`Export aborted: lock held tenant=${tenantId} conn=${connectionId}`);
      return;
    }

    const syncId = randomUUID();
    await this.redis.set(lockKey, syncId, 'EX', LOCK_TTL_SECONDS);

    const run = existingRunId
      ? await this.repo.findExportRunById(tenantId, existingRunId)
      : await this.repo.createExportRun({ tenantId, connectionId, status: 'running' });
    if (!run) throw new HttpException('Export run not found', HttpStatus.NOT_FOUND);

    const filePaths: Record<string, { csv: string; parquet: string; downloadCsv: string; downloadParquet: string }> = {};
    let totalRows = 0;

    try {
      for (const dataset of DATASETS) {
        const result = await this.exportDataset(tenantId, run.id, conn.destination, conn.config as object, dataset);
        totalRows += result.rowCount;
        filePaths[dataset] = result.files;
      }

      await this.repo.updateExportRun(run.id, {
        status: 'success',
        rowsExported: totalRows,
        filePaths,
        completedAt: new Date(),
      });
    } catch (err) {
      await this.repo.updateExportRun(run.id, {
        status: 'failed',
        errorMessage: (err as Error).message,
        filePaths,
        completedAt: new Date(),
      });
      throw err;
    } finally {
      await this.redis.del(lockKey);
    }
  }

  private async exportDataset(
    tenantId: string,
    runId: string,
    destination: string,
    config: object,
    dataset: Dataset,
  ): Promise<{ rowCount: number; files: { csv: string; parquet: string; downloadCsv: string; downloadParquet: string } }> {
    const checkpoint = await this.repo.getCheckpoint(tenantId, dataset);
    const since = checkpoint?.lastCursor ? new Date(checkpoint.lastCursor) : undefined;

    let rows: any[] = [];
    switch (dataset) {
      case 'accounts':
        rows = await this.repo.extractAccounts(tenantId, since);
        break;
      case 'contacts':
        rows = await this.repo.extractContacts(tenantId, since);
        break;
      case 'deals':
        rows = await this.repo.extractDeals(tenantId, since);
        break;
      case 'activities':
        rows = await this.repo.extractActivities(tenantId, since);
        break;
    }

    const paths = this.storage.datasetPaths(tenantId, runId, dataset);
    if (rows.length === 0) {
      return {
        rowCount: 0,
        files: {
          csv: paths.csv,
          parquet: paths.parquet,
          downloadCsv: this.storage.downloadUrl(runId, dataset, 'csv'),
          downloadParquet: this.storage.downloadUrl(runId, dataset, 'parquet'),
        },
      };
    }

    const plain = rows.map(r => ({ ...r, updatedAt: r.updatedAt?.toISOString?.() ?? r.updatedAt }));
    await writeCsvExport(paths.csv, plain);
    await writeParquetExport(paths.parquet, plain);

    const latestUpdatedAt = rows.reduce(
      (max, r) => (new Date(r.updatedAt) > max ? new Date(r.updatedAt) : max),
      new Date(0),
    );
    await this.repo.upsertCheckpoint(tenantId, dataset, latestUpdatedAt.toISOString());

    await this.warehouse.sync({
      tenantId,
      connectionId: runId,
      destination,
      config: config as Record<string, unknown>,
      dataset,
      csvPath: paths.csv,
      parquetPath: paths.parquet,
      rowCount: rows.length,
    });

    return {
      rowCount: rows.length,
      files: {
        csv: paths.csv,
        parquet: paths.parquet,
        downloadCsv: this.storage.downloadUrl(runId, dataset, 'csv'),
        downloadParquet: this.storage.downloadUrl(runId, dataset, 'parquet'),
      },
    };
  }

  private buildDownloadUrls(tenantId: string, runId: string, filePaths: Record<string, any> | null) {
    if (!filePaths) return {};
    const out: Record<string, { csv?: string; parquet?: string }> = {};
    for (const ds of Object.keys(filePaths)) {
      out[ds] = {
        csv: filePaths[ds]?.downloadCsv ?? this.storage.downloadUrl(runId, ds, 'csv'),
        parquet: filePaths[ds]?.downloadParquet ?? this.storage.downloadUrl(runId, ds, 'parquet'),
      };
    }
    return out;
  }
}
