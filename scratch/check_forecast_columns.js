const { Client } = require('pg');

async function main() {
  const client = new Client({
    connectionString: 'postgresql://revenue_user:revenue_pass@127.0.0.1:5433/revenue_intelligence?schema=public'
  });
  try {
    await client.connect();
    console.log('Connected to database.');
    
    const boards = await client.query('SELECT * FROM "ForecastBoard"');
    console.log('Forecast Boards:', JSON.stringify(boards.rows, null, 2));
    
    const columns = await client.query('SELECT * FROM "ForecastColumn"');
    console.log('Forecast Columns:', JSON.stringify(columns.rows, null, 2));

    const submissions = await client.query('SELECT * FROM "forecast_submissions" ORDER BY version DESC LIMIT 5');
    console.log('Forecast Submissions (latest 5):', JSON.stringify(submissions.rows, null, 2));
  } catch (err) {
    console.error('Error querying database:', err);
  } finally {
    await client.end();
  }
}

main();
