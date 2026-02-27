
# Diagnostic Chain Analysis: Admin Access Failure

## 1. Auth Context Flow (SupabaseAuthContext.jsx)

**Logic:**
The `AuthProvider` initializes by checking `supabase.auth.getSession()`. If a user exists, it immediately attempts to fetch the profile.

**Code Snippet:**
