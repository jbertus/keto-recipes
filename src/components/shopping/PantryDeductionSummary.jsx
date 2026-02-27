
import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { CheckCircle2, AlertCircle, ShoppingBag, Eye, EyeOff } from 'lucide-react';
import { usePreferences } from '@/contexts/PreferencesContext';

const PantryDeductionSummary = ({ stats }) => {
  const { preferences, updatePreferences } = usePreferences();
  const showAlreadyHave = preferences.show_items_already_have || false;

  if (!stats || stats.total === 0) return null;

  return (
    <Card className="bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 p-4 mb-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        {/* Stats Section */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-3">
             <ShoppingBag className="w-5 h-5 text-cyan-600" />
             <h3 className="font-semibold text-slate-900 dark:text-slate-100">Shopping Overview</h3>
          </div>
          
          <div className="flex flex-wrap gap-2">
             <Badge variant="outline" className="bg-white dark:bg-slate-800 border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300">
               Total: {stats.total}
             </Badge>
             
             <Badge variant="outline" className="bg-emerald-100 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400">
               <CheckCircle2 className="w-3 h-3 mr-1" />
               Have: {stats.fullyCovered}
             </Badge>
             
             <Badge variant="outline" className="bg-amber-100 dark:bg-amber-900/30 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400">
               <AlertCircle className="w-3 h-3 mr-1" />
               Partial: {stats.partiallyCovered}
             </Badge>

             <Badge className="bg-blue-600 hover:bg-blue-700 text-white border-0">
               To Buy: {stats.neededCount}
             </Badge>
          </div>
        </div>

        {/* Controls Section */}
        <div className="flex flex-col gap-3 min-w-[200px] border-l border-slate-200 dark:border-slate-800 pl-4 md:pl-6 justify-center">
            {/* Task 4: Removed toggle for enabling deduction as it is now always on */}
             <div className="flex items-center justify-between">
                <Label htmlFor="show-have-toggle" className="flex items-center gap-2 text-sm cursor-pointer text-slate-600 dark:text-slate-400">
                   {showAlreadyHave ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                   Show "Have"
                </Label>
                <Switch 
                  id="show-have-toggle"
                  checked={showAlreadyHave}
                  onCheckedChange={(checked) => updatePreferences({ show_items_already_have: checked })}
                />
             </div>
        </div>
      </div>
    </Card>
  );
};

export default PantryDeductionSummary;
