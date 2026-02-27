
import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Flame, Cookie, Wheat, Activity, Dumbbell } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { format, startOfDay } from 'date-fns';

const MacroProgressBar = ({ label, value, target, unit, type, icon: Icon }) => {
  let statusColor = 'bg-slate-500';
  const safeTarget = target > 0 ? target : 1;
  let percentage = Math.min(100, Math.max(0, (value / safeTarget) * 100));
  let message = '';
  
  if (type === 'min') { // Protein goal
    if (percentage >= 100) {
      statusColor = 'bg-emerald-500';
      message = 'Met!';
    } else if (percentage >= 80) {
      statusColor = 'bg-yellow-500';
      message = 'Close';
    } else {
      statusColor = 'bg-red-500';
      message = 'Low';
    }
  } else { // Max limit (Carbs/Fat/Cals)
     if (percentage > 100) {
       statusColor = 'bg-red-500';
       message = 'Over';
     } else if (percentage >= 85) {
       statusColor = 'bg-yellow-500';
       message = 'Careful';
     } else {
       statusColor = 'bg-emerald-500';
       message = 'Good';
     }
  }

  // Determine icon color based on macro type
  let iconColorClass = "text-slate-400";
  if (label === "Calories") iconColorClass = "text-orange-400";
  else if (label === "Protein") iconColorClass = "text-blue-400";
  else if (label === "Net Carbs") iconColorClass = "text-amber-400";
  else if (label === "Fats") iconColorClass = "text-yellow-400";


  return (
    <div className="space-y-1.5 sm:space-y-2">
      <div className="flex justify-between items-end text-xs">
         <div className="flex items-center gap-1.5 sm:gap-2 font-medium text-slate-300">
            <div className="p-1 rounded bg-slate-800/50">
                <Icon className={cn("w-3 h-3 sm:w-3.5 sm:h-3.5", iconColorClass)} />
            </div>
            <span className="hidden sm:inline">{label}</span>
            <span className="sm:hidden">{label.substring(0, 3)}</span>
         </div>
         <div className="flex items-center gap-1.5 sm:gap-2">
            <span className={cn("text-[9px] sm:text-[10px] px-1.5 py-0.5 rounded font-semibold", 
                 statusColor === 'bg-emerald-500' ? 'bg-emerald-500/10 text-emerald-400' : 
                 statusColor === 'bg-red-500' ? 'bg-red-500/10 text-red-400' : 'bg-yellow-500/10 text-yellow-400'
            )}>
              {message}
            </span>
            <span className="font-bold text-white tabular-nums text-[10px] sm:text-xs">
               {Math.round(value)}<span className="text-slate-500 font-normal opacity-70">/{target}</span>
            </span>
         </div>
      </div>
      <Progress value={percentage} indicatorClassName={statusColor} className="h-1.5 sm:h-2 bg-slate-900 border border-slate-800" />
    </div>
  )
}

export default function MacroGoalsDashboard({ planData = {}, weekStart }) {
  // Determine which day to show. Default to Today.
  const today = startOfDay(new Date());
  const dateKey = format(today, 'yyyy-MM-dd');
  const dateLabel = format(today, 'MMM d, yyyy');
  
  // Calculate totals - moved meals inside useMemo to prevent dependency warning
  const totals = useMemo(() => {
    const meals = planData[dateKey] || [];
    return meals.reduce((acc, meal) => {
      const scale = meal.scale || 1;
      acc.calories += (Number(meal.calories_per_serving) || 0) * scale;
      acc.protein += (Number(meal.protein_per_serving_g) || 0) * scale;
      acc.fat += (Number(meal.fat_per_serving_g) || 0) * scale;
      acc.carbs += (Number(meal.net_carbs_per_serving_g) || 0) * scale;
      return acc;
    }, { calories: 0, protein: 0, fat: 0, carbs: 0 });
  }, [planData, dateKey]);
  
  const targets = {
    calories: 2000,
    protein: 150,
    fat: 70,
    carbs: 50
  };

  const proteinMet = totals.protein >= targets.protein;
  const carbsGood = totals.carbs <= targets.carbs;
  const calsGood = totals.calories <= targets.calories + 100; // Allow 100 cal buffer
  
  const isPerfectDay = proteinMet && carbsGood && calsGood;
  const hasMeals = totals.calories > 0;

  return (
     <div className="space-y-4 h-full flex flex-col">
        {/* Header Section */}
        <div className="bg-[#131b2e] rounded-xl border border-slate-700/50 p-4 sm:p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Activity className="w-4 h-4 text-cyan-500" />
                    Daily Goals
                </h3>
                <span className="text-xs text-cyan-400 font-medium bg-cyan-950/30 px-2 py-0.5 rounded border border-cyan-500/20">
                    {dateLabel}
                </span>
            </div>

            <AnimatePresence mode="wait">
                {hasMeals && isPerfectDay ? (
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0, y: 10 }} 
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mb-5 bg-gradient-to-r from-emerald-950/50 to-emerald-900/20 border border-emerald-500/30 rounded-lg p-3 flex items-center gap-3 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                >
                    <div className="bg-emerald-500/20 p-2 rounded-full ring-1 ring-emerald-500/40">
                        <Trophy className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div>
                        <div className="text-sm font-bold text-emerald-400">Perfect Macro Day! 🎉</div>
                        <div className="text-[11px] text-emerald-300/70 leading-tight">You are crushing your nutrition goals.</div>
                    </div>
                </motion.div>
                ) : hasMeals && (
                   <div className="mb-2"></div> 
                )}
            </AnimatePresence>

            <div className="grid grid-cols-2 lg:grid-cols-1 gap-4 sm:gap-5">
                <MacroProgressBar 
                    label="Calories" 
                    value={totals.calories} 
                    target={targets.calories} 
                    unit="kcal" 
                    type="max"
                    icon={Flame}
                />
                <MacroProgressBar 
                    label="Protein" 
                    value={totals.protein} 
                    target={targets.protein} 
                    unit="g" 
                    type="min"
                    icon={Dumbbell}
                />
                <MacroProgressBar 
                    label="Net Carbs" 
                    value={totals.carbs} 
                    target={targets.carbs} 
                    unit="g" 
                    type="max"
                    icon={Wheat}
                />
                <MacroProgressBar 
                    label="Fats" 
                    value={totals.fat} 
                    target={targets.fat} 
                    unit="g" 
                    type="max"
                    icon={Cookie}
                />
            </div>
        </div>

        {/* Mini Stats / Insights */}
        <div className="grid grid-cols-2 gap-3">
             <div className="bg-[#131b2e] p-3 rounded-lg border border-slate-800 text-center">
                 <div className="text-[10px] uppercase text-slate-500 font-bold mb-1">Protein Ratio</div>
                 <div className="text-xl font-bold text-slate-200">
                     {totals.calories > 0 ? Math.round((totals.protein * 4 / totals.calories) * 100) : 0}%
                 </div>
             </div>
             <div className="bg-[#131b2e] p-3 rounded-lg border border-slate-800 text-center">
                 <div className="text-[10px] uppercase text-slate-500 font-bold mb-1">Keto Grade</div>
                 <div className={`text-xl font-bold ${carbsGood ? 'text-emerald-400' : 'text-red-400'}`}>
                     {carbsGood ? 'A' : 'C-'}
                 </div>
             </div>
        </div>
     </div>
  )
}
