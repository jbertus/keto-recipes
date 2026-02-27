
import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { matchIngredients, calculateDeduction } from '@/lib/ingredientMatcher';
import { useToast } from '@/components/ui/use-toast';

export function usePantryDeduction() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [shoppingList, setShoppingList] = useState([]);
  const [pantryItems, setPantryItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      const [listRes, pantryRes] = await Promise.all([
        supabase.from('shopping_list_items').select('*').eq('user_id', user.id).order('created_at', { ascending: true }),
        supabase.from('pantry_items').select('*').eq('user_id', user.id)
      ]);

      if (listRes.error) throw listRes.error;
      if (pantryRes.error) throw pantryRes.error;

      setShoppingList(listRes.data || []);
      setPantryItems(pantryRes.data || []);
    } catch (e) {
      console.error('[usePantryDeduction] Error fetching data:', e);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Initial Fetch
  useEffect(() => {
    if (user) {
        setLoading(true);
        fetchData();
    }
  }, [user, fetchData]);

  // Real-time subscription
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('shopping-pantry-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'shopping_list_items', filter: `user_id=eq.${user.id}` }, () => fetchData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pantry_items', filter: `user_id=eq.${user.id}` }, () => fetchData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchData]);

  // Calculation Logic
  const displayItems = useMemo(() => {
    // 1. Get matches
    const matches = matchIngredients(shoppingList, pantryItems, 0.7);
    const matchMap = new Map(); 
    matches.forEach(m => matchMap.set(m.shoppingItem.id, m.pantryItem));

    // 2. Process each item
    return shoppingList.map(item => {
      const matchedPantry = matchMap.get(item.id);
      
      let deduction = {
          needed: 0,
          covered: 0,
          originalQty: 0,
          unit: '',
          status: 'none',
          matchedPantryItem: matchedPantry || null,
          isFullyCovered: false
      };

      if (matchedPantry) {
          // Use universal calculation
          const calc = calculateDeduction(item, matchedPantry);
          
          if (item.use_pantry) {
             // Deduct
             deduction = {
                 ...calc,
                 originalQty: calc.needed + calc.covered,
                 matchedPantryItem: matchedPantry
             };
          } else {
             // Just Show Match, Don't Deduct
             deduction = {
                 needed: calc.needed + calc.covered, // Full amount
                 covered: 0,
                 isFullyCovered: false,
                 unit: calc.unit,
                 status: 'none',
                 matchedPantryItem: matchedPantry
             };
          }
      } else {
          // No match, just parse self for display
          // We can reuse calculateDeduction by passing empty pantry item
          const calc = calculateDeduction(item, { quantity: "0" });
          deduction = {
              needed: calc.needed,
              covered: 0,
              isFullyCovered: false,
              unit: calc.unit,
              status: 'none',
              matchedPantryItem: null
          };
      }

      return { ...item, deduction };
    });
  }, [shoppingList, pantryItems]);

  // Stats
  const stats = useMemo(() => {
      const activeItems = displayItems.filter(i => !i.checked);
      return {
          total: activeItems.length,
          neededCount: activeItems.filter(i => !i.deduction.isFullyCovered).length,
          fullyCovered: activeItems.filter(i => i.deduction.isFullyCovered && i.use_pantry).length
      };
  }, [displayItems]);

  // Toggle Handler
  const togglePantryUse = async (itemId, currentState) => {
      const newState = !currentState;
      
      // Optimistic Update
      setShoppingList(prev => prev.map(item => 
          item.id === itemId ? { ...item, use_pantry: newState } : item
      ));

      try {
          const { error } = await supabase
            .from('shopping_list_items')
            .update({ use_pantry: newState })
            .eq('id', itemId);
            
          if (error) throw error;
      } catch (error) {
          console.error("Error toggling pantry use:", error);
          // Rollback
          setShoppingList(prev => prev.map(item => 
              item.id === itemId ? { ...item, use_pantry: currentState } : item
          ));
          toast({ title: "Update Failed", variant: "destructive" });
      }
  };

  return {
    displayItems,
    loading,
    refresh: fetchData,
    togglePantryUse,
    stats
  };
}
