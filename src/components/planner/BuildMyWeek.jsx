
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { useCredits } from '@/hooks/useCredits';
import { Sparkles, Calendar, Loader2, Utensils } from 'lucide-react';
import { supabase } from '@/lib/customSupabaseClient';

export default function BuildMyWeek({ onPlanGenerated }) {
  const [selectedMeals, setSelectedMeals] = useState({
    Breakfast: true,
    Lunch: true,
    Dinner: true
  });
  const [includeAi, setIncludeAi] = useState(false);
  const [loading, setLoading] = useState(false);
  const { consumeCredits } = useCredits();
  const { toast } = useToast();

  const handleGenerate = async () => {
    // 1. Validate Selection
    const meals = Object.keys(selectedMeals).filter(k => selectedMeals[k]);
    if (meals.length === 0) {
        toast({ variant: "destructive", title: "Selection Required", description: "Please select at least one meal type." });
        return;
    }

    setLoading(true);

    try {
        // 2. Consume Credits (if AI enabled)
        if (includeAi) {
            const result = await consumeCredits(5, 'build_my_week_ai');
            if (!result) {
                setLoading(false);
                return; // Stop if insufficient credits
            }
        }

        // 3. Mock Generation Logic (Real app would fetch from DB/Edge Function)
        // Here we simulate fetching 4 options per meal type
        const generatedPlan = {};
        
        for (const type of meals) {
            // In a real scenario, you'd fetch random recipes from DB here
            // const { data } = await supabase.from('personal_recipes').select('*').eq('meal_type', type).limit(4);
            
            // Placeholder simulation
            generatedPlan[type] = Array(4).fill(null).map((_, i) => ({
                id: `gen_${type}_${i}`,
                recipe_name: `${type} Option ${i+1}`,
                calories: 500,
                image_path: null // Placeholder
            }));
        }

        toast({ title: "Week Built!", description: `Generated options for ${meals.join(', ')}.` });
        if (onPlanGenerated) onPlanGenerated(generatedPlan);

    } catch (error) {
        console.error("Build Week Error", error);
        toast({ variant: "destructive", title: "Error", description: "Failed to build week." });
    } finally {
        setLoading(false);
    }
  };

  return (
    <Card className="bg-[#131B2D] border-slate-800 mb-6">
        <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-cyan-950/30 rounded-full text-cyan-400">
                        <Calendar className="w-6 h-6" />
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-lg">Build My Week</h3>
                        <p className="text-slate-400 text-sm">Auto-generate a full meal plan in seconds.</p>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-6">
                    <div className="flex items-center gap-4 bg-slate-900/50 p-2 rounded-lg border border-slate-800">
                        {['Breakfast', 'Lunch', 'Dinner'].map(type => (
                            <div key={type} className="flex items-center gap-2">
                                <Checkbox 
                                    id={`bmw-${type}`} 
                                    checked={selectedMeals[type]}
                                    onCheckedChange={(c) => setSelectedMeals(prev => ({ ...prev, [type]: c }))}
                                    className="border-slate-600 data-[state=checked]:bg-cyan-600 data-[state=checked]:border-cyan-600"
                                />
                                <label htmlFor={`bmw-${type}`} className="text-sm text-slate-300 cursor-pointer select-none">{type}</label>
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center gap-2">
                         <Checkbox 
                            id="bmw-ai" 
                            checked={includeAi}
                            onCheckedChange={setIncludeAi}
                            className="border-slate-600 data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600"
                        />
                        <label htmlFor="bmw-ai" className="text-sm font-medium text-purple-400 flex items-center gap-1 cursor-pointer select-none">
                            <Sparkles className="w-3 h-3" /> Include AI Recipes (5 Credits)
                        </label>
                    </div>

                    <Button onClick={handleGenerate} disabled={loading} className="bg-cyan-600 hover:bg-cyan-500 text-white min-w-[140px]">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Utensils className="w-4 h-4 mr-2" />}
                        Generate
                    </Button>
                </div>
            </div>
        </CardContent>
    </Card>
  );
}
