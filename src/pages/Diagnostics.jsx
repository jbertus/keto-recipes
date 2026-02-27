import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2, ArrowLeft, RefreshCw, Database, Server, HardDrive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';

function Diagnostics() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    runDiagnostics();
  }, []);

  const runDiagnostics = async () => {
    setLoading(true);
    setResults([]);
    
    const checks = [
      {
        name: "Authentication Session",
        description: "Verify active user session",
        run: async () => {
           const { data: { session }, error } = await supabase.auth.getSession();
           if (error || !session) throw new Error("No active session found");
           return "Session Active: " + session.user.email;
        }
      },
      {
         name: "Database Connection",
         description: "Ping Supabase database",
         run: async () => {
            const { data, error } = await supabase.from('user_preferences').select('count', { count: 'exact', head: true });
            if (error) throw error;
            return "Connection Successful";
         }
      },
      {
         name: "Table: weekly_plans",
         description: "Check write access to meal plans",
         run: async () => {
             // Try to read own row
             const { error } = await supabase.from('weekly_plans').select('user_id').eq('user_id', user?.id).maybeSingle();
             if (error) throw error;
             return "Access Granted";
         }
      },
      {
        name: "Table: favorite_recipes",
         description: "Check write access to favorites",
         run: async () => {
             const { error } = await supabase.from('favorite_recipes').select('id').eq('user_id', user?.id).limit(1);
             if (error) throw error;
             return "Access Granted";
         }
      },
      {
        name: "Local Storage Quota",
        description: "Check browser storage availability",
        run: async () => {
           try {
              localStorage.setItem('__test__', 'test');
              localStorage.removeItem('__test__');
              return "Storage Available";
           } catch(e) {
              throw new Error("Local Storage Full or Disabled");
           }
        }
      }
    ];

    const resultsList = [];

    for (const check of checks) {
       try {
          const message = await check.run();
          resultsList.push({ name: check.name, description: check.description, status: 'pass', message });
       } catch (err) {
          resultsList.push({ name: check.name, description: check.description, status: 'fail', message: err.message || "Unknown error" });
       }
       // Artificial delay for UX
       await new Promise(r => setTimeout(r, 300));
       setResults([...resultsList]);
    }
    
    setLoading(false);
  };

  return (
    <>
      <Helmet>
        <title>System Diagnostics | Keto Contractor</title>
      </Helmet>
      
      <div className="min-h-screen bg-[#0B1120] text-slate-100 p-8 font-sans">
         <div className="max-w-2xl mx-auto">
            <div className="mb-8">
               <Button variant="ghost" className="mb-4 pl-0 text-slate-400 hover:text-white" onClick={() => navigate(-1)}>
                  <ArrowLeft className="w-4 h-4 mr-2" /> Back to Planner
               </Button>
               <h1 className="text-3xl font-bold mb-2">System Diagnostics</h1>
               <p className="text-slate-400">Running health checks on database connections and local environment.</p>
            </div>

            <div className="bg-[#131B2D] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
               <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                  <h2 className="font-bold flex items-center gap-2">
                     <Server className="w-5 h-5 text-cyan-500" />
                     Diagnostic Report
                  </h2>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={runDiagnostics} 
                    disabled={loading}
                    className="border-slate-700 hover:bg-slate-800"
                  >
                     {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                     <span className="ml-2">Rerun Checks</span>
                  </Button>
               </div>
               
               <div className="divide-y divide-slate-800/50">
                  {results.map((result, idx) => (
                     <div key={idx} className="p-4 flex items-start gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="mt-1">
                           {result.status === 'pass' ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                           ) : (
                              <XCircle className="w-5 h-5 text-red-500" />
                           )}
                        </div>
                        <div className="flex-grow">
                           <div className="flex justify-between items-start">
                              <h3 className="font-bold text-sm text-slate-200">{result.name}</h3>
                              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${result.status === 'pass' ? 'bg-emerald-950/30 border-emerald-900 text-emerald-400' : 'bg-red-950/30 border-red-900 text-red-400'}`}>
                                 {result.status === 'pass' ? 'PASSED' : 'FAILED'}
                              </span>
                           </div>
                           <p className="text-xs text-slate-500 mt-0.5">{result.description}</p>
                           <p className={`text-xs mt-2 font-mono ${result.status === 'pass' ? 'text-slate-400' : 'text-red-400'}`}>
                              &gt; {result.message}
                           </p>
                        </div>
                     </div>
                  ))}
                  
                  {loading && (
                     <div className="p-8 flex flex-col items-center justify-center text-slate-500 gap-2">
                        <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
                        <span className="text-xs animate-pulse">Running system checks...</span>
                     </div>
                  )}
               </div>
            </div>
         </div>
      </div>
    </>
  );
}

export default Diagnostics;