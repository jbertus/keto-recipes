import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Heart, Edit, CalendarPlus, Clock, Users, ChefHat, Check, Plus, X, Scale, Flame, Wheat, Dumbbell, Cookie, Calendar as CalendarIcon, Loader2, Utensils, FileText, StickyNote, Save, ArrowLeftRight } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogTrigger,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { getDisplayMacros, formatIngredientLine, cn, validateWeekStart } from '@/lib/utils';
import { getRecipeImageUrl } from '@/lib/imageUtils';
import { format, startOfWeek } from 'date-fns';
import { usePreferences } from '@/contexts/PreferencesContext';

const AVAILABLE_TAGS = ['Keto', 'Vegan', 'Vegetarian', 'Paleo', 'Gluten-Free', 'Dairy-Free', 'High Protein', 'Low Carb'];
const PRESET_MULTIPLIERS = [0.5, 1, 1.5, 2];
const MEAL_SLOTS = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Sweets'];

// Robust Ingredient Parser
const getIngredientsList = (recipe) => {
  if (!recipe) return [];
  
  const candidates = [
      recipe.ingredients,      
      recipe.ingredients_block,
      recipe.ingredients_norm
  ];

  for (const raw of candidates) {
      if (!raw) continue;
      
      if (Array.isArray(raw)) {
          if (raw.length === 0) continue;
          return raw.map(item => {
              if (typeof item === 'string') return item;
              if (typeof item === 'object' && item !== null) {
                   const parts = [];
                   if (item.qty) parts.push(item.qty);
                   if (item.unit) parts.push(item.unit);
                   if (item.name) parts.push(item.name);
                   
                   if (parts.length > 0) return parts.join(' ');
                   return item.original || item.text || JSON.stringify(item);
              }
              return String(item);
          }).filter(Boolean);
      }
      
      if (typeof raw === 'string') {
          const trimmed = raw.trim();
          if (!trimmed) continue;
          
          if (trimmed.includes('|')) {
             return trimmed.split(/\r?\n/).map(line => {
                const parts = line.split('|');
                if (parts.length >= 3) {
                   return `${parts[1]} ${parts[2]} ${parts[0]}`.trim(); 
                }
                return line.replace(/\|/g, ' ');
             }).filter(Boolean);
          }
          return trimmed.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
      }
  }

  return [];
};

const scaleNumberString = (str, multiplier) => {
  try {
    if (str.includes('/')) {
      const [num, den] = str.split('/').map(Number);
      if (!den) return str;
      const val = num / den;
      return formatDecimal(val * multiplier);
    }
    // Handle ranges like "1-2"
    if (str.includes('-')) {
        const parts = str.split('-').map(p => p.trim());
        if (parts.every(p => !isNaN(parseFloat(p)))) {
             return parts.map(p => formatDecimal(parseFloat(p) * multiplier)).join('-');
        }
    }
    const val = parseFloat(str);
    if (isNaN(val)) return str;
    return formatDecimal(val * multiplier);
  } catch {
    return str;
  }
};

const formatDecimal = (num) => {
  const rounded = Math.round(num * 100) / 100;
  return rounded.toString();
};

const scaleIngredientsText = (recipe, multiplier, substitutions = {}) => {
  // Get standardized list first
  const baseIngredients = getIngredientsList(recipe);
  
  if (baseIngredients.length === 0) return '';
  
  const textBlock = baseIngredients.join('\n');

  // Apply substitutions
  const processedTextWithSubs = substitutions ? applySubstitutionsToBlock(textBlock, substitutions) : textBlock;

  // Scale lines
  const lines = processedTextWithSubs.split('\n');
  return lines.map(line => {
      // Clean standard line formatting if needed
      const cleaned = formatIngredientLine(line);
      
      if (multiplier === 1) return cleaned;

      return cleaned.replace(/^(\d+(?:\.\d+)?(?:\/\d+)?(?:\s*-\s*\d+(?:\.\d+)?(?:\/\d+)?)?)/, (match) => {
          return scaleNumberString(match, multiplier);
      });
  }).join('\n');
};

const applySubstitutionsToBlock = (text, substitutions) => {
   let newText = text;
   Object.entries(substitutions).forEach(([original, sub]) => {
      const regex = new RegExp(`\\b${original}\\b`, 'gi'); 
      newText = newText.replace(regex, `${sub} (sub)`);
   });
   return newText;
};

