import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let cached: SupabaseClient | null | undefined;

/**
 * Returns a Supabase client when the public env vars are configured, otherwise
 * null. Callers fall back to local storage so the demo runs with zero setup.
 */
export function getSupabase(): SupabaseClient | null {
  if (cached !== undefined) return cached;
  cached = url && anonKey ? createClient(url, anonKey) : null;
  return cached;
}

export const isSupabaseConfigured = Boolean(url && anonKey);

export const TASKS_TABLE = "tasks";
