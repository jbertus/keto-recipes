
import React from 'react';
import RecipeViewDialog from './RecipeViewDialog';

export default function EditRecipeDialog({
  open,
  onOpenChange,
  recipe,
  weekStart,
  onRemove,
  onMoveDay,
  onChangeMealType,
  onChangeServings
}) {
  // Derive context for the dialog
  // If the recipe comes from the planner, it should have dateKey and slot.
  const plannedContext = (recipe && recipe.dateKey && recipe.slot) ? {
    plannedMealId: recipe.id,
    day: recipe.dateKey,
    mealType: recipe.slot,
    servings: Number(recipe.scale) || 1,
    recipeId: recipe.recipe_id
  } : null;

  return (
    <RecipeViewDialog 
      open={open}
      onOpenChange={onOpenChange}
      recipe={recipe}
      weekStart={weekStart}
      plannedContext={plannedContext}
      onRemove={onRemove}
      onMoveDay={onMoveDay}
      onChangeMealType={onChangeMealType}
      onChangeServings={onChangeServings}
    />
  );
}
