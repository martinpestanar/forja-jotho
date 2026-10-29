import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wquuhycqbdeysqxzwlun.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndxdXVoeWNxYmRleXNxeHp3bHVuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTMyNDQxNzksImV4cCI6MjEwODgyMDE3OX0.4xFBkzA2qmDmmuMtCiE7EYLJ3aMvLBniFgtrRf4P38o';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
