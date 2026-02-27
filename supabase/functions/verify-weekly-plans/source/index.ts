
import { corsHeaders } from "./cors.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
  "https://tqjfcbulgtoimroqyxlo.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxamZjYnVsZ3RvaW1yb3F5eGxvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDk1NTEwNSwiZXhwIjoyMDg2NTMxMTA1fQ.SX3OAG9xRm7YrEpg9lODDZdGcZDIjkFdOAUpyCTwgG4"
);

    const { data: plans, error } = await supabase
      .from('weekly_plans')
      .select('user_id, week_start');

    if (error) throw error;

    const invalidRecords = [];
    
    for (const plan of plans) {
       const parts = plan.week_start.split('-');
       const year = parseInt(parts[0], 10);
       const month = parseInt(parts[1], 10) - 1;
       const day = parseInt(parts[2], 10);
       const d = new Date(Date.UTC(year, month, day));
       
       if (d.getUTCDay() !== 0) {
         invalidRecords.push({
           ...plan,
           actual_day_index: d.getUTCDay()
         });
       }
    }

    const isAllValid = invalidRecords.length === 0;

    return new Response(JSON.stringify({
      success: true,
      total_records: plans.length,
      all_valid: isAllValid,
      invalid_count: invalidRecords.length,
      invalid_records: invalidRecords,
      summary: isAllValid 
        ? "✅ All weekly_plans records are valid Sundays." 
        : `❌ Found ${invalidRecords.length} invalid records.`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})

