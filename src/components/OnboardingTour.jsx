import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChefHat, 
  CalendarDays, 
  ShoppingCart, 
  UtensilsCrossed, 
  LineChart, 
  Settings, 
  ArrowRight, 
  Check, 
  X
} from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const STEPS = [
  {
    id: 'welcome',
    title: "Welcome to Keto Contractor",
    description: "Let's get your nutrition foundation built right. Here is a quick tour of your new workspace.",
    icon: ChefHat,
    color: "text-cyan-500",
    bg: "bg-cyan-500/10"
  },
  {
    id: 'planner',
    title: "The Planner",
    description: "Your command center. Drag and drop recipes from your collection onto any day of the week. We'll calculate the macros automatically.",
    icon: CalendarDays,
    color: "text-blue-500",
    bg: "bg-blue-500/10"
  },
  {
    id: 'recipes',
    title: "Recipe Library & Builder",
    description: "Your blueprint archive. Browse your collection or use the Builder to design custom meals with automatic nutrition calculation.",
    icon: UtensilsCrossed,
    color: "text-orange-500",
    bg: "bg-orange-500/10"
  },
  {
    id: 'shopping',
    title: "Smart Shopping List",
    description: "Your materials list. It's automatically generated from your Weekly Plan. Never miss an ingredient again.",
    icon: ShoppingCart,
    color: "text-green-500",
    bg: "bg-green-500/10"
  },
  {
    id: 'progress',
    title: "Track Progress",
    description: "Monitor the build. Log your weight, glucose, and ketones to visualize your health trends over time.",
    icon: LineChart,
    color: "text-purple-500",
    bg: "bg-purple-500/10"
  }
];

export default function OnboardingTour() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (!user) return;

    const checkStatus = async () => {
      // 1. Check LocalStorage for instant feedback (prevents flash)
      const localSeen = localStorage.getItem('onboarding_completed');
      if (localSeen === 'true') return;

      // 2. Check Database for cross-device persistence
      try {
        const { data, error } = await supabase
          .from('user_preferences')
          .select('preferences')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) console.error("Error fetching prefs:", error);

        if (data?.preferences?.onboarding_completed) {
           // Sync local
           localStorage.setItem('onboarding_completed', 'true');
        } else {
           // Show tour
           setIsOpen(true);
        }
      } catch (err) {
        console.error("Onboarding check failed", err);
      }
    };

    checkStatus();
  }, [user]);

  const handleComplete = async () => {
    setIsOpen(false);
    localStorage.setItem('onboarding_completed', 'true');

    if (!user) return;

    try {
      // Fetch current preferences first to merge
      const { data: existing } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      const currentPrefs = existing?.preferences || {};
      const newPrefs = { ...currentPrefs, onboarding_completed: true };

      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          preferences: newPrefs,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (err) {
      console.error("Failed to save onboarding status", err);
    }
  };

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(curr => curr + 1);
    } else {
      handleComplete();
    }
  };

  const StepIcon = STEPS[currentStep].icon;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleComplete()}>
      <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden bg-white dark:bg-[#0F172A] border-slate-200 dark:border-slate-800 shadow-2xl">
        <div className="relative h-[400px] flex flex-col">
          {/* Progress Bar */}
          <div className="absolute top-0 left-0 w-full h-1 bg-slate-100 dark:bg-slate-800">
             <motion.div 
               className="h-full bg-cyan-500"
               initial={{ width: 0 }}
               animate={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
               transition={{ duration: 0.3 }}
             />
          </div>

          {/* Close Button */}
          <button 
            onClick={handleComplete}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 z-10 p-1"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Content Area */}
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center relative">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 1.05 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col items-center"
              >
                 <div className={`w-20 h-20 rounded-full ${STEPS[currentStep].bg} flex items-center justify-center mb-6 ring-8 ring-slate-50 dark:ring-slate-900`}>
                    <StepIcon className={`w-10 h-10 ${STEPS[currentStep].color}`} />
                 </div>
                 
                 <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                   {STEPS[currentStep].title}
                 </h2>
                 
                 <p className="text-slate-500 dark:text-slate-400 leading-relaxed text-sm max-w-[300px]">
                   {STEPS[currentStep].description}
                 </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer Actions */}
          <div className="p-6 bg-slate-50 dark:bg-[#131B2D] border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
             <div className="flex gap-1.5">
                {STEPS.map((_, idx) => (
                  <div 
                    key={idx}
                    className={`w-2 h-2 rounded-full transition-colors duration-300 ${idx === currentStep ? 'bg-cyan-500' : 'bg-slate-300 dark:bg-slate-700'}`}
                  />
                ))}
             </div>
             
             <Button 
               onClick={handleNext}
               className="bg-cyan-600 hover:bg-cyan-700 text-white gap-2 rounded-full px-6"
             >
               {currentStep === STEPS.length - 1 ? (
                 <>Get Started <Check className="w-4 h-4" /></>
               ) : (
                 <>Next <ArrowRight className="w-4 h-4" /></>
               )}
             </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}