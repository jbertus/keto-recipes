import React, { useState, useEffect } from 'react';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { RefreshCw, ChefHat, Save } from 'lucide-react';

export default function RecipeCustomizer({ recipe, onSave, onCancel }) {
  const [servings, setServings] = useState(recipe?.servings_per_batch || 1);
  const [baseMacros, setBaseMacros] = useState({
    calories: recipe?.calories_per_serving || 0,
    protein: recipe?.protein_per_serving_g || 0,
    fat: recipe?.fat_per_serving_g || 0,
    carbs: recipe?.net_carbs_per_serving_g || 0
  });

  // Calculate live macros based on serving multiplier
  // NOTE: This assumes user is eating MORE of the same ratio.
  // Real "reformulation" would require scaling ingredients individually, which is complex.
  // For this phase, we scale the serving size relative to the original "1 serving".
  
  // Actually, usually users want to scale "Servings per batch" (Meal prep) OR "Portion Size"
  // Let's implement "Portion Multiplier"
  const [multiplier, setMultiplier] = useState(1);

  const currentMacros = {
    calories: Math.round(baseMacros.calories * multiplier),
    protein: Math.round(baseMacros.protein * multiplier),
    fat: Math.round(baseMacros.fat * multiplier),
    carbs: Math.round(baseMacros.carbs * multiplier)
  };

  const handleSave = () => {
    // Return the customized instance
    onSave({
      ...recipe,
      custom_multiplier: multiplier,
      calories_per_serving: currentMacros.calories,
      protein_per_serving_g: currentMacros.protein,
      fat_per_serving_g: currentMacros.fat,
      net_carbs_per_serving_g: currentMacros.carbs
    });
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-2">
      <div className="flex items-start justify-between">
         <div>
            <h3 className="font-bold text-lg text-white">Customize Portion</h3>
            <p className="text-sm text-slate-400">Adjust serving size to fit your daily goals.</p>
         </div>
         <Badge variant="outline" className="border-cyan-500 text-cyan-400">{multiplier}x Serving</Badge>
      </div>

      <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800 space-y-4">
         <div className="flex justify-between items-center">
            <Label className="text-white">Portion Size</Label>
            <span className="text-sm font-mono text-cyan-400 font-bold">{(multiplier * 100).toFixed(0)}%</span>
         </div>
         <Slider 
            value={[multiplier]} 
            onValueChange={(v) => setMultiplier(v[0])} 
            min={0.5} 
            max={3.0} 
            step={0.1}
            className="py-2"
         />
         <div className="flex justify-between text-xs text-slate-500">
            <span>Half (0.5x)</span>
            <span>Standard (1.0x)</span>
            <span>Triple (3.0x)</span>
         </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
         <div className="bg-slate-950 p-3 rounded border border-slate-800 text-center">
            <div className="text-xs text-slate-500 uppercase">Cal</div>
            <div className="font-bold text-white text-lg">{currentMacros.calories}</div>
            {multiplier !== 1 && <div className="text-[10px] text-slate-500 line-through">{baseMacros.calories}</div>}
         </div>
         <div className="bg-slate-950 p-3 rounded border border-slate-800 text-center">
            <div className="text-xs text-slate-500 uppercase">Prot</div>
            <div className="font-bold text-cyan-400 text-lg">{currentMacros.protein}g</div>
         </div>
         <div className="bg-slate-950 p-3 rounded border border-slate-800 text-center">
            <div className="text-xs text-slate-500 uppercase">Fat</div>
            <div className="font-bold text-yellow-400 text-lg">{currentMacros.fat}g</div>
         </div>
         <div className="bg-slate-950 p-3 rounded border border-slate-800 text-center">
            <div className="text-xs text-slate-500 uppercase">Carb</div>
            <div className="font-bold text-emerald-400 text-lg">{currentMacros.carbs}g</div>
         </div>
      </div>

      <div className="flex gap-3 pt-2">
         <Button variant="outline" onClick={onCancel} className="flex-1 border-slate-700 text-slate-300">Cancel</Button>
         <Button onClick={handleSave} className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white gap-2">
            <Save className="w-4 h-4" /> Save Adjustments
         </Button>
      </div>
    </div>
  );
}

// Simple Badge component needed if not available in imports
function Badge({ children, className, variant }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${className}`}>
      {children}
    </span>
  );
}