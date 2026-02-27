
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

export default function AdminAlertsPreferences() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('enable_admin_alerts')
        .maybeSingle();

      if (error) throw error;
      if (data) setEnabled(data.enable_admin_alerts);
    } catch (err) {
      console.error('Error fetching admin preferences:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (val) => {
    setSaving(true);
    try {
      // Upsert logic for single row settings table usually requires an ID or unique constraint
      // Assuming ID is constant or we just update existing rows. 
      // For safety, we'll try an update first, or assume there's only one row logic handled by backend constraints.
      // Here we assume a 'singleton' pattern or we just insert if empty.
      
      // First check if row exists to decide update vs insert (or upsert if ID known)
      const { data: existing } = await supabase.from('admin_settings').select('id').limit(1);
      
      let error;
      if (existing && existing.length > 0) {
         const { error: updateError } = await supabase
          .from('admin_settings')
          .update({ enable_admin_alerts: val, updated_at: new Date().toISOString() })
          .eq('id', existing[0].id);
         error = updateError;
      } else {
         const { error: insertError } = await supabase
          .from('admin_settings')
          .insert({ enable_admin_alerts: val });
         error = insertError;
      }

      if (error) throw error;
      setEnabled(val);
      toast({ title: "Settings Saved", description: `Admin alerts ${val ? 'enabled' : 'disabled'}.` });
    } catch (err) {
      toast({ variant: "destructive", title: "Error saving settings", description: err.message });
      // Revert UI on error
      setEnabled(!val);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex items-center gap-2 p-4 text-slate-400"><Loader2 className="w-4 h-4 animate-spin"/> Loading preferences...</div>;
  }

  return (
    <div className="space-y-4 p-4 border border-slate-800 rounded-lg bg-slate-950">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-white">System Alert Emails</h3>
          <p className="text-sm text-slate-400">Receive email notifications for critical system errors.</p>
        </div>
        <div className="flex items-center gap-2">
           <Switch 
             checked={enabled} 
             onCheckedChange={handleToggle} 
             disabled={saving}
             className="data-[state=checked]:bg-cyan-600"
           />
           <span className="text-sm font-medium text-slate-300 w-16">
             {saving ? <Loader2 className="w-3 h-3 animate-spin inline"/> : (enabled ? "On" : "Off")}
           </span>
        </div>
      </div>
    </div>
  );
}
