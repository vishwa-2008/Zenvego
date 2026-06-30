/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

// Replace these with your actual Supabase project URL and anon key once you provide them.
const supabaseUrl = (typeof import.meta.env !== 'undefined' ? import.meta.env.VITE_SUPABASE_URL : undefined) || 'https://kgfjwiszlxkwvavgnmuu.supabase.co';
const supabaseAnonKey = (typeof import.meta.env !== 'undefined' ? import.meta.env.VITE_SUPABASE_ANON_KEY : undefined) || 'sb_publishable_hNW32M7f1nJcTlQ3CleEHQ_P50LqebC';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
