
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import AddNewKeyTypeDialog from './AddNewKeyTypeDialog';

const DEFAULT_TYPES = [
  'OpenAI', 
  'Claude', 
  'USDA', 
  'Walmart', 
  'Anthropic', 
  'Google', 
  'Hugging Face', 
  'Stripe', 
  'FDC'
];

export default function AddEditKeyModal({ open, onOpenChange, editKey = null, onSuccess, existingKeys = [] }) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    key_name: '',
    key_value: '',
    is_active: true
  });
  const [showValue, setShowValue] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showNewTypeDialog, setShowNewTypeDialog] = useState(false);
  
  // Combine defaults with any custom types found in existing keys
  const [availableTypes, setAvailableTypes] = useState(DEFAULT_TYPES);

  useEffect(() => {
    // Merge existing keys' types into available types to ensure we don't lose custom ones
    if (existingKeys.length > 0) {
      const usedTypes = existingKeys.map(k => k.key_name);
      const merged = [...new Set([...DEFAULT_TYPES, ...usedTypes])];
      setAvailableTypes(merged.sort());
    } else {
      setAvailableTypes(DEFAULT_TYPES.sort());
    }
  }, [existingKeys]);

  useEffect(() => {
    if (open) {
      if (editKey) {
        setFormData({
          key_name: editKey.key_name,
          key_value: editKey.key_value,
          is_active: editKey.is_active
        });
        
        // Ensure the edited key's type is in the list
        if (!availableTypes.includes(editKey.key_name)) {
             setAvailableTypes(prev => [...prev, editKey.key_name].sort());
        }

      } else {
        // Reset for new key
        setFormData({ key_name: '', key_value: '', is_active: true });
      }
      setShowValue(false);
    }
  }, [open, editKey]);

  const handleSave = async () => {
    if (!formData.key_name?.trim() || !formData.key_value?.trim()) {
      toast({ 
        variant: "destructive", 
        title: "Missing Fields", 
        description: "Service Name and API Key are required." 
      });
      return;
    }

    setLoading(true);
    try {
      const payload = {
        key_name: formData.key_name.trim(),
        key_value: formData.key_value.trim(), 
        is_active: formData.is_active,
        updated_at: new Date().toISOString()
      };

      let error;

      if (editKey) {
        const { error: updateError } = await supabase
          .from('api_keys')
          .update(payload)
          .eq('id', editKey.id);
        error = updateError;
      } else {
        const { error: insertError } = await supabase
          .from('api_keys')
          .insert({
            ...payload,
            created_by: user.id
          });
        error = insertError;
      }

      if (error) {
        if (error.code === '23505') throw new Error('A key for this service already exists.');
        throw error;
      }

      toast({ title: "Success", description: `API Key ${editKey ? 'updated' : 'created'}.` });
      onSuccess?.();
      onOpenChange(false);

    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleTypeSelect = (val) => {
    if (val === 'CUSTOM_NEW') {
      setShowNewTypeDialog(true);
      // Do not set key_name yet, wait for dialog result
    } else {
      setFormData(prev => ({ ...prev, key_name: val }));
    }
  };

  const handleNewTypeAdded = (newType) => {
    if (!availableTypes.includes(newType)) {
      setAvailableTypes(prev => [...prev, newType].sort());
    }
    setFormData(prev => ({ ...prev, key_name: newType }));
  };

  // Determine current value for Select
  // If formData.key_name matches a type, use it. Otherwise use empty string (placeholder).
  const selectValue = availableTypes.includes(formData.key_name) ? formData.key_name : '';

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-[#0f172a] border-slate-800 text-slate-200 w-[95vw] max-w-md">
          <DialogHeader>
            <DialogTitle>{editKey ? 'Edit API Key' : 'Add New API Key'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Service / Key Type</Label>
              {!editKey ? (
                  <Select 
                    value={selectValue} 
                    onValueChange={handleTypeSelect}
                  >
                    <SelectTrigger className="bg-slate-900 border-slate-700 text-slate-200">
                      <SelectValue placeholder="Select Service..." />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1e293b] border-slate-700 text-slate-200 max-h-[300px]">
                      {availableTypes.map(k => (
                        <SelectItem 
                          key={k} 
                          value={k}
                          className="focus:bg-slate-800 focus:text-white cursor-pointer"
                        >
                          {k}
                        </SelectItem>
                      ))}
                      <SelectItem 
                        value="CUSTOM_NEW" 
                        className="text-cyan-400 font-medium border-t border-slate-700 mt-1 focus:bg-slate-800 focus:text-cyan-300 cursor-pointer"
                      >
                        + Add New Type
                      </SelectItem>
                    </SelectContent>
                  </Select>
              ) : (
                 <div className="flex flex-col gap-1">
                   <Input 
                      value={formData.key_name} 
                      disabled 
                      className="bg-slate-900/50 border-slate-800 text-slate-500 font-mono" 
                   />
                   <p className="text-[10px] text-slate-500">Key type cannot be changed once created.</p>
                 </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>API Key</Label>
              <div className="relative">
                <Input
                  type={showValue ? "text" : "password"}
                  value={formData.key_value}
                  onChange={e => setFormData(prev => ({ ...prev, key_value: e.target.value }))}
                  placeholder="Paste your API key here..."
                  className="bg-slate-900 border-slate-700 pr-10 font-mono text-sm text-white placeholder:text-slate-500"
                />
                <button
                  type="button"
                  onClick={() => setShowValue(!showValue)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showValue ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-slate-400">
                 The key is encrypted before storage.
              </p>
            </div>

            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-900/50 border border-slate-800">
              <div className="space-y-0.5">
                <Label className="text-base">Active Status</Label>
                <div className="text-xs text-slate-500">Enable or disable this integration</div>
              </div>
              <Switch 
                checked={formData.is_active} 
                onCheckedChange={(c) => setFormData(prev => ({ ...prev, is_active: c }))} 
                className="data-[state=checked]:bg-cyan-600"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => onOpenChange(false)} className="hover:bg-slate-800 hover:text-white">Cancel</Button>
            <Button onClick={handleSave} disabled={loading} className="bg-cyan-600 hover:bg-cyan-500 text-white">
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save Key
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AddNewKeyTypeDialog 
        open={showNewTypeDialog} 
        onOpenChange={setShowNewTypeDialog}
        onSave={handleNewTypeAdded}
      />
    </>
  );
}
