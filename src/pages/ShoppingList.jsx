
import React, { useState, useEffect } from 'react';
import { supabase, SUPABASE_CONFIGURED } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Trash2, Edit, RefreshCw, ShoppingCart, Loader2, Plus, Save, X, ChefHat, ExternalLink, AlertTriangle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from '@/components/ui/use-toast';
import { AnimatePresence, motion } from 'framer-motion';
import { Helmet } from 'react-helmet';
import { getWeekStartStr, getRecipeIngredients, categorizeIngredient, cleanIngredientName, parseIngredient } from '@/lib/utils';
import ShoppingListPDFExport from '@/components/shopping/ShoppingListPDFExport';
import { usePantryDeduction } from '@/hooks/usePantryDeduction';
import { STANDARD_RECIPES } from '@/data/standardRecipes';
import { useNavigate } from 'react-router-dom';

const CATEGORIES = [
  "Produce", "Meat", "Dairy", "Spices", "Condiments", "Baking", 
  "Pantry", "Frozen", "Beverages", "Household", "Bakery", "Other"
];

const ShoppingList = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const { 
    displayItems: listItems = [], 
    loading, 
    refresh,
    togglePantryUse 
  } = usePantryDeduction();

  const [syncing, setSyncing] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemQuantity, setNewItemQuantity] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('Other');
  const [editingItem, setEditingItem] = useState(null);
  
  const [recipeLookup, setRecipeLookup] = useState({});
  const [recipesLoading, setRecipesLoading] = useState(false);

  // Pre-load standard recipes
  useEffect(() => {
    if (STANDARD_RECIPES && Array.isArray(STANDARD_RECIPES)) {
      const standardMap = {};
      STANDARD_RECIPES.forEach(r => {
        if (r.id) standardMap[r.id] = r.recipe_name || r.name;
      });
      setRecipeLookup(prev => ({ ...prev, ...standardMap }));
    }
  }, []);

  // Fetch missing recipe names
  useEffect(() => {
    if (!SUPABASE_CONFIGURED) return;

    const fetchRecipeNames = async () => {
      const safeItems = Array.isArray(listItems) ? listItems : [];
      if (!safeItems.length) return;

      const allIds = new Set();
      safeItems.forEach(item => {
        if (Array.isArray(item.recipe_source)) {
          item.recipe_source.forEach(id => {
            if (id) allIds.add(id);
          });
        }
      });

      if (allIds.size === 0) return;
      const missingIds = Array.from(allIds).filter(id => !recipeLookup[id]);
      if (missingIds.length === 0) return;

      setRecipesLoading(true);
      try {
        const { data, error } = await supabase
          .from('personal_recipes')
          .select('id, recipe_name')
          .in('id', missingIds);

        if (error) throw error;

        const newLookup = { ...recipeLookup };
        (data || []).forEach(r => { newLookup[r.id] = r.recipe_name; });
        
        missingIds.forEach(id => {
          if (!newLookup[id]) {
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}/.test(id);
            newLookup[id] = isUuid ? `Recipe (Deleted)` : `Unknown Recipe`;
          }
        });
        setRecipeLookup(newLookup);
      } catch (err) {
        console.error("Error fetching recipe names:", err);
      } finally {
        setRecipesLoading(false);
      }
    };
    fetchRecipeNames();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listItems]);

  const generateFromPlan = async () => {
    if (!SUPABASE_CONFIGURED || !supabase || !user) return;
    setSyncing(true);
    try {
      const weekStartStr = getWeekStartStr(new Date());
      const { data: planRecord, error } = await supabase.from('weekly_plans').select('*').eq('user_id', user.id).eq('week_start', weekStartStr).maybeSingle();
      if (error) throw error;

      if (!planRecord) {
        toast({ title: "No Meal Plan", description: "Create a plan first.", variant: "destructive" });
        setSyncing(false);
        return;
      }

      const aggregated = {};
      if (planRecord.plan_data) {
        Object.values(planRecord.plan_data).forEach(daySlots => {
          Object.values(daySlots).forEach(meals => {
            if (!Array.isArray(meals)) return;
            meals.forEach(meal => {
              const scale = Number(meal.scale) || 1;
              const recipeId = meal.recipe_id || meal.id;
              const ingredients = getRecipeIngredients(meal);

              ingredients.forEach(line => {
                const parsed = parseIngredient(line);
                if (!parsed) return;
                const cleanName = cleanIngredientName(parsed.name);
                if (!cleanName) return;

                if (!aggregated[cleanName]) {
                  const category = categorizeIngredient(parsed.name);
                  aggregated[cleanName] = {
                    name: cleanName,
                    displayName: parsed.name,
                    qty: 0,
                    unit: parsed.unit || 'pcs',
                    category, 
                    sources: new Set()
                  };
                }

                aggregated[cleanName].qty += (parsed.qty * scale);
                if (recipeId) aggregated[cleanName].sources.add(recipeId);
              });
            });
          });
        });
      }

      const itemsToInsert = Object.values(aggregated).map(item => ({
        user_id: user.id,
        name: item.displayName,
        quantity: `${item.qty.toFixed(1).replace(/\.0$/, '')} ${item.unit}`,
        category: item.category || 'Other',
        is_manual: false,
        checked: false,
        is_purchased: false,
        recipe_source: Array.from(item.sources),
        use_pantry: false 
      }));

      await supabase.from('shopping_list_items').delete().eq('user_id', user.id).eq('is_manual', false);
      if (itemsToInsert.length > 0) {
        await supabase.from('shopping_list_items').insert(itemsToInsert);
      }
      
      refresh();
      toast({ title: "Synced", description: "List updated from plan." });

    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Sync failed.", variant: "destructive" });
    } finally {
      setSyncing(false);
    }
  };

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!SUPABASE_CONFIGURED || !supabase || !newItemName.trim() || !user) return;
    const finalCategory = newItemCategory === 'Other' ? categorizeIngredient(newItemName.trim()) : newItemCategory;

    try {
      await supabase.from('shopping_list_items').insert({
        user_id: user.id,
        name: newItemName.trim(),
        quantity: newItemQuantity.trim(),
        category: finalCategory, 
        is_manual: true,
        checked: false,
        is_purchased: false,
        recipe_source: [],
        use_pantry: false
      });
      setNewItemName('');
      setNewItemQuantity('');
      refresh();
    } catch (err) {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  const handleDelete = async (id) => {
    if (!SUPABASE_CONFIGURED || !supabase) return;
    await supabase.from('shopping_list_items').delete().eq('id', id);
    refresh();
  };

  const handleToggleCheck = async (item) => {
    if (!SUPABASE_CONFIGURED || !supabase) return;
    await supabase.from('shopping_list_items').update({ checked: !item.checked }).eq('id', item.id);
    refresh();
  };

  const saveEdit = async () => {
    if (!editingItem || !SUPABASE_CONFIGURED || !supabase) return;
    await supabase.from('shopping_list_items').update({
        name: editingItem.name,
        quantity: editingItem.quantity
    }).eq('id', editingItem.id);
    setEditingItem(null);
    refresh();
  };

  const clearPurchased = async () => {
    if (!SUPABASE_CONFIGURED || !supabase) return;
    const toDelete = (listItems || []).filter(i => i.checked).map(i => i.id);
    if (!toDelete.length) return;
    await supabase.from('shopping_list_items').delete().in('id', toDelete);
    refresh();
  };

  const navigateToRecipe = (recipeId) => {
    if (recipeId && recipeLookup[recipeId] && !recipeLookup[recipeId].includes('(Deleted)')) {
        navigate('/recipes');
    }
  };

  if (!SUPABASE_CONFIGURED) {
    return (
       <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] bg-[#0B1120] p-6 text-center">
         <AlertTriangle className="h-16 w-16 text-slate-700 mb-4" />
         <h1 className="text-2xl font-bold text-white mb-2">Shopping List Offline</h1>
         <p className="text-slate-500 max-w-md">The shopping list requires a database connection to sync your items.</p>
       </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl pb-24">
      <Helmet><title>Shopping List - Keto Contractor</title></Helmet>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <ShoppingCart className="w-8 h-8 text-cyan-600" /> Shopping List
          </h1>
          <p className="text-slate-500 text-sm mt-1">Organize your grocery trip. Smartly checks your Pantry.</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <ShoppingListPDFExport items={listItems} />
          <Button 
            onClick={() => generateFromPlan()} 
            disabled={syncing}
            className="bg-cyan-600 hover:bg-cyan-500 text-white flex-1 md:flex-none"
          >
            {syncing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
            Reset from Plan
          </Button>
          <Button onClick={clearPurchased} variant="outline">Clear Purchased</Button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 mb-8">
        <form onSubmit={handleAddItem} className="flex flex-col md:flex-row gap-3">
          <Input placeholder="Item name" value={newItemName} onChange={e => setNewItemName(e.target.value)} className="flex-1 bg-slate-50 dark:bg-slate-800 text-gray-900 dark:text-white" />
          <Input placeholder="Qty (e.g. 2 cups)" value={newItemQuantity} onChange={e => setNewItemQuantity(e.target.value)} className="w-full md:w-32 bg-slate-50 dark:bg-slate-800 text-gray-900 dark:text-white" />
          <Select value={newItemCategory} onValueChange={setNewItemCategory}>
            <SelectTrigger className="w-full md:w-40 bg-slate-50 dark:bg-slate-800 text-gray-900 dark:text-white"><SelectValue /></SelectTrigger>
            <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
          </Select>
          <Button type="submit" className="bg-blue-600"><Plus className="w-4 h-4 mr-1" /> Add</Button>
        </form>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-10 h-10 animate-spin text-cyan-500" /></div>
      ) : listItems.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
          <ShoppingCart className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">Your list is empty</h3>
          <Button onClick={() => generateFromPlan()} variant="link" className="text-cyan-600">Sync from Meal Plan</Button>
        </div>
      ) : (
        <TooltipProvider>
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {listItems.map((item) => {
              const isEditing = editingItem?.id === item.id;
              const deduction = item.deduction || {};
              const { needed, unit, matchedPantryItem, isFullyCovered } = deduction;
              
              if (isEditing) {
                return (
                  <motion.div key={item.id} layout className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg flex flex-col md:flex-row gap-3">
                    <Input value={editingItem.name} onChange={e => setEditingItem({...editingItem, name: e.target.value})} className="flex-1 text-gray-900 dark:text-white" />
                    <Input value={editingItem.quantity} onChange={e => setEditingItem({...editingItem, quantity: e.target.value})} className="w-24 text-gray-900 dark:text-white" />
                    <Button size="sm" onClick={saveEdit} className="bg-green-600"><Save className="w-4 h-4 mr-1"/> Save</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingItem(null)}><X className="w-4 h-4 mr-1"/> Cancel</Button>
                  </motion.div>
                );
              }

              // Visual Logic
              const hasPantryMatch = !!matchedPantryItem;
              const usePantry = item.use_pantry && hasPantryMatch;
              
              let displayQty = item.quantity;
              
              if (usePantry) {
                  if (isFullyCovered) {
                      displayQty = "Covered"; 
                  } else {
                      // Logic: If user toggles ON, we show the deducted amount.
                      // E.g. "0.5 lb"
                      displayQty = `${needed} ${unit}`;
                  }
              }

              const rowClass = `group flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl border transition-all 
                bg-white shadow-sm dark:bg-slate-900 dark:border-slate-800
                ${item.checked ? 'opacity-60' : ''}
                ${isFullyCovered && usePantry && !item.checked ? 'border-emerald-500/30 bg-emerald-500/5' : ''}
              `;

              // TOGGLE LABEL: "Use [quantity] from Pantry"
              const toggleLabel = hasPantryMatch && matchedPantryItem.quantity
                ? `Use ${matchedPantryItem.quantity} from Pantry`
                : "Use Pantry";

              const hasRecipes = Array.isArray(item.recipe_source) && item.recipe_source.length > 0;

              return (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={rowClass}
                >
                  <div className="flex items-start gap-4 flex-1 w-full">
                    <Checkbox checked={item.checked} onCheckedChange={() => handleToggleCheck(item)} className="mt-1" />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <span className={`font-medium truncate mr-2 ${item.checked ? 'line-through text-slate-500' : 'text-slate-900 dark:text-gray-100'}`}>
                           {item.name}
                        </span>

                        <Badge variant="outline" className={`whitespace-nowrap ${
                            usePantry && isFullyCovered ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 
                              usePantry && !isFullyCovered ? 'bg-amber-100 text-amber-700 border-amber-200' : 
                              'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'}
                        `}>
                            {displayQty}
                        </Badge>

                        {hasPantryMatch && !item.checked && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="flex items-center gap-1.5 ml-1 select-none whitespace-nowrap">
                                        <Switch 
                                            checked={item.use_pantry} 
                                            onCheckedChange={() => togglePantryUse(item.id, item.use_pantry)}
                                            className="data-[state=checked]:bg-orange-500 scale-75"
                                        />
                                        <span 
                                            className="text-[10px] uppercase font-bold text-slate-500 cursor-pointer hover:text-slate-700 dark:hover:text-slate-300" 
                                            onClick={() => togglePantryUse(item.id, item.use_pantry)}
                                        >
                                            {toggleLabel}
                                        </span>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Matched: <span className="font-bold text-orange-400">{matchedPantryItem.name}</span> ({matchedPantryItem.quantity})</p>
                                    <p className="text-xs text-slate-400">Toggle to deduct available amount.</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge variant="secondary" className="text-[10px] h-5 bg-slate-200 text-slate-800 dark:bg-slate-700 dark:text-slate-200">
                          {item.category || 'Other'}
                        </Badge>
                        
                        {hasRecipes && (
                          item.recipe_source.map((sourceId, idx) => {
                             const recipeName = recipeLookup[sourceId] || (recipesLoading ? "Loading..." : sourceId);
                             const isDeleted = recipeName.includes('(Deleted)');
                             return (
                               <Tooltip key={`${item.id}-recipe-${idx}`}>
                                 <TooltipTrigger asChild>
                                   <Badge 
                                     variant="outline" 
                                     className={`
                                        text-[10px] h-5 px-1.5 flex items-center gap-1 cursor-default
                                        ${isDeleted 
                                            ? 'bg-red-50 text-red-600 border-red-100 dark:bg-red-900/10 dark:text-red-400 dark:border-red-900/30' 
                                            : 'bg-indigo-50 text-indigo-600 border-indigo-100 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-800 dark:hover:bg-indigo-900/40 cursor-pointer'}
                                     `}
                                     onClick={(e) => {
                                        if(!isDeleted) {
                                            e.stopPropagation();
                                            navigateToRecipe(sourceId);
                                        }
                                     }}
                                   >
                                     <ChefHat className="w-3 h-3 flex-shrink-0" />
                                     <span className="max-w-[100px] truncate">{recipeName}</span>
                                     {!isDeleted && <ExternalLink className="w-2 h-2 ml-0.5 opacity-50" />}
                                   </Badge>
                                 </TooltipTrigger>
                                 <TooltipContent>
                                   <p>{recipeName}</p>
                                   {isDeleted && <p className="text-xs text-red-300">This recipe may have been deleted.</p>}
                                 </TooltipContent>
                               </Tooltip>
                             );
                          })
                        )}
                        {item.is_manual && (
                             <Badge variant="outline" className="text-[10px] h-5 bg-slate-50 text-slate-400 border-slate-200 dark:bg-slate-800 dark:border-slate-700">
                                Manual Item
                             </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 mt-2 sm:mt-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                    <Button size="icon" variant="ghost" onClick={() => setEditingItem(item)}><Edit className="w-4 h-4 text-slate-600 dark:text-slate-400" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(item.id)} className="hover:text-red-500 text-slate-600 dark:text-slate-400"><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
        </TooltipProvider>
      )}
    </div>
  );
};

export default ShoppingList;
