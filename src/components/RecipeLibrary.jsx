import React, { useState, useMemo, useEffect } from 'react';
import { Search, Filter, X, ChefHat, Clock, Flame, ArrowUpDown, SlidersHorizontal, RotateCcw, Wheat, Dumbbell, Cookie, Heart } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { useDraggable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { getRecipeImageUrl } from '@/lib/imageUtils';
import { usePreferences } from '@/contexts/PreferencesContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import LazyImage from '@/components/shared/LazyImage';

// ... RecipeCard Helper ...
const RecipeCard = ({ recipe, isDraggable, onClick, compact, isFavorited, onToggleFavorite }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `library-${recipe.id}`,
    data: { type: 'library-item', recipe },
    disabled: !isDraggable
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: isDragging ? 50 : 'auto',
  } : undefined;

  const imageUrl = getRecipeImageUrl(recipe);

  const handleClick = (e) => {
    if (isDragging) return;
    if (onClick) onClick(recipe);
  };

  const handleFavoriteClick = (e) => {
    e.stopPropagation();
    if (onToggleFavorite) {
      onToggleFavorite(recipe);
    }
  };

  return (
    <div
      ref={isDraggable ? setNodeRef : null}
      {...(isDraggable ? listeners : {})}
      {...(isDraggable ? attributes : {})}
      style={style}
      onClick={handleClick}
      className={cn(
        "group relative bg-white dark:bg-[#131B2D] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden cursor-pointer hover:border-cyan-500/50 dark:hover:border-cyan-500/50 transition-all shadow-sm hover:shadow-md",
        isDragging && "opacity-50 ring-2 ring-cyan-500 rotate-2 shadow-xl cursor-grabbing",
        compact ? "flex items-center gap-3 p-2" : "flex flex-col"
      )}
    >
        <div className={cn(
            "relative overflow-hidden bg-slate-100 dark:bg-slate-800",
            compact ? "w-16 h-16 rounded-lg shrink-0" : "aspect-video w-full"
        )}>
           <LazyImage 
             src={imageUrl} 
             alt={recipe.recipe_name}
             className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500"
           />
           {!compact && (
             <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60 pointer-events-none" />
           )}
           
           {/* Favorite Heart Icon - Replaces "..." menu */}
           {!compact && onToggleFavorite && (
             <button
               onClick={handleFavoriteClick}
               className="absolute top-2 right-2 z-10 p-2 bg-black/40 backdrop-blur-sm rounded-full hover:bg-black/60 transition-all pointer-events-auto group/fav"
               title={isFavorited ? "Remove from favorites" : "Add to favorites"}
             >
               <Heart 
                 className={cn(
                   "w-5 h-5 transition-all",
                   isFavorited 
                     ? "fill-red-500 text-red-500" 
                     : "text-white group-hover/fav:text-red-400 group-hover/fav:scale-110"
                 )}
               />
             </button>
           )}
        </div>

        <div className="flex-1 min-w-0 p-3 pointer-events-none"> 
            <h3 className="font-bold text-slate-900 dark:text-white leading-tight truncate text-base mb-1">
                {recipe.recipe_name}
            </h3>
            
            {!compact && (
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-2">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {recipe.estimated_total_time_min || 0}m</span>
                    <span className="flex items-center gap-1"><Flame className="w-3 h-3 text-orange-500" /> {Math.round(recipe.calories_per_serving || 0)}</span>
                </div>
            )}
            
            {!compact && (
              <div className="flex items-center gap-1 mb-2">
                 <div className={cn(
                    "px-1.5 py-0.5 rounded text-[10px] font-bold border flex items-center gap-1",
                    (recipe.net_carbs_per_serving_g || 0) <= 5 
                      ? "bg-emerald-950/30 text-emerald-400 border-emerald-900/50" 
                      : (recipe.net_carbs_per_serving_g || 0) <= 10 
                        ? "bg-yellow-950/30 text-yellow-400 border-yellow-900/50"
                        : "bg-red-950/30 text-red-400 border-red-900/50"
                 )}>
                    <Wheat className="w-3 h-3" />
                    {Math.round(recipe.net_carbs_per_serving_g || 0)}g
                 </div>
              </div>
            )}

            <div className="flex flex-wrap gap-1 mt-1">
                {recipe.tags && Array.isArray(recipe.tags) && recipe.tags.length > 0 ? (
                  recipe.tags.slice(0, compact ? 1 : 3).map((tag, idx) => (
                    <Badge key={`${recipe.id}-${tag}-${idx}`} variant="secondary" className="text-[10px] h-4 px-1 rounded-sm bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-0">
                        {tag}
                    </Badge>
                  ))
                ) : (
                  <span className="text-[10px] text-slate-400 italic">No tags</span>
                )}
            </div>
        </div>
        
        {isDraggable && !compact && (
            <div className="absolute top-2 left-2 bg-black/40 text-white p-1 rounded backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                <ChefHat className="w-4 h-4" />
            </div>
        )}
    </div>
  );
};

