import type { WarehouseProvider, WarehouseSyncContext, WarehouseSyncResult } from './warehouse-provider.interface';
export declare class WarehouseRegistry {
    private readonly providers;
    constructor();
    resolve(destination: string): WarehouseProvider;
    sync(ctx: WarehouseSyncContext): Promise<WarehouseSyncResult>;
}
