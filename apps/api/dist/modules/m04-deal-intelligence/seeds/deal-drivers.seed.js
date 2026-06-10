"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv = __importStar(require("dotenv"));
const path = __importStar(require("path"));
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
const database_1 = require("@rri/database");
const prisma = new database_1.PrismaClient();
const SEED_DRIVERS = [
    {
        dealId: '00000000-0000-0000-0000-000000000021',
        boardId: '00000000-0000-0000-0000-000000000001',
        name: 'Resolve no next step — Acme Corp',
        type: 'action',
        priority: 'high',
        warningType: 'no_next_step',
        owner: 'Lakshmi Prasanna Dara',
    },
    {
        dealId: '00000000-0000-0000-0000-000000000022',
        boardId: '00000000-0000-0000-0000-000000000001',
        name: 'Multi-thread TechStart stakeholders',
        type: 'coaching',
        priority: 'medium',
        warningType: 'single_threaded',
        owner: 'Lakshmi Prasanna Dara',
    },
    {
        dealId: '00000000-0000-0000-0000-000000000024',
        boardId: '00000000-0000-0000-0000-000000000001',
        name: 'Build close plan — MidMarket Co',
        type: 'risk',
        priority: 'high',
        warningType: 'no_close_plan',
        owner: 'Lakshmi Prasanna Dara',
    },
];
async function main() {
    for (const d of SEED_DRIVERS) {
        const existing = await prisma.m04DealDriver.findFirst({
            where: { dealId: d.dealId, name: d.name },
        });
        if (existing)
            continue;
        await prisma.m04DealDriver.create({
            data: {
                tenantId: '00000000-0000-0000-0000-000000000001',
                dealId: d.dealId,
                boardId: d.boardId,
                name: d.name,
                type: d.type,
                status: 'active',
                priority: d.priority,
                owner: d.owner,
                warningType: d.warningType,
            },
        });
    }
    console.log('M04 deal drivers seed complete');
}
main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=deal-drivers.seed.js.map