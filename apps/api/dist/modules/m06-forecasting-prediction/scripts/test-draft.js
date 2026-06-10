"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const period = await prisma.forecastPeriod.findFirst({ where: { status: 'open' } });
    const latestSub = await prisma.forecastSubmission.findFirst({
        where: { periodId: period.id, repUserId: 'rep-02' },
        orderBy: { version: 'desc' }
    });
    console.log("Found latestSub:", latestSub);
    try {
        const newSub = await prisma.forecastSubmission.create({
            data: {
                tenantId: latestSub.tenantId,
                periodId: latestSub.periodId,
                repUserId: latestSub.repUserId,
                lob: latestSub.lob,
                version: latestSub.version + 1,
                commitForecast: latestSub.commitForecast,
                bestCaseForecast: latestSub.bestCaseForecast,
                notes: latestSub.notes,
                status: 'draft',
                managerOverride: latestSub.managerOverride,
                managerComment: latestSub.managerComment,
                managerId: latestSub.managerId,
                managerName: latestSub.managerName,
            }
        });
        console.log("Created successfully:", newSub);
    }
    catch (e) {
        console.error("Error creating:", e);
    }
}
main().catch(console.error).finally(() => prisma.$disconnect());
//# sourceMappingURL=test-draft.js.map