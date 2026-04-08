import { createClient } from "@supabase/supabase-js";

// These values come from your .env.local file.
// NEXT_PUBLIC_ prefix means this code can run in the browser (needed for fetching slots).
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
