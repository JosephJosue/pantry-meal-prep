export interface GroceryItem {
  id: string
  user_id: string
  name: string
  quantity: number
  unit: string
  category?: string
  purchase_date?: string
  expiry_date?: string
  created_at: string
  updated_at: string
}

export interface Recipe {
  id: string
  user_id: string
  title: string
  description?: string
  instructions: string
  prep_time?: number
  cook_time?: number
  servings: number
  created_at: string
}

export interface RecipeIngredient {
  id: string
  recipe_id: string
  ingredient_name: string
  quantity: number
  unit: string
  created_at: string
}

export interface MealPlan {
  id: string
  user_id: string
  recipe_id: string
  planned_date: string
  status: "planned" | "completed" | "cancelled"
  created_at: string
}
