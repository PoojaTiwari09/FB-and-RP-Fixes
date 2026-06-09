import { DataSource } from 'typeorm';
import { dataSourceOptions } from '../database/data-source';
import { seedUsers } from './user.seed';
import { seedBoards } from './board.seed';

async function runSeeds() {
  console.log('🌱 Starting database seeding...');

  const dataSource = new DataSource(dataSourceOptions);

  try {
    await dataSource.initialize();
    console.log('✅ Database connection established');

    // Seed users (always run)
    await seedUsers(dataSource);

    // Seed sample boards (optional)
    const seedBoardsFlag = process.env.SEED_BOARDS === 'true';
    
    if (seedBoardsFlag) {
      await seedBoards(dataSource);
    } else {
      console.log('ℹ️  Skipping board seeding (set SEED_BOARDS=true to enable)');
    }

    // Note: Deal data will come from HubSpot sync
    console.log('ℹ️  Deal data will be populated via HubSpot sync');
    console.log('ℹ️  Run: POST /api/v1/sync/deals/full');

    await dataSource.destroy();
    console.log('✅ Database seeding completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
    process.exit(1);
  }
}

runSeeds();
