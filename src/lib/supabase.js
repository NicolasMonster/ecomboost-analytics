import { createClient } from '@supabase/supabase-js';

const supabaseUrl     = import.meta.env.VITE_SUPABASE_URL     || 'https://brdsqmqdmuwsqmlhxohq.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJyZHNxbXFkbXV3c3FtbGh4b2hxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5NTgzNzEsImV4cCI6MjA4OTUzNDM3MX0.D0Ju4iaWfg3CGu_8oYxwlA84aHQaA3FPwl0_ndTBy48';

export const isSupabaseConfigured = true;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
