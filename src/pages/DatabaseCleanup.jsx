import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { AlertTriangle, CheckCircle, Database, Trash2, Search, Loader2, Download, X, ArrowLeft } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Link } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { format, parseISO } from 'date-fns';

export default function DatabaseCleanup() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [verificationResult, setVerificationResult] = useState(null);
  const { toast } = useToast();

  // Helper to clear previous state before new operation
  const resetState = () => {
    setResults(null);
    setVerificationResult(null);
  };

  const runCleanup = async (isDryRun) => {
    setLoading(true);
    resetState();
    
    try {
      console.log(`Invoking cleanup-weekly-plans, dry_run=${isDryRun}`);
      
      const { data, error } = await supabase.functions.invoke('cleanup-weekly-plans', {
        body: { dry_run: isDryRun }
      });

      if (error) {
        // Handle Edge Function specific errors
        console.error("Edge Function Error:", error);
        throw new Error(error.message || "Edge function invocation failed");
      }

      console.log("Cleanup Response:", data);
      setResults(data);
      
      if (!isDryRun) {
        toast({
          title: "Cleanup Executed",
          description: data.message || "Corrupted records deleted successfully.",
          className: "bg-green-600 text-white border-none"
        });
      } else {
        toast({
          title: "Preview Generated",
          description: `Found ${data.corrupted_count} corrupted records.`,
        });
      }

    } catch (err) {
      console.error('Cleanup failed:', err);
      toast({
        variant: "destructive",
        title: "Operation Failed",
        description: err.message || "Could not contact cleanup service. Check console for details."
      });
    } finally {
      setLoading(false);
    }
  };

  const runVerification = async () => {
    setLoading(true);
    resetState();

    try {
      const { data, error } = await supabase.functions.invoke('verify-weekly-plans');
      
      if (error) {
         console.error("Verification Edge Function Error:", error);
         throw new Error(error.message || "Verification failed");
      }

      setVerificationResult(data);
      
      toast({
        title: data.all_valid ? "Verification Passed" : "Verification Failed",
        description: data.summary,
        variant: data.all_valid ? "default" : "destructive",
        className: data.all_valid ? "bg-green-600 text-white border-none" : ""
      });
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Verification Error",
        description: err.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const dataToExport = results || verificationResult;
    if (!dataToExport) return;

    const jsonString = `data:text/json;chatset=utf-8,${encodeURIComponent(
      JSON.stringify(dataToExport, null, 2)
    )}`;
    const link = document.createElement("a");
    link.href = jsonString;
    link.download = `database_cleanup_results_${new Date().toISOString()}.json`;
    link.click();
  };

  const handleClearResults = () => {
    resetState();
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl space-y-8 animate-in fade-in duration-500">
      <Helmet>
        <title>Database Cleanup | Admin</title>
      </Helmet>
      
      <div className="flex items-center gap-2 mb-4">
        <Link to="/preferences?tab=general">
           <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back to Preferences
           </Button>
        </Link>
      </div>

      <div className="flex items-center gap-4 border-b border-slate-800 pb-6">
        <div className="p-3 bg-red-950/30 rounded-lg border border-red-900/50">
           <Database className="w-8 h-8 text-red-500" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-white">Database Cleanup Utility</h1>
          <p className="text-slate-400">Identify and remove corrupted `weekly_plans` records with invalid week_start dates.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Control Panel */}
        <Card className="lg:col-span-1 bg-slate-900 border-slate-800 h-fit">
          <CardHeader>
            <CardTitle>Actions</CardTitle>
            <CardDescription>Select an operation to perform.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
             <Button 
               variant="outline" 
               className="w-full justify-start border-slate-700 hover:bg-slate-800 text-slate-300"
               onClick={() => runCleanup(true)}
               disabled={loading}
             >
               {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <Search className="w-4 h-4 mr-2 text-cyan-500"/>}
               Preview Changes (Dry Run)
             </Button>

             <AlertDialog>
               <AlertDialogTrigger asChild>
                 <Button 
                   className="w-full justify-start bg-red-900/50 hover:bg-red-900 text-red-200 border border-red-900"
                   disabled={loading}
                 >
                   <Trash2 className="w-4 h-4 mr-2"/>
                   CONFIRM DELETE RECORDS
                 </Button>
               </AlertDialogTrigger>
               <AlertDialogContent className="bg-slate-900 border-slate-800 text-white">
                 <AlertDialogHeader>
                   <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                   <AlertDialogDescription>
                     This action will permanently delete all weekly_plan records where week_start is NOT a Sunday.
                     This action cannot be undone.
                   </AlertDialogDescription>
                 </AlertDialogHeader>
                 <AlertDialogFooter>
                   <AlertDialogCancel className="bg-slate-800 text-white border-slate-700 hover:bg-slate-700">Cancel</AlertDialogCancel>
                   <AlertDialogAction 
                     className="bg-red-600 hover:bg-red-700 text-white border-none"
                     onClick={() => runCleanup(false)}
                   >
                     Yes, Delete Corrupted Data
                   </AlertDialogAction>
                 </AlertDialogFooter>
               </AlertDialogContent>
             </AlertDialog>

             <div className="h-px bg-slate-800 my-4" />

             <Button 
               variant="secondary" 
               className="w-full justify-start bg-emerald-900/30 text-emerald-400 hover:bg-emerald-900/50 border border-emerald-900/50"
               onClick={runVerification}
               disabled={loading}
             >
               {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin"/> : <CheckCircle className="w-4 h-4 mr-2"/>}
               Verify Database Integrity
             </Button>
          </CardContent>
        </Card>

        {/* Results Panel */}
        <Card className="lg:col-span-2 bg-slate-900 border-slate-800 min-h-[500px] flex flex-col">
           <CardHeader className="border-b border-slate-800 pb-4">
             <div className="flex justify-between items-center">
               <CardTitle>Results Output</CardTitle>
               <div className="flex items-center gap-2">
                 {(results || verificationResult) && (
                   <>
                      <Button variant="outline" size="sm" onClick={handleExport} className="h-8 text-xs border-slate-700">
                        <Download className="w-3 h-3 mr-1" /> Export JSON
                      </Button>
                      <Button variant="ghost" size="sm" onClick={handleClearResults} className="h-8 w-8 p-0 text-slate-500 hover:text-white">
                        <X className="w-4 h-4" />
                      </Button>
                   </>
                 )}
               </div>
             </div>
             {(results || verificationResult) && (
                <div className="flex items-center gap-2 mt-2">
                   <Badge variant={results ? (results.dry_run ? "outline" : "destructive") : "default"} className={verificationResult ? "bg-emerald-600 border-none" : ""}>
                     {results 
                       ? (results.dry_run ? "PREVIEW MODE" : "LIVE EXECUTION") 
                       : "VERIFICATION REPORT"
                     }
                   </Badge>
                   <span className="text-xs text-slate-500 font-mono">
                     {new Date().toLocaleTimeString()}
                   </span>
                </div>
             )}
           </CardHeader>
           
           <CardContent className="flex-1 overflow-auto p-0">
              {/* Empty State */}
              {!results && !verificationResult && (
                <div className="flex flex-col items-center justify-center h-full min-h-[300px] text-slate-500">
                  <Database className="w-16 h-16 mb-4 opacity-10" />
                  <p className="font-medium">No results yet.</p>
                  <p className="text-sm opacity-60">Run a preview or verification to scan the database.</p>
                </div>
              )}

              {/* Cleanup Results View */}
              {results && (
                <div className="p-6 space-y-8">
                   <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="p-4 bg-slate-950 rounded-lg border border-slate-800 text-center">
                        <div className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">Total Scanned</div>
                        <div className="text-3xl font-bold text-white">{results.total_scanned}</div>
                      </div>
                      <div className="p-4 bg-red-950/20 rounded-lg border border-red-900/30 text-center">
                        <div className="text-red-400 text-xs font-bold uppercase tracking-wider mb-1">Corrupted</div>
                        <div className="text-3xl font-bold text-red-500">{results.corrupted_count}</div>
                      </div>
                      <div className="p-4 bg-emerald-950/20 rounded-lg border border-emerald-900/30 text-center">
                        <div className="text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">Valid</div>
                        <div className="text-3xl font-bold text-emerald-500">{results.valid_count}</div>
                      </div>
                   </div>

                   {/* Success Message for Deletion */}
                   {!results.dry_run && results.deleted_count > 0 && (
                      <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-3 text-green-400 animate-in fade-in zoom-in-95">
                         <div className="bg-green-500/20 p-2 rounded-full">
                            <CheckCircle className="w-6 h-6" />
                         </div>
                         <div>
                            <p className="font-bold text-lg">Cleanup Successful</p>
                            <p className="text-sm opacity-90">Permanently deleted {results.deleted_count} invalid records from the database.</p>
                         </div>
                      </div>
                   )}

                   {/* Corrupted Records Table */}
                   {results.corrupted_details?.length > 0 ? (
                     <div className="space-y-3">
                        <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                           <AlertTriangle className="w-4 h-4 text-amber-500" />
                           {results.dry_run ? "Records Targeted for Deletion" : "Deleted Records Log"}
                        </h3>
                        <div className="border border-slate-800 rounded-lg overflow-hidden">
                          <Table>
                            <TableHeader className="bg-slate-950">
                              <TableRow className="border-slate-800 hover:bg-slate-950">
                                <TableHead className="text-slate-400 w-[140px]">Week Start</TableHead>
                                <TableHead className="text-slate-400 w-[120px]">Day</TableHead>
                                <TableHead className="text-slate-400">User ID</TableHead>
                                <TableHead className="text-slate-400 text-right">Last Updated</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {results.corrupted_details.map((record, i) => (
                                <TableRow key={i} className="border-slate-800 hover:bg-slate-800/50">
                                  <TableCell className="font-mono text-red-400 font-bold">
                                    {record.week_start}
                                  </TableCell>
                                  <TableCell className="text-xs text-amber-500 font-medium">
                                    {record.expected_day || 'Invalid'}
                                  </TableCell>
                                  <TableCell className="font-mono text-xs text-slate-500" title={record.user_id}>
                                    {record.user_id}
                                  </TableCell>
                                  <TableCell className="text-xs text-slate-400 text-right font-mono">
                                    {record.updated_at ? format(parseISO(record.updated_at), 'MMM d, HH:mm') : 'N/A'}
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                     </div>
                   ) : (
                      <div className="flex flex-col items-center justify-center p-8 bg-emerald-950/10 rounded-lg border border-emerald-900/20 text-emerald-500 mt-6">
                         <CheckCircle className="w-12 h-12 mb-2" />
                         <p className="font-bold">No corrupted records found!</p>
                         <p className="text-sm opacity-80">Your database is clean and consistent.</p>
                      </div>
                   )}
                </div>
              )}

              {/* Verification Results View */}
              {verificationResult && !results && (
                 <div className="p-6 space-y-8">
                    <div className={`p-8 rounded-xl border ${verificationResult.all_valid ? 'bg-emerald-950/20 border-emerald-900/50' : 'bg-red-950/20 border-red-900/50'} text-center`}>
                       {verificationResult.all_valid ? (
                          <>
                             <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-10 h-10 text-emerald-500" />
                             </div>
                             <h3 className="text-3xl font-bold text-emerald-400 mb-2">Integrity Verified</h3>
                             <p className="text-emerald-300/70 text-lg">{verificationResult.summary}</p>
                          </>
                       ) : (
                          <>
                             <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertTriangle className="w-10 h-10 text-red-500" />
                             </div>
                             <h3 className="text-3xl font-bold text-red-400 mb-2">Integrity Check Failed</h3>
                             <p className="text-red-300/70 text-lg">{verificationResult.summary}</p>
                          </>
                       )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-6 bg-slate-950 rounded-lg border border-slate-800">
                           <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">Total Records Checked</div>
                           <div className="text-4xl font-bold text-white">{verificationResult.total_records}</div>
                        </div>
                        <div className="p-6 bg-slate-950 rounded-lg border border-slate-800">
                           <div className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-2">Invalid Count</div>
                           <div className={`text-4xl font-bold ${verificationResult.invalid_count > 0 ? 'text-red-500' : 'text-emerald-500'}`}>
                              {verificationResult.invalid_count}
                           </div>
                        </div>
                    </div>

                    {verificationResult.invalid_records?.length > 0 && (
                       <div className="space-y-3">
                          <h3 className="text-sm font-bold text-red-400 uppercase tracking-wider">Remaining Invalid Records</h3>
                          <div className="border border-red-900/30 rounded-lg overflow-hidden">
                             <Table>
                                <TableHeader className="bg-red-950/10">
                                   <TableRow className="border-red-900/20 hover:bg-red-950/20">
                                      <TableHead className="text-red-300">Week Start</TableHead>
                                      <TableHead className="text-red-300">User ID</TableHead>
                                   </TableRow>
                                </TableHeader>
                                <TableBody>
                                   {verificationResult.invalid_records.map((rec, i) => (
                                      <TableRow key={i} className="border-red-900/10 hover:bg-red-900/10">
                                         <TableCell className="font-mono text-red-400 font-bold">{rec.week_start}</TableCell>
                                         <TableCell className="font-mono text-xs text-slate-400">{rec.user_id}</TableCell>
                                      </TableRow>
                                   ))}
                                </TableBody>
                             </Table>
                          </div>
                       </div>
                    )}
                 </div>
              )}
           </CardContent>
        </Card>
      </div>
    </div>
  );
}