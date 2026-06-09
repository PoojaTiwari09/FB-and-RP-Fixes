import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@rri/database';
export declare class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    withTenantContext<T>(tenantId: string, fn: (tx: PrismaClient) => Promise<T>): Promise<T>;
}
