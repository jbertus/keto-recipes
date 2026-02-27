
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send, RefreshCw, MessageSquare } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const AdminAlertMessenger = ({ alert }) => {
  const { user, is_admin } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newMessage, setNewMessage] = useState('');

  const fetchMessages = useCallback(async () => {
    if (!alert?.id || !is_admin) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('admin_messages')
        .select('*')
        .eq('alert_id', alert.id)
        .order('created_at', { ascending: true }); // Chronological order for chat

      if (error) throw error;
      setMessages(data || []);
    } catch (err) {
      console.error('Error fetching messages:', err);
      // Silent error for UI polish, or toast
    } finally {
      setLoading(false);
    }
  }, [alert?.id, is_admin]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSending(true);
    try {
      const { error } = await supabase.from('admin_messages').insert({
        alert_id: alert.id,
        author_id: user.id,
        author_role: 'admin',
        message: newMessage.trim(),
        action_type: null // General note
      });

      if (error) throw error;

      setNewMessage('');
      fetchMessages(); // Refresh thread
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error sending message",
        description: err.message
      });
    } finally {
      setSending(false);
    }
  };

  if (!is_admin) return null;

  const formatTimestamp = (isoString) => {
    try {
      return new Intl.DateTimeFormat('en-US', {
        timeZone: 'America/Chicago',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
      }).format(new Date(isoString));
    } catch (e) {
      return isoString;
    }
  };

  const getActionBadge = (type) => {
    switch (type) {
      case 'acknowledge': return <Badge variant="outline" className="text-blue-400 border-blue-900 bg-blue-950/30 text-[10px] ml-2">ACK</Badge>;
      case 'snooze': return <Badge variant="outline" className="text-yellow-400 border-yellow-900 bg-yellow-950/30 text-[10px] ml-2">SNOOZE</Badge>;
      case 'resolve': return <Badge variant="outline" className="text-green-400 border-green-900 bg-green-950/30 text-[10px] ml-2">RESOLVE</Badge>;
      default: return null;
    }
  };

  return (
    <div className="bg-slate-950 rounded-lg border border-slate-800 flex flex-col h-[400px]">
      <div className="p-3 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
        <h4 className="text-sm font-medium text-slate-300 flex items-center gap-2">
          <MessageSquare className="h-4 w-4" />
          Alert History & Notes
        </h4>
        <Button variant="ghost" size="sm" onClick={fetchMessages} disabled={loading} className="h-6 w-6 p-0 hover:bg-slate-800">
          <RefreshCw className={`h-3 w-3 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      <ScrollArea className="flex-1 p-4">
        {messages.length === 0 ? (
          <div className="text-center text-slate-500 text-xs italic py-8">
            No history recorded yet.
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex flex-col ${msg.author_role === 'system' ? 'items-center' : 'items-start'}`}>
                {msg.author_role === 'system' ? (
                   <div className="bg-slate-900/50 rounded-full px-3 py-1 text-[10px] text-slate-500 border border-slate-800">
                     {formatTimestamp(msg.created_at)} — {msg.message}
                   </div>
                ) : (
                  <div className="w-full">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-cyan-500">
                        {msg.author_id === user.id ? 'You' : 'Admin'}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {formatTimestamp(msg.created_at)}
                      </span>
                      {getActionBadge(msg.action_type)}
                    </div>
                    <div className="bg-slate-900 rounded-lg rounded-tl-none p-3 text-sm text-slate-300 border border-slate-800 shadow-sm max-w-[90%] break-words">
                      {msg.message}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      <div className="p-3 border-t border-slate-800 bg-slate-900/30">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Add a note..."
            className="flex-1 bg-slate-950 border-slate-800 focus:border-cyan-500/50 text-slate-200 text-sm h-9"
          />
          <Button 
            type="submit" 
            disabled={sending || !newMessage.trim()} 
            size="sm"
            className="bg-cyan-600 hover:bg-cyan-500 text-white h-9 w-9 p-0"
          >
            {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AdminAlertMessenger;
