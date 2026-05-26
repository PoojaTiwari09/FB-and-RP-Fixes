/**
 * Supabase client singleton for NestJS.
 *
 * Patched for unified-Prisma smoke testing:
 *   - Lazy: the real `createClient` call is deferred until the first method
 *     call instead of running at class-instance-init time.
 *   - When SUPABASE_SERVICE_ROLE_KEY / SUPABASE_URL are missing, we return a
 *     stub that throws only when actually invoked — letting the rest of the
 *     module compose into the Nest container so the API can boot.
 *
 * The long-term plan (see _audit/implementation_changes.md, M03/M05 sections)
 * is to migrate this module off Supabase and onto Prisma. This patch is the
 * minimal change to unblock backend smoke tests.
 */
import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseInstance: SupabaseClient | null = null;

function buildStub(): SupabaseClient {
  const reject = () => {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY / SUPABASE_URL not set — M05 Supabase-backed endpoints are unavailable. ' +
        'Set the env vars or migrate the call to Prisma.',
    );
  };
  const proxy: any = new Proxy(
    {},
    {
      get() {
        return () => proxy;
      },
      apply() {
        reject();
      },
    },
  );
  // `from(...).select(...).eq(...).single()` -> rejected promise
  proxy.from = () => ({
    select: () => ({
      eq: () => ({
        single: async () => {
          reject();
        },
        maybeSingle: async () => {
          reject();
        },
        limit: () => ({ then: (resolve: any) => resolve({ data: [], error: null }) }),
      }),
      order: () => ({ limit: async () => ({ data: [], error: null }) }),
      limit: async () => ({ data: [], error: null }),
    }),
    insert: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
    update: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
    delete: async () => ({ data: null, error: { message: 'Supabase not configured' } }),
  });
  return proxy as SupabaseClient;
}

export function getSupabase(): SupabaseClient {
  if (supabaseInstance) return supabaseInstance;
  const url = process.env.SUPABASE_URL || '';
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
  if (!url || !key) {
    console.warn(
      '[M05] SUPABASE_SERVICE_ROLE_KEY / SUPABASE_URL not set — returning stub Supabase client. ' +
        'Supabase-backed endpoints will fail until envs are provided.',
    );
    supabaseInstance = buildStub();
  } else {
    supabaseInstance = createClient(url, key);
  }
  return supabaseInstance;
}
