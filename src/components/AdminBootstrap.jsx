
import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Shield, Loader2, AlertCircle, CheckCircle, ArrowLeft, RefreshCw, Terminal } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AdminBootstrap() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState('idle'); // idle, processing, success, error
  const [logs, setLogs] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');

  // Helper to add logs with timestamp
  const addLog = (msg) => {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[AdminBootstrap] ${timestamp}: ${msg}`);
    setLogs(prev => [...prev, `[${timestamp}] ${msg}`]);
  };

  const runBootstrap = async () => {
    // Reset state for retry
    setErrorMsg('');
    setStatus('processing');
    setLogs([]); 
    
    addLog("Initializing bootstrap sequence...");

    if (!user) {
      addLog("ERROR: No authenticated user found in context.");
      setErrorMsg("No authenticated user found. Please ensure you are logged in.");
      setStatus('error');
      return;
    }

    addLog(`Target User ID: ${user.id}`);
    addLog(`Invoking Edge Function: 'bootstrap-admin-role'...`);

    try {
      // Invoke the Edge Function
      const { data, error } = await supabase.functions.invoke('bootstrap-admin-role', {
        body: {}, // Sending empty body as requested
        method: 'POST'
      });

      if (error) {
        addLog(`Function Invocation Error: ${error.message}`);
        throw new Error(error.message || 'Function invocation failed at network level');
      }

      addLog(`Response received from Edge Function.`);
      
      if (data && data.success) {
        addLog("SUCCESS: Function returned success flag.");
        addLog(`Verified Role: ${data.role}`);
        addLog(`Server Message: ${data.message}`);
        setStatus('success');
        
        // Auto-redirect countdown
        addLog("Redirecting to dashboard in 3 seconds...");
        setTimeout(() => {
          navigate('/admin/messages'); 
        }, 3000);
      } else {
        const serverError = data?.error || 'Unknown server error';
        addLog(`FAILURE: Server returned error: ${serverError}`);
        throw new Error(serverError);
      }

    } catch (err) {
      console.error("Bootstrap Fatal Error:", err);
      addLog(`FATAL ERROR: ${err.message}`);
      setErrorMsg(err.message);
      setStatus('error');
    }
  };

  // Run on mount if user is present
  useEffect(() => {
    addLog("Component mounted.");
    if (user) {
      runBootstrap();
    } else {
      addLog("Waiting for user session...");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  return (
    <div className="flex items-center justify-center min-h-[80vh] p-4 bg-slate-950/50">
      <Card className="w-full max-w-lg bg-slate-950 border-slate-800 shadow-2xl animate-in fade-in zoom-in-95 duration-300">
        <CardHeader className="text-center pb-2 border-b border-slate-900/50 bg-slate-900/20">
          <div className="mx-auto w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mb-4 ring-1 ring-purple-500/20">
            {status === 'processing' ? (
              <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
            ) : status === 'success' ? (
              <Shield className="w-8 h-8 text-emerald-400" />
            ) : (
              <Shield className="w-8 h-8 text-purple-400" />
            )}
          </div>
          <CardTitle className="text-xl text-white font-bold">Admin Privileges Setup</CardTitle>
          <CardDescription>Bootstrapping owner account via Edge Function</CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6 pt-6">
          
          {/* Status Indicators */}
          <div className="space-y-4">
            {status === 'idle' && (
              <div className="text-center text-slate-400 py-4">
                <p>Waiting for session initialization...</p>
              </div>
            )}

            {status === 'processing' && (
              <div className="flex flex-col items-center py-4 text-slate-400 space-y-3">
                <p className="animate-pulse">Contacting secure authorization server...</p>
                <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500/50 w-1/2 animate-[shimmer_2s_infinite]" />
                </div>
              </div>
            )}

            {status === 'success' && (
              <Alert className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400">
                <CheckCircle className="h-5 w-5 mt-0.5" />
                <div className="ml-2">
                  <AlertTitle className="text-lg font-semibold">Privileges Granted</AlertTitle>
                  <AlertDescription className="mt-1 text-sm opacity-90">
                    Your account has been successfully upgraded to <strong>Admin</strong>.
                    <p className="mt-2 text-xs opacity-70">Redirecting you to the command center...</p>
                  </AlertDescription>
                </div>
              </Alert>
            )}

            {status === 'error' && (
              <Alert variant="destructive" className="bg-red-950/30 border-red-900/50 text-red-400">
                <AlertCircle className="h-5 w-5 mt-0.5" />
                <div className="ml-2">
                  <AlertTitle className="text-lg font-semibold">Setup Failed</AlertTitle>
                  <AlertDescription className="mt-1 text-sm opacity-90 leading-relaxed break-words">
                    {errorMsg}
                  </AlertDescription>
                </div>
              </Alert>
            )}
          </div>

          {/* Detailed Logs Console */}
          <div className="rounded-lg overflow-hidden border border-slate-800 bg-black/40">
            <div className="flex items-center px-3 py-1.5 bg-slate-900/50 border-b border-slate-800 text-[10px] text-slate-500 font-mono uppercase tracking-wider">
              <Terminal className="w-3 h-3 mr-2" />
              System Logs
            </div>
            <div className="p-3 h-48 overflow-y-auto font-mono text-[11px] text-slate-400 shadow-inner space-y-1">
               {logs.length === 0 && <span className="opacity-30 italic">No logs yet...</span>}
               {logs.map((log, i) => (
                 <div key={i} className="border-b border-slate-800/30 last:border-0 pb-0.5 animate-in fade-in slide-in-from-left-1 duration-200">
                   <span className="text-purple-500/50 mr-2">➜</span>
                   {log}
                 </div>
               ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
             <Button 
                onClick={() => navigate('/')} 
                variant="outline"
                className="flex-1 border-slate-700 hover:bg-slate-800 text-slate-300 transition-all hover:text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Return to Home
              </Button>
             
             {status === 'error' && (
                <Button 
                  onClick={runBootstrap}
                  className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-900/20"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Retry Setup
                </Button>
             )}
          </div>
          
        </CardContent>
      </Card>
    </div>
  );
}
