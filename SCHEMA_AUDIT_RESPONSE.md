
# Schema Clarification & Audit Report

## Part 1: Specific Clarifications (personal_recipes)

### 1. `estimated_cost` Field
**Answer:** The `estimated_cost` field **DOES NOT EXIST** in the `personal_recipes` table schema.
*   **Confirmation:** The schema lists `calories_per_serving`, `net_carbs_per_serving_g`, `protein_per_serving_g`, `fat_per_serving_g`, and `servings_per_batch`, but no cost-related columns.

### 2. `difficulty` Enum Values
**Answer:** The `difficulty` column is defined as generic `text` with **NO database-level Enum constraint**.
*   **Implication:** While the application likely uses specific values (e.g., 'Easy', 'Medium', 'Hard') in the UI, the database itself will accept any text string.
*   **Current Allowed Values:** Effectively any string (e.g., 'Easy', 'Hard', 'Advanced', '5/10', etc.).

### 3. `difficulty` Field Name
**Answer:** The exact field name is **`difficulty`**.

---

## Part 2: Complete Schema Audit

### 1. Table: `personal_recipes`

**Columns & Types:**
| Column Name | Data Type | Nullable | Description/Notes |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | NO | Primary Key |
| `user_id` | `uuid` | NO | Owner of the recipe |
| `created_at` | `timestamp with time zone` | NO | |
| `recipe_name` | `text` | YES | |
| `meal_type` | `text` | YES | e.g., 'Breakfast', 'Dinner' |
| `difficulty` | `text` | YES | |
| `protein_level` | `text` | YES | |
| `dish_type` | `text` | YES | |
| `protein_type` | `text` | YES | |
| `appliance_type` | `text` | YES | |
| `default_meal_slot`| `text` | YES | |
| `cuisine_type` | `text` | YES | |
| `estimated_total_time_min` | `integer` | YES | **Combined Time** (Prep + Cook) |
| `image_path` | `text` | YES | Storage path for recipe image |
| `servings_per_batch` | `numeric` | YES | |
| `calories_per_serving` | `numeric` | YES | |
| `net_carbs_per_serving_g` | `numeric` | YES | |
| `protein_per_serving_g` | `numeric` | YES | |
| `fat_per_serving_g` | `numeric` | YES | |
| `ingredients_block` | `text` | YES | Raw text blob of ingredients |
| `prep_notes_block` | `text` | YES | Raw text blob of instructions |
| `time_bucket_10min`| `text` | YES | |
| `is_high_protein_25g_plus` | `boolean` | YES | Computed flag |
| `ingredients_norm` | `text` | YES | Normalized text for searching |
| `tags` | `text[]` | YES | Array of tags |
| `is_hidden` | `boolean` | YES | Visibility flag |

**Policies (RLS):**
*   `Users can manage their own personal recipes`: `(auth.uid() = user_id)`

**Foreign Keys:**
*   None explicitly listed in the provided schema dump (though `user_id` implies a link to `auth.users`).

### 2. Table: `recipe_notes`

**Columns & Types:**
| Column Name | Data Type | Nullable | Description/Notes |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | NO | Primary Key |
| `user_id` | `uuid` | NO | Owner of the note |
| `recipe_id` | `text` | NO | **Text type**, not UUID FK |
| `note` | `text` | YES | The actual note content |
| `created_at` | `timestamp with time zone` | NO | |

**Policies (RLS):**
*   `Users can manage their own notes`: `(auth.uid() = user_id)`

### 3. Example Data (Reconstructed)

**`personal_recipes` Example:**
