
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase, SUPABASE_CONFIGURED } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';

const ApiKeysContext = createContext({
  rawKeys: [],
  keys: {},
  loading: true,
  error: null,
  refresh: () => {}
});

export const ApiKeysProvider = ({ children }) => {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [rawKeys, setRawKeys] = useState([]);
  const [keys, setKeys] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (!SUPABASE_CONFIGURED) {
      setLoading(false);
      return;
    }

    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('api_keys')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      // Admin sees their own keys, users see their own keys.
      // If the app architecture implies there are GLOBAL keys managed by admin that users utilize, 
      // the RLS policy should reflect that. For now, we query keys created by current user 
      // unless admin needs to see all.
      // Based on previous code:
      if (!isAdmin) {
        query = query.eq('created_by', user.id);
      }
      
      const { data, error: apiError } = await query;

      if (apiError) throw apiError;
      
      setRawKeys(data || []);
      
      // Transform into object for easy access: { "OPENAI": "sk-...", "FDC": "..." }
      const keyMap = (data || []).reduce((acc, key) => {
         // Assuming key_name is descriptive like "OpenAI" or "FDC"
         // Normalize key names for consumption
         let normalizedName = key.key_name.toUpperCase();
         if (normalizedName.includes('OPENAI')) normalizedName = 'OPENAI';
         if (normalizedName.includes('FDC') || normalizedName.includes('USDA')) normalizedName = 'FDC';
         
         acc[normalizedName] = key.key_value;
         return acc;
      }, {});
      
      setKeys(keyMap);

    } catch (err) {
      console.error('Error fetching API keys:', err);
      setError(err.message);
      toast({
        variant: "destructive",
        title: "Error loading API keys",
        description: err.message
      });
    } finally {
      setLoading(false);
    }
  }, [user, isAdmin, toast]);

  // Fetch on mount or when user/admin status changes
  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <ApiKeysContext.Provider value={{ rawKeys, keys, loading, error, refresh }}>
      {children}
    </ApiKeysContext.Provider>
  );
};

export const useApiKeysContext = () => {
  const context = useContext(ApiKeysContext);
  if (!context) {
    throw new Error('useApiKeysContext must be used within an ApiKeysProvider');
  }
  return context;
};
