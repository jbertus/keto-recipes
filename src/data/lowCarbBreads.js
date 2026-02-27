// src/data/lowCarbBreads.js

const BREADS = [
  { name: "Nature's Own Keto Soft White", netCarbsPerSlice: 1, notes: "Common, soft, easy." },
  { name: "Lewis Bake Shop Healthy Life Keto", netCarbsPerSlice: 0, notes: "Very low net carbs; check availability." },
  { name: "Sola Bread (Sweet Oat / Wheat)", netCarbsPerSlice: 2, notes: "Good texture; slightly pricier." },
  { name: "Arnold Keto Bread", netCarbsPerSlice: 1, notes: "Mainstream keto bread option." },
  { name: "Hero Bread (White/Wheat)", netCarbsPerSlice: 2, notes: "Great texture; usually online." },
  { name: "ALDI L'Oven Fresh Keto Friendly Bread", netCarbsPerSlice: 0, notes: "Budget-friendly; availability varies." },
  { name: "Kroger Carbmaster Bread", netCarbsPerSlice: 4, notes: "Not as low, but works in a pinch." },
];

// Name AIRecipeGenerator.jsx expects
export const lowCarbBreadBrands = BREADS;

// Optional alias in case another file imports a different name (harmless, prevents breakage)
export const lowCarbBreads = BREADS;