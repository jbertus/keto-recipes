
import { corsHeaders } from "./cors.ts";

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { message, history } = await req.json();
    const apiKey = Deno.env.get('AI');

    if (!apiKey) {
      throw new Error('AI API key not configured');
    }

    // System prompt to guide the AI's behavior
    const messages = [
      { 
        role: 'system', 
        content: `You are 'Foundry', an advanced Keto diet culinary assistant. 
        Your goal is to help users generate recipes and plan meals.
        - Keep your responses concise and conversational (under 40 words preferably) so they are easy to listen to via text-to-speech.
        - Be encouraging and enthusiastic about the keto lifestyle.
        - If the user asks for recipes, confirm you can generate them.` 
      },
      ...(history || []),
      { role: 'user', content: message }
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Efficient, fast model for voice interactions
        messages: messages,
        temperature: 0.7,
        max_tokens: 150,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`OpenAI API error: ${errorData}`);
    }

    const data = await response.json();
    const reply = data.choices[0].message.content;

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in chat-gpt function:', error);
    return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
