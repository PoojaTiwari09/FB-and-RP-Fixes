/**
 * Seed M09 trainer scenarios into dashboards.trainerscenarios (unified @rri/database schema).
 * Run: pnpm exec tsx scripts/seed-m09-dashboards.ts
 */
import { PrismaClient } from '@rri/database';

const prisma = new PrismaClient();
const TENANT = '00000000-0000-0000-0000-000000000001';
const CREATED_BY = '00000000-0000-0000-0000-000000000002';

async function main() {
  console.log('Seeding M09 trainerscenarios…');
  await prisma.trainerscenarios.upsert({
    where: { scenarioid: '00000000-0000-0000-0000-000000000099' },
    update: {},
    create: {
      scenarioid: '00000000-0000-0000-0000-000000000099',
      tenantid: TENANT,
      name: 'Angry Client — Enterprise Renewal',
      personadescription: 'Executive upset about downtime',
      context: 'Client is evaluating competitors after a recent outage.',
      difficulty: 'advanced',
      createdby: CREATED_BY,
    },
  });
  console.log('Done.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
