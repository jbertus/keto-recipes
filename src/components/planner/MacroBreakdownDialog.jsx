import React, { useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { getDisplayMacros, cn } from '@/lib/utils';
import { Utensils, Flame, Wheat, Dumbbell, Cookie } from 'lucide-react'; // Import all macro icons

const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Sweets'];

export default function MacroBreakdownDialog({ open, onOpenChange, date, dayName, meals = [], selectedMacroType }) {
  // Calculate stats
  const stats = useMemo(() => {
    if (!meals || meals.length === 0) return { total: 0, items: [] };

    const validMeals = meals.filter(m => m && m.uniqueId);
    
    // Calculate total for the specific macro
    const total = validMeals.reduce((acc, meal) => {
       const macros = getDisplayMacros(meal);
       return acc + (macros[selectedMacroType] || 0);
    }, 0);

    // Create sorted list of contributors
    const items = validMeals.map(meal => {
      const macros = getDisplayMacros(meal);
      const value = macros[selectedMacroType] || 0;
      const percentage = total > 0 ? (value / total) * 100 : 0;
      
      return {
        ...meal,
        value,
        percentage,
        displayName: meal.recipe_name || meal.name || 'Untitled Meal'
      };
    }).sort((a, b) => b.value - a.value); // Sort highest to lowest

    return { total, items };
  }, [meals, selectedMacroType]);

  // Styling and icon based on macro type
  const getMacroDisplay = (type) => {
    switch(type) {
      case 'protein': return { 
        color: 'text-blue-500', 
        bg: 'bg-blue-500', 
        label: 'Protein', 
        unit: 'g', 
        icon: Dumbbell 
      };
      case 'fat': return { 
        color: 'text-yellow-500', 
        bg: 'bg-yellow-500', 
        label: 'Fat', 
        unit: 'g', 
        icon: Cookie 
      };
      case 'carbs': return { 
        color: 'text-amber-500', 
        bg: 'bg-amber-500', 
        label: 'Net Carbs', 
        unit: 'g', 
        icon: Wheat 
      };
      default: return { 
        color: 'text-orange-500', 
        bg: 'bg-orange-500', 
        label: 'Calories', 
        unit: 'kcal', 
        icon: Flame 
      };
    }
  };

  const { color, bg, label, unit, icon: MacroIcon } = getMacroDisplay(selectedMacroType);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-[#131B2D] border-slate-800 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
             <MacroIcon className={cn("w-6 h-6", color)} /> {/* Use the specific icon */}
             <span className={cn("uppercase font-black", color)}>{label}</span> Breakdown
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            {dayName} • {date}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <div className="flex justify-between items-end mb-6 bg-[#0B1120] p-4 rounded-xl border border-slate-800">
             <div>
               <div className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1">Total {label}</div>
               <div className={cn("text-4xl font-black leading-none", color)}>
                 {Math.round(stats.total)} <span className="text-sm text-slate-500 font-medium ml-1">{unit}</span>
               </div>
             </div>
             <div className="text-right">
                <div className="text-xs text-slate-500 font-medium">{stats.items.length} items</div>
             </div>
          </div>

          <ScrollArea className="h-[300px] pr-4">
             <div className="space-y-4">
               {stats.items.map((item, idx) => (
                 <div key={item.uniqueId || idx} className="relative group">
                    <div className="flex justify-between text-sm mb-1">
                       <span className="font-medium truncate max-w-[70%] text-slate-200 group-hover:text-cyan-400 transition-colors">
                         {item.displayName}
                       </span>
                       <span className="font-mono font-bold text-slate-300">
                         {Math.round(item.value)} {unit}
                       </span>
                    </div>
                    
                    <div className="flex items-center gap-3">
                       <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                          <div 
                            className={cn("h-full rounded-full opacity-80", bg)} 
                            style={{ width: `${item.percentage}%` }}
                          />
                       </div>
                       <div className="text-[10px] w-8 text-right text-slate-500">
                          {Math.round(item.percentage)}%
                       </div>
                    </div>
                    
                    <div className="text-[10px] text-slate-500 mt-1 pl-1 border-l-2 border-slate-800">
                       Slot: {item.slot}
                    </div>
                 </div>
               ))}
               
               {stats.items.length === 0 && (
                 <div className="text-center py-12 text-slate-500">
                    <Utensils className="w-8 h-8 mx-auto mb-2 opacity-20" />
                    <p>No meals added for this day yet.</p>
                 </div>
               )}
             </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}