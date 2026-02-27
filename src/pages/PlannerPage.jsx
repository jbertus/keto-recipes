
import React, { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  MouseSensor, 
  TouchSensor,
  useSensor, 
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import { 
  arrayMove, 
  sortableKeyboardCoordinates 
} from '@dnd-kit/sortable';
import { 
  format, 
  startOfWeek, 
  addDays, 
  parseISO,
  subWeeks,
  isValid 
} from 'date-fns';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase, SUPABASE_CONFIGURED } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  Copy,
  Plus,
  Activity,
  Heart,
  RefreshCw,
  Loader2,
  Clock,
  AlertTriangle
} from 'lucide-react';
import DayColumn from '@/components/planner/DayColumn';
import MealCard from '@/components/planner/MealCard';
import AddMealDialog from '@/components/planner/AddMealDialog';
import EditRecipeDialog from '@/components/planner/EditRecipeDialog';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { validateWeekStart, getWeekStartStr, debugSupabaseError } from '@/lib/utils';

// Helper to ensure plan data is always in Nested Object format
const normalizePlanData = (data) => {
  if (!data) return {};
  const normalized = {};
  
  Object.keys(data).forEach(dateKey => {
      const entry = data[dateKey];
      if (Array.isArray(entry)) {
          normalized[dateKey] = {};
          entry.forEach(meal => {
              const s = meal.slot || 'Dinner';
              if (!normalized[dateKey][s]) normalized[dateKey][s] = [];
              normalized[dateKey][s].push(meal);
          });
      } else {
          normalized[dateKey] = entry;
      }
  });
  
  return normalized;
};

const getFlatMealsForDisplay = (dayData) => {
    if (!dayData) return [];
    if (Array.isArray(dayData)) return dayData;
    const flattened = Object.values(dayData).flat();
    return flattened;
};

