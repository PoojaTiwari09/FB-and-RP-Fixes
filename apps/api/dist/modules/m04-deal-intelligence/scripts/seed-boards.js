"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
const data_source_1 = require("../database/data-source");
const board_seed_1 = require("../seeds/board.seed");
async function runBoardSeed() {
    console.log('🌱 Starting board seeding...');
    const dataSource = new typeorm_1.DataSource(data_source_1.dataSourceOptions);
    try {
        await dataSource.initialize();
        console.log('✅ Database connection established');
        await (0, board_seed_1.seedBoards)(dataSource);
        await dataSource.destroy();
        console.log('✅ Board seeding completed');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Error seeding boards:', error);
        if (dataSource.isInitialized) {
            await dataSource.destroy();
        }
        process.exit(1);
    }
}
runBoardSeed();
//# sourceMappingURL=seed-boards.js.map