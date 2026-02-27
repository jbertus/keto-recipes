
import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Plus, Clock, Loader2, Utensils, X, Filter, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { getRecipeImageUrl } from '@/lib/imageUtils';
import { getDisplayMacros, debugSupabaseError } from '@/lib/utils';
import AddToPlannerDialog from './AddToPlannerDialog';
import RecipeDetailsDialog from './RecipeDetailsDialog';

export default function AddMealDialog({ open, onOpenChange, onPlanAdd, initialDate, initialSlot, initialMealType, onMealAdded }) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Dialog States
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [plannerOpen, setPlannerOpen] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);

  // Updated categories list to include all 10 types
  const categories = useMemo(() => {
    return ["All", "Breakfast", "Lunch", "Dinner", "Snack", "Sweets", "Side", "Sauce", "Drink"];
  }, []);

  useEffect(() => {
    if (open) {
      console.log(`[🔍 AddMealDialog] Opened. InitialDate: ${initialDate}, InitialSlot: ${initialSlot}, InitialMealType: ${initialMealType}`);
      
      // Auto-select category if initialMealType is provided
      if (initialMealType && categories.includes(initialMealType)) {
          setSelectedCategory(initialMealType);
      } else if (initialSlot && categories.includes(initialSlot)) {
          setSelectedCategory(initialSlot); // Fallback to slot if meal type not explicit
      } else {
          setSelectedCategory('All');
      }
      
      if (user) {
        fetchRecipes();
      } else {
        console.warn("[🔍 AddMealDialog] No user found!");
      }
    }
  }, [open, user, initialDate, initialSlot, initialMealType, categories]);

  const fetchRecipes = async () => {
    setLoading(true);
    console.log("[🔍 AddMealDialog] Fetching personal recipes...");
    try {
      const { data, error } = await supabase
        .from('personal_recipes')
        .select('*')
        .eq('user_id', user.id) // Ensure only user's recipes are fetched
        .order('created_at', { ascending: false });

      if (error) {
        debugSupabaseError(error, "AddMealDialog: fetchRecipes");
        throw error;
      }
      
      // --- DEDUPLICATION LOGIC ---
      // We deduplicate recipes to ensure the search results are clean.
      // Priority for Unique Key: 
      // 1. recipe_id (if present, e.g. from imports)
      // 2. recipe_name (to remove DB duplicates where same recipe exists in multiple rows)
      // 3. id (fallback for unnamed unique items)
      
      const uniqueMap = new Map();
      const rawCount = data?.length || 0;

      (data || []).forEach(recipe => {
         // Determine unique key. 
         // We trim the name to handle "Steak Fajitas" vs "Steak Fajitas "
         const nameKey = recipe.recipe_name ? recipe.recipe_name.trim() : null;
         
         // If recipe_id exists (rare in personal_recipes but possible), use it. 
         // Otherwise use Name to catch duplicate rows of same recipe.
         // Fallback to ID if no name exists.
         const uniqueKey = recipe.recipe_id || nameKey || recipe.id;
         
         // Since we order by created_at DESC, the FIRST item we encounter is the NEWEST.
         // We keep the newest and ignore subsequent duplicates.
         if (!uniqueMap.has(uniqueKey)) {
             uniqueMap.set(uniqueKey, recipe);
         }
      });
      
      const uniqueRecipes = Array.from(uniqueMap.values());
      // ---------------------------

      // --- DIAGNOSTIC LOGGING ---
      console.group("[🔍 AddMealDialog] Fetch Results");
      console.log(`Fetched Raw: ${rawCount}, Unique: ${uniqueRecipes.length}`);
      if (uniqueRecipes.length > 0) {
        const sample = uniqueRecipes[0];
        console.log("Sample Recipe (First item):", sample);
      }
      console.groupEnd();
      // ----------------------------------

      setRecipes(uniqueRecipes);
    } catch (error) {
      console.error('[🔍 AddMealDialog] Error loading recipes:', error);
      setRecipes([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredRecipes = useMemo(() => {
    return (recipes || []).filter(r => {
      if (!r) return false;
      
      const recipeName = r.recipe_name || '';
      const matchesSearch = !searchQuery || 
        recipeName.toLowerCase().includes(searchQuery.toLowerCase());
      
      if (!matchesSearch) return false;

      if (selectedCategory === 'All') return true;

      const selectedLower = selectedCategory.toLowerCase();
      const mealTypeLower = (r.meal_type || '').toLowerCase();
      const dishTypeLower = (r.dish_type || '').toLowerCase();
      
      // Check meal_type
      if (mealTypeLower.includes(selectedLower)) {
          return true;
      }
      // Special handling for specific categories
      if (selectedLower === 'sweets' && (mealTypeLower.includes('dessert') || mealTypeLower.includes('treat'))) {
          return true;
      }
      if (selectedLower === 'sauce' && mealTypeLower === 'sauces') { // Handle singular/plural
          return true;
      }
      if (selectedLower === 'drink' && (mealTypeLower === 'beverage' || mealTypeLower === 'drinks')) { // Handle singular/plural
          return true;
      }

      // Fallback to dish_type if meal_type doesn't match
      if (dishTypeLower.includes(selectedLower)) {
          return true;
      }
      // Special handling for specific categories in dish_type
      if (selectedLower === 'sweets' && (dishTypeLower.includes('dessert') || dishTypeLower.includes('treat'))) {
          return true;
      }
      if (selectedLower === 'sauce' && dishTypeLower === 'sauces') {
          return true;
      }
      if (selectedLower === 'drink' && (dishTypeLower === 'beverage' || dishTypeLower === 'drinks')) {
          return true;
      }

      return false; // No match found
    });
  }, [recipes, searchQuery, selectedCategory]);

  const handleRecipeClick = (recipe) => {
    console.log(`[🔍 AddMealDialog] Recipe clicked: ${recipe.recipe_name} (${recipe.id})`);
    setSelectedRecipe(recipe);
    setDetailsOpen(true);
  };

  const handleAddToPlanClick = (e, recipe) => {
    e.stopPropagation();
    console.log(`[🔍 AddMealDialog] 'Add to Plan' clicked for: ${recipe.recipe_name} (${recipe.id})`);
    setSelectedRecipe(recipe);
    setPlannerOpen(true);
  };

  // Legacy fallback for when onPlanAdd is passed
  const handlePlanSubmit = async (planData) => {
    console.log("[🔍 AddMealDialog] handlePlanSubmit called with data:", planData);
    if (onPlanAdd) {
      console.log("[🔍 AddMealDialog] Delegating to onPlanAdd prop...");
      await onPlanAdd(planData);
    } 
    // If no onPlanAdd, AddToPlannerDialog will use internal logic and trigger onMealAdded instead
    setPlannerOpen(false);
  };

  // New handler for post-save event
  const handleMealAddedInternal = (data) => {
      console.log("[AddMealDialog] Meal added successfully. Closing dialogs and propagating event.");
      if (onMealAdded) {
          onMealAdded(data);
      }
      setPlannerOpen(false);
      setDetailsOpen(false); // Ensure details dialog is closed if it was open
      onOpenChange(false);
  };

  // Determine display meal type for header
  const displayMealType = initialMealType || initialSlot;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl h-[85vh] bg-[#0B1120] border-slate-800 flex flex-col p-0 gap-0 overflow-hidden">
          
          {/* Header Section */}
          <div className="p-6 border-b border-slate-800 bg-[#131B2D]">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Utensils className="w-6 h-6 text-cyan-500" />
                <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      Add Meal to Plan 
                      {displayMealType && (
                        <>
                          <ChevronRight className="w-5 h-5 text-slate-500" />
                          <Badge className="bg-cyan-900/40 text-cyan-400 border-cyan-800 text-sm">
                            {displayMealType}
                          </Badge>
                        </>
                      )}
                    </h2>
                    <p className="text-slate-400 text-sm">{filteredRecipes.length} recipes available</p>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => onOpenChange(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input 
                  placeholder="Search recipes (e.g., 'bacon', 'keto pancakes')..." 
                  className="pl-10 bg-slate-900 border-slate-700 text-slate-200 h-11"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {categories.map(cat => (
                  <Button
                    key={cat}
                    variant={selectedCategory === cat ? "default" : "outline"}
                    className={`
                      ${selectedCategory === cat 
                        ? 'bg-cyan-600 hover:bg-cyan-500 border-transparent text-white' 
                        : 'bg-transparent border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800'}
                    `}
                    onClick={() => {
                        console.log(`[🔍 AddMealDialog] Category filter changed to: ${cat}`);
                        setSelectedCategory(cat);
                    }}
                  >
                    {cat === 'Breakfast' && <span className="mr-2">☕</span>}
                    {cat === 'Lunch' && <span className="mr-2">☀️</span>}
                    {cat === 'Dinner' && <span className="mr-2">🌙</span>}
                    {cat === 'Snack' && <span className="mr-2">🍎</span>}
                    {cat === 'Sweets' && <span className="mr-2">🍪</span>}
                    {cat === 'Side' && <span className="mr-2">🥗</span>}
                    {cat === 'Sauce' && <span className="mr-2">🍯</span>}
                    {cat === 'Drink' && <span className="mr-2">🥤</span>}
                    {cat}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Recipes Grid */}
          <ScrollArea className="flex-1 bg-[#0B1120] p-6">
            {loading ? (
              <div className="flex items-center justify-center h-40">
                <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
              </div>
            ) : filteredRecipes.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-500 space-y-4">
                <div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center">
                    <Filter className="w-8 h-8 text-slate-600" />
                </div>
                <p>No recipes found matching your criteria.</p>
                <Button variant="link" onClick={() => {setSearchQuery(''); setSelectedCategory('All');}} className="text-cyan-500">
                    Clear Filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
                {(filteredRecipes || []).map((recipe) => {
                  const macros = getDisplayMacros(recipe);
                  return (
                    <div 
                      key={recipe.id}
                      className="bg-[#131B2D] border border-slate-800 rounded-xl overflow-hidden hover:border-slate-600 transition-colors group flex flex-col cursor-pointer shadow-sm"
                      onClick={() => handleRecipeClick(recipe)}
                    >
                      {/* Image Area */}
                      <div className="relative h-48 overflow-hidden bg-slate-900">
                        <img 
                          src={getRecipeImageUrl(recipe)} 
                          alt={recipe.recipe_name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                        <div className="absolute top-3 right-3">
                          <Badge className="bg-black/50 backdrop-blur border-none text-white hover:bg-black/70">
                            <Clock className="w-3 h-3 mr-1" />
                            {recipe.estimated_total_time_min || 15}m
                          </Badge>
                        </div>
                      </div>

                      {/* Content Area */}
                      <div className="p-4 flex flex-col flex-1">
                        <h3 className="font-bold text-white mb-2 line-clamp-1" title={recipe.recipe_name}>
                          {recipe.recipe_name}
                        </h3>
                        
                        <div className="flex items-center gap-3 text-xs text-slate-400 mb-4">
                          <span className="flex items-center text-orange-400 font-medium">
                            <Utensils className="w-3 h-3 mr-1" />
                            {macros.calories}
                          </span>
                          <Badge variant="outline" className="border-slate-700 text-slate-400 text-[10px] h-5 px-1.5 font-normal">
                            {recipe.meal_type || 'General'}
                          </Badge>
                        </div>

                        {/* Macros Grid */}
                        <div className="grid grid-cols-3 gap-1 mb-4 bg-slate-950/50 p-2 rounded-lg border border-slate-800/50">
                          <div className="text-center">
                            <div className="text-[10px] text-slate-500 uppercase font-bold">PRO</div>
                            <div className="text-xs font-bold text-blue-400">{macros.protein}g</div>
                          </div>
                          <div className="text-center">
                            <div className="text-[10px] text-slate-500 uppercase font-bold">FAT</div>
                            <div className="text-xs font-bold text-yellow-400">{macros.fat}g</div>
                          </div>
                          <div className="text-center">
                            <div className="text-[10px] text-slate-500 uppercase font-bold">NET C</div>
                            <div className="text-xs font-bold text-emerald-400">{macros.carbs}g</div>
                          </div>
                        </div>

                        {/* Action Button */}
                        <div className="mt-auto pt-2">
                          <Button 
                            className="w-full bg-[#1A2333] hover:bg-cyan-600 hover:text-white text-cyan-400 border border-cyan-900/30 transition-all font-medium h-9"
                            onClick={(e) => handleAddToPlanClick(e, recipe)}
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add to Plan
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Detail View Dialog */}
      <RecipeDetailsDialog 
        open={detailsOpen} 
        onOpenChange={setDetailsOpen} 
        recipe={selectedRecipe}
        initialDate={initialDate}
        initialSlot={initialSlot || initialMealType}
        onMealAdded={handleMealAddedInternal}
      />

      {/* Add To Planner Dialog - Direct access from card button */}
      <AddToPlannerDialog 
        open={plannerOpen}
        onOpenChange={setPlannerOpen}
        recipe={selectedRecipe}
        // Use legacy mode only if onPlanAdd is explicitly passed. Otherwise use internal logic.
        onAddToPlanner={onPlanAdd ? handlePlanSubmit : undefined}
        onMealAdded={handleMealAddedInternal}
        initialDate={initialDate}
        initialSlot={initialSlot || initialMealType}
      />
    </>
  );
}
