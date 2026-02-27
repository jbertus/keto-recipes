
import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Mail, CheckCircle2, AlertCircle, Reply, ArrowLeft } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { format } from 'date-fns';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function AdminMessages() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (isAdmin) {
      fetchMessages();
    }
  }, [isAdmin]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('admin_inbox')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast({ variant: "destructive", title: "Error", description: "Failed to load messages." });
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      const { error } = await supabase
        .from('admin_inbox')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;
      
      setMessages(messages.map(m => m.id === id ? { ...m, status: newStatus } : m));
      toast({ title: "Status Updated", description: `Message marked as ${newStatus}` });
    } catch (error) {
      toast({ variant: "destructive", title: "Update Failed", description: error.message });
    }
  };

  const filteredMessages = messages.filter(m => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !m.status || m.status === 'new' || m.status === 'unread';
    if (filter === 'resolved') return m.status === 'resolved';
    return true;
  });

  if (!isAdmin) {
    return (
      <div className="p-8 text-center text-red-500">
        <AlertCircle className="w-12 h-12 mx-auto mb-4" />
        <h1 className="text-2xl font-bold">Access Denied</h1>
        <p>You must be an administrator to view this page.</p>
      </div>
    );
  }

  return (
    <div className="container max-w-6xl mx-auto py-8 space-y-8 animate-in fade-in duration-500 pb-20">
      <Helmet>
        <title>Admin Inbox | Keto Contractor</title>
      </Helmet>

      <div className="flex flex-col gap-6">
        <Button 
          variant="ghost" 
          className="self-start text-slate-400 hover:text-white pl-0 gap-2"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>

        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Mail className="w-8 h-8 text-cyan-500" />
              Admin Inbox
            </h1>
            <p className="text-slate-400 mt-1">Manage support requests and user messages.</p>
          </div>
          <Button variant="outline" onClick={fetchMessages} disabled={loading} className="border-slate-700 text-slate-300">
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Refresh"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" onValueChange={setFilter} className="space-y-6">
        <TabsList className="bg-slate-900 border border-slate-800">
          <TabsTrigger value="all">All Messages</TabsTrigger>
          <TabsTrigger value="unread">Unread / New</TabsTrigger>
          <TabsTrigger value="resolved">Resolved</TabsTrigger>
        </TabsList>

        <Card className="bg-[#1e293b] border-slate-800">
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center p-12"><Loader2 className="animate-spin w-8 h-8 text-cyan-500" /></div>
            ) : filteredMessages.length === 0 ? (
              <div className="text-center p-12 text-slate-500">No messages found.</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-950 hover:bg-slate-950">
                      <TableHead className="text-slate-400">Status</TableHead>
                      <TableHead className="text-slate-400">Date</TableHead>
                      <TableHead className="text-slate-400">User</TableHead>
                      <TableHead className="text-slate-400">Subject</TableHead>
                      <TableHead className="text-slate-400">Category</TableHead>
                      <TableHead className="text-right text-slate-400">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMessages.map((msg) => (
                      <TableRow key={msg.id} className="border-slate-800 hover:bg-slate-800/50">
                        <TableCell>
                          {msg.status === 'resolved' ? (
                            <Badge className="bg-green-900/30 text-green-400 border-green-800">Resolved</Badge>
                          ) : (
                            <Badge className="bg-cyan-900/30 text-cyan-400 border-cyan-800">New</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-slate-400 text-xs">
                          {format(new Date(msg.created_at), 'MMM d, h:mm a')}
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-white font-medium">{msg.email}</div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium text-slate-200">{msg.subject}</div>
                          <div className="text-xs text-slate-400 truncate max-w-xs">{msg.message}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs bg-slate-950 border-slate-700 text-slate-400">
                            {msg.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-8 w-8 text-slate-400 hover:text-white"
                              asChild
                            >
                              <a href={`mailto:${msg.email}?subject=Re: ${msg.subject}`} title="Reply via Email">
                                <Reply className="w-4 h-4" />
                              </a>
                            </Button>
                            {msg.status !== 'resolved' && (
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-8 w-8 text-green-500 hover:text-green-400 hover:bg-green-950/30"
                                onClick={() => updateStatus(msg.id, 'resolved')}
                                title="Mark Resolved"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
}
