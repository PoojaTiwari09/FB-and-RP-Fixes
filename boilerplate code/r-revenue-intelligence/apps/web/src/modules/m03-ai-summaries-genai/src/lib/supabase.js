import { createClient } from "@supabase/supabase-js";

let _client = null;

export function getSupabaseClient() {
  if (typeof window === "undefined") return null;
  
  // 1. Try localStorage first
  let url = localStorage.getItem("supabase_url");
  let key = localStorage.getItem("supabase_anon_key");
  
  // 2. Fall back to Vite environment variables if not set
  if (!url || !key) {
    url = import.meta.env.VITE_SUPABASE_URL || "";
    key = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
  }
  
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
  const hasLocal = !!(localStorage.getItem("supabase_url") && localStorage.getItem("supabase_anon_key"));
  const hasEnv = !!(import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_ANON_KEY);
  return hasLocal || hasEnv;
}
