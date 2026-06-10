"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const m06_service_1 = require("./services/m06.service");
const prisma = new client_1.PrismaClient();
const service = new m06_service_1.M06ForecastingPredictionService(prisma, { publish: () => { } });
async function run() {
    try {
        const res = await service.getAiPrediction('demo-tenant-01', 'current');
        console.log("SUCCESS:", res);
    }
    catch (e) {
        console.error("FAILED:", e);
    }
    finally {
        await prisma.$disconnect();
    }
}
run();
//# sourceMappingURL=debug.js.map