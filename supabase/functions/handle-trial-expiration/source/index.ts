
import { corsHeaders } from "./cors.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

// Scheduled Function - Runs daily via cron (platform specific setup required)
// Task 5: Trial Expiration & Grace Period
const supabase = createClient(
  "https://tqjfcbulgtoimroqyxlo.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxamZjYnVsZ3RvaW1yb3F5eGxvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDk1NTEwNSwiZXhwIjoyMDg2NTMxMTA1fQ.SX3OAG9xRm7YrEpg9lODDZdGcZDIjkFdOAUpyCTwgG4"
);

Deno.serve(async (req) => {
    try {
        const today = new Date().toISOString().split('T')[0];

        // 1. Identify Expired Trials (Expired Today)
        const { data: expiredUsers } = await supabase
            .from('entitlements')
            .select('user_id, trial_expires_at')
            .eq('plan', 'trial')
            .lt('trial_expires_at', new Date().toISOString()) // Already expired
            .is('trial_expires_at', 'not.null');

        // Logic for marking inactive (simulated loop for clarity, best done in batch SQL in prod)
        if (expiredUsers) {
            for (const user of expiredUsers) {
                // Check if already processed (profile.inactive is false)
                const { data: profile } = await supabase.from('profiles').select('inactive').eq('user_id', user.user_id).single();
                
                if (profile && !profile.inactive) {
                    const graceEnd = new Date();
                    graceEnd.setDate(graceEnd.getDate() + 5);

                    await supabase.from('profiles').update({
                        inactive: true,
                        inactive_expires_at: graceEnd.toISOString()
                    }).eq('user_id', user.user_id);

                    await supabase.from('credit_events').insert({
                        user_id: user.user_id,
                        event_type: 'trial_expired',
                        purpose: 'set_inactive',
                        success: true
                    });
                }
            }
        }

        // 2. Identify Grace Period Users for Email (Task 5)
        // Find users inactive for 1-4 days roughly
        // Ideally use a 'last_email_sent_at' flag, here we just query active grace periods
        const { data: graceUsers } = await supabase
            .from('profiles')
            .select('user_id, email, inactive_expires_at')
            .eq('inactive', true)
            .gt('inactive_expires_at', new Date().toISOString());

        if (graceUsers) {
            for (const user of graceUsers) {
                 // Call send-reactivation-email function
                 await supabase.functions.invoke('send-reactivation-email', {
                     body: { 
                         userId: user.user_id, 
                         email: user.email, 
                         graceEndDate: user.inactive_expires_at 
                     }
                 });
            }
        }

        // 3. Hard Delete Users (Grace Period Ended) (Task 5)
        const { data: doomedUsers } = await supabase
            .from('profiles')
            .select('user_id')
            .eq('inactive', true)
            .lt('inactive_expires_at', new Date().toISOString());

        if (doomedUsers) {
            for (const user of doomedUsers) {
                 const uid = user.user_id;
                 console.log(`Hard deleting user: ${uid}`);

                 // Log event first
                 await supabase.from('credit_events').insert({
                    user_id: uid,
                    event_type: 'hard_delete_user',
                    success: true
                 });

                 // Delete all related data (Cascading deletes in DB are better, but manual here per requirements)
                 await supabase.from('profiles').delete().eq('user_id', uid);
                 await supabase.from('entitlements').delete().eq('user_id', uid);
                 await supabase.from('weekly_plans').delete().eq('user_id', uid);
                 await supabase.from('favorite_recipes').delete().eq('user_id', uid);
                 await supabase.from('shopping_list_items').delete().eq('user_id', uid);
                 await supabase.from('pantry_items').delete().eq('user_id', uid);
                 await supabase.from('personal_recipes').delete().eq('user_id', uid);
                 await supabase.from('recipe_notes').delete().eq('user_id', uid);
                 await supabase.from('meal_templates').delete().eq('user_id', uid);
                 await supabase.from('user_preferences').delete().eq('user_id', uid);
                 await supabase.from('user_progress').delete().eq('user_id', uid);
                 await supabase.from('shopping_history').delete().eq('user_id', uid);
                 await supabase.from('client_meal_plans').delete().eq('client_id', uid); // Simplification: likely needs join
                 
                 // Finally delete from Auth (Requires Service Role)
                 await supabase.auth.admin.deleteUser(uid);
            }
        }

        return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
    } catch (error) {
        console.error("Cron Error:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
    }
});

