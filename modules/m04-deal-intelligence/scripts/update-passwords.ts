import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { dataSourceOptions } from '../database/data-source';

async function updatePasswords() {
  console.log('🔐 Updating user passwords...');

  const dataSource = new DataSource(dataSourceOptions);

  try {
    await dataSource.initialize();
    console.log('✅ Database connection established');

    const userRepository = dataSource.getRepository(User);

    // Update passwords for test users
    const updates = [
      { email: 'admin@example.com', password: 'Admin123!' },
      { email: 'manager@example.com', password: 'Manager123!' },
      { email: 'user@example.com', password: 'User123!' },
    ];

    for (const update of updates) {
      const user = await userRepository.findOne({ where: { email: update.email } });
      if (user) {
        user.password = await bcrypt.hash(update.password, 10);
        await userRepository.save(user);
        console.log(`  ✓ Updated password for: ${user.email}`);
      } else {
        console.log(`  ⚠ User not found: ${update.email}`);
      }
    }

    console.log('✅ Password update completed');
    await dataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating passwords:', error);
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
    process.exit(1);
  }
}

updatePasswords();
