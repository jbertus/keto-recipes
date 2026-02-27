
import { supabase } from '@/lib/customSupabaseClient'; // Fixed import

// Helper to shuffle array
const shuffle = (array) => {
  let currentIndex = array.length, randomIndex;
  while (currentIndex !== 0) {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;
    [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
  }
  return array;
};

/**
 * Generates a weekly meal plan for a specific client based on their targets.
 * This is a simplified algorithm that tries to fill slots (Breakfast, Lunch, Dinner, Snack).
 */
export async function generateClientMealPlan(clientId, userId) {
  if (!supabase) throw new Error("Supabase client not initialized");

  // 1. Fetch Client Details
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .single();

  if (clientError) throw new Error(`Client not found: ${clientError.message}`);

  // 2. Fetch Available Recipes (Personal + maybe public favorites later)
  const { data: recipes, error: recipeError } = await supabase
    .from('personal_recipes')
    .select('*')
    .eq('user_id', userId);

  if (recipeError) throw new Error(`Could not fetch recipes: ${recipeError.message}`);

  if (!recipes || recipes.length < 5) {
    throw new Error("Not enough recipes in library to generate a varied plan. Please add at least 5 recipes.");
  }

  // 3. Define Meal Slots
  const slots = ['Breakfast', 'Lunch', 'Dinner', 'Snack'];
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  const weeklyPlan = {};

  // 4. Generate Plan Day by Day
  days.forEach(day => {
    let dailyCalories = 0;
    let dailyProtein = 0;
    let dailyFat = 0;
    let dailyCarbs = 0;
    
    const dayMeals = {};

    // Categorize recipes roughly to slots (simplified logic)
    // In a real app, you'd filter by 'meal_type' or 'default_meal_slot' column
    const breakfastOptions = recipes.filter(r => 
      r.recipe_name.toLowerCase().includes('egg') || 
      r.recipe_name.toLowerCase().includes('breakfast') || 
      r.recipe_name.toLowerCase().includes('pancake') ||
      r.default_meal_slot === 'Breakfast'
    );
    
    const mainOptions = recipes.filter(r => !breakfastOptions.includes(r));

    slots.forEach(slot => {
      let selectedRecipe = null;
      
      if (slot === 'Breakfast') {
        const pool = breakfastOptions.length > 0 ? breakfastOptions : recipes;
        selectedRecipe = pool[Math.floor(Math.random() * pool.length)];
      } else if (slot === 'Snack') {
         // Snacks are often smaller, simplistic selection here
         // Ideally filter for low calorie items
         const snackPool = recipes; 
         selectedRecipe = snackPool[Math.floor(Math.random() * snackPool.length)];
      } else {
        const pool = mainOptions.length > 0 ? mainOptions : recipes;
        selectedRecipe = pool[Math.floor(Math.random() * pool.length)];
      }

      if (selectedRecipe) {
        // Calculate needed adjustments (very basic scaling)
        // This is a placeholder for complex "Knapsack problem" solver
        
        dayMeals[slot] = {
          recipe_id: selectedRecipe.id,
          name: selectedRecipe.recipe_name,
          calories: selectedRecipe.calories_per_serving,
          protein: selectedRecipe.protein_per_serving_g,
          fat: selectedRecipe.fat_per_serving_g,
          carbs: selectedRecipe.net_carbs_per_serving_g,
          servings: 1
        };

        dailyCalories += selectedRecipe.calories_per_serving || 0;
        dailyProtein += selectedRecipe.protein_per_serving_g || 0;
        dailyFat += selectedRecipe.fat_per_serving_g || 0;
        dailyCarbs += selectedRecipe.net_carbs_per_serving_g || 0;
      }
    });

    weeklyPlan[day] = {
      meals: dayMeals,
      totals: {
        calories: Math.round(dailyCalories),
        protein: Math.round(dailyProtein),
        fat: Math.round(dailyFat),
        carbs: Math.round(dailyCarbs)
      }
    };
  });

  // 5. Get Week Start Date (Next Monday)
  const d = new Date();
  d.setDate(d.getDate() + ((7 - d.getDay()) % 7 + 1) % 7); // Next day, simplified
  // Actually, let's just use "Today" or specific date passed in.
  // For now, let's assume this plan starts "Next Monday"
  const today = new Date();
  const diff = today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1); // adjust when day is sunday
  const currentMonday = new Date(today.setDate(diff));
  // Let's create it for *next* week usually, but for demo: Current Week
  const weekStart = currentMonday.toISOString().split('T')[0];

  // 6. Save to DB
  const { data: savedPlan, error: saveError } = await supabase
    .from('client_meal_plans')
    .upsert({
      client_id: clientId,
      week_start_date: weekStart,
      plan_data: weeklyPlan,
      updated_at: new Date().toISOString()
    }, { onConflict: 'client_id, week_start_date' })
    .select()
    .single();

  if (saveError) throw new Error(`Failed to save plan: ${saveError.message}`);

  return savedPlan;
}
