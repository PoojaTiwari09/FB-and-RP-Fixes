import { PrismaClient } from '@rri/database';

const globalForPrisma = globalThis as unknown as { m07Prisma?: PrismaClient };

export const prisma = globalForPrisma.m07Prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.m07Prisma = prisma;
}
