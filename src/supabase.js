import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || "https://sabsmurhriohwmczaktn.supabase.co";
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "sb_publishable_tj-oblYhYqN5sKWFrrxe1g_NzimyN0p";

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);
