import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/components/ui/use-toast';
import { 
  AlertTriangle, 
  CheckCircle, 
  ExternalLink, 
  RefreshCw, 
  ChevronDown, 
  ChevronUp,
  Check,
  Clock,
  Archive,
  Loader2,
  BellOff
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AdminAlertMessenger from '@/components/AdminAlertMessenger';

const AdminAlertsPreferences = () => {
  const { is_admin } = useAuth();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchAlerts = useCallback(async () => {
    if (!is_admin) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('admin_alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50); 

      if (error) throw error;
      setAlerts(data || []);
    } catch (err) {
      console.error('Error fetching alerts:', err);
      setError('Failed to load alerts.');
    } finally {
      setLoading(false);
    }
  }, [is_admin]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  if (!is_admin) return null;

  const formatDateCentral = (dateString) => {
    if (!dateString) return '-';
    try {
      const d = new Date(dateString);
      const options = {
        timeZone: 'America/Chicago',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short',
        hour12: false
      };
      const parts = new Intl.DateTimeFormat('en-US', options).formatToParts(d);
      const get = (type) => parts.find(p => p.type === type)?.value || '';
      return `${get('year')}-${get('month')}-${get('day')} ${get('hour')}:${get('minute')}:${get('second')} ${get('timeZoneName')}`;
    } catch (e) {
      return dateString;
    }
  };

  const handleViewEvents = (alert) => {
    const searchParams = new URLSearchParams();
    searchParams.set('tab', 'system-events');
    searchParams.set('severity', 'error');
    if (alert.window_start) searchParams.set('startDate', alert.window_start);
    if (alert.window_end) searchParams.set('endDate', alert.window_end);
    
    navigate(`/preferences?${searchParams.toString()}`);
  };

  const activeAlerts = alerts.filter(a => a.resolved_at === null);
  const resolvedAlerts = alerts.filter(a => a.resolved_at !== null);

  return (
    <div className="space-y-6">
      <Card className="bg-slate-950 border-slate-800">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="space-y-1">
            <CardTitle className="text-xl text-white flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Alerts Monitor
            </CardTitle>
            <CardDescription>
              System error threshold breaches and notifications.
            </CardDescription>
          </div>
          {/* AUDIT VERIFIED: type="button" */}
          <Button type="button" variant="ghost" size="sm" onClick={fetchAlerts} disabled={loading} className="text-slate-400 hover:text-white">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
             <div className="p-4 rounded bg-red-900/20 border border-red-900 text-red-200 text-sm flex items-center justify-between">
               <span>{error}</span>
               <Button type="button" variant="outline" size="sm" onClick={fetchAlerts} className="border-red-800 hover:bg-red-900/50">Retry</Button>
             </div>
          )}

          <div className="space-y-4">
            <h3 className="text-sm font-medium text-slate-300 uppercase tracking-wider">Active Alerts</h3>
            
            {activeAlerts.length === 0 ? (
              <div className="text-sm text-slate-500 italic px-4 py-8 border border-dashed border-slate-800 rounded text-center">
                No active alerts. System is healthy.
              </div>
            ) : (
              activeAlerts.map(alert => (
                <AlertCard 
                  key={alert.id} 
                  alert={alert} 
                  isActive={true} 
                  formatDate={formatDateCentral} 
                  onViewEvents={handleViewEvents}
                  onRefresh={fetchAlerts}
                />
              ))
            )}
          </div>

          <div className="space-y-4 pt-4 border-t border-slate-800">
            <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wider">Resolved History</h3>
            {resolvedAlerts.length === 0 ? (
               <div className="text-sm text-slate-600 italic">No historical alerts found.</div>
            ) : (
              resolvedAlerts.map(alert => (
                <AlertCard 
                  key={alert.id} 
                  alert={alert} 
                  isActive={false} 
                  formatDate={formatDateCentral} 
                  onViewEvents={handleViewEvents}
                  onRefresh={fetchAlerts}
                />
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const AlertActions = ({ alert, onActionComplete }) => {
  const { toast } = useToast();
  const [processing, setProcessing] = useState(false);
  const [snoozeOpen, setSnoozeOpen] = useState(false);
  const [snoozeDate, setSnoozeDate] = useState('');

  const handleRPC = async (method, params, successMessage) => {
    setProcessing(true);
    try {
      const { data, error } = await supabase.rpc(method, params);
      
      if (error) {
        toast({
          variant: "destructive",
          title: "Action Failed",
          description: error.message || "Database error occurred"
        });
      } else if (data === true) {
        toast({
          title: successMessage,
          className: "bg-green-600 border-none text-white",
        });
        if (onActionComplete) onActionComplete();
      } else {
        toast({
          variant: "destructive",
          title: "Action Failed",
          description: "Operation returned false or invalid status."
        });
      }
    } catch (err) {
      console.error(`${method} failed:`, err);
      toast({
        variant: "destructive",
        title: "Action Failed",
        description: err.message || "Something went wrong"
      });
    } finally {
      setProcessing(false);
      // AUDIT VERIFIED: Ensure popover closes even on error
      setSnoozeOpen(false);
    }
  };

  const handleAcknowledge = () => handleRPC('acknowledge_admin_alert', { p_alert_id: alert.id }, "Alert acknowledged");
  
  const handleResolve = () => handleRPC('resolve_admin_alert', { p_alert_id: alert.id }, "Alert resolved");

  const handleSnooze = () => {
    if (!snoozeDate) {
      toast({ variant: "destructive", title: "Date required", description: "Please select a time to snooze until." });
      return;
    }
    const timestamp = new Date(snoozeDate).toISOString();
    // AUDIT VERIFIED: p_until matches SQL function signature
    handleRPC('snooze_admin_alert', { p_alert_id: alert.id, p_until: timestamp }, `Snoozed until ${new Date(snoozeDate).toLocaleString()}`);
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button 
        type="button"
        size="sm" 
        variant="outline" 
        className="border-slate-700 bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 hover:border-slate-600"
        onClick={handleAcknowledge}
        disabled={processing}
      >
        {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
        Acknowledge
      </Button>

      <Popover open={snoozeOpen} onOpenChange={setSnoozeOpen}>
        <PopoverTrigger asChild>
          <Button 
            type="button"
            size="sm" 
            variant="outline" 
            className="border-slate-700 bg-slate-900 text-slate-300 hover:text-white hover:bg-slate-800 hover:border-slate-600"
            disabled={processing}
          >
            <Clock className="h-4 w-4 mr-2" />
            Snooze...
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 bg-slate-900 border-slate-700 p-4">
          <div className="space-y-4">
            <h4 className="font-medium text-white flex items-center gap-2">
              <BellOff className="h-4 w-4" /> Snooze Alert
            </h4>
            <div className="space-y-2">
              <Label htmlFor="snooze-time" className="text-xs text-slate-400">Snooze until</Label>
              <Input
                id="snooze-time"
                type="datetime-local"
                className="bg-slate-950 border-slate-800 text-white"
                value={snoozeDate}
                onChange={(e) => setSnoozeDate(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setSnoozeOpen(false)} className="text-slate-400">Cancel</Button>
              <Button type="button" size="sm" onClick={handleSnooze} disabled={processing || !snoozeDate} className="bg-cyan-600 hover:bg-cyan-500">
                {processing ? <Loader2 className="h-3 w-3 animate-spin" /> : "Confirm Snooze"}
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      <Button 
        type="button"
        size="sm" 
        className="bg-green-700 hover:bg-green-600 text-white border-green-800"
        onClick={handleResolve}
        disabled={processing}
      >
        {processing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Archive className="h-4 w-4 mr-2" />}
        Resolve & Archive
      </Button>
    </div>
  );
};

const AlertCard = ({ alert, isActive, formatDate, onViewEvents, onRefresh }) => {
  const topReasons = alert.metadata?.top_reasons || [];
  const title = alert.metadata?.title;
  const description = alert.metadata?.description;
  const [expanded, setExpanded] = useState(isActive); 

  return (
    <div className={`p-4 rounded-lg border transition-colors ${isActive ? 'bg-red-950/10 border-red-900/50' : 'bg-slate-900/30 border-slate-800 opacity-90'}`}>
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2">
            {isActive ? (
              <Badge variant="destructive" className="animate-pulse bg-red-600">Active Breach</Badge>
            ) : (
              <Badge variant="secondary" className="bg-slate-700 text-slate-300 flex items-center gap-1">
                <CheckCircle className="h-3 w-3" /> Resolved
              </Badge>
            )}
            <span className="text-sm font-mono text-slate-400">
              {formatDate(alert.window_start)}
            </span>
          </div>
          
          <div className="text-sm text-slate-300">
            <span className="font-bold text-white">{alert.error_count} Errors</span> detected in 1-hour window.
          </div>

          {(title || description) && (
            <div className="mt-2 text-sm">
              {title && <p className="font-semibold text-amber-500">{title}</p>}
              {description && <p className="text-slate-400">{description}</p>}
            </div>
          )}

          {topReasons.length > 0 && (
             <div className="space-y-1 mt-2">
               <p className="text-xs font-semibold text-slate-500">TOP ERROR REASONS:</p>
               <ul className="text-xs text-slate-400 list-disc pl-4 space-y-0.5">
                 {topReasons.map((r, i) => (
                   <li key={i}>
                     <span className="text-slate-300 font-mono">{r.count}x</span> {r.reason}
                   </li>
                 ))}
               </ul>
             </div>
          )}
          
          {!isActive && alert.resolved_at && (
            <p className="text-xs text-slate-600 mt-2">
              Resolved at: {formatDate(alert.resolved_at)}
            </p>
          )}
        </div>

        <div className="flex flex-col justify-between items-end gap-2">
          {/* AUDIT VERIFIED: type="button" */}
          <Button 
            type="button"
            variant="ghost" 
            size="sm" 
            className="text-slate-400 hover:text-white h-6 w-6 p-0"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>

          <Button 
            type="button"
            variant="outline" 
            size="sm" 
            className="border-slate-700 text-slate-300 hover:text-cyan-400 hover:border-cyan-900 bg-slate-900"
            onClick={() => onViewEvents(alert)}
          >
            <ExternalLink className="h-3 w-3 mr-2" />
            View Events
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="mt-6 space-y-4 border-t border-slate-800/50 pt-4 animate-in slide-in-from-top-2">
          {isActive && (
            <AlertActions alert={alert} onActionComplete={onRefresh} />
          )}
          <div className="pt-2">
            <AdminAlertMessenger alert={alert} />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAlertsPreferences;