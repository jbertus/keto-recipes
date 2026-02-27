
import { corsHeaders } from "./cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabase = createClient(
  "https://tqjfcbulgtoimroqyxlo.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxamZjYnVsZ3RvaW1yb3F5eGxvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDk1NTEwNSwiZXhwIjoyMDg2NTMxMTA1fQ.SX3OAG9xRm7YrEpg9lODDZdGcZDIjkFdOAUpyCTwgG4"
);

  try {
    const { model, messages, temperature, max_tokens, purpose, user_id } = await req.json();

    // 1. Get Active API Key
    // Try to get from database first (Admin configured keys)
    let apiKey = Deno.env.get('OPENAI_API_KEY');
    
    // Attempt to fetch from api_keys table if service role has access (it does)
    const { data: dbKeys } = await supabase
      .from('api_keys')
      .select('key_value')
      .eq('is_active', true)
      .eq('key_name', 'OpenAI Prod') // Or standard naming convention
      .limit(1);
    
    // If not found by specific name, just take any active one
    if (!dbKeys?.length) {
         const { data: anyKeys } = await supabase.from('api_keys').select('key_value').eq('is_active', true).limit(1);
         if (anyKeys?.length) apiKey = anyKeys[0].key_value;
    } else {
         apiKey = dbKeys[0].key_value;
    }

    if (!apiKey) {
      throw new Error("No active OpenAI API key configuration found.");
    }

    // 2. Make Request
    const startTime = Date.now();
    const openAiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens
      })
    });

    const data = await openAiResponse.json();

    if (!openAiResponse.ok) {
      throw new Error(data.error?.message || "OpenAI API Error");
    }

    // 3. Log Audit
    const inputStr = JSON.stringify(messages);
    // Simple hash for demo
    let hash = 0;
    for (let i = 0; i < inputStr.length; i++) {
        const char = inputStr.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    const payloadHash = hash.toString();

    const tokens = data.usage?.total_tokens || 0;
    // Rough estimation
    const cost = (tokens / 1000) * 0.002; 

    // Async log to audit table
    await supabase.from('ai_audit_log').insert({
      provider: 'openai',
      model: model,
      purpose: purpose || 'general',
      payload_hash: payloadHash,
      user_id: user_id,
      token_count: tokens,
      cost_estimate: cost
    });
    
    // Async log to jobs table
    await supabase.from('ai_jobs').insert({
       user_id: user_id,
       provider: 'openai',
       model: model,
       purpose: purpose || 'general',
       status: 'completed',
       token_count: tokens,
       cost_estimate: cost,
       created_at: new Date(startTime).toISOString(),
       completed_at: new Date().toISOString()
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        data: data,
        tokens_used: tokens,
        cost_estimate: cost
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

