
import { corsHeaders } from "./cors.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Initialize Supabase client with Service Role Key for admin access
    const supabase = createClient(
  "https://tqjfcbulgtoimroqyxlo.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxamZjYnVsZ3RvaW1yb3F5eGxvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDk1NTEwNSwiZXhwIjoyMDg2NTMxMTA1fQ.SX3OAG9xRm7YrEpg9lODDZdGcZDIjkFdOAUpyCTwgG4"
);

    const { dry_run = true } = await req.json();

    console.log(`Starting cleanup. Dry run: ${dry_run}`);

    // 1. Fetch all weekly_plans
    const { data: plans, error: fetchError } = await supabase
      .from('weekly_plans')
      .select('user_id, week_start, updated_at');

    if (fetchError) {
      console.error("Fetch error:", fetchError);
      throw fetchError;
    }

    const corruptedRecords = [];
    const validRecords = [];

    // 2. Analyze records
    for (const plan of plans) {
      // Manual parsing to avoid timezone shifts affecting the check
      // Format is YYYY-MM-DD
      const parts = plan.week_start.split('-');
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
      const day = parseInt(parts[2], 10);
      
      // Create UTC date object
      const d = new Date(Date.UTC(year, month, day));
      
      // Check day of week (0 = Sunday)
      if (d.getUTCDay() !== 0) {
        corruptedRecords.push({
          ...plan,
          day_of_week: d.getUTCDay(), // 0=Sun, 1=Mon, etc.
          expected_day: "Sunday (0)"
        });
      } else {
        validRecords.push(plan);
      }
    }

    let message = "Dry run completed. No records deleted.";
    let deletedCount = 0;

    // 3. Execute deletion if not dry run
    if (!dry_run && corruptedRecords.length > 0) {
      console.log(`Deleting ${corruptedRecords.length} corrupted records...`);
      
      // Perform sequential deletions to ensure composite key matching accuracy
      // (Bulk deletion via 'in' filter is tricky with composite keys in basic postgrest)
      const deletePromises = corruptedRecords.map(record => 
        supabase
          .from('weekly_plans')
          .delete()
          .eq('user_id', record.user_id)
          .eq('week_start', record.week_start)
      );
      
      await Promise.all(deletePromises);
      
      message = "Cleanup complete. Corrupted records permanently deleted.";
      deletedCount = corruptedRecords.length;
    }

    return new Response(JSON.stringify({
      success: true,
      total_scanned: plans.length,
      corrupted_count: corruptedRecords.length,
      valid_count: validRecords.length,
      deleted_count: deletedCount,
      dry_run,
      message,
      corrupted_details: corruptedRecords
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("Error in cleanup function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

