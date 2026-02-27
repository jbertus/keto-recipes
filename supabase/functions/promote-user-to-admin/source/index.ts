
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.30.0';
import { corsHeaders } from "./cors.ts";

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
  "https://tqjfcbulgtoimroqyxlo.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxamZjYnVsZ3RvaW1yb3F5eGxvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDk1NTEwNSwiZXhwIjoyMDg2NTMxMTA1fQ.SX3OAG9xRm7YrEpg9lODDZdGcZDIjkFdOAUpyCTwgG4"
);

    const { target_email } = await req.json();

    if (!target_email) {
      return new Response(JSON.stringify({ error: 'target_email is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 1. Verify Caller is Admin via RPC
    const { data: isAdmin, error: rpcError } = await supabase.rpc('is_admin'); // Highlight: Calling is_admin() RPC
    
    if (rpcError || !isAdmin) {
      return new Response(JSON.stringify({ error: 'Unauthorized: Admin access required' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 2. Perform Promotion (Using Service Role for Write Access if needed, or RLS if policy allows update)
    const { data: profiles, error: findError } = await supabase
      .from('profiles')
      .select('user_id, role')
      .eq('email', target_email)
      .single();

    if (findError || !profiles) {
      return new Response(JSON.stringify({ error: 'User not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (profiles.role === 'admin') {
      return new Response(JSON.stringify({ message: 'User is already an admin', success: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('user_id', profiles.user_id);

    if (updateError) throw updateError;

    // 3. Audit Log
    const { data: userData } = await supabase.auth.getUser();
    
    await supabase.from('audit_logs').insert({ // Highlight: Writing to audit_logs table
      action: 'promote_to_admin',
      target_email: target_email,
      promoted_by: userData.user?.id, // ID of the admin who requested it
      details: { previous_role: profiles.role }
    });

    return new Response(JSON.stringify({ success: true, message: `Successfully promoted ${target_email} to admin` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

