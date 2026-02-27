
import React, { useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

function pickFirst(obj, keys) {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== undefined && v !== null && `${v}`.trim() !== '') return v;
  }
  return null;
}

function normalizeList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String).filter(Boolean);

  const s = String(value).trim();
  if (!s) return [];

  const parts = s
    .split(/\r?\n|\||•|·/g)
    .map((x) => x.trim())
    .filter(Boolean);

  if (parts.length <= 1 && s.includes(',')) {
    return s
      .split(',')
      .map((x) => x.trim())
      .filter(Boolean);
  }

  return parts.length ? parts : [s];
}

function formatNumber(v) {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  if (Number.isNaN(n)) return null;
  return n;
}

// Renamed from RecipeDetailsDialog to PlanTemplateDialog to match filename
export default function PlanTemplateDialog({ open, onOpenChange, meal }) {
  const title = meal?.recipe_name || meal?.name || meal?.title || 'Recipe';
  const slot = meal?.slot || null;
  const description = pickFirst(meal, ['description', 'summary', 'notes']);

  const ingredientsRaw = pickFirst(meal, [
    'ingredients_norm',
    'ingredients_block',
    'ingredients',
    'ingredient_list',
    'ingredientList',
  ]);

  const instructionsRaw = pickFirst(meal, [
    'prep_notes_norm',
    'prep_notes_block',
    'instructions',
    'directions',
    'steps',
    'method',
  ]);

  const imageUrl = pickFirst(meal, [
    'image_url',
    'imageUrl',
    'photo_url',
    'photoUrl',
    'thumbnail',
  ]);

  const calories = formatNumber(pickFirst(meal, ['calories', 'kcal', 'cals', 'energy']));
  const protein = formatNumber(pickFirst(meal, ['protein', 'protein_g']));
  const carbs = formatNumber(pickFirst(meal, ['carbs', 'carbs_g', 'net_carbs']));
  const fat = formatNumber(pickFirst(meal, ['fat', 'fat_g']));

  const ingredients = useMemo(() => normalizeList(ingredientsRaw), [ingredientsRaw]);

  const instructions = useMemo(() => {
    if (!instructionsRaw) return [];
    const s = String(instructionsRaw).trim();
    if (!s) return [];

    const lines = s
      .split(/\r?\n/g)
      .map((x) => x.trim())
      .filter(Boolean);

    if (lines.length > 1) return lines;

    return normalizeList(s);
  }, [instructionsRaw]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="
          w-[95vw] max-w-3xl
          max-h-[90vh]
          bg-[#131B2D] border-slate-800 text-white
          overflow-hidden
          flex flex-col
        "
      >
        <DialogHeader className="shrink-0">
          <DialogTitle className="text-xl font-bold text-white truncate">
            {title}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            {slot ? (
              <span className="inline-flex items-center gap-2">
                <Badge className="bg-cyan-900/40 text-cyan-300 border-cyan-800">
                  {String(slot).toUpperCase()}
                </Badge>
                <span className="text-slate-500">Recipe details</span>
              </span>
            ) : (
              <span className="text-slate-500">Recipe details</span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 -mr-2 mt-3">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            <div className="lg:col-span-2">
              <div className="rounded-xl border border-slate-800 bg-[#0B1120] overflow-hidden">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={title}
                    className="w-full h-44 object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-44 flex items-center justify-center text-slate-500">
                    No image
                  </div>
                )}

                <div className="p-3 border-t border-slate-800">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="rounded-lg border border-slate-800 bg-[#131B2D] p-2">
                      <div className="text-[11px] text-slate-500">Calories</div>
                      <div className="font-semibold text-slate-200">
                        {calories ?? '—'}
                      </div>
                    </div>
                    <div className="rounded-lg border border-slate-800 bg-[#131B2D] p-2">
                      <div className="text-[11px] text-slate-500">Protein</div>
                      <div className="font-semibold text-slate-200">
                        {protein ?? '—'}{protein !== null ? 'g' : ''}
                      </div>
                    </div>
                    <div className="rounded-lg border border-slate-800 bg-[#131B2D] p-2">
                      <div className="text-[11px] text-slate-500">Carbs</div>
                      <div className="font-semibold text-slate-200">
                        {carbs ?? '—'}{carbs !== null ? 'g' : ''}
                      </div>
                    </div>
                    <div className="rounded-lg border border-slate-800 bg-[#131B2D] p-2">
                      <div className="text-[11px] text-slate-500">Fat</div>
                      <div className="font-semibold text-slate-200">
                        {fat ?? '—'}{fat !== null ? 'g' : ''}
                      </div>
                    </div>
                  </div>
                  {description ? (
                    <div className="mt-3 text-sm text-slate-300">
                      {String(description)}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="lg:col-span-3 space-y-4">
              <div className="rounded-xl border border-slate-800 bg-[#0B1120]">
                <div className="px-4 py-3 border-b border-slate-800">
                  <div className="text-sm font-semibold text-slate-200">Ingredients</div>
                </div>
                <div className="p-4">
                  {ingredients.length ? (
                    <ul className="list-disc pl-5 space-y-1 text-sm text-slate-300">
                      {ingredients.map((ing, i) => (
                        <li key={`${ing}-${i}`}>{ing}</li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-sm text-slate-500">
                      No ingredients found on this recipe.
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-slate-800 bg-[#0B1120]">
                <div className="px-4 py-3 border-b border-slate-800">
                  <div className="text-sm font-semibold text-slate-200">Instructions</div>
                </div>
                <div className="p-4">
                  {instructions.length ? (
                    <ol className="list-decimal pl-5 space-y-2 text-sm text-slate-300">
                      {instructions.map((step, i) => (
                        <li key={`${i}-${step.slice(0, 20)}`}>{step}</li>
                      ))}
                    </ol>
                  ) : (
                    <div className="text-sm text-slate-500">
                      No instructions found on this recipe.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="h-4" />
        </div>
      </DialogContent>
    </Dialog>
  );
}
