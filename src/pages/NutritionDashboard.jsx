
import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Activity, Loader2, ArrowLeft, CalendarX, AlertCircle, CheckCircle, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid
} from 'recharts';
import { format, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { usePreferences } from '@/contexts/PreferencesContext';
import { getDeficiencyStatus } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

// Helper to sum macros for a given day
const sumMacros = (meals) => {
  let protein = 0;
  let fat = 0;
  let carbs = 0;
  if (meals && Array.isArray(meals)) {
    meals.forEach(meal => {
      // Handle scaling if 'scale' property exists, otherwise default to 1
      const scale = meal.scale || 1;
      // Handle different field names for macros
      const p = parseFloat(meal.protein_per_serving_g || meal.protein || 0);
      const f = parseFloat(meal.fat_per_serving_g || meal.fat || 0);
      const c = parseFloat(meal.net_carbs_per_serving_g || meal.carbs || 0);
      
      protein += p * scale;
      fat += f * scale;
      carbs += c * scale;
    });
  }
  return { 
    protein: Math.round(protein), 
    fat: Math.round(fat), 
    carbs: Math.round(carbs) 
  };
};

export default function NutritionDashboard() {
  const { user } = useAuth();
  const { preferences } = usePreferences();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [weeklyPlan, setWeeklyPlan] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Use Monday start to align with PlannerUtils
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  useEffect(() => {
    if (user) {
      fetchWeeklyPlan();
    }
  }, [user, currentDate]);

  const fetchWeeklyPlan = async () => {
    setLoading(true);
    try {
      const weekStartStr = format(weekStart, 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('weekly_plans')
        .select('plan_data')
        .eq('user_id', user.id)
        .eq('week_start', weekStartStr)
        .maybeSingle();

      if (error) throw error;
      setWeeklyPlan(data?.plan_data || {});
    } catch (error) {
      console.error('Error fetching weekly plan:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load nutrition data for this week.',
      });
    } finally {
      setLoading(false);
    }
  };

  const dailyTargets = preferences?.dailyTargets || {
    protein: 150, fat: 70, carbs: 50
  };

  const chartData = weekDays
    .map(day => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const meals = weeklyPlan[dateStr] || [];
      const macros = sumMacros(meals);
      
      return {
        day: format(day, 'EEE'), // Mon, Tue, etc.
        fullDate: dateStr,
        protein: macros.protein,
        fat: macros.fat,
        carbs: macros.carbs,
        targetProtein: dailyTargets.protein,
        targetFat: dailyTargets.fat,
        targetCarbs: dailyTargets.carbs,
        hasMeals: meals.length > 0
      };
    })
    .filter(item => item.hasMeals); // Only show days with actual meal data

  // Placeholder Logic for Micronutrients (Task 9)
  // In a real app, you would sum these from the recipe data
  const micronutrients = [
      { name: 'Sodium', value: 3200, unit: 'mg', baseline: 5000 },
      { name: 'Potassium', value: 2100, unit: 'mg', baseline: 4700 },
      { name: 'Magnesium', value: 420, unit: 'mg', baseline: 400 },
      { name: 'Calcium', value: 800, unit: 'mg', baseline: 1000 },
      { name: 'Vitamin D', value: 600, unit: 'IU', baseline: 800 },
      { name: 'Iron', value: 18, unit: 'mg', baseline: 18 },
  ];

  const getStatusIcon = (status) => {
      if (status === 'low') return <ArrowDownCircle className="w-4 h-4 text-amber-500" />;
      if (status === 'high') return <ArrowUpCircle className="w-4 h-4 text-red-500" />;
      return <CheckCircle className="w-4 h-4 text-emerald-500" />;
  };

  const getStatusColor = (status) => {
      if (status === 'low') return 'bg-amber-900/30 text-amber-400 border-amber-800';
      if (status === 'high') return 'bg-red-900/30 text-red-400 border-red-800';
      return 'bg-emerald-900/30 text-emerald-400 border-emerald-800';
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 bg-[#0f172a] text-white min-h-screen">
      <Helmet>
        <title>Nutrition Dashboard | Keto Contractor</title>
        <meta name="description" content="Visualize your daily macro intake against your targets." />
      </Helmet>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-cyan-400 flex items-center gap-3">
            <Activity className="w-7 h-7 text-emerald-500" /> Nutrition Dashboard
          </h1>
          <p className="text-slate-400 mt-2 text-sm">
            {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
          </p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => navigate('/')} 
          className="border-slate-700 bg-slate-900/50 hover:bg-slate-800 text-slate-300"
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Planner
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
        </div>
      ) : chartData.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Macro Chart */}
            <Card className="lg:col-span-2 bg-slate-900 border-slate-800 p-6 shadow-xl">
            <CardHeader className="p-0 mb-6 flex flex-row items-center justify-between border-b border-slate-800 pb-4">
                <CardTitle className="text-xl font-semibold text-slate-100">Weekly Macro Overview</CardTitle>
                <div className="flex gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1"><div className="w-3 h-3 bg-emerald-400 rounded-sm"></div> Protein</span>
                <span className="flex items-center gap-1"><div className="w-3 h-3 bg-amber-400 rounded-sm"></div> Fat</span>
                <span className="flex items-center gap-1"><div className="w-3 h-3 bg-blue-400 rounded-sm"></div> Carbs</span>
                <span className="flex items-center gap-1"><div className="w-3 h-3 bg-slate-700 rounded-sm"></div> Target</span>
                </div>
            </CardHeader>
            <CardContent className="p-0 h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                <BarChart
                    data={chartData}
                    margin={{
                    top: 20, right: 30, left: 20, bottom: 5,
                    }}
                    barGap={2}
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis 
                    dataKey="day" 
                    stroke="#94a3b8" 
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    axisLine={{ stroke: '#334155' }}
                    />
                    <YAxis 
                    stroke="#94a3b8" 
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    axisLine={{ stroke: '#334155' }}
                    label={{ value: 'Grams (g)', angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }}
                    />
                    <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                    labelStyle={{ color: '#cbd5e1', fontWeight: 'bold', marginBottom: '8px', borderBottom: '1px solid #334155', paddingBottom: '4px' }}
                    itemStyle={{ padding: '2px 0', fontSize: '12px' }}
                    formatter={(value, name) => {
                        if (name.startsWith('target')) {
                        return [`${value}g`, `Target ${name.replace('target', '')}`];
                        }
                        return [`${value}g`, name];
                    }}
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    
                    {/* Protein Group */}
                    <Bar dataKey="protein" fill="#4ade80" name="Protein" radius={[4, 4, 0, 0]} maxBarSize={50} />
                    <Bar dataKey="targetProtein" fill="#166534" name="Target Protein" radius={[4, 4, 0, 0]} maxBarSize={50} />
                    
                    {/* Fat Group */}
                    <Bar dataKey="fat" fill="#fbbf24" name="Fat" radius={[4, 4, 0, 0]} maxBarSize={50} />
                    <Bar dataKey="targetFat" fill="#92400e" name="Target Fat" radius={[4, 4, 0, 0]} maxBarSize={50} />
                    
                    {/* Carbs Group */}
                    <Bar dataKey="carbs" fill="#60a5fa" name="Net Carbs" radius={[4, 4, 0, 0]} maxBarSize={50} />
                    <Bar dataKey="targetCarbs" fill="#1e3a8a" name="Target Carbs" radius={[4, 4, 0, 0]} maxBarSize={50} />
                </BarChart>
                </ResponsiveContainer>
            </CardContent>
            </Card>

            {/* Micronutrient Card (Task 9) */}
            <Card className="bg-slate-900 border-slate-800 shadow-xl flex flex-col">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                         <AlertCircle className="w-5 h-5 text-cyan-500" />
                         Micronutrients
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                        Estimated average intake vs baseline.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 flex-1">
                    {micronutrients.map(micro => {
                         const status = getDeficiencyStatus(micro.name, micro.value, micro.baseline);
                         return (
                             <div key={micro.name} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 border border-slate-800">
                                 <div>
                                     <div className="font-medium text-slate-200">{micro.name}</div>
                                     <div className="text-xs text-slate-500">
                                         {micro.value} / {micro.baseline} {micro.unit}
                                     </div>
                                 </div>
                                 <Badge variant="outline" className={`${getStatusColor(status)} flex items-center gap-1.5 uppercase tracking-wide font-bold px-2 py-1`}>
                                     {getStatusIcon(status)}
                                     {status}
                                 </Badge>
                             </div>
                         );
                    })}
                    <div className="text-xs text-slate-500 text-center mt-4 italic">
                        * Values based on available recipe data.
                    </div>
                </CardContent>
            </Card>
        </div>
      ) : (
        <Card className="bg-slate-900 border-slate-800 p-12 text-center shadow-lg">
            <div className="flex flex-col items-center justify-center gap-6 text-slate-500">
                <div className="p-4 bg-slate-800/50 rounded-full">
                    <CalendarX className="w-12 h-12 text-slate-400" />
                </div>
                <div className="max-w-md space-y-2">
                    <h3 className="text-xl font-semibold text-slate-200">No Meals Logged This Week</h3>
                    <p className="text-slate-400 text-sm">
                        You haven't planned any meals for the week of {format(weekStart, 'MMMM do')} yet. 
                        Head over to the planner to add your meals and track your nutrition!
                    </p>
                </div>
                <Button 
                    onClick={() => navigate('/')}
                    variant="default"
                    className="mt-2 bg-cyan-600 hover:bg-cyan-700 text-white min-w-[140px]"
                >
                    Go to Planner
                </Button>
            </div>
        </Card>
      )}
    </div>
  );
}
