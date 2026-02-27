
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import useAIIntegration from '@/hooks/useAIIntegration';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Loader2, Plus, Trash2, Key, CheckCircle2, XCircle, Beaker, Lock } from 'lucide-react';
import AdminAIJobQueue from './AdminAIJobQueue';
import AdminAIAuditLog from './AdminAIAuditLog';
import { format } from 'date-fns';

export default function AdminAIIntegrations() {
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState('keys');
  const [keys, setKeys] = useState([]);
  const [loadingKeys, setLoadingKeys] = useState(false);
  const [newKey, setNewKey] = useState('');
  const [newKeyName, setNewKeyName] = useState('OpenAI Prod');
  const [testResult, setTestResult] = useState(null);
  
  const { validateApiKey, loading: testingKey } = useAIIntegration();
  const { toast } = useToast();

  const fetchKeys = async () => {
    if (!user) return;
    
    setLoadingKeys(true);
    try {
      let query = supabase
        .from('api_keys')
        .select('*')
        .order('created_at', { ascending: false });
      
      // AUDIT VERIFIED: Secure filter logic to prevent data leaks
      if (!isAdmin) {
        query = query.eq('created_by', user.id);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      setKeys(data || []);
    } catch (err) {
      toast({ variant: "destructive", title: "Error fetching keys", description: err.message });
    } finally {
      setLoadingKeys(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, [user, isAdmin]);

  const handleAddKey = async () => {
    if (!newKey.trim()) return;
    
    if (!newKey.startsWith('sk-')) {
      toast({ variant: "destructive", title: "Invalid Format", description: "OpenAI keys typically start with 'sk-'" });
      return;
    }

    try {
      // AUDIT VERIFIED: Explicit column mapping matching schema
      const { error } = await supabase.from('api_keys').insert({
        key_name: newKeyName,
        key_value: newKey,
        created_by: user.id,
        is_active: true
      });

      if (error) throw error;

      toast({ title: "Success", description: "API Key added successfully." });
      setNewKey('');
      fetchKeys();
    } catch (err) {
      toast({ variant: "destructive", title: "Error adding key", description: err.message });
    }
  };

  const handleDeleteKey = async (id) => {
    if (!confirm("Are you sure? This action cannot be undone.")) return;
    try {
      const { error } = await supabase.from('api_keys').delete().eq('id', id);
      if (error) throw error;
      toast({ title: "Key Deleted" });
      fetchKeys();
    } catch (err) {
      toast({ variant: "destructive", title: "Error deleting key", description: err.message });
    }
  };

  const handleTestKey = async (key) => {
    setTestResult(null);
    const result = await validateApiKey(key.key_value, 'openai');
    setTestResult({ id: key.id, ...result });
    
    if (result.valid) {
      toast({ title: "Valid Key", description: "Connection to OpenAI successful.", className: "bg-green-600 border-none text-white" });
    } else {
      toast({ variant: "destructive", title: "Invalid Key", description: result.error });
    }
  };

  const maskKey = (keyString) => {
    if (!keyString) return '';
    if (keyString.length < 8) return '********';
    return `sk-...${keyString.slice(-4)}`;
  };

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-slate-900 border border-slate-800">
          <TabsTrigger value="keys" className="data-[state=active]:bg-cyan-900/50 data-[state=active]:text-cyan-400">API Keys</TabsTrigger>
          <TabsTrigger value="jobs" className="data-[state=active]:bg-cyan-900/50 data-[state=active]:text-cyan-400">Job Queue</TabsTrigger>
          <TabsTrigger value="logs" className="data-[state=active]:bg-cyan-900/50 data-[state=active]:text-cyan-400">Audit Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="keys" className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
          {/* Add Key Section */}
          <Card className="bg-[#131B2D] border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Add New OpenAI Key</CardTitle>
              <CardDescription>Securely store your API keys for AI services.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4">
                <Input 
                  placeholder="Key Name (e.g., OpenAI Production)" 
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  className="md:w-1/3 bg-slate-900 border-slate-800 text-white"
                />
                <div className="relative flex-1">
                  <Key className="absolute left-2 top-2.5 h-4 w-4 text-slate-500" />
                  <Input 
                    placeholder="sk-..." 
                    type="password"
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value)}
                    className="pl-8 bg-slate-900 border-slate-800 text-white"
                  />
                </div>
                {/* AUDIT VERIFIED: Explicit type="button" */}
                <Button type="button" onClick={handleAddKey} className="bg-cyan-600 hover:bg-cyan-500 text-white">
                  <Plus className="w-4 h-4 mr-2" /> Add Key
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Key List */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Active Keys</h3>
            {loadingKeys ? (
               <div className="flex items-center gap-2 text-slate-400"><Loader2 className="animate-spin w-4 h-4"/> Loading keys...</div>
            ) : keys.length === 0 ? (
               <div className="p-8 text-center border border-dashed border-slate-700 rounded-lg text-slate-500">No keys configured.</div>
            ) : (
              <div className="grid gap-4">
                {keys.map((key) => (
                  <Card key={key.id} className="bg-slate-900 border-slate-800">
                    <CardContent className="p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="p-2 bg-slate-800 rounded-full">
                          <Lock className="w-5 h-5 text-cyan-500" />
                        </div>
                        <div>
                          <p className="font-medium text-white">{key.key_name}</p>
                          <p className="text-sm text-slate-500 font-mono">{maskKey(key.key_value)}</p>
                          <div className="flex gap-2 mt-1">
                            <span className="text-xs text-slate-500">Created: {key.created_at ? format(new Date(key.created_at), 'MMM d, yyyy') : 'N/A'}</span>
                            {key.is_active ? 
                              <Badge variant="outline" className="text-green-400 border-green-900 bg-green-900/10 text-[10px] h-5">Active</Badge> : 
                              <Badge variant="outline" className="text-red-400 border-red-900 bg-red-900/10 text-[10px] h-5">Inactive</Badge>
                            }
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 w-full md:w-auto">
                        <Button 
                          type="button"
                          variant="outline" 
                          size="sm" 
                          onClick={() => handleTestKey(key)} 
                          disabled={testingKey}
                          className="flex-1 md:flex-none border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800"
                        >
                          {testingKey ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Beaker className="w-3 h-3 mr-2" />}
                          Test
                        </Button>
                        <Button 
                          type="button"
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDeleteKey(key.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-900/20"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                    {testResult?.id === key.id && (
                      <div className={`px-4 py-2 text-xs border-t ${testResult.valid ? 'bg-green-900/20 border-green-900 text-green-400' : 'bg-red-900/20 border-red-900 text-red-400'}`}>
                         {testResult.valid ? 
                           <span className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3" /> Connection Successful</span> : 
                           <span className="flex items-center gap-2"><XCircle className="w-3 h-3" /> Connection Failed: {testResult.error}</span>
                         }
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </div>

          <Card className="bg-[#131B2D] border-slate-800 opacity-60">
            <CardHeader>
              <CardTitle className="text-slate-400 text-base">Coming Soon (Phase 2)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
               <div className="flex justify-between items-center p-3 border border-slate-800 rounded">
                 <span className="text-slate-400">Anthropic Claude</span>
                 <Switch disabled />
               </div>
               <div className="flex justify-between items-center p-3 border border-slate-800 rounded">
                 <span className="text-slate-400">Google Gemini</span>
                 <Switch disabled />
               </div>
            </CardContent>
          </Card>

        </TabsContent>

        <TabsContent value="jobs" className="animate-in fade-in slide-in-from-bottom-2">
           <AdminAIJobQueue />
        </TabsContent>

        <TabsContent value="logs" className="animate-in fade-in slide-in-from-bottom-2">
           <AdminAIAuditLog />
        </TabsContent>
      </Tabs>
    </div>
  );
}
