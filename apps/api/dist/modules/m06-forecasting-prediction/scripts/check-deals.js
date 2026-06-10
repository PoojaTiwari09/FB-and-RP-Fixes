"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const deals = await prisma.crmDeal.findMany({ where: { repUserId: 'rep-02', source: 'manual' } });
    console.log(JSON.stringify(deals, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
//# sourceMappingURL=check-deals.js.map