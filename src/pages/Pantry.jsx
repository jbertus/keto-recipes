
import React, { useState, useEffect } from 'react';
import { supabase, SUPABASE_CONFIGURED } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useDebounce } from '@/hooks/useDebounce';
import { 
  Search, 
  Package, 
  Plus, 
  Calendar,
  AlertTriangle,
  Pencil,
  Trash2,
  X,
  Loader2,
  ShoppingBasket
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { format, isPast, isToday, addDays } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Pantry() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    quantity: '',
    unit: 'pcs',
    expiry_date: ''
  });
  
  const debouncedSearch = useDebounce(searchTerm, 500);

  useEffect(() => {
    if (!SUPABASE_CONFIGURED) {
      setLoading(false);
      return;
    }

    if (user) {
      fetchPantryItems();
    }
  }, [user, debouncedSearch]);

  const fetchPantryItems = async (searchOverride = null) => {
    if (!SUPABASE_CONFIGURED || !supabase) return;
    try {
      setLoading(true);
      
      let query = supabase
        .from('pantry_items')
        .select('*')
        .eq('user_id', user.id);

      const termToUse = searchOverride !== null ? searchOverride : debouncedSearch;

      if (termToUse && termToUse.trim() !== '') {
        const cleanSearch = termToUse.trim();
        query = query.or(`name.ilike.%${cleanSearch}%,category.ilike.%${cleanSearch}%`);
      }

      query = query.order('expiry_date', { ascending: true });

      const { data, error } = await query;
      if (error) throw error;
      setItems(data || []);
    } catch (error) {
      console.error('Error fetching pantry:', error);
      toast({ title: "Error loading pantry", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    const initialName = searchTerm && items.length === 0 ? searchTerm : '';
    
    setEditingItem(null);
    setFormData({
      name: initialName,
      category: 'General',
      quantity: '1',
      unit: 'pcs',
      expiry_date: ''
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (item) => {
    let qtyVal = item.quantity || '';
    let unitVal = 'pcs';
    
    // Attempt to split current stored string "2 kg" into "2" and "kg"
    const match = qtyVal.toString().match(/^(\d+(\.\d+)?)\s*(.*)$/);
    if (match) {
        qtyVal = match[1];
        unitVal = match[3] || 'pcs';
    }

    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category || 'General',
      quantity: qtyVal,
      unit: unitVal,
      expiry_date: item.expiry_date || ''
    });
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!SUPABASE_CONFIGURED || !supabase) return;
    if (!formData.name.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      // Reassemble quantity string
      const fullQuantity = `${formData.quantity} ${formData.unit}`.trim();

      const payload = {
        name: formData.name,
        category: formData.category,
        quantity: fullQuantity,
        expiry_date: formData.expiry_date || null
      };

      if (editingItem) {
        const { error } = await supabase
          .from('pantry_items')
          .update(payload)
          .eq('id', editingItem.id)
          .eq('user_id', user.id);
        
        if (error) throw error;
        toast({ title: "Item updated successfully" });
        fetchPantryItems(); 
      } else {
        const { error } = await supabase
          .from('pantry_items')
          .insert([{ ...payload, user_id: user.id }]);
          
        if (error) throw error;
        toast({ title: "Item added to pantry" });
        setSearchTerm('');
        fetchPantryItems('');
      }

      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error saving item:', error);
      toast({ title: "Failed to save item", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!itemToDelete || !SUPABASE_CONFIGURED || !supabase) return;
    
    try {
      const { error } = await supabase
        .from('pantry_items')
        .delete()
        .eq('id', itemToDelete.id)
        .eq('user_id', user.id);

      if (error) throw error;
      
      toast({ title: "Item removed from pantry" });
      fetchPantryItems();
    } catch (error) {
      console.error('Error deleting item:', error);
      toast({ title: "Failed to delete item", variant: "destructive" });
    } finally {
      setItemToDelete(null);
    }
  };

  const getExpiryStatus = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    if (isPast(date) && !isToday(date)) return 'expired';
    if (date <= addDays(new Date(), 3)) return 'soon';
    return 'good';
  };

  const categories = [
    "Produce", "Meat", "Dairy", "Pantry", "Spices", "Frozen", "Bakery", "Beverages", "Snacks", "Household", "General"
  ];

  const units = [
    "pcs", "kg", "g", "lb", "oz", "l", "ml", "cup", "tbsp", "tsp", "box", "bag", "can", "bottle", "jar"
  ];

  if (!SUPABASE_CONFIGURED) {
    return (
       <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] bg-[#0B1120] p-6 text-center">
         <AlertTriangle className="h-16 w-16 text-slate-700 mb-4" />
         <h1 className="text-2xl font-bold text-white mb-2">Pantry Offline</h1>
         <p className="text-slate-500 max-w-md">Your digital pantry cannot be accessed because the database connection is missing.</p>
       </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
       <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-2">
            <ShoppingBasket className="w-8 h-8 text-cyan-500" />
            Digital Pantry
          </h1>
          <p className="text-slate-400">Track your inventory to reduce food waste.</p>
        </div>
        <Button 
          onClick={handleAddNew}
          className="bg-cyan-600 hover:bg-cyan-500 text-white gap-2 shadow-lg shadow-cyan-900/20 w-full md:w-auto"
        >
          <Plus className="w-4 h-4" />
          Add Item
        </Button>
      </div>

      <div className="bg-[#131B2D] p-4 rounded-xl border border-slate-800">
         <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search pantry items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-slate-950 border-slate-800 w-full md:max-w-md text-white focus:ring-cyan-500/50"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white bg-slate-900 rounded-full p-0.5"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
      </div>

      {loading ? (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-32 w-full bg-[#1e293b] rounded-xl" />)}
         </div>
      ) : items.length === 0 ? (
         <div className="text-center py-20 bg-[#131B2D] rounded-xl border border-slate-800 border-dashed flex flex-col items-center justify-center">
            <div className="bg-slate-900/50 p-4 rounded-full mb-4">
              <Package className="w-12 h-12 text-slate-600" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
               {searchTerm ? 'No matching items' : 'Your pantry is empty'}
            </h3>
            <p className="text-slate-400 mb-6 max-w-sm mx-auto">
              {searchTerm ? `We couldn't find anything matching "${searchTerm}". Want to add it?` : 'Start tracking your ingredients to make meal planning easier.'}
            </p>
            <Button 
              onClick={handleAddNew} 
              className="bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-900/20"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add "{searchTerm || 'New Item'}"
            </Button>
         </div>
      ) : (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {items.map(item => {
              const status = getExpiryStatus(item.expiry_date);
              return (
                <Card key={item.id} className="bg-[#131B2D] border-slate-800 hover:border-slate-700 transition-all group relative overflow-hidden flex flex-col">
                  <CardContent className="p-4 flex-1 flex flex-col">
                    <div className="flex justify-between items-start gap-3 mb-2">
                      <h3 className="font-bold text-white text-lg truncate flex-1" title={item.name}>{item.name}</h3>
                      <Badge variant="outline" className="border-slate-700 text-slate-400 bg-slate-900/50 text-[10px] uppercase tracking-wider h-5 px-1.5 shrink-0">
                        {item.category || 'General'}
                      </Badge>
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-3">
                         <span className="text-2xl font-bold text-cyan-400">{item.quantity}</span>
                      </div>
                    </div>
                        
                    <div className="flex items-end justify-between mt-auto pt-3 border-t border-slate-800/50">
                        {item.expiry_date ? (
                          <div className={cn(
                            "inline-flex items-center text-xs font-medium px-2 py-1 rounded-md border",
                            status === 'expired' ? "bg-red-950/30 text-red-400 border-red-900/50" :
                            status === 'soon' ? "bg-amber-950/30 text-amber-400 border-amber-900/50" :
                            "bg-emerald-950/30 text-emerald-400 border-emerald-900/50"
                          )}>
                             {status === 'expired' && <AlertTriangle className="w-3 h-3 mr-1.5" />}
                             <Calendar className="w-3 h-3 mr-1.5 opacity-70" />
                             {format(new Date(item.expiry_date), 'MMM d')}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-600 italic py-1">No expiry set</span>
                        )}

                        <div className="flex gap-1">
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-7 w-7 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded-md"
                            onClick={() => handleEdit(item)}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-7 w-7 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-md"
                            onClick={() => setItemToDelete(item)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
         </div>
      )}

      {/* Add/Edit Modal */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-[#1e293b] border-slate-800 text-white sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
               {editingItem ? <Pencil className="w-5 h-5 text-cyan-500" /> : <Plus className="w-5 h-5 text-cyan-500" />}
               {editingItem ? 'Edit Pantry Item' : 'Add New Item'}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Details for your pantry item. Accurate info helps with meal planning.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-300">Item Name <span className="text-red-400">*</span></Label>
              <Input 
                id="name" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="e.g. Jumbo Shrimp"
                className="bg-slate-950 border-slate-700 text-white focus:ring-cyan-600 h-11"
                autoFocus={!editingItem}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category" className="text-slate-300">Category</Label>
                 <Select 
                    value={formData.category} 
                    onValueChange={(val) => setFormData({...formData, category: val})}
                  >
                  <SelectTrigger className="bg-slate-950 border-slate-700 text-white h-11">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800 text-slate-200">
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                 <Label htmlFor="expiry" className="text-slate-300">Expiry Date</Label>
                 <Input 
                  id="expiry" 
                  type="date"
                  value={formData.expiry_date}
                  onChange={(e) => setFormData({...formData, expiry_date: e.target.value})}
                  className="bg-slate-950 border-slate-700 text-white focus:ring-cyan-600 h-11"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                <Label htmlFor="quantity" className="text-slate-300">Quantity</Label>
                <Input 
                  id="quantity" 
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.quantity}
                  onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                  placeholder="e.g. 2"
                  className="bg-slate-950 border-slate-700 text-white focus:ring-cyan-600 h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit" className="text-slate-300">Unit</Label>
                 <Select 
                    value={formData.unit} 
                    onValueChange={(val) => setFormData({...formData, unit: val})}
                  >
                  <SelectTrigger className="bg-slate-950 border-slate-700 text-white h-11">
                    <SelectValue placeholder="Unit" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-800 text-slate-200 h-48">
                    {units.map(u => (
                      <SelectItem key={u} value={u}>{u}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="text-slate-400 hover:text-white hover:bg-slate-800">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isSaving} className="bg-cyan-600 hover:bg-cyan-500 text-white min-w-[100px]">
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : (editingItem ? 'Update Item' : 'Add Item')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!itemToDelete} onOpenChange={(open) => !open && setItemToDelete(null)}>
        <AlertDialogContent className="bg-[#1e293b] border-slate-800 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this item?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Are you sure you want to remove <span className="text-white font-semibold">{itemToDelete?.name}</span>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700 hover:text-white">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white border-none">
              Delete Item
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
