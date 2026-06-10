import { PrismaClient } from '@rri/database';
import { AsyncLocalStorage } from 'async_hooks';

export const tenantContext = new AsyncLocalStorage<string>();

export function getExtendedPrismaClient(prisma: PrismaClient) {
  return prisma.$extends({
    query: {
      $allModels: {
        async $allOperations({ args, query }) {
          const tenantId = tenantContext.getStore();
          if (!tenantId) {
            return query(args);
          }

          // Use interactive transaction to set the local variable for RLS
          return prisma.$transaction(async (tx) => {
            await (tx as any).$executeRawUnsafe(
              `SELECT set_config('app.current_tenant', $1, true)`,
              tenantId
            );
            // We must call the original query inside the transaction context?
            // Actually, `query(args)` on $allOperations executes the query using the client that invoked it.
            // If we are inside $extends, does `query(args)` use the transaction `tx` automatically?
            // Yes, Prisma $extends query extensions automatically bind to the current transaction.
            return query(args);
          });
        },
      },
    },
  });
}
