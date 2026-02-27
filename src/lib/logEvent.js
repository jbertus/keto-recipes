
import { supabase } from '@/lib/customSupabaseClient';

/**
 * Logs a system event to the database.
 * Designed to be fire-and-forget and fail-safe (never throws).
 * 
 * @param {Object} params
 * @param {string} params.event_type - Category of event (e.g. 'access_check', 'auth_error')
 * @param {string} params.severity - 'info', 'warning', 'error'
 * @param {string} params.source - Component or module source
 * @param {string} [params.reason] - Optional description or error code
 * @param {boolean} [params.access_allowed] - Optional access decision result
 * @param {Object} [params.metadata] - Optional JSON metadata
 * @returns {Promise<void>} Resolves when done, regardless of success
 */
export function logEvent({ 
  event_type, 
  severity, 
  source, 
  reason = null, 
  access_allowed = null, 
  metadata = {} 
}) {
  return new Promise((resolve) => {
    (async () => {
      try {
        // Best effort to capture user_id, but don't block if auth state is partial
        let user_id = null;
        try {
          const { data } = await supabase.auth.getUser();
          user_id = data?.user?.id || null;
        } catch (ignored) {
          // Ignore auth retrieval errors
        }

        await supabase.from('app_events').insert({
          created_at: new Date().toISOString(),
          user_id,
          event_type,
          severity,
          source,
          reason,
          access_allowed,
          metadata
        });
      } catch (error) {
        // Silently swallow all errors as requested
      } finally {
        resolve();
      }
    })();
  });
}
