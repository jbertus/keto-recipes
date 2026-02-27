
import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

export default function CheckoutPage({ plan: propPlan }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Only proceed if user is logged in
    if (!user) {
        // If not logged in, redirect to login with return path
        navigate(`/login?returnTo=${encodeURIComponent(location.pathname)}`);
        return;
    }

    const initiateCheckout = async () => {
      try {
        const planToPurchase = propPlan;

        if (!planToPurchase) {
             throw new Error("No plan selected.");
        }

        toast({ title: "Initializing Checkout", description: `Preparing your ${planToPurchase} plan...` });

        const { data, error } = await supabase.functions.invoke('create-checkout-session', {
            body: { 
                plan: planToPurchase,
                userId: user.id,
                email: user.email 
            }
        });

        if (error) {
            console.error("Checkout error:", error);
            throw error;
        }

        if (data?.url) {
            window.location.href = data.url;
        } else {
             throw new Error("No checkout URL returned");
        }

      } catch (err) {
        console.error("Checkout failed:", err);
        toast({ 
            variant: "destructive", 
            title: "Checkout Failed", 
            description: err.message || "Could not start checkout session." 
        });
        navigate('/'); // Go home on error
      }
    };

    initiateCheckout();
  }, [user, propPlan, navigate, toast, location.pathname]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f172a] text-white">
      <Loader2 className="w-12 h-12 animate-spin text-cyan-500 mb-4" />
      <h2 className="text-xl font-semibold">Redirecting to Secure Checkout...</h2>
      <p className="text-slate-400 mt-2">Please wait while we connect to Stripe.</p>
    </div>
  );
}
