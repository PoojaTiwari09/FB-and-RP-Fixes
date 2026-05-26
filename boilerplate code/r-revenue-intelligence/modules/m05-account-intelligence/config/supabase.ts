/**
 * Supabase client singleton for NestJS
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!supabaseInstance) {
    const url = process.env.SUPABASE_URL || 'http://localhost:54321';
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
    if (!key) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY not set');
    }
    supabaseInstance = createClient(url, key);
  }
  return supabaseInstance;
}
