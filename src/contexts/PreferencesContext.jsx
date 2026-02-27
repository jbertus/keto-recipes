
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, SUPABASE_CONFIGURED } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const PreferencesContext = createContext(undefined);

export function PreferencesProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const [preferences, setPreferences] = useState({
    darkMode: true,
    ingredientPrices: [],
    csvUrl: '',
    deduction_enabled: true,
    show_items_already_have: false,
    dailyTargets: {
      calories: 2000,
      protein: 150,
      fat: 70,
      carbs: 50,
      water: 64
    },
    // Add recipe_substitutions default to prevent undefined errors
    recipe_substitutions: {}
  });
  const [loading, setLoading] = useState(true);

  // Apply theme class to document
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    
    if (preferences.darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.add('light');
    }
  }, [preferences.darkMode]);

  useEffect(() => {
    let isMounted = true;

    async function fetchPreferences() {
      if (authLoading) return;

      if (!user || !SUPABASE_CONFIGURED) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        // Use maybeSingle() to avoid "JSON object" error if row doesn't exist yet
        const { data, error } = await supabase
          .from('user_preferences')
          .select('preferences, daily_targets')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) {
          console.error('Error fetching preferences:', error);
        }

        if (data && isMounted) {
          // Merge generic preferences and specific daily_targets column
          setPreferences(prev => ({ 
            ...prev, 
            ...(data.preferences || {}),
            dailyTargets: {
              ...prev.dailyTargets,
              ...(data.daily_targets || {})
            }
          }));
        }
      } catch (err) {
        console.error('Error fetching preferences:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchPreferences();

    return () => {
      isMounted = false;
    };
  }, [user, authLoading]);

  const savePreferences = async (newPrefs) => {
    if (!user || !SUPABASE_CONFIGURED) return;
    
    // 1. Update local state immediately for UI responsiveness
    const updatedState = { ...preferences, ...newPrefs };
    setPreferences(updatedState);

    // 2. Prepare data for DB
    // We separate dailyTargets because it has its own column in the schema
    const { dailyTargets, ...genericPrefs } = updatedState;

    try {
      const { error } = await supabase.from('user_preferences').upsert({ 
        user_id: user.id, 
        preferences: genericPrefs,      // Save general settings to JSONB column
        daily_targets: dailyTargets,    // Save targets to specific JSONB column
        updated_at: new Date().toISOString()
      });

      if (error) throw error;
    } catch (err) {
      console.error('Error updating preferences:', err);
      throw err; // Re-throw so the UI can show an error toast
    }
  };

  const toggleDarkMode = () => {
    savePreferences({ darkMode: !preferences.darkMode });
  };

  const updatePrice = (priceItem) => {
    const currentPrices = preferences.ingredientPrices || [];
    // Remove existing if any, then add new
    const filtered = currentPrices.filter(p => p.name !== priceItem.name);
    const newPrices = [...filtered, priceItem];
    savePreferences({ ingredientPrices: newPrices });
  };

  const removePrice = (nameToRemove) => {
    const currentPrices = preferences.ingredientPrices || [];
    const newPrices = currentPrices.filter(p => p.name !== nameToRemove);
    savePreferences({ ingredientPrices: newPrices });
  };

  return (
    <PreferencesContext.Provider value={{ 
      preferences, 
      loading: loading || authLoading, 
      toggleDarkMode,
      updatePrice,
      removePrice,
      savePreferences,
      updatePreferences: savePreferences // Alias
    }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (context === undefined) {
    throw new Error('usePreferences must be used within a PreferencesProvider');
  }
  return context;
}
