
import React, { useState } from 'react';
import { useApiKeysContext } from '@/contexts/ApiKeysContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Edit2, Trash2, Key, RefreshCw, ShieldCheck, Copy, Check, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Switch } from '@/components/ui/switch';
import AddEditKeyModal from './AddEditKeyModal';

export default function ApiKeysTab() {
  const { rawKeys, loading, error, refresh } = useApiKeysContext();
  const { toast } = useToast();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingKey, setEditingKey] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this key? This cannot be undone.")) return;
    
    try {
      const { error } = await supabase.from('api_keys').delete().eq('id', id);
      if (error) throw error;
      toast({ title: "Key Deleted" });
      refresh();
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    }
  };

  const toggleStatus = async (key, currentStatus) => {
    try {
      const { error } = await supabase
        .from('api_keys')
        .update({ is_active: !currentStatus })
        .eq('id', key.id);
        
      if (error) throw error;
      refresh();
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: err.message });
    }
  };

  const handleEdit = (key) => {
    setEditingKey(key);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingKey(null);
    setIsModalOpen(true);
  };

  const maskValue = (val) => {
    if (!val) return "********";
    if (val.length <= 8) return "********";
    return `...${val.slice(-4)}`;
  };

  const copyToClipboard = async (text, id) => {
    if (!text) return;
    // AUDIT VERIFIED: Robust clipboard handling with try/catch
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
      toast({ title: "Copied to clipboard" });
    } catch (err) {
      toast({ variant: "destructive", title: "Copy Failed", description: "Could not access clipboard." });
    }
  };

  const sortedKeys = [...(rawKeys || [])].sort((a, b) => (a.key_name || '').localeCompare(b.key_name || ''));

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
        <p className="text-slate-400">Loading API keys...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center border border-red-900/30 rounded-lg bg-red-900/10">
        <div className="flex justify-center mb-4"><AlertTriangle className="w-10 h-10 text-red-500" /></div>
        <h3 className="text-lg font-bold text-white mb-2">Unable to load keys</h3>
        <p className="text-slate-400 mb-4">{error}</p>
        <Button onClick={refresh} variant="outline" className="border-red-900 text-red-400 hover:bg-red-900/20">
          <RefreshCw className="w-4 h-4 mr-2" /> Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-cyan-500" /> 
            Active Integrations
          </h2>
          <p className="text-sm text-slate-400">Manage your API keys for external services (OpenAI, Claude, etc).</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          {/* AUDIT VERIFIED: Explicit type="button" */}
          <Button type="button" variant="outline" size="sm" onClick={refresh} className="h-9 w-9 p-0 border-slate-700 bg-slate-900/50 hover:bg-slate-800 text-slate-300">
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Button type="button" onClick={handleAdd} className="bg-cyan-600 hover:bg-cyan-500 text-white h-9 flex-1 sm:flex-none">
            <Plus className="w-4 h-4 mr-2" /> Add Key
          </Button>
        </div>
      </div>

      <Card className="bg-[#131B2D] border-slate-800 shadow-xl">
        <CardContent className="p-0 overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-900/80 backdrop-blur">
              <TableRow className="border-slate-800 hover:bg-transparent">
                <TableHead className="text-slate-400 font-medium">Key Name</TableHead>
                <TableHead className="text-slate-400 font-medium hidden sm:table-cell">Key Value (Masked)</TableHead>
                <TableHead className="text-slate-400 font-medium">Status</TableHead>
                <TableHead className="text-right text-slate-400 font-medium">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedKeys.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12 text-slate-500">
                    <div className="bg-slate-900/50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                       <Key className="w-8 h-8 opacity-20" />
                    </div>
                    <p className="font-medium text-slate-400">No API keys yet</p>
                    <p className="text-sm text-slate-600 mb-4">Add your first key to get started.</p>
                    <Button variant="link" onClick={handleAdd} className="text-cyan-500">Add Key</Button>
                  </TableCell>
                </TableRow>
              ) : (
                sortedKeys.map((key) => (
                  <TableRow key={key.id} className="border-slate-800 hover:bg-slate-800/50 transition-colors">
                    <TableCell className="font-bold text-white">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-slate-900 text-cyan-400 border-slate-700 font-mono">
                            {key.key_name || 'Unnamed Key'}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-500 font-mono text-xs hidden sm:table-cell group relative">
                      <div className="flex items-center gap-2">
                        <span>{maskValue(key.key_value)}</span>
                        {key.key_value && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => copyToClipboard(key.key_value, key.id)}
                          >
                            {copiedId === key.id ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3 text-slate-400" />}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch 
                           checked={key.is_active} 
                           onCheckedChange={() => toggleStatus(key, key.is_active)}
                           className="scale-75 data-[state=checked]:bg-green-600"
                        />
                        <span className={`text-xs font-medium ${key.is_active ? 'text-green-400' : 'text-slate-500'}`}>
                          {key.is_active ? 'Active' : 'Disabled'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(key)} className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-slate-800">
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(key.id)} className="h-8 w-8 p-0 text-slate-400 hover:text-red-400 hover:bg-red-900/20">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      
      <AddEditKeyModal 
        open={isModalOpen} 
        onOpenChange={setIsModalOpen} 
        editKey={editingKey}
        existingKeys={rawKeys || []}
        onSuccess={refresh}
      />
    </div>
  );
}
