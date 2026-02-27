# Project Codebase Findings & Consistency Report
**Date:** 2025-12-29
**Status:** In Progress / Mitigation Phase

## 1. Macro Icon Consistency Analysis
**Standard Requirement:**
- **Calories:** `Flame` (Orange)
- **Protein:** `Dumbbell` (Blue)
- **Net Carbs:** `Wheat` (Amber)
- **Fat:** `Cookie` (Yellow)

### Inconsistencies Found (and addressed in this update):
1.  **`src/pages/Reports.jsx`**
    *   **Issue:** Used `Activity` icon (Cyan) for Calories.
    *   **Issue:** Used a generic CSS circle with "P" for Protein instead of `Dumbbell`.
    *   **Issue:** Used a generic CSS circle with "C" or `AlertCircle` for Net Carbs instead of `Wheat`.
    *   **Correction:** Updated to use `Flame` (Orange), `Dumbbell` (Blue), and `Wheat` (Amber) consistently.

2.  **`src/components/RecipeSidebar.jsx`**
    *   **Issue:** Displayed Net Carbs as text only (`"g net carb"`) without an icon.
    *   **Issue:** Did not display Protein or Fat, limiting the "at a glance" utility compared to other recipe cards.
    *   **Correction:** Added `Wheat` icon for carbs and standard formatting.

3.  **`src/components/planner/AddMealDialog.jsx`**
    *   **Issue:** The `MacroBadge` internal component imported the correct icons but failed to render them, resulting in text-only badges (e.g., "20g Prot").
    *   **Correction:** Updated `MacroBadge` to render the specific icon corresponding to the macro type.

4.  **`src/components/planner/DayColumn.jsx`**
    *   **Issue:** displayed Calories, Carbs, and Protein, but completely omitted Fat (`Cookie`).
    *   **Correction:** Added the `Cookie` icon and fat value to the meal cards in the day column view.

## 2. Bugs & Errors Discovered
1.  **`src/pages/Reports.jsx` - Weight Calculation Risk**
    *   **Finding:** The logic `setWeightChange(progress[0].weight - progress[1].weight)` assumes the `progress` array always has at least 2 items. If a user has only 1 log entry, this throws an error or results in `NaN`.
    *   **Fix:** Added an array length check `if (progress.length > 1)` before calculating change.

2.  **`src/components/planner/AddMealDialog.jsx` - Missing Icon Usage**
    *   **Finding:** The icons (`Flame`, `Wheat`, etc.) were imported but unused variables in the previous version, causing linting warnings and visual inconsistency.
    *   **Fix:** Integrated icons into the UI.

## 3. Recommended Upgrades
1.  **Unified Macro Component:**
    *   **Recommendation:** Create a shared `@/components/shared/MacroDisplay.jsx` component.
    *   **Why:** Currently, the logic for "If Carbs > 20, make text red" and the icon selection is repeated in `MealCard`, `RecipeCard`, `RecipeDetails`, and `AddMealDialog`. Centralizing this prevents style drift.

2.  **Virtualization for Recipe Lists:**
    *   **Recommendation:** Implement `react-window` or `react-virtuoso` for `RecipeLibrary.jsx`.
    *   **Why:** As the user adds hundreds of recipes, rendering the full grid will cause significant DOM bloat and layout thrashing.

3.  **Data Caching Strategy:**
    *   **Recommendation:** Use `TanStack Query` (React Query) instead of `useEffect` + local state.
    *   **Why:** Currently, navigating between `Planner` and `Recipes` triggers re-fetches. React Query would cache this data, making the app feel instant.

4.  **Mobile Optimization for DayColumn:**
    *   **Recommendation:** The `DayColumn` can get cramped on mobile screens. Implementing a horizontal snap-scroll or a tabbed view for days (M/T/W...) on mobile would improve usability.

---
## Changes Made

### `src/pages/Reports.jsx`

**1. Icon Inconsistencies:**
*   **Before:**