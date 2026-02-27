export const STANDARD_RECIPES = [
  // BREAKFAST
  {
    id: 'std-bf-1',
    recipe_name: 'Classic Bacon & Eggs',
    meal_type: 'Breakfast',
    calories_per_serving: 380,
    protein_per_serving_g: 24,
    fat_per_serving_g: 30,
    net_carbs_per_serving_g: 2,
    estimated_total_time_min: 15,
    image_url: 'https://images.unsplash.com/photo-1525351484163-7529414395d8?auto=format&fit=crop&w=800&q=80',
    ingredients_block: '2 large eggs\n3 strips bacon\n1 tbsp butter\nSalt and pepper to taste',
    prep_notes_block: '1. Cook bacon in a skillet over medium heat until crispy.\n2. Remove bacon, reserving fat in pan.\n3. Crack eggs into the skillet and cook to desired doneness.\n4. Season with salt and pepper.'
  },
  {
    id: 'std-bf-2',
    recipe_name: 'Keto Avocado Toast',
    meal_type: 'Breakfast',
    calories_per_serving: 320,
    protein_per_serving_g: 12,
    fat_per_serving_g: 28,
    net_carbs_per_serving_g: 6,
    estimated_total_time_min: 10,
    image_url: 'https://images.unsplash.com/photo-1603048588665-791ca8aea617?auto=format&fit=crop&w=800&q=80',
    ingredients_block: '1 slice keto bread\n1/2 ripe avocado\n1 tsp olive oil\nRed pepper flakes\nSea salt',
    prep_notes_block: '1. Toast the keto bread until golden.\n2. Mash avocado with olive oil and salt.\n3. Spread over toast and top with red pepper flakes.'
  },
  {
    id: 'std-bf-3',
    recipe_name: 'Creamy Chia Pudding',
    meal_type: 'Breakfast',
    calories_per_serving: 240,
    protein_per_serving_g: 8,
    fat_per_serving_g: 18,
    net_carbs_per_serving_g: 4,
    estimated_total_time_min: 5,
    image_url: 'https://images.unsplash.com/photo-1551884170-09fb70a3a2ed?auto=format&fit=crop&w=800&q=80',
    ingredients_block: '3 tbsp chia seeds\n1 cup almond milk (unsweetened)\n1/2 tsp vanilla extract\nStevia to taste',
    prep_notes_block: '1. Mix all ingredients in a jar.\n2. Stir well to prevent clumps.\n3. Refrigerate for at least 2 hours or overnight.'
  },
  {
    id: 'std-bf-4',
    recipe_name: 'Spinach & Feta Omelet',
    meal_type: 'Breakfast',
    calories_per_serving: 310,
    protein_per_serving_g: 20,
    fat_per_serving_g: 24,
    net_carbs_per_serving_g: 3,
    estimated_total_time_min: 15,
    image_url: 'https://images.unsplash.com/photo-1510693206972-df098062cb71?auto=format&fit=crop&w=800&q=80',
    ingredients_block: '3 large eggs\n1/2 cup fresh spinach\n1/4 cup feta cheese\n1 tbsp butter',
    prep_notes_block: '1. Whisk eggs in a bowl.\n2. Melt butter in pan, sauté spinach quickly.\n3. Pour in eggs, cook until set.\n4. Sprinkle feta, fold, and serve.'
  },

  // LUNCH
  {
    id: 'std-ln-1',
    recipe_name: 'Grilled Chicken Caesar Salad',
    meal_type: 'Lunch',
    calories_per_serving: 450,
    protein_per_serving_g: 45,
    fat_per_serving_g: 28,
    net_carbs_per_serving_g: 5,
    estimated_total_time_min: 20,
    image_url: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?auto=format&fit=crop&w=800&q=80',
    ingredients_block: '1 grilled chicken breast, sliced\n2 cups romaine lettuce\n2 tbsp Caesar dressing (full fat)\n1 tbsp parmesan cheese',
    prep_notes_block: '1. Chop lettuce and place in bowl.\n2. Top with warm grilled chicken.\n3. Drizzle with dressing and sprinkle parmesan.'
  },
  {
    id: 'std-ln-2',
    recipe_name: 'Tuna Salad Lettuce Wraps',
    meal_type: 'Lunch',
    calories_per_serving: 280,
    protein_per_serving_g: 25,
    fat_per_serving_g: 18,
    net_carbs_per_serving_g: 2,
    estimated_total_time_min: 10,
    image_url: 'https://images.unsplash.com/photo-1626804475297-411d6a6616ca?auto=format&fit=crop&w=800&q=80',
    ingredients_block: '1 can tuna, drained\n2 tbsp mayonnaise\n1 stalk celery, diced\n3 large lettuce leaves',
    prep_notes_block: '1. Mix tuna, mayo, and celery in a bowl.\n2. Scoop mixture into lettuce leaves.\n3. Serve cold.'
  },
  {
    id: 'std-ln-3',
    recipe_name: 'Turkey & Cheese Roll-ups',
    meal_type: 'Lunch',
    calories_per_serving: 320,
    protein_per_serving_g: 28,
    fat_per_serving_g: 22,
    net_carbs_per_serving_g: 2,
    estimated_total_time_min: 5,
    image_url: 'https://images.unsplash.com/photo-1582236873551-73602f23b72c?auto=format&fit=crop&w=800&q=80',
    ingredients_block: '4 slices deli turkey\n2 slices swiss cheese\n1 tbsp mayonnaise\n4 pickle spears',
    prep_notes_block: '1. Lay out turkey slices.\n2. Spread light mayo and add cheese.\n3. Place pickle spear and roll tightly.'
  },
  {
    id: 'std-ln-4',
    recipe_name: 'Zucchini Noodle Caprese',
    meal_type: 'Lunch',
    calories_per_serving: 290,
    protein_per_serving_g: 12,
    fat_per_serving_g: 24,
    net_carbs_per_serving_g: 6,
    estimated_total_time_min: 15,
    image_url: 'https://images.unsplash.com/photo-1526318896980-cf78c088247c?auto=format&fit=crop&w=800&q=80',
    ingredients_block: '2 cups zucchini noodles\n1/2 cup cherry tomatoes\n1/4 cup mozzarella pearls\n2 tbsp pesto',
    prep_notes_block: '1. Spiralize zucchini.\n2. Toss with pesto, tomatoes, and mozzarella.\n3. Serve fresh or lightly sautéed.'
  },

  // DINNER
  {
    id: 'std-dn-1',
    recipe_name: 'Garlic Butter Steak',
    meal_type: 'Dinner',
    calories_per_serving: 620,
    protein_per_serving_g: 48,
    fat_per_serving_g: 46,
    net_carbs_per_serving_g: 1,
    estimated_total_time_min: 25,
    image_url: 'https://images.unsplash.com/photo-1546964124-0cce460f38ef?auto=format&fit=crop&w=800&q=80',
    ingredients_block: '8oz Ribeye steak\n2 tbsp butter\n2 cloves garlic, minced\nRosemary sprig',
    prep_notes_block: '1. Sear steak in hot skillet for 3-4 mins per side.\n2. Add butter, garlic, and rosemary.\n3. Baste steak with melted butter for final minute.'
  },
  {
    id: 'std-dn-2',
    recipe_name: 'Baked Salmon with Asparagus',
    meal_type: 'Dinner',
    calories_per_serving: 480,
    protein_per_serving_g: 35,
    fat_per_serving_g: 32,
    net_carbs_per_serving_g: 4,
    estimated_total_time_min: 25,
    image_url: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=800&q=80',
    ingredients_block: '6oz Salmon fillet\n10 asparagus spears\n2 tbsp olive oil\nLemon slices',
    prep_notes_block: '1. Place salmon and asparagus on foil-lined tray.\n2. Drizzle with oil, season well.\n3. Bake at 400°F (200°C) for 12-15 minutes.'
  },
  {
    id: 'std-dn-3',
    recipe_name: 'Keto Beef Taco Bowl',
    meal_type: 'Dinner',
    calories_per_serving: 550,
    protein_per_serving_g: 32,
    fat_per_serving_g: 42,
    net_carbs_per_serving_g: 6,
    estimated_total_time_min: 20,
    image_url: 'https://images.unsplash.com/photo-1543339308-43e59d6b73a6?auto=format&fit=crop&w=800&q=80',
    ingredients_block: '1/2 lb ground beef\n2 tbsp taco seasoning (sugar-free)\n1/2 cup shredded cheddar\n1/4 cup sour cream',
    prep_notes_block: '1. Brown beef in skillet and drain fat.\n2. Add seasoning and water, simmer 2 mins.\n3. Serve in bowl topped with cheese and sour cream.'
  },
  {
    id: 'std-dn-4',
    recipe_name: 'Creamy Tuscan Chicken',
    meal_type: 'Dinner',
    calories_per_serving: 580,
    protein_per_serving_g: 42,
    fat_per_serving_g: 40,
    net_carbs_per_serving_g: 5,
    estimated_total_time_min: 30,
    image_url: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=800&q=80',
    ingredients_block: '2 chicken thighs\n1/2 cup heavy cream\n1/4 cup sun-dried tomatoes\n1 cup spinach',
    prep_notes_block: '1. Sear chicken until cooked through. Remove.\n2. Add cream and tomatoes to pan, simmer.\n3. Add spinach, return chicken, and coat with sauce.'
  },

  // SNACK
  {
    id: 'std-sn-1',
    recipe_name: 'Almonds & Cheese',
    meal_type: 'Snack',
    calories_per_serving: 220,
    protein_per_serving_g: 9,
    fat_per_serving_g: 19,
    net_carbs_per_serving_g: 3,
    estimated_total_time_min: 1,
    image_url: 'https://images.unsplash.com/photo-1615485499978-508bd5273b80?auto=format&fit=crop&w=800&q=80',
    ingredients_block: '1oz Almonds (raw or roasted)\n1 String cheese or cheddar slice',
    prep_notes_block: '1. Portion out almonds.\n2. Unwrap cheese.\n3. Enjoy!'
  },
  {
    id: 'std-sn-2',
    recipe_name: 'Hard Boiled Eggs',
    meal_type: 'Snack',
    calories_per_serving: 140,
    protein_per_serving_g: 12,
    fat_per_serving_g: 10,
    net_carbs_per_serving_g: 0.5,
    estimated_total_time_min: 12,
    image_url: 'https://images.unsplash.com/photo-1590793615474-0f317b6dc19b?auto=format&fit=crop&w=800&q=80',
    ingredients_block: '2 large eggs\nSalt\nPepper',
    prep_notes_block: '1. Boil eggs for 10-12 minutes.\n2. Cool in ice water bath.\n3. Peel and season.'
  },

  // SWEETS
  {
    id: 'std-sw-1',
    recipe_name: 'Keto Chocolate Mousse',
    meal_type: 'Sweets',
    calories_per_serving: 280,
    protein_per_serving_g: 4,
    fat_per_serving_g: 26,
    net_carbs_per_serving_g: 4,
    estimated_total_time_min: 10,
    image_url: 'https://images.unsplash.com/photo-1544957458-9477b7893af2?auto=format&fit=crop&w=800&q=80',
    ingredients_block: '1/2 cup heavy whipping cream\n1 tbsp cocoa powder (unsweetened)\n1 tbsp powdered erythritol',
    prep_notes_block: '1. Whip heavy cream until stiff peaks form.\n2. Fold in cocoa powder and sweetener gently.\n3. Chill before serving.'
  },
  {
    id: 'std-sw-2',
    recipe_name: 'Berry Cheesecake Bites',
    meal_type: 'Sweets',
    calories_per_serving: 180,
    protein_per_serving_g: 5,
    fat_per_serving_g: 16,
    net_carbs_per_serving_g: 3,
    estimated_total_time_min: 20,
    image_url: 'https://images.unsplash.com/photo-1508737027454-e6454ef45afd?auto=format&fit=crop&w=800&q=80',
    ingredients_block: '4oz Cream cheese, softened\n2 tbsp butter\n1/4 cup raspberries\nStevia drops',
    prep_notes_block: '1. Mix cream cheese, butter, and sweetener.\n2. Mash in raspberries.\n3. Freeze in silicone molds for 30 mins.'
  }
];