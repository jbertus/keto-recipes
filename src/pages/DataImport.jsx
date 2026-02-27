
import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Database, Upload, FileJson, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/customSupabaseClient';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { sauceRecipes } from '@/data/sauceRecipes';

export default function DataImport() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [sauceImportStatus, setSauceImportStatus] = useState(null); // 'idle', 'success', 'error'

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const handleImportSauces = async () => {
    setLoading(true);
    setSauceImportStatus(null);
    
    try {
      const { data: existingRecipes, error: fetchError } = await supabase
        .from('personal_recipes')
        .select('recipe_name')
        .eq('user_id', user.id);
        
      if (fetchError) throw fetchError;
      
      const existingNames = new Set((existingRecipes || []).map(r => r.recipe_name));
      const newRecipes = sauceRecipes.filter(r => !existingNames.has(r.recipe_name));
      
      if (newRecipes.length === 0) {
        setSauceImportStatus('success');
        toast({ 
          title: "Nothing to Import", 
          description: "All sauce recipes are already in your library." 
        });
        setLoading(false);
        return;
      }

      // AUDIT VERIFIED: Strip ID and ensure clean payload for insertion
      const recipesToInsert = newRecipes.map(({ id, ...rest }) => ({
        ...rest,
        user_id: user.id,
        created_at: new Date().toISOString(),
        dish_type: "Sauces",
        meal_type: "Sauce"
      }));

      const { error } = await supabase.from('personal_recipes').insert(recipesToInsert);

      if (error) throw error;

      setSauceImportStatus('success');
      
      toast({ 
        title: "Data imported successfully", 
        description: `Added ${recipesToInsert.length} new sauce recipes to your library.` 
      });

      setTimeout(() => {
        navigate('/recipes');
      }, 1500);

    } catch (error) {
      console.error("Import Error:", error);
      setSauceImportStatus('error');
      toast({ 
        title: "Import Failed", 
        description: error.message || "Failed to import sauce recipes.", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Database className="w-8 h-8 text-cyan-500" />
          Data Management
        </h1>
        <p className="text-slate-400">Import standard datasets, manage backups, and configure your data environment.</p>
      </div>

      <div className="grid gap-6">
        <Card className="bg-[#131B2D] border-slate-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <FileJson className="w-5 h-5 text-orange-500" />
              Standard Sauce Pack
            </CardTitle>
            <CardDescription>
              Import popular Keto-friendly copycat sauce recipes directly into your personal library.
              Includes detailed macros, ingredients, and preparation notes.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800 text-sm text-slate-300">
              <ul className="list-disc pl-4 space-y-1">
                <li>Includes recipes from Chick-fil-A, Wingstop, Buffalo Wild Wings, Taco Bell, and more.</li>
                <li>Formatted with precise gram measurements for keto compliance.</li>
                <li>Categorized under "Sauces" for easy filtering.</li>
                <li>Checks for duplicates before importing.</li>
              </ul>
            </div>

            {sauceImportStatus === 'success' && (
              <Alert className="bg-emerald-950/20 border-emerald-900 text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
                <AlertTitle>Success!</AlertTitle>
                <AlertDescription>
                  Sauce recipes have been added to your library. Redirecting...
                </AlertDescription>
              </Alert>
            )}

            {sauceImportStatus === 'error' && (
              <Alert variant="destructive" className="bg-red-950/20 border-red-900">
                <AlertTriangle className="w-4 h-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  There was a problem importing the recipes. Please try again.
                </AlertDescription>
              </Alert>
            )}

            <Button 
              type="button"
              onClick={handleImportSauces} 
              disabled={loading || sauceImportStatus === 'success'}
              className="w-full sm:w-auto bg-cyan-600 hover:bg-cyan-500 text-white font-semibold"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Checking & Importing...
                </>
              ) : sauceImportStatus === 'success' ? (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Import Completed
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Import Sauce Pack ({sauceRecipes.length} Recipes)
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-[#0B1120] border-slate-800 opacity-60">
          <CardHeader>
            <CardTitle className="text-slate-400 flex items-center gap-2">
              <Database className="w-5 h-5" />
              Backup & Export (Coming Soon)
            </CardTitle>
            <CardDescription>
              Tools to export your meal plans and custom recipes will be available here.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
