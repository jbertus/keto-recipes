import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, Loader2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getRecipeImageUrl } from '@/lib/imageUtils';

export default function Favorites() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [favoriteRecipes, setFavoriteRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchFavorites();
    }
  }, [user]);

  const fetchFavorites = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('favorite_recipes')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      setFavoriteRecipes(data || []);
    } catch (error) {
      console.error('Error fetching favorite recipes:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to load favorite recipes.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRecipeClick = (recipeId) => {
    navigate(`/recipes/${recipeId}`);
  };

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 bg-[#0f172a] text-white min-h-screen">
      <Helmet>
        <title>Favorites | Keto Contractor</title>
        <meta name="description" content="View your saved favorite recipes." />
      </Helmet>

      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-cyan-400 flex items-center gap-3">
          <Heart className="w-7 h-7 text-red-500 fill-red-500" /> My Favorite Recipes
        </h1>
        <Button variant="outline" onClick={() => navigate('/')} className="border-slate-700 bg-slate-900/50 hover:bg-slate-800 text-slate-300">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Planner
        </Button>
      </div>

      <p className="text-slate-400 mb-8">
        These are the recipes you've marked as your favorites. Click on any recipe to view its full details.
      </p>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
        </div>
      ) : favoriteRecipes.length === 0 ? (
        <div className="text-center p-10 border border-slate-700 rounded-lg bg-slate-900/50">
          <Heart className="w-16 h-16 mx-auto mb-4 text-red-500/50" />
          <h2 className="text-xl font-semibold text-slate-300 mb-2">No Favorites Yet!</h2>
          <p className="text-slate-500 mb-4">Start exploring recipes and click the heart icon to add them here.</p>
          <Button onClick={() => navigate('/recipes')} className="bg-cyan-600 hover:bg-cyan-700">Browse Recipes</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {favoriteRecipes.map((favorite) => (
            <Card key={favorite.id} className="bg-[#131B2D] border-slate-800 hover:border-slate-700 hover:shadow-xl transition-all cursor-pointer overflow-hidden flex flex-col group" onClick={() => handleRecipeClick(favorite.recipe_id)}>
              <div className="relative h-48 overflow-hidden bg-slate-900">
                <img 
                  alt={favorite.recipe_name} 
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                  src={getRecipeImageUrl(favorite.recipe_data || {})} 
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#131B2D] via-transparent to-transparent opacity-80" />
              </div>
              <CardHeader className="p-4 bg-[#131B2D]">
                <CardTitle className="text-lg font-bold text-white leading-tight mb-1 line-clamp-1 group-hover:text-cyan-400 transition-colors">{favorite.recipe_name}</CardTitle>
                <div className="flex items-center gap-3 text-xs text-slate-400 mt-2">
                  <span className="flex items-center gap-1">
                     {favorite.prep_time ? `${favorite.prep_time}m` : '15m'}
                  </span>
                  <span className="w-1 h-1 rounded-full bg-slate-600" />
                  <span>{favorite.difficulty || 'Medium'}</span>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}