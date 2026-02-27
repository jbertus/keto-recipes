import React, { useState, useEffect } from 'react';
import { Search, Filter, X, Loader2, Utensils, Flame, Wheat } from 'lucide-react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { cn } from '@/lib/utils';

const DIETARY_TAGS = [
  'Keto', 'Vegan', 'Paleo', 
  'Vegetarian', 'Gluten-Free', 'Dairy-Free'
];

function RecipeCard({ recipe }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `sidebar-recipe-${recipe.id}`,
    data: { 
      type: 'recipe',
      recipe: recipe 
    },
  });

  const style = transform ? {
    transform: CSS.Translate.toString(transform),
  } : undefined;

  // Handle image path (storage path vs url)
  const imageUrl = recipe.image_path?.startsWith('http') 
    ? recipe.image_path 
    : recipe.image_path 
      ? supabase.storage.from('recipe-images').getPublicUrl(recipe.image_path).data.publicUrl
      : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="group bg-[#1e293b]/40 hover:bg-[#1e293b] border border-slate-800 hover:border-cyan-500/50 rounded-lg p-3 transition-all cursor-grab active:cursor-grabbing mb-3"
    >
      <div className="flex gap-3">
        <div className="w-16 h-16 rounded-md bg-slate-800 shrink-0 overflow-hidden relative">
          {imageUrl ? (
            <img src={imageUrl} alt={recipe.recipe_name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-slate-600">
              <Utensils className="w-6 h-6" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-slate-200 text-sm truncate leading-tight mb-1">
            {recipe.recipe_name}
          </h4>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1.5">
            <span className="flex items-center gap-1 text-orange-400">
              <Flame className="w-3 h-3" />
              {Math.round(recipe.calories_per_serving || 0)}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 text-amber-400 font-medium">
               <Wheat className="w-3 h-3" />
               {Math.round(recipe.net_carbs_per_serving_g || 0)}g net
            </span>
          </div>
          <div className="flex flex-wrap gap-1">
            {(recipe.tags || []).slice(0, 2).map(tag => (
              <span key={tag} className="text-[10px] px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RecipeSidebar() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilters, setActiveFilters] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchRecipes = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        let query = supabase
          .from('personal_recipes')
          .select('*')
          .eq('user_id', user.id)
          .order('recipe_name');

        if (searchTerm) {
          query = query.ilike('recipe_name', `%${searchTerm}%`);
        }

        if (activeFilters.length > 0) {
          query = query.contains('tags', activeFilters);
        }

        const { data, error } = await query;
        
        if (error) throw error;
        setRecipes(data || []);
      } catch (err) {
        console.error('Error fetching recipes:', err);
        setRecipes([]);
      } finally {
        setLoading(false);
      }
    };

    // Debounce search
    const timer = setTimeout(() => {
      fetchRecipes();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, activeFilters, user]);

  const toggleFilter = (tag) => {
    setActiveFilters(prev => 
      (prev || []).includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...(prev || []), tag]
    );
  };

  return (
    <div className="flex flex-col h-full bg-[#0B1120] text-slate-300">
      <div className="p-3 space-y-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Search recipes..."
            className="pl-9 bg-[#131b2e] border-slate-800 focus:border-cyan-500/50 h-9 text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Library
          </span>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "h-6 px-2 text-xs hover:bg-[#1e293b]",
              (showFilters || activeFilters.length > 0) ? "text-cyan-400 bg-[#1e293b]/50" : "text-slate-400"
            )}
          >
            <Filter className="w-3 h-3 mr-1.5" />
            Filters
            {activeFilters.length > 0 && (
              <span className="ml-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-cyan-500/20 text-[10px] text-cyan-400">
                {activeFilters.length}
              </span>
            )}
          </Button>
        </div>

        {(showFilters || activeFilters.length > 0) && (
          <div className="flex flex-wrap gap-1.5 pt-1 animate-in slide-in-from-top-2 duration-200">
            {DIETARY_TAGS.map(tag => {
              const isActive = (activeFilters || []).includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() => toggleFilter(tag)}
                  className={cn(
                    "text-[10px] px-2 py-1 rounded-md border transition-all",
                    isActive 
                      ? "bg-cyan-500/10 border-cyan-500/50 text-cyan-400" 
                      : "bg-[#1e293b]/40 border-slate-800 text-slate-400 hover:bg-[#1e293b] hover:text-slate-200"
                  )}
                >
                  {tag}
                </button>
              );
            })}
            {activeFilters.length > 0 && (
              <button 
                onClick={() => setActiveFilters([])}
                className="text-[10px] px-2 py-1 text-slate-500 hover:text-slate-300 flex items-center"
              >
                <X className="w-3 h-3 mr-1" />
                Clear
              </button>
            )}
          </div>
        )}
      </div>

      <Separator className="bg-slate-800" />

      <ScrollArea className="flex-1 px-3 py-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-10 space-y-3 text-slate-500">
            <Loader2 className="w-6 h-6 animate-spin text-cyan-500" />
            <span className="text-xs">Loading recipes...</span>
          </div>
        ) : (recipes || []).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 space-y-3 text-slate-500">
            <div className="w-12 h-12 rounded-full bg-[#1e293b] flex items-center justify-center">
              <Search className="w-5 h-5 opacity-50" />
            </div>
            <div className="text-center px-4">
              <p className="text-sm font-medium text-slate-400">No recipes found</p>
              <p className="text-xs text-slate-600 mt-1">Try adjusting your search or filters</p>
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            {(recipes || []).map(recipe => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}