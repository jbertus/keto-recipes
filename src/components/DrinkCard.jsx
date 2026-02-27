import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Droplet, Milk, Info, Flame, Wheat, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';
import LazyImage from '@/components/shared/LazyImage';

const DrinkCard = ({ drink }) => {
  const [isCreamy, setIsCreamy] = useState(false);
  const currentVersion = isCreamy ? drink.creamy : drink.tonic;
  
  // Format: Cal | C | F | P | Fiber | Net
  const macros = currentVersion.macros;

  return (
    <div className="group relative bg-white dark:bg-[#131B2D] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:border-cyan-500/50 dark:hover:border-cyan-500/50 transition-all flex flex-col h-full">
      {/* Image Section */}
      <div className="relative aspect-square w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
        <LazyImage 
          src={drink.image} 
          alt={drink.title}
          className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />
        
        {/* Title Overlay */}
        <div className="absolute bottom-0 left-0 p-4 w-full">
          <h3 className="font-bold text-white text-lg leading-tight shadow-sm">{drink.title}</h3>
          <p className="text-slate-300 text-xs mt-1 italic">{currentVersion.desc || 'Refreshing & Functional'}</p>
        </div>

        {/* Toggle Switch Overlay */}
        <div className="absolute top-3 right-3 z-10">
           <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md rounded-full p-1 pl-3 border border-white/10">
              <span className={cn("text-[10px] font-bold uppercase tracking-wider transition-colors", !isCreamy ? "text-cyan-400" : "text-slate-400")}>
                Tonic
              </span>
              <Switch 
                checked={isCreamy}
                onCheckedChange={setIsCreamy}
                className="data-[state=checked]:bg-purple-600 data-[state=unchecked]:bg-cyan-600 h-5 w-9"
              />
              <span className={cn("text-[10px] font-bold uppercase tracking-wider pr-2 transition-colors", isCreamy ? "text-purple-400" : "text-slate-400")}>
                Creamy
              </span>
           </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="flex-1 p-4 flex flex-col gap-4">
        
        {/* Ingredients List with Transition */}
        <div className="flex-1">
             <div className="flex items-center gap-2 mb-2">
                {isCreamy ? <Milk className="w-4 h-4 text-purple-400" /> : <Droplet className="w-4 h-4 text-cyan-400" />}
                <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                    {isCreamy ? 'Creamy Blend' : 'Tonic Blend'}
                </span>
             </div>
             
             <div className="relative min-h-[80px]"> 
                <AnimatePresence mode="wait">
                    <motion.ul 
                        key={isCreamy ? 'creamy' : 'tonic'}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-1"
                    >
                        {currentVersion.ingredients.map((ing, i) => (
                            <li key={i} className="text-sm text-slate-700 dark:text-slate-300 flex items-start gap-2">
                                <span className={cn("mt-1.5 w-1 h-1 rounded-full shrink-0", isCreamy ? "bg-purple-500" : "bg-cyan-500")} />
                                <span className="leading-snug">{ing}</span>
                            </li>
                        ))}
                    </motion.ul>
                </AnimatePresence>
             </div>
        </div>

        {/* Macros Footer */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex justify-between items-center text-[10px] uppercase font-bold text-slate-400 mb-1">
                <span>Nutrition Profile</span>
                <span className={cn("text-[10px]", isCreamy ? "text-purple-400" : "text-cyan-400")}>
                    PER SERVING
                </span>
            </div>
            
            <div className="grid grid-cols-6 gap-0 divide-x divide-slate-200 dark:divide-slate-700 bg-slate-50 dark:bg-slate-900/50 rounded-lg border border-slate-200 dark:border-slate-800 text-center py-2">
                <div>
                    <div className="text-[9px] text-slate-500 mb-0.5">Cal</div>
                    <div className="font-bold text-slate-900 dark:text-white">{macros.cal}</div>
                </div>
                <div>
                    <div className="text-[9px] text-slate-500 mb-0.5">Carb</div>
                    <div className="font-bold text-slate-900 dark:text-white">{macros.c}</div>
                </div>
                <div>
                    <div className="text-[9px] text-slate-500 mb-0.5">Fat</div>
                    <div className="font-bold text-slate-900 dark:text-white">{macros.f}</div>
                </div>
                <div>
                    <div className="text-[9px] text-slate-500 mb-0.5">Prot</div>
                    <div className="font-bold text-slate-900 dark:text-white">{macros.p}</div>
                </div>
                <div>
                    <div className="text-[9px] text-slate-500 mb-0.5">Fiber</div>
                    <div className="font-bold text-slate-900 dark:text-white">{macros.fiber}</div>
                </div>
                <div className="bg-slate-100 dark:bg-slate-800 rounded-r-lg">
                    <div className="text-[9px] text-emerald-600 dark:text-emerald-400 mb-0.5">Net</div>
                    <div className="font-bold text-emerald-700 dark:text-emerald-400">{macros.net}</div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default DrinkCard;