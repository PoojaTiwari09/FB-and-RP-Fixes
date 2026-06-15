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
var DataCloudService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DataCloudService = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
const crypto_1 = require("crypto");
const ioredis_1 = require("ioredis");
const fs_1 = require("fs");
const data_cloud_repository_1 = require("../repositories/data-cloud.repository");
const data_cloud_events_1 = require("../events/data-cloud.events");
const csv_export_writer_1 = require("../export/csv-export.writer");
const parquet_export_writer_1 = require("../export/parquet-export.writer");
const export_storage_service_1 = require("../export/export-storage.service");
const warehouse_registry_1 = require("../warehouse/warehouse-registry");
const EXPORT_ENABLED = process.env.M10_DATA_EXPORT_ENABLED !== "false";
const LOCK_TTL_SECONDS = 4 * 60 * 60;
const DATASETS = ["accounts", "contacts", "deals", "activities"];
let DataCloudService = DataCloudService_1 = class DataCloudService {
    repo;
    storage;
    warehouse;
    exportQueue;
    logger = new common_1.Logger(DataCloudService_1.name);
    redis;
    constructor(repo, storage, warehouse, exportQueue) {
        this.repo = repo;
        this.storage = storage;
        this.warehouse = warehouse;
        this.exportQueue = exportQueue;
        this.redis = new ioredis_1.Redis(process.env.REDIS_URL ?? "redis://localhost:6379", {
            maxRetriesPerRequest: null,
            lazyConnect: true,
            enableOfflineQueue: false,
            retryStrategy: (times) => {
                if (process.env.DISABLE_REDIS === "true")
                    return null;
                return Math.min(times * 300, 10000);
            },
        });
        this.redis.on("error", () => { });
    }
    async registerConnection(tenantId, dto) {
        const conn = await this.repo.createConnection(tenantId, {
            destination: dto.destination,
            destinationName: dto.destinationName ?? `${dto.destination} Connection`,
            config: dto.config ?? {},
        });
        return {
            connectionId: conn.id,
            destination: conn.destination,
            destinationName: conn.destinationName,
            config: conn.config,
            isActive: conn.isActive,
            createdAt: conn.createdAt,
        };
    }
    async getConnections(tenantId) {
        const conns = await this.repo.findConnections(tenantId);
        return conns.map((c) => ({
            connectionId: c.id,
            destination: c.destination,
            destinationName: c.destinationName,
            config: c.config,
            isActive: c.isActive,
            createdAt: c.createdAt,
        }));
    }
    async testConnection(tenantId, connectionId) {
        const conn = await this.repo.findConnectionById(tenantId, connectionId);
        if (!conn)
            throw new common_1.HttpException("Connection not found", common_1.HttpStatus.NOT_FOUND);
        try {
            const sample = await this.repo.extractAccounts(tenantId);
            return {
                success: true,
                message: `Connection OK — ${sample.length} accounts available`,
            };
        }
        catch (err) {
            return {
                success: false,
                message: `Connection test failed: ${err.message}`,
            };
        }
    }
    async getExportRuns(tenantId, connectionId) {
        const runs = await this.repo.findExportRuns(tenantId, connectionId);
        return runs.map((r) => ({
            runId: r.id,
            connectionId: r.connectionId,
            destination: r.connection?.destination,
            status: r.status,
            rowsExported: r.rowsExported,
            filePaths: r.filePaths ?? {},
            startedAt: r.startedAt,
            completedAt: r.completedAt ?? null,
            errorMessage: r.errorMessage ?? null,
            downloadUrls: this.buildDownloadUrls(tenantId, r.id, r.filePaths),
        }));
    }
    async getExportDownloadStream(tenantId, runId, dataset, format) {
        const run = await this.repo.findExportRunById(tenantId, runId);
        if (!run)
            throw new common_1.NotFoundException("Export run not found");
        const path = this.storage.resolveDownloadPath(tenantId, runId, dataset, format);
        if (!path)
            throw new common_1.NotFoundException("Export file not found");
        return {
            stream: (0, fs_1.createReadStream)(path),
            path,
            contentType: format === "csv" ? "text/csv" : "application/octet-stream",
        };
    }
    async triggerReplay(tenantId, dto) {
        const conn = await this.repo.findConnectionById(tenantId, dto.connectionId);
        if (!conn)
            throw new common_1.HttpException("Connection not found", common_1.HttpStatus.NOT_FOUND);
        const idempotencyStr = `${tenantId}-${dto.connectionId}-${dto.datasetName}-${dto.windowStart}-${dto.windowEnd}`;
        const idempotencyKey = idempotencyStr.replace(/:/g, "-");
        const runId = (0, crypto_1.randomUUID)();
        await this.exportQueue.add("data-cloud-export", {
            tenantId,
            connectionId: dto.connectionId,
            datasetName: dto.datasetName,
            syncMode: "full_backfill",
            windowStart: dto.windowStart,
            windowEnd: dto.windowEnd,
            idempotencyKey,
            runId,
        }, {
            jobId: idempotencyKey,
            attempts: 3,
            backoff: { type: "exponential", delay: 3000 },
        });
        return {
            status: "queued",
            runId,
            message: "Replay run queued for execution.",
        };
    }
    async runScheduledExport(tenantId, connectionId, existingRunId) {
        if (!EXPORT_ENABLED) {
            this.logger.warn("Data export disabled — M10_DATA_EXPORT_ENABLED=false");
            return;
        }
        const conn = await this.repo.findConnectionById(tenantId, connectionId);
        if (!conn)
            throw new common_1.HttpException("Connection not found", common_1.HttpStatus.NOT_FOUND);
        const lockKey = `m10_data_export:lock:${tenantId}:${connectionId}`;
        const existing = await this.redis.get(lockKey);
        if (existing) {
            this.logger.warn(`Export aborted: lock held tenant=${tenantId} conn=${connectionId}`);
            return;
        }
        const syncId = (0, crypto_1.randomUUID)();
        await this.redis.set(lockKey, syncId, "EX", LOCK_TTL_SECONDS);
        const run = existingRunId
            ? await this.repo.findExportRunById(tenantId, existingRunId)
            : await this.repo.createExportRun({
                tenantId,
                connectionId,
                status: "running",
            });
        if (!run)
            throw new common_1.HttpException("Export run not found", common_1.HttpStatus.NOT_FOUND);
        const filePaths = {};
        let totalRows = 0;
        try {
            for (const dataset of DATASETS) {
                const result = await this.exportDataset(tenantId, run.id, conn.destination, conn.config, dataset);
                totalRows += result.rowCount;
                filePaths[dataset] = result.files;
            }
            await this.repo.updateExportRun(run.id, {
                status: "success",
                rowsExported: totalRows,
                filePaths,
                completedAt: new Date(),
            });
        }
        catch (err) {
            await this.repo.updateExportRun(run.id, {
                status: "failed",
                errorMessage: err.message,
                filePaths,
                completedAt: new Date(),
            });
            throw err;
        }
        finally {
            await this.redis.del(lockKey);
        }
    }
    async exportDataset(tenantId, runId, destination, config, dataset) {
        const checkpoint = await this.repo.getCheckpoint(tenantId, dataset);
        const since = checkpoint?.lastCursor
            ? new Date(checkpoint.lastCursor)
            : undefined;
        let rows = [];
        switch (dataset) {
            case "accounts":
                rows = await this.repo.extractAccounts(tenantId, since);
                break;
            case "contacts":
                rows = await this.repo.extractContacts(tenantId, since);
                break;
            case "deals":
                rows = await this.repo.extractDeals(tenantId, since);
                break;
            case "activities":
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
                    downloadCsv: this.storage.downloadUrl(runId, dataset, "csv"),
                    downloadParquet: this.storage.downloadUrl(runId, dataset, "parquet"),
                },
            };
        }
        const plain = rows.map((r) => ({
            ...r,
            updatedAt: r.updatedAt?.toISOString?.() ?? r.updatedAt,
        }));
        await (0, csv_export_writer_1.writeCsvExport)(paths.csv, plain);
        await (0, parquet_export_writer_1.writeParquetExport)(paths.parquet, plain);
        const latestUpdatedAt = rows.reduce((max, r) => (new Date(r.updatedAt) > max ? new Date(r.updatedAt) : max), new Date(0));
        await this.repo.upsertCheckpoint(tenantId, dataset, latestUpdatedAt.toISOString());
        await this.warehouse.sync({
            tenantId,
            connectionId: runId,
            destination,
            config: config,
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
                downloadCsv: this.storage.downloadUrl(runId, dataset, "csv"),
                downloadParquet: this.storage.downloadUrl(runId, dataset, "parquet"),
            },
        };
    }
    buildDownloadUrls(tenantId, runId, filePaths) {
        if (!filePaths)
            return {};
        const out = {};
        for (const ds of Object.keys(filePaths)) {
            out[ds] = {
                csv: filePaths[ds]?.downloadCsv ??
                    this.storage.downloadUrl(runId, ds, "csv"),
                parquet: filePaths[ds]?.downloadParquet ??
                    this.storage.downloadUrl(runId, ds, "parquet"),
            };
        }
        return out;
    }
};
exports.DataCloudService = DataCloudService;
exports.DataCloudService = DataCloudService = DataCloudService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(3, (0, bullmq_1.InjectQueue)(data_cloud_events_1.M10_DATA_CLOUD_QUEUES.EXPORT)),
    __metadata("design:paramtypes", [data_cloud_repository_1.DataCloudRepository,
        export_storage_service_1.ExportStorageService,
        warehouse_registry_1.WarehouseRegistry,
        bullmq_2.Queue])
], DataCloudService);
//# sourceMappingURL=data-cloud.service.js.map