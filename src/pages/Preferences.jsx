
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useSearchParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle
} from "@/components/ui/card";
import { Settings as SettingsIcon, MessageSquare, ShieldAlert, Database, CreditCard, Loader2, Mail, Activity, Bell, Utensils, DollarSign, FileDown, Key, Siren } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';
import ApiKeysTab from '@/components/admin/ApiKeysTab';
import AdminUserManagement from '@/components/admin/AdminUserManagement';
import AdminEventsDashboard from '@/components/admin/AdminEventsDashboard';
import AdminAlertsPreferences from '@/components/AdminAlertsPreferences';

export default function Preferences() {
  const { user, is_admin } = useAuth();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'general');

  // --- General State ---
  const [timezone, setTimezone] = useState('America/New_York');

  // --- Notifications State ---
  const [emailNotifications, setEmailNotifications] = useState({
    weekly_plan: true,
    recipe_updates: true
  });

  // --- Nutrition State ---
  const [macros, setMacros] = useState({
    calories: 2000,
    protein: 150,
    fat: 100,
    carbs: 50
  });

  // --- Health State ---
  const [googleFitEnabled, setGoogleFitEnabled] = useState(false);

  // --- Message Admin State ---
  const [msgCategory, setMsgCategory] = useState('Bug Report');
  const [msgSubject, setMsgSubject] = useState('');
  const [msgBody, setMsgBody] = useState('');
  const [sendingMsg, setSendingMsg] = useState(false);

  // --- Admin Pricing State ---
  const [ingredientPrices, setIngredientPrices] = useState([]);
  const [pricesLoading, setPricesLoading] = useState(false);

  // --- Initial Data Loading ---
  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
        try {
            const { data: profile } = await supabase.from('profiles').select('timezone').eq('user_id', user.id).maybeSingle();
            if (profile?.timezone) setTimezone(profile.timezone);

            const { data: prefs } = await supabase.from('user_preferences').select('*').eq('user_id', user.id).maybeSingle();
            
            if (prefs) {
                if (prefs.preferences?.notifications) {
                    setEmailNotifications(prev => ({ ...prev, ...prefs.preferences.notifications }));
                }
                if (prefs.preferences?.integrations?.google_fit) {
                    setGoogleFitEnabled(prefs.preferences.integrations.google_fit);
                }
                if (prefs.daily_targets) {
                    setMacros(prev => ({ ...prev, ...prefs.daily_targets }));
                }
            }

            if (is_admin) {
                setPricesLoading(true);
                const { data: prices } = await supabase.from('ingredient_prices').select('*').order('name').limit(10);
                setIngredientPrices(prices || []);
                setPricesLoading(false);
            }
        } catch (err) {
            console.error("Error loading preferences:", err);
        }
    };

    loadData();
  }, [user, is_admin]);

  const handleSaveGeneral = async () => {
    try {
        await supabase.from('profiles').upsert({ user_id: user.id, timezone });
        toast({ title: "Preferences Saved", description: "Regional settings updated." });
    } catch (e) {
        toast({ variant: "destructive", title: "Error", description: "Failed to save settings." });
    }
  };

  const handleSaveNotifications = async () => {
      try {
          const { data: current } = await supabase.from('user_preferences').select('preferences').eq('user_id', user.id).maybeSingle();
          const newPrefs = { ...(current?.preferences || {}), notifications: emailNotifications };
          await supabase.from('user_preferences').upsert({ 
              user_id: user.id, 
              preferences: newPrefs,
              updated_at: new Date().toISOString()
          });
          toast({ title: "Notifications Saved" });
      } catch (e) {
          toast({ variant: "destructive", title: "Error" });
      }
  };

  const handleSaveMacros = async () => {
      try {
          await supabase.from('user_preferences').upsert({ 
              user_id: user.id, 
              daily_targets: macros,
              updated_at: new Date().toISOString()
          });
          toast({ title: "Macros Updated", description: "Nutrition targets saved successfully." });
      } catch (e) {
          toast({ variant: "destructive", title: "Error" });
      }
  };

  const handleToggleGoogleFit = async (enabled) => {
      setGoogleFitEnabled(enabled);
      try {
          const { data: current } = await supabase.from('user_preferences').select('preferences').eq('user_id', user.id).maybeSingle();
          const newPrefs = { ...(current?.preferences || {}), integrations: { ...(current?.preferences?.integrations || {}), google_fit: enabled }};
          await supabase.from('user_preferences').upsert({ 
              user_id: user.id, 
              preferences: newPrefs,
              updated_at: new Date().toISOString()
          });
          toast({ title: enabled ? "Integration Enabled" : "Integration Disabled" });
      } catch (e) {
          toast({ variant: "destructive", title: "Error" });
      }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!msgSubject || !msgBody) {
        toast({ variant: "destructive", title: "Missing Fields" });
        return;
    }
    setSendingMsg(true);
    try {
        const { error } = await supabase.from('admin_inbox').insert({
            user_id: user.id,
            email: user.email,
            category: msgCategory,
            subject: msgSubject,
            message: msgBody
        });
        if (error) throw error;
        toast({ title: "Message Sent", description: "Support team has been notified." });
        setMsgSubject('');
        setMsgBody('');
    } catch (error) {
        toast({ variant: "destructive", title: "Error", description: "Failed to send message." });
    } finally {
        setSendingMsg(false);
    }
  };

  useEffect(() => {
     if (!is_admin && (activeTab === 'admin' || activeTab === 'api-keys' || activeTab === 'system-events' || activeTab === 'alerts')) {
         setActiveTab('general');
     }
  }, [activeTab, is_admin, user]);


  return (
    <div className="container max-w-6xl mx-auto py-8 space-y-8 animate-in fade-in duration-500 min-h-screen pb-20">
      <Helmet>
        <title>Preferences | Keto Contractor</title>
      </Helmet>

      <div className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <SettingsIcon className="w-8 h-8 text-cyan-500" />
            Settings & Preferences
          </h1>
          <p className="text-slate-400 mt-1">Manage your account settings, notifications, and goals.</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(val) => { setActiveTab(val); setSearchParams({ tab: val }); }} className="space-y-6">
        <TabsList className="bg-slate-900 border border-slate-800 flex flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="general" className="data-[state=active]:bg-cyan-900/50 data-[state=active]:text-cyan-400">
            General
          </TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-cyan-900/50 data-[state=active]:text-cyan-400">
             <Bell className="w-4 h-4 mr-2" /> Notifications
          </TabsTrigger>
          <TabsTrigger value="nutrition" className="data-[state=active]:bg-cyan-900/50 data-[state=active]:text-cyan-400">
             <Utensils className="w-4 h-4 mr-2" /> Nutrition
          </TabsTrigger>
          <TabsTrigger value="health" className="data-[state=active]:bg-cyan-900/50 data-[state=active]:text-cyan-400">
             <Activity className="w-4 h-4 mr-2" /> Health
          </TabsTrigger>
          <TabsTrigger value="contact" className="data-[state=active]:bg-cyan-900/50 data-[state=active]:text-cyan-400">
            <MessageSquare className="w-4 h-4 mr-2" /> Message Admin
          </TabsTrigger>
          {is_admin && (
            <>
              <TabsTrigger value="admin" className="data-[state=active]:bg-red-900/20 data-[state=active]:text-red-400 text-red-400/70 border border-transparent data-[state=active]:border-red-900/50">
                <ShieldAlert className="w-4 h-4 mr-2" /> Admin Tools
              </TabsTrigger>
              <TabsTrigger value="alerts" className="data-[state=active]:bg-amber-900/20 data-[state=active]:text-amber-400 text-amber-400/70 border border-transparent data-[state=active]:border-amber-900/50">
                <Siren className="w-4 h-4 mr-2" /> Alerts
              </TabsTrigger>
              <TabsTrigger value="api-keys" className="data-[state=active]:bg-purple-900/20 data-[state=active]:text-purple-400 text-purple-400/70 border border-transparent data-[state=active]:border-purple-900/50">
                <Key className="w-4 h-4 mr-2" /> API Keys
              </TabsTrigger>
              <TabsTrigger value="system-events" className="data-[state=active]:bg-blue-900/20 data-[state=active]:text-blue-400 text-blue-400/70 border border-transparent data-[state=active]:border-blue-900/50">
                <Database className="w-4 h-4 mr-2" /> System Events
              </TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="general" className="space-y-6">
           <Card className="bg-[#1e293b] border-slate-800">
              <CardHeader>
                 <CardTitle className="text-white">Regional Settings</CardTitle>
                 <CardDescription>Set your preferred units and calendar format.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 max-w-md">
                 <div className="space-y-2">
                    <Label className="text-slate-200">Timezone</Label>
                    <Select value={timezone} onValueChange={setTimezone}>
                       <SelectTrigger className="bg-slate-900 border-slate-700 text-white"><SelectValue /></SelectTrigger>
                       <SelectContent className="bg-slate-900 border-slate-800 text-white">
                          <SelectItem value="America/New_York">Eastern Time (US)</SelectItem>
                          <SelectItem value="America/Chicago">Central Time (US)</SelectItem>
                          <SelectItem value="America/Los_Angeles">Pacific Time (US)</SelectItem>
                          <SelectItem value="UTC">UTC</SelectItem>
                          <SelectItem value="Europe/London">London</SelectItem>
                       </SelectContent>
                    </Select>
                 </div>
                 <Button onClick={handleSaveGeneral} className="bg-cyan-600 hover:bg-cyan-500 text-white">Save Changes</Button>
              </CardContent>
           </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
            <Card className="bg-[#1e293b] border-slate-800">
                <CardHeader>
                    <CardTitle className="text-white">Email Notifications</CardTitle>
                    <CardDescription>Decide what email notifications you want to receive.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 max-w-2xl">
                    <div className="flex items-center justify-between">
                        <Label className="text-base text-slate-200">Weekly Plan Summary</Label>
                        <Switch checked={emailNotifications.weekly_plan} onCheckedChange={(c) => setEmailNotifications(prev => ({...prev, weekly_plan: c}))} />
                    </div>
                    <div className="flex items-center justify-between">
                        <Label className="text-base text-slate-200">Recipe Updates & News</Label>
                        <Switch checked={emailNotifications.recipe_updates} onCheckedChange={(c) => setEmailNotifications(prev => ({...prev, recipe_updates: c}))} />
                    </div>
                    <Button onClick={handleSaveNotifications} className="bg-cyan-600 hover:bg-cyan-500 text-white">Save Preferences</Button>
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="nutrition" className="space-y-6">
            <Card className="bg-[#1e293b] border-slate-800">
                <CardHeader>
                    <CardTitle className="text-white">Daily Macro Targets</CardTitle>
                    <CardDescription>Set your personal daily targets.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2"><Label className="text-slate-200">Calories (kcal)</Label><Input type="number" value={macros.calories} onChange={(e) => setMacros(prev => ({...prev, calories: parseInt(e.target.value)||0}))} className="bg-slate-900 border-slate-700 text-white"/></div>
                        <div className="space-y-2"><Label className="text-slate-200">Protein (g)</Label><Input type="number" value={macros.protein} onChange={(e) => setMacros(prev => ({...prev, protein: parseInt(e.target.value)||0}))} className="bg-slate-900 border-slate-700 text-white"/></div>
                        <div className="space-y-2"><Label className="text-slate-200">Fat (g)</Label><Input type="number" value={macros.fat} onChange={(e) => setMacros(prev => ({...prev, fat: parseInt(e.target.value)||0}))} className="bg-slate-900 border-slate-700 text-white"/></div>
                        <div className="space-y-2"><Label className="text-slate-200">Net Carbs (g)</Label><Input type="number" value={macros.carbs} onChange={(e) => setMacros(prev => ({...prev, carbs: parseInt(e.target.value)||0}))} className="bg-slate-900 border-slate-700 text-white"/></div>
                    </div>
                    <Button onClick={handleSaveMacros} className="bg-cyan-600 hover:bg-cyan-500 text-white">Save Targets</Button>
                </CardContent>
            </Card>
            {is_admin && (
                <Card className="bg-slate-950 border-red-900/30">
                    <CardHeader>
                        <CardTitle className="text-red-400 flex items-center gap-2"><DollarSign className="w-5 h-5" /> Shopping List Pricing</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {pricesLoading ? <Loader2 className="animate-spin w-4 h-4"/> : ingredientPrices.length > 0 ? (
                            <div className="bg-slate-900 rounded-md border border-slate-800 overflow-hidden">
                                {ingredientPrices.map((item) => (
                                    <div key={item.id} className="flex justify-between p-3 border-b border-slate-800 last:border-0">
                                        <span className="text-slate-200">{item.name}</span>
                                        <span className="text-cyan-400 font-mono">${item.avg_cost_per_unit?.toFixed(2)}</span>
                                    </div>
                                ))}
                            </div>
                        ) : <p className="text-slate-500 italic">No data.</p>}
                    </CardContent>
                </Card>
            )}
        </TabsContent>

        <TabsContent value="health" className="space-y-6">
            <Card className="bg-[#1e293b] border-slate-800">
                <CardHeader>
                    <CardTitle className="text-white">Health Data</CardTitle>
                    <CardDescription>Connect health data sources.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800 flex items-center justify-between">
                        <div className="font-medium text-white">Google Fit Integration</div>
                        <Switch checked={googleFitEnabled} onCheckedChange={handleToggleGoogleFit} />
                    </div>
                </CardContent>
            </Card>
        </TabsContent>

        <TabsContent value="contact" className="space-y-6">
            <Card className="bg-[#1e293b] border-slate-800">
                <CardHeader>
                    <CardTitle className="text-white">Contact Support</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSendMessage} className="space-y-4 max-w-xl">
                        <div className="space-y-2"><Label className="text-slate-200">Category</Label><Select value={msgCategory} onValueChange={setMsgCategory}><SelectTrigger className="bg-slate-900 border-slate-700 text-white"><SelectValue /></SelectTrigger><SelectContent className="bg-slate-900 border-slate-800 text-white"><SelectItem value="Bug Report">Bug Report</SelectItem><SelectItem value="Other">Other</SelectItem></SelectContent></Select></div>
                        <div className="space-y-2"><Label className="text-slate-200">Subject</Label><Input value={msgSubject} onChange={(e) => setMsgSubject(e.target.value)} className="bg-slate-900 border-slate-700 text-white"/></div>
                        <div className="space-y-2"><Label className="text-slate-200">Message</Label><Textarea value={msgBody} onChange={(e) => setMsgBody(e.target.value)} className="bg-slate-900 border-slate-700 text-white min-h-[150px]"/></div>
                        <Button type="submit" disabled={sendingMsg} className="bg-cyan-600 hover:bg-cyan-500 text-white">{sendingMsg ? <Loader2 className="w-4 h-4 animate-spin"/> : <Mail className="w-4 h-4 mr-2"/>} Send Message</Button>
                    </form>
                </CardContent>
            </Card>
        </TabsContent>

        {is_admin && (
            <>
                <TabsContent value="admin" className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Link to="/admin/cleanup" className="block"><Card className="bg-slate-950 border-slate-800 hover:border-cyan-500 transition-colors cursor-pointer h-full"><CardContent className="p-4 flex flex-col items-center justify-center text-center gap-2 h-full"><Database className="w-8 h-8 text-cyan-500" /><span className="text-sm font-bold text-slate-300">DB Cleanup</span></CardContent></Card></Link>
                        <Link to="/admin/import" className="block"><Card className="bg-slate-950 border-slate-800 hover:border-cyan-500 transition-colors cursor-pointer h-full"><CardContent className="p-4 flex flex-col items-center justify-center text-center gap-2 h-full"><FileDown className="w-8 h-8 text-emerald-500" /><span className="text-sm font-bold text-slate-300">Data Import</span></CardContent></Card></Link>
                        <Link to="/admin/messages" className="block"><Card className="bg-slate-950 border-slate-800 hover:border-cyan-500 transition-colors cursor-pointer h-full"><CardContent className="p-4 flex flex-col items-center justify-center text-center gap-2 h-full"><MessageSquare className="w-8 h-8 text-pink-500" /><span className="text-sm font-bold text-slate-300">Admin Inbox</span></CardContent></Card></Link>
                        <Card onClick={() => setActiveTab('alerts')} className="bg-slate-950 border-slate-800 hover:border-cyan-500 transition-colors cursor-pointer h-full"><CardContent className="p-4 flex flex-col items-center justify-center text-center gap-2 h-full"><Siren className="w-8 h-8 text-amber-500" /><span className="text-sm font-bold text-slate-300">Alerts Monitor</span></CardContent></Card>
                        <Card onClick={() => setActiveTab('api-keys')} className="bg-slate-950 border-slate-800 hover:border-cyan-500 transition-colors cursor-pointer h-full"><CardContent className="p-4 flex flex-col items-center justify-center text-center gap-2 h-full"><Key className="w-8 h-8 text-purple-500" /><span className="text-sm font-bold text-slate-300">API Keys</span></CardContent></Card>
                        <Card onClick={() => setActiveTab('system-events')} className="bg-slate-950 border-slate-800 hover:border-cyan-500 transition-colors cursor-pointer h-full"><CardContent className="p-4 flex flex-col items-center justify-center text-center gap-2 h-full"><ShieldAlert className="w-8 h-8 text-blue-500" /><span className="text-sm font-bold text-slate-300">System Logs</span></CardContent></Card>
                    </div>
                    
                    {/* Admin User Management Component */}
                    <AdminUserManagement />

                </TabsContent>

                <TabsContent value="alerts" className="space-y-6"><AdminAlertsPreferences /></TabsContent>
                <TabsContent value="api-keys" className="space-y-6"><ApiKeysTab /></TabsContent>
                
                {/* Admin Events Dashboard Tab */}
                <TabsContent value="system-events" className="space-y-6">
                    <AdminEventsDashboard />
                </TabsContent>
            </>
        )}
      </Tabs>
    </div>
  );
}
