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
var SnowflakeWarehouseProvider_1, BigQueryWarehouseProvider_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WarehouseRegistry = void 0;
const common_1 = require("@nestjs/common");
let LocalFileWarehouseProvider = class LocalFileWarehouseProvider {
    name = "local-file";
    supports(destination) {
        return (destination === "postgres" ||
            destination === "s3" ||
            destination === "local");
    }
    async sync(ctx) {
        return {
            ok: true,
            destination: ctx.destination,
            detail: `Files staged: csv=${ctx.csvPath}, parquet=${ctx.parquetPath}, rows=${ctx.rowCount}`,
            externalId: `local:${ctx.dataset}`,
        };
    }
};
LocalFileWarehouseProvider = __decorate([
    (0, common_1.Injectable)()
], LocalFileWarehouseProvider);
let SnowflakeWarehouseProvider = SnowflakeWarehouseProvider_1 = class SnowflakeWarehouseProvider {
    logger = new common_1.Logger(SnowflakeWarehouseProvider_1.name);
    name = "snowflake";
    supports(destination) {
        return destination === "snowflake";
    }
    async sync(ctx) {
        const account = ctx.config.account;
        const warehouse = ctx.config.warehouse;
        if (!account || !warehouse) {
            return {
                ok: false,
                destination: "snowflake",
                detail: "Missing account/warehouse in connection config",
            };
        }
        this.logger.log(`[snowflake-hook] tenant=${ctx.tenantId} dataset=${ctx.dataset} rows=${ctx.rowCount} stage=${ctx.csvPath}`);
        return {
            ok: true,
            destination: "snowflake",
            detail: "Snowflake COPY hook acknowledged (connector stub — files ready for ingest)",
            externalId: `sf:${ctx.tenantId}:${ctx.dataset}`,
        };
    }
};
SnowflakeWarehouseProvider = SnowflakeWarehouseProvider_1 = __decorate([
    (0, common_1.Injectable)()
], SnowflakeWarehouseProvider);
let BigQueryWarehouseProvider = BigQueryWarehouseProvider_1 = class BigQueryWarehouseProvider {
    logger = new common_1.Logger(BigQueryWarehouseProvider_1.name);
    name = "bigquery";
    supports(destination) {
        return destination === "bigquery";
    }
    async sync(ctx) {
        const projectId = ctx.config.projectId;
        const datasetId = ctx.config.datasetId;
        if (!projectId || !datasetId) {
            return {
                ok: false,
                destination: "bigquery",
                detail: "Missing projectId/datasetId in connection config",
            };
        }
        this.logger.log(`[bigquery-hook] tenant=${ctx.tenantId} dataset=${ctx.dataset} rows=${ctx.rowCount} load=${ctx.parquetPath}`);
        return {
            ok: true,
            destination: "bigquery",
            detail: "BigQuery load job hook acknowledged (connector stub — files ready for ingest)",
            externalId: `bq:${projectId}.${datasetId}.${ctx.dataset}`,
        };
    }
};
BigQueryWarehouseProvider = BigQueryWarehouseProvider_1 = __decorate([
    (0, common_1.Injectable)()
], BigQueryWarehouseProvider);
let WarehouseRegistry = class WarehouseRegistry {
    providers;
    constructor() {
        this.providers = [
            new LocalFileWarehouseProvider(),
            new SnowflakeWarehouseProvider(),
            new BigQueryWarehouseProvider(),
        ];
    }
    resolve(destination) {
        return (this.providers.find((p) => p.supports(destination)) ?? this.providers[0]);
    }
    async sync(ctx) {
        const provider = this.resolve(ctx.destination);
        return provider.sync(ctx);
    }
};
exports.WarehouseRegistry = WarehouseRegistry;
exports.WarehouseRegistry = WarehouseRegistry = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], WarehouseRegistry);
//# sourceMappingURL=warehouse-registry.js.map