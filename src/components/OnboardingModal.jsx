import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { 
  ArrowRight, 
  Check, 
  Calendar, 
  Scale, 
  Activity, 
  Menu,
  Pencil,
  Plus
} from 'lucide-react'; // Removed Filter icon
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { cn } from '@/lib/utils';

const STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to Keto Contractor!',
    description: "Your comprehensive meal planning and nutrition tracking solution. Let's take a quick tour to show you how to get the most out of the app.",
    // image and showVideoIcon removed as per request
  },
  {
    id: 'add-recipes',
    title: '1. Build Your Library',
    description: "Start by adding your favorite meals. Click 'New Recipe' in the sidebar or use the Recipe Builder to create custom dishes with automatic macro calculations.",
    icon: Plus,
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10'
  },
  {
    id: 'planning',
    title: '2. Plan Your Week',
    description: "Drag and drop recipes from the library directly onto any day of your calendar. Organizing your weekly nutrition has never been this fast.",
    icon: Calendar,
    color: 'text-blue-400',
    bg: 'bg-blue-400/10'
  },
  {
    id: 'portions',
    title: '3. Adjust Portions',
    description: "Need more fuel? Click any meal on the planner to scale portions (e.g., 1.5x, 2x). Your macros will update automatically to reflect the change.",
    icon: Scale,
    color: 'text-amber-400',
    bg: 'bg-amber-400/10'
  },
  {
    id: 'macros',
    title: '4. Track Daily Macros',
    description: "Stay on target. View real-time totals for Calories, Protein, Fats, and Carbs at the top of every day column. Colors change to warn you if you're over limits.",
    icon: Activity,
    color: 'text-red-400',
    bg: 'bg-red-400/10'
  },
  {
    id: 'editing',
    title: '5. Edit Anything',
    description: "Refine your data. Click the pencil icon on any recipe card to tweak ingredients, update macros, or add preparation notes instantly.",
    icon: Pencil,
    color: 'text-cyan-400',
    bg: 'bg-cyan-400/10'
  },
  {
    id: 'navigation',
    title: '6. Easy Navigation',
    description: "Access everything from the main menu. Switch between your Planner, Shopping List, Pantry, and Reports with a single click.",
    icon: Menu,
    color: 'text-slate-400',
    bg: 'bg-slate-400/10'
  },
];

