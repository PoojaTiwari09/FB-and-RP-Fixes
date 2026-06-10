"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
const data_source_1 = require("../database/data-source");
const user_seed_1 = require("./user.seed");
const board_seed_1 = require("./board.seed");
async function runSeeds() {
    console.log('🌱 Starting database seeding...');
    const dataSource = new typeorm_1.DataSource(data_source_1.dataSourceOptions);
    try {
        await dataSource.initialize();
        console.log('✅ Database connection established');
        await (0, user_seed_1.seedUsers)(dataSource);
        const seedBoardsFlag = process.env.SEED_BOARDS === 'true';
        if (seedBoardsFlag) {
            await (0, board_seed_1.seedBoards)(dataSource);
        }
        else {
            console.log('ℹ️  Skipping board seeding (set SEED_BOARDS=true to enable)');
        }
        console.log('ℹ️  Deal data will be populated via HubSpot sync');
        console.log('ℹ️  Run: POST /api/v1/sync/deals/full');
        await dataSource.destroy();
        console.log('✅ Database seeding completed');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Error during seeding:', error);
        if (dataSource.isInitialized) {
            await dataSource.destroy();
        }
        process.exit(1);
    }
}
runSeeds();
//# sourceMappingURL=run-seeds.js.map