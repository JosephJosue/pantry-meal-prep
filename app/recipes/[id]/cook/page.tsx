import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { CookRecipeForm } from "@/components/cook-recipe-form"
import { Button } from "@/components/ui/button"
import { ChefHat, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default async function CookRecipePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  // Fetch recipe with ingredients
  const { data: recipe } = await supabase
    .from("recipes")
    .select(
      `
      *,
      recipe_ingredients (*)
    `,
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .single()

  if (!recipe) {
    redirect("/recipes")
  }

  // Fetch current inventory
  const { data: groceryItems } = await supabase.from("grocery_items").select("*").eq("user_id", user.id)

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ChefHat className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Grocery Manager</h1>
          </div>
          <Link href="/recipes">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Recipes
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <CookRecipeForm recipe={recipe} groceryItems={groceryItems || []} userId={user.id} />
      </main>
    </div>
  )
}
