
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronLeft, 
  ChevronRight, 
  Download, 
  Search, 
  Filter, 
  RefreshCw 
} from 'lucide-react';
import { format } from 'date-fns';

const PAGE_SIZE = 1000;

export default function AdminEventsPage() {
  const { isAdmin } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  
  // Filters
  const [eventType, setEventType] = useState('all');
  const [severity, setSeverity] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchEvents = async () => {
    if (!isAdmin) return;

    setLoading(true);
    try {
      let query = supabase
        .from('app_events')
        .select(`
          *,
          profiles:user_id (email)
        `)
        .order('created_at', { ascending: false })
        .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);

      if (eventType !== 'all') {
        query = query.eq('event_type', eventType);
      }
      if (severity !== 'all') {
        query = query.eq('severity', severity);
      }
      if (searchQuery) {
        // Simple search on reason or source - advanced search on user needs join filtering which Supabase supports but is complex
        query = query.or(`reason.ilike.%${searchQuery}%,source.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      setEvents(data || []);
      setHasMore((data || []).length === PAGE_SIZE);
    } catch (error) {
      console.error('Error fetching admin events:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchEvents();
    }
  }, [page, eventType, severity, isAdmin]); // Re-fetch on filter change or page change

  const handleExportCSV = async () => {
    // Fetch ALL rows matching filters by paging
    // Note: For very large datasets this should be an Edge Function, but doing client-side loop for now as requested
    let allData = [];
    let currentPage = 0;
    let keepFetching = true;
    
    const toastId = document.createElement('div'); // Placeholder for toast implementation if needed
    console.log("Starting export...");

    try {
      while (keepFetching) {
        let query = supabase
          .from('app_events')
          .select(`*, profiles:user_id (email)`)
          .order('created_at', { ascending: false })
          .range(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE - 1);

        if (eventType !== 'all') query = query.eq('event_type', eventType);
        if (severity !== 'all') query = query.eq('severity', severity);
        if (searchQuery) query = query.or(`reason.ilike.%${searchQuery}%,source.ilike.%${searchQuery}%`);

        const { data, error } = await query;
        if (error) throw error;

        if (data && data.length > 0) {
          allData = [...allData, ...data];
          currentPage++;
          if (data.length < PAGE_SIZE) keepFetching = false;
        } else {
          keepFetching = false;
        }
      }

      // Convert to CSV
      const headers = ['Created At', 'User ID', 'Email', 'Event Type', 'Severity', 'Source', 'Reason', 'Access Allowed', 'Metadata'];
      const csvContent = [
        headers.join(','),
        ...allData.map(row => [
          row.created_at,
          row.user_id || 'system',
          row.profiles?.email || 'N/A',
          row.event_type,
          row.severity,
          row.source,
          `"${(row.reason || '').replace(/"/g, '""')}"`,
          row.access_allowed,
          `"${JSON.stringify(row.metadata).replace(/"/g, '""')}"`
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `app_events_export_${format(new Date(), 'yyyy-MM-dd')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } catch (err) {
      console.error('Export failed:', err);
      alert('Export failed. Check console for details.');
    }
  };

  const getSeverityBadge = (sev) => {
    switch (sev) {
      case 'error': return <Badge variant="destructive">Error</Badge>;
      case 'warning': return <Badge className="bg-yellow-600">Warning</Badge>;
      default: return <Badge variant="secondary">Info</Badge>;
    }
  };

  // Moved the conditional return to the end to avoid React Hook violation
  if (!isAdmin) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Event Logs</h1>
          <p className="text-slate-400 mt-2">Audit trail of application events and access checks.</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" onClick={fetchEvents}>
             <RefreshCw className="w-4 h-4 mr-2" />
             Refresh
           </Button>
           <Button onClick={handleExportCSV}>
             <Download className="w-4 h-4 mr-2" />
             Export CSV
           </Button>
        </div>
      </div>

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
              <Input
                placeholder="Search reason or source..."
                className="pl-9 bg-slate-950 border-slate-800"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchEvents()}
              />
            </div>
            <div className="flex gap-2">
              <Select value={severity} onValueChange={setSeverity}>
                <SelectTrigger className="w-[140px] bg-slate-950 border-slate-800">
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>

              <Select value={eventType} onValueChange={setEventType}>
                <SelectTrigger className="w-[180px] bg-slate-950 border-slate-800">
                  <SelectValue placeholder="Event Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="access_check">Access Check</SelectItem>
                  <SelectItem value="auth_error">Auth Error</SelectItem>
                  <SelectItem value="system">System</SelectItem>
                </SelectContent>
              </Select>
              
              <Button variant="secondary" onClick={fetchEvents}>
                <Filter className="w-4 h-4 mr-2" />
                Apply
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-slate-800">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800 hover:bg-slate-900/50">
                  <TableHead className="text-slate-400">Time</TableHead>
                  <TableHead className="text-slate-400">User</TableHead>
                  <TableHead className="text-slate-400">Type</TableHead>
                  <TableHead className="text-slate-400">Severity</TableHead>
                  <TableHead className="text-slate-400">Source</TableHead>
                  <TableHead className="text-slate-400">Reason</TableHead>
                  <TableHead className="text-slate-400">Allowed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-slate-500">
                      Loading events...
                    </TableCell>
                  </TableRow>
                ) : events.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-slate-500">
                      No events found matching your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  events.map((event) => (
                    <TableRow key={event.id} className="border-slate-800 hover:bg-slate-800/50">
                      <TableCell className="font-mono text-xs text-slate-400">
                        {format(new Date(event.created_at), 'MMM d, HH:mm:ss')}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-slate-200">
                            {event.profiles?.email || 'System'}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {event.user_id?.slice(0, 8)}...
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs border-slate-700">
                          {event.event_type}
                        </Badge>
                      </TableCell>
                      <TableCell>{getSeverityBadge(event.severity)}</TableCell>
                      <TableCell className="text-sm text-slate-300">{event.source}</TableCell>
                      <TableCell className="text-sm text-slate-300 max-w-[200px] truncate" title={event.reason}>
                        {event.reason || '-'}
                      </TableCell>
                      <TableCell>
                        {event.access_allowed === null ? (
                          <span className="text-slate-600">-</span>
                        ) : event.access_allowed ? (
                          <span className="text-green-500 font-medium text-xs">Yes</span>
                        ) : (
                          <span className="text-red-500 font-medium text-xs">No</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          
          <div className="flex items-center justify-end space-x-2 py-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0 || loading}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => p + 1)}
              disabled={!hasMore || loading}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
