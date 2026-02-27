
import { supabase } from '@/lib/customSupabaseClient';

// Privacy-focused image proxy to bypass CORS for external images
const PROXY_BASE = "https://wsrv.nl/?url=";

export const getRecipeImageUrl = (recipe) => {
  // Global Default (Generic food spread)
  const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=800&q=80&fit=crop";
  
  if (!recipe) return DEFAULT_IMAGE;

  // 1. Image Path (Supabase Storage or direct path from import)
  if (recipe.image_path && typeof recipe.image_path === 'string' && recipe.image_path.trim().length > 0) {
    // If it looks like a full URL, use it directly (common in imported data)
    if (recipe.image_path.startsWith('http')) {
       // If it's already an Unsplash URL, just append params if needed
       if (recipe.image_path.includes('unsplash.com')) {
          return recipe.image_path.includes('?') 
            ? recipe.image_path 
            : `${recipe.image_path}?w=800&q=80&fit=crop`;
       }
       // For other external URLs, use proxy to avoid CORS issues if needed, or return directly
       return `${PROXY_BASE}${encodeURIComponent(recipe.image_path)}&w=800&fit=cover&output=webp`;
    }
    
    // Otherwise assume it's a relative storage path in 'recipe-images' bucket
    const { data } = supabase.storage.from('recipe-images').getPublicUrl(recipe.image_path);
    if (data?.publicUrl) {
      return data.publicUrl;
    }
  }

  // 2. Fallback to legacy 'image_url' if available (but prefer image_path)
  if (recipe.image_url && typeof recipe.image_url === 'string' && recipe.image_url.trim().length > 5) {
     const rawUrl = recipe.image_url.trim();
     if (rawUrl.includes('supabase.co') || rawUrl.includes('base64,')) {
        return rawUrl;
     }
     if (rawUrl.includes('unsplash.com')) {
         return rawUrl.includes('?') ? rawUrl : `${rawUrl}?w=800&q=80&fit=crop`;
     }
     return `${PROXY_BASE}${encodeURIComponent(rawUrl)}&w=800&fit=cover&output=webp`;
  }

  // 3. Robust Fallback System based on Meal Type
  // Updated with fresh, reliable Unsplash IDs for all categories
  const type = (recipe.meal_type || "").toLowerCase();
  
  // Breakfast - Pancakes/Waffles with fruit
  if (type.includes('breakfast')) 
      return "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?w=800&q=80&fit=crop"; 
      
  // Lunch - Healthy Salad Bowl
  if (type.includes('lunch')) 
      return "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80&fit=crop"; 
      
  // Dinner - Grilled Salmon/Steak
  if (type.includes('dinner')) 
      return "https://images.unsplash.com/photo-1467003909585-2f8a7270028d?w=800&q=80&fit=crop"; 
      
  // Snacks - Dip/Appetizers
  if (type.includes('snack') || type.includes('appetizer')) 
      return "https://images.unsplash.com/photo-1621510456681-2330135e5871?w=800&q=80&fit=crop"; 

  // Sweets/Dessert - Donuts
  if (type.includes('dessert') || type.includes('sweets') || type.includes('cookie') || type.includes('cake')) 
      return "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=800&q=80&fit=crop";

  // Drinks/Smoothies
  if (type.includes('drink') || type.includes('smoothie') || type.includes('beverage'))
      return "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=800&q=80&fit=crop";

  return DEFAULT_IMAGE;
};
