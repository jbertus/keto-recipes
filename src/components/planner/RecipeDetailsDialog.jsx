
import React, { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Clock, Users, Flame, Calendar, X, Droplets, Coffee } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { getRecipeImageUrl } from '@/lib/imageUtils';
import AddToPlannerDialog from '@/components/planner/AddToPlannerDialog';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';

export default function RecipeDetailsDialog({ 
  open, 
  onOpenChange, 
  recipe, 
  initialDate, 
  initialSlot, 
  onMealAdded 
}) {
  const [showPlanner, setShowPlanner] = useState(false);
  const [drinkMode, setDrinkMode] = useState('tonic'); 
  const { user } = useAuth();
  const { toast } = useToast();

  // --- DIAGNOSTIC LOGGING TASK 2 (Parent Component) ---
  useEffect(() => {
    if (open && recipe) {
       console.log('[RecipeDetailsDialog] Opened with recipe:', recipe);
       console.log('[RecipeDetailsDialog] ingredients_block present?', !!recipe.ingredients_block);
       console.log('[RecipeDetailsDialog] prep_notes_block present?', !!recipe.prep_notes_block);
    }
  }, [open, recipe]);
  // ---------------------------------------------------

  const isDrinkWithVariations = recipe ? (recipe.isStaticDrink || (recipe.tonic && recipe.creamy)) : false;

  const currentData = useMemo(() => {
    if (!recipe) return {}; 
    if (isDrinkWithVariations) {
      return drinkMode === 'tonic' ? recipe.tonic : recipe.creamy;
    }
    return recipe;
  }, [recipe, isDrinkWithVariations, drinkMode]);

  if (!recipe) return null;

  const safeMacro = (val) => Math.max(0, val || 0);

  const displayMacros = isDrinkWithVariations ? {
    calories: safeMacro(currentData.macros?.cal),
    protein: safeMacro(currentData.macros?.p),
    fat: safeMacro(currentData.macros?.f),
    carbs: safeMacro(currentData.macros?.net), 
  } : {
    calories: safeMacro(recipe.calories_per_serving),
    protein: safeMacro(recipe.protein_per_serving_g),
    fat: safeMacro(recipe.fat_per_serving_g),
    carbs: safeMacro(recipe.net_carbs_per_serving_g),
  };

  const displayIngredients = isDrinkWithVariations 
    ? (currentData.ingredients || [])
    : (recipe.ingredients_block || '').split('\n').filter(line => line.trim());

  const displayInstructions = isDrinkWithVariations
    ? [currentData.desc] 
    : (recipe.prep_notes_block || '').split('\n').filter(step => step.trim());

  const getSafeImageUrl = (rec) => {
      if (rec.isStaticDrink && rec.image_path) return rec.image_path;
      return getRecipeImageUrl(rec);
  };

  const handlePlanClick = () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to add meals to your planner.",
        variant: "destructive"
      });
      return;
    }
    setShowPlanner(true);
  };

  const handleInternalMealAdded = (meal) => {
      if (onMealAdded) {
          onMealAdded(meal);
      }
      onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl w-[95vw] bg-[#131B2D] border-slate-800 p-0 h-[85vh] flex flex-col overflow-hidden min-h-0 sm:rounded-xl">
          
          <button 
              onClick={() => onOpenChange(false)}
              className="absolute top-4 right-4 z-50 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-md transition-colors border border-white/10"
              aria-label="Close"
          >
              <X className="w-5 h-5" />
          </button>

          <ScrollArea type="hover" className="flex-1 min-h-0 w-full">
            <div className="relative h-64 w-full">
              <div className="absolute inset-0 bg-gradient-to-t from-[#131B2D] via-transparent to-transparent z-10" />
              <img
                src={getSafeImageUrl(recipe)}
                alt={recipe.recipe_name}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-4 left-6 z-20 pr-4">
                <div className="flex gap-2 mb-2">
                  <Badge className="bg-cyan-500/80 hover:bg-cyan-500 backdrop-blur-sm text-white border-none shadow-sm">
                    {recipe.meal_type || 'Main Dish'}
                  </Badge>
                </div>
                <h2 className="text-3xl font-bold text-white shadow-sm leading-tight drop-shadow-md">{recipe.recipe_name}</h2>
              </div>
            </div>

            <div className="p-6 space-y-8 pb-24">
              
              {isDrinkWithVariations && (
                <div className="flex p-1 bg-slate-900 rounded-lg border border-slate-800">
                  <button
                    onClick={() => setDrinkMode('tonic')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-sm font-medium transition-all ${
                      drinkMode === 'tonic' 
                        ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-900/20' 
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <Droplets className="w-4 h-4" />
                    Tonic (Light)
                  </button>
                  <button
                    onClick={() => setDrinkMode('creamy')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-md text-sm font-medium transition-all ${
                      drinkMode === 'creamy' 
                        ? 'bg-orange-600 text-white shadow-lg shadow-orange-900/20' 
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <Coffee className="w-4 h-4" />
                    Creamy (Rich)
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between bg-slate-900/50 p-4 rounded-xl border border-slate-800 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-800 rounded-lg text-slate-400">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 font-bold uppercase">Time</div>
                    <div className="text-sm font-semibold text-slate-200">{recipe.estimated_total_time_min || (isDrinkWithVariations ? 5 : 30)} min</div>
                  </div>
                </div>
                <Separator orientation="vertical" className="h-8 bg-slate-800" />
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-800 rounded-lg text-slate-400">
                    <Flame className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 font-bold uppercase">Calories</div>
                    <div className="text-sm font-semibold text-slate-200">{displayMacros.calories}</div>
                  </div>
                </div>
                <Separator orientation="vertical" className="h-8 bg-slate-800" />
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-slate-800 rounded-lg text-slate-400">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-slate-500 font-bold uppercase">Servings</div>
                    <div className="text-sm font-semibold text-slate-200">{recipe.servings_per_batch || 1}</div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Macronutrients</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 text-center shadow-sm">
                    <span className="block text-2xl font-bold text-blue-400">{displayMacros.protein}g</span>
                    <span className="text-xs text-slate-500 font-medium uppercase">Protein</span>
                  </div>
                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 text-center shadow-sm">
                    <span className="block text-2xl font-bold text-yellow-400">{displayMacros.fat}g</span>
                    <span className="text-xs text-slate-500 font-medium uppercase">Fat</span>
                  </div>
                  <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 text-center shadow-sm">
                    <span className="block text-2xl font-bold text-emerald-400">{displayMacros.carbs}g</span>
                    <span className="text-xs text-slate-500 font-medium uppercase">Net Carbs</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">Ingredients</h3>
                  <ul className="space-y-2">
                    {displayIngredients.map((line, i) => (
                      line && (
                        <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-cyan-600 flex-shrink-0" />
                          <span className="leading-relaxed">{line}</span>
                        </li>
                      )
                    ))}
                    {displayIngredients.length === 0 && <li className="text-sm text-slate-500 italic">No ingredients listed.</li>}
                  </ul>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">
                    {isDrinkWithVariations ? 'Description' : 'Instructions'}
                  </h3>
                  <div className="space-y-4">
                    {displayInstructions.map((step, i) => (
                      step && (
                        <div key={i} className="flex gap-3">
                          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-800 text-cyan-500 flex items-center justify-center text-xs font-bold border border-slate-700">
                            {i + 1}
                          </div>
                          <p className="text-sm text-slate-300 leading-relaxed pt-0.5">{step}</p>
                        </div>
                      )
                    ))}
                    {displayInstructions.length === 0 && <p className="text-sm text-slate-500 italic">No instructions available.</p>}
                  </div>
                </div>
              </div>
            </div>
          </ScrollArea>

          <div className="absolute bottom-0 left-0 right-0 p-4 bg-[#131B2D]/95 backdrop-blur border-t border-slate-800 z-50 flex justify-end gap-3">
            <Button 
              variant="outline"
              onClick={() => onOpenChange(false)} 
              className="border-slate-700 hover:bg-slate-800 text-slate-300"
            >
              Close
            </Button>
            <Button 
              onClick={handlePlanClick} 
              className="bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-900/20"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Plan This {isDrinkWithVariations ? 'Drink' : 'Meal'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AddToPlannerDialog 
        open={showPlanner} 
        onOpenChange={setShowPlanner} 
        recipe={recipe} 
        initialDate={initialDate}
        initialSlot={initialSlot}
        onMealAdded={handleInternalMealAdded}
      />
    </>
  );
}
