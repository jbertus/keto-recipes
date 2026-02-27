
import React, { useEffect } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import SortableMealCard from './SortableMealCard';
import { cn, debugLog } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Plus, MoreHorizontal } from 'lucide-react';
import { format, isToday } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { removeRecipeIngredientsFromShoppingList } from '@/lib/shoppingUtils';

const MEAL_SLOTS = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Sweets'];

// Helper to calculate macros for a list of meals
const calculateMacros = (meals) => {
  if (!Array.isArray(meals)) return { calories: 0, protein: 0, fat: 0, carbs: 0 };

  const validMeals = meals.filter(m => MEAL_SLOTS.includes(m.slot));
  const uniqueMeals = Array.from(new Map(validMeals.map(m => [m.id, m])).values());

  return uniqueMeals.reduce((acc, meal) => {
    const servings = Number(meal.scale) || 1;
    acc.calories += (Number(meal.calories_per_serving) || Number(meal.calories) || 0) * servings;
    acc.protein += (Number(meal.protein_per_serving_g) || Number(meal.protein) || 0) * servings;
    acc.fat += (Number(meal.fat_per_serving_g) || Number(meal.fat) || 0) * servings;
    acc.carbs += (Number(meal.net_carbs_per_serving_g) || Number(meal.carbs) || 0) * servings;
    return acc;
  }, { calories: 0, protein: 0, fat: 0, carbs: 0 });
};

function SlotContainer({ dayKey, slot, meals, onAddMeal, onRemoveMeal, onEditMeal, onToggleComplete, user }) {
    const slotId = `${dayKey}:${slot}`; 
    const { setNodeRef, isOver } = useDroppable({ id: slotId });
    const safeMeals = Array.isArray(meals) ? meals : [];

    // Wrapper to handle shopping list cleanup
    const handleRemove = async (dayKey, mealId) => {
        if (user && safeMeals.length > 0) {
            const mealToRemove = safeMeals.find(m => m.id === mealId);
            if (mealToRemove) {
                // Task 2 & 3: Trigger cleanup
                await removeRecipeIngredientsFromShoppingList(user.id, mealToRemove);
            }
        }
        onRemoveMeal(dayKey, mealId);
    };

    return (
        <div 
          ref={setNodeRef} 
          className={cn(
             "flex-1 min-h-[90px] flex flex-col border-b border-slate-800/50 last:border-0 transition-colors duration-200",
             isOver ? "bg-cyan-950/20 ring-2 ring-inset ring-cyan-500/20" : ""
          )}
        >
             <div 
                className="flex items-center justify-between px-3 py-2 bg-slate-900/30 group cursor-pointer hover:bg-slate-900/50 transition-colors active:bg-slate-800/70"
                onClick={() => onAddMeal(slot)}
             >
                  <span className={cn(
                    "text-[11px] font-bold uppercase tracking-wider transition-colors",
                    isOver ? "text-cyan-400" : "text-slate-500 group-hover:text-cyan-400"
                  )}>{slot}</span>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 w-6 p-0 text-slate-600 hover:text-cyan-400 hover:bg-cyan-900/20 rounded-full"
                    onClick={(e) => {
                        e.stopPropagation();
                        onAddMeal(slot);
                    }}
                  >
                     <Plus className="w-4 h-4" />
                  </Button>
             </div>
             
             <div className="p-2 space-y-2 flex-1">
                 <SortableContext 
                    id={slotId} 
                    items={safeMeals.map(m => m.id)} 
                    strategy={verticalListSortingStrategy}
                 >
                    {safeMeals.length === 0 ? (
                        <div 
                            className={cn(
                              "h-full min-h-[50px] flex items-center justify-center border border-dashed rounded-lg cursor-pointer transition-colors active:bg-slate-800/40",
                              isOver ? "border-cyan-500/30 bg-cyan-900/10" : "border-slate-800/50 hover:bg-slate-800/20"
                            )}
                            onClick={() => onAddMeal(slot)}
                        >
                             <span className={cn(
                               "text-[10px]",
                               isOver ? "text-cyan-400" : "text-slate-600"
                             )}>
                               {isOver ? "Drop here" : "No meals planned"}
                             </span>
                        </div>
                    ) : (
                        safeMeals.map((meal) => (
                            <SortableMealCard 
                                key={meal.id} 
                                meal={meal} 
                                onRemove={() => handleRemove(dayKey, meal.id)}
                                onEdit={() => onEditMeal(meal)}
                                onToggleComplete={() => onToggleComplete(dayKey, meal.id)}
                            />
                        ))
                    )}
                 </SortableContext>
             </div>
        </div>
    );
}

