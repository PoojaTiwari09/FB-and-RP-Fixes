import { DataSource } from 'typeorm';
import {
  DealBoard,
  BoardFilter,
  BoardTab,
  BoardColumn,
  BoardPermission,
  BoardStatus,
  BoardAudience,
  FilterOperator,
  FilterLogic,
  ColumnType,
  ColumnDataType,
  PermissionSubjectType,
  PermissionRole,
  User,
} from '../entities';

export async function seedBoards(dataSource: DataSource): Promise<void> {
  console.log('🌱 Seeding sample boards...');

  const boardRepository = dataSource.getRepository(DealBoard);
  const userRepository = dataSource.getRepository(User);

  // Check if boards already exist
  const existingBoards = await boardRepository.count();
  if (existingBoards > 0) {
    console.log('ℹ️  Boards already exist, skipping seed');
    return;
  }

  // Get admin user
  const adminUser = await userRepository
    .createQueryBuilder('user')
    .where('user.role = :role', { role: 'ADMIN' })
    .getOne();

  if (!adminUser) {
    console.log('⚠️  No admin user found, skipping board seed');
    return;
  }

  // Create Sample Board 1: Q1 Pipeline
  const board1 = boardRepository.create({
    name: 'Q1 2024 Pipeline',
    description: 'Active deals for Q1 2024 forecast',
    ownerId: adminUser.id,
    audience: [BoardAudience.AE, BoardAudience.MANAGER],
    status: BoardStatus.PUBLISHED,
    publishedAt: new Date(),
  });

  await boardRepository.save(board1);
  console.log(`  ✅ Created board: ${board1.name}`);

  // Create Sample Board 2: High Risk Deals
  const board2 = boardRepository.create({
    name: 'High Risk Deals',
    description: 'Deals requiring immediate attention',
    ownerId: adminUser.id,
    audience: [BoardAudience.MANAGER, BoardAudience.EXEC],
    status: BoardStatus.PUBLISHED,
    publishedAt: new Date(),
  });

  await boardRepository.save(board2);
  console.log(`  ✅ Created board: ${board2.name}`);

  // Create Sample Board 3: Closing This Month
  const board3 = boardRepository.create({
    name: 'Closing This Month',
    description: 'Deals expected to close within 30 days',
    ownerId: adminUser.id,
    audience: [BoardAudience.AE, BoardAudience.MANAGER],
    status: BoardStatus.PUBLISHED,
    publishedAt: new Date(),
  });

  await boardRepository.save(board3);
  console.log(`  ✅ Created board: ${board3.name}`);

  // Create Sample Board 4: Team Deal Board (F-010 Manager-level team board)
  const board4 = boardRepository.create({
    name: 'Team Deal Board',
    description: 'Manager-level team pipeline board tracking all reps deals',
    ownerId: adminUser.id,
    audience: [BoardAudience.MANAGER],
    status: BoardStatus.PUBLISHED,
    publishedAt: new Date(),
  });

  await boardRepository.save(board4);
  console.log(`  ✅ Created board: ${board4.name}`);

  console.log('✅ Board seeding completed');
}
