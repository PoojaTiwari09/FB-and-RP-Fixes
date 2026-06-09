import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { UserRole } from '../interfaces/user-role.enum';

export async function seedUsers(dataSource: DataSource): Promise<void> {
  const userRepository = dataSource.getRepository(User);

  // Check if users already exist
  const existingUsers = await userRepository.count();
  if (existingUsers > 0) {
    console.log('✓ Users already seeded, skipping...');
    return;
  }

  console.log('Seeding users...');

  const users = [
    {
      email: 'admin@example.com',
      password: await bcrypt.hash('Admin123!', 10),
      firstName: 'Admin',
      lastName: 'User',
      role: UserRole.ADMIN,
      isActive: true,
    },
    {
      email: 'manager@example.com',
      password: await bcrypt.hash('Manager123!', 10),
      firstName: 'Manager',
      lastName: 'User',
      role: UserRole.MANAGER,
      isActive: true,
    },
    {
      email: 'user@example.com',
      password: await bcrypt.hash('User123!', 10),
      firstName: 'Sales',
      lastName: 'Rep',
      role: UserRole.USER,
      isActive: true,
    },
    {
      email: 'john.doe@example.com',
      password: await bcrypt.hash('password123', 10),
      firstName: 'John',
      lastName: 'Doe',
      role: UserRole.USER,
      isActive: true,
    },
    {
      email: 'jane.smith@example.com',
      password: await bcrypt.hash('password123', 10),
      firstName: 'Jane',
      lastName: 'Smith',
      role: UserRole.MANAGER,
      isActive: true,
    },
  ];

  for (const userData of users) {
    const user = userRepository.create(userData);
    await userRepository.save(user);
    console.log(`  ✓ Created user: ${user.email} (${user.role})`);
  }

  console.log('✓ Users seeded successfully');
}
