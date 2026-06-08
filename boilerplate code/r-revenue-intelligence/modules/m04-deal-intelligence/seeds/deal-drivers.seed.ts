import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

import { PrismaClient } from '@rri/database';

const prisma = new PrismaClient();

const SEED_DRIVERS = [
  {
    dealId: 'deal-1',
    boardId: '1',
    name: 'Resolve no next step — Acme Corp',
    type: 'action',
    priority: 'high',
    warningType: 'no_next_step',
    owner: 'Lakshmi Prasanna Dara',
  },
  {
    dealId: 'deal-2',
    boardId: '1',
    name: 'Multi-thread TechStart stakeholders',
    type: 'coaching',
    priority: 'medium',
    warningType: 'single_threaded',
    owner: 'Lakshmi Prasanna Dara',
  },
  {
    dealId: 'deal-4',
    boardId: '1',
    name: 'Build close plan — MidMarket Co',
    type: 'risk',
    priority: 'high',
    warningType: 'no_close_plan',
    owner: 'Lakshmi Prasanna Dara',
  },
];

async function main() {
  for (const d of SEED_DRIVERS) {
    const existing = await prisma.m04DealDriver.findFirst({
      where: { dealId: d.dealId, name: d.name },
    });
    if (existing) continue;
    await prisma.m04DealDriver.create({
      data: {
        tenantId: 'default',
        dealId: d.dealId,
        boardId: d.boardId,
        name: d.name,
        type: d.type,
        status: 'active',
        priority: d.priority,
        owner: d.owner,
        warningType: d.warningType,
      },
    });
  }
  console.log('M04 deal drivers seed complete');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
