
import { corsHeaders } from "./cors.ts";
import Stripe from 'https://esm.sh/stripe@12.18.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const endpointSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
const supabase = createClient(
  "https://tqjfcbulgtoimroqyxlo.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxamZjYnVsZ3RvaW1yb3F5eGxvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDk1NTEwNSwiZXhwIjoyMDg2NTMxMTA1fQ.SX3OAG9xRm7YrEpg9lODDZdGcZDIjkFdOAUpyCTwgG4"
);

Deno.serve(async (req) => {
  const signature = req.headers.get('stripe-signature');
  if (!signature || !endpointSecret) {
      return new Response('Webhook Error', { status: 400 });
  }

  const body = await req.text();
  let event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
  } catch (err) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const userId = session.client_reference_id;
      const plan = session.metadata?.plan || 'pro'; // Default to pro if missing
      
      if (!userId) {
          console.error("No user ID in webhook");
          return new Response('No User ID', { status: 200 });
      }

      // Fetch current profile for timezone and founders check
      const { data: profile } = await supabase.from('profiles').select('*').eq('user_id', userId).single();
      const timezone = profile?.timezone || 'UTC';

      // Task 1 & 4: Founders Logic & Provisioning
      let finalPlan = plan;
      let updateFoundersFlag = false;

      if (plan === 'founders') {
          if (profile?.ever_had_founders) {
              finalPlan = 'pro'; // Force to Pro
              // Log enforcement
              await supabase.from('credit_events').insert({
                  user_id: userId,
                  event_type: 'founders_enforcement',
                  purpose: 'plan_override',
                  meta: { original_plan: 'founders', new_plan: 'pro' },
                  success: true
              });
          } else {
              updateFoundersFlag = true;
          }
      }

      // Prepare Update Data
      const now = new Date();
      // Calculate next Sunday (or reset day) at 00:00 in user timezone
      // Simplified: Just +7 days for now, exact timezone math requires heavier libraries usually
      const nextReset = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      // Entitlements Config
      const entitlementsUpdate = {
          user_id: userId,
          plan: finalPlan,
          updated_at: now.toISOString(),
          next_reset_at: nextReset.toISOString()
      };

      // Provisioning Logic (Task 4)
      if (finalPlan === 'trial') {
          entitlementsUpdate.trial_units_remaining = 10;
          entitlementsUpdate.trial_expires_at = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
      } else if (finalPlan === 'pro') {
          entitlementsUpdate.weekly_unit_allowance = 50;
          entitlementsUpdate.weekly_units_remaining = 50;
          entitlementsUpdate.priority_allowance = 0; // Task 7
          entitlementsUpdate.priority_remaining = 0;
      } else if (finalPlan === 'elite') {
          entitlementsUpdate.weekly_unit_allowance = 200;
          entitlementsUpdate.weekly_units_remaining = 200;
          entitlementsUpdate.priority_allowance = 10; // Task 7
          entitlementsUpdate.priority_remaining = 10;
      } else if (finalPlan === 'founders') {
          entitlementsUpdate.weekly_unit_allowance = 100;
          entitlementsUpdate.weekly_units_remaining = 100;
          entitlementsUpdate.priority_allowance = 0;
          entitlementsUpdate.priority_remaining = 0;
      }

      // Update Entitlements
      await supabase.from('entitlements').upsert(entitlementsUpdate, { onConflict: 'user_id' });

      // Update Profile (Task 4)
      const profileUpdates = {
          stripe_subscription_id: session.subscription,
          paid_started_at: now.toISOString(),
          inactive: false, // Reactivate if they were inactive
          inactive_expires_at: null
      };

      if (updateFoundersFlag) {
          profileUpdates.ever_had_founders = true;
      }

      await supabase.from('profiles').update(profileUpdates).eq('user_id', userId);

      // Update Feature Toggles (Task 8 & 10)
      const togglesUpdate = {
          user_id: userId,
          updated_at: now.toISOString()
      };

      if (finalPlan === 'elite') {
          togglesUpdate.batch_cook_mode = true;
          togglesUpdate.strict_protocol_programs = true;
          togglesUpdate.family_mode = true;
      } else {
          togglesUpdate.batch_cook_mode = false;
          togglesUpdate.strict_protocol_programs = false;
          togglesUpdate.family_mode = false;
      }

      await supabase.from('feature_toggles').upsert(togglesUpdate, { onConflict: 'user_id' });

      // Log Success
      await supabase.from('credit_events').insert({
          user_id: userId,
          event_type: 'stripe_payment_success',
          purpose: 'subscription_provisioning',
          meta: { plan: finalPlan, sessionId: session.id },
          success: true
      });
  }

  return new Response('Received', { status: 200 });
});

