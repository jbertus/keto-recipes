
import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/customSupabaseClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, RefreshCw, Database, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function RecipeDiagnostics() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState([]);
  const [rawRecipes, setRawRecipes] = useState([]);
  const [totalRecipes, setTotalRecipes] = useState(0);
  const [uniqueTypes, setUniqueTypes] = useState(0);
  const [nullCount, setNullCount] = useState(0);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetching from 'personal_recipes' as 'recipes' table does not exist in the provided schema
      // and RecipeLibrary uses personal_recipes.
      const { data, error } = await supabase
        .from('personal_recipes')
        .select('id, recipe_name, meal_type');

      if (error) throw error;

      setRawRecipes(data || []);
      setTotalRecipes(data?.length || 0);

      // Analyze Meal Types
      const typeCounts = {};
      let nulls = 0;

      data.forEach(recipe => {
        const type = recipe.meal_type;
        if (type === null || type === undefined) {
          nulls++;
          const key = 'NULL';
          typeCounts[key] = (typeCounts[key] || 0) + 1;
        } else {
          // Keep raw casing to detect inconsistencies
          typeCounts[type] = (typeCounts[type] || 0) + 1;
        }
      });

      setNullCount(nulls);

      // Convert to array for table
      const statsArray = Object.entries(typeCounts).map(([type, count]) => ({
        type,
        count,
        percentage: ((count / data.length) * 100).toFixed(1)
      })).sort((a, b) => b.count - a.count);

      setStats(statsArray);
      setUniqueTypes(Object.keys(typeCounts).length);

    } catch (err) {
      console.error('Diagnostic error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Database className="w-6 h-6 text-cyan-500" />
            Recipe Data Diagnostics
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Inspect raw database values for <code className="bg-slate-800 px-1 rounded text-cyan-400">meal_type</code> to debug filtering issues.
          </p>
        </div>
        <Button onClick={fetchData} disabled={loading} size="sm" className="bg-cyan-600 hover:bg-cyan-500">
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
          Refresh Data
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error Fetching Data</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-[#131B2D] border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-slate-400 text-sm font-medium">Total Recipes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{totalRecipes}</div>
          </CardContent>
        </Card>
        
        <Card className="bg-[#131B2D] border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-slate-400 text-sm font-medium">Unique Meal Types</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-cyan-400">{uniqueTypes}</div>
            <p className="text-xs text-slate-500 mt-1">Distinct values found in DB</p>
          </CardContent>
        </Card>

        <Card className="bg-[#131B2D] border-slate-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-slate-400 text-sm font-medium">Undefined / Null</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-amber-500">{nullCount}</div>
            <p className="text-xs text-slate-500 mt-1">Recipes with no meal type</p>
          </CardContent>
        </Card>
      </div>

      {/* Aggregated Stats Table */}
      <Card className="bg-[#131B2D] border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Distribution by Meal Type</CardTitle>
          <CardDescription>Grouped counts of exact string values found in the database.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
             <div className="flex justify-center p-8">
               <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
             </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800 hover:bg-transparent">
                  <TableHead className="text-slate-300">Raw Value (DB)</TableHead>
                  <TableHead className="text-slate-300">Count</TableHead>
                  <TableHead className="text-slate-300">Percentage</TableHead>
                  <TableHead className="text-slate-300 text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-slate-500 py-8">No data found</TableCell>
                  </TableRow>
                ) : (
                  stats.map((stat) => (
                    <TableRow key={stat.type} className="border-slate-800 hover:bg-slate-900/50">
                      <TableCell className="font-mono text-cyan-300">
                        {stat.type === 'NULL' ? <span className="text-amber-500 italic">NULL</span> : `"${stat.type}"`}
                      </TableCell>
                      <TableCell className="text-white font-bold">{stat.count}</TableCell>
                      <TableCell className="text-slate-400">{stat.percentage}%</TableCell>
                      <TableCell className="text-right">
                        {['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Sweets', 'Side', 'Sauce', 'Drink'].includes(stat.type) ? (
                          <Badge variant="outline" className="border-emerald-500/50 text-emerald-400 bg-emerald-950/20">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Standard
                          </Badge>
                        ) : (
                           stat.type === 'NULL' ? (
                            <Badge variant="outline" className="border-amber-500/50 text-amber-400 bg-amber-950/20">Missing</Badge>
                           ) : (
                            <Badge variant="outline" className="border-yellow-500/50 text-yellow-400 bg-yellow-950/20">Non-Standard</Badge>
                           )
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Raw Data Inspection */}
      <Card className="bg-[#131B2D] border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Sample Data (First 50 Records)</CardTitle>
          <CardDescription>Verify specific recipe values.</CardDescription>
        </CardHeader>
        <CardContent>
           <div className="rounded-md border border-slate-800 max-h-[400px] overflow-auto">
             <Table>
               <TableHeader className="bg-slate-900 sticky top-0 z-10">
                 <TableRow className="border-slate-800">
                   <TableHead className="text-slate-300 w-[300px]">Recipe Name</TableHead>
                   <TableHead className="text-slate-300">Meal Type (Raw)</TableHead>
                   <TableHead className="text-slate-300 text-right">ID</TableHead>
                 </TableRow>
               </TableHeader>
               <TableBody>
                 {rawRecipes.slice(0, 50).map((recipe) => (
                   <TableRow key={recipe.id} className="border-slate-800 hover:bg-slate-900/50">
                     <TableCell className="text-slate-300 font-medium truncate max-w-[300px]">{recipe.recipe_name}</TableCell>
                     <TableCell className="text-cyan-300 font-mono text-sm">
                       {recipe.meal_type ? `"${recipe.meal_type}"` : <span className="text-amber-500 italic">NULL</span>}
                     </TableCell>
                     <TableCell className="text-slate-500 font-mono text-xs text-right">{recipe.id.substring(0, 8)}...</TableCell>
                   </TableRow>
                 ))}
               </TableBody>
             </Table>
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