export default function PlannerPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 0 }));
  const [weekDays, setWeekDays] = useState([]);

  const [planData, setPlanData] = useState({});
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const [activeMeal, setActiveMeal] = useState(null);

  const [addMealOpen, setAddMealOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [editMeal, setEditMeal] = useState(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 10 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    const days = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));
    setWeekDays(days);
  }, [weekStart]);

  const fetchWeeklyPlan = useCallback(async () => {
    if (!SUPABASE_CONFIGURED || !supabase) return;
    try {
      setLoading(true);
      const weekStartStr = getWeekStartStr(weekStart);
      
      const { data, error } = await supabase
        .from('weekly_plans')
        .select('plan_data') 
        .eq('user_id', user.id)
        .eq('week_start', weekStartStr)
        .maybeSingle();

      if (error) throw error;

      if (data && data.plan_data) {
        setPlanData(normalizePlanData(data.plan_data));
      } else {
        setPlanData({});
      }
    } catch (error) {
      console.error('[PlannerPage] Error fetching plan:', error);
      toast({ variant: "destructive", title: "Error", description: "Could not load your meal plan." });
    } finally {
      setLoading(false);
    }
  }, [user, weekStart, toast]);

  useEffect(() => {
    if (!SUPABASE_CONFIGURED) {
      setLoading(false);
      return;
    }

    if (user && weekStart) {
      fetchWeeklyPlan();
    }
  }, [user, weekStart, fetchWeeklyPlan]);

  const refreshWeeklyPlan = async () => {
    if (!SUPABASE_CONFIGURED || !supabase) return;
    try {
      setIsRefreshing(true);
      const weekStartStr = getWeekStartStr(weekStart);
      
      const { data, error } = await supabase
        .from('weekly_plans')
        .select('plan_data')
        .eq('user_id', user.id)
        .eq('week_start', weekStartStr)
        .maybeSingle();

      if (error) throw error;

      if (data && data.plan_data) {
        setPlanData(normalizePlanData(data.plan_data));
      } else {
        setPlanData({});
      }

      toast({ 
          title: "Plan Updated", 
          description: "Sync complete.",
          className: "bg-green-600 text-white border-none"
      });
      
    } catch (error) {
      toast({ variant: "destructive", title: "Refresh Failed", description: "Could not refresh meal plan." });
    } finally {
      setIsRefreshing(false);
    }
  };

  const savePlan = async (newPlanData) => {
    const weekStartStr = getWeekStartStr(weekStart);
    setPlanData(newPlanData);

    if (!SUPABASE_CONFIGURED || !supabase) return;

    try {
        const { error } = await supabase
        .from('weekly_plans')
        .upsert({ 
            user_id: user.id, 
            week_start: weekStartStr,
            plan_data: newPlanData,
            updated_at: new Date().toISOString()
        }, { onConflict: 'user_id, week_start' });

        if (error) {
            debugSupabaseError(error, "savePlan");
            toast({ variant: "destructive", title: "Save Error", description: "Failed to save changes." });
            fetchWeeklyPlan(); 
        } 
    } catch (catchError) {
        toast({ variant: "destructive", title: "Save Error", description: "Network error." });
        fetchWeeklyPlan();
    }
  };

  // --- PLANNER MUTATION FUNCTIONS (For RecipeViewDialog) ---
  const removePlannedMeal = ({ plannedMealId, day, mealType }) => {
    const newPlan = JSON.parse(JSON.stringify(planData));
    if (newPlan[day] && newPlan[day][mealType]) {
        newPlan[day][mealType] = newPlan[day][mealType].filter(m => m.id !== plannedMealId);
        savePlan(newPlan);
        return { success: true };
    }
    return { success: false, error: "Meal not found" };
  };

  const movePlannedMealDay = ({ plannedMealId, day, mealType }, toDay) => {
     if (day === toDay) return { success: false, error: "Same day" };
     
     const newPlan = JSON.parse(JSON.stringify(planData));
     // Remove from old
     if (!newPlan[day] || !newPlan[day][mealType]) return { success: false, error: "Source meal not found" };
     const mealIndex = newPlan[day][mealType].findIndex(m => m.id === plannedMealId);
     if (mealIndex === -1) return { success: false, error: "Source meal not found" };
     
     const [meal] = newPlan[day][mealType].splice(mealIndex, 1);

     // Add to new
     if (!newPlan[toDay]) newPlan[toDay] = {};
     if (!newPlan[toDay][mealType]) newPlan[toDay][mealType] = [];
     
     // Update internal date tracking if present
     meal.dateKey = toDay;
     newPlan[toDay][mealType].push(meal);

     savePlan(newPlan);
     return { success: true };
  };

  const changePlannedMealType = ({ plannedMealId, day, mealType }, newMealType) => {
    if (mealType === newMealType) return { success: false, error: "Same slot" };

    const newPlan = JSON.parse(JSON.stringify(planData));
    
    // Remove from old
    if (!newPlan[day] || !newPlan[day][mealType]) return { success: false, error: "Source meal not found" };
    const mealIndex = newPlan[day][mealType].findIndex(m => m.id === plannedMealId);
    if (mealIndex === -1) return { success: false, error: "Source meal not found" };
    
    const [meal] = newPlan[day][mealType].splice(mealIndex, 1);

    // Add to new
    if (!newPlan[day][newMealType]) newPlan[day][newMealType] = [];
    meal.slot = newMealType;
    newPlan[day][newMealType].push(meal);

    savePlan(newPlan);
    return { success: true };
  };

  const updatePlannedMealServings = ({ plannedMealId, day, mealType }, servings) => {
    const newPlan = JSON.parse(JSON.stringify(planData));
    if (!newPlan[day] || !newPlan[day][mealType]) return { success: false, error: "Meal not found" };
    
    const meal = newPlan[day][mealType].find(m => m.id === plannedMealId);
    if (!meal) return { success: false, error: "Meal not found" };

    meal.scale = parseInt(servings, 10);
    savePlan(newPlan);
    return { success: true };
  };
  // ---------------------------------------------------------

  const findMealLocation = (data, mealId) => {
      for (const dateKey in data) {
          const daySlots = data[dateKey];
          for (const slotKey in daySlots) {
              const meals = daySlots[slotKey];
              const idx = meals.findIndex(m => m.id === mealId);
              if (idx !== -1) return { dateKey, slot: slotKey, index: idx, meal: meals[idx] };
          }
      }
      return null;
  };

  const handleDuplicateLastWeek = async () => {
    if (!SUPABASE_CONFIGURED || !supabase) return;
    if (!window.confirm("Overwrite this week's plan with last week's meals?")) return;
    try {
      setLoading(true);
      const lastWeekStart = subWeeks(weekStart, 1);
      const lastWeekStartStr = getWeekStartStr(lastWeekStart);

      const { data: lastWeekData } = await supabase
        .from('weekly_plans')
        .select('plan_data')
        .eq('user_id', user.id)
        .eq('week_start', lastWeekStartStr)
        .maybeSingle();

      if (!lastWeekData?.plan_data) {
        toast({ title: "No Data", description: "No meal plan found for the previous week." });
        setLoading(false);
        return;
      }
      
      const normalizedLastWeek = normalizePlanData(lastWeekData.plan_data);
      const newPlanData = {};

      Object.keys(normalizedLastWeek).forEach(oldDateKey => {
         const oldDate = parseISO(oldDateKey);
         if (!isValid(oldDate)) return;

         const dayIndex = oldDate.getDay(); 
         const newDate = addDays(weekStart, dayIndex);
         const newDateKey = format(newDate, 'yyyy-MM-dd');
         
         if (!newPlanData[newDateKey]) newPlanData[newDateKey] = {};

         const daySlots = normalizedLastWeek[oldDateKey];
         Object.keys(daySlots).forEach(slot => {
             newPlanData[newDateKey][slot] = daySlots[slot].map(m => ({
                 ...m,
                 id: crypto.randomUUID(), 
                 is_completed: false
             }));
         });
      });

      await savePlan(newPlanData);
      toast({ title: "Success", description: "Plan duplicated." });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to duplicate week." });
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (event) => {
    const { active } = event;
    setActiveId(active.id);
    const location = findMealLocation(planData, active.id);
    if (location) setActiveMeal(location.meal);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveMeal(null);

    if (!over) return;
    const sourceLoc = findMealLocation(planData, active.id);
    if (!sourceLoc) return;

    const { dateKey: sourceDate, slot: sourceSlot, index: sourceIndex, meal: movedMeal } = sourceLoc;
    let targetDate = null, targetSlot = null, targetIndex = -1;
    const overIdStr = String(over.id);

    if (overIdStr.includes(':')) {
        const parts = overIdStr.split(':');
        if (parts[0].match(/^\d{4}-\d{2}-\d{2}$/)) {
            targetDate = parts[0];
            targetSlot = parts.slice(1).join(':'); 
            targetIndex = (planData[targetDate]?.[targetSlot]?.length) || 0;
        }
    } else {
        const targetLoc = findMealLocation(planData, over.id);
        if (targetLoc) {
            targetDate = targetLoc.dateKey;
            targetSlot = targetLoc.slot;
            targetIndex = targetLoc.index;
        }
    }

    if (!targetDate || !targetSlot) return;

    const newPlanData = JSON.parse(JSON.stringify(planData));
    if (!newPlanData[targetDate]) newPlanData[targetDate] = {};
    if (!newPlanData[targetDate][targetSlot]) newPlanData[targetDate][targetSlot] = [];
    if (!newPlanData[sourceDate]) newPlanData[sourceDate] = {}; 
    if (!newPlanData[sourceDate][sourceSlot]) newPlanData[sourceDate][sourceSlot] = [];

    if (sourceDate === targetDate && sourceSlot === targetSlot) {
        newPlanData[sourceDate][sourceSlot] = arrayMove(newPlanData[sourceDate][sourceSlot], sourceIndex, targetIndex);
    } else {
        newPlanData[sourceDate][sourceSlot].splice(sourceIndex, 1);
        const updatedMeal = { ...movedMeal, slot: targetSlot };
        newPlanData[targetDate][targetSlot].splice(targetIndex, 0, updatedMeal);
    }
    savePlan(newPlanData);
  };

  const handleAddMealClick = (dateKey, slot = null) => {
    setSelectedDay(dateKey);
    setSelectedSlot(slot);
    setAddMealOpen(true);
  };

  const handleGlobalAddMeal = () => {
    const todayKey = format(new Date(), 'yyyy-MM-dd');
    setSelectedDay(todayKey);
    setSelectedSlot(null);
    setAddMealOpen(true);
  };

  const handleRemoveMeal = (mealId) => {
    const loc = findMealLocation(planData, mealId);
    if (!loc) return;
    const newPlanData = JSON.parse(JSON.stringify(planData));
    newPlanData[loc.dateKey][loc.slot].splice(loc.index, 1);
    savePlan(newPlanData);
    toast({ title: "Meal Removed" });
  };

  const handleEditMeal = (meal) => {
    const loc = findMealLocation(planData, meal.id);
    // Enrich with context for the dialog
    const mealWithContext = loc ? { ...meal, dateKey: loc.dateKey, slot: loc.slot } : meal;
    setEditMeal(mealWithContext);
    setEditDialogOpen(true);
  };

  const handleToggleComplete = (dateKey, mealId) => {
     const loc = findMealLocation(planData, mealId);
     if (!loc) return;
     const newPlanData = JSON.parse(JSON.stringify(planData));
     const meal = newPlanData[loc.dateKey][loc.slot][loc.index];
     meal.is_completed = !meal.is_completed;
     savePlan(newPlanData);
  };

  const handleClearDay = async (dateKey) => {
     if(!window.confirm("Clear all meals for this day?")) return;
     const newPlanData = { ...planData, [dateKey]: {} }; 
     savePlan(newPlanData);
     toast({ title: "Day Cleared" });
  };

  const handleCopyDay = () => {
     toast({ title: "Feature Coming Soon" });
  };

  const navigateWeek = (direction) => {
    setWeekStart(prev => addDays(prev, direction * 7));
  };

  const weekEnd = addDays(weekStart, 6);
  const weekRangeLabel = `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d')}`;

  if (!SUPABASE_CONFIGURED) {
    return (
       <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] bg-[#0B1120] p-6 text-center">
         <AlertTriangle className="h-16 w-16 text-slate-700 mb-4" />
         <h1 className="text-2xl font-bold text-white mb-2">Planner Offline</h1>
         <p className="text-slate-500 max-w-md">The meal planner requires a database connection to load and save your schedule.</p>
       </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-4rem)] bg-[#0B1120] text-slate-200 w-full overflow-hidden animate-in fade-in duration-500">
      <Helmet><title>Planner | Keto Contractor</title></Helmet>

      <div className="shrink-0 p-3 md:p-6 pb-2 z-20 bg-[#0B1120] flex flex-col gap-3 md:gap-6 max-w-[2000px] w-full mx-auto">
          <div className="flex flex-col gap-3 bg-[#131B2D] p-3 rounded-xl border border-slate-800 shadow-sm">
              <div className="w-full overflow-x-auto md:overflow-visible pb-1 md:pb-0 scrollbar-hide">
                 <div className="flex items-center gap-3 md:justify-between min-w-max md:min-w-0 pr-4 md:pr-0">
                    <div className="flex items-center bg-[#0B1120] rounded-lg border border-slate-800 p-0.5 snap-start shrink-0">
                        <Button variant="ghost" size="icon" onClick={() => navigateWeek(-1)} className="hover:text-white h-9 w-9 shrink-0 rounded-md">
                            <ChevronLeft className="w-5 h-5" />
                        </Button>
                        <div className="flex items-center justify-center px-2 min-w-[120px] md:min-w-[140px]">
                            <span className="text-sm md:text-base font-bold text-white whitespace-nowrap">{weekRangeLabel}</span>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => navigateWeek(1)} className="hover:text-white h-9 w-9 shrink-0 rounded-md">
                            <ChevronRight className="w-5 h-5" />
                        </Button>
                    </div>

                    <div className="hidden md:flex flex-1" />

                    <div className="flex items-center gap-2 snap-start shrink-0">
                        <Button variant="ghost" size="icon" onClick={fetchWeeklyPlan} disabled={loading || isRefreshing} className="text-slate-400 hover:text-white h-10 w-10 shrink-0 border border-slate-800 bg-[#0B1120] rounded-lg">
                            {(isRefreshing || loading) ? <Loader2 className="w-5 h-5 animate-spin text-cyan-400" /> : <RefreshCw className="w-5 h-5" />}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={handleDuplicateLastWeek} className="text-slate-400 hover:text-white h-10 w-10 shrink-0 border border-slate-800 bg-[#0B1120] rounded-lg" disabled={loading}>
                            <Copy className="w-5 h-5" />
                        </Button>
                        <Button onClick={handleGlobalAddMeal} className="bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-900/20 h-10 px-4 md:px-6 shrink-0 rounded-lg whitespace-nowrap">
                            <Plus className="w-5 h-5 mr-2" />
                            <span className="font-medium">Add Meal</span>
                        </Button>
                    </div>
                 </div>
              </div>

              <ScrollArea className="w-full whitespace-nowrap border-t border-slate-800/50 pt-2 md:border-t-0 md:pt-0" orientation="horizontal">
                  <div className="flex w-max space-x-2 pb-2 md:pb-0 md:justify-end md:w-full">
                        <Link to="/nutrition-dashboard"><Button variant="outline" className="border-slate-800 bg-[#0B1120] text-slate-300 hover:text-cyan-400 h-10 px-4 rounded-lg flex items-center gap-2"><Activity className="w-4 h-4" /><span>Dashboard</span></Button></Link>
                        <Link to="/meal-prep"><Button variant="outline" className="border-slate-800 bg-[#0B1120] text-slate-300 hover:text-cyan-400 h-10 px-4 rounded-lg flex items-center gap-2"><Clock className="w-4 h-4" /><span>Timeline</span></Button></Link>
                        <Link to="/favorites"><Button variant="outline" className="border-slate-800 bg-[#0B1120] text-slate-300 hover:text-red-400 h-10 px-4 rounded-lg flex items-center gap-2"><Heart className="w-4 h-4" /><span>Favorites</span></Button></Link>
                        <Link to="/ai-recipe-generator"><Button variant="outline" className="bg-cyan-900/20 hover:bg-cyan-900/30 text-cyan-400 border-cyan-800/50 h-10 px-4 rounded-lg flex items-center gap-2"><Sparkles className="w-4 h-4" /><span className="hidden sm:inline">AI Engine</span></Button></Link>
                  </div>
                  <ScrollBar orientation="horizontal" className="h-2.5" />
              </ScrollArea>
          </div>
      </div>
      
      <div className="flex-1 w-full max-w-[2000px] mx-auto overflow-hidden relative">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
              <div className="h-full w-full overflow-y-auto overflow-x-auto custom-scrollbar p-2 md:p-6 pt-0">
                  <div className="flex gap-3 md:gap-4 min-w-max pb-20 md:pb-6">
                      {weekDays.map((day) => {
                          const dateKey = format(day, 'yyyy-MM-dd');
                          return (
                              <div key={dateKey} className="w-[88vw] sm:w-[320px] md:w-[300px] flex-shrink-0 snap-center first:ml-2 last:mr-2">
                                  <DayColumn 
                                      day={day}
                                      meals={getFlatMealsForDisplay(planData[dateKey])}
                                      onAddMeal={(slot) => handleAddMealClick(dateKey, slot)}
                                      onRemoveMeal={(dayKey, mealId) => handleRemoveMeal(mealId)}
                                      onEditMeal={handleEditMeal}
                                      onClearDay={handleClearDay}
                                      onCopyDay={handleCopyDay}
                                      onToggleComplete={handleToggleComplete}
                                  />
                              </div>
                          );
                      })}
                  </div>
              </div>
              {createPortal(
                  <DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.4' } } }) }} zIndex={100}>
                      {activeMeal ? <div className="w-[300px]"><MealCard recipe={activeMeal} className="shadow-2xl border-cyan-500/50 scale-105 opacity-90" /></div> : null}
                  </DragOverlay>,
                  document.body
              )}
          </DndContext>
      </div>

      <AddMealDialog 
         open={addMealOpen} 
         onOpenChange={setAddMealOpen}
         initialDate={selectedDay}
         initialSlot={selectedSlot}
         initialMealType={selectedSlot}
         onMealAdded={refreshWeeklyPlan}
      />

      {editMeal && (
         <EditRecipeDialog 
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            recipe={editMeal}
            weekStart={weekStart}
            onRemove={removePlannedMeal}
            onMoveDay={movePlannedMealDay}
            onChangeMealType={changePlannedMealType}
            onChangeServings={updatePlannedMealServings}
         />
      )}
    </div>
  );
}
