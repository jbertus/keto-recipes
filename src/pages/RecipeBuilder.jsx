import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from '@/components/ui/use-toast';
import { Save, Plus, Trash2, ArrowLeft, Loader2, Utensils, Clock, Flame, Upload, X } from 'lucide-react';

export default function RecipeBuilder() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false); 
  const [isEditMode, setIsEditMode] = useState(false);
  const [recipeId, setRecipeId] = useState(null);

  // Form State
  const [recipeName, setRecipeName] = useState('');
  const [mealType, setMealType] = useState('Dinner'); 
  const [servings, setServings] = useState(4); 
  const [prepTime, setPrepTime] = useState(30); 
  
  // Macros
  const [calories, setCalories] = useState(0);
  const [protein, setProtein] = useState(0);
  const [fat, setFat] = useState(0);
  const [carbs, setCarbs] = useState(0);
  
  // Lists
  const [ingredients, setIngredients] = useState([{ name: '', qty: '', unit: '' }]);
  const [instructions, setInstructions] = useState(['']);
  
  // Additional Meta
  const [imagePath, setImagePath] = useState('');
  const [cuisineType, setCuisineType] = useState('American');
  const [difficulty, setDifficulty] = useState('Medium');
  const [applianceType, setApplianceType] = useState('Stovetop');

  useEffect(() => {
    // Check if we are editing an existing recipe passed via navigation state
    if (location.state?.recipe) {
      const r = location.state.recipe;
      setIsEditMode(true);
      setRecipeId(r.id);
      
      // Map DB columns to UI state
      setRecipeName(r.recipe_name || r.name || '');
      setMealType(r.default_meal_slot || r.meal_type || 'Dinner');
      setServings(r.servings_per_batch || r.servings || 4);
      setPrepTime(r.estimated_total_time_min || r.total_time || 30);
      
      setCalories(r.calories_per_serving || r.calories || 0);
      setProtein(r.protein_per_serving_g || r.protein || 0);
      setFat(r.fat_per_serving_g || r.fat || 0);
      setCarbs(r.net_carbs_per_serving_g || r.netCarbs || 0);
      
      setImagePath(r.image_path || r.image || '');
      setCuisineType(r.cuisine_type || 'American');
      setDifficulty(r.difficulty || 'Medium');
      setApplianceType(r.appliance_type || 'Stovetop');

      // Parse Ingredients: handle both Block (DB) and Array (legacy/JSON) formats
      if (r.ingredients_block) {
         const lines = r.ingredients_block.split('\n');
         const parsed = lines.map(line => {
             const [name, qty, unit] = line.split('|');
             return { name: name?.trim() || '', qty: qty?.trim() || '', unit: unit?.trim() || '' };
         }).filter(i => i.name);
         setIngredients(parsed.length ? parsed : [{ name: '', qty: '', unit: '' }]);
      } else if (Array.isArray(r.ingredients)) {
         setIngredients(r.ingredients.map(i => ({
             name: i.name || i.item || '',
             qty: i.qty || i.quantity || '',
             unit: i.unit || ''
         })));
      } else if (typeof r.ingredients === 'string') {
          // Fallback for simple string blob if any
          const lines = r.ingredients.split('\n');
           const parsed = lines.map(line => {
             return { name: line.trim(), qty: '', unit: '' };
         }).filter(i => i.name);
         setIngredients(parsed.length ? parsed : [{ name: '', qty: '', unit: '' }]);
      }

      // Parse Prep Notes
      if (r.prep_notes_block) {
         const lines = r.prep_notes_block.split('\n');
         setInstructions(lines.length ? lines : ['']);
      } else if (Array.isArray(r.instructions)) {
         setInstructions(r.instructions);
      } else if (r.instructions && typeof r.instructions === 'string') {
         setInstructions(r.instructions.split('\n'));
      }
    }
  }, [location.state]);

  const handleIngredientChange = (index, field, value) => {
    const newIngredients = [...ingredients];
    newIngredients[index][field] = value;
    setIngredients(newIngredients);
  };

  const addIngredient = () => {
    setIngredients([...ingredients, { name: '', qty: '', unit: '' }]);
  };

  const removeIngredient = (index) => {
    if (ingredients.length > 1) {
      setIngredients(ingredients.filter((_, i) => i !== index));
    }
  };

  const handleInstructionChange = (index, value) => {
    const newInstructions = [...instructions];
    newInstructions[index] = value;
    setInstructions(newInstructions);
  };

  const addInstruction = () => {
    setInstructions([...instructions, '']);
  };

  const removeInstruction = (index) => {
    if (instructions.length > 1) {
      setInstructions(instructions.filter((_, i) => i !== index));
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
       toast({ variant: "destructive", title: "Invalid File", description: "Please upload an image file." });
       return;
    }
    if (file.size > 5 * 1024 * 1024) { 
        toast({ variant: "destructive", title: "File too large", description: "Image must be under 5MB." });
        return;
    }

    setUploading(true);
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('recipe-images')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        setImagePath(filePath); 
        toast({ title: "Image uploaded", description: "Image successfully uploaded." });
    } catch (error) {
        console.error('Upload error:', error);
        toast({ variant: "destructive", title: "Upload failed", description: error.message });
    } finally {
        setUploading(false);
        e.target.value = '';
    }
  };

  const clearImage = () => {
     setImagePath('');
  };

  const getPreviewUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http') || path.startsWith('blob:')) return path;
    const { data } = supabase.storage.from('recipe-images').getPublicUrl(path);
    return data?.publicUrl;
  };

  const handleSave = async () => {
    if (!recipeName.trim()) {
      toast({ variant: "destructive", title: "Missing Name", description: "Please give your recipe a name." });
      return;
    }
    if (!user) {
       toast({ variant: "destructive", title: "Error", description: "You must be logged in to save recipes." });
       return;
    }

    setLoading(true);

    try {
      // 1. Convert Ingredients to Block Format: "Item|Qty|Unit\nItem|Qty|Unit"
      const ingredientsBlock = ingredients
         .filter(i => i.name.trim())
         .map(i => `${i.name.trim()}|${i.qty}|${i.unit}`)
         .join('\n');
         
      // 2. Convert Instructions to Block Format: "Step 1\nStep 2"
      const prepNotesBlock = instructions
         .filter(i => i.trim())
         .join('\n');

      // 3. Construct Payload with SAFE defaults
      // Ensure numeric fields are definitely numbers, not strings or NaN
      const payload = {
         user_id: user.id,
         recipe_name: recipeName.trim(),
         default_meal_slot: mealType,
         servings_per_batch: Number(servings) || 1,
         estimated_total_time_min: parseInt(prepTime) || 0,
         
         calories_per_serving: Number(calories) || 0,
         protein_per_serving_g: Number(protein) || 0,
         fat_per_serving_g: Number(fat) || 0,
         net_carbs_per_serving_g: Number(carbs) || 0,
         
         ingredients_block: ingredientsBlock,
         prep_notes_block: prepNotesBlock,
         ingredients_norm: ingredientsBlock || " ", // Provide fallback to avoid NOT NULL violation if applicable
         
         image_path: imagePath || null,
         cuisine_type: cuisineType,
         difficulty: difficulty,
         appliance_type: applianceType,
         
         // Derived columns
         is_high_protein_25g_plus: (Number(protein) || 0) >= 25,
         meal_type: mealType, 
         protein_level: (Number(protein) || 0) > 30 ? 'High' : 'Moderate',
         dish_type: 'Main Course', 
         protein_type: 'Mixed', 
         
         time_bucket_10min: (Math.ceil((parseInt(prepTime) || 30) / 10) * 10) + ' min',
         created_at: new Date().toISOString() // Ensure timestamp is present on insert
      };

      let error;
      if (isEditMode && recipeId) {
         // Update existing recipe - Strict ownership check via user_id
         const { error: updateError } = await supabase
            .from('personal_recipes')
            .update(payload)
            .eq('id', recipeId)
            .eq('user_id', user.id);
         error = updateError;
      } else {
         // Create new recipe
         const { error: insertError } = await supabase
            .from('personal_recipes')
            .insert(payload);
         error = insertError;
      }

      if (error) {
        console.error("Supabase Save Error:", error);
        throw error;
      }

      toast({ 
         title: isEditMode ? "Recipe Updated" : "Recipe Created", 
         description: `${recipeName} has been saved to your library.` 
      });
      
      // Navigate back to recipe details if editing, or library if new
      if (isEditMode && recipeId) {
        navigate(`/recipes/${recipeId}`);
      } else {
        navigate('/recipes');
      }

    } catch (err) {
      console.error('Error saving recipe:', err);
      toast({ variant: "destructive", title: "Save Failed", description: err.message || "Could not save recipe to database." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-4xl mx-auto py-8 space-y-6">
      <Helmet>
        <title>{isEditMode ? 'Edit Recipe' : 'New Recipe'} | Keto Contractor</title>
      </Helmet>

      <div className="flex items-center justify-between">
         <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
               <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
               <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {isEditMode ? 'Edit Recipe' : 'Create New Recipe'}
               </h1>
               <p className="text-sm text-slate-500">
                  {isEditMode ? 'Update your recipe details below.' : 'Add a custom recipe to your personal library.'}
               </p>
            </div>
         </div>
         <Button onClick={handleSave} disabled={loading} className="bg-cyan-600 hover:bg-cyan-700 text-white">
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Recipe
         </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         {/* Left Column: Meta Data */}
         <div className="md:col-span-1 space-y-6">
            <Card className="border-slate-200 dark:border-slate-800">
               <CardHeader className="pb-3">
                  <CardTitle className="text-sm uppercase tracking-wider font-bold text-slate-500">Basic Info</CardTitle>
               </CardHeader>
               <CardContent className="space-y-4">
                  <div className="space-y-2">
                     <Label>Recipe Name</Label>
                     <Input 
                        placeholder="e.g. Keto Lasagna" 
                        value={recipeName}
                        onChange={(e) => setRecipeName(e.target.value)}
                     />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                     <div className="space-y-2">
                        <Label>Meal Type</Label>
                        <Select value={mealType} onValueChange={setMealType}>
                           <SelectTrigger>
                              <SelectValue />
                           </SelectTrigger>
                           <SelectContent>
                              {['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Sweets'].map(t => (
                                 <SelectItem key={t} value={t}>{t}</SelectItem>
                              ))}
                           </SelectContent>
                        </Select>
                     </div>
                     <div className="space-y-2">
                        <Label>Cuisine</Label>
                        <Select value={cuisineType} onValueChange={setCuisineType}>
                           <SelectTrigger>
                              <SelectValue />
                           </SelectTrigger>
                           <SelectContent>
                              {['American', 'Italian', 'Mexican', 'Asian', 'French', 'Mediterranean', 'Other'].map(t => (
                                 <SelectItem key={t} value={t}>{t}</SelectItem>
                              ))}
                           </SelectContent>
                        </Select>
                     </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-2">
                         <Label>Time (min)</Label>
                         <div className="relative">
                            <Clock className="absolute left-2 top-2.5 w-4 h-4 text-slate-400" />
                            <Input 
                               type="number" 
                               className="pl-8" 
                               value={prepTime}
                               onChange={(e) => setPrepTime(e.target.value)} 
                            />
                         </div>
                      </div>
                      <div className="space-y-2">
                         <Label>Servings</Label>
                         <div className="relative">
                            <Utensils className="absolute left-2 top-2.5 w-4 h-4 text-slate-400" />
                            <Input 
                               type="number" 
                               className="pl-8" 
                               value={servings}
                               onChange={(e) => setServings(e.target.value)} 
                            />
                         </div>
                      </div>
                  </div>
                  
                  <div className="space-y-2">
                      <Label>Difficulty</Label>
                      <Select value={difficulty} onValueChange={setDifficulty}>
                           <SelectTrigger>
                              <SelectValue />
                           </SelectTrigger>
                           <SelectContent>
                              {['Easy', 'Medium', 'Hard', 'Expert'].map(t => (
                                 <SelectItem key={t} value={t}>{t}</SelectItem>
                              ))}
                           </SelectContent>
                        </Select>
                  </div>
               </CardContent>
            </Card>

            <Card className="border-slate-200 dark:border-slate-800">
               <CardHeader className="pb-3">
                  <CardTitle className="text-sm uppercase tracking-wider font-bold text-slate-500 flex items-center gap-2">
                     <Flame className="w-4 h-4" /> Macros (per serving)
                  </CardTitle>
               </CardHeader>
               <CardContent className="space-y-4">
                  <div className="space-y-2">
                     <Label>Calories</Label>
                     <Input 
                        type="number" 
                        value={calories}
                        onChange={(e) => setCalories(e.target.value)}
                     />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                     <div className="space-y-2">
                        <Label className="text-xs">Protein (g)</Label>
                        <Input 
                           type="number" 
                           value={protein}
                           onChange={(e) => setProtein(e.target.value)}
                           className="text-cyan-600 font-bold"
                        />
                     </div>
                     <div className="space-y-2">
                        <Label className="text-xs">Fat (g)</Label>
                        <Input 
                           type="number" 
                           value={fat}
                           onChange={(e) => setFat(e.target.value)}
                        />
                     </div>
                     <div className="space-y-2">
                        <Label className="text-xs">Net Carbs</Label>
                        <Input 
                           type="number" 
                           value={carbs}
                           onChange={(e) => setCarbs(e.target.value)}
                        />
                     </div>
                  </div>
               </CardContent>
            </Card>
            
            <Card className="border-slate-200 dark:border-slate-800">
               <CardHeader className="pb-3">
                  <CardTitle className="text-sm uppercase tracking-wider font-bold text-slate-500">Image</CardTitle>
               </CardHeader>
               <CardContent>
                  <input
                    type="file"
                    id="image-upload"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading}
                  />
                  
                  {!imagePath ? (
                    <label 
                      htmlFor="image-upload"
                      className={`
                        flex flex-col items-center justify-center w-full h-40 
                        border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg 
                        cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors
                        ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
                      `}
                    >
                      {uploading ? (
                         <div className="flex flex-col items-center">
                            <Loader2 className="w-8 h-8 text-cyan-500 animate-spin mb-2" />
                            <span className="text-xs text-slate-500">Uploading...</span>
                         </div>
                      ) : (
                         <>
                           <Upload className="w-8 h-8 text-slate-400 mb-2" />
                           <span className="text-xs text-slate-500 font-medium">Click to upload image</span>
                           <span className="text-[10px] text-slate-400 mt-1">Max 5MB</span>
                         </>
                      )}
                    </label>
                  ) : (
                    <div className="relative w-full h-48 rounded-lg overflow-hidden group border border-slate-200 dark:border-slate-700">
                       <img 
                         src={getPreviewUrl(imagePath)} 
                         alt="Recipe Preview" 
                         className="w-full h-full object-cover"
                         onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c"; }}
                       />
                       <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <label 
                             htmlFor="image-upload"
                             className="p-2 bg-white/90 rounded-full hover:bg-white cursor-pointer text-slate-700"
                             title="Change Image"
                          >
                             <Upload className="w-4 h-4" />
                          </label>
                          <button
                             onClick={clearImage}
                             className="p-2 bg-white/90 rounded-full hover:bg-red-50 text-red-600"
                             title="Remove Image"
                          >
                             <X className="w-4 h-4" />
                          </button>
                       </div>
                    </div>
                  )}
               </CardContent>
            </Card>
         </div>

         {/* Right Column: Ingredients & Instructions */}
         <div className="md:col-span-2 space-y-6">
            <Card className="border-slate-200 dark:border-slate-800">
               <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm uppercase tracking-wider font-bold text-slate-500">Ingredients</CardTitle>
                  <Button variant="ghost" size="sm" onClick={addIngredient} className="h-8 text-cyan-600">
                     <Plus className="w-4 h-4 mr-1" /> Add Item
                  </Button>
               </CardHeader>
               <CardContent className="space-y-2">
                  {ingredients.map((ing, i) => (
                     <div key={i} className="flex gap-2 items-start group">
                        <Input 
                           placeholder="Item Name" 
                           className="flex-grow"
                           value={ing.name}
                           onChange={(e) => handleIngredientChange(i, 'name', e.target.value)}
                        />
                        <Input 
                           placeholder="Qty" 
                           className="w-20"
                           value={ing.qty}
                           onChange={(e) => handleIngredientChange(i, 'qty', e.target.value)}
                        />
                        <Input 
                           placeholder="Unit" 
                           className="w-24"
                           value={ing.unit}
                           onChange={(e) => handleIngredientChange(i, 'unit', e.target.value)}
                        />
                        <Button 
                           variant="ghost" 
                           size="icon" 
                           onClick={() => removeIngredient(i)}
                           className="text-slate-300 hover:text-red-500"
                        >
                           <Trash2 className="w-4 h-4" />
                        </Button>
                     </div>
                  ))}
               </CardContent>
            </Card>

            <Card className="border-slate-200 dark:border-slate-800">
               <CardHeader className="pb-3 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm uppercase tracking-wider font-bold text-slate-500">Instructions</CardTitle>
                  <Button variant="ghost" size="sm" onClick={addInstruction} className="h-8 text-cyan-600">
                     <Plus className="w-4 h-4 mr-1" /> Add Step
                  </Button>
               </CardHeader>
               <CardContent className="space-y-2">
                  {instructions.map((inst, i) => (
                     <div key={i} className="flex gap-2 items-start">
                        <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-500 flex-shrink-0 mt-1">
                           {i + 1}
                        </div>
                        <Textarea 
                           placeholder={`Step ${i + 1} details...`}
                           className="flex-grow resize-y min-h-[80px]"
                           value={inst}
                           onChange={(e) => handleInstructionChange(i, e.target.value)}
                        />
                        <Button 
                           variant="ghost" 
                           size="icon" 
                           onClick={() => removeInstruction(i)}
                           className="text-slate-300 hover:text-red-500 mt-1"
                        >
                           <Trash2 className="w-4 h-4" />
                        </Button>
                     </div>
                  ))}
               </CardContent>
            </Card>
         </div>
      </div>
    </div>
  );
}