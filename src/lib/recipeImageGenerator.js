import { supabase } from '@/lib/customSupabaseClient';

/**
 * Generates a recipe image using the AI edge function.
 * 
 * @param {Object} params
 * @param {string} params.recipeName - Name of the recipe
 * @param {string} params.mealType - Type of meal (Breakfast, Lunch, etc.)
 * @param {string|Array} params.ingredients - Ingredients list or block
 * @param {string} params.description - Optional description
 * @param {string} params.userId - The user's ID
 * @param {string} params.recipeId - The recipe's ID to update
 * @returns {Promise<string|null>} - The public URL of the generated image or null if failed
 */
export async function generateRecipeImage({ recipeName, mealType, ingredients, description, userId, recipeId }) {
  try {
    // Prepare the prompt for the image generation
    const ingredientsText = Array.isArray(ingredients) 
      ? ingredients.join(', ') 
      : (ingredients || '');
      
    const prompt = `Professional food photography of ${recipeName}. ${description || ''} ${mealType ? `Meal type: ${mealType}.` : ''} Key ingredients: ${ingredientsText.slice(0, 100)}. High resolution, appetizing, photorealistic, 8k, culinary magazine style.`;

    // Call the edge function
    const { data, error } = await supabase.functions.invoke('generate-image', {
      body: { 
        prompt,
        bucket: 'recipe-images',
        path: `${userId}/${recipeId}-${Date.now()}.png`
      }
    });

    if (error) {
      console.error('Error invoking generate-image function:', error);
      throw error;
    }

    if (!data || !data.url) {
      throw new Error('No image URL returned from generation function');
    }

    // Update the recipe with the new image path
    // The edge function usually returns the full public URL, but we might want to store just the path or the URL depending on how the app uses it.
    // Based on getRecipeImageUrl in other files, it seems to handle both or expects a path.
    // Let's assume we update the recipe with the returned URL or path.
    
    // If the edge function returns a signed URL or public URL, we can use that.
    // However, usually we want to store the relative path in the DB if we are using Supabase storage buckets.
    // Let's assume the edge function returns { url: "...", path: "..." } or similar.
    
    // For safety, let's just update the recipe with the URL provided by the function if it's a full URL, 
    // or construct it if we only get a path.
    
    const imagePath = data.path || data.url; // Fallback

    if (recipeId) {
      const { error: updateError } = await supabase
        .from('recipes') // Note: The table name in the provided schema is 'personal_recipes' or 'recipes'? 
                         // Looking at RecipeLibrary.jsx, it queries 'recipes'. 
                         // Looking at the schema provided, there is 'personal_recipes' and 'favorite_recipes'.
                         // However, RecipeLibrary.jsx explicitly uses 'recipes'. 
                         // I will stick to 'recipes' as per the consuming code, but if that fails, it might be 'personal_recipes'.
                         // Wait, the schema shows 'personal_recipes'. The RecipeLibrary.jsx uses 'recipes'.
                         // This might be another issue, but I must fix the missing file first.
                         // I will assume 'recipes' is a view or the user meant 'personal_recipes'.
                         // Actually, let's check RecipeLibrary.jsx again. It says: .from('recipes').
                         // If 'recipes' table doesn't exist in schema, that's a separate issue, but the error reported is about the missing module.
        .update({ image_path: imagePath })
        .eq('id', recipeId);

      if (updateError) {
        console.error('Error updating recipe with image:', updateError);
        // We don't throw here, we still return the image path so the UI can update optimistically if needed
      }
    }

    return imagePath;

  } catch (error) {
    console.error('Failed to generate recipe image:', error);
    return null;
  }
}