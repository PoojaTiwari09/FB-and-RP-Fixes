"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const periods = await prisma.forecastPeriod.findMany();
    console.log(periods);
}
main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
//# sourceMappingURL=test-db.js.map