
import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { startOfWeek, endOfWeek, format, isValid, parseISO, isSunday } from 'date-fns';

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

// CORRECT: Always use weekStartsOn: 0 for Sunday
export function getWeekRange(date = new Date()) {
  const start = startOfWeek(date, { weekStartsOn: 0 }); 
  const end = endOfWeek(date, { weekStartsOn: 0 });
  
  return {
    start,
    end,
    formatted: `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`
  };
}

// SHARED HELPER: Single Source of Truth for week_start strings in DB
export function getWeekStartStr(date) {
  if (!date) return null;
  try {
      // Force Sunday start
      const sunday = startOfWeek(date, { weekStartsOn: 0 });
      return format(sunday, 'yyyy-MM-dd');
  } catch (e) {
      console.error("Error calculating week start:", e);
      return null;
  }
}

// NEW: Consistent Timestamp Helper
export function getCurrentTimestamp() {
  return new Date().toISOString();
}

export function validateWeekStart(dateString) {
  if (!dateString) return { isValid: false, message: 'Date string is empty' };
  
  try {
    const date = parseISO(dateString);
    if (!isValid(date)) return { isValid: false, message: 'Invalid date format' };
    
    // Check if it's Sunday (0)
    if (!isSunday(date)) {
      return { 
        isValid: false, 
        message: `Date ${dateString} is a ${format(date, 'EEEE')}, but week_start must be a Sunday.` 
      };
    }
    
    return { isValid: true, message: 'Valid Sunday' };
  } catch (e) {
    return { isValid: false, message: `Error parsing date: ${e.message}` };
  }
}

// Helper for persistent debug logging
export function debugLog(label, data, level = 'INFO') {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  const styles = {
    INFO: 'background: #000; color: #00ff00; padding: 2px 5px; border-radius: 3px;',
    WARN: 'background: #000; color: #ffff00; padding: 2px 5px; border-radius: 3px;',
    ERROR: 'background: #000; color: #ff0000; padding: 2px 5px; border-radius: 3px; font-weight: bold;',
    DEBUG: 'background: #000; color: #00ffff; padding: 2px 5px; border-radius: 3px;'
  };
  
  const style = styles[level] || styles.INFO;
  
  // Specific check for "63" issue
  if (JSON.stringify(data).includes("63") || label.includes("63")) {
      console.error(`%c[🚨 CRITICAL "63" DETECTED] ${label}`, "background: red; color: white; font-size: 14px; padding: 5px;", data);
  } else {
      console.log(`%c[AUDIT ${timestamp}] ${label}`, style, data);
  }
}

// NEW: Comprehensive Supabase Error Debugger
export function debugSupabaseError(error, context = "Supabase Operation") {
  if (!error) return null;

  const errorDetails = {
    message: error.message,
    code: error.code,
    details: error.details,
    hint: error.hint,
    status: error.status || error.statusCode,
    context: context
  };

  console.group(`%c[SUPABASE ERROR] ${context}`, "background: #ef4444; color: white; padding: 4px; border-radius: 4px;");
  console.error("Full Error Object:", error);
  console.table(errorDetails);

  // RLS Check
  if (error.code === '42501') {
    console.error("%c⚠️ RLS POLICY VIOLATION ⚠️", "color: orange; font-weight: bold; font-size: 12px;");
    console.warn("The user likely does not have permission to perform this action. Check RLS policies on the table.");
  }

  // Foreign Key Check
  if (error.code === '23503') {
    console.error("%c⚠️ FOREIGN KEY VIOLATION ⚠️", "color: orange; font-weight: bold; font-size: 12px;");
    console.warn("Attempting to reference a record that does not exist.");
  }
  
  // Specific "63" Check - Could be length limit or specific error code
  if (JSON.stringify(error).includes("63") || error.code === '22001') {
     console.error("%c🚨 ERROR CONTAINS '63' OR LENGTH VIOLATION 🚨", "background: red; color: white; font-weight: bold; font-size: 20px;");
     console.warn("Check for string length constraints (varchar(63)) or invalid identifiers.");
  }

  console.groupEnd();

  return `[${error.code || 'UNKNOWN'}] ${error.message}`;
}

// Advanced Ingredient Normalizer
export const cleanIngredientName = (name) => {
  if (!name) return '';
  let cleaned = name.toLowerCase();
  
  cleaned = cleaned.replace(/\([^)]*\)/g, '');

  const stopWords = [
    'strips', 'slices', 'sliced', 'pieces', 'chopped', 'diced', 'minced', 
    'shredded', 'grated', 'crumbled', 'ground', 'mashed', 'crushed', 'cubed', 'chunks',
    'large', 'medium', 'small', 'jumbo', 'mini',
    'fresh', 'dried', 'dry', 'raw', 'cooked', 'frozen',
    'whole', 'rashers', 'spears', 'leaves', 'sprigs', 'stalks', 
    'cloves', 'bulbs', 'heads', 'ears', 'bunches', 'pinch', 'dash',
    'bulk' 
  ];

  const regex = new RegExp(`\\b(${stopWords.join('|')})\\b`, 'g');
  cleaned = cleaned.replace(regex, '');
  cleaned = cleaned.replace(/[^\w\s]/g, '').replace(/\s+/g, ' ').trim();
  
  return cleaned;
};

