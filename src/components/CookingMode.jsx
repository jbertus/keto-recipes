import React, { useState, useEffect } from 'react';
import { 
  Play, Pause, RotateCcw, ChevronLeft, ChevronRight, 
  AlarmClock, CheckCircle, X, Maximize2 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function CookingMode({ isOpen, onClose, recipe }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [timers, setTimers] = useState({}); // { stepIndex: timeLeft }
  const [activeTimers, setActiveTimers] = useState({}); // { stepIndex: intervalId }

  const instructions = recipe?.prep_notes_block
    ? recipe.prep_notes_block.split('\n').filter(l => l.trim().length > 0)
    : ["No specific instructions provided. Enjoy your cooking!"];

  // Helper to find time in text (e.g., "cook for 5 mins")
  const extractTime = (text) => {
    const match = text.match(/(\d+)\s*(min|minute|hour)/i);
    if (match) {
      let minutes = parseInt(match[1]);
      if (match[2].toLowerCase().startsWith('hour')) minutes *= 60;
      return minutes * 60; // seconds
    }
    return 0;
  };

  const toggleTimer = (stepIndex) => {
    if (activeTimers[stepIndex]) {
      // Pause
      clearInterval(activeTimers[stepIndex]);
      const newActive = { ...activeTimers };
      delete newActive[stepIndex];
      setActiveTimers(newActive);
    } else {
      // Start
      let time = timers[stepIndex] || extractTime(instructions[stepIndex]);
      if (time <= 0) time = 300; // Default 5 mins if no time found but timer requested
      
      setTimers(prev => ({ ...prev, [stepIndex]: time }));

      const id = setInterval(() => {
        setTimers(prev => {
          if (prev[stepIndex] <= 1) {
            clearInterval(id);
            // Play sound here
            const audio = new Audio('/notification.mp3'); // Mock path
            audio.play().catch(e => console.log('Audio play failed', e));
            return { ...prev, [stepIndex]: 0 };
          }
          return { ...prev, [stepIndex]: prev[stepIndex] - 1 };
        });
      }, 1000);

      setActiveTimers(prev => ({ ...prev, [stepIndex]: id }));
    }
  };

  const resetTimer = (stepIndex) => {
    if (activeTimers[stepIndex]) {
       clearInterval(activeTimers[stepIndex]);
       const newActive = { ...activeTimers };
       delete newActive[stepIndex];
       setActiveTimers(newActive);
    }
    const defaultTime = extractTime(instructions[stepIndex]);
    setTimers(prev => ({ ...prev, [stepIndex]: defaultTime > 0 ? defaultTime : 0 }));
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      Object.values(activeTimers).forEach(clearInterval);
    };
  }, [activeTimers]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] bg-slate-950 border-slate-800 text-white flex flex-col p-0 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900">
           <div>
              <h2 className="text-xl font-bold text-cyan-400">{recipe?.recipe_name}</h2>
              <p className="text-sm text-slate-400">Step {currentStep + 1} of {instructions.length}</p>
           </div>
           <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-6 h-6 text-slate-400" />
           </Button>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
           {/* Steps List (Sidebar on Desktop) */}
           <div className="hidden md:flex w-1/3 border-r border-slate-800 flex-col bg-slate-900/50">
              <ScrollArea className="flex-1">
                 {instructions.map((step, idx) => (
                    <div 
                      key={idx}
                      onClick={() => setCurrentStep(idx)}
                      className={`p-4 border-b border-slate-800/50 cursor-pointer transition-colors ${idx === currentStep ? 'bg-cyan-950/30 border-l-4 border-l-cyan-500' : 'hover:bg-slate-900'}`}
                    >
                       <div className="flex gap-3">
                          <span className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${idx < currentStep ? 'bg-emerald-900 text-emerald-400' : idx === currentStep ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                             {idx < currentStep ? <CheckCircle className="w-4 h-4" /> : idx + 1}
                          </span>
                          <p className={`text-sm line-clamp-2 ${idx === currentStep ? 'text-white' : 'text-slate-400'}`}>
                             {step}
                          </p>
                       </div>
                    </div>
                 ))}
              </ScrollArea>
           </div>

           {/* Active Step View */}
           <div className="flex-1 p-6 md:p-12 flex flex-col items-center justify-center bg-slate-950 relative">
              <div className="w-full max-w-2xl text-center space-y-8">
                 <div className="inline-block bg-slate-900 px-4 py-1 rounded-full text-cyan-400 font-mono text-sm mb-4">
                    STEP {currentStep + 1}
                 </div>
                 
                 <h3 className="text-2xl md:text-3xl font-medium leading-relaxed text-slate-100">
                    {instructions[currentStep]}
                 </h3>

                 {/* Timer Controls */}
                 {(extractTime(instructions[currentStep]) > 0 || timers[currentStep] > 0) && (
                    <div className="bg-slate-900 rounded-2xl p-6 inline-block w-full max-w-sm border border-slate-800 mt-8">
                       <div className="text-5xl font-mono font-bold text-white mb-4 tabular-nums">
                          {formatTime(timers[currentStep] || extractTime(instructions[currentStep]))}
                       </div>
                       <div className="flex justify-center gap-4">
                          <Button 
                             size="lg"
                             variant={activeTimers[currentStep] ? "destructive" : "default"}
                             onClick={() => toggleTimer(currentStep)}
                             className={activeTimers[currentStep] ? "bg-red-600 hover:bg-red-700" : "bg-cyan-600 hover:bg-cyan-700"}
                          >
                             {activeTimers[currentStep] ? <Pause className="mr-2" /> : <Play className="mr-2" />}
                             {activeTimers[currentStep] ? "Pause" : "Start Timer"}
                          </Button>
                          <Button variant="outline" size="icon" onClick={() => resetTimer(currentStep)}>
                             <RotateCcw className="w-5 h-5" />
                          </Button>
                       </div>
                    </div>
                 )}
              </div>
           </div>
        </div>

        {/* Footer Navigation */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 flex justify-between items-center">
           <Button 
             variant="ghost" 
             disabled={currentStep === 0}
             onClick={() => setCurrentStep(prev => prev - 1)}
           >
              <ChevronLeft className="mr-2 w-4 h-4" /> Previous
           </Button>

           <div className="w-1/3 mx-4 hidden sm:block">
              <Progress value={((currentStep + 1) / instructions.length) * 100} className="h-2 bg-slate-800" indicatorClassName="bg-cyan-500" />
           </div>

           <Button 
             onClick={() => {
               if (currentStep < instructions.length - 1) {
                  setCurrentStep(prev => prev + 1);
               } else {
                  onClose();
               }
             }}
             className={currentStep === instructions.length - 1 ? "bg-emerald-600 hover:bg-emerald-700" : "bg-cyan-600 hover:bg-cyan-700"}
           >
              {currentStep === instructions.length - 1 ? (
                 <>Finish Cooking <CheckCircle className="ml-2 w-4 h-4" /></>
              ) : (
                 <>Next Step <ChevronRight className="ml-2 w-4 h-4" /></>
              )}
           </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}