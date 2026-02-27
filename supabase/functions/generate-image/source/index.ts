import { corsHeaders } from "./cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { prompt, recipeName, id } = await req.json();

    if (!prompt) {
      throw new Error('Prompt is required');
    }

    const openAiKey = Deno.env.get('AI');
    if (!openAiKey) {
      throw new Error('OpenAI API key not configured');
    }

    console.log(`Generating image for: ${recipeName}`);

    // 1. Generate Image with DALL-E 3
    // We use a detailed prompt to ensure consistent, high-quality food photography style
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: `Professional food photography of ${recipeName}. ${prompt}. The dish is beautifully plated on a dark matte table, cinematic lighting, shallow depth of field, 8k resolution, photorealistic, appetizing.`,
        n: 1,
        size: "1024x1024",
        response_format: "b64_json",
        quality: "standard", 
        style: "natural"
      }),
    });

    const data = await response.json();
    
    if (data.error) {
      console.error('OpenAI Error:', data.error);
      throw new Error(data.error.message);
    }

    if (!data.data || !data.data[0] || !data.data[0].b64_json) {
      throw new Error('No image data received from OpenAI');
    }

    const imageBase64 = data.data[0].b64_json;

    // 2. Upload to Supabase Storage
    const supabase = createClient(
  "https://tqjfcbulgtoimroqyxlo.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxamZjYnVsZ3RvaW1yb3F5eGxvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDk1NTEwNSwiZXhwIjoyMDg2NTMxMTA1fQ.SX3OAG9xRm7YrEpg9lODDZdGcZDIjkFdOAUpyCTwgG4"
);

    // Convert base64 to Uint8Array for upload
    const binaryString = atob(imageBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    const fileName = `ai-generated/${id || Date.now()}.png`;
    
    // Upload with upsert
    const { error: uploadError } = await supabase
      .storage
      .from('recipe-images')
      .upload(fileName, bytes, {
        contentType: 'image/png',
        upsert: true
      });

    if (uploadError) {
      console.error('Storage Upload Error:', uploadError);
      throw uploadError;
    }

    // 3. Get Public URL
    const { data: { publicUrl } } = supabase
      .storage
      .from('recipe-images')
      .getPublicUrl(fileName);

    return new Response(
      JSON.stringify({ imageUrl: publicUrl, success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Function Error:', error.message);
    return new Response(
      JSON.stringify({ error: error.message, success: false }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
