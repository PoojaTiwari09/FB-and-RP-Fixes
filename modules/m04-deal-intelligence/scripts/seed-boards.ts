import { DataSource } from 'typeorm';
import { dataSourceOptions } from '../database/data-source';
import { seedBoards } from '../seeds/board.seed';

async function runBoardSeed() {
  console.log('🌱 Starting board seeding...');

  const dataSource = new DataSource(dataSourceOptions);

  try {
    await dataSource.initialize();
    console.log('✅ Database connection established');

    await seedBoards(dataSource);

    await dataSource.destroy();
    console.log('✅ Board seeding completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding boards:', error);
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
    process.exit(1);
  }
}

runBoardSeed();
