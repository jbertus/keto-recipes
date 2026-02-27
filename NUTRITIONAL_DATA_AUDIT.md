
# Nutritional Data & Macro Storage Audit

## 1. Core Macro Fields
The database explicitly distinguishes between **Net Carbs** and Total Carbs, prioritizing Net Carbs for the Keto context of this application.

### `personal_recipes` Table
| Field Name | Data Type | Notes |
| :--- | :--- | :--- |
| `calories_per_serving` | numeric | Total Energy |
| `protein_per_serving_g` | numeric | Protein in grams |
| `fat_per_serving_g` | numeric | Fat in grams |
| `net_carbs_per_serving_g` | numeric | **KEY FIELD**: Calculated as Total Carbs - Fiber - Sugar Alcohols. |

*Note: "Total Carbs", "Fiber", and "Sugar" are NOT stored as distinct columns in the main recipe table.*

## 2. Weekly Plans (`weekly_plans` table)
Stored inside the `plan_data` JSONB column.
The keys are simplified compared to the recipe table.

| JSON Key | Source Map |
| :--- | :--- |
| `calories` | `recipe.calories_per_serving` * scale |
| `protein` | `recipe.protein_per_serving_g` * scale |
| `fat` | `recipe.fat_per_serving_g` * scale |
| `carbs` | `recipe.net_carbs_per_serving_g` * scale |

**Important:** The field `carbs` in the planner acts as "Net Carbs". There is no separate `net_carbs` key in the planner JSON structure.

## 3. Client Targets (`clients` table)
Used for setting daily goals.

| Field Name | Type |
| :--- | :--- |
| `target_calories` | integer |
| `target_protein` | integer |
| `target_fat` | integer |
| `target_carbs` | integer (Implies Net Carbs based on app logic) |

## 4. Calculated vs. Stored
*   **Stored:** Per-serving data in `personal_recipes`.
*   **Calculated:**
    *   **Daily Totals:** Summed dynamically in `NutritionDashboard.jsx` and `PlannerPage.jsx`.
    *   **Meal Totals:** `WeeklyPlanner.jsx` calculates meal slot totals on the fly.
    *   **Percentages:** Macro ratios (e.g., 75% Fat) are calculated on the frontend.

## 5. Discrepancies & Risks
1.  **"Carbs" Ambiguity:** In `weekly_plans`, the key is `carbs`, but it holds `net_carbs` data. This requires careful handling if external API data (which usually provides Total Carbs) is imported.
2.  **Missing Fiber:** Since fiber isn't stored, converting back to Total Carbs is impossible without re-analyzing ingredients.
