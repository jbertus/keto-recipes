
# Schema Audit & Analysis

## 1. Table Schema: `personal_recipes`

**Columns:**
| Column Name | Data Type | Constraints |
| :--- | :--- | :--- |
| `id` | uuid | NOT NULL, PK |
| `user_id` | uuid | NOT NULL |
| `created_at` | timestamp with time zone | NOT NULL |
| `meal_type` | text | |
| `difficulty` | text | |
| `protein_level` | text | |
| `dish_type` | text | |
| `protein_type` | text | |
| `appliance_type` | text | |
| `default_meal_slot` | text | |
| `cuisine_type` | text | |
| `estimated_total_time_min` | integer | |
| `image_path` | text | |
| `recipe_name` | text | |
| `servings_per_batch` | numeric | |
| `calories_per_serving` | numeric | |
| `net_carbs_per_serving_g` | numeric | |
| `protein_per_serving_g` | numeric | |
| `fat_per_serving_g` | numeric | |
| `ingredients_block` | text | |
| `prep_notes_block` | text | |
| `time_bucket_10min` | text | |
| `is_high_protein_25g_plus` | boolean | |
| `ingredients_norm` | text | |
| `tags` | text[] | |
| `is_hidden` | boolean | |

**Policies:**
- `Users can manage their own personal recipes`: `ON personal_recipes FOR ALL USING ((auth.uid() = user_id))`

**Indexes:**
- (Standard Primary Key Index on `id`)

## 2. Table Schema: `recipe_notes`

**Columns:**
| Column Name | Data Type | Constraints |
| :--- | :--- | :--- |
| `id` | uuid | NOT NULL, PK |
| `user_id` | uuid | NOT NULL |
| `recipe_id` | text | NOT NULL |
| `note` | text | |
| `created_at` | timestamp with time zone | NOT NULL |

**Policies:**
- `Users can manage their own notes`: `ON recipe_notes FOR ALL USING ((auth.uid() = user_id))`

**Indexes:**
- (Standard Primary Key Index on `id`)

## 3. Example Row: `personal_recipes` (Reconstructed from Screenshot)
