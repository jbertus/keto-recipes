
import React, { useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

function asNumber(val) {
  if (val === null || val === undefined) return null;
  const n = Number(val);
  return Number.isFinite(n) ? n : null;
}

function pickFirst(meal, keys) {
  for (const k of keys) {
    const v = meal?.[k];
    if (v !== null && v !== undefined && v !== '') return v;
  }
  return null;
}

function parseLines(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map(String).filter(Boolean);

  const s = String(raw);

  try {
    const maybe = JSON.parse(s);
    if (Array.isArray(maybe)) return maybe.map(String).filter(Boolean);
  } catch (_) {}

  if (s.includes('\n')) return s.split('\n').map(x => x.trim()).filter(Boolean);
  if (s.includes('|')) return s.split('|').map(x => x.trim()).filter(Boolean);

  return [s.trim()].filter(Boolean);
}

// Renamed from RecipeDetailsDialog to QuickRepeatDialog to match filename
export default function QuickRepeatDialog({ open, onOpenChange, meal }) {
  const title = meal?.recipe_name || meal?.name || 'Recipe Details';
  const slot = meal?.slot ? String(meal.slot) : null;

  const nutrition = useMemo(() => {
    const calories = asNumber(pickFirst(meal, ['calories', 'kcal']));
    const protein = asNumber(pickFirst(meal, ['protein_g', 'protein', 'proteinG']));
    const carbs = asNumber(pickFirst(meal, ['carbs_g', 'carbs', 'carb_g', 'carb']));
    const fat = asNumber(pickFirst(meal, ['fat_g', 'fat', 'fatG']));
    return { calories, protein, carbs, fat };
  }, [meal]);

  const ingredientsRaw = pickFirst(meal, ['ingredients_norm', 'ingredients_block', 'ingredients', 'ingredient_list']);
  const ingredients = useMemo(() => parseLines(ingredientsRaw), [ingredientsRaw]);

  const instructionsRaw = pickFirst(meal, ['prep_notes_block', 'instructions', 'prep_notes', 'steps']);
  const instructions = useMemo(() => parseLines(instructionsRaw), [instructionsRaw]);

  const cuisine = pickFirst(meal, ['cuisine_type', 'cuisine']);
  const difficulty = pickFirst(meal, ['difficulty']);
  const appliance = pickFirst(meal, ['appliance_type']);
  const proteinType = pickFirst(meal, ['protein_type']);
  const time = pickFirst(meal, ['time_minutes', 'cook_time', 'prep_time', 'time']);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0B1120] border-slate-800 text-white w-[92vw] max-w-3xl max-h-[78vh] p-0 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-800 bg-[#131B2D] shrink-0">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-white">{title}</DialogTitle>

            <div className="mt-2 flex flex-wrap gap-2">
              {slot && (
                <Badge className="bg-cyan-900/40 text-cyan-200 border border-cyan-800">
                  {slot}
                </Badge>
              )}
              {difficulty && (
                <Badge className="bg-slate-800 text-slate-200 border border-slate-700">
                  {String(difficulty)}
                </Badge>
              )}
              {cuisine && (
                <Badge className="bg-slate-800 text-slate-200 border border-slate-700">
                  {String(cuisine)}
                </Badge>
              )}
              {proteinType && (
                <Badge className="bg-slate-800 text-slate-200 border border-slate-700">
                  {String(proteinType)}
                </Badge>
              )}
              {appliance && (
                <Badge className="bg-slate-800 text-slate-200 border border-slate-700">
                  {String(appliance)}
                </Badge>
              )}
              {time && (
                <Badge className="bg-slate-800 text-slate-200 border border-slate-700">
                  {String(time)} min
                </Badge>
              )}
            </div>
          </DialogHeader>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="rounded-xl border border-slate-800 bg-[#131B2D] p-3">
              <div className="text-xs text-slate-400">Calories</div>
              <div className="text-lg font-bold">{nutrition.calories ?? '—'}</div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-[#131B2D] p-3">
              <div className="text-xs text-slate-400">Protein</div>
              <div className="text-lg font-bold">
                {nutrition.protein ?? '—'}{nutrition.protein !== null ? 'g' : ''}
              </div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-[#131B2D] p-3">
              <div className="text-xs text-slate-400">Carbs</div>
              <div className="text-lg font-bold">
                {nutrition.carbs ?? '—'}{nutrition.carbs !== null ? 'g' : ''}
              </div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-[#131B2D] p-3">
              <div className="text-xs text-slate-400">Fat</div>
              <div className="text-lg font-bold">
                {nutrition.fat ?? '—'}{nutrition.fat !== null ? 'g' : ''}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            <div className="rounded-xl border border-slate-800 bg-[#131B2D] p-4">
              <div className="text-sm font-semibold mb-3">Ingredients</div>
              {ingredients.length === 0 ? (
                <div className="text-sm text-slate-400">No ingredients available.</div>
              ) : (
                <ul className="space-y-2 text-sm text-slate-200 list-disc pl-5">
                  {ingredients.map((line, idx) => (
                    <li key={idx} className="leading-relaxed">{line}</li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-xl border border-slate-800 bg-[#131B2D] p-4">
              <div className="text-sm font-semibold mb-3">Instructions</div>
              {instructions.length === 0 ? (
                <div className="text-sm text-slate-400">No instructions available.</div>
              ) : (
                <ol className="space-y-3 text-sm text-slate-200 list-decimal pl-5">
                  {instructions.map((line, idx) => (
                    <li key={idx} className="leading-relaxed whitespace-pre-wrap">{line}</li>
                  ))}
                </ol>
              )}
            </div>
          </div>
          <div className="h-2" />
        </div>
      </DialogContent>
    </Dialog>
  );
}