export default function DayColumn({ 
  day, 
  meals = [], 
  onRemoveMeal, 
  onEditMeal, 
  onAddMeal, 
  onClearDay,
  onCopyDay,
  onToggleComplete
}) {
  const { user } = useAuth();
  const dateKey = format(day, 'yyyy-MM-dd');
  const isCurrentDay = isToday(day);
  const dayMacros = calculateMacros(meals);

  const { setNodeRef } = useDroppable({
    id: dateKey,
  });

  return (
    <div 
      ref={setNodeRef}
      className={cn(
      "flex flex-col h-full min-h-[calc(100vh-180px)] md:min-h-[800px] rounded-xl border transition-all duration-300 relative snap-center", 
      isCurrentDay 
        ? "bg-[#131B2D] border-cyan-800/50 shadow-[0_0_15px_-3px_rgba(8,145,178,0.2)]" 
        : "bg-[#0f1623] border-slate-800/60 hover:border-slate-700"
    )}>
      
      {/* Sticky Header Wrapper */}
      <div className={cn(
        "sticky top-0 z-30 transition-colors duration-300 border-b shadow-md rounded-t-xl overflow-hidden", 
        isCurrentDay ? "bg-[#131B2D] border-cyan-900/30" : "bg-[#0f1623] border-slate-800/60"
      )}>
        {/* Day Name Header */}
        <div className={cn(
          "p-3 flex justify-between items-start",
          isCurrentDay && "bg-cyan-950/10"
        )}>
          <div>
            <div className="flex items-center gap-2">
              <h3 className={cn(
                "font-bold text-lg leading-none",
                isCurrentDay ? "text-cyan-400" : "text-slate-200"
              )}>
                {format(day, 'EEEE')}
              </h3>
              {isCurrentDay && (
                <Badge variant="outline" className="text-[10px] h-5 border-cyan-700 text-cyan-500 px-1.5">
                  Today
                </Badge>
              )}
            </div>
            <span className="text-xs text-slate-500 font-medium">
              {format(day, 'MMM d')}
            </span>
          </div>

          <div className="flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-500 hover:text-white rounded-full">
                  <MoreHorizontal className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800 w-40">
                <DropdownMenuItem onClick={() => onCopyDay(dateKey)} className="text-slate-300 focus:bg-slate-800 cursor-pointer py-3 md:py-1.5">
                  Copy Day
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onClearDay(dateKey)} className="text-red-400 focus:bg-red-950/20 focus:text-red-300 cursor-pointer py-3 md:py-1.5">
                  Clear All
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0 rounded-full bg-cyan-900/20 hover:bg-cyan-500 text-cyan-500 hover:text-white transition-colors"
              onClick={() => onAddMeal(null)} 
            >
              <Plus className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Daily Macro Summary Badges - Responsive Grid */}
        <div className="px-3 py-2 bg-slate-950/30 grid grid-cols-4 gap-1 sm:gap-2">
          <div className="flex flex-col items-center justify-center bg-slate-900/50 rounded p-1.5 sm:p-1" title="Total Calories">
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Cal</span>
              <span className="text-[11px] sm:text-[10px] font-bold text-white leading-none">{Math.round(dayMacros.calories)}</span>
          </div>
          <div className="flex flex-col items-center justify-center bg-slate-900/50 rounded p-1.5 sm:p-1" title="Protein">
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Pro</span>
              <span className="text-[11px] sm:text-[10px] font-bold text-blue-400 leading-none">{Math.round(dayMacros.protein)}</span>
          </div>
          <div className="flex flex-col items-center justify-center bg-slate-900/50 rounded p-1.5 sm:p-1" title="Fat">
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Fat</span>
              <span className="text-[11px] sm:text-[10px] font-bold text-yellow-400 leading-none">{Math.round(dayMacros.fat)}</span>
          </div>
          <div className="flex flex-col items-center justify-center bg-slate-900/50 rounded p-1.5 sm:p-1" title="Net Carbs">
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Carb</span>
              <span className="text-[11px] sm:text-[10px] font-bold text-emerald-400 leading-none">{Math.round(dayMacros.carbs)}</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-[#0B1120]/30 pb-2 rounded-b-xl overflow-hidden"> 
          {MEAL_SLOTS.map(slot => (
              <SlotContainer 
                 key={slot}
                 dayKey={dateKey}
                 slot={slot}
                 meals={meals.filter(m => m.slot === slot)}
                 onAddMeal={(s) => onAddMeal(s)}
                 onRemoveMeal={onRemoveMeal}
                 onEditMeal={onEditMeal}
                 onToggleComplete={onToggleComplete}
                 user={user}
              />
          ))}
      </div>
    </div>
  );
}
