"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
const data_source_1 = require("../database/data-source");
const user_seed_1 = require("../seeds/user.seed");
async function resetUsers() {
    console.log('🔄 Resetting users...');
    const dataSource = new typeorm_1.DataSource(data_source_1.dataSourceOptions);
    try {
        await dataSource.initialize();
        console.log('✅ Database connection established');
        await dataSource.query('DELETE FROM sessions');
        await dataSource.query('DELETE FROM users');
        console.log('  ✓ Deleted all existing users and sessions');
        await (0, user_seed_1.seedUsers)(dataSource);
        await dataSource.destroy();
        console.log('✅ User reset completed');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Error resetting users:', error);
        if (dataSource.isInitialized) {
            await dataSource.destroy();
        }
        process.exit(1);
    }
}
resetUsers();
//# sourceMappingURL=reset-users.js.map