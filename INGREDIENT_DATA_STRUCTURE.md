
# Ingredient Data Structure Analysis

## Overview
Ingredients are stored in two primary formats within the application: a serialized **Text Block** format for database storage (to simplify schema) and a **JSON Object** format for frontend manipulation and template storage.

## 1. Database Storage Format (`ingredients_block`)
In the `personal_recipes` table, ingredients are stored as a single multi-line string.
**Format:** `Item Name|Quantity|Unit`
**Separator:** Newline `\n`

### Example Raw String
