import React from 'react';
import { format, addDays, isToday } from 'date-fns';
import { Plus, X, Utensils, Cookie, Sun, Moon, ChefHat, Flame, Wheat, Dumbbell, Activity, ChevronDown } from 'lucide-react';
import { cn, getDisplayMacros } from '@/lib/utils';
import { usePreferences } from '@/contexts/PreferencesContext';

const SLOTS = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Sweets'];

const SLOT_ICONS = {
  Breakfast: Sun,
  Lunch: Utensils,
  Dinner: Moon,
  Snack: Cookie,
  Sweets: ChefHat
};

const MealItem = ({ meal, onRemove, onClick }) => {
  const macros = getDisplayMacros(meal);
  
  // Keto highlighting for Planner Items
  const isHighCarb = macros.carbs > 20;
  const isLowCarb = macros.carbs <= 10;
  
  return (
    <div 
      onClick={(e) => {
        e.stopPropagation();
        onClick(meal);
      }}
      className="group/meal flex flex-col gap-1.5 p-3 rounded-lg bg-[#1e293b] border border-slate-700 hover:border-cyan-500/50 hover:bg-[#253045] cursor-pointer transition-all mb-2 last:mb-0 shadow-sm relative overflow-hidden"
    >
      <div className="flex items-start justify-between gap-2 z-10">
        <div className="text-xs font-medium text-slate-200 truncate leading-tight">
          {meal.recipe_name || meal.name || 'Untitled Meal'}
        </div>
        
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove(meal.id);
          }}
          className="opacity-0 group-hover/meal:opacity-100 p-0.5 -mr-1 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-all shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="flex items-center gap-3 text-[10px] text-slate-400 flex-wrap">
         <span className={cn(
             "flex items-center gap-0.5 font-bold", 
             isHighCarb ? "text-red-400" : isLowCarb ? "text-emerald-400" : "text-amber-400"
         )} title="Net Carbs">
             <Wheat className="w-3 h-3" /> {Math.round(macros.carbs)}g
         </span>
         
         <span className="flex items-center gap-0.5 text-blue-400 opacity-90" title="Protein">
             <Dumbbell className="w-3 h-3" /> {Math.round(macros.protein)}p
         </span>

         <span className="flex items-center gap-0.5 text-slate-500 ml-auto" title="Calories">
             <Flame className="w-3 h-3" /> {Math.round(macros.calories)}
         </span>
      </div>
    </div>
  );
};

