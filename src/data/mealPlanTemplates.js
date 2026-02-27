export const STARTER_TEMPLATES = [
  {
    id: 'beginner-keto',
    name: 'Beginner Keto',
    description: 'A simple, classic keto week focusing on whole foods and easy preparation.',
    tags: ['Low Carb', 'Beginner'],
    caloriesAvg: 1800,
    netCarbsAvg: 20,
    // Simplified structure: key is day index (0=Mon, 6=Sun), value is array of meals
    days: {
      0: {
        breakfast: [{ recipe_name: 'Bacon & Eggs', calories_per_serving: 350, net_carbs_per_serving_g: 1, protein_per_serving_g: 20, fat_per_serving_g: 28 }],
        lunch: [{ recipe_name: 'Chicken Caesar Salad (No Croutons)', calories_per_serving: 450, net_carbs_per_serving_g: 5, protein_per_serving_g: 35, fat_per_serving_g: 30 }],
        dinner: [{ recipe_name: 'Steak with Asparagus', calories_per_serving: 600, net_carbs_per_serving_g: 4, protein_per_serving_g: 50, fat_per_serving_g: 40 }]
      },
      1: {
        breakfast: [{ recipe_name: 'Keto Coffee', calories_per_serving: 200, net_carbs_per_serving_g: 1, protein_per_serving_g: 1, fat_per_serving_g: 22 }],
        lunch: [{ recipe_name: 'Leftover Steak Salad', calories_per_serving: 500, net_carbs_per_serving_g: 5, protein_per_serving_g: 40, fat_per_serving_g: 35 }],
        dinner: [{ recipe_name: 'Salmon with Butter Sauce', calories_per_serving: 550, net_carbs_per_serving_g: 2, protein_per_serving_g: 45, fat_per_serving_g: 40 }]
      }
      // Simplified for demo purposes - in production this would fill all 7 days
    }
  },
  {
    id: 'high-protein',
    name: 'High Protein / Carnivore-ish',
    description: 'Focus on maximizing protein intake for muscle building. minimal plants.',
    tags: ['Muscle', 'High Protein'],
    caloriesAvg: 2200,
    netCarbsAvg: 5,
    days: {
      0: {
        breakfast: [{ recipe_name: '4 Egg Omelette', calories_per_serving: 400, net_carbs_per_serving_g: 2, protein_per_serving_g: 28, fat_per_serving_g: 30 }],
        lunch: [{ recipe_name: 'Ground Beef Bowl', calories_per_serving: 600, net_carbs_per_serving_g: 0, protein_per_serving_g: 50, fat_per_serving_g: 45 }],
        dinner: [{ recipe_name: 'Ribeye Steak', calories_per_serving: 900, net_carbs_per_serving_g: 0, protein_per_serving_g: 80, fat_per_serving_g: 65 }]
      }
    }
  },
  {
    id: 'budget-friendly',
    name: 'Budget Keto',
    description: 'Cost-effective meals using bulk ingredients like eggs, ground beef, and frozen veggies.',
    tags: ['Budget', 'Simple'],
    caloriesAvg: 1600,
    netCarbsAvg: 25,
    days: {
      0: {
        breakfast: [{ recipe_name: 'Scrambled Eggs', calories_per_serving: 280, net_carbs_per_serving_g: 2, protein_per_serving_g: 18, fat_per_serving_g: 20 }],
        lunch: [{ recipe_name: 'Tuna Salad Lettuce Wraps', calories_per_serving: 350, net_carbs_per_serving_g: 3, protein_per_serving_g: 30, fat_per_serving_g: 25 }],
        dinner: [{ recipe_name: 'Cabbage & Sausage Skillet', calories_per_serving: 500, net_carbs_per_serving_g: 8, protein_per_serving_g: 25, fat_per_serving_g: 40 }]
      }
    }
  }
];