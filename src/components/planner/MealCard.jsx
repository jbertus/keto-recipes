
import React, { useEffect } from 'react';
import { Clock } from 'lucide-react';
import { cn, getDisplayMacros, debugLog } from '@/lib/utils';
import { getRecipeImageUrl } from '@/lib/imageUtils';
import { Badge } from '@/components/ui/badge';

export default function MealCard({ 
  recipe, 
  onClick, 
  actionButton, 
  className,
  showAddButton = false,
  onAdd
}) {
  if (!recipe) return null;

  const macros = getDisplayMacros(recipe);
  const imageUrl = getRecipeImageUrl(recipe);
  const displayName = recipe.recipe_name || recipe.name || 'Untitled Meal';
  
  const getCarbStyle = (g) => {
    if (g <= 12) return "text-emerald-400 bg-emerald-950/40 border-emerald-500/30 font-bold shadow-[0_0_10px_-4px_rgba(52,211,153,0.3)]";
    if (g <= 30) return "text-amber-400 bg-amber-950/40 border-amber-500/30 font-bold";
    return "text-red-400 bg-red-950/40 border-red-500/30 font-bold";
  };

  const getFatStyle = () => "text-slate-400 bg-slate-800/50 border-slate-700/50";
  const getProteinStyle = () => "text-blue-400 bg-blue-950/30 border-blue-500/20";
  const getCalStyle = () => "text-slate-500 bg-slate-900/30 border-slate-800/50";

  return (
    <div 
      className={cn(
        "group relative flex flex-col rounded-xl bg-[#1e293b] border border-slate-800 overflow-hidden hover:border-cyan-500/30 hover:shadow-lg hover:shadow-cyan-900/10 transition-all cursor-pointer select-none touch-manipulation",
        className
      )}
      onClick={onClick}
    >
      <div className="aspect-[16/10] w-full overflow-hidden relative">
        <img 
          src={imageUrl} 
          alt={displayName} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          draggable="false"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1e293b] via-transparent to-transparent opacity-60" />
        <div className="absolute top-2 right-2 flex gap-1">
           {recipe.is_high_protein_25g_plus && (
             <Badge className="bg-blue-600/90 text-white text-[10px] px-1.5 h-5 border-0 backdrop-blur-sm">High Prot</Badge>
           )}
        </div>
      </div>

      <div className="p-3 flex flex-col flex-1 gap-2 sm:gap-3">
        <div className="space-y-1">
          <h3 className="font-semibold text-slate-100 text-sm leading-tight line-clamp-2 min-h-[2.5em]" title={displayName}>
            {displayName}
          </h3>
          <div className="flex items-center justify-between text-xs text-slate-500">
             <div className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /><span>{recipe.estimated_total_time_min || 15}m</span></div>
          </div>
        </div>

        {/* Macros Grid */}
        <div className="grid grid-cols-4 gap-1 mt-auto">
           {/* CARBS */}
           <div className={cn("flex flex-col items-center justify-center p-1 rounded-md border", getCarbStyle(macros.carbs))}>
              <span className="text-[10px] font-bold">{Math.round(macros.carbs)}g</span>
              <span className="text-[8px] uppercase opacity-70">Carb</span>
           </div>
           
           {/* CALS */}
           <div className={cn("flex flex-col items-center justify-center p-1 rounded-md border", getCalStyle())}>
              <span className="text-[10px] font-bold">{Math.round(macros.calories)}</span>
              <span className="text-[8px] uppercase opacity-70">Cal</span>
           </div>

           {/* PROTEIN */}
           <div className={cn("flex flex-col items-center justify-center p-1 rounded-md border", getProteinStyle())}>
              <span className="text-[10px] font-bold">{Math.round(macros.protein)}g</span>
              <span className="text-[8px] uppercase opacity-70">Prot</span>
           </div>

           {/* FAT */}
           <div className={cn("flex flex-col items-center justify-center p-1 rounded-md border", getFatStyle())}>
              <span className="text-[10px] font-bold">{Math.round(macros.fat)}g</span>
              <span className="text-[8px] uppercase opacity-70">Fat</span>
           </div>
        </div>
      </div>

      {actionButton && <div className="absolute top-2 left-2 z-10">{actionButton}</div>}
      
      {showAddButton && (
         <button 
           onClick={(e) => { e.stopPropagation(); onAdd && onAdd(recipe); }}
           className="absolute bottom-3 right-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-full p-3 shadow-lg transition-transform active:scale-95 z-20 touch-manipulation"
           aria-label="Add to meal plan"
         >
           <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
         </button>
      )}
    </div>
  );
}
