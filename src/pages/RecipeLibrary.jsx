
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase, SUPABASE_CONFIGURED } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Loader2, Sparkles, AlertCircle, Filter, AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import ReSearch from '@/components/ReSearch';
import RecipeViewDialog from '@/components/planner/RecipeViewDialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function RecipeLibrary() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  
  // Dialog State
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  const filters = ['All', 'Breakfast', 'Lunch/Dinner', 'Snack/Appetizer', 'Sweets/Dessert', 'Salad', 'Soup/Stew', 'Side', 'Sauce'];

  useEffect(() => {
    if (SUPABASE_CONFIGURED) {
      fetchRecipes();
    }
  }, [user, activeFilter]);

  const fetchRecipes = async (params = {}) => {
    if (!SUPABASE_CONFIGURED || !supabase) return;
    setLoading(true);
    try {
        let query = supabase.from('personal_recipes').select('*');
        
        if (searchQuery) {
            query = query.ilike('recipe_name', `%${searchQuery}%`);
        }

        if (activeFilter !== 'All') {
            const searchValues = [activeFilter];
            query = query.in('meal_type', searchValues);
        }

        query = query.limit(500);

        const { data, error } = await query;
        if (error) throw error;
        
        if (params.includeAi) {
            const mockAi = Array(3).fill(null).map((_, i) => ({
                id: `ai_${Date.now()}_${i}`,
                recipe_name: `AI Generated: ${searchQuery || 'Keto Delight'} #${i+1}`,
                meal_type: activeFilter === 'All' ? 'Lunch/Dinner' : activeFilter,
                calories_per_serving: 600,
                is_ai: true,
                tags: ['AI Generated', 'New']
            }));
            setRecipes([...mockAi, ...(data || [])]);
            toast({ title: "AI Search Complete", description: "Added 3 new AI recipes to results." });
        } else {
            setRecipes(data || []);
        }

    } catch (error) {
        console.error("Fetch error:", error);
        toast({ variant: "destructive", title: "Error", description: "Failed to load recipes." });
    } finally {
        setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
      e.preventDefault();
      fetchRecipes();
  };

  const openRecipe = (recipe) => {
      setSelectedRecipe(recipe);
      setIsViewDialogOpen(true);
  };

  const FilterList = () => (
      <div className="p-4 bg-slate-900 rounded-lg border border-slate-800">
        <p className="text-slate-500 text-sm mb-3 font-medium uppercase tracking-wider">Quick Filters</p>
        <div className="flex flex-wrap gap-2">
            {filters.map((filter) => (
                <Button
                    key={filter}
                    variant={activeFilter === filter ? "default" : "outline"}
                    onClick={() => setActiveFilter(filter)}
                    className={`
                        ${activeFilter === filter 
                            ? 'bg-cyan-600 text-white border-cyan-600 hover:bg-cyan-500' 
                            : 'bg-transparent text-slate-400 border-slate-700 hover:text-white hover:bg-slate-800'
                        }
                        text-xs h-8 px-3 rounded-full transition-all
                    `}
                >
                    {filter}
                </Button>
            ))}
        </div>
     </div>
  );

  if (!SUPABASE_CONFIGURED) {
    return (
       <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] bg-[#0B1120] p-6 text-center">
         <AlertTriangle className="h-16 w-16 text-slate-700 mb-4" />
         <h1 className="text-2xl font-bold text-white mb-2">Recipe Library Offline</h1>
         <p className="text-slate-500 max-w-md">Your recipe collection cannot be loaded because the database connection is missing.</p>
       </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-[#0B1120] overflow-hidden">
      <Helmet>
        <title>Recipe Library | Keto Contractor</title>
      </Helmet>

      {/* Sidebar - Desktop */}
      <div className="w-64 hidden lg:block border-r border-slate-800 bg-[#0B1120] overflow-y-auto p-6">
         <h2 className="text-lg font-bold text-white mb-4">Categories</h2>
         <FilterList />
         
         <div className="mt-6 p-4 bg-slate-900 rounded-lg border border-slate-800">
            <p className="text-slate-500 text-sm mb-3 font-medium uppercase tracking-wider">Dietary Preferences</p>
            <div className="flex flex-wrap gap-2">
                {['Keto', 'Paleo', 'Vegan', 'Dairy-Free'].map(tag => (
                    <Badge key={tag} variant="outline" className="bg-slate-950 text-slate-400 border-slate-700 hover:text-white cursor-pointer py-1">
                        {tag}
                    </Badge>
                ))}
            </div>
         </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="p-4 md:p-6 border-b border-slate-800 bg-[#0B1120] z-10 space-y-4 md:space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white">Recipe Library</h1>
                    <p className="text-slate-400 text-sm md:text-base">Browse your personal collection and favorites.</p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    {/* Mobile Filter Button */}
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="outline" className="lg:hidden border-slate-700 text-slate-300">
                                <Filter className="w-4 h-4 mr-2" /> Filters
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="bg-[#0B1120] border-slate-800">
                            <SheetHeader>
                                <SheetTitle className="text-white">Recipe Filters</SheetTitle>
                            </SheetHeader>
                            <div className="mt-6">
                                <FilterList />
                            </div>
                        </SheetContent>
                    </Sheet>

                    <Button className="flex-1 sm:flex-none bg-cyan-600 hover:bg-cyan-500 text-white">
                        <Plus className="w-4 h-4 mr-2" /> <span className="hidden sm:inline">New Recipe</span><span className="sm:hidden">New</span>
                    </Button>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
                <form onSubmit={handleSearchSubmit} className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <Input 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search recipes, ingredients..." 
                        className="pl-9 bg-slate-900 border-slate-800 text-white w-full h-11 focus:ring-cyan-500/20 focus:border-cyan-500"
                    />
                </form>
                <div className="w-full sm:w-auto">
                   <ReSearch onSearch={fetchRecipes} />
                </div>
            </div>
        </div>

        {/* Content Grid */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#0B1120]">
            {loading ? (
                <div className="flex flex-col items-center justify-center h-40 gap-4">
                    <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
                    <p className="text-slate-500">Loading library...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6">
                    {recipes.map((recipe) => (
                        <div 
                            key={recipe.id} 
                            onClick={() => openRecipe(recipe)}
                            className="bg-[#131B2D] border border-slate-800 rounded-xl overflow-hidden hover:border-slate-600 transition-colors group cursor-pointer flex flex-col shadow-sm hover:shadow-md"
                        >
                            <div className="h-40 sm:h-48 bg-slate-900 relative overflow-hidden">
                                {recipe.image_path ? (
                                    <img src={recipe.image_path} alt={recipe.recipe_name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-700 bg-slate-800/50">
                                        <Sparkles className="w-10 h-10 opacity-20" />
                                    </div>
                                )}
                                {recipe.is_ai && (
                                    <Badge className="absolute top-2 right-2 bg-purple-600 hover:bg-purple-700 shadow-lg border-0 text-[10px]">AI Generated</Badge>
                                )}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity" />
                            </div>
                            <div className="p-4 flex flex-col flex-1">
                                <h3 className="font-bold text-white text-base sm:text-lg truncate mb-1 group-hover:text-cyan-400 transition-colors">{recipe.recipe_name}</h3>
                                <div className="flex items-center gap-2 text-xs text-slate-400 mt-auto">
                                    <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700">{recipe.meal_type || 'General'}</span>
                                    <span>•</span>
                                    <span>{recipe.calories_per_serving ? Math.round(recipe.calories_per_serving) : 0} kcal</span>
                                </div>
                            </div>
                        </div>
                    ))}
                    
                    {recipes.length === 0 && (
                        <div className="col-span-full flex flex-col items-center justify-center py-20 text-slate-500 border border-dashed border-slate-800 rounded-xl bg-slate-900/20 mx-4 md:mx-0">
                            <AlertCircle className="w-10 h-10 mb-4 opacity-20" />
                            <p className="text-lg font-medium">No recipes found</p>
                            <p className="text-sm opacity-60 mt-1 text-center px-4">Try adjusting your search filters or use AI Re-Search to generate new ideas.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
        
        {/* Recipe Dialog */}
        <RecipeViewDialog 
            open={isViewDialogOpen} 
            onOpenChange={setIsViewDialogOpen} 
            recipe={selectedRecipe} 
        />
      </div>
    </div>
  );
}
