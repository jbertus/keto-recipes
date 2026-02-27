
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Search, Loader2, MoreHorizontal, Shield, CreditCard, RefreshCw, AlertCircle, Copy, Plus, Minus } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminUserManagement() {
  const { user: currentUser, refreshUserProfile, isAdmin } = useAuth();
  
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);
  
  const [selectedUser, setSelectedUser] = useState(null);
  const [userEntitlements, setUserEntitlements] = useState(null);
  const [entitlementsLoading, setEntitlementsLoading] = useState(false);

  const [isPlanDialogOpen, setIsPlanDialogOpen] = useState(false);
  const [isCreditsDialogOpen, setIsCreditsDialogOpen] = useState(false);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);

  const [actionLoading, setActionLoading] = useState(false);
  const [newPlan, setNewPlan] = useState('');
  const [creditsAmount, setCreditsAmount] = useState(10);
  const [newRole, setNewRole] = useState('');

  const { toast } = useToast();

  useEffect(() => {
    // AUDIT VERIFIED: Ensure only admins fetch user lists
    if (isAdmin) {
      fetchUsers();
    } else {
        setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (selectedUser) {
      fetchEntitlements(selectedUser.user_id);
      setNewRole(selectedUser.role || 'user');
    }
  }, [selectedUser]);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (!isAdmin && currentUser) {
         query = query.eq('user_id', currentUser.id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchEntitlements = async (userId) => {
    setEntitlementsLoading(true);
    try {
      let query = supabase
        .from('entitlements')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      const { data, error } = await query;

      if (error) throw error;
      setUserEntitlements(data);
      if (data) setNewPlan(data.plan || 'trial');
      else setNewPlan('trial');
    } catch (err) {
      console.error('Error fetching entitlements:', err);
    } finally {
      setEntitlementsLoading(false);
    }
  };

  const handleUpdatePlan = async () => {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      const { data, error } = await supabase
        .from('entitlements')
        .upsert({ 
           user_id: selectedUser.user_id, 
           plan: newPlan,
           updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      toast({ title: "Plan Updated", description: `User plan saved as ${newPlan}` });
      setIsPlanDialogOpen(false);
      setUserEntitlements(data);
    } catch (err) {
      toast({ variant: "destructive", title: "Update Failed", description: err.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddCredits = async () => {
    if (!selectedUser || !userEntitlements) {
        toast({ variant: "destructive", title: "Error", description: "No entitlement record." });
        return;
    }
    setActionLoading(true);
    try {
      const isTrial = userEntitlements.plan === 'trial';
      const targetColumn = isTrial ? 'trial_units_remaining' : 'weekly_units_remaining';
      const currentBalance = userEntitlements[targetColumn] || 0;
      const newBalance = currentBalance + parseInt(creditsAmount);
      
      const { data, error } = await supabase
        .from('entitlements')
        .update({ [targetColumn]: newBalance })
        .eq('user_id', selectedUser.user_id)
        .select()
        .single();

      if (error) throw error;
      toast({ title: "Credits Added", description: `Added ${creditsAmount} credits.` });
      setIsCreditsDialogOpen(false);
      setCreditsAmount(10);
      setUserEntitlements(data);
    } catch (err) {
      toast({ variant: "destructive", title: "Update Failed", description: err.message });
    } finally {
      setActionLoading(false);
    }
  };
  
  const handleUpdateRole = async () => {
    if (!selectedUser) return;

    const validRoles = ['admin', 'user', 'coach'];
    if (!validRoles.includes(newRole)) {
      toast({ 
        variant: "destructive", 
        title: "Invalid Role", 
        description: "Role must be one of: admin, user, coach" 
      });
      return;
    }

    setActionLoading(true);
    try {
      const { data: rpcResponse, error: rpcError } = await supabase.rpc('admin_update_user_role', { 
          p_user_id: selectedUser.user_id, 
          p_new_role: newRole 
      });

      if (rpcError) throw rpcError;
      
      if (!rpcResponse.success) {
        throw new Error(rpcResponse.error || 'Unknown error occurred during role update');
      }

      toast({ 
        title: "Role Updated", 
        description: `Role updated to ${newRole}`,
        className: "bg-green-600 border-none text-white" 
      });
      
      setIsRoleDialogOpen(false);
      
      await fetchUsers();
      
      setSelectedUser(prev => ({ ...prev, role: newRole }));
          
      if (currentUser && currentUser.id === selectedUser.user_id) {
          await refreshUserProfile();
      }

    } catch (err) {
      console.error('Role update error:', err);
      toast({ 
        variant: "destructive", 
        title: "Failed to update role", 
        description: err.message 
      });
    } finally {
      setActionLoading(false);
    }
  };

  const copyToClipboard = (text) => {
      if (!text) return;
      navigator.clipboard.writeText(text);
      toast({ title: "Copied", description: "Copied to clipboard" });
  };

  const filteredUsers = users.filter(user => {
    const term = searchTerm.toLowerCase();
    const email = (user.email || '').toLowerCase();
    const id = (user.user_id || '').toLowerCase();
    return email.includes(term) || id.includes(term);
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[800px]">
      <Card className="lg:col-span-2 bg-slate-950 border-slate-800 flex flex-col overflow-hidden h-full">
        <CardHeader className="pb-3 border-b border-slate-800">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle className="text-white">All Users</CardTitle>
              <CardDescription>Manage user accounts.</CardDescription>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
               <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input 
                  placeholder="Search..." 
                  className="pl-9 bg-slate-900 border-slate-800 text-slate-200"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button type="button" variant="outline" size="icon" onClick={fetchUsers} disabled={loading} className="border-slate-800">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <div className="flex-1 overflow-auto">
          {error ? (
            <div className="flex flex-col items-center justify-center h-40 space-y-4">
              <div className="text-red-400 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                <span>{error}</span>
              </div>
              <Button type="button" variant="outline" onClick={fetchUsers}>Retry</Button>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-900 sticky top-0">
                <TableRow className="border-slate-800 hover:bg-slate-900">
                  <TableHead className="text-slate-400">User</TableHead>
                  <TableHead className="text-slate-400">Role</TableHead>
                  <TableHead className="text-slate-400">Status</TableHead>
                  <TableHead className="text-slate-400">Joined</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-slate-500">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                      Loading users...
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-slate-500">No users found.</TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow 
                      key={user.user_id} 
                      className={`border-slate-800 cursor-pointer transition-colors ${selectedUser?.user_id === user.user_id ? 'bg-cyan-950/30' : 'hover:bg-slate-900/50'}`}
                      onClick={() => setSelectedUser(user)}
                    >
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-200">{user.email}</span>
                          <span className="text-[10px] text-slate-500 font-mono truncate max-w-[120px]">{user.user_id}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={user.role === 'admin' ? 'border-purple-500/50 text-purple-400' : 'border-slate-700 text-slate-400'}>
                          {user.role || 'user'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                         <Badge variant="outline" className={user.inactive ? 'border-red-500/50 text-red-400' : 'border-emerald-500/50 text-emerald-400'}>
                          {user.inactive ? 'Inactive' : 'Active'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-slate-500">
                        {user.created_at ? format(new Date(user.created_at), 'MMM d, yyyy') : '-'}
                      </TableCell>
                      <TableCell><MoreHorizontal className="w-4 h-4 text-slate-500" /></TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </div>
      </Card>

      <div className="lg:col-span-1 space-y-6 h-full flex flex-col">
        {selectedUser ? (
          <Card className="bg-slate-950 border-slate-800 h-full flex flex-col">
            <CardHeader className="pb-4 border-b border-slate-800 bg-slate-900/50">
              <div className="flex items-center gap-3 mb-2">
                 <div className="h-10 w-10 rounded-full bg-gradient-to-br from-cyan-600 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                    {selectedUser.email?.[0]?.toUpperCase() || 'U'}
                 </div>
                 <div className="flex-1 overflow-hidden">
                    <CardTitle className="text-lg text-white truncate" title={selectedUser.email}>{selectedUser.email}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                        <code className="font-mono text-[10px] text-slate-500 bg-slate-900 px-1 py-0.5 rounded truncate flex-1">{selectedUser.user_id}</code>
                        <Button type="button" variant="ghost" size="icon" className="h-5 w-5 text-slate-500" onClick={() => copyToClipboard(selectedUser.user_id)}>
                            <Copy className="h-3 w-3" />
                        </Button>
                    </div>
                 </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-6">
               <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2"><CreditCard className="w-4 h-4" /> Plan</h4>
                  {entitlementsLoading ? <Loader2 className="animate-spin"/> : userEntitlements ? (
                    <div className="bg-slate-900/50 rounded-lg p-3 space-y-3 border border-slate-800 text-sm">
                       <div className="flex justify-between"><span className="text-slate-400">Plan</span><span className="text-cyan-400 font-bold uppercase">{userEntitlements.plan}</span></div>
                       <div className="flex justify-between"><span className="text-slate-400">Credits</span><span className="text-white font-mono">{userEntitlements.weekly_units_remaining}</span></div>
                    </div>
                  ) : <div className="text-yellow-500 text-xs">No plan data.</div>}
               </div>

               <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2"><Shield className="w-4 h-4" /> Actions</h4>
                  <div className="grid grid-cols-1 gap-3">
                     <Dialog open={isPlanDialogOpen} onOpenChange={setIsPlanDialogOpen}>
                        <DialogTrigger asChild><Button type="button" variant="outline" className="justify-start border-slate-700">Change Plan</Button></DialogTrigger>
                        <DialogContent className="bg-slate-950 border-slate-800 text-white">
                           <DialogHeader><DialogTitle>Change Plan</DialogTitle></DialogHeader>
                           <Select value={newPlan} onValueChange={setNewPlan}>
                              <SelectTrigger className="bg-slate-900 border-slate-700"><SelectValue /></SelectTrigger>
                              <SelectContent className="bg-slate-900 border-slate-800 text-white">
                                 {['trial','starter','pro','elite','founders'].map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                              </SelectContent>
                           </Select>
                           <DialogFooter><Button type="button" onClick={handleUpdatePlan} className="bg-cyan-600">Save</Button></DialogFooter>
                        </DialogContent>
                     </Dialog>
                     
                     <Dialog open={isCreditsDialogOpen} onOpenChange={setIsCreditsDialogOpen}>
                        <DialogTrigger asChild><Button type="button" variant="outline" className="justify-start border-slate-700">Add Credits</Button></DialogTrigger>
                        <DialogContent className="bg-slate-950 border-slate-800 text-white">
                           <DialogHeader><DialogTitle>Add Credits</DialogTitle></DialogHeader>
                           <div className="flex items-center justify-center gap-4 py-4">
                               <Button type="button" variant="outline" size="icon" onClick={() => setCreditsAmount(p => Math.max(1, p-1))}><Minus className="w-4 h-4"/></Button>
                               <Input type="number" value={creditsAmount} onChange={e => setCreditsAmount(parseInt(e.target.value)||0)} className="w-24 text-center bg-slate-900 border-slate-700"/>
                               <Button type="button" variant="outline" size="icon" onClick={() => setCreditsAmount(p => p+1)}><Plus className="w-4 h-4"/></Button>
                           </div>
                           <DialogFooter><Button type="button" onClick={handleAddCredits} className="bg-yellow-600 text-black">Add</Button></DialogFooter>
                        </DialogContent>
                     </Dialog>

                     <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
                        <DialogTrigger asChild><Button type="button" variant="outline" className="justify-start border-slate-700">Change Role</Button></DialogTrigger>
                        <DialogContent className="bg-slate-950 border-slate-800 text-white">
                           <DialogHeader><DialogTitle>Change Role</DialogTitle></DialogHeader>
                           <DialogDescription>
                             Select a new role for this user. Roles control access to features.
                           </DialogDescription>
                           <Select value={newRole} onValueChange={setNewRole}>
                              <SelectTrigger className="bg-slate-900 border-slate-700"><SelectValue /></SelectTrigger>
                              <SelectContent className="bg-slate-900 border-slate-800 text-white">
                                 {['user','admin','coach'].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                              </SelectContent>
                           </Select>
                           <DialogFooter><Button type="button" onClick={handleUpdateRole} className="bg-purple-600" disabled={actionLoading}>{actionLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : "Update Role"}</Button></DialogFooter>
                        </DialogContent>
                     </Dialog>
                  </div>
               </div>
            </CardContent>
          </Card>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 border border-slate-800 rounded-lg bg-slate-950/50 p-6 text-center">
             <Search className="w-8 h-8 text-slate-600 mb-4" />
             <p>Select a user to view details</p>
          </div>
        )}
      </div>
    </div>
  );
}
