import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { RecipeRecommendations } from "@/components/recipe-recommendations"
import { SavedRecipes } from "@/components/saved-recipes"
import { Button } from "@/components/ui/button"
import { ChefHat, LogOut, Package } from "lucide-react"
import Link from "next/link"

export default async function RecipesPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  const { data: groceryItems } = await supabase.from("grocery_items").select("*").eq("user_id", user.id)

  const { data: savedRecipes } = await supabase
    .from("recipes")
    .select(`
      *,
      recipe_ingredients (*)
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  async function handleSignOut() {
    "use server"
    const supabase = await createClient()
    await supabase.auth.signOut()
    redirect("/auth/login")
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ChefHat className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Grocery Manager</h1>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/inventory">
              <Button variant="outline">
                <Package className="h-4 w-4 mr-2" />
                View Inventory
              </Button>
            </Link>
            <form action={handleSignOut}>
              <Button variant="ghost" size="icon">
                <LogOut className="h-5 w-5" />
              </Button>
            </form>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight mb-2">Recipe Recommendations</h2>
          <p className="text-muted-foreground">Get AI-powered recipe suggestions based on your available ingredients</p>
        </div>

        <RecipeRecommendations groceryItems={groceryItems || []} userId={user.id} />

        <div className="mt-12">
          <h2 className="text-2xl font-bold tracking-tight mb-6">Your Saved Recipes</h2>
          <SavedRecipes recipes={savedRecipes || []} userId={user.id} />
        </div>
      </main>
    </div>
  )
}
