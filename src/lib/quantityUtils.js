
// Basic unit conversion factors to base unit (conceptually)
// Volume -> ml, Weight -> g
const CONVERSIONS = {
  // Volume (base: ml)
  'ml': 1,
  'l': 1000,
  'liter': 1000,
  'tsp': 4.92,
  'teaspoon': 4.92,
  'tbsp': 14.79,
  'tablespoon': 14.79,
  'fl oz': 29.57,
  'cup': 236.59,
  'cups': 236.59,
  'pt': 473.18,
  'pint': 473.18,
  'qt': 946.35,
  'quart': 946.35,
  'gal': 3785.41,
  'gallon': 3785.41,

  // Weight (base: g)
  'g': 1,
  'gram': 1,
  'kg': 1000,
  'kilogram': 1000,
  'oz': 28.35,
  'ounce': 28.35,
  'lb': 453.59,
  'pound': 453.59,
  'lbs': 453.59,
  
  // Count
  'pc': 1,
  'pcs': 1,
  'piece': 1,
  'pieces': 1,
  'slice': 1,
  'slices': 1,
  'count': 1,
  'can': 1,
  'cans': 1,
  'bottle': 1,
  'bottles': 1,
  'pkg': 1,
  'pkgs': 1,
  'packet': 1,
  'packets': 1,
  '': 1 // No unit often means count
};

const UNIT_ALIASES = {
  'teaspoons': 'tsp',
  'tablespoons': 'tbsp',
  'ounces': 'oz',
  'pounds': 'lb',
  'liters': 'l',
  'milliliters': 'ml',
  'grams': 'g',
  'kilograms': 'kg',
  'pkg': 'pcs',
  'pkgs': 'pcs',
  'packet': 'pcs',
  'packets': 'pcs'
};

function normalizeUnit(unit) {
  if (!unit) return '';
  const lower = unit.toLowerCase().trim().replace('.', ''); // remove periods from abbreviations
  // Check aliases
  if (UNIT_ALIASES[lower]) return UNIT_ALIASES[lower];
  // Remove 's' from end if not in specific list (simple pluralization check)
  if (lower.length > 1 && lower.endsWith('s') && !['pcs', 'lbs'].includes(lower)) {
    return lower.slice(0, -1);
  }
  return lower;
}

function getBaseValue(qty, unit) {
  const normUnit = normalizeUnit(unit);
  const factor = CONVERSIONS[normUnit];
  
  if (factor) {
    // Determine type based on unit
    const type = ['ml','l','tsp','tbsp','fl oz','cup','pt','qt','gal'].includes(normUnit) ? 'volume' : 
                 ['g','kg','oz','lb'].includes(normUnit) ? 'weight' : 'count';
    return { value: qty * factor, type };
  }
  return { value: qty, type: 'unknown' };
}

function convertFromBase(baseValue, targetUnit) {
    const normUnit = normalizeUnit(targetUnit);
    const factor = CONVERSIONS[normUnit];
    if (!factor) return baseValue;
    return baseValue / factor;
}

/**
 * Parses a quantity string into number and unit safely and explicitly.
 * Expected format: "16 oz", "1.5 kg", "1/2 cup", "3"
 */
export function parseQuantity(qtyString) {
  if (!qtyString) return { qty: 0, unit: '' };
  
  const clean = qtyString.toString().trim().toLowerCase();
  
  // Regex to find number at the start
  // Matches: 16, 16.5, 0.5, .5, 1/2
  const numberMatch = clean.match(/^(\d+(?:\.\d+)?|\d+\/\d+|\.\d+)/);
  
  if (!numberMatch) {
    // If no number found at start, return 0. We can't safely deduct.
    return { qty: 0, unit: '' };
  }
  
  const numStr = numberMatch[0];
  let qtyVal = 0;
  
  // Handle Fractions
  if (numStr.includes('/')) {
    const [n, d] = numStr.split('/');
    qtyVal = parseFloat(n) / parseFloat(d);
  } else {
    qtyVal = parseFloat(numStr);
  }
  
  // If parsing failed (NaN), return 0
  if (isNaN(qtyVal)) return { qty: 0, unit: '' };

  // Get unit - everything after the number
  let rest = clean.substring(numStr.length).trim();
  
  // Extract first word as unit
  // "oz of steak" -> "oz"
  // "cups chopped" -> "cups"
  const unitMatch = rest.match(/^([a-z]+)/i);
  const unit = unitMatch ? unitMatch[1] : '';
  
  return { qty: qtyVal, unit };
}

/**
 * Calculates the remaining needed quantity.
 * Returns { needed: number, covered: number, unit: string, isFullyCovered: boolean, status: string }
 */
export function calculateNeed(shoppingQtyStr, pantryQtyStr) {
  const shop = parseQuantity(shoppingQtyStr);
  const pantry = parseQuantity(pantryQtyStr);

  // If shopping quantity is 0 or missing, we can't perform a deduction logic.
  // Return 'none' so it displays as raw item without modification.
  if (shop.qty <= 0) {
      return { needed: 0, covered: 0, unit: shop.unit, isFullyCovered: false, status: 'none' };
  }

  // 1. Exact Unit Match (or simple normalization match)
  const normShopUnit = normalizeUnit(shop.unit);
  const normPantryUnit = normalizeUnit(pantry.unit);

  if (normShopUnit === normPantryUnit || (!shop.unit && !pantry.unit)) {
      const remaining = Math.max(0, shop.qty - pantry.qty);
      const isFullyCovered = remaining <= 0.01;
      
      return {
          needed: parseFloat(remaining.toFixed(2)),
          covered: Math.min(shop.qty, pantry.qty),
          unit: shop.unit,
          isFullyCovered,
          status: isFullyCovered ? 'full' : (pantry.qty > 0 ? 'partial' : 'none')
      };
  }

  // 2. Unit Conversion
  const shopBase = getBaseValue(shop.qty, shop.unit);
  const pantryBase = getBaseValue(pantry.qty, pantry.unit);

  if (shopBase.type !== 'unknown' && shopBase.type === pantryBase.type) {
      const remainingBase = Math.max(0, shopBase.value - pantryBase.value);
      const remainingInShopUnits = convertFromBase(remainingBase, shop.unit);
      const isFullyCovered = remainingInShopUnits <= 0.01;
      
      return {
          needed: parseFloat(remainingInShopUnits.toFixed(2)),
          covered: parseFloat(convertFromBase(Math.min(shopBase.value, pantryBase.value), shop.unit).toFixed(2)),
          unit: shop.unit,
          isFullyCovered,
          status: isFullyCovered ? 'full' : (pantryBase.value > 0 ? 'partial' : 'none')
      };
  }

  // 3. Fallback: If units mismatch and can't convert, assume NO deduction (safe approach)
  // We check numeric values only if units are both generic counts (pcs)
  if (shop.qty > 0 && pantry.qty > 0) {
      if ((normShopUnit === 'pcs' || !normShopUnit) && (normPantryUnit === 'pcs' || !normPantryUnit)) {
           const remaining = Math.max(0, shop.qty - pantry.qty);
           const isFullyCovered = remaining <= 0.01;
           return {
                needed: parseFloat(remaining.toFixed(2)),
                covered: Math.min(shop.qty, pantry.qty),
                unit: shop.unit || pantry.unit || '',
                isFullyCovered,
                status: isFullyCovered ? 'full' : 'partial'
           };
      }
  }

  return { 
      needed: shop.qty, 
      covered: 0, 
      unit: shop.unit, 
      isFullyCovered: false,
      status: 'none'
  };
}
