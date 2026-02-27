
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { 
  Users, 
  Search, 
  Loader2, 
  User,
  Mail,
  Phone,
  Activity,
  Target,
  FileText,
  Calendar,
  RefreshCw,
  Plus
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export default function ClientsManager() { 
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);

  const fetchClients = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch clients for the current user (coach) as requested
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setClients(data || []);
      
      // Update selected client if it exists in the new list
      if (selectedClient) {
        const updated = data?.find(c => c.id === selectedClient.id);
        if (updated) setSelectedClient(updated);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load clients list."
      });
    } finally {
      setLoading(false);
    }
  }, [currentUser, selectedClient, toast]);

  useEffect(() => {
    if (currentUser) {
      fetchClients();
    }
  }, [currentUser, fetchClients]);

  const handleClientSelect = (client) => {
    setSelectedClient(client);
  };

  // Filter clients based on search term
  const filteredClients = clients.filter(c => {
    const term = searchTerm.toLowerCase();
    const fullName = `${c.first_name || ''} ${c.last_name || ''}`.toLowerCase();
    const email = (c.email || '').toLowerCase();
    return fullName.includes(term) || email.includes(term);
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="h-6 w-6 text-cyan-500" />
            Client Management
          </h2>
          <p className="text-slate-400 text-sm">
            View and manage your coaching clients.
          </p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
           <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input 
                placeholder="Search clients..." 
                className="pl-9 bg-slate-900 border-slate-800 text-slate-200"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
           <Button variant="outline" onClick={fetchClients} disabled={loading} className="border-slate-700 text-slate-300">
             <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
           </Button>
           <Button className="bg-cyan-600 hover:bg-cyan-500 text-white">
             <Plus className="w-4 h-4 mr-2" /> Add Client
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Client List */}
        <div className="lg:col-span-1 bg-slate-950 rounded-lg border border-slate-800 overflow-hidden flex flex-col h-[600px]">
           <div className="p-3 bg-slate-900 border-b border-slate-800 font-medium text-slate-300 text-sm flex justify-between">
             <span>My Clients ({clients.length})</span>
             {loading && <Loader2 className="w-4 h-4 animate-spin text-cyan-500"/>}
           </div>
           <div className="overflow-y-auto flex-1 p-2 space-y-1">
              {loading && clients.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-40">
                  <Loader2 className="animate-spin text-cyan-500 w-8 h-8 mb-2"/>
                  <span className="text-xs text-slate-500">Loading clients...</span>
                </div>
              ) : filteredClients.length === 0 ? (
                <div className="text-center p-4 text-slate-500 text-sm">No clients found.</div>
              ) : (
                filteredClients.map(client => (
                  <button
                    key={client.id}
                    onClick={() => handleClientSelect(client)}
                    className={`w-full text-left p-3 rounded-md transition-colors border group ${
                      selectedClient?.id === client.id 
                        ? 'bg-cyan-900/20 border-cyan-500/50' 
                        : 'bg-slate-900/50 border-transparent hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="font-medium text-slate-200 truncate pr-2">
                        {client.first_name} {client.last_name}
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-2">
                       <span className="text-xs text-slate-400 truncate max-w-[150px]">{client.email}</span>
                       <span className="text-[10px] text-slate-500 font-mono">
                         {client.created_at ? format(new Date(client.created_at), 'MMM d') : ''}
                       </span>
                    </div>
                  </button>
                ))
              )}
           </div>
        </div>

        {/* Client Details */}
        <div className="lg:col-span-2 space-y-6 flex flex-col">
           {selectedClient ? (
             <div className="bg-[#1e293b] rounded-lg border border-slate-800 p-6 space-y-6 animate-in fade-in flex-1">
                {/* Header */}
                <div className="flex justify-between items-start border-b border-slate-800 pb-4">
                   <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-cyan-900/30 flex items-center justify-center border border-cyan-500/30">
                        <User className="h-6 w-6 text-cyan-400" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">
                           {selectedClient.first_name} {selectedClient.last_name}
                        </h3>
                        <div className="flex items-center gap-3 text-sm text-slate-400 mt-1">
                          <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {selectedClient.email || 'No email'}</span>
                          {selectedClient.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {selectedClient.phone}</span>}
                        </div>
                      </div>
                   </div>
                   <Badge variant="outline" className="bg-slate-900 text-slate-400 border-slate-700 capitalize">
                     {selectedClient.activity_level?.replace('_', ' ') || 'Unknown Activity'}
                   </Badge>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Physical Stats */}
                  <Card className="bg-slate-950 border-slate-800">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-cyan-500" /> Physical Stats
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                         <div>
                           <div className="text-2xl font-bold text-white">{selectedClient.weight_kg || '--'} <span className="text-xs font-normal text-slate-500">kg</span></div>
                           <div className="text-xs text-slate-500 uppercase">Weight</div>
                         </div>
                         <div>
                           <div className="text-2xl font-bold text-white">{selectedClient.height_cm || '--'} <span className="text-xs font-normal text-slate-500">cm</span></div>
                           <div className="text-xs text-slate-500 uppercase">Height</div>
                         </div>
                         <div>
                           <div className="text-2xl font-bold text-white">{selectedClient.age || '--'} <span className="text-xs font-normal text-slate-500">yrs</span></div>
                           <div className="text-xs text-slate-500 uppercase">Age</div>
                         </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Targets */}
                  <Card className="bg-slate-950 border-slate-800">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                        <Target className="w-4 h-4 text-green-500" /> Nutrition Targets
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-baseline">
                         <span className="text-slate-400 text-sm">Daily Calories</span>
                         <span className="text-xl font-bold text-white">{selectedClient.target_calories || 0}</span>
                      </div>
                      <Separator className="bg-slate-800" />
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="bg-slate-900/50 p-2 rounded">
                          <div className="font-bold text-blue-400">{selectedClient.target_protein || 0}g</div>
                          <div className="text-[10px] text-slate-500">Protein</div>
                        </div>
                        <div className="bg-slate-900/50 p-2 rounded">
                          <div className="font-bold text-yellow-400">{selectedClient.target_fat || 0}g</div>
                          <div className="text-[10px] text-slate-500">Fat</div>
                        </div>
                        <div className="bg-slate-900/50 p-2 rounded">
                          <div className="font-bold text-red-400">{selectedClient.target_carbs || 0}g</div>
                          <div className="text-[10px] text-slate-500">Carbs</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Goal & Notes */}
                  <Card className="bg-slate-950 border-slate-800 md:col-span-2">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-slate-400 flex items-center gap-2">
                        <FileText className="w-4 h-4 text-purple-500" /> Goals & Notes
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                       <div>
                         <Label className="text-xs text-slate-500 uppercase">Primary Goal</Label>
                         <p className="text-white mt-1">{selectedClient.goal || 'No goal set'}</p>
                       </div>
                       {selectedClient.notes && (
                         <div>
                           <Label className="text-xs text-slate-500 uppercase">Notes</Label>
                           <p className="text-slate-300 text-sm mt-1 bg-slate-900 p-3 rounded-md border border-slate-800">
                             {selectedClient.notes}
                           </p>
                         </div>
                       )}
                    </CardContent>
                  </Card>

                </div>
             </div>
           ) : (
             <div className="h-full flex flex-col items-center justify-center text-slate-500 border-2 border-dashed border-slate-800 rounded-lg bg-slate-900/30 min-h-[300px]">
                <Users className="w-12 h-12 mb-4 opacity-20" />
                <p>Select a client from the list to view details.</p>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
