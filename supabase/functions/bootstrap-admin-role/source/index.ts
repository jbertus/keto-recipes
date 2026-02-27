
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "./cors.ts";

Deno.serve(async (req) => {
  // 1. Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 2. Get the Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing Authorization header');
    }

    // 3. Create Supabase client with Service Role Key to bypass RLS
    // CRITICAL: We need service role to update the 'role' column which is likely protected

    if (!supabaseServiceKey) {
      throw new Error('Server configuration error: Missing Service Role Key');
    }

    const supabase = createClient(
  "https://tqjfcbulgtoimroqyxlo.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxamZjYnVsZ3RvaW1yb3F5eGxvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDk1NTEwNSwiZXhwIjoyMDg2NTMxMTA1fQ.SX3OAG9xRm7YrEpg9lODDZdGcZDIjkFdOAUpyCTwgG4"
);

    // 4. Verify the user securely using the token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized: Invalid token', details: userError }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      );
    }

    const userId = user.id;
    console.log(`Bootstrapping admin role for user: ${userId}`);

    // 5. Update role to 'admin' using elevated privileges
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ 
        role: 'admin', 
        updated_at: new Date().toISOString() 
      })
      .eq('user_id', userId);

    if (updateError) {
      throw new Error(`Failed to update role in database: ${updateError.message}`);
    }

    // 6. Verify the change
    const { data: updatedProfile, error: verifyError } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', userId)
      .single();

    if (verifyError) {
      throw new Error(`Verification failed: ${verifyError.message}`);
    }

    if (updatedProfile?.role !== 'admin') {
      throw new Error(`Update appeared to succeed but role is currently '${updatedProfile?.role}'.`);
    }

    // 7. Return success
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Admin role successfully assigned", 
        user_id: userId, 
        role: updatedProfile.role 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error("Bootstrap error:", error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});

