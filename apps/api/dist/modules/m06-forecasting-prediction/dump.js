"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("@rri/database");
const prisma = new database_1.PrismaClient();
prisma.crmDeal.findMany().then(d => {
    console.log(d.filter(x => !x.dealName.startsWith('Historical Deal')).map(x => ({ name: x.dealName, region: x.region })));
});
//# sourceMappingURL=dump.js.map