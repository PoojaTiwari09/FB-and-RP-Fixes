const path = require('path');
const generated = require(path.resolve(
  __dirname,
  'r-revenue-intelligence-monorepo',
  'boilerplate code',
  'r-revenue-intelligence',
  'packages',
  'database',
  'node_modules',
  '.prisma',
  'client',
));
const prisma = new generated.PrismaClient({ log: ['error', 'warn'] });
(async () => {
  console.log('-- attempting MANAGER user.create --');
  try {
    const r = await prisma.user.create({
      data: {
        id: 'cu22222222manager22',
        tenantId: '11111111-1111-1111-1111-111111111111',
        email: '[email protected]',
        name: 'Demo Manager',
        role: 'MANAGER',
        passwordHash: 'noop',
      },
    });
    console.log('created:', r);
  } catch (err) {
    console.log('CREATE FAIL:', err.code, err.meta, '\n', err.message.split('\n').slice(0, 4).join('\n'));
  }
  const all = await prisma.user.findMany();
  console.log('all users:', all.length, all.map(u => u.email));
  await prisma.$disconnect();
})();
