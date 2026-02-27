import React, { useEffect, useMemo, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';

const getAuthTypeFromUrl = () => {
  if (typeof window === 'undefined') return null;
  const url = new URL(window.location.href);
  const hashParams = new URLSearchParams(url.hash.startsWith('#') ? url.hash.slice(1) : url.hash);
  return url.searchParams.get('type') || hashParams.get('type');
};

export default function AuthCallback() {
  const [error, setError] = useState('');
  const authType = useMemo(() => getAuthTypeFromUrl(), []);

  useEffect(() => {
    let mounted = true;

    const finalizeSession = async () => {
      try {
        if (!supabase) {
          throw new Error('Supabase is not configured.');
        }

        if (import.meta.env.DEV) {
          console.info('[AuthCallback] START', window.location.href);
        }

        const currentUrl = new URL(window.location.href);
        const hashParams = new URLSearchParams(
          currentUrl.hash.startsWith('#') ? currentUrl.hash.slice(1) : currentUrl.hash
        );

        let {
          data: { session },
          error: getSessionError,
        } = await supabase.auth.getSession();
        if (getSessionError) throw getSessionError;

        if (import.meta.env.DEV) {
          console.info('[AuthCallback] getSession', { hasSession: Boolean(session) });
        }

        if (!session) {
          const code = currentUrl.searchParams.get('code');
          if (code) {
            if (import.meta.env.DEV) {
              console.info('[AuthCallback] exchangeCodeForSession', { hasCode: true });
            }
            const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
            if (exchangeError) throw exchangeError;
            session = data?.session ?? null;
          }
        }

        if (!session) {
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');
          if (accessToken && refreshToken) {
            if (import.meta.env.DEV) {
              console.info('[AuthCallback] setSession from hash tokens');
            }
            const { data, error: setSessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (setSessionError) throw setSessionError;
            session = data?.session ?? null;
          }
        }

        if (!session) {
          const {
            data: { session: retrySession },
            error: retryError,
          } = await supabase.auth.getSession();
          if (retryError) throw retryError;
          session = retrySession ?? null;
        }

        if (!session) {
          throw new Error('Could not finalize your authentication session.');
        }

        if (!mounted) return;
        if (authType === 'recovery') {
          if (import.meta.env.DEV) {
            console.info('[AuthCallback] END redirect=/set-password');
          }
          window.location.replace('/set-password');
        } else {
          if (import.meta.env.DEV) {
            console.info('[AuthCallback] END redirect=/');
          }
          window.location.replace('/');
        }
      } catch (err) {
        if (!mounted) return;
        if (import.meta.env.DEV) {
          console.error('[AuthCallback] ERROR', err);
        }
        setError(err?.message || 'Authentication callback failed.');
      }
    };

    finalizeSession();

    return () => {
      mounted = false;
    };
  }, [authType]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex items-center justify-center p-4">
      <Helmet>
        <title>Signing In - Keto Contractor</title>
      </Helmet>
      <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 p-6 text-center space-y-3">
        <div className="flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-cyan-400" />
        </div>
        <p className="text-white font-medium">Signing you in…</p>
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
      </div>
    </div>
  );
}
