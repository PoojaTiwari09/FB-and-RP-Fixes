"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const m06_service_1 = require("../services/m06.service");
const prisma = new client_1.PrismaClient();
async function main() {
    const service = new m06_service_1.M06ForecastingPredictionService(prisma, null);
    try {
        await service.createDeal('demo-tenant-01', {
            dealName: 'Test Deal Priya',
            stage: 'Proposal',
            amount: 1000000,
            closeDate: '2026-06-15T00:00:00Z',
            probability: 50,
            region: 'EMEA',
            lob: 'Enterprise Software',
            repUserId: 'rep-02'
        });
        console.log("Deal created successfully");
    }
    catch (e) {
        console.error("Error creating deal:", e);
    }
}
main().catch(console.error).finally(() => prisma.$disconnect());
//# sourceMappingURL=test-create-deal.js.map