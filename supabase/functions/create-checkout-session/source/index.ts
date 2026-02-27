
import { corsHeaders } from "./cors.ts";
// In a real edge function, you'd import Stripe from 'https://esm.sh/stripe@11.1.0?target=deno'
// For this environment, we mock the logic or assume the import is handled by the platform.

import Stripe from 'https://esm.sh/stripe@12.18.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});
const supabase = createClient(
  "https://tqjfcbulgtoimroqyxlo.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRxamZjYnVsZ3RvaW1yb3F5eGxvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDk1NTEwNSwiZXhwIjoyMDg2NTMxMTA1fQ.SX3OAG9xRm7YrEpg9lODDZdGcZDIjkFdOAUpyCTwgG4"
);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { plan, userId, email } = await req.json();

    if (!plan || !userId) {
      throw new Error('Missing plan or userId');
    }

    // Founders "For Life" Check (Task 1, 3)
    let finalPlan = plan;
    if (plan === 'founders') {
        const { data: profile } = await supabase
            .from('profiles')
            .select('ever_had_founders')
            .eq('user_id', userId)
            .single();
        
        if (profile?.ever_had_founders) {
            // Force upgrade to Pro if they already had founders
            finalPlan = 'pro'; 
        }
    }

    // Pricing Config (Tasks 2, 3)
    const prices = {
        'trial': { amount: 100, name: '7-Day Trial', interval: null }, // $1 one time
        'pro': { amount: 4900, name: 'Pro Plan', interval: 'month' },
        'elite': { amount: 9900, name: 'Elite Plan', interval: 'month' },
        'founders': { amount: 2900, name: 'Founders Plan', interval: 'month' } // Subscription, not one-time based on "lifetime" usually implies one-time but prompt says "$29/mo lifetime" which usually means locked price. Assuming subscription.
    };

    const selectedPrice = prices[finalPlan];
    if (!selectedPrice) throw new Error('Invalid plan selected');

    // Create session
    const sessionConfig = {
      customer_email: email,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: selectedPrice.name,
              metadata: { plan: finalPlan } // Store plan in product for reference
            },
            unit_amount: selectedPrice.amount,
            ...(selectedPrice.interval ? { recurring: { interval: selectedPrice.interval } } : {})
          },
          quantity: 1,
        },
      ],
      mode: selectedPrice.interval ? 'subscription' : 'payment',
      success_url: 'https://ketocontractor.com/?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: 'https://ketocontractor.com/',
      client_reference_id: userId,
      metadata: {
        plan: finalPlan, // Store requested plan here
        user_id: userId
      },
    };

    const session = await stripe.checkout.sessions.create(sessionConfig);

    return new Response(JSON.stringify({ sessionId: session.id, url: session.url }), {
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

