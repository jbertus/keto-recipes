
import { corsHeaders } from "./cors.ts";

const FORBIDDEN_INGREDIENTS = [
  "sugar", "brown sugar", "cane sugar", "powdered sugar", 
  "honey", "maple syrup", "agave", "corn syrup", 
  "molasses", "glucose syrup", "rice syrup"
];

// Approximate net carbs per 100g for risk assessment
const HIGH_CARB_RISK_MAP = {
  "peanut butter": 20,
  "cashew": 30,
  "flour": 70,
  "wheat": 70,
  "oat": 60,
  "banana": 23,
  "apple": 14,
  "date": 75,
  "chocolate": 50,
  "milk": 5, 
  "yogurt": 5
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const requestData = await req.json();
    const { 
      ingredients: requestedIngredients, 
      mealType, 
      macros, 
      maxCost, 
      flexibility,
      sweetenersContext,
      specialInstructions,
      test 
    } = requestData;

    console.log("[Generate-Recipe] Incoming Request:", JSON.stringify({
      ingredients: requestedIngredients,
      mealType,
      macros,
      sweetenersContext: sweetenersContext ? "Present" : "None",
      specialInstructions,
      testMode: test
    }));

    // --- TEST MODE ---
    if (test) {
       console.log("[Generate-Recipe] Running in TEST MODE");
       const testResponse = {
         success: true,
         recipes: [
           {
             recipe_name: "TEST: Chocolate PB Cups",
             description: "A test recipe for debugging.",
             meal_type: "Sweets",
             prep_time: "10 mins",
             difficulty: "Easy",
             servings_per_batch: 4,
             calories: 150,
             macros: { protein: 5, fat: 12, carbs: 4 },
             ingredients: ["Sugar-free chocolate", "Peanut butter", "Stevia"],
             instructions: ["Melt chocolate", "Add PB", "Freeze"],
             estimated_cost: 5,
             match_score: 100,
             allergens: ["Peanuts", "Dairy"],
             modifications: {
                was_modified: true,
                reasoning: "Test modification reasoning",
                changes_made: "Reduced PB to fit macros"
             }
           }
         ]
       };
       return new Response(JSON.stringify(testResponse), { 
         headers: { ...corsHeaders, "Content-Type": "application/json" } 
       });
    }

    const aiKey = Deno.env.get("AI");
    if (!aiKey) {
      console.error("[Generate-Recipe] AI key missing");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Server configuration error: AI key missing",
          step: "config_check" 
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- Task 2: Validation Logic / Pre-analysis ---
    let ingredientRiskNote = "";
    let estimatedTotalRiskCarbs = 0;
    const riskyIngredientsFound = [];

    if (requestedIngredients && Array.isArray(requestedIngredients)) {
        requestedIngredients.forEach((ing) => {
        const lowerIng = ing.toLowerCase();
        for (const [key, val] of Object.entries(HIGH_CARB_RISK_MAP)) {
            if (lowerIng.includes(key) && !lowerIng.includes("sugar free") && !lowerIng.includes("keto")) {
            estimatedTotalRiskCarbs += val; 
            riskyIngredientsFound.push(ing);
            break; 
            }
        }
        });
    }

    if (estimatedTotalRiskCarbs > (macros.carbs * 0.7)) {
       console.log(`[Generate-Recipe] Risk Detected. High carb ingredients: ${riskyIngredientsFound.join(", ")}`);
       ingredientRiskNote = `
       CRITICAL INGREDIENT CONFLICT: The user requested high-carb ingredients (${riskyIngredientsFound.join(", ")}) but has a strict limit of ${macros.carbs}g net carbs.
       
       ACTION REQUIRED:
       1. Analyze ingredient compatibility with the carb limit.
       2. AGGRESSIVELY REDUCE quantities of these high-carb ingredients (e.g., "Use 1 tbsp peanut butter instead of 1/4 cup").
       3. SUGGEST ALTERNATIVES if reduction isn't enough (e.g., "Swap peanut butter for almond butter" or "Use pecans instead of cashews").
       4. You MUST still generate a valid recipe, but explicit modifications are required to fit the macros.
       `;
    }

    // --- Prepare Prompt ---
    let sweetenerPromptPart = "";
    if (sweetenersContext && Array.isArray(sweetenersContext)) {
      console.log("[Generate-Recipe] Adding sweetener context to prompt");
      sweetenerPromptPart = `
CRITICAL SWEETENER INSTRUCTIONS:
This is a low-carb request. You MUST use one of the following sweeteners instead of sugar:
${sweetenersContext.map((s) => `- ${s.name} (${s.netCarbsPer100g}g net carbs)`).join('\n')}
NEVER use: sugar, honey, maple syrup, agave, dates, or bananas for sweetness.
      `;
    }

    const systemPrompt = `You are an expert keto chef and nutritionist.
    
    CORE RULES:
    1. STRICTLY adhere to macro limits.
    2. Net Carbs limit is ${macros.carbs}g per serving. THIS IS A HARD LIMIT.
    3. Protein target: ${macros.protein}g (approx).
    4. Fat target: ${macros.fat}g (approx).
    
    ${sweetenerPromptPart}
    
    ${specialInstructions || ""}
    
    ${ingredientRiskNote}

    If you modify ingredients to fit the carb limit, explicitly document it in the 'modifications' object.

    Return ONLY valid JSON with this structure:
    {
      "recipes": [
        {
          "recipe_name": "string",
          "description": "string",
          "meal_type": "${mealType}",
          "prep_time": "string",
          "difficulty": "Easy|Medium|Hard",
          "servings_per_batch": number,
          "calories": number,
          "macros": {
            "protein": number,
            "fat": number,
            "carbs": number
          },
          "ingredients": ["string (e.g. '1 cup Almond Flour')"],
          "instructions": ["string (e.g. 'Mix dry ingredients')"],
          "estimated_cost": number,
          "match_score": number,
          "allergens": ["string"],
          "modifications": {
             "was_modified": boolean,
             "reasoning": "string (Explain why changes were needed)",
             "changes_made": "string (Describe the swap or reduction)"
          }
        }
      ]
    }`;

    // Helper to check forbidden
    const checkForbiddenIngredients = (ingredients) => {
      const lowerIngredients = ingredients.map(i => i.toLowerCase());
      return FORBIDDEN_INGREDIENTS.filter(forbidden => 
        lowerIngredients.some(i => i.includes(forbidden) && !i.includes("sugar free") && !i.includes("sugar-free"))
      );
    };

    let attempts = 0;
    const maxAttempts = 3;
    let lastError = "";

    while (attempts < maxAttempts) {
      attempts++;
      console.log(`[Generate-Recipe] Attempt ${attempts}/${maxAttempts}`);

      let currentPrompt = `Create 2 distinctive ${mealType} keto recipes using: ${requestedIngredients.join(", ")}. 
      Max carbs: ${macros.carbs}g.`;
      
      if (lastError) {
        currentPrompt += `\n\nPREVIOUS ERROR (FIX THIS): ${lastError}`;
      }

      console.log("[Generate-Recipe] Sending Prompt to OpenAI...");

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${aiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4-turbo-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: currentPrompt },
          ],
          temperature: 0.7,
          response_format: { type: "json_object" } 
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Generate-Recipe] OpenAI API error: ${errorText}`);
        throw new Error(`OpenAI API error: ${errorText}`);
      }

      const data = await response.json();
      const content = data.choices[0].message.content;
      
      console.log("[Generate-Recipe] Raw AI Content:", content);

      let parsedData;
      try {
        parsedData = JSON.parse(content);
      } catch (e) {
        console.warn("[Generate-Recipe] JSON Parse Failed. Attempting Regex Extraction.");
        
        // FIX: Regex to extract JSON object properly
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        
        if (jsonMatch) {
            try {
                parsedData = JSON.parse(jsonMatch[0]);
                console.log("[Generate-Recipe] Regex Extraction Success.");
            } catch (innerE) {
                console.error("[Generate-Recipe] Regex Extraction Parse Failed:", innerE);
                lastError = "Invalid JSON format returned.";
                continue;
            }
        } else {
            console.error("[Generate-Recipe] No JSON found in response.");
            lastError = "No JSON object found in response.";
            continue;
        }
      }

      const recipes = parsedData.recipes || [];
      if (recipes.length === 0) {
        console.warn("[Generate-Recipe] Validation: No recipes array found.");
        lastError = "No recipes returned in JSON.";
        continue;
      }

      // VALIDATION STEP
      let isValid = true;
      let validationErrorMsg = "";

      for (const recipe of recipes) {
        // Validate required fields
        if (!recipe.recipe_name || !recipe.ingredients || !recipe.macros || !recipe.instructions) {
             isValid = false;
             validationErrorMsg += "Recipe missing required fields (name, ingredients, macros, instructions). ";
             break;
        }

        // 1. Check Carbs
        if (recipe.macros.carbs > macros.carbs + 2) { 
          isValid = false;
          validationErrorMsg += `Recipe '${recipe.recipe_name}' has ${recipe.macros.carbs}g carbs which exceeds limit of ${macros.carbs}g. REDUCE INGREDIENTS FURTHER. `;
        }

        // 2. Check Forbidden Ingredients (only for low carb requests)
        if (macros.carbs <= 25) {
          const forbiddenFound = checkForbiddenIngredients(recipe.ingredients);
          if (forbiddenFound.length > 0) {
            isValid = false;
            validationErrorMsg += `Recipe '${recipe.recipe_name}' uses forbidden high-carb ingredients: ${forbiddenFound.join(", ")}. REPLACE with low-carb sweeteners. `;
          }
        }
      }

      if (isValid) {
        console.log("[Generate-Recipe] Validation passed. Returning recipes.");
        return new Response(
          JSON.stringify({ success: true, recipes }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } else {
        console.warn(`[Generate-Recipe] Validation failed on attempt ${attempts}: ${validationErrorMsg}`);
        lastError = validationErrorMsg + " REGENERATE COMPLIANT RECIPES WITH MODIFICATIONS/SUBSTITUTIONS.";
      }
    }

    return new Response(
      JSON.stringify({ 
          success: false, 
          error: "Failed to generate compliant recipes", 
          details: `Max attempts reached. Last error: ${lastError}`,
          step: "validation_loop"
      }),
      { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[Generate-Recipe] Fatal Error:", error.message);
    return new Response(
      JSON.stringify({ 
          success: false, 
          error: "Internal Server Error", 
          details: error.message,
          step: "fatal_catch"
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
