/**
 * Optional Supabase client for Live Assist session persistence.
 * When URL/anon key are not in localStorage, returns null — Live Assist still works in-memory.
 */
import { createClient } from '@supabase/supabase-js';

/** @type {import('@supabase/supabase-js').SupabaseClient | null | undefined} */
let cached = undefined;

export function resetSupabaseClient() {
  cached = undefined;
}

/**
 * @returns {import('@supabase/supabase-js').SupabaseClient | null}
 */
export function getSupabaseClient() {
  if (cached !== undefined) return cached;

  const url =
    typeof localStorage !== 'undefined' ? localStorage.getItem('supabase_url') : '';
  const key =
    typeof localStorage !== 'undefined' ? localStorage.getItem('supabase_anon_key') : '';

  if (!url?.trim() || !key?.trim()) {
    cached = null;
    return null;
  }

  try {
    cached = createClient(url.trim(), key.trim());
    return cached;
  } catch (e) {
    console.warn('[supabase] Failed to create client:', e);
    cached = null;
    return null;
  }
}
