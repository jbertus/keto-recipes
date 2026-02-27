
import { supabase } from '@/lib/customSupabaseClient';
import { getRecipeIngredients, cleanIngredientName, parseIngredient, categorizeIngredient, getCurrentTimestamp } from '@/lib/utils';
import { calculateNeed, parseQuantity } from '@/lib/quantityUtils';

/**
 * Adds recipe ingredients to the shopping list, handling aggregation.
 * @param {string} userId 
 * @param {object} recipe - The full recipe object (should include id, name, ingredients etc)
 * @param {number} scale - Scaling factor
 */
export async function addRecipeIngredientsToShoppingList(userId, recipe, scale = 1) {
    console.group(`[ShoppingSync] Adding Ingredients for: ${recipe.name || recipe.recipe_name}`);
    console.log("User ID:", userId);
    console.log("Scale:", scale);
    console.log("Recipe Object:", recipe);

    if (!userId || !recipe) {
        console.error("Missing userId or recipe object");
        console.groupEnd();
        return;
    }

    // 1. Extract ingredients
    const ingredients = getRecipeIngredients(recipe);
    console.log("Extracted Ingredients (Raw Lines):", ingredients);

    if (!ingredients.length) {
        console.warn("No ingredients found to add.");
        console.groupEnd();
        return;
    }

    // 2. Fetch existing shopping list to aggregate
    console.log("Fetching existing shopping list for deduplication...");
    const { data: existingItems, error: fetchError } = await supabase
        .from('shopping_list_items')
        .select('*')
        .eq('user_id', userId);
        
    if (fetchError) {
        console.error("Error fetching shopping list for sync:", fetchError);
        console.groupEnd();
        return;
    }

    const updates = [];
    const inserts = [];
    
    // Helper to find existing item
    const findItem = (name) => existingItems.find(i => cleanIngredientName(i.name) === cleanIngredientName(name));

    const recipeId = recipe.recipe_id || recipe.id; // handle both standard recipe and planner meal object

    for (const line of ingredients) {
        const parsed = parseIngredient(line);
        if (!parsed) {
            console.warn("Failed to parse line:", line);
            continue;
        }

        const cleanName = cleanIngredientName(parsed.name);
        if (!cleanName) {
             console.warn("Clean name empty for:", parsed.name);
             continue;
        }
        
        // Calculate quantity to add
        const qtyToAdd = parsed.qty * scale;
        
        const existing = findItem(parsed.name);

        if (existing) {
            console.log(`Found existing item for ${parsed.name} (ID: ${existing.id})`);
            // Update existing
            const currentQty = parseQuantity(existing.quantity);
            
            let newQtyVal = currentQty.qty + qtyToAdd;
            let unit = currentQty.unit || parsed.unit || 'pcs';

            // Update source array
            const currentSources = Array.isArray(existing.recipe_source) ? existing.recipe_source : [];
            const newSources = currentSources.includes(recipeId) 
                ? currentSources 
                : [...currentSources, recipeId];

            updates.push({
                id: existing.id,
                quantity: `${Number(newQtyVal.toFixed(2))} ${unit}`,
                recipe_source: newSources,
                is_purchased: false // uncheck if we add more needed
            });
        } else {
            console.log(`Creating new item for ${parsed.name}`);
            // Insert new
            inserts.push({
                user_id: userId,
                name: parsed.name, // Use display name
                quantity: `${Number(qtyToAdd.toFixed(2))} ${parsed.unit || 'pcs'}`,
                category: categorizeIngredient(parsed.name),
                is_manual: false,
                checked: false,
                is_purchased: false,
                recipe_source: [recipeId],
                use_pantry: false,
                created_at: getCurrentTimestamp()
            });
        }
    }

    console.log(`Batch Operations Prepared: ${updates.length} updates, ${inserts.length} inserts`);

    // Execute Batch Operations
    if (updates.length > 0) {
        for (const update of updates) {
             const { error } = await supabase.from('shopping_list_items').update(update).eq('id', update.id);
             if (error) console.error("Update failed for item:", update.id, error);
        }
    }
    
    if (inserts.length > 0) {
        const { error } = await supabase.from('shopping_list_items').insert(inserts);
        if (error) console.error("Batch insert failed:", error);
    }

    console.log("Shopping List Sync Complete");
    console.groupEnd();
}

/**
 * Removes recipe ingredients from the shopping list.
 * @param {string} userId 
 * @param {object} meal - The meal object from the planner (must contain ingredients or recipe ref)
 */
export async function removeRecipeIngredientsFromShoppingList(userId, meal) {
    if (!userId || !meal) return;
    
    const recipeId = meal.recipe_id || meal.id;
    const ingredients = getRecipeIngredients(meal);
    if (!ingredients.length) return;
    
    const scale = Number(meal.scale) || 1;

    // 1. Fetch existing list
    const { data: existingItems, error } = await supabase
        .from('shopping_list_items')
        .select('*')
        .eq('user_id', userId)
        .contains('recipe_source', [recipeId]); // Optimization: Only fetch items related to this recipe

    if (error || !existingItems) return;

    const toDelete = [];
    const toUpdate = [];

    // Map for faster lookup
    const itemMap = new Map(existingItems.map(i => [cleanIngredientName(i.name), i]));

    for (const line of ingredients) {
        const parsed = parseIngredient(line);
        if (!parsed) continue;

        const cleanName = cleanIngredientName(parsed.name);
        const item = itemMap.get(cleanName);

        if (item) {
            const qtyToRemove = parsed.qty * scale;
            const currentQty = parseQuantity(item.quantity);
            
            const newQtyVal = Math.max(0, currentQty.qty - qtyToRemove);
            
            // Remove source
            const sources = (item.recipe_source || []).filter(s => s !== recipeId);
            
            if (sources.length === 0 || newQtyVal <= 0.01) {
                // If no more sources OR quantity is effectively zero, delete
                toDelete.push(item.id);
            } else {
                toUpdate.push({
                    id: item.id,
                    quantity: `${Number(newQtyVal.toFixed(2))} ${currentQty.unit}`,
                    recipe_source: sources
                });
            }
        }
    }

    if (toDelete.length > 0) {
        await supabase.from('shopping_list_items').delete().in('id', toDelete);
    }

    if (toUpdate.length > 0) {
        for (const update of toUpdate) {
            await supabase.from('shopping_list_items').update(update).eq('id', update.id);
        }
    }
}
