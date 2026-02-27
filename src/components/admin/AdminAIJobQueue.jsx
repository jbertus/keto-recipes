
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, RefreshCw, Cpu } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminAIJobQueue() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchJobs = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('ai_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      setJobs(data || []);
    } catch (err) {
      console.error('Error fetching jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [statusFilter]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed': return <Badge className="bg-green-600">Completed</Badge>;
      case 'failed': return <Badge variant="destructive">Failed</Badge>;
      case 'processing': return <Badge className="bg-blue-600 animate-pulse">Processing</Badge>;
      default: return <Badge variant="outline" className="text-slate-400 border-slate-600">Pending</Badge>;
    }
  };

  return (
    <Card className="bg-[#131B2D] border-slate-800">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-white flex items-center gap-2"><Cpu className="w-5 h-5 text-purple-400" /> AI Job Queue</CardTitle>
            <CardDescription>Recent AI processing jobs and their status.</CardDescription>
          </div>
          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px] bg-slate-900 border-slate-800 text-white">
                <SelectValue placeholder="Filter Status" />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-800 text-white">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={fetchJobs} className="border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800">
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader className="bg-slate-900/50">
            <TableRow className="border-slate-800 hover:bg-transparent">
              <TableHead className="text-slate-400">Date</TableHead>
              <TableHead className="text-slate-400">Purpose</TableHead>
              <TableHead className="text-slate-400">Model</TableHead>
              <TableHead className="text-slate-400">Status</TableHead>
              <TableHead className="text-right text-slate-400">Cost ($)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && jobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                  Loading jobs...
                </TableCell>
              </TableRow>
            ) : jobs.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                  No jobs found matching criteria.
                </TableCell>
              </TableRow>
            ) : (
              jobs.map((job) => (
                <TableRow key={job.id} className="border-slate-800 hover:bg-slate-800/50">
                  <TableCell className="text-slate-300 font-mono text-xs">
                    {format(new Date(job.created_at), 'MMM d, HH:mm')}
                  </TableCell>
                  <TableCell className="text-white font-medium">
                    {job.purpose || 'General Task'}
                  </TableCell>
                  <TableCell className="text-slate-400 text-xs">
                    {job.model}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(job.status)}
                  </TableCell>
                  <TableCell className="text-right text-slate-400 font-mono text-xs">
                    {job.cost_estimate ? `$${Number(job.cost_estimate).toFixed(4)}` : '-'}
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
