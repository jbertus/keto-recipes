import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Loader2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';

export default function MealPrepTimeline() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [weeklyPlan, setWeeklyPlan] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date()); // For fetching current week

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 }); // Sunday Start
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
        description: 'Failed to load meal plan for timeline.',
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalPrepTimeForDay = (dateStr) => {
    const meals = weeklyPlan[dateStr] || [];
    return meals.reduce((total, meal) => total + (meal.estimated_total_time_min || 0), 0);
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 bg-[#0f172a] text-white min-h-screen">
      <Helmet>
        <title>Meal Prep Timeline | Keto Contractor</title>
        <meta name="description" content="View estimated meal preparation times for the week." />
      </Helmet>

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-cyan-400 flex items-center gap-3">
          <Clock className="w-7 h-7 text-blue-500" /> Meal Prep Timeline
        </h1>
        <Button variant="outline" onClick={() => navigate('/')} className="border-slate-700 bg-slate-900/50 hover:bg-slate-800 text-slate-300">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Planner
        </Button>
      </div>

      <p className="text-slate-400 mb-8">
        See the estimated preparation times for your planned meals throughout the week.
      </p>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {weekDays.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const mealsForDay = weeklyPlan[dateStr] || [];
            const totalPrepTime = calculateTotalPrepTimeForDay(dateStr);

            return (
              <Card key={dateStr} className="bg-slate-900 border-slate-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-semibold text-slate-100">
                    {format(day, 'EEEE, MMM d')}
                  </CardTitle>
                  <span className="text-sm text-slate-400">
                    Total: <span className="font-bold text-cyan-400">{totalPrepTime} min</span>
                  </span>
                </CardHeader>
                <CardContent>
                  {mealsForDay.length === 0 ? (
                    <p className="text-slate-500 text-sm">No meals planned.</p>
                  ) : (
                    <ul className="space-y-2">
                      {mealsForDay
                        .sort((a, b) => (a.slot || '').localeCompare(b.slot || ''))
                        .map((meal) => (
                        <li key={meal.id} className="flex items-center justify-between text-sm text-slate-300 bg-slate-800/50 p-2 rounded-md">
                          <span>{meal.recipe_name} ({meal.slot})</span>
                          <span className="text-blue-400 font-medium">{meal.estimated_total_time_min || 0} min</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}