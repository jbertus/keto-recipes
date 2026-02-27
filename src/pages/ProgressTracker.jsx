import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Activity, TrendingDown, Scale, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { format, subDays } from 'date-fns';

const StatCard = ({ title, value, subtext, icon: Icon, colorClass }) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <Icon className={`h-4 w-4 ${colorClass}`} />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <p className="text-xs text-muted-foreground">{subtext}</p>
    </CardContent>
  </Card>
);

export default function ProgressTracker() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [newEntry, setNewEntry] = useState({ weight: '', glucose: '', ketones: '' });

  const fetchProgress = async () => {
    if (!user) return;
    try {
      const { data: progressData, error } = await supabase
        .from('user_progress')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: true })
        .limit(30);

      if (error) throw error;

      if (progressData) {
        // Format for charts
        const formatted = progressData.map(p => ({
          ...p,
          name: format(new Date(p.date), 'MMM d')
        }));
        setData(formatted);
      }
    } catch (error) {
      console.error("Error fetching progress:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProgress();
  }, [user]);

  const handleLogEntry = async () => {
    if (!newEntry.weight && !newEntry.glucose && !newEntry.ketones) {
       toast({ variant: "destructive", description: "Please enter at least one value." });
       return;
    }

    try {
      const { error } = await supabase.from('user_progress').insert({
        user_id: user.id,
        date: new Date().toISOString().split('T')[0],
        weight: newEntry.weight || null,
        glucose: newEntry.glucose || null,
        ketones: newEntry.ketones || null
      });

      if (error) throw error;

      toast({ title: "Entry Logged", description: "Your progress has been saved." });
      setIsLogOpen(false);
      setNewEntry({ weight: '', glucose: '', ketones: '' });
      fetchProgress();
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to log entry." });
    }
  };

  // Calculate current stats
  const latest = data.length > 0 ? data[data.length - 1] : { weight: 0, glucose: 0, ketones: 0 };
  const previous = data.length > 1 ? data[data.length - 2] : latest;
  const weightChange = (latest.weight - previous.weight).toFixed(1);
  const weightChangeText = weightChange > 0 ? `+${weightChange} lbs` : `${weightChange} lbs`;

  return (
    <div className="container mx-auto p-4 md:p-8 space-y-8">
      <Helmet>
        <title>Progress & Stats | Keto Contractor</title>
      </Helmet>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Progress Tracker</h1>
          <p className="text-muted-foreground">Monitor your biometrics and goals.</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isLogOpen} onOpenChange={setIsLogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" /> Log Entry
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Log Daily Progress</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="weight" className="text-right">Weight (lbs)</Label>
                  <Input id="weight" type="number" step="0.1" value={newEntry.weight} onChange={e => setNewEntry({...newEntry, weight: e.target.value})} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="glucose" className="text-right">Glucose (mg/dL)</Label>
                  <Input id="glucose" type="number" value={newEntry.glucose} onChange={e => setNewEntry({...newEntry, glucose: e.target.value})} className="col-span-3" />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="ketones" className="text-right">Ketones (mmol/L)</Label>
                  <Input id="ketones" type="number" step="0.1" value={newEntry.ketones} onChange={e => setNewEntry({...newEntry, ketones: e.target.value})} className="col-span-3" />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleLogEntry}>Save Entry</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {data.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground border-dashed">
           <p>No progress data logged yet. Click "Log Entry" to start tracking.</p>
        </Card>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard 
              title="Current Weight" 
              value={`${latest.weight || '--'} lbs`} 
              subtext={`${weightChangeText} since last entry`} 
              icon={Scale} 
              colorClass="text-blue-500"
            />
            <StatCard 
              title="Glucose" 
              value={`${latest.glucose || '--'} mg/dL`} 
              subtext="Latest reading" 
              icon={Activity} 
              colorClass="text-green-500"
            />
             <StatCard 
              title="Ketones" 
              value={`${latest.ketones || '--'} mmol/L`} 
              subtext="Latest reading" 
              icon={Activity} 
              colorClass="text-purple-500"
            />
             <StatCard 
              title="Total Entries" 
              value={data.length}
              subtext="Days tracked" 
              icon={TrendingDown} 
              colorClass="text-orange-500"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Weight Trend</CardTitle>
                <CardDescription>Weight history over time.</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                       <defs>
                        <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                      <XAxis 
                        dataKey="name" 
                        stroke="#888888" 
                        fontSize={12} 
                        tickLine={false} 
                        axisLine={false} 
                      />
                      <YAxis 
                        stroke="#888888" 
                        fontSize={12} 
                        tickLine={false} 
                        axisLine={false} 
                        domain={['auto', 'auto']} 
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                        itemStyle={{ color: 'hsl(var(--foreground))' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="weight" 
                        stroke="#0ea5e9" 
                        strokeWidth={2}
                        fillOpacity={1} 
                        fill="url(#colorWeight)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Glucose Levels</CardTitle>
                <CardDescription>Glucose measurements.</CardDescription>
              </CardHeader>
              <CardContent className="pl-2">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                      <defs>
                        <linearGradient id="colorGlucose" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                      <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                      <Tooltip 
                         contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                      />
                      <Area type="monotone" dataKey="glucose" stroke="#22c55e" fill="url(#colorGlucose)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}