
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Download, RefreshCw, ChevronLeft, ChevronRight, ShieldAlert, CheckCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';

const AdminEventsDashboard = () => {
  const [searchParams] = useSearchParams();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 50;

  // Filters - Initialize from URL params if present
  const [filters, setFilters] = useState({
    severity: searchParams.get('severity') || 'all',
    source: 'all',
    emailSearch: '',
    startDate: searchParams.get('startDate') || '',
    endDate: searchParams.get('endDate') || ''
  });

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('app_events')
        .select('*, profiles!inner(email, full_name)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (filters.severity !== 'all') {
        query = query.eq('severity', filters.severity);
      }

      if (filters.source !== 'all') {
        query = query.eq('source', filters.source);
      }

      if (filters.emailSearch) {
        query = query.ilike('profiles.email', `%${filters.emailSearch}%`);
      }

      if (filters.startDate) {
        query = query.gte('created_at', new Date(filters.startDate).toISOString());
      }
      
      if (filters.endDate) {
        query = query.lte('created_at', new Date(filters.endDate).toISOString());
      }

      const { data, error, count } = await query;

      if (error) throw error;

      setEvents(data || []);
      setTotalCount(count || 0);
    } catch (err) {
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleDownloadCSV = async () => {
    setDownloading(true);
    try {
      let allRows = [];
      let currentBatchPage = 0;
      let hasMore = true;
      const BATCH_SIZE = 1000;

      while (hasMore) {
        let query = supabase
          .from('app_events')
          .select('created_at, user_id, event_type, severity, source, reason, access_allowed, metadata, profiles!inner(email, full_name)')
          .order('created_at', { ascending: false })
          .range(currentBatchPage * BATCH_SIZE, (currentBatchPage + 1) * BATCH_SIZE - 1);

        if (filters.severity !== 'all') query = query.eq('severity', filters.severity);
        if (filters.source !== 'all') query = query.eq('source', filters.source);
        if (filters.emailSearch) query = query.ilike('profiles.email', `%${filters.emailSearch}%`);
        if (filters.startDate) query = query.gte('created_at', new Date(filters.startDate).toISOString());
        if (filters.endDate) query = query.lte('created_at', new Date(filters.endDate).toISOString());

        const { data, error } = await query;
        if (error) throw error;

        if (data.length < BATCH_SIZE) {
          hasMore = false;
        }

        allRows = [...allRows, ...data];
        currentBatchPage++;
      }

      const headers = ['Created At', 'User ID', 'Email', 'Full Name', 'Event Type', 'Severity', 'Source', 'Reason', 'Access Allowed', 'Metadata'];
      const csvContent = [
        headers.join(','),
        ...allRows.map(row => {
          const profile = row.profiles || {};
          return [
            `"${row.created_at}"`,
            `"${row.user_id}"`,
            `"${profile.email || ''}"`,
            `"${profile.full_name || ''}"`,
            `"${row.event_type}"`,
            `"${row.severity}"`,
            `"${row.source}"`,
            `"${row.reason || ''}"`,
            `"${row.access_allowed === null ? '' : row.access_allowed}"`,
            `"${JSON.stringify(row.metadata || {}).replace(/"/g, '""')}"`
          ].join(',');
        })
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `app_events_export_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (err) {
      console.error('Error downloading CSV:', err);
      alert('Failed to download CSV');
    } finally {
      setDownloading(false);
    }
  };

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'error': return <Badge variant="destructive" className="bg-red-900 text-red-200">Error</Badge>;
      case 'warn': return <Badge className="bg-yellow-900 text-yellow-200 hover:bg-yellow-900">Warn</Badge>;
      default: return <Badge className="bg-blue-900 text-blue-200 hover:bg-blue-900">Info</Badge>;
    }
  };

  return (
    <Card className="bg-slate-950 border-slate-800">
      <CardHeader>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <CardTitle className="text-xl text-white flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-cyan-500" />
            System Events Log
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchEvents} disabled={loading} className="border-slate-700 text-slate-300">
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownloadCSV} disabled={downloading || loading} className="border-slate-700 text-slate-300">
              {downloading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
              Export CSV
            </Button>
          </div>
        </div>
        
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
          <Input 
            placeholder="Search email..." 
            value={filters.emailSearch} 
            onChange={(e) => { setFilters(f => ({...f, emailSearch: e.target.value})); setPage(0); }} 
            className="bg-slate-900 border-slate-700 text-white"
          />
          <Select value={filters.severity} onValueChange={(v) => { setFilters(f => ({...f, severity: v})); setPage(0); }}>
            <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
              <SelectValue placeholder="Severity" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800 text-white">
              <SelectItem value="all">All Severities</SelectItem>
              <SelectItem value="info">Info</SelectItem>
              <SelectItem value="warn">Warn</SelectItem>
              <SelectItem value="error">Error</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.source} onValueChange={(v) => { setFilters(f => ({...f, source: v})); setPage(0); }}>
            <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
              <SelectValue placeholder="Source" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800 text-white">
              <SelectItem value="all">All Sources</SelectItem>
              <SelectItem value="auth_context">Auth Context</SelectItem>
              <SelectItem value="blocker">Blocker</SelectItem>
              <SelectItem value="rpc">RPC</SelectItem>
              <SelectItem value="ui">UI</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Date Filters (Hidden if not used or can be exposed) - Exposed as this component is receiving them via deep link */}
        {(filters.startDate || filters.endDate) && (
           <div className="flex gap-4 mt-2 text-sm text-slate-400">
             {filters.startDate && <span>Start: {format(new Date(filters.startDate), 'MMM d, HH:mm')}</span>}
             {filters.endDate && <span>End: {format(new Date(filters.endDate), 'MMM d, HH:mm')}</span>}
             <Button variant="ghost" size="sm" onClick={() => setFilters(f => ({...f, startDate: '', endDate: ''}))} className="h-auto p-0 text-cyan-500 hover:text-cyan-400">Clear Date Filters</Button>
           </div>
        )}
      </CardHeader>
      
      <CardContent>
        <div className="rounded-md border border-slate-800 overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-900">
              <TableRow className="border-slate-800 hover:bg-slate-900">
                <TableHead className="text-slate-400">Timestamp</TableHead>
                <TableHead className="text-slate-400">Severity</TableHead>
                <TableHead className="text-slate-400">User</TableHead>
                <TableHead className="text-slate-400">Event</TableHead>
                <TableHead className="text-slate-400">Source</TableHead>
                <TableHead className="text-slate-400">Access</TableHead>
                <TableHead className="text-slate-400">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && events.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                    Loading events...
                  </TableCell>
                </TableRow>
              ) : events.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                    No events found matching criteria.
                  </TableCell>
                </TableRow>
              ) : (
                events.map((event) => (
                  <TableRow key={event.id} className="border-slate-800 hover:bg-slate-900/50">
                    <TableCell className="text-slate-300 text-xs whitespace-nowrap">
                      {format(new Date(event.created_at), 'MMM d, HH:mm:ss')}
                    </TableCell>
                    <TableCell>{getSeverityBadge(event.severity)}</TableCell>
                    <TableCell className="max-w-[200px]">
                      <div className="flex flex-col">
                        <span className="text-cyan-400 text-xs font-medium truncate">{event.profiles?.email || 'Unknown'}</span>
                        <span className="text-slate-500 text-[10px] truncate">{event.profiles?.full_name}</span>
                        <span className="text-slate-600 text-[10px] font-mono truncate">{event.user_id}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-300 text-sm font-medium">{event.event_type}</TableCell>
                    <TableCell className="text-slate-400 text-xs">{event.source}</TableCell>
                    <TableCell>
                      {event.access_allowed === true && <CheckCircle className="h-4 w-4 text-green-500" />}
                      {event.access_allowed === false && <XCircle className="h-4 w-4 text-red-500" />}
                      {event.access_allowed === null && <span className="text-slate-600">-</span>}
                    </TableCell>
                    <TableCell className="text-slate-400 text-xs max-w-[250px]">
                      <div className="space-y-1">
                        {event.reason && <div>Reason: <span className="text-slate-300">{event.reason}</span></div>}
                        <details className="cursor-pointer text-[10px] text-cyan-600">
                          <summary>Metadata</summary>
                          <pre className="mt-1 bg-slate-950 p-1 rounded border border-slate-800 overflow-x-auto text-slate-400">
                            {JSON.stringify(event.metadata, null, 2)}
                          </pre>
                        </details>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4">
          <div className="text-xs text-slate-500">
            Showing {page * PAGE_SIZE + 1} to {Math.min((page + 1) * PAGE_SIZE, totalCount)} of {totalCount} events
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setPage(p => Math.max(0, p - 1))} 
              disabled={page === 0 || loading}
              className="border-slate-700 text-slate-300"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setPage(p => p + 1)} 
              disabled={((page + 1) * PAGE_SIZE) >= totalCount || loading}
              className="border-slate-700 text-slate-300"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminEventsDashboard;
