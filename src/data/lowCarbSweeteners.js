// src/data/lowCarbSweeteners.js

const SWEETENERS = [
  { name: "Allulose", notes: "Closest to real sugar taste. Great for desserts." },
  { name: "Monk Fruit Blend", notes: "Good general-purpose sweetener. Watch blends for erythritol." },
  { name: "Erythritol", notes: "Common and cheap. Can cause cooling effect." },
  { name: "Stevia", notes: "Powerful sweetener; can taste bitter if overused." },
  { name: "Sucralose (Splenda)", notes: "Works well in small amounts; avoid baking-heavy use unless tested." },
  { name: "Xylitol", notes: "Not keto-perfect for everyone; NEVER around dogs (toxic)." },
];

// NEW name used by AIRecipeGenerator.jsx (last night’s changes)
export const ketoSweeteners = SWEETENERS;

// OLD name some other parts of the app may still import (prevents breaking anything)
export const lowCarbSweeteners = SWEETENERS;