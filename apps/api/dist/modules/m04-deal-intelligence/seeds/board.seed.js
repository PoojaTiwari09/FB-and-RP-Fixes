"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedBoards = seedBoards;
const entities_1 = require("../entities");
async function seedBoards(dataSource) {
    console.log('🌱 Seeding sample boards...');
    const boardRepository = dataSource.getRepository(entities_1.DealBoard);
    const userRepository = dataSource.getRepository(entities_1.User);
    const existingBoards = await boardRepository.count();
    if (existingBoards > 0) {
        console.log('ℹ️  Boards already exist, skipping seed');
        return;
    }
    const adminUser = await userRepository
        .createQueryBuilder('user')
        .where('user.role = :role', { role: 'ADMIN' })
        .getOne();
    if (!adminUser) {
        console.log('⚠️  No admin user found, skipping board seed');
        return;
    }
    const board1 = boardRepository.create({
        name: 'Q1 2024 Pipeline',
        description: 'Active deals for Q1 2024 forecast',
        ownerId: adminUser.id,
        audience: [entities_1.BoardAudience.AE, entities_1.BoardAudience.MANAGER],
        status: entities_1.BoardStatus.PUBLISHED,
        publishedAt: new Date(),
    });
    await boardRepository.save(board1);
    console.log(`  ✅ Created board: ${board1.name}`);
    const board2 = boardRepository.create({
        name: 'High Risk Deals',
        description: 'Deals requiring immediate attention',
        ownerId: adminUser.id,
        audience: [entities_1.BoardAudience.MANAGER, entities_1.BoardAudience.EXEC],
        status: entities_1.BoardStatus.PUBLISHED,
        publishedAt: new Date(),
    });
    await boardRepository.save(board2);
    console.log(`  ✅ Created board: ${board2.name}`);
    const board3 = boardRepository.create({
        name: 'Closing This Month',
        description: 'Deals expected to close within 30 days',
        ownerId: adminUser.id,
        audience: [entities_1.BoardAudience.AE, entities_1.BoardAudience.MANAGER],
        status: entities_1.BoardStatus.PUBLISHED,
        publishedAt: new Date(),
    });
    await boardRepository.save(board3);
    console.log(`  ✅ Created board: ${board3.name}`);
    const board4 = boardRepository.create({
        name: 'Team Deal Board',
        description: 'Manager-level team pipeline board tracking all reps deals',
        ownerId: adminUser.id,
        audience: [entities_1.BoardAudience.MANAGER],
        status: entities_1.BoardStatus.PUBLISHED,
        publishedAt: new Date(),
    });
    await boardRepository.save(board4);
    console.log(`  ✅ Created board: ${board4.name}`);
    console.log('✅ Board seeding completed');
}
//# sourceMappingURL=board.seed.js.map