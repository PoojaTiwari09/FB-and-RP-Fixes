"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const subs = await prisma.forecastSubmission.findMany({
        where: { repUserId: 'rep-02' },
        orderBy: { version: 'desc' }
    });
    console.log(JSON.stringify(subs, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
//# sourceMappingURL=check-subs.js.map