
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "./cors.ts";

Deno.serve(async (req) => {
  // 1. Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 2. Get body parameters
    const { owner_email } = await req.json();

    if (!owner_email) {
      throw new Error('owner_email is required in request body');
    }

    // 3. Create Supabase client with Service Role Key to bypass RLS
    // This gives us full admin access to the database

    if (!supabaseServiceKey) {
      throw new Error('Server configuration error: Missing Service Role Key');
    }

    const supabase = createClient(
  "https://tqjfcbulgtoimroqyxlo.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxamZjYnVsZ3RvaW1yb3F5eGxvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDk1NTEwNSwiZXhwIjoyMDg2NTMxMTA1fQ.SX3OAG9xRm7YrEpg9lODDZdGcZDIjkFdOAUpyCTwgG4"
);
    console.log(`Checking admin status for email: ${owner_email}`);

    // 4. Query profile by email
    const { data: profile, error: fetchError } = await supabase
      .from('profiles')
      .select('user_id, role, email')
      .eq('email', owner_email)
      .single();

    if (fetchError) {
      // If code is PGRST116, row not found
      if (fetchError.code === 'PGRST116') {
        return new Response(
          JSON.stringify({ success: false, error: `User not found with email: ${owner_email}` }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
        );
      }
      throw new Error(`Database error fetching profile: ${fetchError.message}`);
    }

    // 5. Check and Update Role
    let was_admin = false;
    let message = '';

    if (profile.role === 'admin') {
      was_admin = true;
      message = `User ${owner_email} is already an admin.`;
    } else {
      // Perform the update
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ 
          role: 'admin',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', profile.user_id);

      if (updateError) {
        throw new Error(`Failed to update role: ${updateError.message}`);
      }
      message = `Successfully promoted ${owner_email} to admin.`;
    }

    // 6. Return success
    return new Response(
      JSON.stringify({ 
        success: true, 
        was_admin,
        message,
        user_id: profile.user_id,
        email: profile.email
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error("Ensure Admin Error:", error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});

