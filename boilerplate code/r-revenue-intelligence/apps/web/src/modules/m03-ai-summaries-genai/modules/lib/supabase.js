import { createClient } from "@supabase/supabase-js";

let _client = null;

export function getSupabaseClient() {
  if (typeof window === "undefined") return null;
  const url = localStorage.getItem("supabase_url");
  const key = localStorage.getItem("supabase_anon_key");
  if (!url || !key) return null;
  if (!_client) {
    _client = createClient(url, key);
  }
  return _client;
}

export function resetSupabaseClient() {
  _client = null;
}

export function isSupabaseConfigured() {
  if (typeof window === "undefined") return false;
  return !!(localStorage.getItem("supabase_url") && localStorage.getItem("supabase_anon_key"));
}
