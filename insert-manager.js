const { Client } = require('pg');
const client = new Client({ connectionString: 'postgresql://revenue_user:revenue_pass@127.0.0.1:5432/revenue_intelligence?schema=public' });
async function run() {
  await client.connect();
  await client.query("INSERT INTO \"User\" (id, tenantid, email, name, role, status, \"createdAt\", \"updatedAt\") VALUES ('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000001', 'alex.morgan@relanto.com', 'Alex Morgan', 'MANAGER', 'ACTIVE', NOW(), NOW()) ON CONFLICT (id) DO UPDATE SET role='MANAGER', status='ACTIVE'");
  console.log('Inserted');
  await client.end();
}
run();
