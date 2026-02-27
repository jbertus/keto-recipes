
import { useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';

export function useCredits() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const consumeCredits = async (amount, purpose, meta = {}) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('consume_units', {
        p_purpose: purpose,
        p_units: amount,
        p_meta: meta
      });

      if (error) {
        // Handle specific Postgres Errors from our RPC
        if (error.message.includes('Insufficient')) {
           toast({
             variant: "destructive",
             title: "Insufficient Credits",
             description: "You don't have enough credits for this action. Please wait for your weekly reset or upgrade."
           });
           return false;
        }
        throw error;
      }

      return data; // Returns { success: true, remaining: 10, ... }
    } catch (err) {
      console.error("Credit consumption failed:", err);
      toast({
         variant: "destructive",
         title: "System Error",
         description: "Failed to verify credits. Please try again."
      });
      return false;
    } finally {
      setLoading(false);
    }
  };

  return { consumeCredits, loading };
}
