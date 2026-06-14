"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const m06_service_1 = require("../services/m06.service");
const prisma = new client_1.PrismaClient();
const mockEventPublisher = {
    publish: async () => { },
    dispatch: async () => { }
};
async function main() {
    const service = new m06_service_1.M06ForecastingPredictionService(prisma, mockEventPublisher, undefined);
    try {
        const data = await service.getTeamBoard('00000000-0000-0000-0000-000000000001', undefined, undefined, '00000000-0000-0000-0000-0000000000b2');
        console.log("SUCCESS");
    }
    catch (e) {
        console.error("TEAM BOARD FAILED:", e);
    }
}
main().finally(() => prisma.$disconnect());
//# sourceMappingURL=test-teamboard.js.map