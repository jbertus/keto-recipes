
import React, { useState } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Clock, Check, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from '@/components/ui/use-toast';

const AdminAlertActions = ({ alert, onActionComplete }) => {
  const { toast } = useToast();
  const [loadingAction, setLoadingAction] = useState(null);

  const handleAcknowledge = async () => {
    setLoadingAction('ack');
    try {
      const { error } = await supabase.rpc('acknowledge_admin_alert', { p_alert_id: alert.id });
      if (error) throw error;
      
      toast({ title: "Alert Acknowledged", description: "This has been logged." });
      if (onActionComplete) onActionComplete();
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: "Error", description: "Failed to acknowledge alert." });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleSnooze = async (durationHours) => {
    setLoadingAction('snooze');
    try {
      const until = new Date(Date.now() + durationHours * 60 * 60 * 1000).toISOString();
      const { error } = await supabase.rpc('snooze_admin_alert', { 
        p_alert_id: alert.id,
        p_until: until
      });
      if (error) throw error;
      
      toast({ title: "Alert Snoozed", description: `Snoozed for ${durationHours} hours.` });
      if (onActionComplete) onActionComplete();
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: "Error", description: "Failed to snooze alert." });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleResolve = async () => {
    setLoadingAction('resolve');
    try {
      const { error } = await supabase.rpc('resolve_admin_alert', { p_alert_id: alert.id });
      if (error) throw error;
      
      toast({ title: "Alert Resolved", description: "Status updated to Resolved." });
      if (onActionComplete) onActionComplete();
    } catch (err) {
      console.error(err);
      toast({ variant: "destructive", title: "Error", description: "Failed to resolve alert." });
    } finally {
      setLoadingAction(null);
    }
  };

  const isResolved = !!alert.resolved_at;

  return (
    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-800">
      <Button 
        variant="outline" 
        size="sm" 
        className="border-slate-700 text-slate-300 hover:text-blue-400 hover:border-blue-900 bg-slate-900"
        onClick={handleAcknowledge}
        disabled={isResolved || loadingAction === 'ack'}
      >
        {loadingAction === 'ack' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
        Acknowledge
      </Button>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className="border-slate-700 text-slate-300 hover:text-yellow-400 hover:border-yellow-900 bg-slate-900"
            disabled={isResolved || loadingAction === 'snooze'}
          >
            {loadingAction === 'snooze' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Clock className="h-4 w-4 mr-2" />}
            Snooze
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-slate-900 border-slate-800 text-slate-300">
          <DropdownMenuItem onClick={() => handleSnooze(0.25)} className="hover:bg-slate-800 cursor-pointer">
            15 Minutes
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleSnooze(1)} className="hover:bg-slate-800 cursor-pointer">
            1 Hour
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleSnooze(24)} className="hover:bg-slate-800 cursor-pointer">
            24 Hours
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Button 
        variant="default" 
        size="sm" 
        className="bg-green-700 hover:bg-green-600 text-white ml-auto"
        onClick={handleResolve}
        disabled={isResolved || loadingAction === 'resolve'}
      >
        {loadingAction === 'resolve' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Check className="h-4 w-4 mr-2" />}
        Resolve Incident
      </Button>
    </div>
  );
};

export default AdminAlertActions;
