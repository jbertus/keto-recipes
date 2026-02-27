
/**
 * Utility functions for Recipe logic to avoid duplication across components.
 */

// Calculate macros based on serving size or total
export const calculateMacros = (recipe, servings = 1) => {
  if (!recipe) return { calories: 0, protein: 0, carbs: 0, fat: 0 };
  
  return {
    calories: Math.round((recipe.calories_per_serving || 0) * servings),
    protein: Math.round((recipe.protein_per_serving_g || 0) * servings),
    carbs: Math.round((recipe.net_carbs_per_serving_g || 0) * servings),
    fat: Math.round((recipe.fat_per_serving_g || 0) * servings),
  };
};

// Common dietary compliance check
export const checkDietaryCompliance = (recipe, preferences = {}) => {
  if (!recipe) return false;
  
  // Example logic: checks if recipe fits within "Keto" limits per serving
  // This can be expanded based on user preferences in the future
  const isKeto = (recipe.net_carbs_per_serving_g || 0) <= 15;
  
  return isKeto;
};

// Format time string (e.g., 90 -> "1h 30m")
export const formatTime = (minutes) => {
  if (!minutes) return '0m';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

// Get difficulty color
export const getDifficultyColor = (difficulty) => {
  switch (difficulty?.toLowerCase()) {
    case 'easy': return 'text-green-400 bg-green-400/10 border-green-400/20';
    case 'medium': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
    case 'hard': return 'text-red-400 bg-red-400/10 border-red-400/20';
    default: return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
  }
};
