import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || 'https://nlzklfxqeqtiukfhzedb.supabase.co';

const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5semtsZnhxZXF0aXVrZmh6ZWRiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk5MjA5NzksImV4cCI6MjEwNTQ5Njk3OX0.qm5CyIDP2bqAiifW_WLBEZsDnP9zzhMyHupk0GywrrM';

// Always initialized with the project's Supabase backend
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const isSupabaseConfigured = (): boolean => {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
};
