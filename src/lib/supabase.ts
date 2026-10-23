import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hywlytsbogbassecflbw.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5d2x5dHNib2diYXNzZWNmbGJ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQzODI2ODMsImV4cCI6MjA4OTk1ODY4M30.1FB0-PMfuTBJ9oJWRJMkKA3vQKkIS1LrNFXEvtmHpWY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
