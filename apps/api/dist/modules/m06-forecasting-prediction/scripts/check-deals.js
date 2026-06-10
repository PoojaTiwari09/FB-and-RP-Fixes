"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("@rri/database");
const prisma = new database_1.PrismaClient();
async function main() {
    const deals = await prisma.crmDeal.findMany({ where: { repUserId: 'rep-02', source: 'manual' } });
    console.log(JSON.stringify(deals, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
//# sourceMappingURL=check-deals.js.map