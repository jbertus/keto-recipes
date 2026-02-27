import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/components/ui/use-toast';
import { generateClientMealPlan } from '@/lib/mealPlanGenerator';
import {
  ArrowLeft,
  Calendar,
  Activity,
  ChefHat,
  MessageSquare,
  Settings,
  LineChart,
  Target,
  Utensils,
  BrainCircuit,
  ExternalLink,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { Line, Bar, ComposedChart, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area, AreaChart } from 'recharts';

export default function ClientDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [generating, setGenerating] = useState(false);
  const [planExists, setPlanExists] = useState(false);

  // Mock data for charts
  const progressData = [
    { date: 'Week 1', weight: 185, calories: 1950 },
    { date: 'Week 2', weight: 184, calories: 2050 },
    { date: 'Week 3', weight: 182.5, calories: 2000 },
    { date: 'Week 4', weight: 181, calories: 1980 },
    { date: 'Week 5', weight: 180.2, calories: 2100 },
  ];

  useEffect(() => {
    if (user && id) {
      fetchClientDetails();
      checkExistingPlan();
    }
  }, [user, id]);

  const fetchClientDetails = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      setClient(data);
    } catch (error) {
      console.error('Error fetching client:', error);
      toast({ variant: "destructive", title: "Error", description: "Could not load client details." });
      navigate('/clients');
    } finally {
      setLoading(false);
    }
  };

  const checkExistingPlan = async () => {
    const { data } = await supabase
      .from('client_meal_plans')
      .select('id')
      .eq('client_id', id)
      .limit(1);
    
    if (data && data.length > 0) setPlanExists(true);
  };

  const handleGeneratePlan = async () => {
     setGenerating(true);
     try {
       await generateClientMealPlan(id, user.id);
       toast({
          title: "Plan Generated Successfully",
          description: "AI Recipe Generator has built a weekly plan based on client macros.",
       });
       setPlanExists(true);
       setActiveTab('plan'); // Switch to plan tab
     } catch (error) {
       console.error("Plan generation error:", error);
       toast({
         variant: "destructive",
         title: "Generation Failed",
         description: error.message || "Could not generate plan. Ensure you have recipes in your library."
       });
     } finally {
       setGenerating(false);
     }
  };

  if (loading || !client) {
    return <div className="p-8 text-center text-slate-400">Loading client profile...</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Helmet>
        <title>{client.first_name}'s Profile | Keto Contractor</title>
      </Helmet>

      {/* Header */}
      <div className="flex flex-col gap-4">
        <Button variant="ghost" className="w-fit text-slate-400 hover:text-white p-0 hover:bg-transparent" onClick={() => navigate('/clients')}>
           <ArrowLeft className="w-4 h-4 mr-2" /> Back to Roster
        </Button>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
           <div>
              <h1 className="text-3xl font-bold text-white tracking-tight">{client.first_name} {client.last_name}</h1>
              <p className="text-slate-400 flex items-center gap-2 mt-1">
                 <span className="bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded text-xs border border-cyan-500/20">{client.goal}</span>
                 <span>•</span>
                 <span>{client.email}</span>
              </p>
           </div>
           <div className="flex gap-2">
              <Button 
                onClick={handleGeneratePlan} 
                disabled={generating}
                className="bg-purple-600 hover:bg-purple-500 text-white gap-2 shadow-lg shadow-purple-900/20"
              >
                 {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <BrainCircuit className="w-4 h-4" />}
                 {planExists ? 'Regenerate Plan' : 'Auto-Generate Plan'}
              </Button>
              <Button variant="outline" className="border-slate-700 bg-slate-800 text-slate-300">
                 <Settings className="w-4 h-4" />
              </Button>
           </div>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-slate-900 border border-slate-800 p-1">
          <TabsTrigger value="overview" className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white">Overview</TabsTrigger>
          <TabsTrigger value="plan" className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white">Meal Plan</TabsTrigger>
          <TabsTrigger value="progress" className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white">Progress</TabsTrigger>
          <TabsTrigger value="coaching" className="data-[state=active]:bg-cyan-600 data-[state=active]:text-white">Coaching</TabsTrigger>
        </TabsList>

        {/* OVERVIEW TAB */}
        <TabsContent value="overview" className="space-y-6">
           {/* KPI Cards */}
           <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-[#1e293b] border-slate-800">
                 <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-slate-400">Current Weight</CardTitle>
                 </CardHeader>
                 <CardContent>
                    <div className="text-2xl font-bold text-white">{client.weight_kg || '--'} <span className="text-sm font-normal text-slate-500">kg</span></div>
                    <p className="text-xs text-emerald-400 flex items-center mt-1"><Activity className="w-3 h-3 mr-1" /> -1.2kg this week</p>
                 </CardContent>
              </Card>
              <Card className="bg-[#1e293b] border-slate-800">
                 <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-slate-400">Daily Calories</CardTitle>
                 </CardHeader>
                 <CardContent>
                    <div className="text-2xl font-bold text-white">{client.target_calories}</div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                       <div className="bg-cyan-500 h-full w-[85%] rounded-full" />
                    </div>
                 </CardContent>
              </Card>
              <Card className="bg-[#1e293b] border-slate-800">
                 <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-slate-400">Plan Adherence</CardTitle>
                 </CardHeader>
                 <CardContent>
                    <div className="text-2xl font-bold text-emerald-400">92%</div>
                    <p className="text-xs text-slate-500 mt-1">Last 7 days</p>
                 </CardContent>
              </Card>
              <Card className="bg-[#1e293b] border-slate-800">
                 <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-slate-400">Next Check-in</CardTitle>
                 </CardHeader>
                 <CardContent>
                    <div className="text-xl font-bold text-white">Friday</div>
                    <p className="text-xs text-slate-500 mt-1">Oct 24, 2:00 PM</p>
                 </CardContent>
              </Card>
           </div>

           {/* Macro Breakdown */}
           <Card className="bg-[#1e293b] border-slate-800">
              <CardHeader>
                 <CardTitle className="text-lg text-white">Target Macros</CardTitle>
              </CardHeader>
              <CardContent>
                 <div className="grid grid-cols-3 gap-8">
                    <div className="text-center space-y-2">
                       <div className="text-3xl font-black text-cyan-400">{client.target_protein}g</div>
                       <div className="text-xs text-slate-500 uppercase tracking-wider font-bold">Protein</div>
                       <Progress value={80} className="h-2 bg-slate-800" indicatorClassName="bg-cyan-500" />
                    </div>
                    <div className="text-center space-y-2">
                       <div className="text-3xl font-black text-yellow-400">{client.target_fat}g</div>
                       <div className="text-xs text-slate-500 uppercase tracking-wider font-bold">Fat</div>
                       <Progress value={65} className="h-2 bg-slate-800" indicatorClassName="bg-yellow-400" />
                    </div>
                    <div className="text-center space-y-2">
                       <div className="text-3xl font-black text-emerald-400">{client.target_carbs}g</div>
                       <div className="text-xs text-slate-500 uppercase tracking-wider font-bold">Net Carbs</div>
                       <Progress value={40} className="h-2 bg-slate-800" indicatorClassName="bg-emerald-500" />
                    </div>
                 </div>
              </CardContent>
           </Card>
           
           <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-800 border-dashed text-center">
              <h3 className="text-white font-semibold mb-2">Public Client Dashboard</h3>
              <p className="text-slate-400 text-sm mb-4">Share this link with your client so they can view their meal plan and track progress.</p>
              <Link to={`/client-dashboard/${client.id}`} target="_blank" className="inline-flex items-center text-cyan-400 hover:text-cyan-300 font-medium">
                 Open Client Dashboard <ExternalLink className="w-4 h-4 ml-2" />
              </Link>
           </div>
        </TabsContent>

        {/* PLAN TAB */}
        <TabsContent value="plan" className="space-y-6">
           <Card className="bg-[#1e293b] border-slate-800">
              <CardHeader>
                 <CardTitle className="flex justify-between items-center text-white">
                    <span>Weekly Meal Plan</span>
                    {planExists && (
                       <Badge variant="outline" className="text-emerald-400 border-emerald-500/30 bg-emerald-950/20">
                          Active Plan
                       </Badge>
                    )}
                 </CardTitle>
                 <CardDescription>
                    {planExists 
                       ? "A customized plan is currently active for this client." 
                       : "No plan generated yet. Use the 'Auto-Generate Plan' button above."}
                 </CardDescription>
              </CardHeader>
              <CardContent>
                 {planExists ? (
                   <div className="flex flex-col items-center py-8 gap-4">
                      <div className="w-16 h-16 rounded-full bg-emerald-900/20 flex items-center justify-center">
                         <Calendar className="w-8 h-8 text-emerald-500" />
                      </div>
                      <h3 className="text-lg font-medium text-white">Plan Ready & Published</h3>
                      <div className="flex gap-3">
                         <Link to={`/client-dashboard/${client.id}`} target="_blank">
                             <Button className="bg-cyan-600 hover:bg-cyan-500">
                                View Plan as Client <ExternalLink className="w-4 h-4 ml-2" />
                             </Button>
                         </Link>
                         <Button variant="outline" onClick={handleGeneratePlan} disabled={generating} className="border-slate-700">
                             <RefreshCw className={`w-4 h-4 mr-2 ${generating ? 'animate-spin' : ''}`} /> Regenerate
                         </Button>
                      </div>
                   </div>
                 ) : (
                   <div className="text-center py-12">
                       <Button onClick={handleGeneratePlan} className="bg-purple-600 hover:bg-purple-500">
                          Generate First Plan
                       </Button>
                   </div>
                 )}
              </CardContent>
           </Card>
        </TabsContent>

        {/* PROGRESS TAB */}
        <TabsContent value="progress" className="space-y-6">
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-[#1e293b] border-slate-800">
                 <CardHeader>
                    <CardTitle className="text-white">Weight Trend</CardTitle>
                 </CardHeader>
                 <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                       <AreaChart data={progressData}>
                          <defs>
                             <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                             </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                          <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} domain={['dataMin - 1', 'dataMax + 1']} />
                          <Tooltip 
                             contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }}
                             itemStyle={{ color: '#f8fafc' }}
                          />
                          <Area type="monotone" dataKey="weight" stroke="#06b6d4" strokeWidth={3} fillOpacity={1} fill="url(#colorWeight)" />
                       </AreaChart>
                    </ResponsiveContainer>
                 </CardContent>
              </Card>

              <Card className="bg-[#1e293b] border-slate-800">
                 <CardHeader>
                    <CardTitle className="text-white">Calorie Adherence</CardTitle>
                 </CardHeader>
                 <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                       <ComposedChart data={progressData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                          <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                          <Tooltip 
                             contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }}
                          />
                          <Bar dataKey="calories" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={40} />
                          <Line type="monotone" dataKey="calories" stroke="#c084fc" strokeWidth={2} dot={{ r: 4, fill: '#c084fc' }} />
                       </ComposedChart>
                    </ResponsiveContainer>
                 </CardContent>
              </Card>
           </div>
        </TabsContent>

        {/* COACHING TAB */}
        <TabsContent value="coaching" className="space-y-6">
           <Card className="bg-gradient-to-br from-purple-900/20 to-slate-900 border-purple-500/20 border">
              <CardHeader>
                 <CardTitle className="text-white flex items-center gap-2">
                    <BrainCircuit className="w-6 h-6 text-purple-400" />
                    AI Insights
                 </CardTitle>
                 <CardDescription className="text-slate-400">Automated observations based on {client.first_name}'s recent logs.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-800 flex gap-4">
                    <div className="bg-yellow-500/10 p-2 rounded-full h-fit">
                       <Utensils className="w-5 h-5 text-yellow-500" />
                    </div>
                    <div>
                       <h4 className="font-semibold text-white">Fat Intake Below Target</h4>
                       <p className="text-sm text-slate-400 mt-1">Client is consistently under-eating fat by ~15g/day. Consider adding "Avocado & Oil" boosters to lunch meals.</p>
                       <Button variant="link" className="text-cyan-400 px-0 h-auto mt-2 text-xs">View High-Fat Recipes</Button>
                    </div>
                 </div>

                 <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-800 flex gap-4">
                    <div className="bg-emerald-500/10 p-2 rounded-full h-fit">
                       <Activity className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div>
                       <h4 className="font-semibold text-white">Great Protein Consistency</h4>
                       <p className="text-sm text-slate-400 mt-1">Hitting protein targets 6/7 days. Muscle retention markers are likely improving.</p>
                    </div>
                 </div>
              </CardContent>
           </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}