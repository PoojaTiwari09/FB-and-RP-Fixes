import { DataSource } from 'typeorm';
import { dataSourceOptions } from '../database/data-source';
import { DealBoard, BoardAudience, BoardStatus } from '../entities';

async function createBoards() {
  const dataSource = new DataSource(dataSourceOptions);

  try {
    await dataSource.initialize();
    console.log('✅ Connected to database');

    const boardRepo = dataSource.getRepository(DealBoard);
    const userRepo = dataSource.getRepository('User');

    // Get admin user
    const adminUser = await userRepo
      .createQueryBuilder('user')
      .where('user.role = :role', { role: 'ADMIN' })
      .getOne();

    if (!adminUser) {
      console.error('❌ No admin user found');
      process.exit(1);
    }

    // Delete existing boards
    await boardRepo.delete({});
    console.log('  ✓ Cleared existing boards');

    // Create sample boards
    const boards = [
      {
        name: 'Q1 2024 Pipeline',
        description: 'Active deals for Q1 2024 forecast',
        audience: [BoardAudience.AE, BoardAudience.MANAGER],
        status: BoardStatus.PUBLISHED,
        ownerId: adminUser.id,
        publishedAt: new Date(),
      },
      {
        name: 'High Risk Deals',
        description: 'Deals requiring immediate attention',
        audience: [BoardAudience.MANAGER, BoardAudience.EXEC],
        status: BoardStatus.PUBLISHED,
        ownerId: adminUser.id,
        publishedAt: new Date(),
      },
      {
        name: 'Closing This Month',
        description: 'Deals expected to close within 30 days',
        audience: [BoardAudience.AE, BoardAudience.MANAGER],
        status: BoardStatus.PUBLISHED,
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
  } catch (error) {
    console.error('❌ Error:', error);
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
    process.exit(1);
  }
}

createBoards();
