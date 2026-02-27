
import { corsHeaders } from "./cors.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { email, type } = await req.json();

    // Check for API Key
    if (!RESEND_API_KEY) {
      console.error("Missing RESEND_API_KEY");
      // We return 200 with a warning to prevent UI crashes if key is missing in dev
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Email service not configured (Missing RESEND_API_KEY in Supabase Secrets). This is a simulation." 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Attempt to send email via Resend
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Keto Contractor <onboarding@resend.dev>",
        to: [email],
        subject: "Notifications Enabled ✅",
        html: `
          <div style="font-family: sans-serif; color: #333;">
            <h1 style="color: #0891b2;">Notifications Enabled!</h1>
            <p>Hi there,</p>
            <p>You have successfully enabled email notifications for your <strong>Keto Contractor</strong> account.</p>
            <p>We'll keep you updated with your weekly progress reports and important alerts.</p>
            <hr style="border: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 12px; color: #888;">If you did not make this change, please log in and check your account settings.</p>
          </div>
        `,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
        return new Response(
          JSON.stringify({ success: false, error: data }), 
          { status: res.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    return new Response(
      JSON.stringify({ success: true, data }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
