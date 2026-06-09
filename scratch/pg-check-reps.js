const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://revenue_user:revenue_pass@127.0.0.1:5433/revenue_intelligence?schema=public'
});

async function main() {
  await client.connect();

  const users = await client.query('SELECT name, email FROM "User" WHERE role = \'SALES_REP\'');
  console.log(`Total Sales Reps: ${users.rowCount}`);
  users.rows.forEach(user => {
    console.log(`- ${user.name} (${user.email})`);
  });

  await client.end();
}

main().catch(console.error);
