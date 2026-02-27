
import { supabase } from '@/lib/customSupabaseClient'; // Fixed import

/**
 * Wrapper for Supabase queries to handle network errors and retries.
 * @param {Function} queryFn - Function that returns a Supabase promise
 * @param {Object} options - Retry options
 * @returns {Promise<any>} - Result data or throws error
 */
export async function safeSupabaseQuery(queryFn, options = {}) {
  const MAX_RETRIES = options.retries || 3;
  const INITIAL_BACKOFF = options.backoff || 500;
  
  let lastError;

  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const { data, error } = await queryFn();
      
      if (error) {
        // Check if error is network related or 5xx
        const isNetworkError = 
          error.message?.includes('fetch') || 
          error.message?.includes('network') ||
          error.status >= 500;
          
        if (isNetworkError && i < MAX_RETRIES - 1) {
          throw error; // Throw to catch block to trigger retry
        }
        
        // If it's a logic error (RLS, 4xx), return immediately
        return { data, error };
      }
      
      return { data, error: null };
    } catch (err) {
      lastError = err;
      
      // Calculate backoff
      const backoff = INITIAL_BACKOFF * Math.pow(2, i);
      console.warn(`Supabase query attempt ${i + 1} failed. Retrying in ${backoff}ms...`, err.message);
      
      await new Promise(resolve => setTimeout(resolve, backoff));
    }
  }

  return { data: null, error: lastError };
}

/**
 * Invokes a Supabase Edge Function with robust error handling and CORS support.
 * @param {string} functionName - Name of the edge function
 * @param {Object} body - Request body
 * @returns {Promise<any>} - Function response
 */
export async function invokeEdgeFunction(functionName, body = {}) {
  if (!supabase) throw new Error("Supabase client not initialized");
  
  try {
    const { data, error } = await supabase.functions.invoke(functionName, {
      body: JSON.stringify(body),
      headers: {
        // Ensure we don't have stale headers
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });

    if (error) {
      console.error(`Edge Function '${functionName}' failed:`, error);
      throw error;
    }

    return data;
  } catch (err) {
    console.error(`Invocation error for '${functionName}':`, err);
    throw err;
  }
}
