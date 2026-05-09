import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import "react-native-url-polyfill/auto";

const supabaseUrl = "https://htbkczklryanwtlzqnuq.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0Ymtjemtscnlhbnd0bHpxbnVxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc4NjcxNjYsImV4cCI6MjA5MzQ0MzE2Nn0.fgdOZGWjOid266aUwafQvIzjuRBsF_Jl52fJiYvLzVw";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
