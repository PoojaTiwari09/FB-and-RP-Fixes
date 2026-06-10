"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
prisma.crmDeal.findMany().then(d => {
    console.log(d.filter(x => !x.dealName.startsWith('Historical Deal')).map(x => ({ name: x.dealName, region: x.region })));
});
//# sourceMappingURL=dump.js.map