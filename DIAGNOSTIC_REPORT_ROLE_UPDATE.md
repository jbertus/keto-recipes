
# Diagnostic Report: Admin Role Mutation & Security Audit

## 1. Code Path Analysis - Change Role Flow

**Location:** `src/components/admin/AdminUserManagement.jsx`
**Function:** `handleUpdateRole`

**Current Implementation:**
The application attempts to update the user's role using a **direct client-side Supabase mutation** to the `profiles` table. It does *not* use an Edge Function or RPC for this specific operation.

**Code Trace:**
1. User selects a role in the UI.
2. User clicks "Update Role".
3. `handleUpdateRole` function is triggered.
4. **Supabase Call:**
