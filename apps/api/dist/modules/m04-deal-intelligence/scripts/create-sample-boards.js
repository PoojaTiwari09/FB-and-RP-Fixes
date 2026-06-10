"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const typeorm_1 = require("typeorm");
const data_source_1 = require("../database/data-source");
const entities_1 = require("../entities");
async function createBoards() {
    const dataSource = new typeorm_1.DataSource(data_source_1.dataSourceOptions);
    try {
        await dataSource.initialize();
        console.log('✅ Connected to database');
        const boardRepo = dataSource.getRepository(entities_1.DealBoard);
        const userRepo = dataSource.getRepository('User');
        const adminUser = await userRepo
            .createQueryBuilder('user')
            .where('user.role = :role', { role: 'ADMIN' })
            .getOne();
        if (!adminUser) {
            console.error('❌ No admin user found');
            process.exit(1);
        }
        await boardRepo.delete({});
        console.log('  ✓ Cleared existing boards');
        const boards = [
            {
                name: 'Q1 2024 Pipeline',
                description: 'Active deals for Q1 2024 forecast',
                audience: [entities_1.BoardAudience.AE, entities_1.BoardAudience.MANAGER],
                status: entities_1.BoardStatus.PUBLISHED,
                ownerId: adminUser.id,
                publishedAt: new Date(),
            },
            {
                name: 'High Risk Deals',
                description: 'Deals requiring immediate attention',
                audience: [entities_1.BoardAudience.MANAGER, entities_1.BoardAudience.EXEC],
                status: entities_1.BoardStatus.PUBLISHED,
                ownerId: adminUser.id,
                publishedAt: new Date(),
            },
            {
                name: 'Closing This Month',
                description: 'Deals expected to close within 30 days',
                audience: [entities_1.BoardAudience.AE, entities_1.BoardAudience.MANAGER],
                status: entities_1.BoardStatus.PUBLISHED,
                ownerId: adminUser.id,
                publishedAt: new Date(),
            },
        ];
        for (const boardData of boards) {
            const board = boardRepo.create(boardData);
            await boardRepo.save(board);
            console.log(`  ✓ Created board: ${board.name}`);
        }
        console.log('✅ Done!');
        await dataSource.destroy();
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Error:', error);
        if (dataSource.isInitialized) {
            await dataSource.destroy();
        }
        process.exit(1);
    }
}
createBoards();
//# sourceMappingURL=create-sample-boards.js.map