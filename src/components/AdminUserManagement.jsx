
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { ShieldAlert, Loader2, CheckCircle2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';

export default function AdminUserManagement() {
  const { user, isAdmin } = useAuth();
  const [targetEmail, setTargetEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const { toast } = useToast();

  const fetchLogs = useCallback(async () => {
    // Guard clause to prevent fetching if not authorized
    if (!user || !isAdmin) return;

    setLoadingLogs(true);
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('action', 'promote_to_admin')
      .order('timestamp', { ascending: false })
      .limit(10);
      
    if (!error) {
      setLogs(data || []);
    }
    setLoadingLogs(false);
  }, [user, isAdmin]);

  useEffect(() => {
    if (user && isAdmin) {
      fetchLogs();
    }
  }, [fetchLogs, user, isAdmin]);

  // Strict Permission Check
  if (!user || !isAdmin) {
    return (
      <div className="p-8 text-center text-red-500">
        <ShieldAlert className="w-12 h-12 mx-auto mb-4" />
        <h2 className="text-xl font-bold">Access Denied</h2>
        <p>You must be an administrator to view this page.</p>
      </div>
    );
  }

  const handlePromote = async (e) => {
    e.preventDefault();
    if (!targetEmail) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('promote-user-to-admin', {
        body: { target_email: targetEmail.trim() }
      });

      if (error) throw error;
      
      if (!data.success) {
        throw new Error(data.error || 'Promotion failed');
      }

      toast({
        title: "Success",
        description: data.message,
      });
      
      setTargetEmail('');
      fetchLogs(); // Refresh logs

    } catch (err) {
      toast({
        variant: "destructive",
        title: "Promotion Failed",
        description: err.message || "Could not promote user."
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-8">
      <Card className="bg-slate-950 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-purple-500" />
            Admin Promotion Tool
          </CardTitle>
          <CardDescription>
            Manually elevate a user to Administrator status. This grants full system access.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePromote} className="flex gap-4 items-end">
            <div className="flex-1 space-y-2">
              <label className="text-sm font-medium text-slate-400">User Email Address</label>
              <Input 
                type="email" 
                placeholder="user@example.com" 
                value={targetEmail}
                onChange={(e) => setTargetEmail(e.target.value)}
                className="bg-slate-900 border-slate-700 text-white"
                required
              />
            </div>
            <Button 
              type="submit" 
              disabled={loading || !targetEmail}
              className="bg-purple-600 hover:bg-purple-500 text-white"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2"/> : null}
              Promote to Admin
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="bg-slate-950 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Recent Promotions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-slate-800 hover:bg-slate-900/50">
                <TableHead className="text-slate-400">Target User</TableHead>
                <TableHead className="text-slate-400">Promoted By</TableHead>
                <TableHead className="text-slate-400">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingLogs ? (
                 <TableRow>
                   <TableCell colSpan={3} className="text-center py-4 text-slate-500">Loading...</TableCell>
                 </TableRow>
              ) : logs.length === 0 ? (
                 <TableRow>
                   <TableCell colSpan={3} className="text-center py-4 text-slate-500">No promotion logs found.</TableCell>
                 </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id} className="border-slate-800 hover:bg-slate-900/50">
                    <TableCell className="text-white font-medium">{log.target_email}</TableCell>
                    <TableCell className="text-slate-400 font-mono text-xs">{log.promoted_by}</TableCell>
                    <TableCell className="text-slate-400">
                      {format(new Date(log.timestamp), 'MMM d, yyyy HH:mm')}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
