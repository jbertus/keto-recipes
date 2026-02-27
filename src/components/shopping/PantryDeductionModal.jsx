
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ArrowRight, Archive, CheckCircle2, Loader2, AlertTriangle, ArrowDown } from 'lucide-react';
import { matchIngredients, calculateDeduction } from '@/lib/ingredientMatcher';
import { useToast } from '@/components/ui/use-toast';

export default function PantryDeductionModal({ 
  open, 
  onOpenChange, 
  shoppingList, 
  pantryItems, 
  onApplyDeductions 
}) {
  const [matches, setMatches] = useState([]);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (open && shoppingList.length > 0 && pantryItems.length > 0) {
      const results = matchIngredients(shoppingList, pantryItems);
      setMatches(results);
      // Auto-select highly confident matches (e.g. > 0.85)
      const autoSelected = new Set(results.filter(m => m.score > 0.85).map(m => m.shoppingItem.id));
      setSelectedIds(autoSelected);
    }
  }, [open, shoppingList, pantryItems]);

  const handleToggle = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleApply = async () => {
    setProcessing(true);
    
    // Prepare deduction plan
    const deductions = matches
      .filter(m => selectedIds.has(m.shoppingItem.id))
      .map(m => {
         const { shoppingItem, pantryItem } = m;
         const calc = calculateDeduction(shoppingItem, pantryItem);

         return {
           shoppingItemId: shoppingItem.id,
           pantryItemId: pantryItem.id,
           pantryItemName: pantryItem.name,
           deductAmount: calc.covered,
           originalUnit: calc.unit,
           fullyCovered: calc.isFullyCovered
         };
      });

    try {
        await onApplyDeductions(deductions);
        
        if (deductions.length > 0) {
            const firstItem = deductions[0];
            const count = deductions.length;
            const msg = count === 1 
                ? `Removed ${firstItem.deductAmount} ${firstItem.originalUnit} of ${firstItem.pantryItemName} from Pantry`
                : `Updated pantry for ${count} items (e.g. ${firstItem.pantryItemName})`;
                
            toast({
                title: "Pantry Updated",
                description: msg,
                duration: 3000
            });
        }
        
        onOpenChange(false);
    } catch (e) {
        console.error(e);
    } finally {
        setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Archive className="w-6 h-6 text-orange-500" />
            Use Pantry Items
          </DialogTitle>
          <DialogDescription>
            Select items to <strong>deduct from your pantry</strong>. This will reduce your pantry stock and remove these items from your Shopping List export.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden min-h-[300px] border rounded-lg border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950/50">
          {matches.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
              <CheckCircle2 className="w-12 h-12 mb-2 text-green-500" />
              <p className="font-medium">No pantry matches found.</p>
              <p className="text-sm opacity-75">Your shopping list requirements don't match your current stock.</p>
            </div>
          ) : (
            <div className="flex flex-col h-full">
                <div className="grid grid-cols-[60px_1fr_40px_1fr] gap-4 p-3 bg-slate-100 dark:bg-slate-900 border-b text-xs font-bold text-slate-500 uppercase tracking-wider">
                  <div className="text-center">Deduct</div>
                  <div>Required (Shopping List)</div>
                  <div></div>
                  <div>Available (Pantry)</div>
                </div>
                
                <ScrollArea className="flex-1">
                    {matches.map((match) => {
                    const { shoppingItem, pantryItem, score } = match;
                    const isSelected = selectedIds.has(shoppingItem.id);
                    const sQty = match.parsedShopping;
                    const pQty = match.parsedPantry;
                    
                    const calc = calculateDeduction(shoppingItem, pantryItem);
                    
                    // Toggle label logic
                    const switchLabel = pantryItem.quantity 
                        ? `Use ${pantryItem.quantity} from Pantry` 
                        : "Use Pantry";

                    return (
                        <div 
                        key={shoppingItem.id} 
                        className={`grid grid-cols-[60px_1fr_40px_1fr] gap-4 p-4 items-center border-b border-slate-100 dark:border-slate-800 transition-colors ${isSelected ? 'bg-orange-50/50 dark:bg-orange-900/10' : 'opacity-80'}`}
                        >
                        <div className="flex justify-center">
                            <Switch 
                                checked={isSelected}
                                onCheckedChange={() => handleToggle(shoppingItem.id)}
                                className="data-[state=checked]:bg-orange-500"
                                aria-label={switchLabel}
                            />
                        </div>
                        
                        {/* Shopping List Side */}
                        <div>
                            <div className="font-semibold text-slate-900 dark:text-slate-100">{shoppingItem.name}</div>
                            <div className="text-sm text-slate-500">Need: <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{sQty?.qty} {sQty?.unit}</span></div>
                            {isSelected && !calc.isFullyCovered && (
                                <div className="text-xs text-red-500 flex items-center mt-1">
                                    <AlertTriangle className="w-3 h-3 mr-1" /> Still need {calc.needed} {calc.unit}
                                </div>
                            )}
                        </div>

                        {/* Arrow */}
                        <div className="flex justify-center">
                            <ArrowRight className={`w-5 h-5 ${isSelected ? 'text-orange-500' : 'text-slate-300'}`} />
                        </div>

                        {/* Pantry Side */}
                        <div>
                            <div className="flex items-center gap-2">
                                <div className="font-semibold text-slate-900 dark:text-slate-100">{pantryItem.name}</div>
                                {score < 0.85 && <Badge variant="outline" className="text-[10px] text-yellow-600 border-yellow-500">Fuzzy</Badge>}
                            </div>
                            <div className="text-sm text-slate-500">Have: <span className="font-mono font-bold text-green-600">{pantryItem.quantity || 'N/A'}</span></div>
                            
                            {/* Explicit display of the action */}
                            {isSelected && (
                                <div className="text-xs text-orange-600 font-medium mt-1 flex items-center gap-1 animate-in fade-in">
                                    <ArrowDown className="w-3 h-3" /> 
                                    {switchLabel}
                                </div>
                            )}
                        </div>
                        </div>
                    );
                    })}
                </ScrollArea>
            </div>
          )}
        </div>

        <DialogFooter className="gap-3 sm:gap-0 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button 
            onClick={handleApply} 
            disabled={matches.length === 0 || selectedIds.size === 0 || processing} 
            className="bg-orange-600 hover:bg-orange-700 text-white gap-2"
          >
            {processing && <Loader2 className="w-4 h-4 animate-spin" />}
            Apply Deductions ({selectedIds.size})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
