"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("@rri/database");
const prisma = new database_1.PrismaClient();
async function main() {
    const subs = await prisma.forecastSubmission.findMany({
        where: { repUserId: 'rep-02' },
        orderBy: { version: 'desc' }
    });
    console.log(JSON.stringify(subs, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
//# sourceMappingURL=check-subs.js.map