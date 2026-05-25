import { DataSource } from 'typeorm';
import { dataSourceOptions } from '../database/data-source';
import { seedUsers } from '../seeds/user.seed';

async function resetUsers() {
  console.log('🔄 Resetting users...');

  const dataSource = new DataSource(dataSourceOptions);

  try {
    await dataSource.initialize();
    console.log('✅ Database connection established');

    // Delete all users
    await dataSource.query('DELETE FROM sessions');
    await dataSource.query('DELETE FROM users');
    console.log('  ✓ Deleted all existing users and sessions');

    // Re-seed users
    await seedUsers(dataSource);

    await dataSource.destroy();
    console.log('✅ User reset completed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error resetting users:', error);
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
    process.exit(1);
  }
}

resetUsers();
