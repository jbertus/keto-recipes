
import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import { 
  Clock, Users, ChefHat, StickyNote, Utensils, Save, Loader2, 
  CalendarDays, Trash2, Microscope, Thermometer, Box, RotateCw, AlertCircle, X as XIcon
} from 'lucide-react';
import { getRecipeImageUrl } from '@/lib/imageUtils';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { getRecipeIngredients, getRecipeInstructions, parseIngredient } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format, parseISO, addDays } from 'date-fns';

const MEAL_SLOTS = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Sweets'];

export default function RecipeViewDialog({ 
  open, 
  onOpenChange, 
  recipe, 
  weekStart,
  plannedContext,
  onRemove,
  onMoveDay,
  onChangeMealType,
  onChangeServings
}) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [activeRecipe, setActiveRecipe] = useState(recipe);
  const [noteId, setNoteId] = useState(null);
  const [userNote, setUserNote] = useState("");
  const [loadingNote, setLoadingNote] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [guidance, setGuidance] = useState(null);
  const [micros, setMicros] = useState(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [loadingFullRecipe, setLoadingFullRecipe] = useState(false);

  // Calculate week days for dropdown (Task 4B)
  const weekDays = useMemo(() => {
    if (!weekStart) return [];
    return Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));
  }, [weekStart]);

  useEffect(() => {
    if (!open || !recipe) return;

    // Use recipe passed in props, updated by parent logic if needed
    setActiveRecipe(recipe);

    // Initial State Check for Full Details
    const hasIngredients = !!(recipe.ingredients_block && recipe.ingredients_block.length > 0);
    const hasInstructions = !!(recipe.prep_notes_block && recipe.prep_notes_block.length > 0);

    const targetRecipeId = recipe.recipe_id || recipe.id;
    
    if (!targetRecipeId) return;

    // Fetch Full Recipe Content if missing
    if (!hasIngredients || !hasInstructions) {
      const fetchFullRecipe = async () => {
        setLoadingFullRecipe(true);
        try {
          const { data, error } = await supabase
            .from('personal_recipes')
            .select('*')
            .eq('id', targetRecipeId)
            .single();

          if (!error && data) {
            setActiveRecipe(prev => ({
              ...data,
              ...prev, // Keep existing planner context like dateKey if any
              ingredients_block: data.ingredients_block,
              prep_notes_block: data.prep_notes_block,
              id: prev.id, // Preserve ID of planned meal if it exists
              recipe_id: data.id 
            }));
          }
        } catch (err) {
          console.error('Exception fetching full recipe:', err);
        } finally {
          setLoadingFullRecipe(false);
        }
      };
      fetchFullRecipe();
    }
  }, [open, recipe]);

  useEffect(() => {
    if (open && activeRecipe) {
      const lookupId = activeRecipe.recipe_id ? activeRecipe.recipe_id : activeRecipe.id;

      if (user && lookupId) fetchUserNote(lookupId);
      if (lookupId) fetchAdditionalDetails(lookupId);
    } else {
      setUserNote("");
      setNoteId(null);
      setGuidance(null);
      setMicros(null);
    }
  }, [open, activeRecipe?.id, activeRecipe?.recipe_id, user?.id]);

  const fetchAdditionalDetails = async (rId) => {
     setIsLoadingDetails(true);
     try {
         const { data: guidanceData } = await supabase.from('recipe_guidance').select('*').eq('recipe_id', rId).maybeSingle();
         if (guidanceData) setGuidance(guidanceData);

         const { data: microData } = await supabase.from('recipe_micronutrients').select('*').eq('recipe_id', rId).maybeSingle();
         if (microData) setMicros(microData);
     } catch (err) { console.error("Error fetching details:", err); } finally { setIsLoadingDetails(false); }
  };

  const fetchUserNote = async (rId) => {
    setLoadingNote(true);
    try {
      const { data } = await supabase.from('recipe_notes').select('id, note').eq('user_id', user.id).eq('recipe_id', rId).maybeSingle();
      if (data) { setNoteId(data.id); setUserNote(data.note || ""); } 
      else { setNoteId(null); setUserNote(""); }
    } catch (err) { console.error("Failed to fetch notes:", err); } finally { setLoadingNote(false); }
  };

  const handleSaveNote = async () => {
    if (!user || !activeRecipe) return;
    const rId = activeRecipe.recipe_id || activeRecipe.id; // Correct ID for notes

    setSavingNote(true);
    try {
      if (noteId) {
        await supabase.from('recipe_notes').update({ note: userNote }).eq('id', noteId);
      } else {
        const { data } = await supabase.from('recipe_notes').insert({ user_id: user.id, recipe_id: rId, note: userNote }).select().single();
        if (data) setNoteId(data.id);
      }
      toast({ title: "Notes Saved", description: "Your private chef's notes have been updated." });
    } catch (error) { toast({ variant: "destructive", title: "Save Failed", description: "Could not save your notes." }); } finally { setSavingNote(false); }
  };

  // --- Handlers for Planner Actions ---
  const handleRemove = async () => {
    if (!plannedContext || !onRemove) return;
    const result = onRemove(plannedContext);
    if (result && result.success) {
      toast({ title: "Meal Removed", description: "Removed from planner." });
      onOpenChange(false);
    } else {
      toast({ variant: "destructive", title: "Error", description: result?.error || "Failed to remove meal." });
    }
  };

  const handleMove = async (toDay) => {
    if (!plannedContext || !onMoveDay) return;
    const result = onMoveDay(plannedContext, toDay);
    if (result && result.success) {
      toast({ title: "Meal Moved", description: `Moved to ${format(parseISO(toDay), 'EEEE')}` });
    } else {
      toast({ variant: "destructive", title: "Error", description: result?.error || "Failed to move meal." });
    }
  };

  const handleChangeType = async (newType) => {
    if (!plannedContext || !onChangeMealType) return;
    const result = onChangeMealType(plannedContext, newType);
    if (result && result.success) {
      toast({ title: "Slot Updated", description: `Changed to ${newType}` });
    } else {
      toast({ variant: "destructive", title: "Error", description: result?.error || "Failed to change slot." });
    }
  };

  const handleChangeServings = async (e) => {
    if (!plannedContext || !onChangeServings) return;
    const val = parseInt(e.target.value, 10);
    if (isNaN(val) || val < 1 || val > 10) return; // Validation handled by input constraints too
    
    const result = onChangeServings(plannedContext, val);
    if (result && result.success) {
      // toast({ title: "Servings Updated" }); // Less noise
    } else {
      toast({ variant: "destructive", title: "Error", description: result?.error || "Failed to update servings." });
    }
  };


  // Ingredient Scaling & Display
  const currentScale = plannedContext?.servings || 1;
  const ingredients = useMemo(() => {
    if (!activeRecipe) return [];
    
    let rawIngredients = [];

    if (activeRecipe.ingredients_block && typeof activeRecipe.ingredients_block === 'string') {
       rawIngredients = activeRecipe.ingredients_block.split(/\r?\n/);
    } else {
       rawIngredients = getRecipeIngredients(activeRecipe);
    }
    
    return rawIngredients.map(line => {
        if (!line.trim()) return null;
        const parsed = parseIngredient(line);
        if (parsed && parsed.qty) {
            const scaledQty = parseFloat((parsed.qty * currentScale).toFixed(2));
            const unitStr = parsed.unit === 'pcs' ? '' : parsed.unit;
            return {
                original: line,
                display: `${scaledQty} ${unitStr} ${parsed.name}`.trim(),
                isScaled: currentScale !== 1
            };
        }
        return { original: line, display: line, isScaled: false };
    }).filter(Boolean);
  }, [activeRecipe, currentScale]);

  const instructions = useMemo(() => {
    return getRecipeInstructions(activeRecipe, guidance);
  }, [activeRecipe, guidance]);


  if (!activeRecipe) return null;

  // Macros (Scaled)
  const displayCalories = Math.round((activeRecipe.calories_per_serving || 0) * currentScale);
  const displayProtein = Math.round((activeRecipe.protein_per_serving_g || 0) * currentScale);
  const displayFat = Math.round((activeRecipe.fat_per_serving_g || 0) * currentScale);
  const displayCarbs = Math.round((activeRecipe.net_carbs_per_serving_g || 0) * currentScale);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[95vw] md:max-w-5xl h-[90vh] bg-[#0F172A] border-slate-800 text-slate-200 p-0 flex flex-col overflow-y-auto min-h-0 min-w-0"
      >
        {/* HEADER */}
        <DialogHeader className="p-4 bg-[#0F172A] border-b border-slate-800 shrink-0 z-10 flex flex-col gap-2">
          {/* Task 4: Planned Context Header */}
          {plannedContext && (
             <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold uppercase tracking-wider bg-cyan-950/30 w-fit px-2 py-1 rounded border border-cyan-900/50">
                 <CalendarDays className="w-3.5 h-3.5" />
                 <span>Planned: {format(parseISO(plannedContext.day), 'EEEE')} • {plannedContext.mealType}</span>
             </div>
          )}

          <div className="flex flex-row items-center justify-between gap-4">
            <div className="min-w-0">
                <DialogTitle className="text-xl md:text-2xl font-bold text-white flex items-center gap-2 truncate leading-normal">
                  {activeRecipe.recipe_name}
                </DialogTitle>
                <div className="flex flex-wrap items-center gap-4 text-xs md:text-sm text-slate-400 mt-1">
                    <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-cyan-500" />
                        <span>{activeRecipe.estimated_total_time_min || 15} min</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-cyan-500" />
                        <span>{activeRecipe.servings_per_batch || 1} Servings (Base)</span>
                    </div>
                </div>
            </div>

            <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
                className="text-slate-400 hover:text-white shrink-0 min-h-[44px] min-w-[44px]"
            >
                <span className="sr-only">Close</span>
                <XIcon className="w-5 h-5" />
            </Button>
          </div>
        </DialogHeader>

        {/* Task 5-8: Planned Instance Controls */}
        {plannedContext && (
            <div className="shrink-0 bg-[#131B2D] border-b border-slate-800 p-3 grid grid-cols-2 md:grid-cols-4 gap-3">
                {/* MOVE DAY */}
                <div className="space-y-1">
                    <Label className="text-[10px] uppercase text-slate-500 font-bold">Move Day</Label>
                    <Select value={plannedContext.day} onValueChange={handleMove}>
                        <SelectTrigger className="h-10 md:h-8 text-xs bg-slate-900 border-slate-700">
                            <SelectValue placeholder="Select Day" />
                        </SelectTrigger>
                        <SelectContent>
                             {weekDays?.map(day => (
                                 <SelectItem key={format(day, 'yyyy-MM-dd')} value={format(day, 'yyyy-MM-dd')}>
                                     {format(day, 'EEEE')}
                                 </SelectItem>
                             ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* CHANGE SLOT */}
                <div className="space-y-1">
                    <Label className="text-[10px] uppercase text-slate-500 font-bold">Meal Slot</Label>
                    <Select value={plannedContext.mealType} onValueChange={handleChangeType}>
                        <SelectTrigger className="h-10 md:h-8 text-xs bg-slate-900 border-slate-700">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                             {MEAL_SLOTS.map(slot => (
                                 <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                             ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* SERVINGS / SCALE */}
                <div className="space-y-1">
                    <Label className="text-[10px] uppercase text-slate-500 font-bold">Servings (Scale)</Label>
                    <Input 
                        type="number" 
                        min="1" 
                        max="10" 
                        value={plannedContext.servings}
                        onChange={handleChangeServings}
                        className="h-10 md:h-8 text-xs bg-slate-900 border-slate-700"
                    />
                </div>

                {/* REMOVE BUTTON */}
                <div className="flex items-end">
                    <Button 
                        onClick={handleRemove} 
                        variant="destructive" 
                        size="sm" 
                        className="w-full h-10 md:h-8 text-xs bg-red-900/50 hover:bg-red-900 text-red-200 border border-red-800"
                    >
                        <Trash2 className="w-3.5 h-3.5 mr-2" /> Remove
                    </Button>
                </div>
            </div>
        )}

        {/* MAIN CONTENT */}
        <div className="flex-1 overflow-hidden h-full min-h-0 min-w-0">
          <ResizablePanelGroup direction="horizontal" className="h-full w-full min-h-0 min-w-0 rounded-none border-0">
            {/* LEFT PANEL: Image & Macros (Mobile: Full Width / Desktop: 35%) */}
            <ResizablePanel defaultSize={35} minSize={20} className="bg-[#1E293B]/30 flex flex-col min-h-0 min-w-0 order-last md:order-first">
              <ScrollArea type="hover" className="h-full w-full min-h-0">
                <div className="flex flex-col min-h-0">
                  <div className="relative w-full aspect-video shrink-0 bg-slate-900">
                    <img
                      src={getRecipeImageUrl(activeRecipe)}
                      alt={activeRecipe.recipe_name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-transparent to-transparent opacity-60" />
                  </div>

                  <div className="p-4 md:p-6 space-y-6">
                    {/* Scaled Macros (Inline) */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                         <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                            Macronutrients
                         </h4>
                         {currentScale !== 1 && (
                             <span className="text-[10px] text-cyan-500 bg-cyan-950/30 px-2 py-0.5 rounded border border-cyan-900">
                                 Scaled x{currentScale}
                             </span>
                         )}
                      </div>
                      
                      {/* INLINE MACROS GRID */}
                      <div className="grid grid-cols-2 gap-3">
                          {/* Protein */}
                          <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-800">
                            <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Protein</div>
                            <div className="text-lg font-bold text-blue-400">{displayProtein}<span className="text-sm ml-1">g</span></div>
                          </div>
                          {/* Fat */}
                          <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-800">
                            <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Fat</div>
                            <div className="text-lg font-bold text-amber-400">{displayFat}<span className="text-sm ml-1">g</span></div>
                          </div>
                          {/* Carbs */}
                          <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-800">
                            <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Net Carbs</div>
                            <div className="text-lg font-bold text-emerald-400">{displayCarbs}<span className="text-sm ml-1">g</span></div>
                          </div>
                          {/* Calories */}
                          <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-800">
                            <div className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Calories</div>
                            <div className="text-lg font-bold text-slate-300">{displayCalories}</div>
                          </div>
                      </div>
                    </div>

                    {/* Task 11: Micronutrients Section (Inline) */}
                    <div className="space-y-3 pt-4 border-t border-slate-800">
                        <div className="flex items-center gap-2">
                             <Microscope className="w-4 h-4 text-purple-400" />
                             <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Micronutrients</h4>
                        </div>
                        {micros && micros.per_serving ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-slate-300">
                                {Object.entries(micros.per_serving).map(([key, val]) => (
                                    <div key={key} className="flex justify-between bg-slate-900/50 p-2 rounded">
                                        <span className="capitalize text-slate-400">{key.replace(/_/g, ' ')}</span>
                                        <span className="font-mono">{val}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-3 rounded bg-slate-900/30 border border-slate-800 text-xs text-slate-500 italic flex items-center gap-2">
                                <AlertCircle className="w-3 h-3" />
                                Micronutrients not available until FDC key is configured and micros are computed.
                            </div>
                        )}
                    </div>
                    
                    {/* Task 10: Guidance Section (Inline) */}
                    {guidance ? (
                        <div className="space-y-4 pt-4 border-t border-slate-800">
                             {/* Storage */}
                             <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Box className="w-4 h-4 text-cyan-500" />
                                    <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Storage</h5>
                                </div>
                                <p className="text-sm text-slate-300 leading-relaxed bg-slate-900/30 p-3 rounded border border-slate-800">
                                    {guidance.storage_guidance || "No storage guidance available."}
                                </p>
                             </div>
                             {/* Reheat */}
                             <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <RotateCw className="w-4 h-4 text-cyan-500" />
                                    <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Reheat</h5>
                                </div>
                                <p className="text-sm text-slate-300 leading-relaxed bg-slate-900/30 p-3 rounded border border-slate-800">
                                    {guidance.reheat_guidance || "No reheating guidance available."}
                                </p>
                             </div>
                             {/* Prep */}
                             <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Thermometer className="w-4 h-4 text-cyan-500" />
                                    <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Prep</h5>
                                </div>
                                <p className="text-sm text-slate-300 leading-relaxed bg-slate-900/30 p-3 rounded border border-slate-800">
                                    {guidance.prep_guidance || "No prep guidance available."}
                                </p>
                             </div>
                        </div>
                    ) : (
                         <div className="p-4 rounded-lg bg-[#0F172A] border border-slate-800 text-sm italic text-slate-500 text-center mt-4">
                             Prep/Storage/Reheat not available yet. (Admin can generate.)
                         </div>
                    )}

                  </div>
                </div>
              </ScrollArea>
            </ResizablePanel>

            <ResizableHandle withHandle className="bg-slate-800 hover:bg-cyan-600 transition-colors w-1.5 hidden md:flex" />

            {/* RIGHT PANEL: Ingredients, Instructions, Notes */}
            <ResizablePanel defaultSize={65} minSize={30} className="bg-[#0F172A] flex flex-col min-h-0 min-w-0 order-first md:order-last">
              <ResizablePanelGroup direction="vertical" className="min-h-0 min-w-0">
                {/* INGREDIENTS - Task 9 */}
                <ResizablePanel defaultSize={35} minSize={15} className="flex flex-col min-h-0 min-w-0">
                  <div className="p-3 bg-[#131B2D] border-b border-slate-800/50 flex items-center justify-between shrink-0 select-none">
                    <div className="flex items-center gap-2">
                        <Utensils className="w-4 h-4 text-cyan-500" />
                        <h3 className="font-semibold text-xs uppercase tracking-wide text-slate-300">Ingredients</h3>
                    </div>
                    {currentScale !== 1 && <span className="text-[10px] text-slate-500">Scaled for {currentScale} servings</span>}
                  </div>

                  <ScrollArea type="hover" className="flex-1 min-h-0 bg-[#0F172A]">
                    <div className="p-4 pr-6">
                      <ul className="space-y-3">
                        {loadingFullRecipe ? (
                          <div className="flex items-center gap-2 text-slate-500 text-sm">
                             <Loader2 className="w-4 h-4 animate-spin" /> Loading ingredients...
                          </div>
                        ) : ingredients.length > 0 ? (
                          ingredients.map((item, i) =>
                            item ? (
                              <li key={i} className="flex items-start gap-3 text-sm text-slate-300 leading-relaxed">
                                <span className="mt-2 w-1.5 h-1.5 rounded-full bg-cyan-600/50 flex-shrink-0" />
                                <span className={item.isScaled ? "font-medium text-white" : ""}>{item.display}</span>
                              </li>
                            ) : null
                          )
                        ) : (
                          <li className="text-slate-500 italic text-sm">No ingredients listed.</li>
                        )}
                      </ul>
                    </div>
                  </ScrollArea>
                </ResizablePanel>

                <ResizableHandle withHandle className="bg-slate-800 hover:bg-cyan-600 transition-colors h-1.5" />

                {/* INSTRUCTIONS */}
                <ResizablePanel defaultSize={40} minSize={15} className="flex flex-col min-h-0 min-w-0">
                  <div className="p-3 bg-[#131B2D] border-y border-slate-800/50 flex items-center gap-2 shrink-0 select-none">
                    <ChefHat className="w-4 h-4 text-cyan-500" />
                    <h3 className="font-semibold text-xs uppercase tracking-wide text-slate-300">Instructions</h3>
                  </div>

                  <ScrollArea type="hover" className="flex-1 min-h-0 bg-[#0F172A]">
                    <div className="p-4 pr-6">
                      <div className="space-y-4">
                        {loadingFullRecipe ? (
                           <div className="flex items-center gap-2 text-slate-500 text-sm">
                             <Loader2 className="w-4 h-4 animate-spin" /> Loading instructions...
                           </div>
                        ) : instructions.length > 0 ? (
                          instructions.map((step, i) =>
                            step ? (
                              <div key={i} className="flex gap-4">
                                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-slate-800 text-cyan-500 flex items-center justify-center text-xs font-bold border border-slate-700 mt-0.5">
                                  {i + 1}
                                </div>
                                <p className="text-sm text-slate-300 leading-relaxed">{step}</p>
                              </div>
                            ) : null
                          )
                        ) : (
                          <div className="text-slate-500 italic text-sm">
                             {isLoadingDetails ? (
                                <span className="flex items-center gap-2"><Loader2 className="w-3 h-3 animate-spin" /> Loading instructions...</span>
                             ) : "No instructions available."}
                          </div>
                        )}
                      </div>
                    </div>
                  </ScrollArea>
                </ResizablePanel>

                <ResizableHandle withHandle className="bg-slate-800 hover:bg-cyan-600 transition-colors h-1.5" />

                {/* CHEF'S NOTES (Editable) */}
                <ResizablePanel defaultSize={25} minSize={15} className="flex flex-col min-h-0 min-w-0">
                  <div className="p-3 bg-[#131B2D] border-y border-slate-800/50 flex items-center justify-between shrink-0 select-none">
                    <div className="flex items-center gap-2">
                      <StickyNote className="w-4 h-4 text-cyan-500" />
                      <h3 className="font-semibold text-xs uppercase tracking-wide text-slate-300">
                        Chef's Notes (Private)
                      </h3>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleSaveNote}
                      disabled={loadingNote || savingNote}
                      className="h-7 px-2 text-cyan-400 hover:text-cyan-300 hover:bg-cyan-950/30"
                    >
                      {savingNote ? (
                        <Loader2 className="w-3 h-3 animate-spin mr-1" />
                      ) : (
                        <Save className="w-3 h-3 mr-1" />
                      )}
                      Save
                    </Button>
                  </div>

                  <div className="flex-1 min-h-0 flex flex-col bg-[#0B1120]">
                    {loadingNote ? (
                      <div className="flex items-center justify-center h-full text-slate-500 gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" /> Loading notes...
                      </div>
                    ) : (
                      <Textarea
                        value={userNote}
                        onChange={(e) => setUserNote(e.target.value)}
                        placeholder="Add your own private notes, tweaks, or reminders for this recipe here..."
                        className="flex-1 min-h-0 resize-none bg-transparent border-0 focus-visible:ring-0 rounded-none p-4 text-slate-300 text-sm leading-relaxed overflow-auto"
                      />
                    )}
                  </div>
                </ResizablePanel>
              </ResizablePanelGroup>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </DialogContent>
    </Dialog>
  );
}
