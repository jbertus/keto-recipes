import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { usePreferences } from '@/contexts/PreferencesContext'; 
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { TrendingUp, Scale, Flame, Wheat, Dumbbell, Loader2 } from 'lucide-react';
import { eachDayOfInterval, format } from 'date-fns';
import { getWeekRange, getDisplayMacros } from '@/lib/utils';

export default function Reports() {
  const { user } = useAuth();
  const { preferences } = usePreferences();
  const [loading, setLoading] = useState(true);
  const [planData, setPlanData] = useState({});
  const [userWeight, setUserWeight] = useState(null);
  const [weightChange, setWeightChange] = useState(0);

  // CRITICAL DESIGN NOTE:
  // The layout, card structure, and chart styling on this page
  // are a core design requirement. DO NOT alter the visual presentation,
  // card order, or chart types/colors without explicit instruction.
  // This includes the use of Recharts, Lucide icons, and TailwindCSS classes
  // for the current aesthetic.

  const targets = preferences?.dailyTargets || {
    calories: 2000,
    protein: 150,
    fat: 70,
    carbs: 50
  };

  useEffect(() => {
    async function fetchData() {
      if (!user) return;
      setLoading(true);

      try {
        const { data: weekly } = await supabase
          .from('weekly_plans')
          .select('plan_data')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (weekly) {
           setPlanData(weekly.plan_data || {});
        }

        const { data: progress } = await supabase
          .from('user_progress')
          .select('weight, date')
          .eq('user_id', user.id)
          .order('date', { ascending: false })
          .limit(2);

        if (progress && progress.length > 0) {
           setUserWeight(progress[0].weight);
           if (progress.length > 1) {
              setWeightChange(progress[0].weight - progress[1].weight);
           }
        }
      } catch (err) {
        console.error("Error fetching reports data:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user]);

  const analyticsData = useMemo(() => {
    const { start, end } = getWeekRange();
    const days = eachDayOfInterval({ start, end });

    let totalCals = 0;
    let totalProt = 0;
    let totalCarbs = 0;
    let activeDays = 0;

    const chartData = days.map(day => {
      const dateKey = format(day, 'yyyy-MM-dd');
      const dayMeals = planData[dateKey] || [];
      
      let dayCals = 0;
      let dayProt = 0;
      let dayCarbs = 0;

      if (Array.isArray(dayMeals)) {
         dayMeals.forEach(meal => {
            const macros = getDisplayMacros(meal);
            dayCals += macros.calories;
            dayProt += macros.protein;
            dayCarbs += macros.carbs;
         });
      }

      if (dayCals > 0) {
         totalCals += dayCals;
         totalProt += dayProt;
         totalCarbs += dayCarbs;
         activeDays++;
      }

      return {
        name: format(day, 'EEE'),
        fullDate: format(day, 'MMM d'),
        calories: dayCals,
        protein: dayProt,
        carbs: dayCarbs
      };
    });

    return {
      chartData,
      avgCalories: activeDays > 0 ? Math.round(totalCals / activeDays) : 0,
      avgProtein: activeDays > 0 ? Math.round(totalProt / activeDays) : 0,
      avgCarbs: activeDays > 0 ? Math.round(totalCarbs / activeDays) : 0,
      activeDaysCount: activeDays
    };
  }, [planData]);

  if (loading) {
    return (
       <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
       </div>
    );
  }

  const proteinStatus = analyticsData.avgProtein >= targets.protein 
      ? { color: 'text-emerald-500', icon: 'Check', text: 'Target Met' }
      : { color: 'text-amber-500', icon: 'Alert', text: 'Below Target' };

  const carbStatus = analyticsData.avgCarbs <= targets.carbs
      ? { color: 'text-emerald-500', icon: 'Check', text: 'Within Limit' }
      : { color: 'text-red-500', icon: 'Alert', text: 'Over Limit' };

  const calStatus = analyticsData.avgCalories <= targets.calories
      ? { color: 'text-emerald-500', icon: 'Check', text: 'Within Limit' }
      : { color: 'text-red-500', icon: 'Alert', text: 'Over Limit' };

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto animate-in fade-in duration-500">
      <Helmet>
        <title>Analytics & Reports | Keto Contractor</title>
      </Helmet>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Analytics</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Track your progress against your nutritional goals.</p>
        </div>
        <div className="text-sm text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700">
           {getWeekRange().formatted}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white dark:bg-[#131B2D] border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
             <Flame className="w-16 h-16 text-orange-500" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Avg Daily Calories</CardTitle>
            <Flame className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{analyticsData.avgCalories.toLocaleString()}</div>
            <p className={`text-xs mt-1 flex items-center ${calStatus.color}`}>
               Target: &lt;{targets.calories} ({calStatus.text})
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-[#131B2D] border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
             <Dumbbell className="w-16 h-16 text-blue-500" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Avg Protein</CardTitle>
            <Dumbbell className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{analyticsData.avgProtein}g</div>
            <p className={`text-xs mt-1 flex items-center ${proteinStatus.color}`}>
               Target: &gt;{targets.protein}g ({proteinStatus.text})
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-[#131B2D] border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
             <Wheat className="w-16 h-16 text-amber-500" />
          </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Avg Net Carbs</CardTitle>
            <Wheat className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{analyticsData.avgCarbs}g</div>
            <p className={`text-xs mt-1 flex items-center ${carbStatus.color}`}>
               Limit: &lt;{targets.carbs}g ({carbStatus.text})
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white dark:bg-[#131B2D] border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
             <Scale className="w-16 h-16 text-emerald-500" />
           </div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Weight Change</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900 dark:text-white">
               {weightChange > 0 ? '+' : ''}{weightChange.toFixed(1)} lbs
            </div>
            <p className="text-xs text-slate-500 mt-1">Since last entry</p>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white dark:bg-[#131B2D] border-slate-200 dark:border-slate-800 shadow-sm">
         <CardHeader>
            <CardTitle>Weekly Calorie Intake</CardTitle>
            <p className="text-sm text-slate-500">Daily calorie consumption vs. maximum target ({targets.calories} kcal).</p>
         </CardHeader>
         <CardContent>
            <div className="h-[350px] w-full">
               <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analyticsData.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                     <XAxis 
                        dataKey="name" 
                        stroke="#94a3b8" 
                        fontSize={12} 
                        tickLine={false} 
                        axisLine={false} 
                     />
                     <YAxis 
                        stroke="#94a3b8" 
                        fontSize={12} 
                        tickLine={false} 
                        axisLine={false} 
                        tickFormatter={(value) => `${value}`} 
                     />
                     <Tooltip 
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#f8fafc' }}
                        cursor={{ fill: '#1e293b', opacity: 0.4 }}
                     />
                     <ReferenceLine y={targets.calories} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'right', value: 'Limit', fill: '#ef4444', fontSize: 10 }} />
                     <Bar 
                        dataKey="calories" 
                        fill="#0891b2" 
                        radius={[4, 4, 0, 0]} 
                        barSize={40}
                     />
                  </BarChart>
               </ResponsiveContainer>
            </div>
         </CardContent>
      </Card>
      
      {analyticsData.activeDaysCount === 0 && (
         <div className="text-center text-slate-500 text-sm mt-4">
            No meal data recorded for this week yet. Start planning to see analytics!
         </div>
      )}
    </div>
  );
}