"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Clock, Users, CheckCircle2, AlertTriangle, CookingPot } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import type { GroceryItem } from "@/lib/types"

interface CookRecipeFormProps {
  recipe: {
    id: string
    title: string
    description?: string
    instructions: string
    prep_time?: number
    cook_time?: number
    servings: number
    recipe_ingredients: Array<{
      id: string
      ingredient_name: string
      quantity: number
      unit: string
    }>
  }
  groceryItems: GroceryItem[]
  userId: string
}

interface IngredientAvailability {
  ingredient: {
    id: string
    ingredient_name: string
    quantity: number
    unit: string
  }
  available: boolean
  currentStock?: GroceryItem
  sufficient: boolean
}

export function CookRecipeForm({ recipe, groceryItems, userId }: CookRecipeFormProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  // Check ingredient availability
  const ingredientAvailability: IngredientAvailability[] = recipe.recipe_ingredients.map((ingredient) => {
    const stockItem = groceryItems.find((item) => item.name.toLowerCase() === ingredient.ingredient_name.toLowerCase())

    return {
      ingredient,
      available: !!stockItem,
      currentStock: stockItem,
      sufficient: stockItem ? stockItem.quantity >= ingredient.quantity : false,
    }
  })

  const allIngredientsAvailable = ingredientAvailability.every((item) => item.available && item.sufficient)
  const missingIngredients = ingredientAvailability.filter((item) => !item.available || !item.sufficient)

  const handleCookRecipe = async () => {
    setIsProcessing(true)
    const supabase = createClient()

    try {
      // Deduct ingredients from inventory
      for (const item of ingredientAvailability) {
        if (item.available && item.currentStock) {
          const newQuantity = item.currentStock.quantity - item.ingredient.quantity

          if (newQuantity <= 0) {
            // Delete item if quantity reaches zero or below
            await supabase.from("grocery_items").delete().eq("id", item.currentStock.id)
          } else {
            // Update quantity
            await supabase
              .from("grocery_items")
              .update({
                quantity: newQuantity,
                updated_at: new Date().toISOString(),
              })
              .eq("id", item.currentStock.id)
          }
        }
      }

      // Create meal plan entry
      await supabase.from("meal_plans").insert({
        user_id: userId,
        recipe_id: recipe.id,
        planned_date: new Date().toISOString(),
        status: "completed",
      })

      setSuccess(true)
      setTimeout(() => {
        router.push("/inventory")
      }, 2000)
    } catch (error) {
      console.error("Error cooking recipe:", error)
    } finally {
      setIsProcessing(false)
    }
  }

  const instructions = recipe.instructions.split("\n\n").filter((step) => step.trim())

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-3xl">{recipe.title}</CardTitle>
          {recipe.description && <CardDescription className="text-base">{recipe.description}</CardDescription>}
          <div className="flex gap-4 mt-4">
            {recipe.prep_time && recipe.cook_time && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-5 w-5" />
                <span>
                  {recipe.prep_time + recipe.cook_time} min total ({recipe.prep_time} prep, {recipe.cook_time} cook)
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-5 w-5" />
              <span>{recipe.servings} servings</span>
            </div>
          </div>
        </CardHeader>
      </Card>

      {success && (
        <Alert className="bg-primary/10 border-primary">
          <CheckCircle2 className="h-4 w-4 text-primary" />
          <AlertDescription className="text-primary">
            Recipe completed! Your inventory has been updated. Redirecting...
          </AlertDescription>
        </Alert>
      )}

      {!allIngredientsAvailable && !success && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            You don't have enough of some ingredients. Missing or insufficient:{" "}
            {missingIngredients.map((item) => item.ingredient.ingredient_name).join(", ")}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Ingredients</CardTitle>
          <CardDescription>Check what you have in stock</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {ingredientAvailability.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between py-2 border-b last:border-0">
                <div className="flex-1">
                  <span className="font-medium">
                    {item.ingredient.quantity} {item.ingredient.unit} {item.ingredient.ingredient_name}
                  </span>
                  {item.currentStock && (
                    <p className="text-sm text-muted-foreground">
                      Current stock: {item.currentStock.quantity} {item.currentStock.unit}
                    </p>
                  )}
                </div>
                <div>
                  {item.available && item.sufficient ? (
                    <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Available
                    </Badge>
                  ) : item.available && !item.sufficient ? (
                    <Badge variant="destructive">Insufficient</Badge>
                  ) : (
                    <Badge variant="secondary">Not in stock</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Instructions</CardTitle>
          <CardDescription>Follow these steps to prepare your meal</CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="space-y-4">
            {instructions.map((step, idx) => (
              <li key={idx} className="flex gap-3">
                <span className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold">
                  {idx + 1}
                </span>
                <p className="flex-1 pt-1">{step}</p>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-lg mb-1">Ready to cook?</h3>
              <p className="text-sm text-muted-foreground">
                {allIngredientsAvailable
                  ? "All ingredients are available. Click to start cooking and update your inventory."
                  : "Some ingredients are missing. Add them to your inventory first."}
              </p>
            </div>
            <Button
              size="lg"
              onClick={handleCookRecipe}
              disabled={!allIngredientsAvailable || isProcessing || success}
              className="w-full sm:w-auto"
            >
              {isProcessing ? (
                "Processing..."
              ) : success ? (
                <>
                  <CheckCircle2 className="h-5 w-5 mr-2" />
                  Completed!
                </>
              ) : (
                <>
                  <CookingPot className="h-5 w-5 mr-2" />
                  Start Cooking
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
