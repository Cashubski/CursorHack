import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;

// Accept either the new-style publishable key (sb_publishable_...) or the
// legacy anon key. Both are safe to expose to the browser and operate under RLS.
const publishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let cached: SupabaseClient | null | undefined;

/**
 * Returns a Supabase client when the public env vars are configured, otherwise
 * null. Callers fall back to local storage so the demo runs with zero setup.
 */
export function getSupabase(): SupabaseClient | null {
  if (cached !== undefined) return cached;
  cached = url && publishableKey ? createClient(url, publishableKey) : null;
  return cached;
}

export const isSupabaseConfigured = Boolean(url && publishableKey);

export const TASKS_TABLE = "tasks";
