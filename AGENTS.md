# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview
Keto Contractor is a React-based keto diet meal planning application. Users can browse recipes, plan weekly meals, track progress (weight, glucose, ketones), generate shopping lists, and manage a pantry. The app uses Supabase for authentication, database, and edge functions.

## Development Commands
```powershell
npm run dev       # Start dev server on port 3000
npm run build     # Generate llms.js then build with Vite
npm run lint      # ESLint with strict no-undef enforcement
npm run preview   # Preview production build
```
## Agent Operating Rules (Mandatory)

The following rules override any assumptions made by agents working in this repository.

### Source of Truth
- Do NOT guess database tables, RPC functions, or Supabase schema.
- Only document or reference items confirmed by scanning:
  - supabase/migrations/
  - supabase/functions/
  - supabase/schema.sql (if present)
  - SQL inside the supabase directory

### Known Current Breakages (Must Verify Before Coding)
- SUPABASE_CONFIGURED is imported in src/main.jsx and src/App.jsx
  but is NOT exported from src/lib/customSupabaseClient.js.
  This causes Vite “No matching export” build errors.

- Several components may be imported as named exports but could be default exports:
  - MainLayout
  - AdminRoute
  - AdminUserManagement
  - AdminAlertsPreferences
  - ApiKeysTab
  Agents must verify export style before documenting or refactoring.

### Secrets and Environment Variables
- Never commit API keys or secrets.
- Local development should use:
  VITE_SUPABASE_URL
  VITE_SUPABASE_ANON_KEY
  stored in .env.local

- Avoid hardcoding credentials in source files.

### Documentation Discipline
- If a system behavior cannot be proven from code, migrations, or configuration,
  label it as "UNVERIFIED" rather than asserting it as fact


## Architecture

### Frontend Stack
- **React 18** with Vite bundler
- **React Router v6** for routing (see `src/App.jsx` for route definitions)
- **Tailwind CSS** with shadcn/ui components (Radix UI primitives in `src/components/ui/`)
- **Path alias**: `@/` maps to `src/` (configured in `vite.config.js`)

### Backend (Supabase)
- **Auth**: Supabase Auth with email/password, session management in `SupabaseAuthContext.jsx`
- **Database**: PostgreSQL with RLS enabled on all tables
- **Edge Functions**: Located in `supabase/functions/`
- **Migrations**: SQL files in `supabase/migrations/`

### Key Database Tables
- `profiles` - User profiles with role (user/admin), Stripe IDs, timezone
- `personal_recipes` - User's recipe library with macros, ingredients, tags
- `weekly_plans` - Meal plans stored as JSONB keyed by week_start date
- `entitlements` - User subscription/credits (weekly_units_remaining, trial_units_remaining)
- `user_progress` - Daily tracking (weight, glucose, ketones, energy_level)
- `credit_events` - Audit log for credit consumption

### State Management
Three React Contexts wrap the app (see `src/main.jsx`):
1. `SupabaseAuthProvider` - Authentication, session, access state, admin status
2. `PreferencesProvider` - User preferences
3. `ApiKeysProvider` - Admin API key management

### Access Control Pattern
The app implements payment-gated access:
- `get_account_access_state` RPC checks if user can access the app
- `PaymentRequiredBlocker` component shows when `access_allowed === false`
- Admin routes use `AdminRoute` component checking `isAdmin` from auth context

## Code Conventions

### Macro Display Icons (Standard across all components)
- **Calories**: `Flame` icon (Orange)
- **Protein**: `Dumbbell` icon (Blue)
- **Net Carbs**: `Wheat` icon (Amber)
- **Fat**: `Cookie` icon (Yellow)

### Supabase Client Usage
Always import from `@/lib/customSupabaseClient`:
```javascript
import { supabase } from '@/lib/customSupabaseClient';
```

For robust queries with retry logic, use `safeSupabaseQuery` from `@/lib/supabaseUtils`.

### Component Organization
- `src/components/ui/` - Reusable shadcn/ui primitives (don't modify directly)
- `src/components/admin/` - Admin-only management components
- `src/components/planner/` - Weekly planner specific components
- `src/components/shopping/` - Shopping list components
- `src/components/shared/` - Shared domain components

### Route Structure
- `/` - Weekly Planner (main view)
- `/recipes` - Recipe Library
- `/builder` - Recipe Builder
- `/shopping-list`, `/pantry` - Inventory management
- `/progress`, `/reports` - User tracking
- `/admin/*` - Admin routes (users, alerts, events, api-keys)

## Important Patterns

### Credit System
AI-powered features consume credits via `useCredits` hook:
```javascript
const { consumeCredits, loading } = useCredits();
await consumeCredits(amount, 'purpose_string', { metadata });
```
Credits are managed via `consume_units` RPC which handles trial/weekly/priority pools.

### Error Handling
- Vite errors are captured and posted to parent window (`horizons-vite-error`)
- Runtime errors intercepted via `window.onerror`
- Console errors proxied for debugging
- Global `ErrorBoundary` in `main.jsx` catches React crashes

### Planner-specific Layout
The planner page (`/`) has special overflow handling in `MainLayout.jsx` - it uses `overflow-hidden` instead of scroll to accommodate the weekly grid layout.

## Testing
No test framework is configured. When adding tests, check package.json for any test scripts first.

## Linting
ESLint is configured with:
- `no-undef: error` - Critical, prevents runtime reference errors
- `import/no-self-import: error` - Prevents infinite loops
- `react/prop-types: off` - Not using PropTypes
- Many non-critical rules disabled for performance
