import { createClient } from "@supabase/supabase-js";

// Singleton client — reuse across requests to avoid connection overhead
let _cachedUrl: string | null = null;
let _adminClient: ReturnType<typeof createClient> | null = null;

export function hasSupabaseEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error("Supabase env is not configured.");
  }

  // Reuse existing client if URL hasn't changed
  if (_adminClient && _cachedUrl === url) {
    return _adminClient;
  }

  _cachedUrl = url;
  _adminClient = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return _adminClient;
}
