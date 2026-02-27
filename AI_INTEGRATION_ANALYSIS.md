
# AI Model Response Format Analysis

## 1. Expected Response Format
The application strictly expects **JSON** responses from AI models.

### `generate-recipe` Edge Function
*   **Provider:** OpenAI (`gpt-4-turbo-preview`)
*   **Constraint:** `response_format: { type: "json_object" }` is explicitly set in the API call.
*   **Prompt Instruction:** "Return ONLY valid JSON with this structure..."

### Expected JSON Structure (Recipe Generation)
