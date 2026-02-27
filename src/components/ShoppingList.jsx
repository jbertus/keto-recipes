import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { usePreferences } from '@/contexts/PreferencesContext';
import { 
  CheckSquare, 
  Square, 
  Trash2, 
  Plus, 
  ShoppingBag, 
  DollarSign, 
  Loader2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Download,
  RotateCcw,
  Settings2,
  Package,
  Archive
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from '@/components/ui/label';
import { startOfWeek, endOfWeek, format, addWeeks, subWeeks, isWithinInterval, parseISO, isValid } from 'date-fns';
import { cn, parseIngredient, cleanIngredientName } from '@/lib/utils';

const PriceEditor = ({ itemName, existingPrice, onSave }) => {
  const [price, setPrice] = useState(existingPrice?.price || '');
  const [qty, setQty] = useState(existingPrice?.packageQty || '1');
  const [open, setOpen] = useState(false);

  useEffect(() => {
     if (open) {
        setPrice(existingPrice?.price || '');
        setQty(existingPrice?.packageQty || '1');
     }
  }, [open, existingPrice]);

  const handleSave = () => {
     if (!price || !qty) return;
     const parsedPrice = parseFloat(price);
     const parsedQty = parseFloat(qty);
     if (isNaN(parsedPrice) || isNaN(parsedQty) || parsedQty <= 0) return;
     onSave({ id: Date.now(), name: itemName, packageQty: parsedQty, price: parsedPrice });
     setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-400 hover:text-cyan-500"><Settings2 className="w-3.5 h-3.5" /></Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3 bg-white dark:bg-[#1e293b] border-slate-200 dark:border-slate-700" align="end">
        <div className="space-y-3">
          <h4 className="font-bold text-xs uppercase text-slate-500">Set Price for {itemName}</h4>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-[10px] uppercase text-slate-400">Pkg Price ($)</Label>
              <div className="relative"><DollarSign className="w-3 h-3 absolute left-2 top-2 text-slate-500" /><Input type="number" min="0" step="0.01" value={price} onChange={e => setPrice(e.target.value)} className="h-7 text-xs pl-6 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700" placeholder="0.00" /></div>
            </div>
            <div className="space-y-1">
              <Label className="text-[10px] uppercase text-slate-400">Pkg Qty</Label>
              <div className="relative"><Package className="w-3 h-3 absolute left-2 top-2 text-slate-500" /><Input type="number" min="0" step="0.1" value={qty} onChange={e => setQty(e.target.value)} className="h-7 text-xs pl-7 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-700" placeholder="1" /></div>
            </div>
          </div>
          <Button size="sm" className="w-full h-7 text-xs bg-cyan-600 hover:bg-cyan-700 text-white" onClick={handleSave}>Save Price</Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

const calculateEstimatedCost = (item, priceInfo) => {
  if (!priceInfo || !item) return 0;
  const pkgPrice = priceInfo.price || 0;
  const pkgQty = priceInfo.packageQty || 1; 
  const numPackages = Math.ceil(item.quantity / pkgQty);
  return numPackages * pkgPrice;
};

const ListItem = ({ item, checked, onToggle, onDeleteManual, preferences, updatePrice }) => {
   const priceInfo = preferences.ingredientPrices?.find(p => p.name.toLowerCase() === item.name.toLowerCase());
   const estimatedCost = calculateEstimatedCost(item, priceInfo);

   return (
      <div className={cn("group flex items-center justify-between p-3 sm:p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors", checked && "bg-slate-50/50 dark:bg-slate-900/30")}>
         <div className="flex items-start gap-3 flex-1 min-w-0">
            <button onClick={() => onToggle(item)} className={cn("mt-0.5 transition-colors", checked ? "text-emerald-500 hover:text-emerald-600" : "text-slate-300 dark:text-slate-600 hover:text-cyan-500")}>
               {checked ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
            </button>
            <div className="min-w-0 flex-1">
               <div className={cn("flex items-center gap-2", checked && "opacity-50 line-through decoration-slate-400")}>
                  <p className="font-medium text-slate-900 dark:text-white truncate">{item.name}</p>
                  {item.pantryDeducted > 0 && (
                     <span className="text-[10px] text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 px-1.5 py-0.5 rounded border border-emerald-100 dark:border-emerald-900/50 flex items-center gap-1">
                        <Archive className="w-3 h-3" />
                        {Math.round(item.pantryDeducted * 100) / 100} deducted
                     </span>
                  )}
                  {item.isManual && !item.sources?.length && <span className="text-[9px] bg-slate-100 dark:bg-slate-800 text-slate-500 px-1.5 rounded border border-slate-200 dark:border-slate-700">Manual</span>}
               </div>
               <div className={cn("text-xs text-slate-500 dark:text-slate-400 mt-0.5", checked && "opacity-50")}>
                  <span className="mr-2 font-mono bg-slate-100 dark:bg-slate-800 px-1 rounded text-[10px] text-slate-600 dark:text-slate-300">
                     {Math.round(item.quantity * 100) / 100} {item.unit || 'pcs'} 
                     {item.pantryDeducted > 0 && <span className="opacity-50 line-through ml-1">({Math.round(item.originalQuantity * 100) / 100})</span>}
                  </span>
                  {!item.isManual && item.sources?.length > 0 && <span className="hidden sm:inline text-[10px] text-slate-400 italic">via {item.sources[0]} {item.sources.length > 1 ? `+${item.sources.length - 1} more` : ''}</span>}
               </div>
            </div>
         </div>
         <div className="flex items-center gap-3 ml-4">
            <div className="flex flex-col items-end min-w-[60px]">
               {estimatedCost > 0 ? (
                  <>
                     <span className={cn("text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400", checked && "opacity-50")}>${estimatedCost.toFixed(2)}</span>
                     {priceInfo && (
                        <span className="text-[9px] text-slate-400">
                           {Math.ceil(item.quantity / (priceInfo.packageQty || 1))} pkg
                        </span>
                     )}
                  </>
               ) : <span className="text-[10px] text-slate-300 dark:text-slate-700">-</span>}
            </div>
            <PriceEditor itemName={item.name} existingPrice={priceInfo} onSave={updatePrice} />
            {item.isManual && (
               <Button variant="ghost" size="icon" className="h-6 w-6 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20" onClick={() => onDeleteManual(item.id)}>
                  <Trash2 className="w-3.5 h-3.5" />
               </Button>
            )}
         </div>
      </div>
   );
};

export default function ShoppingList() {
  const { user } = useAuth();
  const { preferences, updatePrice } = usePreferences();
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const [manualItems, setManualItems] = useState([]);
  const [pantryItems, setPantryItems] = useState([]);
  const [planData, setPlanData] = useState({});
  const [loading, setLoading] = useState(true);
  const [newItemName, setNewItemName] = useState('');
  const [checkedItems, setCheckedItems] = useState({});

  const { start: weekStart, end: weekEnd } = useMemo(() => ({
    start: startOfWeek(currentDate, { weekStartsOn: 0 }),
    end: endOfWeek(currentDate, { weekStartsOn: 0 })
  }), [currentDate]);

  const weekStartStr = format(weekStart, 'yyyy-MM-dd');

  useEffect(() => {
    try {
      const savedChecks = localStorage.getItem(`shopping_checked_comp_${weekStartStr}`);
      if (savedChecks) setCheckedItems(JSON.parse(savedChecks));
      else setCheckedItems({});
    } catch (e) { console.error(e); }
  }, [weekStartStr]);

  useEffect(() => {
    localStorage.setItem(`shopping_checked_comp_${weekStartStr}`, JSON.stringify(checkedItems));
  }, [checkedItems, weekStartStr]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch Manual Items
      const { data: manualData } = await supabase.from('shopping_list_items').select('*').eq('user_id', user.id).eq('is_manual', true);
      setManualItems(manualData || []);

      // 2. Fetch Pantry Items
      const { data: pantryData } = await supabase.from('pantry_items').select('*').eq('user_id', user.id);
      setPantryItems(pantryData || []);

      // 3. Fetch Weekly Plan
      const { data: planDataRes } = await supabase
        .from('weekly_plans')
        .select('plan_data')
        .eq('user_id', user.id)
        .eq('week_start', weekStartStr)
        .maybeSingle();

      setPlanData(planDataRes?.plan_data || {});
    } catch (error) {
      console.error('Error fetching shopping data:', error);
    } finally {
      setLoading(false);
    }
  }, [user, weekStartStr]);

  useEffect(() => {
    if (user) fetchData();
  }, [user, weekStartStr, fetchData]);

  const aggregatedList = useMemo(() => {
    const items = {}; 

    // A. Process Planned Meals
    Object.entries(planData).forEach(([dateStr, meals]) => {
        try {
            const dateObj = parseISO(dateStr);
            if (!isValid(dateObj) || !isWithinInterval(dateObj, { start: weekStart, end: weekEnd })) return;
        } catch (e) { return; }

        if (!Array.isArray(meals)) return;

        meals.forEach(meal => {
            if (!meal) return;
            let lines = [];
            if (meal.ingredients_block) lines = meal.ingredients_block.split('\n');
            else if (typeof meal.ingredients === 'string') lines = meal.ingredients.split('\n');
            else if (Array.isArray(meal.ingredients)) lines = meal.ingredients;

            lines.forEach(line => {
                const parsed = parseIngredient(line);
                if (!parsed) return;
                const cleanName = cleanIngredientName(parsed.name); 
                const scale = parseFloat(meal.scale) || 1;
                
                if (!items[cleanName]) {
                    items[cleanName] = {
                        id: cleanName,
                        name: parsed.name,
                        cleanName,
                        unit: parsed.unit ? parsed.unit.toLowerCase() : '',
                        quantity: 0,
                        sources: new Set(),
                        isManual: false
                    };
                }
                items[cleanName].quantity += (parsed.qty || 0) * scale;
                if (!items[cleanName].unit && parsed.unit) items[cleanName].unit = parsed.unit.toLowerCase();
                items[cleanName].sources.add(meal.recipe_name || meal.name || 'Unknown Recipe');
            });
        });
    });

    // Flatten to array
    let combinedRequirements = Object.values(items).map(item => ({ ...item, sources: Array.from(item.sources) }));

    // Add Manual Items
    manualItems.forEach(item => {
         const cleanName = cleanIngredientName(item.name);
         const existingIndex = combinedRequirements.findIndex(i => i.cleanName === cleanName);
         const manualQty = item.quantity ? parseFloat(item.quantity) : 1;

         if (existingIndex >= 0) {
            combinedRequirements[existingIndex].quantity += manualQty;
            combinedRequirements[existingIndex].sources.push('Manual Add');
         } else {
             combinedRequirements.push({
                 id: item.id, 
                 name: item.name,
                 cleanName,
                 unit: 'item', 
                 quantity: manualQty,
                 sources: ['Manual Add'],
                 isManual: true
             });
         }
    });

    // Build Pantry Inventory
    const pantryInventory = {};
    pantryItems.forEach(pItem => {
        if (!pItem.name) return;
        const normalized = cleanIngredientName(pItem.name);
        const qty = parseFloat(pItem.quantity) || 0;
        if (!pantryInventory[normalized]) pantryInventory[normalized] = 0;
        pantryInventory[normalized] += qty;
    });

    // Deduct
    const finalResult = [];
    combinedRequirements.forEach(item => {
        const normalized = item.cleanName;
        let available = 0;
        let matchKey = normalized;

        if (pantryInventory[normalized] !== undefined) available = pantryInventory[normalized];
        else if (pantryInventory[normalized + 's'] !== undefined) { matchKey = normalized + 's'; available = pantryInventory[matchKey]; }
        else if (normalized.endsWith('s') && pantryInventory[normalized.slice(0, -1)] !== undefined) { matchKey = normalized.slice(0, -1); available = pantryInventory[matchKey]; }

        const processedItem = { ...item, originalQuantity: item.quantity, pantryDeducted: 0 };

        if (available > 0) {
            if (available >= processedItem.quantity) {
                pantryInventory[matchKey] -= processedItem.quantity;
                return; // Fully covered
            } else {
                pantryInventory[matchKey] = 0;
                processedItem.pantryDeducted = available;
                processedItem.quantity -= available;
                finalResult.push(processedItem);
            }
        } else {
            finalResult.push(processedItem);
        }
    });

    return finalResult.sort((a, b) => a.name.localeCompare(b.name));
  }, [planData, manualItems, weekStart, weekEnd, pantryItems]);

  const handleManualAdd = async (e) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    const newItem = { user_id: user.id, name: newItemName, category: 'Manual', quantity: '1', checked: false, is_manual: true, created_at: new Date().toISOString() };
    const { data, error } = await supabase.from('shopping_list_items').insert(newItem).select().single();
    if (!error && data) {
       setManualItems([data, ...manualItems]);
       setNewItemName('');
    }
  };

  const handleToggle = (item) => {
      setCheckedItems(prev => ({ ...prev, [item.id]: !prev[item.id] }));
  };

  const handleDeleteManual = async (id) => {
     const { error } = await supabase.from('shopping_list_items').delete().eq('id', id);
     if (!error) setManualItems(prev => prev.filter(i => i.id !== id));
  };

  const handleReset = () => {
    if (window.confirm("Uncheck all items?")) setCheckedItems({});
  };

  const handleExport = () => {
     const headers = "Item,Quantity,Unit,Cost,Sources\n";
     const rows = aggregatedList.map(item => {
        const priceInfo = preferences.ingredientPrices?.find(p => p.name.toLowerCase() === item.cleanName);
        const cost = calculateEstimatedCost(item, priceInfo);
        return `"${item.name}",${item.quantity.toFixed(2)},"${item.unit}",${cost.toFixed(2)},"${item.sources.join('; ')}"`;
     }).join('\n');
     const csvContent = "data:text/csv;charset=utf-8," + headers + rows;
     const encodedUri = encodeURI(csvContent);
     const link = document.createElement("a");
     link.setAttribute("href", encodedUri);
     link.setAttribute("download", `shopping_list.csv`);
     document.body.appendChild(link);
     link.click();
     document.body.removeChild(link);
  };

  const totalCost = aggregatedList.reduce((sum, item) => {
     if (checkedItems[item.id]) return sum;
     const priceInfo = preferences.ingredientPrices?.find(p => p.name.toLowerCase() === item.cleanName);
     return sum + calculateEstimatedCost(item, priceInfo);
  }, 0);

  const uncheckedItems = aggregatedList.filter(i => !checkedItems[i.id]);
  const completedItems = aggregatedList.filter(i => checkedItems[i.id]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
       <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
          <div>
             <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2"><ShoppingBag className="w-6 h-6 text-cyan-500" /> Shopping List</h1>
             <p className="text-slate-500 text-sm">Aggregated ingredients (Pantry items automatically deducted).</p>
          </div>
          <div className="flex items-center gap-2 bg-white dark:bg-[#131B2D] p-1 rounded-lg border border-slate-200 dark:border-slate-800 shadow-sm">
             <Button variant="ghost" size="icon" onClick={() => setCurrentDate(d => subWeeks(d, 1))}><ChevronLeft className="w-4 h-4" /></Button>
             <div className="flex items-center gap-2 px-2 min-w-[140px] justify-center text-sm font-medium"><Calendar className="w-3.5 h-3.5 text-slate-400" />{format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d')}</div>
             <Button variant="ghost" size="icon" onClick={() => setCurrentDate(d => addWeeks(d, 1))}><ChevronRight className="w-4 h-4" /></Button>
          </div>
       </div>

       <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#131B2D] text-white p-4 rounded-xl border border-slate-800 flex flex-col justify-between relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity"><DollarSign className="w-12 h-12" /></div>
             <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Est. Total</p>
             <p className="text-2xl font-mono text-emerald-400 font-bold">${totalCost.toFixed(2)}</p>
          </div>
          <div className="bg-white dark:bg-[#131B2D] p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between">
             <p className="text-[10px] uppercase tracking-wider font-bold text-slate-500 dark:text-slate-400">Items Needed</p>
             <div className="flex items-end gap-1"><span className="text-2xl font-bold text-slate-900 dark:text-white">{uncheckedItems.length}</span><span className="text-xs text-slate-500 mb-1">/ {aggregatedList.length}</span></div>
          </div>
          <Button variant="outline" className="h-auto flex flex-col items-center justify-center gap-1 border-dashed border-slate-300 dark:border-slate-700 hover:border-cyan-500 dark:hover:border-cyan-500 hover:bg-cyan-50 dark:hover:bg-cyan-950/20" onClick={handleExport}><Download className="w-5 h-5 text-slate-400" /><span className="text-xs font-semibold">Export CSV</span></Button>
          <Button variant="outline" className="h-auto flex flex-col items-center justify-center gap-1 border-dashed border-slate-300 dark:border-slate-700 hover:border-red-500 dark:hover:border-red-500 hover:bg-red-50 dark:hover:bg-red-950/20" onClick={handleReset}><RotateCcw className="w-5 h-5 text-slate-400" /><span className="text-xs font-semibold">Reset</span></Button>
       </div>

       <form onSubmit={handleManualAdd} className="relative group">
          <Input placeholder="Add extra item (e.g. Paper Towels, Milk)..." value={newItemName} onChange={(e) => setNewItemName(e.target.value)} className="pl-4 pr-12 h-12 text-base bg-white dark:bg-[#0B1120] border-slate-200 dark:border-slate-800 shadow-sm focus:ring-cyan-500" />
          <Button type="submit" size="icon" className="absolute right-1 top-1 h-10 w-10 bg-cyan-600 hover:bg-cyan-500 transition-transform active:scale-95"><Plus className="w-5 h-5" /></Button>
       </form>

       <div className="bg-white dark:bg-[#131B2D] border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm min-h-[400px]">
          {loading ? (
             <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-3"><Loader2 className="w-8 h-8 animate-spin text-cyan-500" /><p className="text-sm">Gathering ingredients...</p></div>
          ) : aggregatedList.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-64 text-slate-400 gap-3"><ShoppingBag className="w-12 h-12 opacity-20" /><p className="text-sm">No items for this week.</p></div>
          ) : (
             <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {uncheckedItems.map(item => <ListItem key={item.id} item={item} checked={false} onToggle={handleToggle} onDeleteManual={handleDeleteManual} preferences={preferences} updatePrice={updatePrice} />)}
                {completedItems.length > 0 && <div className="bg-slate-50 dark:bg-slate-900/50 px-4 py-2 text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2"><CheckSquare className="w-3 h-3" /> Completed Items</div>}
                {completedItems.map(item => <ListItem key={item.id} item={item} checked={true} onToggle={handleToggle} onDeleteManual={handleDeleteManual} preferences={preferences} updatePrice={updatePrice} />)}
             </div>
          )}
       </div>
    </div>
  );
}