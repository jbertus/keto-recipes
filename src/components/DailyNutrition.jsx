import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { X, Flame, Dumbbell, Cookie, Wheat } from 'lucide-react';

const FULL_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

const MetricCard = ({ label, value, max, unit, isMin = false, icon: Icon }) => {
  const safeMax = max || 1;
  const rawPercent = (value / safeMax) * 100;
  const percentBar = Math.min(100, rawPercent);
  const percentDisplay = Math.round(rawPercent);
  
  let isWarningState = false;

  if (isMin) {
    if (value < safeMax) {
       isWarningState = true; 
    }
  } else {
    if (value > safeMax) {
       isWarningState = true;
    }
  }
  
  let containerStyle, barColor, labelColor, valueColor, subTextColor, percentColor, iconColor;

  if (isMin) {
     if (value >= safeMax) {
        containerStyle = 'bg-emerald-950/40 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]';
        barColor = 'bg-emerald-500';
        labelColor = 'text-emerald-300';
        valueColor = 'text-emerald-50';
        subTextColor = 'text-emerald-300/70';
        percentColor = 'text-emerald-400 font-bold';
        iconColor = 'text-emerald-400';
     } else {
        containerStyle = 'bg-amber-950/40 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.2)]';
        barColor = 'bg-amber-500';
        labelColor = 'text-amber-300';
        valueColor = 'text-amber-50';
        subTextColor = 'text-amber-300/70';
        percentColor = 'text-amber-400 font-bold';
        iconColor = 'text-amber-400';
     }
  } else {
     if (value > safeMax) {
        containerStyle = 'bg-red-950/40 border-red-500/50 shadow-[0_0_15px_rgba(220,38,38,0.2)]';
        barColor = 'bg-red-500';
        labelColor = 'text-red-300';
        valueColor = 'text-red-50';
        subTextColor = 'text-red-300/70';
        percentColor = 'text-red-400 font-bold';
        iconColor = 'text-red-400';
     } else {
        containerStyle = 'bg-emerald-950/40 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.2)]';
        barColor = 'bg-emerald-500';
        labelColor = 'text-emerald-300';
        valueColor = 'text-emerald-50';
        subTextColor = 'text-emerald-300/70';
        percentColor = 'text-emerald-400 font-bold';
        iconColor = 'text-emerald-400';
     }
  }

  return (
    <div className={`${containerStyle} border rounded-xl p-4 flex flex-col justify-between relative overflow-hidden group transition-all duration-300`}>
      <div className="flex justify-between items-start mb-2">
         <div className="flex items-center gap-1.5">
             {Icon && <Icon className={`w-3.5 h-3.5 ${iconColor}`} />}
             <span className={`text-[10px] font-bold uppercase tracking-widest ${labelColor}`}>{label}</span>
         </div>
      </div>
      
      <div className="z-10 relative space-y-1">
        <div className={`text-2xl font-bold leading-none ${valueColor}`}>
          {Math.round(value)} <span className={`text-xs font-medium ${subTextColor}`}>{unit}</span>
        </div>
        <div className={`text-[10px] font-medium ${subTextColor}`}>
           <span className={percentColor}>{percentDisplay}%</span> of {max} {isMin ? 'minimum' : 'limit'}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-800/50">
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percentBar}%` }}
          className={`h-full ${barColor}`}
          transition={{ duration: 0.5 }}
        />
      </div>
    </div>
  );
};

function DailyNutrition({ weeklyPlan, dailyTargets, selectedDay, setSelectedDay, selectedCell, onClearCell }) {
  
  const isCellMode = selectedCell && selectedCell.day && selectedCell.mealType;

  const currentStats = useMemo(() => {
    const totals = { calories: 0, protein: 0, fat: 0, netCarbs: 0 };
    
    if (isCellMode) {
      const key = `${selectedCell.day}_${selectedCell.mealType}`;
      const meals = weeklyPlan[key];
      
      if (Array.isArray(meals)) {
         meals.forEach(recipe => {
            totals.calories += (Number(recipe.calories) || Number(recipe.calories_per_serving) || 0);
            totals.protein += (Number(recipe.protein) || Number(recipe.protein_per_serving_g) || 0);
            totals.fat += (Number(recipe.fat) || Number(recipe.fat_per_serving_g) || 0);
            totals.netCarbs += (Number(recipe.carbs) || Number(recipe.netCarbs) || Number(recipe.net_carbs_per_serving_g) || 0);
         });
      }
    } else {
      MEAL_TYPES.forEach(mealType => {
        const key = `${selectedDay}_${mealType}`;
        const meals = weeklyPlan[key]; 
        
        if (Array.isArray(meals)) {
           meals.forEach(recipe => {
             totals.calories += (Number(recipe.calories) || 0);
             totals.protein += (Number(recipe.protein) || 0);
             totals.fat += (Number(recipe.fat) || 0);
             totals.netCarbs += (Number(recipe.carbs) || Number(recipe.netCarbs) || 0);
           });
        } else if (meals) {
           totals.calories += (Number(meals.calories) || 0);
           totals.protein += (Number(meals.protein) || 0);
           totals.fat += (Number(meals.fat) || 0);
           totals.netCarbs += (Number(meals.carbs) || Number(meals.netCarbs) || 0);
        }
      });
    }

    return totals;
  }, [weeklyPlan, selectedDay, selectedCell, isCellMode]);

  return (
    <div className={`bg-[#131B2D] rounded-2xl p-5 border ${isCellMode ? 'border-cyan-500/30 shadow-[0_0_20px_rgba(8,145,178,0.1)]' : 'border-slate-800 shadow-[0_0_20px_rgba(0,0,0,0.2)]'} h-full flex flex-col transition-all duration-300`}>
      <div className="mb-4 flex justify-between items-start">
         <div>
            <h2 className={`text-sm font-bold tracking-wider mb-1 uppercase ${isCellMode ? 'text-cyan-400' : 'text-white'}`}>
              {isCellMode ? `${selectedCell.mealType} Nutrition` : 'Daily Nutrition'}
            </h2>
            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold truncate max-w-[200px]">
               {isCellMode ? 'Stats for selected meal slot' : 'Totals & targets for selected day'}
            </p>
         </div>
         
         {isCellMode && (
            <button 
              onClick={onClearCell}
              className="text-[10px] flex items-center gap-1 text-slate-400 hover:text-white bg-slate-800/50 px-2 py-1 rounded-full transition-colors"
            >
              <X className="w-3 h-3" />
              View Day
            </button>
         )}
      </div>

      <div className="flex flex-col gap-4 flex-grow">
        <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase mr-2">Day</span>
              <select
                value={selectedDay}
                onChange={(e) => {
                  setSelectedDay(e.target.value);
                  if (isCellMode) onClearCell(); 
                }}
                className="bg-[#0B1120] border border-slate-700 text-white text-xs rounded px-2 py-1 min-w-[120px] focus:outline-none focus:border-cyan-500 transition-opacity"
              >
                {FULL_DAYS.map(day => (
                  <option key={day} value={day}>{day}</option>
                ))}
              </select>
            </div>
            <div className="text-[9px] text-slate-500 text-right leading-tight max-w-[150px]">
                 {isCellMode ? (
                   <span className="text-cyan-500 font-medium">Viewing Single Meal Stats</span>
                 ) : (
                   <span className="text-slate-400">
                      <span className="text-emerald-400 font-bold">Protein</span> is a minimum.<br/>
                      Others are <span className="text-amber-400 font-bold">limits</span>.
                   </span>
                 )}
            </div>
        </div>

        <div className="grid grid-cols-2 gap-3 flex-grow">
          <MetricCard 
            label="Calories" 
            value={currentStats.calories} 
            max={dailyTargets.calories} 
            unit="kcal" 
            icon={Flame}
          />
          <MetricCard 
            label="Protein" 
            value={currentStats.protein} 
            max={dailyTargets.protein} 
            unit="g" 
            isMin={true}
            icon={Dumbbell}
          />
          <MetricCard 
            label="Fat" 
            value={currentStats.fat} 
            max={dailyTargets.fat} 
            unit="g" 
            icon={Cookie}
          />
          <MetricCard 
            label="Net Carbs" 
            value={currentStats.netCarbs} 
            max={dailyTargets.netCarbs} 
            unit="g" 
            icon={Wheat}
          />
        </div>
      </div>
    </div>
  );
}

export default DailyNutrition;