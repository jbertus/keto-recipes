
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "./cors.ts";

const SENDGRID_API_KEY = Deno.env.get("SENDGRID_API_KEY");

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const { email, subject, message, category, user_id } = await req.json();

  // Basic mock response if no API key (prevents crashing in dev)
  if (!SENDGRID_API_KEY) {
      console.log("Mock Email Sent:", { email, subject, message });
      return new Response(JSON.stringify({ success: true, mock: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
  }

  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SENDGRID_API_KEY}`,
    },
    body: JSON.stringify({
      personalizations: [
        {
          to: [{ email: "jeremy@ketocontractor.com" }],
          subject: `[${category}] ${subject}`,
        },
      ],
      from: { email: "support@ketocontractor.com" },
      content: [
        {
          type: "text/plain",
          value: `From: ${email} (User ID: ${user_id})\n\nCategory: ${category}\n\nMessage:\n${message}`,
        },
      ],
    }),
  });

  if (res.ok) {
     return new Response(JSON.stringify({ success: true }), {
       headers: { ...corsHeaders, "Content-Type": "application/json" },
     });
  } else {
     const error = await res.text();
     return new Response(JSON.stringify({ success: false, error }), {
       status: 400,
       headers: { ...corsHeaders, "Content-Type": "application/json" },
     });
  }
});
