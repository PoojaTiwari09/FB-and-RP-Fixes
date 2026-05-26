// src/modules/database/database.service.ts
// PostgreSQL wrapper used by all repositories.

import { Injectable, OnModuleDestroy, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool, PoolClient } from 'pg';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private pool: Pool;
  private readonly logger = new Logger(DatabaseService.name);

  constructor(private readonly config: ConfigService) {}

  onModuleInit() {
    this.pool = new Pool({
      connectionString: this.config.get<string>('DATABASE_URL'),
      max: 20,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    });
    this.pool.on('error', (err) => this.logger.error('Unexpected pool error', err));
  }

  async onModuleDestroy() {
    await this.pool.end();
  }

  /** Execute a query and return all rows. */
  async many<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]> {
    const result = await this.pool.query(sql, params);
    return result.rows as T[];
  }

  /** Execute a query and return exactly one row (throws if 0 or >1). */
  async one<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T> {
    const result = await this.pool.query(sql, params);
    if (result.rows.length === 0) throw new Error('Expected one row, got none');
    return result.rows[0] as T;
  }

  /** Execute a query and return zero or one row. */
  async oneOrNone<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T | null> {
    const result = await this.pool.query(sql, params);
    return (result.rows[0] ?? null) as T | null;
  }

  /** Execute a query (INSERT/UPDATE/DELETE) — no return. */
  async query(sql: string, params?: unknown[]): Promise<void> {
    await this.pool.query(sql, params);
  }

  /** Execute a query and return the raw pg result. */
  async raw(sql: string, params?: unknown[]) {
    return this.pool.query(sql, params);
  }

  /** Run multiple statements in a transaction. */
  async transaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await fn(client);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}
