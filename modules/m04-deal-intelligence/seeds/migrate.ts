// scripts/migrate.ts
// Run all SQL migrations in order against DATABASE_URL
import * as dotenv from 'dotenv';
dotenv.config();

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { Pool } from 'pg';

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  
  await pool.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      name TEXT PRIMARY KEY,
      run_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const migrationsDir = join(__dirname, '../db/migrations');
  const files = readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

  for (const file of files) {
    const { rows } = await pool.query('SELECT name FROM _migrations WHERE name = $1', [file]);
    if (rows.length > 0) {
      console.log(`✓ ${file} (already run)`);
      continue;
    }
    const sql = readFileSync(join(migrationsDir, file), 'utf-8');
    await pool.query(sql);
    await pool.query('INSERT INTO _migrations (name) VALUES ($1)', [file]);
    console.log(`✅ ${file}`);
  }

  await pool.end();
  console.log('All migrations complete.');
}

main().catch(err => { console.error(err); process.exit(1); });
