
# Verification Dump

### 1. Deliverable File Paths
The following files are present in the system:
1. `src/App.jsx`
2. `src/contexts/SupabaseAuthContext.jsx`
3. `src/components/AdminAlertActions.jsx`
4. `src/components/AdminAlertMessenger.jsx`
5. `src/components/AdminAlertsPreferences.jsx`
6. `supabase/migrations/20250208140000_admin_messages.sql`
7. `supabase/migrations/20250208140100_admin_alert_actions.sql`
8. `supabase/migrations/20250208110200_app_events_retention.sql`
9. `src/components/PaymentRequiredBlocker.jsx`

### 2. Migration Filenames & Timestamps
- **admin_bypass_rpc_update**: Function `get_account_access_state` is defined in `supabase/migrations/20260208000000_schema_dump.sql` (Timestamp: 2026-02-08T00:00:00).
- **app_events**: Table definition found in `supabase/migrations/20260208000000_schema_dump.sql` (Timestamp: 2026-02-08T00:00:00).
- **app_events_rls**: Policies defined in `supabase/migrations/20260208000000_schema_dump.sql` (Timestamp: 2026-02-08T00:00:00).
- **app_events_retention**: `supabase/migrations/20250208110200_app_events_retention.sql` (Timestamp: 2025-02-08T11:02:00).

### 3. App Events RLS Policy SQL
Extracted from current schema:
