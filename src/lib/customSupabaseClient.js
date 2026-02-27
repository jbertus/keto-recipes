import { createClient as makeSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseLogOnceKey = '__kc_supabase_init_logged__';

export const SUPABASE_CONFIGURED = Boolean(supabaseUrl && supabaseAnonKey);

if (import.meta.env.DEV && SUPABASE_CONFIGURED) {
  const maskedAnon = `${supabaseAnonKey.slice(0, 6)}...${supabaseAnonKey.slice(-6)}`;
  const hasLogged = typeof window !== 'undefined' && window[supabaseLogOnceKey];
  if (!hasLogged) {
    console.info(`[Supabase] Initializing client url=${supabaseUrl} anon=${maskedAnon}`);
    if (typeof window !== 'undefined') {
      window[supabaseLogOnceKey] = true;
    }
  }
}

export const supabase = SUPABASE_CONFIGURED
  ? makeSupabaseClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
    })
  : null;

// Backward-compatible alias if older code imports { customSupabaseClient }
export const customSupabaseClient = supabase;

// Optional default export (keeps old imports from breaking)
export default supabase;
