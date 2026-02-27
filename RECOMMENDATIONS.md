# Codebase Audit & Recommendations

## 1. Architecture & Code Structure

### Component Refactoring (High Priority)
Several files have grown too large and complex, violating the Single Responsibility Principle. This makes maintenance difficult and increases the risk of regression bugs.

- **`src/pages/Preferences.jsx` (~960 lines):**
  - **Issue:** Handles general settings, notifications, complex admin-only dashboards, nutrition calculators, and CSV file parsing all in one file.
  - **Recommendation:** Split into sub-components:
    - `components/preferences/GeneralSettings.jsx`
    - `components/preferences/NotificationSettings.jsx`
    - `components/preferences/NutritionGoals.jsx` (Admin)
    - `components/preferences/SystemDiagnostics.jsx` (Admin)
    - `components/preferences/DataImport.jsx` (Admin)
  - **Benefit:** vastly improved readability and isolation of logic.

- **`src/pages/RecipeLibrary.jsx`:**
  - **Issue:** Mixes UI presentation, complex filtering logic (`checkDietaryCompliance`), and data fetching.
  - **Recommendation:** Extract the filtering logic into a custom hook `useRecipeFilters()` or a utility file `lib/recipeUtils.js`. Move the `RecipeCard` into its own component file `src/components/RecipeCard.jsx`.

### Routing Security
- **Issue:** Admin routes are currently protected by a wrapper `<AdminRoute>`, but internal component logic (like inside `Preferences.jsx`) relies on hardcoded checks: `const hasSpecialAccess = user?.email === ADMIN_EMAIL;`.
- **Risk:** Client-side checks are easily bypassed by modifying JavaScript in the browser.
- **Recommendation:** Implement Role-Based Access Control (RBAC) using Supabase Custom Claims or a `user_roles` table. The frontend should check a role (e.g., `user.role === 'admin'`) rather than a specific email address.

## 2. Performance Optimizations

### Data Fetching Strategy
- **Issue:** `RecipeLibrary.jsx` currently fetches **all** recipes (`.select('*')`) and filters them client-side.
- **Risk:** As the database grows to hundreds or thousands of recipes, this will cause significant performance degradation and high memory usage on client devices.
- **Recommendation:** Move filtering to the server-side using Supabase query modifiers: