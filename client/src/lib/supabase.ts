import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://aihpwtuvertmwzriubbd.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFpaHB3dHV2ZXJ0bXd6cml1YmJkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAwOTMxNTIsImV4cCI6MjA4NTY2OTE1Mn0.44d5nswQdCrnpB9FGBKeX1lChU2h72EpF-Osj4D9EfI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
