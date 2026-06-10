"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("@rri/database");
const prisma = new database_1.PrismaClient();
async function main() {
    const periods = await prisma.forecastPeriod.findMany({});
    console.log(JSON.stringify(periods, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
//# sourceMappingURL=check-periods.js.map