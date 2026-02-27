
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { 
  ArrowLeft, 
  Clock, 
  Users, 
  ChefHat, 
  Utensils, 
  Flame, 
  Share2, 
  Heart, 
  Printer, 
  PlayCircle, 
  Edit,
  Trash2,
  CalendarPlus,
  MoreVertical,
  Minus,
  Plus,
  Scale,
  FileText,
  List
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { getRecipeImageUrl } from '@/lib/imageUtils';
import AddToPlannerDialog from '@/components/planner/AddToPlannerDialog';
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
import { cn, formatIngredientLine, getRecipeIngredients, getRecipeInstructions } from '@/lib/utils';

// Scaling Helpers
const formatDecimal = (num) => {
  const rounded = Math.round(num * 100) / 100;
  return rounded.toString();
};

const scaleNumberString = (str, multiplier) => {
  try {
    if (str.includes('/')) {
      const [num, den] = str.split('/').map(Number);
      if (!den) return str;
      const val = num / den;
      return formatDecimal(val * multiplier);
    }
    if (str.includes('-')) {
        const parts = str.split('-').map(p => p.trim());
        if (parts.every(p => !isNaN(parseFloat(p)))) {
             return parts.map(p => formatDecimal(parseFloat(p) * multiplier)).join('-');
        }
    }
    const val = parseFloat(str);
    if (isNaN(val)) return str;
    return formatDecimal(val * multiplier);
  } catch {
    return str;
  }
};

const scaleIngredientLine = (line, multiplier) => {
    if (multiplier === 1) return line;
    // Regex matches numbers at the start of the formatted line (e.g., "1.5 cups")
    return line.replace(/^(\d+(?:\.\d+)?(?:\/\d+)?(?:\s*-\s*\d+(?:\.\d+)?(?:\/\d+)?)?)/, (match) => {
      return scaleNumberString(match, multiplier);
    });
};


export default function RecipeDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scale, setScale] = useState(1);
  const [plannerDialogOpen, setPlannerDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);
  const [guidance, setGuidance] = useState(null);

  useEffect(() => {
    if (id && user) {
      fetchRecipe();
      checkIfFavorite();
    }
  }, [id, user]);

  const fetchRecipe = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('personal_recipes')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setRecipe(data);

      // Fetch supplementary guidance if present
      const { data: guidanceData } = await supabase
        .from('recipe_guidance')
        .select('*')
        .eq('recipe_id', id)
        .maybeSingle();
      
      if (guidanceData) {
          setGuidance(guidanceData);
      }

    } catch (error) {
      console.error('Error fetching recipe:', error);
      toast({ variant: "destructive", title: "Error", description: "Could not load recipe details." });
      navigate('/recipes');
    } finally {
      setLoading(false);
    }
  };

  const checkIfFavorite = async () => {
    try {
      const { data } = await supabase
        .from('favorite_recipes')
        .select('id')
        .eq('user_id', user.id)
        .eq('recipe_id', id)
        .maybeSingle();
      
      setIsFavorite(!!data);
    } catch (error) {
      console.error('Error checking favorite:', error);
    }
  };

  const toggleFavorite = async () => {
    try {
      if (isFavorite) {
        await supabase
          .from('favorite_recipes')
          .delete()
          .eq('user_id', user.id)
          .eq('recipe_id', id);
        setIsFavorite(false);
        toast({ title: "Removed from Favorites" });
      } else {
        await supabase
          .from('favorite_recipes')
          .insert({
            user_id: user.id,
            recipe_id: id,
            recipe_name: recipe.recipe_name,
            recipe_data: recipe
          });
        setIsFavorite(true);
        toast({ title: "Added to Favorites" });
      }
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to update favorites." });
    }
  };

  const handleDelete = async () => {
    try {
       const { error } = await supabase
        .from('personal_recipes')
        .delete()
        .eq('id', id);

       if (error) throw error;
       
       toast({ title: "Recipe Deleted", description: "The recipe has been permanently removed." });
       navigate('/recipes');
    } catch (err) {
       toast({ variant: "destructive", title: "Delete Failed", description: "Could not delete recipe." });
    }
  };

  const safeNumber = (val) => {
    const num = parseFloat(val);
    return isNaN(num) ? 0 : num;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B1120] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500" />
      </div>
    );
  }

  if (!recipe) return null;

  // USE NEW UTILS
  const parsedIngredients = getRecipeIngredients(recipe);
  const displayIngredients = parsedIngredients.map(line => scaleIngredientLine(line, scale));
  const instructions = getRecipeInstructions(recipe, guidance);
  
  // Calculate Macros
  const calories = Math.round(safeNumber(recipe.calories_per_serving) * scale);
  const protein = Math.round(safeNumber(recipe.protein_per_serving_g) * scale);
  const carbs = Math.round(safeNumber(recipe.net_carbs_per_serving_g) * scale);
  const fat = Math.round(safeNumber(recipe.fat_per_serving_g) * scale);
  const servings = (safeNumber(recipe.servings_per_batch) || 1) * scale;
  const displayServings = Math.round(servings * 10) / 10;

  return (
    <div className="min-h-screen bg-[#0B1120] pb-20">
      <Helmet>
        <title>{recipe.recipe_name} | Keto Contractor</title>
      </Helmet>

      {/* Navbar / Top Bar */}
      <div className="sticky top-0 z-40 w-full bg-[#0B1120]/95 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Button variant="ghost" className="text-slate-400 hover:text-white -ml-2 gap-2" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" /> Back
          </Button>

          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="border-slate-700 bg-slate-800/50 text-slate-300 hover:bg-slate-700 gap-2 hidden sm:flex"
              onClick={() => setPlannerDialogOpen(true)}
            >
               <CalendarPlus className="w-4 h-4 text-cyan-500" />
               Add to Planner
            </Button>
            
            <Button 
               variant="ghost" 
               size="icon" 
               onClick={toggleFavorite}
               className={isFavorite ? "text-red-500 hover:text-red-600 hover:bg-red-500/10" : "text-slate-400 hover:text-white"}
            >
               <Heart className="w-5 h-5" fill={isFavorite ? "currentColor" : "none"} />
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                  <MoreVertical className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-[#131B2D] border-slate-800 text-slate-200">
                <DropdownMenuItem className="focus:bg-slate-800 cursor-pointer sm:hidden" onClick={() => setPlannerDialogOpen(true)}>
                    <CalendarPlus className="w-4 h-4 mr-2" /> Add to Planner
                </DropdownMenuItem>
                <DropdownMenuItem className="focus:bg-slate-800 cursor-pointer" onClick={() => navigate(`/builder?edit=${id}`)}>
                    <Edit className="w-4 h-4 mr-2" /> Edit Recipe
                </DropdownMenuItem>
                <DropdownMenuItem className="focus:bg-slate-800 cursor-pointer text-red-400 focus:text-red-400 focus:bg-red-950/20" onClick={() => setDeleteDialogOpen(true)}>
                    <Trash2 className="w-4 h-4 mr-2" /> Delete Recipe
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8">
         {/* Main Content */}
         <div className="space-y-8">
            {/* Header Section */}
            <div className="space-y-4">
               <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight">{recipe.recipe_name}</h1>
               <div className="flex flex-wrap gap-2">
                  <Badge className="bg-slate-800 text-slate-300 hover:bg-slate-700 border-slate-700 px-3 py-1 text-sm">{recipe.meal_type || 'General'}</Badge>
                  <Badge variant="outline" className="border-slate-700 text-slate-400">{recipe.cuisine_type || 'International'}</Badge>
                  <Badge variant="outline" className="border-slate-700 text-slate-400">{recipe.difficulty || 'Easy'}</Badge>
                  {recipe.estimated_total_time_min > 0 && (
                     <Badge variant="outline" className="border-slate-700 text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {recipe.estimated_total_time_min} min
                     </Badge>
                  )}
               </div>
            </div>

            {/* Hero Image */}
            <div className="aspect-video w-full rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl relative group">
               <img src={getRecipeImageUrl(recipe)} alt={recipe.recipe_name} className="w-full h-full object-cover" />
               <div className="absolute inset-0 bg-gradient-to-t from-[#0B1120] via-transparent to-transparent opacity-60" />
               {/* Mobile only overlay info */}
               <div className="absolute bottom-4 left-4 lg:hidden text-white drop-shadow-md">
                   <div className="flex items-center gap-4 text-sm font-semibold">
                      <span>{calories} kcal</span>
                      <span>{carbs}g net carb</span>
                   </div>
               </div>
            </div>
            
            {/* Description / Notes */}
            {(recipe.description || guidance?.prep_guidance) && (
               <div className="p-4 bg-[#131B2D]/30 rounded-lg border border-slate-800/50">
                  <p className="text-slate-300 leading-relaxed italic">"{recipe.description || guidance.prep_guidance}"</p>
               </div>
            )}

            {/* Ingredients Section - Main Content for better readability */}
            <div className="space-y-4">
               <h2 className="text-2xl font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-800">
                  <Utensils className="w-6 h-6 text-emerald-500" /> Ingredients
               </h2>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-slate-300">
                   {displayIngredients.length > 0 ? displayIngredients.map((ing, i) => (
                      <div key={i} className="flex items-start gap-3 py-2 border-b border-slate-800/30 group">
                         <div className="w-1.5 h-1.5 rounded-full bg-cyan-600 mt-2 shrink-0 group-hover:bg-cyan-400 transition-colors" />
                         <span className="leading-relaxed group-hover:text-white transition-colors">{ing}</span>
                      </div>
                   )) : (
                      <div className="col-span-2 py-8 text-center text-slate-500 italic bg-[#131B2D]/20 rounded-xl border border-dashed border-slate-800">
                         No ingredients listed for this recipe.
                      </div>
                   )}
               </div>
            </div>

            {/* Preparation Section */}
            <div className="space-y-4">
               <h2 className="text-2xl font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-800">
                  <ChefHat className="w-6 h-6 text-cyan-500" /> Instructions
               </h2>
               <div className="space-y-6">
                  {instructions.length > 0 ? instructions.map((step, idx) => (
                      <div key={idx} className="flex gap-4 group">
                         <div className="flex-none">
                             <span className="w-8 h-8 rounded-full bg-[#131B2D] text-cyan-500 flex items-center justify-center font-bold text-sm border border-slate-800 shadow-sm group-hover:border-cyan-500/50 group-hover:text-cyan-400 transition-all">
                               {idx + 1}
                             </span>
                         </div>
                         <div className="pt-1">
                             <p className="text-slate-300 leading-relaxed text-lg group-hover:text-slate-200 transition-colors">{step}</p>
                         </div>
                      </div>
                  )) : (
                      <div className="py-8 text-center text-slate-500 italic bg-[#131B2D]/20 rounded-xl border border-dashed border-slate-800">
                         No instructions provided for this recipe.
                      </div>
                  )}
               </div>
            </div>
         </div>

         {/* Sidebar Stats */}
         <div className="space-y-6">
            {/* Macros Card */}
            <div className="bg-[#131B2D] rounded-2xl p-6 border border-slate-800 shadow-lg space-y-6 sticky top-24">
                <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                    <div className="space-y-1">
                       <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Per Serving</p>
                       <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-bold text-white">{calories}</span>
                          <span className="text-sm text-slate-500 font-medium">kcal</span>
                       </div>
                    </div>
                    
                    {/* Scale Controls */}
                    <div className="flex items-center bg-slate-950 rounded-lg p-1 border border-slate-800">
                        <button 
                           onClick={() => setScale(s => Math.max(0.5, s - 0.5))}
                           className="p-1.5 hover:bg-slate-800 rounded-md text-slate-400 hover:text-white transition-colors disabled:opacity-50"
                           disabled={scale <= 0.5}
                        >
                           <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-10 text-center text-xs font-mono text-cyan-400 font-bold">{scale}x</span>
                        <button 
                           onClick={() => setScale(s => Math.min(5, s + 0.5))}
                           className="p-1.5 hover:bg-slate-800 rounded-md text-slate-400 hover:text-white transition-colors"
                        >
                           <Plus className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>

                {/* Macro Grid */}
                <div className="grid grid-cols-3 gap-3">
                   <div className="bg-slate-950/50 rounded-xl p-3 text-center border border-slate-800/50">
                      <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Net Carbs</p>
                      <p className={cn("text-xl font-bold", carbs > 30 ? "text-red-400" : carbs <= 12 ? "text-emerald-400" : "text-amber-400")}>{carbs}g</p>
                   </div>
                   <div className="bg-slate-950/50 rounded-xl p-3 text-center border border-slate-800/50">
                      <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Protein</p>
                      <p className="text-xl font-bold text-blue-400">{protein}g</p>
                   </div>
                   <div className="bg-slate-950/50 rounded-xl p-3 text-center border border-slate-800/50">
                      <p className="text-[10px] text-slate-500 uppercase font-bold mb-1">Fat</p>
                      <p className="text-xl font-bold text-slate-400">{fat}g</p>
                   </div>
                </div>

                {/* Meta Info */}
                <div className="grid grid-cols-2 gap-4 pt-2">
                   <div className="flex items-center gap-3 text-slate-300 p-2 rounded-lg hover:bg-slate-800/50 transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                         <Clock className="w-4 h-4 text-cyan-400" />
                      </div>
                      <div className="min-w-0">
                         <p className="text-[10px] text-slate-500 uppercase font-bold truncate">Total Time</p>
                         <p className="text-sm font-medium truncate">{recipe.estimated_total_time_min ? `${recipe.estimated_total_time_min} mins` : "N/A"}</p>
                      </div>
                   </div>
                   <div className="flex items-center gap-3 text-slate-300 p-2 rounded-lg hover:bg-slate-800/50 transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center shrink-0">
                         <Users className="w-4 h-4 text-purple-400" />
                      </div>
                      <div className="min-w-0">
                         <p className="text-[10px] text-slate-500 uppercase font-bold truncate">Yields</p>
                         <p className="text-sm font-medium truncate">{displayServings} servings</p>
                      </div>
                   </div>
                </div>

                {/* Condensed Ingredients Preview for Sidebar (Desktop) */}
                <div className="hidden lg:block pt-4 border-t border-slate-800 space-y-3 opacity-60 hover:opacity-100 transition-opacity">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                       Quick List
                    </h3>
                    <ul className="space-y-1 text-xs text-slate-500 max-h-[200px] overflow-hidden relative">
                       {displayIngredients.slice(0, 5).map((ing, i) => (
                          <li key={i} className="truncate pl-2 border-l-2 border-slate-800">{ing}</li>
                       ))}
                       {displayIngredients.length > 5 && <li className="pl-2 italic pt-1">...and {displayIngredients.length - 5} more</li>}
                    </ul>
                </div>
                
                {/* Large CTA Button */}
                <Button className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold h-12 shadow-lg shadow-cyan-900/20 mt-2" onClick={() => setPlannerDialogOpen(true)}>
                   <CalendarPlus className="w-5 h-5 mr-2" /> Add to Meal Plan
                </Button>

            </div>
         </div>
      </div>
      
      {/* Dialogs */}
      <AddToPlannerDialog 
         open={plannerDialogOpen} 
         onOpenChange={setPlannerDialogOpen} 
         recipe={recipe} 
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-[#131B2D] border-slate-800 text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              This action cannot be undone. This will permanently delete the recipe 
              <span className="font-bold text-white mx-1">{recipe.recipe_name}</span>
              from your library.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white border-none">Delete Recipe</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

    </div>
  );
}
