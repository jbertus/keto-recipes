
import { corsHeaders } from "./cors.ts";

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { api_key, provider } = await req.json();

    if (provider === 'openai') {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${api_key}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        return new Response(
          JSON.stringify({ valid: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        const errorData = await response.json();
        return new Response(
          JSON.stringify({ valid: false, error: errorData.error?.message || 'Unknown OpenAI error' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } else {
       return new Response(
          JSON.stringify({ valid: false, error: 'Unsupported provider' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error) {
    return new Response(
      JSON.stringify({ valid: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
