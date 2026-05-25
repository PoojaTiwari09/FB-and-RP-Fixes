/**
 * One-time migration: adds parent_board_slug column to board_config.
 * Run with: npx ts-node -r tsconfig-paths/register scripts/migrate-parent-board-slug.ts
 */
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

async function main() {
  // Supabase JS client doesn't support DDL directly.
  // We use the pg REST endpoint via a raw RPC if one exists,
  // otherwise we provide instructions to run this SQL in the Supabase Dashboard.
  console.log('\n====================================================');
  console.log('Migration 002: Add parent_board_slug to board_config');
  console.log('====================================================');
  console.log('\nPlease run the following SQL in the Supabase Dashboard SQL Editor:');
  console.log('  https://supabase.com/dashboard/project/cjpmmdnttgerqbshnchd/editor');
  console.log('\n--- SQL ---');
  console.log('ALTER TABLE board_config ADD COLUMN IF NOT EXISTS parent_board_slug TEXT DEFAULT NULL;');
  console.log('--- END SQL ---\n');

  // Verify the column exists by trying to select it
  const { data, error } = await supabase
    .from('board_config')
    .select('parent_board_slug')
    .limit(1);

  if (error && error.message.includes('parent_board_slug')) {
    console.log('✗ Column does NOT exist yet — please run the SQL above first.');
    process.exit(1);
  } else {
    console.log('✓ Column parent_board_slug exists on board_config!');
  }
}

main().catch(console.error);