function RecipeDetails({ 
  recipe, 
  isFavorite, 
  onToggleFavorite, 
  note, 
  onSaveNote, 
  onEdit, 
  scale,
  onScaleChange 
}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { preferences, updatePreferences } = usePreferences();
  
  const [localNote, setLocalNote] = useState(note || '');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [currentTags, setCurrentTags] = useState(recipe?.tags || []);
  const [isTagLoading, setIsTagLoading] = useState(false);
  
  const [internalScale, setInternalScale] = useState(1);
  
  // Substitution State
  const [showSubModal, setShowSubModal] = useState(false);
  const [subOriginal, setSubOriginal] = useState('');
  const [subNew, setSubNew] = useState('');
  const [recipeSubs, setRecipeSubs] = useState({});

  // Planning State
  const [isPlanDialogOpen, setIsPlanDialogOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [planDate, setPlanDate] = useState(new Date());
  const [planSlot, setPlanSlot] = useState('Breakfast');
  const [isPlanning, setIsPlanning] = useState(false);

  const activeScale = scale !== undefined ? scale : internalScale;

  useEffect(() => {
     setLocalNote(note || '');
     setCurrentTags(recipe?.tags || []);
     if (scale === undefined) setInternalScale(1);
     
     if (recipe?.default_meal_slot && MEAL_SLOTS.includes(recipe.default_meal_slot)) {
         setPlanSlot(recipe.default_meal_slot);
     } else if (recipe?.meal_type) {
         const type = recipe.meal_type.toLowerCase();
         if (type.includes('breakfast')) setPlanSlot('Breakfast');
         else if (type.includes('lunch')) setPlanSlot('Lunch');
         else if (type.includes('dinner')) setPlanSlot('Dinner');
         else if (type.includes('snack')) setPlanSlot('Snack');
         else if (type.includes('dessert') || type.includes('sweet') || type.includes('treat')) setPlanSlot('Sweets');
     }

     if (recipe && preferences.recipe_substitutions && preferences.recipe_substitutions[recipe.id]) {
        setRecipeSubs(preferences.recipe_substitutions[recipe.id]);
     } else {
        setRecipeSubs({});
     }
  }, [note, recipe, scale, preferences]);

  const handleScaleChange = (newVal) => {
    if (scale !== undefined && onScaleChange) {
      onScaleChange(newVal);
    } else {
      setInternalScale(newVal);
    }
  };

  const handleAddSub = async () => {
     if (!subOriginal || !subNew || !recipe) return;
     const newSubs = { ...recipeSubs, [subOriginal]: subNew };
     setRecipeSubs(newSubs);
     
     const allSubs = preferences.recipe_substitutions || {};
     const updatedPrefs = {
        ...preferences,
        recipe_substitutions: {
           ...allSubs,
           [recipe.id]: newSubs
        }
     };
     
     await updatePreferences(updatedPrefs);
     setSubOriginal('');
     setSubNew('');
     setShowSubModal(false);
     toast({ title: "Substitution Saved", description: `Swapped ${subOriginal} for ${subNew}` });
  };

  const removeSub = async (key) => {
     const newSubs = { ...recipeSubs };
     delete newSubs[key];
     setRecipeSubs(newSubs);

     const allSubs = preferences.recipe_substitutions || {};
     const updatedPrefs = {
        ...preferences,
        recipe_substitutions: {
           ...allSubs,
           [recipe.id]: newSubs
        }
     };
     await updatePreferences(updatedPrefs);
  };

  if (!recipe) return null;

  const handleSaveNote = async () => {
     if (!recipe) return;
     if (localNote === note) return;

     setIsSavingNote(true);
     try {
       await onSaveNote(recipe.id, localNote);
       toast({
         title: "Note Saved",
         description: "Your personal note has been updated.",
       });
     } catch (error) {
       toast({
         variant: "destructive",
         title: "Error",
         description: "Failed to save note.",
       });
     } finally {
       setIsSavingNote(false);
     }
  };

  const handleToggleTag = async (tag) => {
    if (!recipe || isTagLoading) return;
    setIsTagLoading(true);
    try {
      const newTags = currentTags.includes(tag) ? currentTags.filter(t => t !== tag) : [...currentTags, tag];
      const { error } = await supabase.from('personal_recipes').update({ tags: newTags }).eq('id', recipe.id);
      if (error) throw error;
      setCurrentTags(newTags);
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to update tags." });
    } finally {
      setIsTagLoading(false);
    }
  };

  const handleConfirmPlan = async () => {
      if (!planDate || !planSlot) return;
      setIsPlanning(true);

      try {
        // CORRECT: Always use weekStartsOn: 0 for Sunday
        const weekStart = startOfWeek(planDate, { weekStartsOn: 0 });
        const weekStartStr = format(weekStart, 'yyyy-MM-dd');
        const dateStr = format(planDate, 'yyyy-MM-dd');

        const validation = validateWeekStart(weekStartStr);
        if (!validation.isValid) {
            console.error(`[AUDIT] CRITICAL: Attempting to save invalid week_start: ${weekStartStr}`);
        }

        const { data: existingPlans, error: fetchError } = await supabase
            .from('weekly_plans')
            .select('plan_data')
            .eq('user_id', user.id)
            .eq('week_start', weekStartStr)
            .maybeSingle();

        if (fetchError) throw fetchError;

        let planData = existingPlans?.plan_data || {};
        const currentMeals = Array.isArray(planData[dateStr]) ? planData[dateStr] : [];

        const newItem = {
            ...recipe,
            id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36),
            original_id: recipe.id,
            scale: activeScale,
            slot: planSlot,
            is_completed: false,
            added_at: new Date().toISOString()
        };
        
        planData[dateStr] = [...currentMeals, newItem];

        const { error: upsertError } = await supabase
            .from('weekly_plans')
            .upsert({
                user_id: user.id,
                week_start: weekStartStr,
                plan_data: planData,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'user_id, week_start'
            });

        if (upsertError) throw upsertError;

        toast({
            title: "Success",
            description: `Planned ${recipe.recipe_name} for ${planSlot} on ${format(planDate, 'MMM d')}.`,
        });
        
        setIsPlanDialogOpen(false);

      } catch (error) {
          console.error("Planning error:", error);
          toast({
              variant: "destructive",
              title: "Planning Failed",
              description: "Could not add meal to planner. Please try again."
          });
      } finally {
          setIsPlanning(false);
      }
  };

  // UPDATED: Now passing entire recipe object to support AI Recipe Generator format
  const scaledIngredients = scaleIngredientsText(recipe, activeScale, recipeSubs);
  
  const isOwner = user?.id && recipe?.user_id && user.id === recipe.user_id;
  const baseMacros = getDisplayMacros(recipe);
  const scaledMacros = {
    calories: Math.round(baseMacros.calories * activeScale),
    protein: Math.round(baseMacros.protein * activeScale),
    fat: Math.round(baseMacros.fat * activeScale),
    carbs: Math.round(baseMacros.carbs * activeScale)
  };
  const imageUrl = getRecipeImageUrl(recipe);
  const displayName = recipe.recipe_name || recipe.name;
  const baseServings = parseFloat(recipe.servings || recipe.servings_per_batch || 1);
  const displayServings = Math.round(baseServings * activeScale * 10) / 10;

  return (
    <div className="bg-white dark:bg-[#131B2D] rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm h-full flex flex-col overflow-hidden relative">
      <div className="sticky top-0 z-20 bg-white/95 dark:bg-[#131B2D]/95 backdrop-blur px-6 py-4 border-b border-slate-200 dark:border-slate-800">
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-slate-900 dark:text-white leading-tight line-clamp-2" title={displayName}>{displayName}</h2>
            <div className="flex items-center gap-2 mt-1">
               <span className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">{recipe.default_meal_slot || recipe.meal_type || 'Anytime'}</span>
               {recipe.is_draft && <Badge variant="secondary" className="text-[9px] h-4 px-1">Draft</Badge>}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => onToggleFavorite(recipe)} className="h-9 w-9 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full">
                    <Heart className={cn("w-5 h-5 transition-colors", isFavorite ? "fill-red-500 text-red-500" : "text-slate-400")} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Favorite</TooltipContent>
              </Tooltip>
              {isOwner && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" onClick={() => onEdit && onEdit(recipe)} className="h-9 w-9 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 hover:text-cyan-600">
                      <Edit className="w-5 h-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Edit Recipe</TooltipContent>
                </Tooltip>
              )}
              
              <Dialog open={isPlanDialogOpen} onOpenChange={setIsPlanDialogOpen}>
                  <DialogTrigger asChild>
                      {scale === undefined && (
                        <Button size="sm" className="ml-2 bg-cyan-600 hover:bg-cyan-700 text-white shadow-sm gap-2 h-9 px-4 rounded-full">
                          <CalendarPlus className="w-4 h-4" />
                          <span className="text-sm font-semibold">Plan This</span>
                        </Button>
                      )}
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px] bg-white dark:bg-[#131B2D] border-slate-200 dark:border-slate-800">
                      <DialogHeader>
                          <DialogTitle>Plan Meal</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                          <div className="space-y-2">
                              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Select Date</label>
                              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                                  <PopoverTrigger asChild>
                                      <Button
                                          variant={"outline"}
                                          className={cn(
                                              "w-full justify-start text-left font-normal border-slate-200 dark:border-slate-700 bg-transparent",
                                              !planDate && "text-muted-foreground"
                                          )}
                                      >
                                          <CalendarIcon className="mr-2 h-4 w-4" />
                                          {planDate ? format(planDate, "PPP") : <span>Pick a date</span>}
                                      </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0 bg-white dark:bg-[#0B112D] border-slate-200 dark:border-slate-800" align="start">
                                      <Calendar
                                          mode="single"
                                          selected={planDate}
                                          onSelect={(date) => {
                                              if (date) {
                                                  setPlanDate(date);
                                                  setIsCalendarOpen(false);
                                              }
                                          }}
                                          initialFocus
                                      />
                                  </PopoverContent>
                              </Popover>
                          </div>
                          <div className="space-y-2">
                              <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Meal Slot</label>
                              <Select value={planSlot} onValueChange={setPlanSlot}>
                                  <SelectTrigger className="w-full bg-transparent border-slate-200 dark:border-slate-700">
                                      <SelectValue placeholder="Select a meal slot" />
                                  </SelectTrigger>
                                  <SelectContent className="bg-white dark:bg-[#0B112D] border-slate-200 dark:border-slate-800">
                                      {MEAL_SLOTS.map(slot => (
                                          <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                                      ))}
                                  </SelectContent>
                              </Select>
                          </div>
                          {activeScale !== 1 && (
                               <div className="flex items-center gap-2 p-2 rounded bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 text-xs">
                                   <Scale className="w-4 h-4" />
                                   <span>This meal will be added with <strong>{activeScale}x</strong> scaling.</span>
                               </div>
                          )}
                      </div>
                      <DialogFooter>
                          <Button variant="outline" onClick={() => setIsPlanDialogOpen(false)}>Cancel</Button>
                          <Button onClick={handleConfirmPlan} disabled={!planDate || isPlanning} className="bg-cyan-600 hover:bg-cyan-700 text-white">
                              {isPlanning ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : <Check className="w-4 h-4 mr-2" />}
                              Confirm Plan
                          </Button>
                      </DialogFooter>
                  </DialogContent>
              </Dialog>

            </TooltipProvider>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 w-full bg-white dark:bg-[#131B2D]" type="always">
        <div className="p-6 space-y-8 pb-12">
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-5 space-y-6">
                    <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 shadow-sm">
                        <img src={imageUrl} alt={displayName} className="w-full h-full object-cover" onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c"; }} />
                    </div>

                    <div className="flex flex-wrap gap-2 items-center">
                        {currentTags.map(tag => (
                            <Badge key={tag} variant="secondary" className="h-6 flex items-center gap-1.5 px-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                                {tag}
                                <button onClick={() => handleToggleTag(tag)} disabled={isTagLoading} className="hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full p-0.5"><X className="w-3 h-3" /></button>
                            </Badge>
                        ))}
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm" className="h-6 text-[10px] gap-1 px-2 border-dashed"><Plus className="w-3 h-3" /> Add Tag</Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md bg-white dark:bg-[#131B2D]">
                            <div className="grid grid-cols-2 gap-2 py-4">
                                {AVAILABLE_TAGS.map(tag => (
                                    <Button key={tag} variant={currentTags.includes(tag) ? "default" : "outline"} onClick={() => handleToggleTag(tag)} disabled={isTagLoading}>
                                        {currentTags.includes(tag) && <Check className="w-3 h-3 mr-2" />} {tag}
                                    </Button>
                                ))}
                            </div>
                            </DialogContent>
                        </Dialog>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center text-center">
                            <Users className="w-4 h-4 text-slate-400 mb-1" />
                            <span className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Servings</span>
                            <span className={cn("text-base font-bold", activeScale !== 1 ? "text-cyan-600" : "text-slate-900 dark:text-white")}>{displayServings}</span>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center text-center">
                            <Clock className="w-4 h-4 text-slate-400 mb-1" />
                            <span className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Time</span>
                            <span className="text-base font-bold text-slate-900 dark:text-white">{recipe.estimated_total_time_min || '--'}m</span>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center text-center">
                            <Flame className="w-4 h-4 text-orange-500 mb-1" />
                            <span className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Calories</span>
                            <span className={cn("text-base font-bold", activeScale !== 1 ? "text-orange-600" : "text-slate-900 dark:text-white")}>{scaledMacros.calories}</span>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-100 dark:border-slate-800 flex flex-col items-center justify-center text-center">
                            <Wheat className="w-4 h-4 text-amber-500 mb-1" />
                            <span className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Net Carbs</span>
                            <span className={cn("text-base font-bold", activeScale !== 1 ? "text-cyan-600" : "text-slate-900 dark:text-white")}>{scaledMacros.carbs}g</span>
                        </div>
                    </div>

                    <div className="flex divide-x divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                        <div className="flex-1 py-3 text-center">
                            <div className="text-[10px] text-slate-500 uppercase font-bold flex justify-center items-center gap-1 mb-0.5">
                                <Dumbbell className="w-3 h-3 text-blue-500" /> Protein
                            </div>
                            <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{scaledMacros.protein}g</div>
                        </div>
                        <div className="flex-1 py-3 text-center">
                            <div className="text-[10px] text-slate-500 uppercase font-bold flex justify-center items-center gap-1 mb-0.5">
                                <Cookie className="w-3 h-3 text-yellow-500" /> Fat
                            </div>
                            <div className="text-lg font-bold text-amber-600 dark:text-amber-400">{scaledMacros.fat}g</div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-7 flex flex-col gap-6">
                    <div className="bg-slate-50 dark:bg-slate-800/30 p-5 rounded-xl border border-slate-200 dark:border-slate-800">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400 rounded-md">
                                    <Scale className="w-4 h-4" />
                                </div>
                                <span className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wide">Adjust Portion Scale</span>
                            </div>
                            <span className="font-mono text-cyan-600 dark:text-cyan-400 font-bold text-lg">
                                {activeScale}x
                            </span>
                        </div>
                        
                        <div className="space-y-5 px-1">
                            <Slider 
                                value={[activeScale]} 
                                min={0.25} 
                                max={3} 
                                step={0.25} 
                                onValueChange={(val) => handleScaleChange(val[0])}
                                className="cursor-grab active:cursor-grabbing"
                            />
                            <div className="flex justify-between gap-2">
                                {PRESET_MULTIPLIERS.map(m => (
                                    <button 
                                    key={m} 
                                    onClick={() => handleScaleChange(m)}
                                    className={cn(
                                        "flex-1 py-1.5 text-xs rounded-md border transition-all font-semibold",
                                        activeScale === m 
                                        ? "bg-cyan-600 text-white border-cyan-600 shadow-sm" 
                                        : "bg-white dark:bg-[#131B2D] border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-cyan-500 hover:text-cyan-600"
                                    )}
                                    >
                                    {m}x
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 flex flex-col">
                         <div className="flex items-center justify-between mb-3">
                             <div className="flex items-center gap-2">
                                <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-md">
                                    <Utensils className="w-4 h-4" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Ingredients</h3>
                             </div>
                             
                             <Dialog open={showSubModal} onOpenChange={setShowSubModal}>
                                <DialogTrigger asChild>
                                   <Button variant="ghost" size="sm" className="h-7 text-xs text-slate-500 hover:text-cyan-600">
                                      <ArrowLeftRight className="w-3.5 h-3.5 mr-1" /> Substitute
                                   </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-md bg-white dark:bg-[#131B2D]">
                                   <DialogHeader>
                                      <DialogTitle>Swap Ingredient</DialogTitle>
                                   </DialogHeader>
                                   <div className="space-y-3 py-2">
                                      <div className="space-y-1">
                                         <label className="text-xs font-semibold">Original Ingredient</label>
                                         <Input placeholder="e.g. Almond Flour" value={subOriginal} onChange={e => setSubOriginal(e.target.value)} />
                                      </div>
                                      <div className="space-y-1">
                                         <label className="text-xs font-semibold">Substitute With</label>
                                         <Input placeholder="e.g. Coconut Flour" value={subNew} onChange={e => setSubNew(e.target.value)} />
                                      </div>
                                      <Button onClick={handleAddSub} className="w-full mt-2 bg-cyan-600 hover:bg-cyan-700">Add Substitution</Button>
                                      
                                      {Object.keys(recipeSubs).length > 0 && (
                                         <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                                            <h4 className="text-xs font-bold mb-2">Active Swaps</h4>
                                            {Object.entries(recipeSubs).map(([k, v]) => (
                                               <div key={k} className="flex justify-between items-center text-sm p-2 bg-slate-50 dark:bg-slate-900 rounded mb-1">
                                                  <span>{k} → <span className="font-semibold text-cyan-600">{v}</span></span>
                                                  <button onClick={() => removeSub(k)} className="text-slate-400 hover:text-red-500"><X className="w-3 h-3" /></button>
                                               </div>
                                            ))}
                                         </div>
                                      )}
                                   </div>
                                </DialogContent>
                             </Dialog>
                         </div>
                         <div 
                           className="p-5 bg-white dark:bg-[#162036] rounded-xl border border-slate-200 dark:border-slate-800 text-sm leading-7 whitespace-pre-wrap font-medium text-slate-700 dark:text-slate-300 shadow-sm"
                         >
                            {scaledIngredients || <span className="text-slate-400 italic">No ingredients listed.</span>}
                         </div>
                    </div>
                </div>
            </div>

            <Separator className="bg-slate-200 dark:bg-slate-800" />

            {/* Preparation Notes logic */}
            {recipe.prep_notes_block && (
              <div className="space-y-4">
                 <div className="flex items-center gap-2">
                     <div className="p-1.5 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-md">
                         <FileText className="w-4 h-4" />
                     </div>
                     <h3 className="text-lg font-bold text-slate-900 dark:text-white">Instructions</h3>
                 </div>
                 <div 
                   className="p-6 bg-white dark:bg-[#131B2D] rounded-xl border border-slate-200 dark:border-slate-800 text-base leading-relaxed whitespace-pre-wrap text-slate-700 dark:text-slate-300 shadow-sm"
                 >
                    {recipe.prep_notes_block}
                 </div>
              </div>
            )}

            <div className="bg-slate-50/50 dark:bg-slate-900/50 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-md">
                            <StickyNote className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Personal Notes</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Add your own tips, modifications, or reminders for this recipe.</p>
                        </div>
                    </div>
                    
                    {localNote !== note && (
                        <Button 
                            size="sm" 
                            onClick={handleSaveNote} 
                            disabled={isSavingNote}
                            className="bg-cyan-600 hover:bg-cyan-700 text-white gap-2"
                        >
                            {isSavingNote ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            Save Note
                        </Button>
                    )}
                </div>
                
                <Textarea 
                   placeholder="e.g. 'Use less salt', 'Cook for 5 more minutes', 'Great with extra garlic!'" 
                   className="min-h-[120px] text-sm resize-none bg-white dark:bg-[#0B1120] border-slate-200 dark:border-slate-800 focus:ring-cyan-500 rounded-lg shadow-sm" 
                   value={localNote} 
                   onChange={(e) => setLocalNote(e.target.value)} 
                />
                
                <div className="mt-2 text-xs text-slate-400 flex justify-between items-center">
                    <span>These notes are private and only visible to you.</span>
                    {localNote !== note && <span className="text-amber-500 font-medium">Unsaved changes</span>}
                </div>
            </div>

        </div>
      </ScrollArea>
    </div>
  );
}

export default RecipeDetails;