import { Injectable, Logger } from '@nestjs/common';
import type { WarehouseProvider, WarehouseSyncContext, WarehouseSyncResult } from './warehouse-provider.interface';

@Injectable()
class LocalFileWarehouseProvider implements WarehouseProvider {
  readonly name = 'local-file';

  supports(destination: string): boolean {
    return destination === 'postgres' || destination === 's3' || destination === 'local';
  }

  async sync(ctx: WarehouseSyncContext): Promise<WarehouseSyncResult> {
    return {
      ok: true,
      destination: ctx.destination,
      detail: `Files staged: csv=${ctx.csvPath}, parquet=${ctx.parquetPath}, rows=${ctx.rowCount}`,
      externalId: `local:${ctx.dataset}`,
    };
  }
}

@Injectable()
class SnowflakeWarehouseProvider implements WarehouseProvider {
  private readonly logger = new Logger(SnowflakeWarehouseProvider.name);
  readonly name = 'snowflake';

  supports(destination: string): boolean {
    return destination === 'snowflake';
  }

  async sync(ctx: WarehouseSyncContext): Promise<WarehouseSyncResult> {
    const account = ctx.config.account as string | undefined;
    const warehouse = ctx.config.warehouse as string | undefined;
    if (!account || !warehouse) {
      return { ok: false, destination: 'snowflake', detail: 'Missing account/warehouse in connection config' };
    }
    this.logger.log(
      `[snowflake-hook] tenant=${ctx.tenantId} dataset=${ctx.dataset} rows=${ctx.rowCount} stage=${ctx.csvPath}`,
    );
    return {
      ok: true,
      destination: 'snowflake',
      detail: 'Snowflake COPY hook acknowledged (connector stub — files ready for ingest)',
      externalId: `sf:${ctx.tenantId}:${ctx.dataset}`,
    };
  }
}

@Injectable()
class BigQueryWarehouseProvider implements WarehouseProvider {
  private readonly logger = new Logger(BigQueryWarehouseProvider.name);
  readonly name = 'bigquery';

  supports(destination: string): boolean {
    return destination === 'bigquery';
  }

  async sync(ctx: WarehouseSyncContext): Promise<WarehouseSyncResult> {
    const projectId = ctx.config.projectId as string | undefined;
    const datasetId = ctx.config.datasetId as string | undefined;
    if (!projectId || !datasetId) {
      return { ok: false, destination: 'bigquery', detail: 'Missing projectId/datasetId in connection config' };
    }
    this.logger.log(
      `[bigquery-hook] tenant=${ctx.tenantId} dataset=${ctx.dataset} rows=${ctx.rowCount} load=${ctx.parquetPath}`,
    );
    return {
      ok: true,
      destination: 'bigquery',
      detail: 'BigQuery load job hook acknowledged (connector stub — files ready for ingest)',
      externalId: `bq:${projectId}.${datasetId}.${ctx.dataset}`,
    };
  }
}

@Injectable()
export class WarehouseRegistry {
  private readonly providers: WarehouseProvider[];

  constructor() {
    this.providers = [
      new LocalFileWarehouseProvider(),
      new SnowflakeWarehouseProvider(),
      new BigQueryWarehouseProvider(),
    ];
  }

  resolve(destination: string): WarehouseProvider {
    return this.providers.find(p => p.supports(destination)) ?? this.providers[0];
  }

  async sync(ctx: WarehouseSyncContext): Promise<WarehouseSyncResult> {
    const provider = this.resolve(ctx.destination);
    return provider.sync(ctx);
  }
}
