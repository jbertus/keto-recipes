
import { corsHeaders } from "./cors.ts";

// Task 6: SendGrid Email Sender
const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY');

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { userId, email, graceEndDate } = await req.json();

    if (!SENDGRID_API_KEY) {
        console.warn("No SendGrid Key provided. Skipping email.");
        return new Response(JSON.stringify({ success: false, message: 'No API Key' }), { headers: corsHeaders });
    }

    const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${SENDGRID_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            personalizations: [{ to: [{ email: email }] }],
            from: { email: 'noreply@ketocontractor.com', name: 'Keto Contractor' },
            subject: 'Your Keto Contractor trial is ending - Reactivate now',
            content: [{
                type: 'text/html',
                value: `
                    <h1>Don't lose your progress!</h1>
                    <p>Your trial has ended. You have until <strong>${new Date(graceEndDate).toLocaleDateString()}</strong> to reactivate your account before your data is permanently deleted.</p>
                    <p>
                        <a href="https://ketocontractor.com/pro">Upgrade to Pro ($49/mo)</a><br/>
                        <a href="https://ketocontractor.com/elite">Get Elite Access ($99/mo)</a><br/>
                        <a href="https://ketocontractor.com/founders">Founders Lifetime ($29/mo)</a>
                    </p>
                `
            }]
        })
    });

    if (!res.ok) {
        throw new Error(`SendGrid Error: ${await res.text()}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
