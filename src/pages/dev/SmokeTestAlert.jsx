
import React, { useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, ShieldAlert } from 'lucide-react';
import { Navigate } from 'react-router-dom';

const SmokeTestAlert = () => {
  const { is_admin, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Production Safety Gate
  if (import.meta.env.PROD) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="text-center space-y-4">
          <ShieldAlert className="h-16 w-16 text-red-600 mx-auto" />
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-slate-400">This tool is not available in production environments.</p>
        </div>
      </div>
    );
  }

  // Admin Gate
  if (!authLoading && !is_admin) {
    return <Navigate to="/" replace />;
  }

  if (authLoading) return null;

  const handleCreateTestAlert = async () => {
    setLoading(true);
    try {
      // Create a test alert with a 1-hour window starting now
      const windowStart = new Date();
      const windowEnd = new Date(windowStart.getTime() + 60 * 60 * 1000); // 1 hour later

      const { data, error } = await supabase.from('admin_alerts').insert({
        window_start: windowStart.toISOString(),
        window_end: windowEnd.toISOString(),
        error_count: 1,
        metadata: { 
          title: 'Smoke Test Alert', 
          description: 'Manual test for acknowledge/snooze/resolve' 
        }
      }).select().single();

      if (error) throw error;

      toast({
        title: `✅ Test alert created: ${data.id}`,
        description: "You can now test acknowledge/snooze/resolve actions on the Admin Dashboard.",
      });
    } catch (err) {
      console.error('Error creating test alert:', err);
      toast({
        title: "Error creating alert",
        description: err.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-8 flex items-center justify-center">
      <Card className="w-full max-w-md bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-amber-500" />
            Smoke Test Generator
          </CardTitle>
          <CardDescription>
            Admin tool for validating alert workflows.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-amber-950/20 border border-amber-900/50 rounded-lg text-amber-200 text-sm">
            <p className="font-semibold mb-1">Warning</p>
            <p>This will create a real alert record in the database. Ensure you resolve it manually after testing.</p>
          </div>
          
          <Button 
            className="w-full bg-cyan-600 hover:bg-cyan-700" 
            onClick={handleCreateTestAlert}
            disabled={loading}
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Create Test Alert
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SmokeTestAlert;
