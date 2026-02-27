import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Cpu,
  Calendar,
  Save,
  Loader2,
  Sparkles,
  Clock,
  Utensils,
  Mic,
  MicOff,
  Volume2,
  FileImage as ImageIcon,
  DollarSign,
  Search,
  ChefHat,
  ThumbsUp,
  ThumbsDown,
  Info,
  RefreshCw,
  BookmarkPlus,
  BookmarkCheck,
  ArrowRight,
  X,
} from 'lucide-react';
import { format } from 'date-fns';
import { useApiKeysContext } from '@/contexts/ApiKeysContext';

const DIET_STORAGE_KEY = 'aiRecipeGenerator.selectedDiet';
const DEFAULT_DIET = 'Keto';
const MEAL_TYPE_OPTIONS = ['Any', 'Breakfast', 'Lunch', 'Dinner', 'Snack'];
const DIET_OPTIONS = ['Keto', 'Low-Carb', 'High-Protein', 'Carnivore', 'No Diet'];
const GENERATE_CLICK_DEBOUNCE_MS = 800;
export default function AIRecipeGenerator() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { keys } = useApiKeysContext(); // Use the new API keys context
  const [mealType, setMealType] = useState('Any');
  const [diet, setDiet] = useState(() => {
    if (typeof window === 'undefined') return DEFAULT_DIET;
    const savedDiet = window.localStorage.getItem(DIET_STORAGE_KEY);
    return DIET_OPTIONS.includes(savedDiet) ? savedDiet : DEFAULT_DIET;
  });
  const isNoDiet = diet === 'No Diet';
  const [description, setDescription] = useState('');
  const [ingredients, setIngredients] = useState(['']);
  const [protein, setProtein] = useState([50]);
  const [fat, setFat] = useState([70]);
  const [carbs, setCarbs] = useState([20]);
  const [calories, setCalories] = useState([600]);

  const [loading, setLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);

  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const recognitionRef = useRef(null);
  const synthRef = useRef(null);
  const abortRef = useRef(null);
  const lastGenerateClickAtRef = useRef(0);

  const [macroSummary, setMacroSummary] = useState(null);
  const [costEstimate, setCostEstimate] = useState(null);

  const [activeTab, setActiveTab] = useState('Generate');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  const [recentRecipes, setRecentRecipes] = useState([]);
  const [recentLoading, setRecentLoading] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);

  const [savedRecipes, setSavedRecipes] = useState([]);
  const [savedLoading, setSavedLoading] = useState(false);

  const [plannerDate, setPlannerDate] = useState(() => new Date());
  const [plannerSaving, setPlannerSaving] = useState(false);

  // ----- Helpers -----
  const safeNum = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };

  const buildMacroSummary = (recipe) => {
    if (!recipe?.macros) return null;
    const m = recipe.macros;
    const proteinG = safeNum(m.protein_g ?? m.protein ?? m.proteinG);
    const fatG = safeNum(m.fat_g ?? m.fat ?? m.fatG);
    const netCarbsG = safeNum(m.net_carbs_g ?? m.netCarbs ?? m.net_carbs ?? m.netCarbsG);
    const caloriesVal = safeNum(m.calories ?? m.kcal ?? m.calories_kcal);

    return {
      protein_g: proteinG,
      fat_g: fatG,
      net_carbs_g: netCarbsG,
      calories: caloriesVal,
    };
  };

  const computeCostEstimate = (recipe) => {
    // lightweight heuristic – replace later with structured pricing if you want
    if (!recipe?.ingredients?.length) return null;
    const count = recipe.ingredients.length;
    const base = Math.max(3, Math.min(18, count * 2.25));
    return {
      estimated_total: Number(base.toFixed(2)),
      notes: 'Heuristic estimate based on ingredient count. Upgrade later with brand/size pricing tables.',
    };
  };

  const canUseVoice = () => typeof window !== 'undefined' && 'webkitSpeechRecognition' in window;

  // ----- Voice setup -----
  useEffect(() => {
    if (!canUseVoice()) return;

    const SpeechRecognition = window.webkitSpeechRecognition;
    const rec = new SpeechRecognition();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = 'en-US';

    rec.onresult = (event) => {
      const transcript = event.results?.[0]?.[0]?.transcript || '';
      if (transcript) {
        setDescription((prev) => (prev ? `${prev} ${transcript}` : transcript));
      }
      setListening(false);
    };

    rec.onerror = () => {
      setListening(false);
      toast({
        title: 'Voice input error',
        description: 'Speech recognition failed. Try again or type your prompt.',
        variant: 'destructive',
      });
    };

    rec.onend = () => setListening(false);

    recognitionRef.current = rec;

    return () => {
      recognitionRef.current = null;
    };
  }, [toast]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    synthRef.current = window.speechSynthesis;
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(DIET_STORAGE_KEY, diet);
  }, [diet]);

  useEffect(() => {
    return () => {
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }
    };
  }, []);

  const beginAbortableRequest = () => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;
    return controller;
  };

  const clearAbortableRequest = (controller) => {
    if (abortRef.current === controller) {
      abortRef.current = null;
    }
  };

  const stopGeneration = () => {
    if (!abortRef.current) return;
    abortRef.current.abort();
    abortRef.current = null;
    setIsGenerating(false);
    setLoading(false);
    setImageLoading(false);
    console.info('[AIRecipeGenerator] Active request aborted by user via Stop button.');
    toast({
      title: 'Generation stopped',
      description: 'Request canceled. No credits are deducted for aborted runs.',
    });
  };

  const startListening = () => {
    if (!recognitionRef.current) return;
    try {
      setListening(true);
      recognitionRef.current.start();
    } catch (e) {
      setListening(false);
    }
  };

  const stopListening = () => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
      setListening(false);
    } catch (e) {
      setListening(false);
    }
  };

  const speak = (text) => {
    if (!synthRef.current || !text) return;
    try {
      setSpeaking(true);
      const u = new SpeechSynthesisUtterance(text);
      u.onend = () => setSpeaking(false);
      u.onerror = () => setSpeaking(false);
      synthRef.current.cancel();
      synthRef.current.speak(u);
    } catch (e) {
      setSpeaking(false);
    }
  };

  // ----- Data loads -----
  const loadRecent = async () => {
    if (!user?.id) return;
    setRecentLoading(true);
    try {
      const { data, error } = await supabase
        .from('personal_recipes')
        .select('id, name, description, macros, ingredients, instructions, notes, cook_minutes, prep_minutes, image_url, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(12);

      if (error) throw error;
      setRecentRecipes(data || []);
    } catch (e) {
      toast({
        title: 'Failed to load recent recipes',
        description: e.message || 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setRecentLoading(false);
    }
  };

  const loadSaved = async () => {
    if (!user?.id) return;
    setSavedLoading(true);
    try {
      const { data, error } = await supabase
        .from('personal_recipes')
        .select('id, name, description, macros, ingredients, instructions, notes, cook_minutes, prep_minutes, image_url, created_at, is_saved')
        .eq('user_id', user.id)
        .eq('is_saved', true)
        .order('created_at', { ascending: false })
        .limit(24);

      if (error) throw error;
      setSavedRecipes(data || []);
    } catch (e) {
      toast({
        title: 'Failed to load saved recipes',
        description: e.message || 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setSavedLoading(false);
    }
  };

  useEffect(() => {
    loadRecent();
    loadSaved();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // ----- Core actions -----
  const addIngredientRow = () => setIngredients((prev) => [...prev, '']);
  const updateIngredientRow = (idx, val) =>
    setIngredients((prev) => prev.map((v, i) => (i === idx ? val : v)));
  const removeIngredientRow = (idx) =>
    setIngredients((prev) => prev.filter((_, i) => i !== idx));

  const cleanIngredients = (arr) => (arr || []).map((x) => (x || '').trim()).filter(Boolean);

  const buildPayload = () => {
    const cleaned = cleanIngredients(ingredients);
    return {
      mealType,
      diet,
      description: description?.trim() || '',
      ingredients: cleaned,
      macros: isNoDiet
        ? null
        : {
            protein_min_g: safeNum(protein?.[0]),
            fat_max_g: safeNum(fat?.[0]),
            net_carbs_max_g: safeNum(carbs?.[0]),
            calories_max: safeNum(calories?.[0]),
          },
      apiKeyMode: keys?.openai ? 'custom' : 'platform',
    };
  };

  const generateRecipe = async () => {
    if (!user?.id) {
      toast({ title: 'Not logged in', description: 'Please log in first.', variant: 'destructive' });
      return;
    }
    if (isGenerating || loading || imageLoading) return;
    const now = Date.now();
    if (now - lastGenerateClickAtRef.current < GENERATE_CLICK_DEBOUNCE_MS) {
      console.info('[AIRecipeGenerator] Rapid Generate click ignored (debounced).');
      return;
    }
    lastGenerateClickAtRef.current = now;
    const controller = beginAbortableRequest();
    setIsGenerating(true);

    setLoading(true);
    setResult(null);
    setImageUrl(null);
    setMacroSummary(null);
    setCostEstimate(null);

    try {
      const payload = buildPayload();

      // If you’re using a Supabase Edge Function, keep it. If not, update endpoint.
      const { data, error } = await supabase.functions.invoke('generate-recipe', {
        body: payload,
        headers: keys?.openai ? { 'x-user-openai-key': keys.openai } : undefined,
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;

      if (error) throw error;

      // Expect JSON recipe object back
      const recipe = data?.recipe || data || null;

      if (!recipe) {
        throw new Error('No recipe returned.');
      }

      setResult(recipe);
      setSelectedRecipe(recipe);
      setMacroSummary(buildMacroSummary(recipe));
      setCostEstimate(computeCostEstimate(recipe));

      if (recipe?.summary) speak(recipe.summary);

      // refresh recent
      loadRecent();
    } catch (e) {
      const isAborted =
        controller.signal.aborted ||
        e?.name === 'AbortError' ||
        String(e?.message || '').toLowerCase().includes('abort');
      if (isAborted) {
        console.info('[AIRecipeGenerator] Recipe generation aborted before completion.');
        return;
      }
      console.error('[AIRecipeGenerator] Recipe generation failed:', e);
      toast({
        title: 'Recipe generation failed',
        description: e.message || 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      clearAbortableRequest(controller);
      setIsGenerating(false);
      setLoading(false);
    }
  };

  const generateImage = async () => {
    if (!result) return;
    const controller = beginAbortableRequest();

    setImageLoading(true);
    try {
      const prompt =
        result?.image_prompt ||
        `A high-quality, realistic food photo of ${result?.name || 'a dish'}, plated, appetizing, professional lighting.`;

      const { data, error } = await supabase.functions.invoke('generate-image', {
        body: {
          prompt,
          recipeName: result?.name || '',
          userId: user?.id || null,
        },
        headers: keys?.openai ? { 'x-user-openai-key': keys.openai } : undefined,
        signal: controller.signal,
      });
      if (controller.signal.aborted) return;

      if (error) throw error;

      const url = data?.publicUrl || data?.url || null;
      if (!url) throw new Error('No image URL returned.');

      setImageUrl(url);
    } catch (e) {
      const isAborted =
        controller.signal.aborted ||
        e?.name === 'AbortError' ||
        String(e?.message || '').toLowerCase().includes('abort');
      if (isAborted) {
        console.info('[AIRecipeGenerator] Image generation aborted before completion.');
        return;
      }
      console.error('[AIRecipeGenerator] Image generation failed:', e);
      toast({
        title: 'Image generation failed',
        description: e.message || 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      clearAbortableRequest(controller);
      setImageLoading(false);
    }
  };

  const saveRecipe = async (alsoBookmark = false) => {
    if (!user?.id) return;
    if (!result) return;

    setSaving(true);
    try {
      const payload = {
        user_id: user.id,
        name: result.name || 'Untitled Recipe',
        description: result.description || '',
        ingredients: result.ingredients || [],
        instructions: result.instructions || [],
        macros: result.macros || {},
        notes: result.notes || [],
        prep_minutes: result.prep_minutes ?? null,
        cook_minutes: result.cook_minutes ?? null,
        image_url: imageUrl || null,
        is_saved: alsoBookmark ? true : false,
      };

      const { data, error } = await supabase.from('personal_recipes').insert(payload).select('id').single();
      if (error) throw error;

      toast({
        title: 'Saved',
        description: alsoBookmark ? 'Recipe saved + bookmarked.' : 'Recipe saved.',
      });

      loadRecent();
      loadSaved();

      // attach id to local result for further actions
      setResult((prev) => ({ ...(prev || {}), id: data?.id || prev?.id }));
    } catch (e) {
      toast({
        title: 'Save failed',
        description: e.message || 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleBookmark = async (recipeRow) => {
    if (!user?.id) return;
    if (!recipeRow?.id) return;

    try {
      const next = !recipeRow.is_saved;
      const { error } = await supabase.from('personal_recipes').update({ is_saved: next }).eq('id', recipeRow.id);

      if (error) throw error;

      toast({
        title: next ? 'Bookmarked' : 'Unbookmarked',
        description: next ? 'Saved to your cookbook.' : 'Removed from saved.',
      });

      loadSaved();
      loadRecent();
    } catch (e) {
      toast({
        title: 'Bookmark failed',
        description: e.message || 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  const searchRecipes = async () => {
    if (!user?.id) return;
    const q = (searchQuery || '').trim();
    if (!q) {
      setSearchResults([]);
      return;
    }

    setSearchLoading(true);
    try {
      const { data, error } = await supabase
        .from('personal_recipes')
        .select('id, name, description, macros, ingredients, instructions, notes, prep_minutes, cook_minutes, image_url, created_at, is_saved')
        .eq('user_id', user.id)
        .or(`name.ilike.%${q}%,description.ilike.%${q}%`)
        .order('created_at', { ascending: false })
        .limit(24);

      if (error) throw error;
      setSearchResults(data || []);
    } catch (e) {
      toast({
        title: 'Search failed',
        description: e.message || 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setSearchLoading(false);
    }
  };

  const addToPlanner = async () => {
    if (!user?.id) return;
    if (!result) return;

    setPlannerSaving(true);
    try {
      const dateKey = format(plannerDate, 'yyyy-MM-dd');

      const payload = {
        user_id: user.id,
        date: dateKey,
        meal_type: (mealType || 'Any').toLowerCase(),
        recipe_name: result.name || 'Untitled Recipe',
        recipe_snapshot: result,
        image_url: imageUrl || null,
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('planner_meals').insert(payload);
      if (error) throw error;

      toast({ title: 'Added to planner', description: `Added to ${format(plannerDate, 'MMM d')}` });
    } catch (e) {
      toast({
        title: 'Planner add failed',
        description: e.message || 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setPlannerSaving(false);
    }
  };

  // ----- UI helpers -----
  const Pill = ({ children }) => (
    <span className="inline-flex items-center px-2 py-1 rounded-full bg-slate-800 text-slate-200 text-xs">
      {children}
    </span>
  );

  const MacroPill = ({ label, value }) => (
    <div className="flex items-center gap-2 text-sm text-slate-200">
      <span className="text-slate-400">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );

  const isDietLocked = !isNoDiet;
  const isGenerationInProgress = loading || imageLoading;

  const filteredResults = (searchResults || []).slice(0, 24);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-950 to-slate-900">
      <Helmet>
        <title>AI Recipe Generator • Keto Contractor</title>
      </Helmet>

      {/* HEADER */}
      <div className="border-b border-slate-800 bg-slate-950/60 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <Cpu className="w-5 h-5 text-cyan-300" />
            </div>
            <div>
              <div className="text-white font-bold text-lg leading-tight">AI Recipe Generator</div>
              <div className="text-slate-400 text-xs">AI Recipe Engine • Build, Save, Plan</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              className="bg-slate-900/60 border border-slate-800 text-slate-100 hover:bg-slate-900"
              onClick={() => setVoiceEnabled((v) => !v)}
              disabled={!canUseVoice()}
              title={!canUseVoice() ? 'Voice not supported in this browser' : 'Toggle voice'}
            >
              {voiceEnabled ? <Mic className="w-4 h-4 mr-2" /> : <MicOff className="w-4 h-4 mr-2" />}
              Voice
            </Button>

            {voiceEnabled && (
              <Button
                variant="secondary"
                className="bg-slate-900/60 border border-slate-800 text-slate-100 hover:bg-slate-900"
                onClick={listening ? stopListening : startListening}
              >
                {listening ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Mic className="w-4 h-4 mr-2" />}
                {listening ? 'Listening…' : 'Speak'}
              </Button>
            )}

            <Button
              variant="secondary"
              className="bg-slate-900/60 border border-slate-800 text-slate-100 hover:bg-slate-900"
              onClick={() => speak(result?.summary || result?.description || '')}
              disabled={!result || speaking}
            >
              {speaking ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Volume2 className="w-4 h-4 mr-2" />}
              Read
            </Button>
          </div>
        </div>
      </div>

      {/* BODY */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* TABS */}
        <div className="flex flex-wrap gap-2 mb-6">
          {['Generate', 'Search', 'Recent', 'Saved'].map((t) => (
            <Button
              key={t}
              variant="secondary"
              className={
                activeTab === t
                  ? 'bg-cyan-500/20 border border-cyan-500/30 text-cyan-200 hover:bg-cyan-500/25'
                  : 'bg-slate-900/50 border border-slate-800 text-slate-200 hover:bg-slate-900'
              }
              onClick={() => setActiveTab(t)}
            >
              {t === 'Generate' && <Sparkles className="w-4 h-4 mr-2" />}
              {t === 'Search' && <Search className="w-4 h-4 mr-2" />}
              {t === 'Recent' && <Clock className="w-4 h-4 mr-2" />}
              {t === 'Saved' && <BookmarkCheck className="w-4 h-4 mr-2" />}
              {t}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* CONFIG */}
          <Card className="lg:col-span-4 bg-slate-900/40 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-cyan-400" />
                Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <div className="text-sm text-slate-300 font-medium">Meal Type</div>
                <Select value={mealType} onValueChange={setMealType}>
                  <SelectTrigger className="bg-slate-950/30 border-slate-800 text-slate-200">
                    <SelectValue placeholder="Meal Type" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-950 border-slate-800 text-slate-200">
                    {MEAL_TYPE_OPTIONS.map((m) => (
                      <SelectItem key={m} value={m}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="text-sm text-slate-300 font-medium">Diet</div>
                <Select value={diet} onValueChange={setDiet}>
                  <SelectTrigger className="bg-slate-950/30 border-slate-800 text-slate-200">
                    <SelectValue placeholder="Diet" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-950 border-slate-800 text-slate-200">
                    {DIET_OPTIONS.map((d) => (
                      <SelectItem key={d} value={d}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {isNoDiet && (
                  <div className="text-xs text-amber-300/90 flex items-start gap-2 pt-2">
                    <Info className="w-4 h-4 mt-0.5" />
                    No Diet mode = no keto substitutions or macro enforcement. It will replicate “as is.”
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <div className="text-sm text-slate-300 font-medium">Protein (min g)</div>
                <Slider value={protein} onValueChange={setProtein} max={200} step={5} />
                <div className="text-xs text-slate-400">{protein[0]}g minimum</div>
              </div>

              <div className="space-y-2">
                <div className="text-sm text-slate-300 font-medium">Fat (max g)</div>
                <Slider value={fat} onValueChange={setFat} max={250} step={5} disabled={isDietLocked ? false : true} />
                <div className="text-xs text-slate-400">{fat[0]}g maximum</div>
              </div>

              <div className="space-y-2">
                <div className="text-sm text-slate-300 font-medium">Net Carbs (max g)</div>
                <Slider value={carbs} onValueChange={setCarbs} max={150} step={1} disabled={isDietLocked ? false : true} />
                <div className="text-xs text-slate-400">{carbs[0]}g maximum</div>
              </div>

              <div className="space-y-2">
                <div className="text-sm text-slate-300 font-medium">Calories (max)</div>
                <Slider value={calories} onValueChange={setCalories} max={1500} step={25} disabled={isDietLocked ? false : true} />
                <div className="text-xs text-slate-400">{calories[0]} max</div>
              </div>

              {!isDietLocked && (
                <div className="rounded-lg border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-200">
                  In “No Diet” mode, macro sliders are informational only and won’t constrain generation.
                </div>
              )}
            </CardContent>
          </Card>

          {/* MAIN */}
          <div className="lg:col-span-8 space-y-6">
            {/* GENERATE */}
            {activeTab === 'Generate' && (
              <Card className="bg-slate-900/40 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <ChefHat className="w-5 h-5 text-cyan-400" />
                    Generate Recipe
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="space-y-2">
                    <div className="text-sm text-slate-300 font-medium">What do you want?</div>
                    <Input
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Example: ‘crawfish pepper jack soup’ or ‘chicken tacos’"
                      className="bg-slate-950/30 border-slate-800 text-slate-100 placeholder:text-slate-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-slate-300 font-medium">Ingredients (optional)</div>
                      <Button
                        variant="secondary"
                        className="bg-slate-900/60 border border-slate-800 text-slate-100 hover:bg-slate-900"
                        onClick={addIngredientRow}
                      >
                        + Add
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {ingredients.map((v, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <Input
                            value={v}
                            onChange={(e) => updateIngredientRow(idx, e.target.value)}
                            placeholder="Ingredient (ex: crawfish, pepper jack, onion)"
                            className="bg-slate-950/30 border-slate-800 text-slate-100 placeholder:text-slate-500"
                          />
                          {ingredients.length > 1 && (
                            <Button
                              variant="secondary"
                              className="bg-slate-900/60 border border-slate-800 text-slate-100 hover:bg-slate-900"
                              onClick={() => removeIngredientRow(idx)}
                              title="Remove"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Pill>
                      <Utensils className="w-3 h-3 mr-2" />
                      {mealType}
                    </Pill>
                    <Pill>
                      <Sparkles className="w-3 h-3 mr-2" />
                      {diet}
                    </Pill>
                    <Pill>
                      <DollarSign className="w-3 h-3 mr-2" />
                      Cost estimate
                    </Pill>
                    <Pill>
                      <ImageIcon className="w-3 h-3 mr-2" />
                      Image gen
                    </Pill>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold"
                      onClick={generateRecipe}
                      disabled={loading}
                    >
                      {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                      Generate
                    </Button>
                    {isGenerationInProgress && (
                      <Button
                        variant="destructive"
                        className="bg-red-600 hover:bg-red-500 text-white"
                        onClick={stopGeneration}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Stop
                      </Button>
                    )}

                    <Button
                      variant="secondary"
                      className="bg-slate-900/60 border border-slate-800 text-slate-100 hover:bg-slate-900"
                      onClick={generateImage}
                      disabled={!result || imageLoading}
                    >
                      {imageLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ImageIcon className="w-4 h-4 mr-2" />}
                      Generate Image
                    </Button>

                    <Button
                      variant="secondary"
                      className="bg-slate-900/60 border border-slate-800 text-slate-100 hover:bg-slate-900"
                      onClick={() => saveRecipe(false)}
                      disabled={!result || saving}
                    >
                      {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                      Save
                    </Button>

                    <Button
                      variant="secondary"
                      className="bg-slate-900/60 border border-slate-800 text-slate-100 hover:bg-slate-900"
                      onClick={() => saveRecipe(true)}
                      disabled={!result || saving}
                    >
                      {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <BookmarkPlus className="w-4 h-4 mr-2" />}
                      Save + Bookmark
                    </Button>

                    <Button
                      variant="secondary"
                      className="bg-slate-900/60 border border-slate-800 text-slate-100 hover:bg-slate-900"
                      onClick={addToPlanner}
                      disabled={!result || plannerSaving}
                    >
                      {plannerSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Calendar className="w-4 h-4 mr-2" />}
                      Add to Planner
                    </Button>
                  </div>

                  {(macroSummary || costEstimate) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 space-y-2">
                        <div className="text-slate-200 font-semibold flex items-center gap-2">
                          <ThumbsUp className="w-4 h-4 text-cyan-300" />
                          Macro Summary
                        </div>
                        {macroSummary ? (
                          <div className="space-y-1">
                            <MacroPill label="Protein" value={`${macroSummary.protein_g}g`} />
                            <MacroPill label="Fat" value={`${macroSummary.fat_g}g`} />
                            <MacroPill label="Net Carbs" value={`${macroSummary.net_carbs_g}g`} />
                            <MacroPill label="Calories" value={`${macroSummary.calories}`} />
                          </div>
                        ) : (
                          <div className="text-sm text-slate-400">No macros found.</div>
                        )}
                      </div>

                      <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 space-y-2">
                        <div className="text-slate-200 font-semibold flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-cyan-300" />
                          Cost Estimate
                        </div>
                        {costEstimate ? (
                          <>
                            <div className="text-white text-2xl font-bold">${costEstimate.estimated_total}</div>
                            <div className="text-xs text-slate-400">{costEstimate.notes}</div>
                          </>
                        ) : (
                          <div className="text-sm text-slate-400">No estimate yet.</div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* RESULT */}
                  {result && (
                    <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-5 space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="text-white text-xl font-bold">{result.name}</div>
                          <div className="text-slate-400 mt-1">{result.description}</div>
                        </div>
                        <Badge className="bg-cyan-500/20 text-cyan-200 border border-cyan-500/30">{diet}</Badge>
                      </div>

                      {imageUrl && (
                        <div className="overflow-hidden rounded-xl border border-slate-800">
                          <img src={imageUrl} alt={result.name} className="w-full h-64 object-cover" />
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-4">
                          <div className="text-white font-semibold mb-2">Ingredients</div>
                          <ul className="space-y-1 text-slate-200 text-sm list-disc pl-5">
                            {(result.ingredients || []).map((ing, i) => (
                              <li key={i}>{ing}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-4">
                          <div className="text-white font-semibold mb-2">Instructions</div>
                          <ol className="space-y-2 text-slate-200 text-sm list-decimal pl-5">
                            {(result.instructions || []).map((step, i) => (
                              <li key={i}>{step}</li>
                            ))}
                          </ol>
                        </div>
                      </div>

                      {(result.prep_minutes || result.cook_minutes) && (
                        <div className="flex flex-wrap gap-2">
                          {result.prep_minutes ? (
                            <Pill>
                              <Clock className="w-3 h-3 mr-2" /> Prep: {result.prep_minutes}m
                            </Pill>
                          ) : null}
                          {result.cook_minutes ? (
                            <Pill>
                              <Clock className="w-3 h-3 mr-2" /> Cook: {result.cook_minutes}m
                            </Pill>
                          ) : null}
                        </div>
                      )}

                      {(result.notes || []).length > 0 && (
                        <div className="rounded-xl border border-slate-800 bg-slate-950/30 p-4">
                          <div className="text-white font-semibold mb-2">Notes</div>
                          <ul className="space-y-1 text-slate-200 text-sm list-disc pl-5">
                            {(result.notes || []).map((n, i) => (
                              <li key={i}>{n}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* SEARCH */}
            {activeTab === 'Search' && (
              <Card className="bg-slate-900/40 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Search className="w-5 h-5 text-cyan-400" />
                    Search Your Recipes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by name or description…"
                      className="bg-slate-950/30 border-slate-800 text-slate-100 placeholder:text-slate-500"
                    />
                    <Button
                      className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold"
                      onClick={searchRecipes}
                      disabled={searchLoading}
                    >
                      {searchLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
                      Search
                    </Button>
                  </div>

                  {filteredResults.length === 0 && !searchLoading && (
                    <div className="text-slate-400 text-sm">No results.</div>
                  )}

                  {filteredResults.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {filteredResults.map((r) => (
                        <button
                          key={r.id}
                          className="text-left rounded-xl border border-slate-800 bg-slate-950/40 p-4 hover:bg-slate-950/60 transition"
                          onClick={() => {
                            const recipe = {
                              id: r.id,
                              name: r.name,
                              description: r.description,
                              prep_minutes: r.prep_minutes,
                              cook_minutes: r.cook_minutes,
                              ingredients: r.ingredients || [],
                              instructions: r.instructions || [],
                              macros: r.macros || {},
                              notes: r.notes || [],
                              image_prompt: '',
                            };
                            setResult(recipe);
                            setSelectedRecipe(recipe);
                            setImageUrl(r.image_url || null);
                            setMacroSummary(buildMacroSummary(recipe));
                            setCostEstimate(computeCostEstimate(recipe));
                          }}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="text-white font-semibold">{r.name}</div>
                            <Button
                              variant="secondary"
                              className="bg-slate-900/60 border border-slate-800 text-slate-100 hover:bg-slate-900"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                toggleBookmark(r);
                              }}
                              title={r.is_saved ? 'Unbookmark' : 'Bookmark'}
                            >
                              {r.is_saved ? <BookmarkCheck className="w-4 h-4" /> : <BookmarkPlus className="w-4 h-4" />}
                            </Button>
                          </div>
                          <div className="text-sm text-slate-400 mt-2 line-clamp-2">{r.description}</div>
                          <div className="mt-3 inline-flex items-center text-cyan-300 text-xs">
                            Open <ArrowRight className="w-3 h-3 ml-1" />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* RECENT / SAVED */}
            {activeTab === 'Recent' && (
              <Card className="bg-slate-900/40 border-slate-800">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-white flex items-center gap-2">
                    <Clock className="w-5 h-5 text-cyan-400" />
                    Recent Recipes
                  </CardTitle>
                  <Button
                    variant="secondary"
                    className="bg-slate-900/60 border border-slate-800 text-slate-100 hover:bg-slate-900"
                    onClick={loadRecent}
                    disabled={recentLoading}
                  >
                    {recentLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                    Refresh
                  </Button>
                </CardHeader>
                <CardContent>
                  {recentLoading && <div className="text-slate-400 text-sm">Loading…</div>}
                  {!recentLoading && recentRecipes.length === 0 && (
                    <div className="text-slate-400 text-sm">No recent recipes yet.</div>
                  )}

                  {recentRecipes.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {recentRecipes.map((r) => (
                        <button
                          key={r.id}
                          className="text-left rounded-xl border border-slate-800 bg-slate-950/40 p-4 hover:bg-slate-950/60 transition"
                          onClick={() => {
                            const recipe = {
                              id: r.id,
                              name: r.name,
                              description: r.description,
                              prep_minutes: r.prep_minutes,
                              cook_minutes: r.cook_minutes,
                              ingredients: r.ingredients || [],
                              instructions: r.instructions || [],
                              macros: r.macros || {},
                              notes: r.notes || [],
                              image_prompt: '',
                            };
                            setResult(recipe);
                            setSelectedRecipe(recipe);
                            setImageUrl(r.image_url || null);
                            setMacroSummary(buildMacroSummary(recipe));
                            setCostEstimate(computeCostEstimate(recipe));
                          }}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="text-white font-semibold">{r.name}</div>
                            <Button
                              variant="secondary"
                              className="bg-slate-900/60 border border-slate-800 text-slate-100 hover:bg-slate-900"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                toggleBookmark(r);
                              }}
                              title={r.is_saved ? 'Unbookmark' : 'Bookmark'}
                            >
                              {r.is_saved ? <BookmarkCheck className="w-4 h-4" /> : <BookmarkPlus className="w-4 h-4" />}
                            </Button>
                          </div>
                          <div className="text-sm text-slate-400 mt-2 line-clamp-2">{r.description}</div>
                          <div className="mt-3 inline-flex items-center text-cyan-300 text-xs">
                            Open <ArrowRight className="w-3 h-3 ml-1" />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {activeTab === 'Saved' && (
              <Card className="bg-slate-900/40 border-slate-800">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-white flex items-center gap-2">
                    <BookmarkCheck className="w-5 h-5 text-cyan-400" />
                    Saved Recipes
                  </CardTitle>
                  <Button
                    variant="secondary"
                    className="bg-slate-900/60 border border-slate-800 text-slate-100 hover:bg-slate-900"
                    onClick={loadSaved}
                    disabled={savedLoading}
                  >
                    {savedLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                    Refresh
                  </Button>
                </CardHeader>
                <CardContent>
                  {savedLoading && <div className="text-slate-400 text-sm">Loading…</div>}
                  {!savedLoading && savedRecipes.length === 0 && <div className="text-slate-400 text-sm">No saved recipes yet.</div>}

                  {savedRecipes.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {savedRecipes.map((r) => (
                        <button
                          key={r.id}
                          className="text-left rounded-xl border border-slate-800 bg-slate-950/40 p-4 hover:bg-slate-950/60 transition"
                          onClick={() => {
                            const recipe = {
                              id: r.id,
                              name: r.name,
                              description: r.description,
                              prep_minutes: r.prep_minutes,
                              cook_minutes: r.cook_minutes,
                              ingredients: r.ingredients || [],
                              instructions: r.instructions || [],
                              macros: r.macros || {},
                              notes: r.notes || [],
                              image_prompt: '',
                            };
                            setResult(recipe);
                            setSelectedRecipe(recipe);
                            setImageUrl(r.image_url || null);
                            setMacroSummary(buildMacroSummary(recipe));
                            setCostEstimate(computeCostEstimate(recipe));
                          }}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="text-white font-semibold">{r.name}</div>
                            <Button
                              variant="secondary"
                              className="bg-slate-900/60 border border-slate-800 text-slate-100 hover:bg-slate-900"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                toggleBookmark(r);
                              }}
                              title="Unbookmark"
                            >
                              <BookmarkCheck className="w-4 h-4" />
                            </Button>
                          </div>
                          <div className="text-sm text-slate-400 mt-2 line-clamp-2">{r.description}</div>
                          <div className="mt-3 inline-flex items-center text-cyan-300 text-xs">
                            Open <ArrowRight className="w-3 h-3 ml-1" />
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}