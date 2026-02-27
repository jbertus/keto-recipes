import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Calendar } from 'lucide-react';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { getDisplayMacros, cn } from '@/lib/utils';

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Sweets'];

// Simplified Meal Card for Preview
const PreviewMealCard = ({ meal, isHighlight }) => {
  const macros = getDisplayMacros(meal);
  const servings = meal.servings || 1;
  
  return (
    <div className={cn(
      "p-2 rounded border text-xs mb-2 transition-all",
      isHighlight 
        ? "bg-cyan-50 dark:bg-cyan-900/20 border-cyan-500 ring-1 ring-cyan-500 shadow-sm" 
        : "bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700"
    )}>
      <div className="font-medium text-slate-900 dark:text-white truncate">
        {servings > 1 && <span className="text-cyan-600 dark:text-cyan-400 font-bold mr-1">{servings}x</span>}
        {meal.name || meal.recipe_name}
      </div>
      <div className="flex gap-2 mt-1 text-[10px] text-slate-500 dark:text-slate-400">
        <span className="font-mono">{macros.calories} kcal</span>
      </div>
    </div>
  );
};

export default function PlannerPreviewModal({ open, onOpenChange, highlightId, initialDate }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [planData, setPlanData] = useState({});
  // CORRECT: Always use weekStartsOn: 0 for Sunday
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 0 }));

  useEffect(() => {
    if (initialDate) {
      setWeekStart(startOfWeek(new Date(initialDate), { weekStartsOn: 0 }));
    }
  }, [initialDate]);

  useEffect(() => {
    if (open && user) {
      fetchPlan();
    }
  }, [open, user]);

  const fetchPlan = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('weekly_plans')
        .select('plan_data')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setPlanData(data?.plan_data || {});
    } catch (err) {
      console.error("Failed to load planner preview", err);
    } finally {
      setLoading(false);
    }
  };

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl h-[80vh] flex flex-col p-0 bg-[#0B1120] border-slate-800 text-white overflow-hidden">
        <DialogHeader className="p-4 border-b border-slate-800 bg-[#131B2D]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-cyan-500/10 rounded-lg">
                <Calendar className="w-5 h-5 text-cyan-500" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">Planner Preview</DialogTitle>
                <DialogDescription className="text-slate-400 text-xs">
                  {format(weekStart, 'MMM d')} - {format(addDays(weekStart, 6), 'MMM d, yyyy')}
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden relative">
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
            </div>
          ) : (
            <ScrollArea className="h-full">
              <div className="grid grid-cols-7 min-w-[1000px] h-full divide-x divide-slate-800 bg-[#0B1120]">
                {weekDays.map(day => {
                  const dateKey = format(day, 'yyyy-MM-dd');
                  const isToday = isSameDay(new Date(), day);
                  const meals = planData[dateKey] || [];
                  // Convert object to array if needed (legacy format support)
                  const mealsArray = Array.isArray(meals) ? meals : Object.values(meals);

                  return (
                    <div key={dateKey} className={cn("flex flex-col min-h-[600px]", isToday && "bg-[#131B2D]/50")}>
                      <div className="p-2 text-center border-b border-slate-800 bg-[#162036]">
                        <div className="text-[10px] font-bold text-slate-500 uppercase">{format(day, 'EEE')}</div>
                        <div className="text-sm font-bold">{format(day, 'd')}</div>
                      </div>
                      <div className="p-2 space-y-4 flex-1">
                        {MEAL_TYPES.map(slot => {
                          const slotMeals = mealsArray.filter(m => m.slot === slot);
                          return (
                            <div key={slot} className="space-y-1">
                              <div className="text-[9px] font-bold text-slate-600 uppercase tracking-wider px-1">{slot}</div>
                              <div className="min-h-[20px]">
                                {slotMeals.map((meal, idx) => (
                                  <PreviewMealCard 
                                    key={meal.uniqueId || idx} 
                                    meal={meal} 
                                    isHighlight={meal.uniqueId === highlightId || meal.original_id === highlightId} 
                                  />
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}