// Expanded auto-categorizer for ingredients
export const categorizeIngredient = (name) => {
  if (!name) return 'Pantry'; // Defaulting to Pantry as per instruction for 'anything else'
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
  
  return 'Pantry'; // Default per request
};

export function getDisplayMacros(item) {
  if (!item) return { calories: 0, protein: 0, fat: 0, carbs: 0 };
  
  let multiplier = 1;
  if (item.scale !== undefined && item.scale !== null) {
      multiplier = Number(item.scale);
  } else if (item.servings !== undefined && item.servings !== null) {
      if (item.slot || item.uniqueId) {
         multiplier = Number(item.servings);
      }
  }

  let cals = Number(item.calories_per_serving) || Number(item.calories) || 0;
  let prot = Number(item.protein_per_serving_g) || Number(item.protein) || 0;
  let fat = Number(item.fat_per_serving_g) || Number(item.fat) || 0;
  let carbs = Number(item.net_carbs_per_serving_g) || Number(item.netCarbs) || Number(item.carbs) || 0;

  if (item.macros && typeof item.macros === 'object') {
     if (!prot) prot = Number(item.macros.protein) || 0;
     if (!fat) fat = Number(item.macros.fat) || 0;
     if (!carbs) carbs = Number(item.macros.carbs) || Number(item.macros.net_carbs) || 0;
     if (!cals && item.macros.calories) cals = Number(item.macros.calories) || 0;
  }

  return {
    calories: Math.max(0, Math.round(cals * multiplier)),
    protein: Math.max(0, Math.round(prot * multiplier)),
    fat: Math.max(0, Math.round(fat * multiplier)),
    carbs: Math.max(0, Math.round(carbs * multiplier))
  };
}

// NEW: Helper to parse pipe-delimited ingredients block
export function parseIngredientsBlock(block) {
  if (!block || typeof block !== 'string') return [];
  
  return block.split(/\r?\n/).map(line => {
    const parts = line.split('|').map(s => s.trim());
    if (parts.length >= 3) {
      // Format: Name | Amount | Unit
      return {
        name: parts[0],
        amount: parseFloat(parts[1]) || 0,
        unit: parts[2]
      };
    } else if (parts.length === 2) {
      // Fallback: Amount Name or similar
      return {
        name: parts[0],
        amount: parseFloat(parts[1]) || 0,
        unit: 'pcs' 
      };
    }
    return null;
  }).filter(Boolean);
}

export function formatIngredientLine(line) {
  if (!line || typeof line !== 'string') return '';
  const trimmed = line.trim();
  if (!trimmed) return '';
  
  if (trimmed.includes('|')) {
    const parts = trimmed.split('|').map(s => s.trim());
    if (parts.length >= 3) {
      const name = parts[0];
      const qty = parts[1];
      const unit = parts[2];
      return [qty, unit, name].filter(Boolean).join(' ');
    }
    if (parts.length === 2) {
       return [parts[1], parts[0]].filter(Boolean).join(' ');
    }
    return parts.join(' ');
  }
  return trimmed;
}

export function parseIngredient(line) {
  if (!line) return null;
  const cleanLine = line.trim();
  if (!cleanLine) return null;

  const parts = cleanLine.split('|');
  
  if (parts.length >= 3) {
    return {
      name: parts[0].trim(),
      qty: parseFloat(parts[1]) || 0,
      unit: parts[2].trim()
    };
  } else if (parts.length === 2) {
    return {
      name: parts[0].trim(),
      qty: parseFloat(parts[1]) || 0,
      unit: 'pcs'
    };
  } else {
    const match = cleanLine.match(/^(\d+(\.\d+)?)\s*(.*)$/);
    if (match) {
      const qty = parseFloat(match[1]);
      const remainder = match[3].trim();
      const commonUnits = ['g', 'kg', 'ml', 'l', 'cup', 'cups', 'tbsp', 'tsp', 'oz', 'lb', 'lbs', 'piece', 'pieces', 'slice', 'slices', 'each'];
      const firstSpace = remainder.indexOf(' ');
      
      let unit = 'pcs';
      let name = remainder;

      if (firstSpace > -1) {
         const firstWord = remainder.substring(0, firstSpace).toLowerCase();
         const singular = firstWord.endsWith('s') ? firstWord.slice(0, -1) : firstWord;
         
         if (commonUnits.includes(firstWord) || commonUnits.includes(singular)) {
             unit = firstWord;
             name = remainder.substring(firstSpace + 1).trim();
         }
      } else if (commonUnits.includes(remainder.toLowerCase())) {
          // Case where line is just "1 lb" with no name
          unit = remainder.toLowerCase();
          name = "";
      }

      return { name, qty, unit };
    }
    
    return { name: cleanLine, qty: 1, unit: 'item' };
  }
}

