
import { useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/SupabaseAuthContext';

export default function useAIIntegration() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const validateApiKey = async (apiKey, provider) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('validate-ai-key', {
        body: { api_key: apiKey, provider }
      });

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Validation error:', err);
      return { valid: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const sendOpenAIRequest = async ({ model, messages, temperature = 0.7, max_tokens = 1000, purpose = 'general' }) => {
    setLoading(true);
    
    // Check opt-in unless admin (who might be testing)
    if (user?.role !== 'admin') {
      const { data: profile } = await supabase
        .from('profiles')
        .select('ai_opt_in')
        .eq('user_id', user.id)
        .single();
      
      if (!profile?.ai_opt_in) {
        setLoading(false);
        throw new Error("AI features are not enabled for your account. Please opt-in via settings.");
      }
    }

    try {
      const { data, error } = await supabase.functions.invoke('send-openai-request', {
        body: { 
          model, 
          messages, 
          temperature, 
          max_tokens, 
          purpose, 
          user_id: user?.id 
        }
      });

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('AI Request error:', err);
      toast({
        title: "AI Request Failed",
        description: err.message || "Could not complete the request.",
        variant: "destructive"
      });
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logAuditEvent = async (eventData) => {
    try {
      await supabase.functions.invoke('log-ai-audit', {
        body: { ...eventData, user_id: user?.id }
      });
    } catch (err) {
      console.error('Failed to log audit event:', err);
      // Fail silently to not disrupt user flow
    }
  };

  return {
    validateApiKey,
    sendOpenAIRequest,
    logAuditEvent,
    loading
  };
}
