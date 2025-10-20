"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Clock, Users, Trash2, CookingPot } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState } from "react"

interface SavedRecipesProps {
  recipes: Array<{
    id: string
    title: string
    description?: string
    instructions: string
    prep_time?: number
    cook_time?: number
    servings: number
    recipe_ingredients: Array<{
      ingredient_name: string
      quantity: number
      unit: string
    }>
  }>
  userId: string
}

export function SavedRecipes({ recipes, userId }: SavedRecipesProps) {
  const router = useRouter()
  const [expandedRecipe, setExpandedRecipe] = useState<string | null>(null)

  const deleteRecipe = async (id: string) => {
    const supabase = createClient()
    const { error } = await supabase.from("recipes").delete().eq("id", id)

    if (!error) {
      router.refresh()
    }
  }

  const cookRecipe = async (recipeId: string) => {
    router.push(`/recipes/${recipeId}/cook`)
  }

  if (recipes.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground text-center">
            No saved recipes yet. Generate some recipe recommendations and save your favorites!
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {recipes.map((recipe) => (
        <Card key={recipe.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg">{recipe.title}</CardTitle>
                {recipe.description && (
                  <CardDescription className="mt-1 line-clamp-2">{recipe.description}</CardDescription>
                )}
              </div>
              <Button variant="ghost" size="icon" onClick={() => deleteRecipe(recipe.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
            <div className="flex gap-4 mt-2">
              {recipe.prep_time && recipe.cook_time && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {recipe.prep_time + recipe.cook_time} min
                </div>
              )}
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Users className="h-4 w-4" />
                {recipe.servings} servings
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold text-sm mb-2">Ingredients</h4>
              <div className="space-y-1">
                {recipe.recipe_ingredients.slice(0, 3).map((ing, idx) => (
                  <p key={idx} className="text-sm text-muted-foreground">
                    • {ing.quantity} {ing.unit} {ing.ingredient_name}
                  </p>
                ))}
                {recipe.recipe_ingredients.length > 3 && (
                  <p className="text-sm text-muted-foreground">
                    +{recipe.recipe_ingredients.length - 3} more ingredients
                  </p>
                )}
              </div>
            </div>
            <Button className="w-full" onClick={() => cookRecipe(recipe.id)}>
              <CookingPot className="h-4 w-4 mr-2" />
              Cook This Recipe
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
