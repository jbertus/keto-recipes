
import { corsHeaders } from "./cors.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
  "https://tqjfcbulgtoimroqyxlo.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxamZjYnVsZ3RvaW1yb3F5eGxvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDk1NTEwNSwiZXhwIjoyMDg2NTMxMTA1fQ.SX3OAG9xRm7YrEpg9lODDZdGcZDIjkFdOAUpyCTwgG4"
);

    if (fetchError) throw fetchError;

    // 2. Define Categorization Logic (Duplicated from utils.js because edge functions are isolated)
    const categorizeIngredient = (name) => {
      if (!name) return 'Pantry';
      const lower = name.toLowerCase();
      
      const priorityRules = [
        // 1. Spices
        { 
          cat: 'Spices', 
          keywords: [
            'powder', 'spice', 'seasoning', 'paprika', 'cumin', 'oregano', 'basil', 
            'thyme', 'rosemary', 'sage', 'cinnamon', 'nutmeg', 'ginger', 'turmeric', 
            'cayenne', 'chili', 'garlic powder', 'onion powder', 'cardamom', 'clove', 
            'coriander', 'dill', 'fennel', 'vanilla extract', 'salt', 'pepper' 
          ] 
        },
        // 2. Meat
        { 
          cat: 'Meat', 
          keywords: [
            'beef', 'chicken', 'pork', 'steak', 'turkey', 'lamb', 'fish', 'salmon', 
            'tuna', 'shrimp', 'bacon', 'ham', 'sausage', 'ground', 'prosciutto', 
            'salami', 'pepperoni', 'chorizo', 'prawn', 'crab', 'mince', 'burger', 'ribs' 
          ] 
        },
        // 3. Dairy
        { 
          cat: 'Dairy', 
          keywords: [
            'milk', 'cheese', 'butter', 'yogurt', 'cream', 'sour cream', 'whey', 
            'cottage cheese', 'ghee', 'half and half', 'cheddar', 'mozzarella', 
            'parmesan', 'feta', 'ricotta', 'gouda', 'brie', 'curd', 'custard', 'egg' 
          ] 
        },
        // 4. Produce
        { 
          cat: 'Produce', 
          keywords: [
            'garlic', 'onion', 'tomato', 'lettuce', 'spinach', 'broccoli', 'carrot', 
            'pepper', 'cucumber', 'apple', 'banana', 'lemon', 'lime', 'kale', 'zucchini', 
            'squash', 'mushroom', 'potato', 'herb', 'cilantro', 'parsley', 'fruit', 
            'berry', 'avocado', 'cauliflower', 'cabbage', 'vegetable', 'salad', 'greens', 
            'asparagus', 'bean sprout', 'scallion' 
          ] 
        },
        // 5. Condiments
        { 
          cat: 'Condiments', 
          keywords: [
            'oil', 'sauce', 'ketchup', 'mustard', 'mayo', 'vinegar', 'dressing', 
            'salsa', 'dip', 'soy sauce', 'hot sauce', 'bbq', 'marinade', 'paste', 'hummus' 
          ] 
        },
        // Baking
        { 
          cat: 'Baking', 
          keywords: [
            'flour', 'sugar', 'baking', 'yeast', 'extract', 'chocolate', 'cocoa', 
            'sweetener', 'stevia', 'erythritol', 'syrup', 'honey', 'molasses', 
            'cake mix', 'frosting' 
          ] 
        },
        // Frozen
        { cat: 'Frozen', keywords: ['ice cream', 'frozen', 'pizza', 'ice'] },
        // Beverages
        { cat: 'Beverages', keywords: ['water', 'soda', 'juice', 'coffee', 'tea', 'drink', 'beverage', 'wine', 'beer', 'liquor'] },
        // Household
        { cat: 'Household', keywords: ['paper', 'soap', 'cleaner', 'detergent', 'foil', 'wrap', 'bag', 'tissue', 'napkin', 'towel', 'sponge'] },
        // Bakery
        { cat: 'Bakery', keywords: ['bread', 'bun', 'tortilla', 'wrap', 'pita', 'bagel', 'loaf', 'muffin', 'croissant'] },
        // Pantry (Catch-all for known pantry items)
        { 
          cat: 'Pantry', 
          keywords: [
            'pasta', 'rice', 'bean', 'lentil', 'nut', 'seed', 'almond', 'walnut', 
            'pecan', 'stock', 'broth', 'can', 'canned', 'jar', 'cereal', 'oat', 
            'quinoa', 'couscous', 'bread crumbs', 'cracker', 'chips', 'tortilla chips' 
          ] 
        }
      ];

      for (const rule of priorityRules) {
        if (rule.keywords.some(k => lower.includes(k))) return rule.cat;
      }
      return 'Pantry';
    };

    // 3. Process items
    const updates = [];
    let updatedCount = 0;
    const categoryStats = {};

    for (const item of items) {
      const correctCategory = categorizeIngredient(item.name);
      
      // Update stats
      categoryStats[correctCategory] = (categoryStats[correctCategory] || 0) + 1;

      if (item.category !== correctCategory) {
        updates.push({
          id: item.id,
          category: correctCategory
        });
        updatedCount++;
      }
    }

    // 4. Execute Updates
    // Chunking to avoid rate limits or packet size issues
    const chunkSize = 20; // Conservative chunk size for Promise.all
    for (let i = 0; i < updates.length; i += chunkSize) {
      const chunk = updates.slice(i, i + chunkSize);
      
      // We must map them to individual update promises as Supabase-js doesn't support 
      // bulk update with different values per row easily without raw SQL or upsert.
      // Since we want to update ONLY category, individual updates are safest.
      const promises = chunk.map(u => 
        supabase
          .from('shopping_list_items')
          .update({ category: u.category })
          .eq('id', u.id)
      );
      
      await Promise.all(promises);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Updated ${updatedCount} items`, 
        stats: categoryStats,
        updatedCount
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

