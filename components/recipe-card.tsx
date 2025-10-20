"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Clock, Users, Save, Check } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

interface RecipeCardProps {
  recipe: {
    title: string
    description: string
    prepTime: number
    cookTime: number
    servings: number
    ingredients: Array<{ name: string; quantity: number; unit: string }>
    instructions: string[]
    matchedIngredients: string[]
  }
  userId: string
}

export function RecipeCard({ recipe, userId }: RecipeCardProps) {
  const [isSaving, setIsSaving] = useState(false)
  const [isSaved, setIsSaved] = useState(false)
  const router = useRouter()

  const saveRecipe = async () => {
    setIsSaving(true)
    const supabase = createClient()

    try {
      // Insert recipe
      const { data: recipeData, error: recipeError } = await supabase
        .from("recipes")
        .insert({
          user_id: userId,
          title: recipe.title,
          description: recipe.description,
          instructions: recipe.instructions.join("\n\n"),
          prep_time: recipe.prepTime,
          cook_time: recipe.cookTime,
          servings: recipe.servings,
        })
        .select()
        .single()

      if (recipeError) throw recipeError

      // Insert ingredients
      const ingredientsToInsert = recipe.ingredients.map((ing) => ({
        recipe_id: recipeData.id,
        ingredient_name: ing.name,
        quantity: ing.quantity,
        unit: ing.unit,
      }))

      const { error: ingredientsError } = await supabase.from("recipe_ingredients").insert(ingredientsToInsert)

      if (ingredientsError) throw ingredientsError

      setIsSaved(true)
      router.refresh()
    } catch (error) {
      console.error("Error saving recipe:", error)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl">{recipe.title}</CardTitle>
            <CardDescription className="mt-2">{recipe.description}</CardDescription>
          </div>
          <Button
            variant={isSaved ? "secondary" : "outline"}
            size="icon"
            onClick={saveRecipe}
            disabled={isSaving || isSaved}
          >
            {isSaved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
          </Button>
        </div>
        <div className="flex gap-4 mt-4">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            {recipe.prepTime + recipe.cookTime} min
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Users className="h-4 w-4" />
            {recipe.servings} servings
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-semibold mb-2">Ingredients</h4>
          <ul className="space-y-1">
            {recipe.ingredients.map((ing, idx) => (
              <li key={idx} className="text-sm flex items-start gap-2">
                <span className="text-muted-foreground">•</span>
                <span>
                  {ing.quantity} {ing.unit} {ing.name}
                  {recipe.matchedIngredients.includes(ing.name.toLowerCase()) && (
                    <Badge variant="secondary" className="ml-2 text-xs">
                      In stock
                    </Badge>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="font-semibold mb-2">Instructions</h4>
          <ol className="space-y-2">
            {recipe.instructions.map((step, idx) => (
              <li key={idx} className="text-sm flex gap-2">
                <span className="font-semibold text-primary">{idx + 1}.</span>
                <span>{step}</span>
              </li>
            ))}
          </ol>
        </div>
      </CardContent>
    </Card>
  )
}
