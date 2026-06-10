import { PrismaClient } from '@rri/database';
const prisma = new PrismaClient();
prisma.crmDeal.findMany().then(d => {
  console.log(d.filter(x => !x.dealName.startsWith('Historical Deal')).map(x => ({name: x.dealName, region: x.region})));
});

