const { Client } = require('pg');

const url = 'postgresql://revenue_user:revenue_pass@127.0.0.1:5438/revenue_intelligence';
console.log('Connecting to:', url);

(async () => {
  const client = new Client({ connectionString: url });
  try {
    await client.connect();
    const r = await client.query('SELECT current_user, current_database(), version()');
    console.log('OK:', r.rows[0]);
    await client.end();
  } catch (err) {
    console.error('FAIL:', err.message);
    process.exit(1);
  }
})();
