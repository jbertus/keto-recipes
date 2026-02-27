
import { corsHeaders } from "./cors.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
  "https://tqjfcbulgtoimroqyxlo.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxamZjYnVsZ3RvaW1yb3F5eGxvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDk1NTEwNSwiZXhwIjoyMDg2NTMxMTA1fQ.SX3OAG9xRm7YrEpg9lODDZdGcZDIjkFdOAUpyCTwgG4"
);

    const { user_id, amount } = await req.json();

    if (!user_id || !amount) {
      throw new Error('Missing required fields: user_id, amount');
    }

    // Call the database function to add credits (assuming a function 'refund_units' or update direct)
    // Using simple update for now based on request, or better yet, using the existing DB logic
    
    // First, fetch current entitlements to determine which column to update
    const { data: entitlement, error: fetchError } = await supabase
      .from('entitlements')
      .select('plan, weekly_units_remaining, trial_units_remaining')
      .eq('user_id', user_id)
      .single();

    if (fetchError) throw fetchError;

    const isTrial = entitlement.plan === 'trial';
    const column = isTrial ? 'trial_units_remaining' : 'weekly_units_remaining';
    const currentAmount = entitlement[column] || 0;
    const newAmount = currentAmount + parseInt(amount);

    const { data: updated, error: updateError } = await supabase
      .from('entitlements')
      .update({ [column]: newAmount })
      .eq('user_id', user_id)
      .select()
      .single();

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({
        success: true,
        credits_added: parseInt(amount),
        new_balance: newAmount,
        target_column: column
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});

