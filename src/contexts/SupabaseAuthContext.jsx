
import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, SUPABASE_CONFIGURED } from '@/lib/customSupabaseClient';
import { logEvent } from '@/lib/logEvent';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const SupabaseAuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Access State
  const [accessState, setAccessState] = useState({
    access_allowed: true, // Default to true to prevent flash of blocked content
    reason: null,
    billing_provider: null,
    update_payment_url: null,
  });

  // Keep track of previous state for diff logging
  const prevAccessState = useRef(accessState);

  const checkAccessState = useCallback(async (userId) => {
    if (!userId || !SUPABASE_CONFIGURED) return;

    try {
      const { data, error } = await supabase.rpc('get_account_access_state');

      if (error) {
        console.error('Error checking access state:', error);
        
        logEvent({
          event_type: 'access_check_error',
          severity: 'error',
          source: 'auth_context',
          reason: 'rpc_error',
          metadata: { error: error.message }
        });
        
        // Handle RPC error without hard-locking authenticated users.
        // If we already know access is blocked, preserve that state.
        const fallbackState =
          prevAccessState.current?.access_allowed === false
            ? prevAccessState.current
            : {
                access_allowed: true,
                reason: 'rpc_error',
                billing_provider: null,
                update_payment_url: null
              };
        setAccessState(fallbackState);
        prevAccessState.current = fallbackState;
        return;
      }

      if (data && data.length > 0) {
        const newState = {
          access_allowed: data[0].access_allowed,
          reason: data[0].reason,
          billing_provider: data[0].billing_provider,
          update_payment_url: data[0].update_payment_url
        };

        // Check if anything meaningful changed before logging
        const hasChanged = 
          newState.access_allowed !== prevAccessState.current.access_allowed ||
          newState.reason !== prevAccessState.current.reason ||
          newState.update_payment_url !== prevAccessState.current.update_payment_url;

        if (hasChanged) {
          logEvent({
            event_type: 'access_check',
            severity: newState.access_allowed ? 'info' : 'warning',
            source: 'auth_context',
            reason: newState.reason,
            access_allowed: newState.access_allowed,
            metadata: { 
              update_payment_url: newState.update_payment_url,
              previous_reason: prevAccessState.current.reason 
            }
          });
          prevAccessState.current = newState;
        }

        setAccessState(newState);
      }
    } catch (err) {
      console.error('Exception in access check:', err);
    }
  }, []);

  const refreshAccessState = useCallback(async () => {
    if (user?.id) {
      await checkAccessState(user.id);
    }
  }, [user, checkAccessState]);

  const getAuthRedirectUrl = () => {
    if (typeof window === 'undefined') return undefined;
    return `${window.location.origin}/auth/callback`;
  };

  // Helper to safely recover session
  const recoverSession = async () => {
    if (!SUPABASE_CONFIGURED) return null;
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Session recovery failed:', error);
      return null;
    }
    return session ?? null;
  };

  useEffect(() => {
    let mounted = true;

    if (!SUPABASE_CONFIGURED) {
      setLoading(false);
      return;
    }

    const initAuth = async () => {
      try {
        const session = await recoverSession();
        
        if (mounted) {
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            // Parallelize these checks for speed
            await Promise.all([
              checkIsAdmin(session.user.id),
              checkAccessState(session.user.id)
            ]);
          }
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      // Handle specific events for better UX
      if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed successfully');
      }

      if (event === 'SIGNED_OUT') {
        setUser(null);
        setSession(null);
        setIsAdmin(false);
        setAccessState({
          access_allowed: true,
          reason: null,
          billing_provider: null,
          update_payment_url: null,
        });
        setLoading(false);
        return;
      }

      if (event === 'PASSWORD_RECOVERY') {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        navigate('/set-password', { replace: true });
        return;
      }

      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await checkIsAdmin(session.user.id);
        await checkAccessState(session.user.id);
      }
      
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, [checkAccessState, navigate]);

  const checkIsAdmin = async (userId) => {
    if (!SUPABASE_CONFIGURED) return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', userId)
        .single();
      
      if (!error && data) {
        setIsAdmin(data.role === 'admin');
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };

  const signIn = async (email, password) => {
    if (!SUPABASE_CONFIGURED) return { data: null, error: { message: "Supabase not configured" } };
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      return { data, error };
    } catch (err) {
      return { data: null, error: err };
    }
  };

  const resetPassword = async (email) => {
    if (!SUPABASE_CONFIGURED) return { data: null, error: { message: "Supabase not configured" } };
    try {
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: getAuthRedirectUrl(),
      });
      return { data, error };
    } catch (err) {
      return { data: null, error: err };
    }
  };

  const signUp = async (email, password) => {
    if (!SUPABASE_CONFIGURED) return { data: null, error: { message: "Supabase not configured" } };
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: getAuthRedirectUrl(),
        },
      });
      return { data, error };
    } catch (err) {
      return { data: null, error: err };
    }
  };

  const signOut = async () => {
    if (!SUPABASE_CONFIGURED) return;
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      // Force local state clear even if network fails
      setUser(null);
      setSession(null);
      setIsAdmin(false);
    }
  };

  const value = {
    user,
    session,
    loading,
    isAdmin, 
    is_admin: isAdmin, 
    signIn,
    signUp,
    resetPassword,
    signOut,
    accessState,
    refreshAccessState,
    isConfigured: SUPABASE_CONFIGURED
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const AuthProvider = SupabaseAuthProvider;

export default SupabaseAuthProvider;
