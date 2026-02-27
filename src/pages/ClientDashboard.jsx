import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ArrowLeft, 
  Calendar, 
  ChefHat, 
  Target, 
  Trophy, 
  Flame, 
  Utensils, 
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import LoadingFallback from '@/components/LoadingFallback';

export default function ClientDashboard() {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState('Monday');

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  useEffect(() => {
    fetchDashboardData();
  }, [clientId]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // 1. Get Client Info
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single();
      
      if (clientError) throw clientError;
      setClient(clientData);

      // 2. Get Current Meal Plan
      const { data: planData, error: planError } = await supabase
        .from('client_meal_plans')
        .select('*')
        .eq('client_id', clientId)
        .order('week_start_date', { ascending: false })
        .limit(1)
        .single();
        
      if (!planError && planData) {
        setCurrentPlan(planData.plan_data);
      }

    } catch (error) {
      console.error("Dashboard error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingFallback />;
  if (!client) return <div className="p-8 text-center text-red-400">Client not found.</div>;

  const dayData = currentPlan ? currentPlan[selectedDay] : null;

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200">
      <Helmet>
        <title>{client.first_name}'s Dashboard | Keto Contractor</title>
      </Helmet>

      {/* Top Navigation Bar */}
      <div className="bg-[#0B1120] border-b border-slate-800 sticky top-0 z-10 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
           <Button variant="ghost" size="icon" onClick={() => navigate('/clients')} className="text-slate-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
           </Button>
           <div>
              <h1 className="text-lg font-bold text-white flex items-center gap-2">
                 Client Portal 
                 <Badge variant="outline" className="text-cyan-400 border-cyan-500/30 bg-cyan-950/20 text-xs font-normal">
                    {client.first_name} {client.last_name}
                 </Badge>
              </h1>
           </div>
        </div>
        <div className="flex items-center gap-4 text-sm text-slate-400">
           <span className="hidden md:inline">Current Goal: <span className="text-white font-medium">{client.goal}</span></span>
        </div>
      </div>

      <div className="container max-w-6xl mx-auto p-4 md:p-8 space-y-8">
        
        {/* Hero Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <Card className="bg-gradient-to-br from-cyan-900/20 to-slate-900 border-cyan-500/20 md:col-span-2">
              <CardHeader>
                 <CardTitle className="flex items-center gap-2 text-white">
                    <Trophy className="w-5 h-5 text-yellow-500" />
                    Weekly Progress
                 </CardTitle>
                 <CardDescription>You're crushing your protein targets this week!</CardDescription>
              </CardHeader>
              <CardContent>
                 <div className="space-y-4">
                    <div className="space-y-2">
                       <div className="flex justify-between text-sm">
                          <span className="text-slate-400">Plan Adherence</span>
                          <span className="text-emerald-400 font-bold">92%</span>
                       </div>
                       <Progress value={92} className="h-2 bg-slate-800" indicatorClassName="bg-emerald-500" />
                    </div>
                    <div className="grid grid-cols-3 gap-4 pt-4">
                        <div className="bg-slate-950/50 rounded-lg p-3 text-center border border-slate-800">
                           <div className="text-xs text-slate-500 uppercase font-bold">Current Wgt</div>
                           <div className="text-xl font-bold text-white">{client.weight_kg} kg</div>
                        </div>
                        <div className="bg-slate-950/50 rounded-lg p-3 text-center border border-slate-800">
                           <div className="text-xs text-slate-500 uppercase font-bold">Goal Wgt</div>
                           <div className="text-xl font-bold text-cyan-400">{(client.weight_kg - 5).toFixed(1)} kg</div>
                        </div>
                        <div className="bg-slate-950/50 rounded-lg p-3 text-center border border-slate-800">
                           <div className="text-xs text-slate-500 uppercase font-bold">Streak</div>
                           <div className="text-xl font-bold text-orange-400 flex items-center justify-center gap-1">
                              <Flame className="w-4 h-4 fill-orange-400" /> 12
                           </div>
                        </div>
                    </div>
                 </div>
              </CardContent>
           </Card>

           <Card className="bg-[#1e293b] border-slate-800">
              <CardHeader>
                 <CardTitle className="text-white flex items-center gap-2">
                    <Target className="w-5 h-5 text-cyan-400" />
                    Daily Targets
                 </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="flex justify-between items-center py-2 border-b border-slate-800">
                    <span className="text-slate-400">Calories</span>
                    <span className="font-mono text-xl font-bold text-white">{client.target_calories}</span>
                 </div>
                 <div className="flex justify-between items-center py-2 border-b border-slate-800">
                    <span className="text-slate-400">Protein</span>
                    <span className="font-mono text-xl font-bold text-cyan-400">{client.target_protein}g</span>
                 </div>
                 <div className="flex justify-between items-center py-2 border-b border-slate-800">
                    <span className="text-slate-400">Fat</span>
                    <span className="font-mono text-xl font-bold text-yellow-400">{client.target_fat}g</span>
                 </div>
                 <div className="flex justify-between items-center py-2">
                    <span className="text-slate-400">Net Carbs</span>
                    <span className="font-mono text-xl font-bold text-emerald-400">{client.target_carbs}g</span>
                 </div>
              </CardContent>
           </Card>
        </div>

        {/* Meal Plan Section */}
        <div className="space-y-6">
           <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                 <Calendar className="w-6 h-6 text-purple-500" />
                 Your Meal Plan
              </h2>
           </div>

           {!currentPlan ? (
              <Card className="bg-slate-900/50 border-slate-800 border-dashed py-12 text-center">
                 <div className="flex flex-col items-center justify-center">
                    <ChefHat className="w-12 h-12 text-slate-600 mb-4" />
                    <h3 className="text-xl font-medium text-white">No Meal Plan Assigned</h3>
                    <p className="text-slate-400 max-w-md mt-2">Your contractor hasn't published a meal plan for this week yet. Check back soon!</p>
                 </div>
              </Card>
           ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                 {/* Day Selector */}
                 <div className="lg:col-span-3">
                    <ScrollArea className="h-full">
                       <div className="flex flex-row lg:flex-col gap-2 pb-4 lg:pb-0 overflow-x-auto lg:overflow-visible">
                          {days.map(day => (
                             <button
                                key={day}
                                onClick={() => setSelectedDay(day)}
                                className={`
                                   flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all min-w-[120px] lg:w-full
                                   ${selectedDay === day 
                                      ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-900/20' 
                                      : 'bg-[#1e293b] text-slate-400 hover:bg-slate-800 hover:text-white'
                                   }
                                `}
                             >
                                {day}
                                {selectedDay === day && <CheckCircle2 className="w-4 h-4 ml-2" />}
                             </button>
                          ))}
                       </div>
                    </ScrollArea>
                 </div>

                 {/* Meals for Selected Day */}
                 <div className="lg:col-span-9 space-y-6">
                    {/* Day Macro Summary */}
                    <div className="bg-[#1e293b] rounded-xl p-4 border border-slate-800 flex flex-wrap justify-between gap-4 items-center">
                       <div className="text-lg font-bold text-white">{selectedDay} Summary</div>
                       <div className="flex gap-6 text-sm">
                          <div className="flex flex-col">
                             <span className="text-slate-500 text-xs uppercase">Calories</span>
                             <span className={dayData?.totals.calories > client.target_calories ? 'text-red-400' : 'text-white'}>
                                {dayData?.totals.calories || 0} / {client.target_calories}
                             </span>
                          </div>
                          <div className="flex flex-col">
                             <span className="text-slate-500 text-xs uppercase">Protein</span>
                             <span className="text-cyan-400">{dayData?.totals.protein || 0}g</span>
                          </div>
                          <div className="flex flex-col">
                             <span className="text-slate-500 text-xs uppercase">Fat</span>
                             <span className="text-yellow-400">{dayData?.totals.fat || 0}g</span>
                          </div>
                          <div className="flex flex-col">
                             <span className="text-slate-500 text-xs uppercase">Carbs</span>
                             <span className="text-emerald-400">{dayData?.totals.carbs || 0}g</span>
                          </div>
                       </div>
                    </div>

                    {/* Meal Cards */}
                    <div className="space-y-4">
                       {['Breakfast', 'Lunch', 'Dinner', 'Snack'].map(slot => {
                          const meal = dayData?.meals[slot];
                          return (
                             <Card key={slot} className="bg-[#1e293b] border-slate-800 overflow-hidden group hover:border-slate-700 transition-colors">
                                <div className="flex flex-col md:flex-row">
                                   <div className="w-full md:w-32 bg-slate-950 flex items-center justify-center p-4 border-b md:border-b-0 md:border-r border-slate-800">
                                      <span className="text-slate-400 font-medium text-sm uppercase tracking-wider">{slot}</span>
                                   </div>
                                   
                                   <div className="flex-1 p-4 md:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                      {meal ? (
                                         <>
                                            <div className="flex items-center gap-4">
                                               <div className="bg-cyan-900/20 p-3 rounded-full">
                                                  <Utensils className="w-6 h-6 text-cyan-400" />
                                               </div>
                                               <div>
                                                  <h3 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors">
                                                     {meal.name}
                                                  </h3>
                                                  <div className="flex gap-3 mt-1 text-xs text-slate-400">
                                                     <span>{meal.calories} kcal</span>
                                                     <span>•</span>
                                                     <span>{meal.protein}g Prot</span>
                                                     <span>•</span>
                                                     <span>{meal.fat}g Fat</span>
                                                  </div>
                                               </div>
                                            </div>
                                            <Button variant="outline" className="shrink-0 border-slate-700 hover:bg-slate-800">
                                               View Recipe
                                            </Button>
                                         </>
                                      ) : (
                                         <div className="flex items-center gap-4 opacity-50">
                                            <div className="bg-slate-800 p-3 rounded-full">
                                               <AlertCircle className="w-6 h-6 text-slate-500" />
                                            </div>
                                            <div className="text-slate-500 italic">No meal assigned for this slot</div>
                                         </div>
                                      )}
                                   </div>
                                </div>
                             </Card>
                          );
                       })}
                    </div>
                 </div>
              </div>
           )}
        </div>
      </div>
    </div>
  );
}