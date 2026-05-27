import { createClient } from "@supabase/supabase-js";

let _client = null;

export function getSupabaseClient() {
  const url = localStorage.getItem("supabase_url");
  const key = localStorage.getItem("supabase_anon_key");
  if (!url || !key) {
    _client = null;
    return null;
  }
  
  // If keys changed in localStorage, force a re-init
  const currentUrl = _client?.supabaseUrl;
  const currentKey = _client?.supabaseKey;
  
  if (!_client || currentUrl !== url || currentKey !== key) {
    _client = createClient(url, key);
  }
  return _client;
}

export function resetSupabaseClient() {
  _client = null;
}

export function isSupabaseConfigured() {
  return !!(localStorage.getItem("supabase_url") && localStorage.getItem("supabase_anon_key"));
}