export default function WeeklyPlanner({ 
  weekStart, 
  planData = {}, 
  onCellClick, 
  onRemoveMeal = () => {}, 
  onMealClick, 
  onMacroClick 
}) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const { preferences } = usePreferences();
  
  const targets = preferences?.dailyTargets || {
    calories: 2000,
    protein: 150,
    fat: 70,
    carbs: 50
  };

  const isMealVisible = (meal) => {
    if (!meal || !meal.slot) return false;
    const s = meal.slot.toLowerCase();
    
    return SLOTS.some(slot => {
        const target = slot.toLowerCase();
        return s === target || s === target + 's' || s === target + 'es';
    });
  };

  const getDailyTotals = (meals) => {
    const visibleMeals = meals.filter(isMealVisible);
    
    return visibleMeals.reduce((acc, meal) => {
      const m = getDisplayMacros(meal);
      return {
        calories: acc.calories + m.calories,
        protein: acc.protein + m.protein,
        carbs: acc.carbs + m.carbs,
        fat: acc.fat + m.fat
      };
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
  };

  const handleMacroInteraction = (e, dateStr, type) => {
    if (!onMacroClick) return;
    e.stopPropagation();
    onMacroClick(dateStr, type);
  };

  return (
    <div className="flex flex-col h-full bg-[#0B1120] rounded-xl border border-slate-800 overflow-hidden shadow-sm ring-1 ring-slate-800/50">
      <div className="flex-1 overflow-y-scroll custom-scrollbar">
        <div className="grid grid-cols-[100px_repeat(7,minmax(180px,1fr))] min-w-max relative">
          
          {/* Header Corner */}
          <div className="sticky top-0 left-0 z-50 p-4 border-r border-b border-slate-800 bg-[#0F1626] flex items-center justify-center shadow-sm">
             <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Day / Time</span>
          </div> 
          
          {/* Day Headers with Totals */}
          {days.map((day) => {
            const isCurrentDay = isToday(day);
            const dateStr = format(day, 'yyyy-MM-dd'); // Confirmed format usage
            const dayMeals = Array.isArray(planData[dateStr]) ? planData[dateStr] : [];
            const totals = getDailyTotals(dayMeals);

            // Dynamic Colors for Totals
            const carbColor = totals.carbs > targets.carbs 
                ? "text-red-400" 
                : totals.carbs > (targets.carbs * 0.7) 
                   ? "text-amber-400" 
                   : "text-emerald-400";

            return (
              <div 
                key={day.toISOString()} 
                className={cn(
                  "sticky top-0 z-40 py-3 px-2 text-center border-r border-b border-slate-800 last:border-r-0 flex flex-col items-center justify-start gap-3 shadow-sm min-h-[120px]",
                  isCurrentDay ? "bg-cyan-950/20 backdrop-blur-sm" : "bg-[#131B2D]"
                )}
                onClick={(e) => handleMacroInteraction(e, dateStr, 'overview')}
              >
                {/* Date Display */}
                <div className="flex flex-col items-center gap-1">
                    <span className={cn(
                      "text-[10px] font-bold uppercase tracking-widest",
                      isCurrentDay ? "text-cyan-400" : "text-slate-500"
                    )}>
                      {format(day, 'EEEE')}
                    </span>
                    <div className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all",
                      isCurrentDay 
                        ? "bg-cyan-600 text-white shadow-lg shadow-cyan-900/50" 
                        : "text-slate-400 bg-slate-800/50 border border-slate-700/50"
                    )}>
                      {format(day, 'd')}
                    </div>
                </div>

                {/* Macro Totals Display */}
                <div className="w-full flex flex-col gap-1.5 pt-2 border-t border-slate-800/50 mt-auto cursor-pointer hover:bg-slate-800/30 rounded px-1 -mx-1 transition-colors">
                    {/* Primary: Carbs */}
                    <div className="flex items-center justify-center gap-1">
                        <Wheat className={cn("w-3.5 h-3.5", carbColor)} />
                        <span className={cn("text-sm font-bold tabular-nums", carbColor)}>{Math.round(totals.carbs)}g</span>
                    </div>
                    
                    {/* Secondary: Cals & Protein */}
                    <div className="flex justify-between items-center px-1 text-[10px]">
                        <div className="flex items-center gap-1 text-slate-500" title="Calories">
                            <Flame className="w-3 h-3" />
                            <span className="font-mono">{Math.round(totals.calories)}</span>
                        </div>
                        <div className="flex items-center gap-1 text-blue-400/80" title="Protein">
                            <Dumbbell className="w-3 h-3" />
                            <span className="font-mono">{Math.round(totals.protein)}p</span>
                        </div>
                    </div>
                </div>
              </div>
            );
          })}

          {/* Time Slots */}
          {SLOTS.map((slot) => {
            const Icon = SLOT_ICONS[slot] || ChefHat;
            return (
              <React.Fragment key={slot}>
                <div className="sticky left-0 z-30 bg-[#131B2D] border-r border-b border-slate-800 p-4 flex flex-col items-start justify-center gap-1.5 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.5)]">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{slot}</span>
                  <Icon className="w-5 h-5 text-slate-600" strokeWidth={1.5} />
                </div>

                {days.map((day) => {
                   const dateStr = format(day, 'yyyy-MM-dd'); // Confirmed format usage
                   const dayMeals = Array.isArray(planData[dateStr]) ? planData[dateStr] : [];
                   
                   const slotMeals = dayMeals.filter(m => {
                      if (!m.slot) return false;
                      const s = m.slot.toLowerCase();
                      const target = slot.toLowerCase();
                      return s === target || s === target + 's';
                   });
                   
                   const isDayToday = isToday(day);

                   return (
                     <div 
                       key={`${dateStr}-${slot}`}
                       className={cn(
                         "relative border-b border-r border-slate-800 last:border-r-0 p-3 min-h-[160px] min-w-[140px] transition-all group hover:bg-[#131B2D]/50 flex flex-col",
                         isDayToday && "bg-cyan-950/5"
                       )}
                       onClick={() => onCellClick(dateStr, slot)}
                     >
                        <div className="flex flex-col gap-2 relative z-10 w-full">
                            {slotMeals.map(meal => (
                                <MealItem 
                                    key={meal.id} 
                                    meal={meal} 
                                    onRemove={(id) => onRemoveMeal(dateStr, id)}
                                    onClick={onMealClick}
                                />
                            ))}
                        </div>
                        
                        <div className="flex-1 flex items-center justify-center w-full mt-2 min-h-[40px]">
                            {slotMeals.length === 0 ? (
                                <button className="w-full h-full min-h-[80px] rounded-xl border-2 border-dashed border-slate-800 group-hover:border-slate-700 flex flex-col items-center justify-center gap-3 text-slate-600 group-hover:text-cyan-400 transition-all bg-transparent group-hover:bg-slate-800/50">
                                    <div className="p-2 rounded-full bg-slate-800/50 group-hover:bg-cyan-950/30 transition-colors">
                                        <Plus className="w-4 h-4" />
                                    </div>
                                    <span className="text-[11px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity uppercase tracking-wider">Add Meal</span>
                                </button>
                            ) : (
                                <button className="w-full py-2 rounded-lg border border-transparent hover:border-dashed hover:border-slate-700 text-slate-600 hover:text-slate-400 flex items-center justify-center gap-2 transition-all opacity-0 group-hover:opacity-100">
                                    <Plus className="w-3.5 h-3.5" />
                                    <span className="text-[10px] font-medium uppercase tracking-wide">Add Another</span>
                                </button>
                            )}
                        </div>
                     </div>
                   );
                })}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}