import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://sabsmurhriohwmczaktn.supabase.co";

const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhYnNtdXJocmlvaHdtY3pha3RuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3MTUzNTQsImV4cCI6MjA5NDI5MTM1NH0.ZoizSGSy2MT7JZbCWj2SRfurz6_OHGrkBaCnjuATIUk";

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
);