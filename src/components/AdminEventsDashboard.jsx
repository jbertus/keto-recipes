
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { format } from 'date-fns';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { 
  Loader2, 
  Download, 
  RefreshCw, 
  ChevronLeft, 
  ChevronRight, 
  AlertTriangle, 
  Search 
} from 'lucide-react';

const EVENTS_PER_PAGE = 50;

// Common event types for the dropdown filter
const COMMON_EVENT_TYPES = [
  'access_check', 
  'access_blocked', 
  'auth_error', 
  'system_error', 
  'ui_interaction',
  'rpc_call',
  'navigation'
];

export default function AdminEventsDashboard() {
  const { user, is_admin } = useAuth();
  
  // Data state
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  
  // Filter state
  const [page, setPage] = useState(0);
  const [eventType, setEventType] = useState('all');
  const [severity, setSeverity] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  
  // Export state
  const [isExporting, setIsExporting] = useState(false);

  const fetchEvents = useCallback(async () => {
    if (!is_admin) return;
    
    setLoading(true);
    setError(null);
    
    try {
      let query = supabase
        .from('app_events')
        .select('*', { count: 'exact' });

      // Apply Filters
      if (eventType !== 'all') {
        query = query.eq('event_type', eventType);
      }
      if (severity !== 'all') {
        query = query.eq('severity', severity);
      }
      if (startDate) {
        query = query.gte('created_at', new Date(startDate).toISOString());
      }
      if (endDate) {
        // End of the selected day
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query = query.lte('created_at', end.toISOString());
      }

      // Apply Sorting and Pagination
      query = query
        .order('created_at', { ascending: false })
        .range(page * EVENTS_PER_PAGE, (page + 1) * EVENTS_PER_PAGE - 1);

      const { data, error: supabaseError, count } = await query;

      if (supabaseError) throw supabaseError;

      setEvents(data || []);
      setTotalCount(count || 0);
    } catch (err) {
      console.error('Failed to fetch events:', err);
      setError('Failed to load events. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [is_admin, page, eventType, severity, startDate, endDate]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      // Build query matching current filters but without pagination
      let query = supabase
        .from('app_events')
        .select('*');

      if (eventType !== 'all') query = query.eq('event_type', eventType);
      if (severity !== 'all') query = query.eq('severity', severity);
      if (startDate) query = query.gte('created_at', new Date(startDate).toISOString());
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query = query.lte('created_at', end.toISOString());
      }
      
      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;
      
      if (error) throw error;
      if (!data || data.length === 0) {
        alert('No data to export');
        return;
      }

      // Convert to CSV
      const headers = ['ID', 'Created At', 'User ID', 'Event Type', 'Severity', 'Source', 'Reason', 'Access Allowed', 'Metadata'];
      const csvContent = [
        headers.join(','),
        ...data.map(row => [
          row.id,
          row.created_at,
          row.user_id || 'anonymous',
          row.event_type,
          row.severity,
          row.source,
          `"${(row.reason || '').replace(/"/g, '""')}"`, // Escape quotes
          row.access_allowed === null ? 'N/A' : row.access_allowed,
          `"${JSON.stringify(row.metadata || {}).replace(/"/g, '""')}"` // Escape quotes in JSON
        ].join(','))
      ].join('\n');

      // Download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `app_events_export_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to export CSV');
    } finally {
      setIsExporting(false);
    }
  };

  const getSeverityBadge = (level) => {
    switch (level?.toLowerCase()) {
      case 'error':
        return <Badge variant="destructive" className="bg-red-600">Error</Badge>;
      case 'warning':
        return <Badge className="bg-amber-500 hover:bg-amber-600 text-white">Warning</Badge>;
      default:
        return <Badge variant="secondary" className="bg-slate-200 text-slate-700">Info</Badge>;
    }
  };

  if (!is_admin) {
    return null; // Or a standardized access denied component
  }

  const totalPages = Math.ceil(totalCount / EVENTS_PER_PAGE);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            <div>
              <CardTitle>System Event Logs</CardTitle>
              <CardDescription>View and audit application events, errors, and access checks.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => fetchEvents()} 
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button 
                variant="default" 
                size="sm" 
                onClick={handleExportCSV} 
                disabled={loading || isExporting}
              >
                {isExporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                Export CSV
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="space-y-2">
              <span className="text-sm font-medium">Start Date</span>
              <Input 
                type="date" 
                value={startDate} 
                onChange={(e) => { setPage(0); setStartDate(e.target.value); }} 
              />
            </div>
            <div className="space-y-2">
              <span className="text-sm font-medium">End Date</span>
              <Input 
                type="date" 
                value={endDate} 
                onChange={(e) => { setPage(0); setEndDate(e.target.value); }} 
              />
            </div>
            <div className="space-y-2">
              <span className="text-sm font-medium">Event Type</span>
              <Select value={eventType} onValueChange={(val) => { setPage(0); setEventType(val); }}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {COMMON_EVENT_TYPES.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <span className="text-sm font-medium">Severity</span>
              <Select value={severity} onValueChange={(val) => { setPage(0); setSeverity(val); }}>
                <SelectTrigger>
                  <SelectValue placeholder="All Severities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severities</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Table Area */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Timestamp</TableHead>
                  <TableHead>Event Type</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>User ID</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead className="w-[200px]">Reason</TableHead>
                  <TableHead className="text-right">Metadata</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      <div className="flex justify-center items-center gap-2">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        <span className="text-muted-foreground">Loading events...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-red-500">
                      <div className="flex justify-center items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        {error}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : events.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      No events found matching your filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  events.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell className="font-mono text-xs text-muted-foreground">
                        {format(new Date(event.created_at), 'yyyy-MM-dd HH:mm:ss')}
                      </TableCell>
                      <TableCell className="font-medium">{event.event_type}</TableCell>
                      <TableCell>{getSeverityBadge(event.severity)}</TableCell>
                      <TableCell className="font-mono text-xs max-w-[120px] truncate" title={event.user_id}>
                        {event.user_id || '-'}
                      </TableCell>
                      <TableCell className="text-sm">{event.source}</TableCell>
                      <TableCell className="text-sm truncate max-w-[200px]" title={event.reason}>
                        {event.reason || '-'}
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs">
                        {event.metadata && Object.keys(event.metadata).length > 0 ? (
                          <div className="truncate max-w-[150px] ml-auto" title={JSON.stringify(event.metadata, null, 2)}>
                            {JSON.stringify(event.metadata)}
                          </div>
                        ) : '-'}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between space-x-2 py-4">
            <div className="text-sm text-muted-foreground">
              Showing {events.length} of {totalCount} events
            </div>
            <div className="space-x-2 flex">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0 || loading}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => p + 1)}
                disabled={page >= totalPages - 1 || loading}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
