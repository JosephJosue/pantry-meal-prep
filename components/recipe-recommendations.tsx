"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Sparkles, Loader2 } from "lucide-react"
import type { GroceryItem } from "@/lib/types"
import { RecipeCard } from "./recipe-card"

interface RecipeRecommendationsProps {
  groceryItems: GroceryItem[]
  userId: string
}

interface GeneratedRecipe {
  title: string
  description: string
  prepTime: number
  cookTime: number
  servings: number
  ingredients: Array<{ name: string; quantity: number; unit: string }>
  instructions: string[]
  matchedIngredients: string[]
}

export function RecipeRecommendations({ groceryItems, userId }: RecipeRecommendationsProps) {
  const [recipes, setRecipes] = useState<GeneratedRecipe[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [mealType, setMealType] = useState<string>("any")

  const generateRecipes = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/generate-recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groceryItems, mealType }),
      })

      if (!response.ok) {
        const error: any = new Error("Failed to generate recipes")
        error.response = response
        throw error
      }

      const data = await response.json()
      setRecipes(data.recipes)
    } catch (err) {
      if (err instanceof Error) {
        try {
          const errorResponse = await (err as any).response.json()
          setError(`Error: ${errorResponse.details || err.message}`)
        } catch (e) {
          setError(err.message)
        }
      } else {
        setError("An unexpected error occurred")
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (groceryItems.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground text-center mb-4">
            You need to add some grocery items to your inventory first before getting recipe recommendations.
          </p>
          <Button asChild>
            <a href="/inventory">Go to Inventory</a>
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Recipe Generator
          </CardTitle>
          <CardDescription>
            Generate personalized recipes based on your {groceryItems.length} available ingredients
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            {groceryItems.slice(0, 10).map((item) => (
              <Badge key={item.id} variant="secondary">
                {item.name}
              </Badge>
            ))}
            {groceryItems.length > 10 && <Badge variant="outline">+{groceryItems.length - 10} more</Badge>}
          </div>
          <div className="mb-4">
            <Label htmlFor="meal-type" className="mb-2 block">
              Meal Type
            </Label>
            <Select value={mealType} onValueChange={setMealType}>
              <SelectTrigger id="meal-type" className="w-full sm:w-[200px]">
                <SelectValue placeholder="Select meal type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any Meal</SelectItem>
                <SelectItem value="breakfast">Breakfast</SelectItem>
                <SelectItem value="lunch">Lunch</SelectItem>
                <SelectItem value="dinner">Dinner</SelectItem>
                <SelectItem value="snack">Snack</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={generateRecipes} disabled={isLoading} className="w-full sm:w-auto">
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating Recipes...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Recipe Ideas
              </>
            )}
          </Button>
          {error && <p className="text-sm text-destructive mt-2">{error}</p>}
        </CardContent>
      </Card>

      {recipes.length > 0 && (
        <div className="grid gap-6 md:grid-cols-2">
          {recipes.map((recipe, index) => (
            <RecipeCard key={index} recipe={recipe} userId={userId} />
          ))}
        </div>
      )}
    </div>
  )
}
