
import React, { useState, useMemo, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea"; 
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { addDays, format, parseISO, isValid } from 'date-fns';
import { 
    Loader2, Utensils, Clock, Flame, Scale, Printer, Heart, 
    Star, ChefHat, AlertTriangle, Leaf, ShoppingCart, 
    Check, ArrowRight, Info, StickyNote, X, Bug
} from 'lucide-react';
import { getDisplayMacros, cleanIngredientName, getWeekStartStr, validateWeekStart, debugLog, debugSupabaseError, getCurrentTimestamp, getRecipeIngredients, getRecipeInstructions } from '@/lib/utils';
import { getRecipeImageUrl } from '@/lib/imageUtils';
import { addRecipeIngredientsToShoppingList } from '@/lib/shoppingUtils';

const NutritionFactLabel = ({ macros, servings }) => (
    <div className="border-2 border-slate-800 bg-white text-black p-4 max-w-[280px] font-sans">
        <h3 className="text-2xl font-black border-b-[10px] border-black pb-1 mb-1 leading-none">Nutrition Facts</h3>
        <p className="text-sm font-bold border-b border-black pb-1 mb-1">Serving Size <span className="float-right font-normal">1 serving ({Math.round(400 * servings)}g)</span></p>
        <div className="border-b-[5px] border-black pb-1 mb-2">
            <p className="text-xs font-bold">Amount Per Serving</p>
            <div className="flex justify-between items-end">
                <h4 className="text-3xl font-black leading-none">Calories</h4>
                <span className="text-4xl font-black leading-none">{macros.calories}</span>
            </div>
        </div>
        <div className="text-sm space-y-1 border-b border-black pb-2 mb-2">
            <p className="border-b border-gray-300 pb-1 flex justify-between">
                <span className="font-bold">Total Fat <span className="font-normal">{macros.fat}g</span></span>
                <span className="font-bold">{Math.round((macros.fat / 78) * 100)}%</span>
            </p>
            <p className="border-b border-gray-300 pb-1 flex justify-between">
                <span className="font-bold">Total Carbohydrate <span className="font-normal">{macros.carbs}g</span></span>
                <span className="font-bold">{Math.round((macros.carbs / 275) * 100)}%</span>
            </p>
            <p className="flex justify-between">
                <span className="font-bold">Protein <span className="font-normal">{macros.protein}g</span></span>
                <span className="font-bold">{Math.round((macros.protein / 50) * 100)}%</span>
            </p>
        </div>
        <p className="text-[9px] leading-tight">* The % Daily Value (DV) tells you how much a nutrient in a serving of food contributes to a daily diet. 2,000 calories a day is used for general nutrition advice.</p>
    </div>
);

export default function AddToPlannerDialog({ open, onOpenChange, recipe, onAddToPlanner, onMealAdded, initialDate, initialSlot }) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [dateStr, setDateStr] = useState('');
  const [slot, setSlot] = useState('Dinner');
  const [scale, setScale] = useState(1);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [pantryItems, setPantryItems] = useState([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [rating, setRating] = useState(0);
  const [instructionsCompleted, setInstructionsCompleted] = useState({});
  const [userNotes, setUserNotes] = useState('');
  const [showDebug, setShowDebug] = useState(false);

  const weekDays = useMemo(() => {
     let start = new Date();
     if (initialDate) {
         const parsed = parseISO(initialDate);
         if (isValid(parsed)) start = parsed;
     }
     
     return Array.from({ length: 14 }).map((_, i) => {
        const d = addDays(start, i);
        return {
           value: format(d, 'yyyy-MM-dd'),
           label: format(d, 'EEEE, MMM d')
        };
     });
  }, [initialDate]);

  const availableSlots = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Sweets'];

  useEffect(() => {
     if (open) {
        if (initialDate && isValid(parseISO(initialDate))) {
            setDateStr(initialDate);
        } else {
            setDateStr(format(new Date(), 'yyyy-MM-dd'));
        }
        
        if (initialSlot) {
            setSlot(initialSlot);
        } else if (recipe?.meal_type) {
            const recipeType = recipe.meal_type.charAt(0).toUpperCase() + recipe.meal_type.slice(1).toLowerCase();
            if (availableSlots.includes(recipeType)) setSlot(recipeType);
            else if (recipe.meal_type.toLowerCase().includes('snack')) setSlot('Snack');
            else if (recipe.meal_type.toLowerCase().includes('dessert') || recipe.meal_type.toLowerCase().includes('sweet')) setSlot('Sweets');
            else setSlot('Dinner'); 
        } else {
            setSlot('Dinner');
        }

        setScale(1);
        setUserNotes('');
        fetchPantry();
        checkIfFavorite();
        setActiveTab('overview');
        setInstructionsCompleted({});
        setShowDebug(false);
     }
  }, [open, initialDate, initialSlot, recipe]);

  const fetchPantry = async () => {
    if (!user) return;
    try {
        const { data, error } = await supabase.from('pantry_items').select('name').eq('user_id', user.id);
        if (error) throw error;
        if (data) setPantryItems(data.map(i => cleanIngredientName(i.name)));
    } catch (e) {
        debugSupabaseError(e, "Fetch Pantry Items");
    }
  };

  const checkIfFavorite = async () => {
      if (!user || !recipe) return;
      setIsFavorite(false); 
      setRating(0);
  };

  const internalSaveToPlanner = async (planDataParams) => {
    const { recipe: plannedRecipe, date, slot, scale, notes } = planDataParams;
    
    if (!user) throw new Error("User not authenticated.");
    if (!plannedRecipe || !plannedRecipe.id) throw new Error("Invalid recipe data.");
    
    const targetDate = parseISO(date);
    if (!isValid(targetDate)) throw new Error(`Invalid date: ${date}`);

    const weekStartStr = getWeekStartStr(targetDate);
    
    try {
        const { data: existingRecord, error: fetchError } = await supabase
            .from('weekly_plans')
            .select('plan_data, week_start, user_id, updated_at, cleared_at') 
            .eq('user_id', user.id)
            .eq('week_start', weekStartStr)
            .maybeSingle();

        if (fetchError) throw fetchError;
        
        let planData = existingRecord?.plan_data || {};
        if (!planData[date]) planData[date] = {};
        if (!planData[date][slot]) planData[date][slot] = [];

        const newItem = {
            id: crypto.randomUUID(),
            recipe_id: plannedRecipe.id,
            name: plannedRecipe.recipe_name || plannedRecipe.name || 'Untitled Recipe',
            recipe_name: plannedRecipe.recipe_name || plannedRecipe.name || 'Untitled Recipe',
            meal_type: plannedRecipe.meal_type || 'General', 
            calories: Math.round((Number(plannedRecipe.calories_per_serving) || 0) * scale),
            protein: Math.round((Number(plannedRecipe.protein_per_serving_g) || 0) * scale),
            carbs: Math.round((Number(plannedRecipe.net_carbs_per_serving_g) || 0) * scale),
            fat: Math.round((Number(plannedRecipe.fat_per_serving_g) || 0) * scale),
            image: getRecipeImageUrl(plannedRecipe),
            scale: Number(scale) || 1,
            notes: notes || '',
            is_completed: false,
            added_at: getCurrentTimestamp(), 
            slot: slot,
            ingredients_block: plannedRecipe.ingredients_block || '',
            ingredients: plannedRecipe.ingredients || [],
            prep_notes_block: plannedRecipe.prep_notes_block || ''
        };
        
        planData[date][slot].push(newItem);

        const { error: upsertError } = await supabase
            .from('weekly_plans')
            .upsert({
                user_id: user.id,
                week_start: weekStartStr,
                plan_data: planData,
                updated_at: getCurrentTimestamp(),
                cleared_at: null 
            }, { 
                onConflict: 'user_id, week_start' 
            });

        if (upsertError) throw upsertError;
        
        // Add to shopping list - triggers hook update automatically via Postgres subs
        try {
            await addRecipeIngredientsToShoppingList(user.id, { ...plannedRecipe, ...newItem }, scale);
            toast({ title: "Shopping List Updated", description: "Ingredients added to your list." });
        } catch (syncError) {
            console.error("Failed to sync shopping list:", syncError);
            toast({ title: "Shopping List Sync Error", description: "Meal saved, but failed to update shopping list.", variant: "destructive" });
        }

        if (onMealAdded) onMealAdded(newItem);
    } catch (error) {
        throw error;
    }
  };

  const handleAdd = async () => {
     if (!dateStr || !slot) {
         toast({ title: "Incomplete Selection", description: "Please select a date and meal slot.", variant: "destructive" });
         return;
     }

     setLoading(true);
     try {
       const planParams = { recipe, date: dateStr, slot, scale, notes: userNotes };
       
       if (onAddToPlanner) {
           await onAddToPlanner(planParams);
           if (user) await addRecipeIngredientsToShoppingList(user.id, recipe, scale);
       } else {
           await internalSaveToPlanner(planParams);
       }
       
       toast({ title: "Meal Added", description: "Added to plan." });
       onOpenChange(false);

     } catch (error) {
       console.error("[SAVE ERROR]", error);
       toast({
           title: "Error Saving Meal",
           description: error.message || "Failed to save to planner.",
           variant: "destructive"
       });
     } finally {
       setLoading(false);
     }
  };

  const toggleFavorite = () => {
      setIsFavorite(!isFavorite);
      toast({ title: isFavorite ? "Removed from favorites" : "Saved to favorites" });
  };

  const handlePrint = () => {
      window.print();
  };

  if (!recipe) return null;

  const macros = getDisplayMacros({ ...recipe, scale });
  const imageUrl = getRecipeImageUrl(recipe);
  const ingredientsList = getRecipeIngredients(recipe);
  const instructionsList = getRecipeInstructions(recipe);

  const checkPantry = (ingName) => {
      const clean = cleanIngredientName(ingName);
      return pantryItems.some(pItem => clean.includes(pItem) || pItem.includes(clean));
  };

  const totalCost = (recipe.estimated_cost || 0) * scale;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] bg-[#0B1120] border-slate-800 text-slate-200 p-0 overflow-hidden flex flex-col md:flex-row shadow-2xl">
        <div className="w-full md:w-[380px] bg-[#131B2D] flex flex-col border-r border-slate-800 overflow-y-auto">
            <div className="relative aspect-square w-full">
                <img src={imageUrl} alt={recipe.recipe_name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-[#131B2D] to-transparent opacity-90" />
                
                <button 
                  onClick={() => onOpenChange(false)}
                  className="absolute top-4 right-4 z-50 p-2 bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-md transition-colors border border-white/10 md:hidden"
                  aria-label="Close"
                >
                   <X className="w-5 h-5" />
                </button>

                <div className="absolute bottom-0 left-0 p-6 w-full">
                    <Badge className="bg-cyan-600 mb-2">{recipe.meal_type}</Badge>
                    <h2 className="text-2xl font-bold text-white leading-tight mb-2">{recipe.recipe_name}</h2>
                    <div className="flex items-center gap-1 text-yellow-400 mb-4">
                        {[1,2,3,4,5].map(star => (
                            <Star 
                                key={star} 
                                className={`w-4 h-4 cursor-pointer ${rating >= star ? 'fill-yellow-400' : 'text-slate-600'}`}
                                onClick={() => setRating(star)} 
                            />
                        ))}
                    </div>

                    <div className="flex justify-between items-center">
                        <div className="flex gap-2">
                             <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full bg-slate-800/50 hover:bg-slate-700" onClick={toggleFavorite}>
                                 <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-slate-300'}`} />
                             </Button>
                             <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full bg-slate-800/50 hover:bg-slate-700" onClick={handlePrint}>
                                 <Printer className="w-4 h-4 text-slate-300" />
                             </Button>
                        </div>
                        <div className="font-mono text-emerald-400 font-bold text-lg">
                            ${totalCost.toFixed(2)}
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-6 space-y-6">
                 <div className="grid grid-cols-2 gap-4">
                     <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                         <div className="flex items-center gap-2 text-slate-400 text-xs uppercase font-bold mb-1"><Clock className="w-3 h-3" /> Prep Time</div>
                         <div className="text-white font-semibold">{recipe.prep_time || '15m'}</div>
                     </div>
                     <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                         <div className="flex items-center gap-2 text-slate-400 text-xs uppercase font-bold mb-1"><Flame className="w-3 h-3" /> Cook Time</div>
                         <div className="text-white font-semibold">{recipe.cook_time || '15m'}</div>
                     </div>
                     <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                         <div className="flex items-center gap-2 text-slate-400 text-xs uppercase font-bold mb-1"><ChefHat className="w-3 h-3" /> Difficulty</div>
                         <div className="text-white font-semibold">{recipe.difficulty || 'Medium'}</div>
                     </div>
                     <div className="bg-slate-900/50 p-3 rounded-xl border border-slate-800">
                         <div className="flex items-center gap-2 text-slate-400 text-xs uppercase font-bold mb-1"><Scale className="w-3 h-3" /> Servings</div>
                         <div className="text-cyan-400 font-bold text-lg">{scale.toFixed(1)}</div>
                     </div>
                 </div>

                 <div className="space-y-3">
                     <div className="flex justify-between text-sm">
                         <span className="text-slate-400">Adjust Scale</span>
                         <span className="text-white font-mono">{scale}x</span>
                     </div>
                     <Slider value={[scale]} min={0.5} max={4} step={0.5} onValueChange={([v]) => setScale(v)} />
                 </div>

                 <div className="pt-4 border-t border-slate-800 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-1">
                             <label className="text-[10px] uppercase font-bold text-slate-500">Date</label>
                             <Select value={dateStr} onValueChange={setDateStr}>
                                <SelectTrigger className="bg-slate-900 border-slate-700 h-9 text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent className="bg-slate-900 border-slate-800">{weekDays.map(d => <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>)}</SelectContent>
                            </Select>
                         </div>
                         <div className="space-y-1">
                             <label className="text-[10px] uppercase font-bold text-slate-500">Slot</label>
                             <Select value={slot} onValueChange={setSlot}>
                                <SelectTrigger className="bg-slate-900 border-slate-700 h-9 text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent className="bg-slate-900 border-slate-800">{availableSlots.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                            </Select>
                         </div>
                    </div>
                    <Button 
                        className="w-full bg-cyan-600 hover:bg-cyan-500 font-bold" 
                        onClick={() => handleAdd()} 
                        disabled={loading}
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                        Add to Meal Plan
                    </Button>
                 </div>
            </div>
        </div>

        <div className="flex-1 flex flex-col bg-[#0B1120] min-w-0">
             <div className="border-b border-slate-800 px-6 pt-4">
                 <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                     <TabsList className="bg-transparent p-0 h-auto gap-6">
                         <TabsTrigger value="overview" className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-cyan-400 data-[state=active]:border-b-2 data-[state=active]:border-cyan-400 rounded-none px-0 pb-3 text-slate-400 hover:text-white transition-all">Overview</TabsTrigger>
                         <TabsTrigger value="ingredients" className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-cyan-400 data-[state=active]:border-b-2 data-[state=active]:border-cyan-400 rounded-none px-0 pb-3 text-slate-400 hover:text-white transition-all">Ingredients</TabsTrigger>
                         <TabsTrigger value="instructions" className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-cyan-400 data-[state=active]:border-b-2 data-[state=active]:border-cyan-400 rounded-none px-0 pb-3 text-slate-400 hover:text-white transition-all">Cooking Mode</TabsTrigger>
                         <TabsTrigger value="nutrition" className="bg-transparent data-[state=active]:bg-transparent data-[state=active]:text-cyan-400 data-[state=active]:border-b-2 data-[state=active]:border-cyan-400 rounded-none px-0 pb-3 text-slate-400 hover:text-white transition-all">Nutrition</TabsTrigger>
                     </TabsList>
                 </Tabs>
             </div>

             <ScrollArea className="flex-1 p-6">
                 {activeTab === 'overview' && (
                     <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                         {recipe.description && (
                             <div className="bg-slate-900/30 p-4 rounded-lg border-l-2 border-cyan-500 text-slate-300 italic">
                                 "{recipe.description}"
                             </div>
                         )}
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                             <div>
                                 <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Utensils className="w-4 h-4 text-cyan-500"/> Core Ingredients</h3>
                                 <ul className="space-y-2 text-sm text-slate-400">
                                     {ingredientsList.slice(0, 6).map((ing, i) => (
                                         <li key={i} className="flex gap-2">
                                             <span className="w-1.5 h-1.5 rounded-full bg-slate-700 mt-1.5 shrink-0" />
                                             {ing}
                                         </li>
                                     ))}
                                     {ingredientsList.length > 6 && <li className="italic text-xs opacity-50">...and {ingredientsList.length - 6} more</li>}
                                 </ul>
                             </div>
                             <div>
                                  <h3 className="font-bold text-white mb-4 flex items-center gap-2"><Info className="w-4 h-4 text-cyan-500"/> Macro Split</h3>
                                  <div className="space-y-4">
                                      <div className="space-y-1">
                                          <div className="flex justify-between text-xs"><span>Protein</span><span className="text-blue-400">{Math.round(macros.protein)}g</span></div>
                                          <Progress value={(macros.protein / (macros.protein+macros.fat+macros.carbs))*100} className="h-1.5 bg-slate-800" indicatorClassName="bg-blue-500"/>
                                      </div>
                                      <div className="space-y-1">
                                          <div className="flex justify-between text-xs"><span>Fats</span><span className="text-yellow-400">{Math.round(macros.fat)}g</span></div>
                                          <Progress value={(macros.fat / (macros.protein+macros.fat+macros.carbs))*100} className="h-1.5 bg-slate-800" indicatorClassName="bg-yellow-500"/>
                                      </div>
                                      <div className="space-y-1">
                                          <div className="flex justify-between text-xs"><span>Carbs</span><span className="text-emerald-400">{Math.round(macros.carbs)}g</span></div>
                                          <Progress value={(macros.carbs / (macros.protein+macros.fat+macros.carbs))*100} className="h-1.5 bg-slate-800" indicatorClassName="bg-emerald-500"/>
                                      </div>
                                  </div>
                             </div>
                         </div>
                         <div className="space-y-3 pt-4 border-t border-slate-800">
                            <h3 className="flex items-center gap-2 text-lg font-bold text-white">
                                <StickyNote className="w-5 h-5 text-slate-400" /> My Notes
                            </h3>
                            <Textarea 
                                placeholder="Add your own notes, tweaks, or reminders..."
                                className="bg-slate-900/50 border-slate-700 text-slate-200 resize-none min-h-[100px]"
                                value={userNotes}
                                onChange={(e) => setUserNotes(e.target.value)}
                            />
                         </div>
                     </div>
                 )}
                 {activeTab === 'ingredients' && (
                     <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="flex justify-between items-center mb-4">
                             <h3 className="font-bold text-white">Required Ingredients</h3>
                             <Button variant="ghost" size="sm" className="text-xs text-slate-500 hover:text-white" onClick={() => setShowDebug(!showDebug)}>
                                <Bug className="w-3 h-3 mr-1"/> Debug
                             </Button>
                        </div>
                        
                        {showDebug && (
                            <div className="bg-black/50 p-4 rounded-lg font-mono text-xs text-green-400 mb-4 overflow-x-auto whitespace-pre-wrap border border-slate-800">
                                <strong>RAW INGREDIENTS DUMP:</strong>
                                <br/>
                                {JSON.stringify(ingredientsList, null, 2)}
                            </div>
                        )}

                         <div className="grid gap-3">
                             {ingredientsList.map((ing, i) => {
                                 const inPantry = checkPantry(ing);
                                 return (
                                     <div key={i} className={`flex items-start justify-between p-3 rounded-lg border ${inPantry ? 'bg-emerald-950/10 border-emerald-900/30' : 'bg-slate-900/20 border-slate-800'}`}>
                                         <div className="flex gap-3">
                                             {inPantry ? (
                                                 <div className="mt-0.5 w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/50">
                                                     <Check className="w-3 h-3 text-emerald-500" />
                                                 </div>
                                             ) : (
                                                 <div className="mt-0.5 w-5 h-5 rounded-full border border-slate-700 bg-slate-800" />
                                             )}
                                             <div>
                                                 <div className={`text-sm ${inPantry ? 'text-emerald-300' : 'text-slate-300'}`}>{ing}</div>
                                                 {inPantry && <div className="text-[10px] text-emerald-500 font-medium mt-0.5">Available in Pantry</div>}
                                             </div>
                                         </div>
                                     </div>
                                 );
                             })}
                         </div>
                     </div>
                 )}
                 {activeTab === 'instructions' && (
                     <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300 pb-10">
                         <div className="space-y-4">
                             {instructionsList.map((step, i) => (
                                 <div 
                                    key={i} 
                                    onClick={() => setInstructionsCompleted(prev => ({ ...prev, [i]: !prev[i] }))}
                                    className={`flex gap-4 p-4 rounded-xl border cursor-pointer transition-all ${instructionsCompleted[i] ? 'bg-emerald-950/10 border-emerald-900/30 opacity-60' : 'bg-slate-900/40 border-slate-800 hover:border-cyan-800'}`}
                                 >
                                     <div className={`flex-none w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border ${instructionsCompleted[i] ? 'bg-emerald-500 text-black border-emerald-500' : 'bg-slate-800 text-cyan-500 border-slate-700'}`}>
                                         {instructionsCompleted[i] ? <Check className="w-5 h-5" /> : i + 1}
                                     </div>
                                     <p className={`text-sm leading-relaxed pt-1 ${instructionsCompleted[i] ? 'text-slate-500 line-through' : 'text-slate-300'}`}>{step}</p>
                                 </div>
                             ))}
                         </div>
                     </div>
                 )}
                 {activeTab === 'nutrition' && (
                     <div className="flex flex-col items-center animate-in zoom-in-95 duration-300">
                         <NutritionFactLabel macros={macros} servings={scale} />
                     </div>
                 )}
             </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
