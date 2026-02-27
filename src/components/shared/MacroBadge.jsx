import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Reusable component for displaying macro nutrients.
 * Replaces repetitive badges in RecipeCard, RecipeDetails, MealCard, etc.
 */
export function MacroBadge({ label, value, unit = 'g', color = 'slate', className }) {
  // Updated colors to match Keto prominence logic
  const colorStyles = {
    red: 'bg-red-500/10 text-red-400 border-red-500/20 font-bold',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20 font-bold',
    green: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-bold',
    slate: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  };

  return (
    <div className={cn(
      "flex flex-col items-center justify-center p-2 rounded-lg border",
      colorStyles[color] || colorStyles.slate,
      className
    )}>
      <span className="text-xs font-medium opacity-70 uppercase tracking-wider">{label}</span>
      <span className="font-bold text-sm">
        {value}{unit}
      </span>
    </div>
  );
}

export function MacroRow({ calories, protein, carbs, fat, className }) {
  // Auto-styling based on Keto values for carbs
  let carbColor = 'amber';
  if (carbs <= 12) carbColor = 'green';
  else if (carbs > 30) carbColor = 'red';

  return (
    <div className={cn("grid grid-cols-4 gap-2", className)}>
       {/* Carbs first for prominence */}
       <MacroBadge label="Carb" value={carbs} color={carbColor} />
       <MacroBadge label="Prot" value={protein} color="blue" />
       {/* Fat neutral */}
       <MacroBadge label="Fat" value={fat} color="slate" />
       <MacroBadge label="Cal" value={calories} unit="" color="slate" />
    </div>
  );
}