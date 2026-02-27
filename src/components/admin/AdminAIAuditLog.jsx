
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, FileText, Search } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminAIAuditLog() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchHash, setSearchHash] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('ai_audit_log')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(50);

      if (searchHash) {
        query = query.eq('payload_hash', searchHash);
      }

      const { data, error } = await query;
      if (error) throw error;
      setLogs(data || []);
    } catch (err) {
      console.error('Error fetching logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchLogs();
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [searchHash]);

  return (
    <Card className="bg-[#131B2D] border-slate-800">
      <CardHeader>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle className="text-white flex items-center gap-2"><FileText className="w-5 h-5 text-cyan-400" /> AI Audit Log</CardTitle>
            <CardDescription>Immutable record of all AI interactions.</CardDescription>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-slate-500" />
              <Input 
                placeholder="Search Payload Hash" 
                value={searchHash} 
                onChange={(e) => setSearchHash(e.target.value)}
                className="pl-8 bg-slate-900 border-slate-800 text-white"
              />
            </div>
            <Button variant="outline" size="icon" onClick={fetchLogs} className="border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 shrink-0">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader className="bg-slate-900/50">
            <TableRow className="border-slate-800 hover:bg-transparent">
              <TableHead className="text-slate-400">Time</TableHead>
              <TableHead className="text-slate-400">Provider</TableHead>
              <TableHead className="text-slate-400">Model</TableHead>
              <TableHead className="text-slate-400">Purpose</TableHead>
              <TableHead className="text-right text-slate-400">Tokens</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                  Loading logs...
                </TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                  No audit logs found.
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id} className="border-slate-800 hover:bg-slate-800/50">
                  <TableCell className="text-slate-300 font-mono text-xs">
                    {format(new Date(log.timestamp), 'MMM d, HH:mm:ss')}
                  </TableCell>
                  <TableCell className="text-white text-sm">
                    {log.provider}
                  </TableCell>
                  <TableCell className="text-slate-400 text-xs">
                    {log.model}
                  </TableCell>
                  <TableCell className="text-slate-300 text-sm">
                    {log.purpose}
                  </TableCell>
                  <TableCell className="text-right text-slate-400 font-mono text-xs">
                    {log.token_count}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