const FALLBACK_FILTERS = {
  meal_type: 'all',
  cuisine_type: 'all',
  dish_type: 'all',
  protein_type: 'all',
  appliance_type: 'all',
  difficulty: 'all',
  protein_level: 'all',
  default_meal_slot: 'all',
  ingredients_contains: '',
  calories_max: 2000,
  net_carbs_max: 50,
  protein_max: 200,
  fat_max: 150,
  time_max: 240,
  servings_min: 1
};

export default function RecipeLibrary({ recipes = [], isDraggable = false, compact = false, onRecipeClick }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { preferences } = usePreferences();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSort, setActiveSort] = useState('none');
  const [filters, setFilters] = useState(FALLBACK_FILTERS);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [hasSyncedPrefs, setHasSyncedPrefs] = useState(false);
  const [favoritedRecipeIds, setFavoritedRecipeIds] = useState(new Set());
  const [loadingFavorites, setLoadingFavorites] = useState(true);

  // Fetch user's favorites on mount
  useEffect(() => {
    const fetchFavorites = async () => {
      if (!user) {
        setLoadingFavorites(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('favorite_recipes')
          .select('recipe_id')
          .eq('user_id', user.id);

        if (error) throw error;

        const favoriteIds = new Set(data.map(fav => fav.recipe_id));
        setFavoritedRecipeIds(favoriteIds);
      } catch (error) {
        console.error('Error fetching favorites:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not load favorites."
        });
      } finally {
        setLoadingFavorites(false);
      }
    };

    fetchFavorites();
  }, [user]);

  useEffect(() => {
    if (preferences?.dailyTargets && !hasSyncedPrefs) {
      const { dailyTargets } = preferences;
      setFilters(prev => ({
        ...prev,
        calories_max: parseInt(dailyTargets.calories) || 2000,
        net_carbs_max: parseInt(dailyTargets.carbs) || 50,
        protein_max: parseInt(dailyTargets.protein) || 200,
        fat_max: parseInt(dailyTargets.fat) || 150,
      }));
      setHasSyncedPrefs(true);
    }
  }, [preferences, hasSyncedPrefs]);

  const categories = useMemo(() => {
    // STANDARD CATEGORY LIST to ensure consistency across the app
    return ["All", "Breakfast", "Lunch", "Dinner", "Snack", "Sweets", "Side", "Sauce", "Drink"];
  }, []);

  const options = useMemo(() => {
    const extract = (field) => {
      const values = new Set(recipes.map(r => r[field]).filter(Boolean));
      return Array.from(values).sort();
    };

    return {
      meal_type: categories.filter(c => c !== "All"), // Use the processed categories
      cuisine_type: extract('cuisine_type'),
      dish_type: extract('dish_type'),
      protein_type: extract('protein_type'),
      appliance_type: extract('appliance_type'),
      difficulty: extract('difficulty'),
      protein_level: extract('protein_level'),
      default_meal_slot: extract('default_meal_slot')
    };
  }, [recipes, categories]);

  const filteredAndSortedRecipes = useMemo(() => {
    let result = recipes.filter(recipe => {
        if (searchQuery && !recipe.recipe_name?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        if (filters.ingredients_contains && !recipe.ingredients_block?.toLowerCase().includes(filters.ingredients_contains.toLowerCase())) return false;
        
        // Updated: Handle compound meal types (e.g., "Lunch/Dinner")
        if (filters.meal_type !== 'all') {
          if (!recipe.meal_type) return false;
          
          const recipeTypes = recipe.meal_type.split('/').map(s => s.trim().toLowerCase());
          const filterType = filters.meal_type.toLowerCase();

          // Direct inclusion check (e.g. "Lunch" matches "Lunch/Dinner")
          if (!recipeTypes.some(t => t.includes(filterType) || filterType.includes(t))) {
             return false;
          }
        }
        
        if (filters.cuisine_type !== 'all' && recipe.cuisine_type !== filters.cuisine_type) return false;
        if (filters.dish_type !== 'all' && recipe.dish_type !== filters.dish_type) return false;
        if (filters.protein_type !== 'all' && recipe.protein_type !== filters.protein_type) return false;
        if (filters.appliance_type !== 'all' && recipe.appliance_type !== filters.appliance_type) return false;
        if (filters.difficulty !== 'all' && recipe.difficulty !== filters.difficulty) return false;
        if (filters.protein_level !== 'all' && recipe.protein_level !== filters.protein_level) return false;
        if (filters.default_meal_slot !== 'all' && recipe.default_meal_slot !== filters.default_meal_slot) return false;

        const cals = parseFloat(recipe.calories_per_serving || 0);
        if (cals > filters.calories_max) return false;
        const carbs = parseFloat(recipe.net_carbs_per_serving_g || 0);
        if (carbs > filters.net_carbs_max) return false;
        const protein = parseFloat(recipe.protein_per_serving_g || 0);
        if (protein > filters.protein_max) return false;
        const fat = parseFloat(recipe.fat_per_serving_g || 0);
        if (fat > filters.fat_max) return false;
        const time = parseFloat(recipe.estimated_total_time_min || 0);
        if (time > filters.time_max) return false;
        const servings = parseFloat(recipe.servings_per_batch || 0);
        if (servings < filters.servings_min) return false;

        return true;
    });

    if (activeSort !== 'none') {
      result.sort((a, b) => {
        const getVal = (r, key) => parseFloat(r[key] || 0);
        switch (activeSort) {
          case 'carbs-desc': return getVal(b, 'net_carbs_per_serving_g') - getVal(a, 'net_carbs_per_serving_g');
          case 'carbs-asc': return getVal(a, 'net_carbs_per_serving_g') - getVal(b, 'net_carbs_per_serving_g');
          case 'cals-desc': return getVal(b, 'calories_per_serving') - getVal(a, 'calories_per_serving');
          case 'cals-asc': return getVal(a, 'calories_per_serving') - getVal(b, 'calories_per_serving');
          case 'prot-desc': return getVal(b, 'protein_per_serving_g') - getVal(a, 'protein_per_serving_g');
          case 'prot-asc': return getVal(a, 'protein_per_serving_g') - getVal(b, 'protein_per_serving_g');
          case 'time-desc': return getVal(b, 'estimated_total_time_min') - getVal(a, 'estimated_total_time_min');
          case 'time-asc': return getVal(a, 'estimated_total_time_min') - getVal(b, 'estimated_total_time_min');
          case 'name-asc': return (a.recipe_name || '').localeCompare(b.recipe_name || '');
          default: return 0;
        }
      });
    }

    return result;
  }, [recipes, searchQuery, filters, activeSort]);

  const handleToggleFavorite = async (recipe) => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "Please log in to manage favorites."
      });
      return;
    }

    const recipeId = recipe.id;
    const isFavorited = favoritedRecipeIds.has(recipeId);

    // Optimistic update
    setFavoritedRecipeIds(prev => {
      const newSet = new Set(prev);
      if (isFavorited) {
        newSet.delete(recipeId);
      } else {
        newSet.add(recipeId);
      }
      return newSet;
    });

    try {
      if (isFavorited) {
        // Remove from favorites
        const { error } = await supabase
          .from('favorite_recipes')
          .delete()
          .eq('user_id', user.id)
          .eq('recipe_id', recipeId);

        if (error) throw error;

        toast({
          title: "Removed from Favorites",
          description: `${recipe.recipe_name} has been removed from your favorites.`
        });
      } else {
        // Add to favorites
        const favoriteData = {
          user_id: user.id,
          recipe_id: recipeId,
          recipe_name: recipe.recipe_name,
          recipe_data: recipe,
          prep_time: recipe.estimated_total_time_min || null,
          difficulty: recipe.difficulty || null,
          tags: recipe.tags || []
        };

        const { error } = await supabase
          .from('favorite_recipes')
          .insert(favoriteData);

        if (error) throw error;

        toast({
          title: "Added to Favorites",
          description: `${recipe.recipe_name} has been added to your favorites.`
        });
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      
      // Revert optimistic update on error
      setFavoritedRecipeIds(prev => {
        const newSet = new Set(prev);
        if (isFavorited) {
          newSet.add(recipeId);
        } else {
          newSet.delete(recipeId);
        }
        return newSet;
      });

      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not update favorites. Please try again."
      });
    }
  };

  const updateFilter = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const activeFilterCount = Object.keys(filters).reduce((acc, key) => {
    if (key === 'ingredients_contains' && filters[key] !== '') return acc + 1;
    if (key.includes('_type') && filters[key] !== 'all') return acc + 1;
    if ((key === 'difficulty' || key === 'protein_level' || key === 'default_meal_slot') && filters[key] !== 'all') return acc + 1;
    const prefs = preferences?.dailyTargets || {};
    if (key === 'calories_max' && filters[key] !== (parseInt(prefs.calories) || 2000)) return acc + 1;
    if (key === 'net_carbs_max' && filters[key] !== (parseInt(prefs.carbs) || 50)) return acc + 1;
    if (key === 'protein_max' && filters[key] !== (parseInt(prefs.protein) || 200)) return acc + 1;
    if (key === 'fat_max' && filters[key] !== (parseInt(prefs.fat) || 150)) return acc + 1;
    if (key === 'time_max' && filters[key] < 240) return acc + 1;
    if (key === 'servings_min' && filters[key] > 1) return acc + 1;
    return acc;
  }, 0);

  const resetFilters = () => {
    const prefs = preferences?.dailyTargets || {};
    setFilters({
      ...FALLBACK_FILTERS,
      calories_max: parseInt(prefs.calories) || 2000,
      net_carbs_max: parseInt(prefs.carbs) || 50,
      protein_max: parseInt(prefs.protein) || 200,
      fat_max: parseInt(prefs.fat) || 150,
    });
  };

  const FilterSelect = ({ label, fieldKey, optionsList }) => (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-slate-500 uppercase">{label}</Label>
      <Select value={filters[fieldKey]} onValueChange={(val) => updateFilter(fieldKey, val)}>
        <SelectTrigger className="h-8 text-xs bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800">
          <SelectValue placeholder="All" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Any {label}</SelectItem>
          {optionsList.map(opt => (
             <SelectItem key={opt} value={opt}>{opt}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  const FilterSlider = ({ label, fieldKey, min, max, step, suffix = "", type="max" }) => (
    <div className="space-y-3 pt-1">
      <div className="flex justify-between items-center">
        <Label className="text-xs font-medium text-slate-700 dark:text-slate-300">{label}</Label>
        <span className="text-xs font-mono text-cyan-600 dark:text-cyan-400 font-bold">
           {type === 'min' ? '> ' : '< '} {filters[fieldKey]}{suffix}
        </span>
      </div>
      <Slider 
         value={[filters[fieldKey]]} 
         min={min} 
         max={max} 
         step={step} 
         onValueChange={(val) => updateFilter(fieldKey, val[0])}
         className="[&>.relative>.absolute]:bg-cyan-500"
      />
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-white dark:bg-[#0B1120]">
       {/* --- Top Bar: Search & Actions --- */}
       {/* Sticky added here to ensure header freezes in planner/drawers */}
       <div className="sticky top-0 z-20 bg-white dark:bg-[#131B2D] border-b border-slate-200 dark:border-slate-800">
          <div className="p-4 space-y-3">
             <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                   <Input 
                     placeholder="Search recipes by name..." 
                     value={searchQuery}
                     onChange={(e) => setSearchQuery(e.target.value)}
                     className="pl-9 bg-slate-50 dark:bg-[#0B1120] border-slate-200 dark:border-slate-800"
                   />
                   {searchQuery && (
                      <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                          <X className="w-3 h-3" />
                      </button>
                   )}
                </div>

                <div className="flex gap-2">
                    {/* Sort Dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                         <Button
                           variant="outline"
                           className={cn(
                             "border-slate-200 dark:border-slate-800 dark:bg-[#0B1120] dark:text-slate-300 px-3 justify-between min-w-[110px]",
                             activeSort !== 'none' && "border-cyan-500/50 text-cyan-600 dark:text-cyan-400 bg-cyan-950/10"
                           )}
                         >
                            <span className="flex items-center gap-2">
                               <ArrowUpDown className="w-4 h-4" />
                               <span className="hidden sm:inline">Sort</span>
                            </span>
                         </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuLabel>Sort By</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => setActiveSort('none')}>Default</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setActiveSort('name-asc')}>Name (A-Z)</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setActiveSort('carbs-asc')}>Carbs (Low to High)</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setActiveSort('carbs-desc')}>Carbs (High to Low)</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setActiveSort('prot-desc')}>Protein (High to Low)</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setActiveSort('cals-asc')}>Calories (Low to High)</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setActiveSort('time-asc')}>Time (Quickest)</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Filter Sheet Trigger */}
                    <Sheet open={isFiltersOpen} onOpenChange={setIsFiltersOpen}>
                      <SheetTrigger asChild>
                        <Button 
                          variant="outline" 
                          className={cn(
                            "border-slate-200 dark:border-slate-800 dark:bg-[#0B1120] dark:text-slate-300 gap-2",
                            activeFilterCount > 0 && "border-cyan-500 text-cyan-600 bg-cyan-50 dark:bg-cyan-950/20"
                          )}
                        >
                          <SlidersHorizontal className="w-4 h-4" />
                          <span className="hidden sm:inline">Filters</span>
                          {activeFilterCount > 0 && (
                            <Badge variant="secondary" className="h-5 px-1.5 ml-0.5 bg-cyan-500 text-white hover:bg-cyan-600">
                              {activeFilterCount}
                            </Badge>
                          )}
                        </Button>
                      </SheetTrigger>
                      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0">
                        <SheetHeader className="p-6 pb-4">
                          <SheetTitle>Advanced Filters</SheetTitle>
                          <SheetDescription>
                            Refine your recipe search with detailed parameters.
                          </SheetDescription>
                        </SheetHeader>

                        {/* Filter Scrollable Content - Forced Scrollbar */}
                        <div className="flex-1 overflow-y-scroll custom-scrollbar px-6 space-y-6"> 
                           <div className="space-y-2">
                              <Label>Contains Ingredient</Label>
                              <Input 
                                 placeholder="e.g. Chicken, Avocado, Almond Flour..." 
                                 value={filters.ingredients_contains}
                                 onChange={(e) => updateFilter('ingredients_contains', e.target.value)}
                                 className="bg-slate-50 dark:bg-slate-900"
                              />
                           </div>
                           
                           <div className="grid grid-cols-2 gap-4">
                              <FilterSelect label="Meal Type" fieldKey="meal_type" optionsList={options.meal_type} />
                              <FilterSelect label="Cuisine" fieldKey="cuisine_type" optionsList={options.cuisine_type} />
                              <FilterSelect label="Dish Type" fieldKey="dish_type" optionsList={options.dish_type} />
                              <FilterSelect label="Main Protein" fieldKey="protein_type" optionsList={options.protein_type} />
                              <FilterSelect label="Appliance" fieldKey="appliance_type" optionsList={options.appliance_type} />
                              <FilterSelect label="Difficulty" fieldKey="difficulty" optionsList={options.difficulty} />
                              <FilterSelect label="Protein Level" fieldKey="protein_level" optionsList={options.protein_level} />
                              <FilterSelect label="Meal Slot" fieldKey="default_meal_slot" optionsList={options.default_meal_slot} />
                           </div>

                           <div className="space-y-4 border-t border-slate-100 dark:border-slate-800 pt-4">
                              <h4 className="font-semibold text-sm">Nutrition & Time Limits</h4>
                              
                              <FilterSlider label="Max Net Carbs" fieldKey="net_carbs_max" min={0} max={200} step={1} suffix="g" />
                              <FilterSlider label="Max Calories" fieldKey="calories_max" min={0} max={4000} step={50} />
                              <FilterSlider label="Max Protein" fieldKey="protein_max" min={0} max={300} step={1} suffix="g" />
                              <FilterSlider label="Max Fat" fieldKey="fat_max" min={0} max={300} step={1} suffix="g" />
                              <FilterSlider label="Max Prep Time" fieldKey="time_max" min={0} max={240} step={5} suffix=" min" />
                              <FilterSlider label="Min Servings" fieldKey="servings_min" min={1} max={12} step={1} type="min" />
                           </div>
                        </div>

                        <SheetFooter className="flex-col sm:flex-col gap-2 p-6 pt-4 border-t border-slate-200 dark:border-slate-800">
                           <Button onClick={() => setIsFiltersOpen(false)} className="w-full bg-cyan-600 hover:bg-cyan-700 text-white">
                              Apply Filters ({filteredAndSortedRecipes.length} results)
                           </Button>
                           <Button variant="outline" onClick={resetFilters} className="w-full text-slate-500">
                              <RotateCcw className="w-4 h-4 mr-2" /> Reset to Preferences
                           </Button>
                        </SheetFooter>
                      </SheetContent>
                    </Sheet>
                </div>
             </div>
          </div>
          
          {/* Category Tabs Row */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide px-4 mb-2">
            {categories.map(cat => (
              <Button
                key={cat}
                variant={filters.meal_type === (cat === 'All' ? 'all' : cat) ? "default" : "outline"}
                size="sm"
                className={cn(
                    "whitespace-nowrap h-8",
                    filters.meal_type === (cat === 'All' ? 'all' : cat)
                    ? "bg-cyan-600 hover:bg-cyan-500 border-transparent text-white"
                    : "border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                )}
                onClick={() => updateFilter('meal_type', cat === 'All' ? 'all' : cat)}
              >
                {cat}
              </Button>
            ))}
          </div>
       </div>

       {/* --- Main Content: Recipe Grid --- */}
       <ScrollArea className="flex-1 w-full bg-slate-50/50 dark:bg-[#0B1120]" type="always">
          <div className={cn(
              "p-4 grid gap-3",
              compact ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
          )}>
             {filteredAndSortedRecipes.length > 0 ? (
                 filteredAndSortedRecipes.map(recipe => (
                     <RecipeCard 
                       key={recipe.id} 
                       recipe={recipe} 
                       isDraggable={isDraggable} 
                       compact={compact}
                       onClick={onRecipeClick}
                       isFavorited={favoritedRecipeIds.has(recipe.id)}
                       onToggleFavorite={handleToggleFavorite}
                     />
                 ))
             ) : (
                 <div className="col-span-full py-12 text-center text-slate-500 dark:text-slate-400 flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                        <Filter className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                    </div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">No matches found</h3>
                    <p className="text-sm mt-1 max-w-[200px]">Try adjusting your search or filters.</p>
                    <Button 
                       variant="link" 
                       onClick={resetFilters}
                       className="mt-2 text-cyan-600"
                    >
                        Reset filters
                    </Button>
                 </div>
             )}
          </div>
       </ScrollArea>
    </div>
  );
}