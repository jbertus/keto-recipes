import React from 'react';
import { X } from 'lucide-react';

const DAYS = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
const FULL_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];

function WeeklyPlannerMenu({ weeklyPlan, selectedCell, onCellClick, onRemoveRecipe }) {
  
  const getCellContent = (dayFull, mealType) => {
    const key = `${dayFull}_${mealType}`;
    return weeklyPlan[key];
  };

  const getDropTargetText = () => {
    if (!selectedCell) return "Select a cell";
    return `${selectedCell.day} ${selectedCell.mealType}`;
  };

  return (
    <div className="bg-[#131B2D] rounded-2xl p-5 border border-slate-800 shadow-[0_0_20px_rgba(0,0,0,0.2)] h-full flex flex-col relative overflow-hidden group">
      <div className="absolute inset-0 border-2 border-transparent group-hover:border-cyan-900/20 rounded-2xl pointer-events-none transition-colors duration-500"></div>
      
      <div className="mb-4">
        <h2 className="text-sm font-bold text-white tracking-wider mb-1 uppercase">Weekly Planner Menu</h2>
        <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Click a cell to set your target, then click a recipe to drop it in.</p>
      </div>
      
      <div className="flex-grow flex flex-col min-h-0">
        <div className="w-full border border-slate-700/50 rounded-lg overflow-hidden bg-[#0B1120] flex flex-col h-full">
          {/* Header Row */}
          <div className="grid grid-cols-8 bg-[#1E293B]/50 border-b border-slate-700/50 h-10 flex-shrink-0">
            <div className="px-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-r border-slate-700/50 flex items-center justify-center bg-[#162036]">Meal</div>
            {DAYS.map((day, i) => (
              <div key={day} className={`px-1 text-[10px] font-bold text-slate-300 uppercase tracking-wider flex items-center justify-center ${i < 6 ? 'border-r border-slate-700/50' : ''}`}>
                {day}
              </div>
            ))}
          </div>

          {/* Rows */}
          <div className="flex-grow grid grid-rows-4 divide-y divide-slate-700/50">
            {MEAL_TYPES.map((mealType) => (
              <div key={mealType} className="grid grid-cols-8 h-full">
                {/* Row Header */}
                <div className="bg-[#162036] text-[10px] font-bold text-slate-400 border-r border-slate-700/50 flex items-center justify-center uppercase tracking-wider">
                  {mealType}
                </div>
                
                {/* Cells */}
                {FULL_DAYS.map((dayFull) => {
                  const recipe = getCellContent(dayFull, mealType);
                  const isSelected = selectedCell?.day === dayFull && selectedCell?.mealType === mealType;
                  
                  return (
                    <div
                      key={`${dayFull}-${mealType}`}
                      onClick={() => onCellClick(dayFull, mealType)}
                      className={`
                        relative border-r border-slate-700/50 last:border-r-0 cursor-pointer transition-all group/cell
                        flex flex-col items-center justify-center text-center p-1
                        ${isSelected 
                          ? 'bg-cyan-900/20 shadow-[inset_0_0_15px_rgba(6,182,212,0.1)] ring-1 ring-inset ring-cyan-500/50 z-10' 
                          : 'hover:bg-slate-800/50'
                        }
                      `}
                    >
                      {recipe ? (
                        <>
                          <span className="text-[10px] leading-3 font-medium text-cyan-100 line-clamp-3 w-full px-1">
                            {recipe.name}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onRemoveRecipe(dayFull, mealType);
                            }}
                            className="absolute top-0.5 right-0.5 opacity-0 group-hover/cell:opacity-100 p-0.5 rounded bg-slate-800 text-slate-400 hover:text-red-400 transition-all"
                          >
                            <X className="h-2.5 w-2.5" />
                          </button>
                        </>
                      ) : (
                        <span className="text-slate-700 font-light text-sm">—</span>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="mt-3 text-[10px] text-slate-500">
        Current drop target: <span className="text-cyan-400 font-semibold">{getDropTargetText()}</span>
      </div>
    </div>
  );
}

export default WeeklyPlannerMenu;