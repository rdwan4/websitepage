import { createClient } from "@supabase/supabase-js";

// Replace this with your Supabase project URL.
const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL ||
  "https://kywejxfauqpqgwjpgpim.supabase.co";

// Replace this with your Supabase public anon/publishable key.
const SUPABASE_PUBLIC_KEY =
  import.meta.env.VITE_SUPABASE_PUBLIC_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5d2VqeGZhdXFwcWd3anBncGltIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4NDU2NTUsImV4cCI6MjA4ODQyMTY1NX0.mHhYHkyv_6SxXUFKDSpZISTDdGThhD_lIf3sU9v4ULY";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});