// --- NEW CENTRALIZED PARSING HELPERS ---

export function getRecipeIngredients(recipe) {
  console.groupCollapsed("[Utils] getRecipeIngredients");
  if (!recipe) {
      console.warn("No recipe provided");
      console.groupEnd();
      return [];
  }

  console.log("Input Recipe:", recipe);

  // Priority: recipe.ingredients (Array) -> ingredients_block (Text) -> ingredients_norm (Text)
  const candidates = [
      { source: 'recipe.ingredients', value: recipe.ingredients },
      { source: 'recipe.ingredients_block', value: recipe.ingredients_block },
      { source: 'recipe.ingredients_norm', value: recipe.ingredients_norm }
  ];

  for (const { source, value: raw } of candidates) {
      if (!raw) continue;
      console.log(`Found candidate in ${source}:`, raw);
      
      // Handle Arrays directly
      if (Array.isArray(raw)) {
         if (raw.length === 0) continue;
         const result = raw.map(item => {
             if (typeof item === 'string') return item;
             if (typeof item === 'object' && item !== null) {
                  // Try to construct a readable string from object parts
                  const parts = [item.qty, item.unit, item.name].filter(Boolean);
                  if (parts.length > 0) return parts.join(' ');
                  return item.original || item.text || JSON.stringify(item);
             }
             return String(item);
         }).filter(Boolean);
         console.log("Parsed from Array:", result);
         console.groupEnd();
         return result;
      }
      
      // Handle Strings
      if (typeof raw === 'string') {
         const trimmed = raw.trim();
         if (!trimmed) continue;
         
         // 1. Try JSON parse
         if (trimmed.startsWith('[')) {
             try {
                 const parsed = JSON.parse(trimmed);
                 if (Array.isArray(parsed)) {
                     const result = parsed.map(item => {
                         if (typeof item === 'string') return item;
                         if (typeof item === 'object' && item !== null) {
                             const parts = [item.qty, item.unit, item.name].filter(Boolean);
                             if (parts.length > 0) return parts.join(' ');
                             return item.original || item.text || JSON.stringify(item);
                         }
                         return String(item);
                     });
                     console.log("Parsed from JSON string:", result);
                     console.groupEnd();
                     return result;
                 }
             } catch (e) {
                 console.warn("Failed to parse potential JSON string:", e);
             }
         }

         // 2. Handle Pipe Delimited Legacy Format "Name|Qty|Unit"
         if (trimmed.includes('|')) {
             const result = trimmed.split(/\r?\n/).map(line => {
                 const parts = line.split('|');
                 if (parts.length >= 3) {
                     return `${parts[1]} ${parts[2]} ${parts[0]}`.trim();
                 } else if (parts.length === 2) {
                     return `${parts[1]} ${parts[0]}`.trim();
                 }
                 return line.replace(/\|/g, ' ');
             }).filter(Boolean);
             console.log("Parsed from pipe-delimited string:", result);
             console.groupEnd();
             return result;
         }
         
         // 3. Standard newline separation
         const result = trimmed.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
         console.log("Parsed from newline string:", result);
         console.groupEnd();
         return result;
      }
  }

  console.warn("No valid ingredients found in any candidate field.");
  console.groupEnd();
  return [];
}

export function getRecipeInstructions(recipe, guidance = null) {
  if (!recipe) return [];

  // 1. Try arrays first (AI Recipe Generator often returns array of steps, or separate guidance table)
  const rawArr = recipe.instructions || (guidance?.cooking_instructions);
  if (Array.isArray(rawArr) && rawArr.length > 0) {
      return rawArr.map(i => typeof i === 'string' ? i : (i.step || i.text || JSON.stringify(i)));
  }

  // 2. Try text blocks
  // Check prep_notes_block, prep_notes, and prep_guidance
  const textCandidates = [
      recipe.prep_notes_block,
      recipe.prep_notes,
      guidance?.prep_guidance
  ];

  for (const rawText of textCandidates) {
      if (typeof rawText === 'string' && rawText.trim().length > 0) {
           // Check if it's JSON array in string
           if (rawText.trim().startsWith('[')) {
               try {
                   const parsed = JSON.parse(rawText);
                   if (Array.isArray(parsed)) {
                       return parsed.map(i => typeof i === 'string' ? i : (i.step || i.text || JSON.stringify(i)));
                   }
               } catch (e) {}
           }
           
           // Split by newlines
           return rawText.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
      }
  }
  
  return [];
}

// NEW: Deficiency Status Utility (Task 9)
export function getDeficiencyStatus(micronutrient, value, baseline) {
  if (!baseline || baseline === 0) return 'ok';
  
  const val = Number(value) || 0;
  const base = Number(baseline);

  if (val < base * 0.8) return 'low';
  if (val > base * 1.2) return 'high';
  return 'ok';
}
