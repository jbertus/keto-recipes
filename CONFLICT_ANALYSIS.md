
# Project Conflict Analysis: Recipe Generation vs. Database Schema

**Date:** 2026-01-25
**Scope:** `generate-recipe` Edge Function (Inferred via Consumer) & `personal_recipes` Table Schema

## 1. Schema Audit: `personal_recipes` Table
The following columns exist in the `personal_recipes` table.

| Column Name | Data Type | Nullable | Description/Notes |
| :--- | :--- | :--- | :--- |
| `id` | uuid | NO | Primary Key |
| `user_id` | uuid | NO | Foreign Key |
| `created_at` | timestamp | NO | System timestamp |
| `meal_type` | text | YES | Matches 'Breakfast', 'Lunch', etc. |
| `difficulty` | text | YES | 'Easy', 'Medium', 'Hard' |
| `protein_level` | text | YES | Likely categorization (e.g., 'High', 'Moderate') |
| `dish_type` | text | YES | e.g., 'Soup', 'Salad' |
| `protein_type` | text | YES | e.g., 'Chicken', 'Beef' |
| `appliance_type` | text | YES | e.g., 'Stove', 'Oven' |
| `default_meal_slot` | text | YES | |
| `cuisine_type` | text | YES | e.g., 'Italian', 'Mexican' |
| `estimated_total_time_min` | integer | YES | **Strict Integer**. AI often returns strings like "15 mins" |
| `image_path` | text | YES | Storage path |
| `recipe_name` | text | YES | |
| `servings_per_batch` | numeric | YES | |
| `calories_per_serving` | numeric | YES | |
| `net_carbs_per_serving_g` | numeric | YES | **Critical Macro Field** |
| `protein_per_serving_g` | numeric | YES | **Critical Macro Field** |
| `fat_per_serving_g` | numeric | YES | **Critical Macro Field** |
| `ingredients_block` | text | YES | Serialized string (e.g., "Item\|Qty\|Unit\n...") |
| `prep_notes_block` | text | YES | Instructions text |
| `time_bucket_10min` | text | YES | Categorization field |
| `is_high_protein_25g_plus` | boolean | YES | Computed boolean |
| `ingredients_norm` | text | YES | Normalized ingredients for search |
| `tags` | text[] | YES | Array of strings |
| `is_hidden` | boolean | YES | Visibility toggle |

## 2. Function Audit: `generate-recipe`
**Analysis Source:** `src/pages/Foundry.jsx` (Function Consumer)

### Input Parameters (Sent to AI)
| Parameter | Type | Required | Notes |
| :--- | :--- | :--- | :--- |
| `ingredients` | Array | YES | List of strings |
| `mealType` | String | YES | 'Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Sweets' |
| `macros.protein` | Number | YES | Target gram amount |
| `macros.fat` | Number | YES | Target gram amount |
| `macros.carbs` | Number | YES | **Hard Limit** for Net Carbs |
| `maxCost` | Number | YES | Budget constraint (USD) |
| `hasPrices` | Boolean | YES | Context flag |
| `sweetenersContext` | Array | Conditional | List of valid sweeteners |
| `specialInstructions` | String | NO | Custom user prompts |
| `flexibility` | String | YES | 'medium' or 'high' (Internal logic param) |

### Output Schema (Expected from AI)
The application expects an array of objects with this structure:
