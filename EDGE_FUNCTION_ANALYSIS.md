
# Analysis of `generate-recipe` Edge Function

**Date:** 2026-01-25
**Target Function:** `supabase/functions/generate-recipe/index.ts`

## 1. Executive Summary & Model Identification
**Critical Finding:** The `generate-recipe` function is **NOT using Claude AI**.
The code explicitly calls the OpenAI API using the **`gpt-4-turbo-preview`** model.

*   **Endpoint:** `https://api.openai.com/v1/chat/completions`
*   **Model:** `gpt-4-turbo-preview`
*   **Parameters:**
    *   `temperature`: 0.7
    *   `response_format`: `{ type: "json_object" }`

## 2. Variables Passed to the AI Prompt
The following variables are extracted from the request payload and injected into the prompt context:

| Variable Name | Type | Injected Into | Description |
| :--- | :--- | :--- | :--- |
| `macros.carbs` | Number | System & User Prompts | **Hard Limit** for net carbs (e.g., "20"). Used for validation logic as well. |
| `macros.protein` | Number | System Prompt | Approximate protein target. |
| `macros.fat` | Number | System Prompt | Approximate fat target. |
| `mealType` | String | System & User Prompts | Defines the category (e.g., "Breakfast", "Sweets"). Also injected into the JSON schema definition. |
| `ingredients` | Array | User Prompt | List of requested ingredients (e.g., "Chicken, Broccoli"). |
| `specialInstructions` | String | System Prompt | Optional user custom instructions (e.g., "No dairy"). |
| `sweetenersContext` | Array | System Prompt (Conditional) | List of allowed sweeteners if passed. |
| `ingredientRiskNote` | String | System Prompt (Conditional) | *Calculated internally*. A warning block injected if high-carb ingredients (like "peanut butter") are requested. |
| `lastError` | String | User Prompt (Conditional) | *Calculated internally*. Used during retry loops if the previous attempt failed validation. |

*Note: Variables like `maxCost` and `flexibility` are read from the request but **NOT** passed to the AI prompt text directly in the current version. `flexibility` is only used to set internal validation thresholds.*

## 3. Dynamic vs. Hardcoded Values
*   **Structure:** The prompt structure is **hardcoded** as a template string.
*   **Values:** Key constraints (macros, ingredients) are **dynamically interpolated**.
*   **JSON Schema:** The expected JSON structure is **hardcoded** into the System Prompt, but the `meal_type` value inside the schema example is dynamic.

## 4. Complete Prompt Structure

### System Message (System Role)
