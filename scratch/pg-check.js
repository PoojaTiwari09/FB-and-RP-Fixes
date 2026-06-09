const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://revenue_user:revenue_pass@127.0.0.1:5433/revenue_intelligence?schema=public'
});

async function main() {
  await client.connect();

  console.log('--- Users ---');
  const users = await client.query('SELECT id, name, role FROM "User"');
  console.log(users.rows);

  console.log('\n--- Deals ---');
  const deals = await client.query('SELECT id, name, "ownerId" FROM "Deal"');
  console.log(deals.rows);

  console.log('\n--- CallRecords ---');
  const calls = await client.query('SELECT id, title, "callOwner" FROM call_records');
  console.log(calls.rows);

  await client.end();
}

main().catch(console.error);
