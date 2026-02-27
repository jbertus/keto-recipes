
import { corsHeaders } from "./cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const supabase = createClient(
  "https://tqjfcbulgtoimroqyxlo.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxamZjYnVsZ3RvaW1yb3F5eGxvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDk1NTEwNSwiZXhwIjoyMDg2NTMxMTA1fQ.SX3OAG9xRm7YrEpg9lODDZdGcZDIjkFdOAUpyCTwgG4"
);

const GOD_MODE_ADMINS = [
  "jbertus75@yahoo.com",
  "jeremy@ketocontractor.com"
];

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    const { error_count, window_start, top_reasons } = payload;

    // 1. Check Feature Flag
    const { data: settings } = await supabase
      .from("admin_settings")
      .select("enable_admin_alerts")
      .limit(1)
      .single();
    
    const isEnabled = settings?.enable_admin_alerts ?? true;

    if (!isEnabled) {
      console.log("Admin alerts disabled. Skipping email.");
      return new Response(JSON.stringify({ skipped: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Fetch Admin Emails
    const { data: adminProfiles, error: profileError } = await supabase
      .from("profiles")
      .select("email")
      .eq("role", "admin");
    
    if (profileError) throw profileError;

    const dbAdminEmails = adminProfiles.map(p => p.email).filter(Boolean);
    
    // 3. Deduplicate recipients
    const allRecipients = new Set([...GOD_MODE_ADMINS, ...dbAdminEmails]);
    const recipientsList = Array.from(allRecipients);

    if (recipientsList.length === 0) {
      return new Response(JSON.stringify({ message: "No recipients found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 4. Send Email (Mocking/Using Fetch to Resend)
    const emailBody = `
      <div style="font-family: sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #d32f2f;">System Alert: Error Threshold Breached</h2>
        <p><strong>${error_count} errors</strong> detected in the last hour.</p>
        <p><strong>Window Start:</strong> ${new Date(window_start).toLocaleString('en-US', { timeZone: 'America/Chicago' })} (US Central)</p>
        
        <h3>Top Error Reasons:</h3>
        <ul>
          ${(top_reasons || []).map((r: any) => `<li><strong>${r.count}x:</strong> ${r.reason}</li>`).join('')}
        </ul>

        <div style="margin-top: 20px;">
          <a href="${(Deno.env.get(\"SUPABASE_URL\") || '').replace('supabase.co', '')}/preferences?tab=system-events&severity=error" style="background-color: #d32f2f; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Event Logs</a>
        </div>
        
        <hr style="margin-top: 30px; border: 0; border-top: 1px solid #eee;" />
        <p style="font-size: 12px; color: #888;">This is an automated alert from Keto Contractor Admin System</p>
      </div>
    `;

    if (!RESEND_API_KEY) {
      console.log(`[MOCK EMAIL] To: ${recipientsList.join(", ")}`);
      console.log(`[MOCK EMAIL] Subject: 🚨 [Keto Contractor] Error Threshold Breached`);
      console.log(`[MOCK EMAIL] Body Preview: ${error_count} errors...`);
      
      return new Response(JSON.stringify({ mock_sent: true, recipients: recipientsList }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Keto Contractor Alerts <system@ketocontractor.com>",
        to: recipientsList,
        subject: "🚨 [Keto Contractor] Error Threshold Breached",
        html: emailBody,
      }),
    });

    const emailResult = await emailResponse.json();

    return new Response(JSON.stringify({ success: true, emailResult }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error sending alert:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

