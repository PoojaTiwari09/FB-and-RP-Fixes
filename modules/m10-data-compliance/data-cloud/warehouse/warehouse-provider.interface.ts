export interface WarehouseSyncContext {
  tenantId: string;
  connectionId: string;
  destination: string;
  config: Record<string, unknown>;
  dataset: string;
  csvPath: string;
  parquetPath: string;
  rowCount: number;
}

export interface WarehouseSyncResult {
  ok: boolean;
  destination: string;
  detail?: string;
  externalId?: string;
}

export interface WarehouseProvider {
  readonly name: string;
  supports(destination: string): boolean;
  sync(ctx: WarehouseSyncContext): Promise<WarehouseSyncResult>;
}
