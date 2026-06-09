import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@rri/database';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  /**
   * Runs work inside a transaction with PostgreSQL RLS tenant context
   * (`SET LOCAL app.current_tenant`) for dashboards trainer tables.
   */
  async withTenantContext<T>(
    tenantId: string,
    fn: (tx: PrismaClient) => Promise<T>,
  ): Promise<T> {
    return this.$transaction(async (tx) => {
      await (tx as any).$executeRawUnsafe(
        `SELECT set_config('app.current_tenant', $1, true)`,
        tenantId,
      );
      return fn(tx as PrismaClient);
    });
  }
}