export default function OnboardingModal() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const checkOnboardingStatus = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('preferences')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching onboarding status:', error);
      }

      const preferences = data?.preferences || {};
      
      // If user hasn't seen onboarding, show it
      if (!preferences.has_seen_onboarding) {
        setOpen(true);
      }
    } catch (err) {
      console.error(err);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      checkOnboardingStatus();
    }
  }, [user, checkOnboardingStatus]);

  const markAsComplete = async () => {
    try {
      const { data: existingData } = await supabase
        .from('user_preferences')
        .select('preferences')
        .eq('user_id', user.id)
        .maybeSingle();

      const currentPrefs = existingData?.preferences || {};
      
      await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          preferences: { ...currentPrefs, has_seen_onboarding: true },
          updated_at: new Date().toISOString()
        });
      
      setOpen(false);
    } catch (err) {
      console.error('Failed to save onboarding status:', err);
      setOpen(false);
    }
  };

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(curr => curr + 1);
    } else {
      markAsComplete();
    }
  };

  const renderContent = () => {
    const step = STEPS[currentStep];
    const Icon = step.icon;

    if (step.id === 'welcome') {
      return (
        <div className="py-6 flex flex-col items-center text-center space-y-8 animate-in zoom-in-95 duration-300">
          <div className="w-24 h-24 rounded-full flex items-center justify-center relative shadow-2xl ring-1 ring-white/10 bg-cyan-600/10">
            <img alt="Keto Contractor Welcome Icon" className="w-12 h-12 text-cyan-400" src="https://images.unsplash.com/photo-1659354218682-86007e49d844" />
            <div className="absolute inset-0 rounded-full opacity-20 animate-pulse bg-cyan-600/10"></div>
            <div className="absolute -inset-2 rounded-full border border-dashed border-slate-700/50 animate-[spin_10s_linear_infinite]"></div>
          </div>
          <div className="space-y-3 max-w-sm px-4">
            <h3 className="text-2xl font-bold text-white tracking-tight">{step.title}</h3>
            <p className="text-slate-400 text-base leading-relaxed">{step.description}</p>
          </div>
        </div>
      );
    }

    return (
      <div className="py-6 flex flex-col items-center text-center space-y-8 animate-in zoom-in-95 duration-300">
        <div className={cn(
          "w-24 h-24 rounded-full flex items-center justify-center relative shadow-2xl ring-1 ring-white/10",
          step.bg
        )}>
           <Icon className={cn("w-12 h-12", step.color)} />
           
           {/* Decorative circles */}
           <div className={cn("absolute inset-0 rounded-full opacity-20 animate-pulse", step.bg)}></div>
           <div className="absolute -inset-2 rounded-full border border-dashed border-slate-700/50 animate-[spin_10s_linear_infinite]"></div>
        </div>
        
        <div className="space-y-3 max-w-sm px-4">
           <h3 className="text-2xl font-bold text-white tracking-tight">{step.title}</h3>
           <p className="text-slate-400 text-base leading-relaxed">{step.description}</p>
        </div>

        {/* Visual indicator of feature location if needed (optional decoration) */}
        <div className="w-16 h-1 bg-slate-800 rounded-full mt-4"></div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && markAsComplete()}>
      <DialogContent className="sm:max-w-[500px] bg-[#0B1120] border-slate-800 text-slate-200 p-0 overflow-hidden shadow-2xl shadow-black/50">
        
        {/* Top Progress Bar */}
        <div className="h-1 bg-slate-900 w-full relative">
           <div 
             className="absolute top-0 left-0 h-full bg-cyan-500 transition-all duration-500 ease-out shadow-[0_0_10px_rgba(6,182,212,0.5)]"
             style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
           />
        </div>

        <div className="p-6 md:p-8 flex flex-col h-full min-h-[480px]">
           <DialogHeader className="mb-2 shrink-0">
             <div className="flex justify-between items-center">
               <DialogTitle className="text-white sr-only">Onboarding</DialogTitle>
               <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                 Step {currentStep + 1} of {STEPS.length}
               </span>
               <Button 
                 variant="ghost" 
                 size="sm" 
                 className="h-auto p-1.5 text-slate-500 hover:text-white text-xs hover:bg-slate-800"
                 onClick={markAsComplete}
               >
                 Skip
               </Button>
             </div>
           </DialogHeader>

           <div className="flex-1 flex flex-col justify-center py-4">
              {renderContent()}
           </div>

           <DialogFooter className="mt-auto pt-6 shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              {/* Step dots */}
              <div className="flex gap-1.5 justify-center sm:justify-start order-2 sm:order-1">
                 {STEPS.map((_, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => setCurrentStep(idx)}
                      className={cn(
                        "w-2 h-2 rounded-full transition-all duration-300 cursor-pointer", 
                        idx === currentStep ? "bg-cyan-500 w-4 shadow-[0_0_8px_rgba(6,182,212,0.6)]" : "bg-slate-800 hover:bg-slate-700"
                      )} 
                    />
                 ))}
              </div>
              
              <div className="flex gap-3 w-full sm:w-auto order-1 sm:order-2">
                 {currentStep > 0 && (
                    <Button 
                      variant="outline" 
                      onClick={() => setCurrentStep(curr => curr - 1)}
                      className="border-slate-700 bg-transparent hover:bg-slate-800 text-slate-300 hover:text-white flex-1 sm:flex-none"
                    >
                      Back
                    </Button>
                 )}
                 <Button 
                   onClick={nextStep} 
                   className="bg-cyan-600 hover:bg-cyan-500 text-white flex-1 sm:flex-none shadow-lg shadow-cyan-900/20"
                 >
                   {currentStep === STEPS.length - 1 ? (
                     <>Get Started <Check className="w-4 h-4 ml-2" /></>
                   ) : (
                     <>Next <ArrowRight className="w-4 h-4 ml-2" /></>
                   )}
                 </Button>
              </div>
           </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}