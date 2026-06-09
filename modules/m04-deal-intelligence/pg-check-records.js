const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://revenue_user:revenue_pass@127.0.0.1:5433/revenue_intelligence?schema=public'
});

async function main() {
  await client.connect();

  const usersRes = await client.query("SELECT id, name FROM \"User\" WHERE role = 'SALES_REP'");
  const users = usersRes.rows;

  const dealsRes = await client.query('SELECT "ownerId", COUNT(*) as count FROM "Deal" GROUP BY "ownerId"');
  const callsRes = await client.query('SELECT "callOwner", COUNT(*) as count FROM call_records GROUP BY "callOwner"');
  const accountsRes = await client.query('SELECT "assigned_rep_id", COUNT(*) as count FROM "Account" GROUP BY "assigned_rep_id"');

  const dealCounts = {};
  dealsRes.rows.forEach(r => { if(r.ownerId) dealCounts[r.ownerId] = parseInt(r.count, 10); });

  const callCounts = {};
  callsRes.rows.forEach(r => { if(r.callOwner) callCounts[r.callOwner] = parseInt(r.count, 10); });

  const accountCounts = {};
  accountsRes.rows.forEach(r => { if(r.assigned_rep_id) accountCounts[r.assigned_rep_id] = parseInt(r.count, 10); });

  for (const user of users) {
    const deals = dealCounts[user.id] || 0;
    const calls = callCounts[user.id] || 0;
    const accounts = accountCounts[user.id] || 0;
    console.log(`\n### ${user.name}`);
    console.log(`- Deals: ${deals}`);
    console.log(`- Calls: ${calls}`);
    console.log(`- Accounts: ${accounts}`);
    console.log(`- Total Records: ${deals + calls + accounts}`);
  }

  await client.end();
}

main().catch(console.error);
