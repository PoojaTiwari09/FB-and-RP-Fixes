import { OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PoolClient } from 'pg';
export declare class DatabaseService implements OnModuleInit, OnModuleDestroy {
    private readonly config;
    private pool;
    private readonly logger;
    constructor(config: ConfigService);
    onModuleInit(): void;
    onModuleDestroy(): Promise<void>;
    many<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]>;
    one<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T>;
    oneOrNone<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T | null>;
    query(sql: string, params?: unknown[]): Promise<void>;
    raw(sql: string, params?: unknown[]): Promise<import("pg").QueryResult<any>>;
    transaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T>;
}
