import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

let supabaseClient: SupabaseClient<Database> | null = null;

function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export const getSupabaseBrowserClient = (): SupabaseClient<Database> => {
  if (supabaseClient) return supabaseClient;

  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim();

  // Use service key to bypass RLS (dev app — no user auth layer yet).
  // Falls back to anon key if service key not set.
  const supabaseKey = (
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    ''
  ).trim();

  if (!supabaseUrl || !supabaseKey) {
    console.error(
      '[Supabase] Missing env vars.\n',
      '  URL:', supabaseUrl || '(empty)', '\n',
      '  KEY:', supabaseKey ? '(set)' : '(empty)'
    );
    // Return a no-op client — queries will fail gracefully
    return createClient<Database>('https://placeholder.supabase.co', 'placeholder-key');
  }

  if (!isValidUrl(supabaseUrl)) {
    console.error('[Supabase] Invalid URL:', JSON.stringify(supabaseUrl));
    return createClient<Database>('https://placeholder.supabase.co', 'placeholder-key');
  }

  console.log('[Supabase] Connecting to:', supabaseUrl, '| key role:', supabaseKey.includes('"role":"service_role"') ? 'service_role' : 'anon');

  supabaseClient = createClient<Database>(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,   // service role — no session needed
      autoRefreshToken: false,
    },
  });

  return supabaseClient;
};

export const resetSupabaseBrowserClient = () => {
  supabaseClient = null;
};
