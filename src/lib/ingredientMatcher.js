
import { cleanIngredientName, parseIngredient } from './utils';

/**
 * Calculates the Levenshtein distance between two strings.
 */
function levenshtein(a, b) {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1 // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Calculates similarity score between 0 and 1.
 */
function getSimilarity(s1, s2) {
  const longer = s1.length > s2.length ? s1 : s2;
  const shorter = s1.length > s2.length ? s2 : s1;
  
  if (longer.length === 0) return 1.0;

  if (longer.includes(shorter)) {
    return 0.9 + (shorter.length / longer.length) * 0.1; 
  }

  const dist = levenshtein(s1, s2);
  return (longer.length - dist) / longer.length;
}

// Comprehensive Unit Conversion Constants
const UNITS = {
  // Weights (base: g)
  g: { base: 'weight', factor: 1 },
  gm: { base: 'weight', factor: 1 },
  gram: { base: 'weight', factor: 1 },
  grams: { base: 'weight', factor: 1 },
  
  kg: { base: 'weight', factor: 1000 },
  kilogram: { base: 'weight', factor: 1000 },
  kilograms: { base: 'weight', factor: 1000 },
  
  oz: { base: 'weight', factor: 28.3495 },
  ounce: { base: 'weight', factor: 28.3495 },
  ounces: { base: 'weight', factor: 28.3495 },
  
  lb: { base: 'weight', factor: 453.592 },
  lbs: { base: 'weight', factor: 453.592 },
  pound: { base: 'weight', factor: 453.592 },
  pounds: { base: 'weight', factor: 453.592 },

  // Volumes (base: ml)
  ml: { base: 'volume', factor: 1 },
  milliliter: { base: 'volume', factor: 1 },
  milliliters: { base: 'volume', factor: 1 },
  
  l: { base: 'volume', factor: 1000 },
  liter: { base: 'volume', factor: 1000 },
  liters: { base: 'volume', factor: 1000 },
  
  tsp: { base: 'volume', factor: 4.92892 },
  teaspoon: { base: 'volume', factor: 4.92892 },
  teaspoons: { base: 'volume', factor: 4.92892 },
  
  tbsp: { base: 'volume', factor: 14.7868 },
  tablespoon: { base: 'volume', factor: 14.7868 },
  tablespoons: { base: 'volume', factor: 14.7868 },
  
  cup: { base: 'volume', factor: 236.588 },
  cups: { base: 'volume', factor: 236.588 },
  
  fl_oz: { base: 'volume', factor: 29.5735 },
  'fl oz': { base: 'volume', factor: 29.5735 },
  'fluid ounce': { base: 'volume', factor: 29.5735 },
  
  pt: { base: 'volume', factor: 473.176 },
  pint: { base: 'volume', factor: 473.176 },
  pints: { base: 'volume', factor: 473.176 },
  
  qt: { base: 'volume', factor: 946.353 },
  quart: { base: 'volume', factor: 946.353 },
  quarts: { base: 'volume', factor: 946.353 },
  
  gal: { base: 'volume', factor: 3785.41 },
  gallon: { base: 'volume', factor: 3785.41 },
  gallons: { base: 'volume', factor: 3785.41 },
  
  // Count (base: pcs)
  pcs: { base: 'count', factor: 1 },
  pc: { base: 'count', factor: 1 },
  each: { base: 'count', factor: 1 },
  item: { base: 'count', factor: 1 },
  items: { base: 'count', factor: 1 },
  count: { base: 'count', factor: 1 },
  slice: { base: 'count', factor: 1 },
  slices: { base: 'count', factor: 1 },
  package: { base: 'count', factor: 1 },
  packages: { base: 'count', factor: 1 },
  pkg: { base: 'count', factor: 1 },
  pkgs: { base: 'count', factor: 1 },
  bag: { base: 'count', factor: 1 },
  bags: { base: 'count', factor: 1 }
};

/**
 * Helper to parse fractions like "1/2" or "1.5"
 */
function parseNumericString(str) {
  if (!str) return 0;
  const trimmed = str.toString().trim();
  
  if (trimmed.includes('/')) {
    const [num, den] = trimmed.split('/');
    const n = parseFloat(num);
    const d = parseFloat(den);
    if (!isNaN(n) && !isNaN(d) && d !== 0) return n / d;
  }
  
  const parsed = parseFloat(trimmed);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Converts value from one unit to another.
 * Returns null if incompatible.
 */
function convertValue(value, fromUnit, toUnit) {
  const normFrom = (fromUnit || '').toLowerCase().trim().replace('.', ''); 
  const normTo = (toUnit || '').toLowerCase().trim().replace('.', '');

  // Direct match
  if (normFrom === normTo) return value;

  const fromDef = UNITS[normFrom];
  const toDef = UNITS[normTo];

  // If we don't know the units, we can't convert unless they are effectively the same string
  if (!fromDef || !toDef) return null;

  // Check compatibility
  if (fromDef.base !== toDef.base) return null;

  // Convert to base, then to target
  const baseValue = value * fromDef.factor;
  const result = baseValue / toDef.factor;
  
  return result;
}

/**
 * Robustly parses a quantity string into qty and unit.
 * Handles: "1 lb", "0.5 lbs", "1/2 cup", "2", ".5 lb"
 */
export function parseQtyStr(str) {
  if (!str) return { qty: 0, unit: 'pcs' };
  
  const clean = str.toString().trim().toLowerCase();
  
  // Revised Regex to handle optional leading digit before decimal (e.g. ".5")
  // Group 1: Number (integer, decimal with/without leading zero, or fraction)
  // Group 2: Unit (words after number)
  const regex = /^(\d*\.?\d+(?:\/\d+)?)\s*(.*)$/;
  const match = clean.match(regex);
  
  if (match) {
      const qtyVal = parseNumericString(match[1]);
      let unitStr = match[2].trim();
      
      // Default to pcs if unit is missing or purely descriptive without known unit keyword
      // But for "2 large onions", "large onions" isn't a unit.
      // We check if the first word is a known unit.
      const firstWord = unitStr.split(' ')[0];
      const normWord = firstWord.replace('.', '');
      
      if (UNITS[normWord]) {
         unitStr = firstWord; // Use the known unit part
      } else if (!unitStr) {
         unitStr = 'pcs';
      }
      
      return { 
          qty: qtyVal, 
          unit: unitStr
      };
  }
  
  // Fallback for purely numeric string
  const val = parseFloat(clean);
  if (!isNaN(val)) return { qty: val, unit: 'pcs' };
  
  return { qty: 0, unit: 'pcs' };
}

/**
 * Calculates deduction between shopping item and pantry item.
 * @returns {object} { needed, covered, isFullyCovered, unit, status }
 */
export function calculateDeduction(shoppingItem, pantryItem) {
  // Use robust parsing
  const shopStr = shoppingItem.quantity || "";
  const pantryStr = pantryItem.quantity || "";

  const sVal = parseQtyStr(shopStr);
  const pVal = parseQtyStr(pantryStr);

  // Try conversion (Pantry -> Shopping Unit)
  const convertedPantryQty = convertValue(pVal.qty, pVal.unit, sVal.unit);

  if (convertedPantryQty !== null) {
      // Compatible Units
      // needed = Shopping - Pantry
      // Example: 1 lb - 0.5 lb = 0.5 lb needed
      const needed = Math.max(0, sVal.qty - convertedPantryQty);
      
      // covered = how much of Shopping is met by Pantry
      const covered = Math.min(sVal.qty, convertedPantryQty);
      
      return {
          needed: Number(needed.toFixed(2)),
          covered: Number(covered.toFixed(2)),
          isFullyCovered: needed <= 0.01, // epsilon tolerance
          unit: sVal.unit,
          status: needed <= 0 ? 'covered' : 'partial'
      };
  } else {
      // Incompatible Units - Cannot Deduct Safely
      // Return full needed amount
      return {
          needed: sVal.qty,
          covered: 0,
          isFullyCovered: false,
          unit: sVal.unit,
          status: 'incompatible_units'
      };
  }
}

/**
 * Matches shopping list items against pantry items.
 */
export function matchIngredients(shoppingItems, pantryItems, threshold = 0.7) {
  const matches = [];

  shoppingItems.forEach(shopItem => {
    const shopNameClean = cleanIngredientName(shopItem.name);
    let bestMatch = null;
    let bestScore = 0;

    pantryItems.forEach(pantryItem => {
      const pantryNameClean = cleanIngredientName(pantryItem.name);
      const score = getSimilarity(shopNameClean, pantryNameClean);

      if (score > bestScore) {
        bestScore = score;
        bestMatch = pantryItem;
      }
    });

    if (bestScore >= threshold && bestMatch) {
        // Parse here for convenience in Modal usage
        const parsedShopping = parseQtyStr(shopItem.quantity);
        const parsedPantry = parseQtyStr(bestMatch.quantity);
        
        matches.push({
            shoppingItem: shopItem,
            pantryItem: bestMatch,
            score: bestScore,
            parsedShopping,
            parsedPantry
        });
    }
  });

  return matches;
}
