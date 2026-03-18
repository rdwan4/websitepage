import { createClient } from "@supabase/supabase-js";

// Replace this with your Supabase project URL.
const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ||
  "https://kywejxfauqpqgwjpgpim.supabase.co";

// Replace this with your Supabase public anon/publishable key.
const SUPABASE_PUBLIC_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  import.meta.env.VITE_SUPABASE_PUBLIC_KEY ||
  "";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});