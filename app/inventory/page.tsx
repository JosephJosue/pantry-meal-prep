import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { InventoryList } from "@/components/inventory-list"
import { AddItemDialog } from "@/components/add-item-dialog"
import { Button } from "@/components/ui/button"
import { ChefHat, LogOut } from "lucide-react"
import Link from "next/link"

export default async function InventoryPage() {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  const { data: groceryItems } = await supabase
    .from("grocery_items")
    .select("*")
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
            <Link href="/recipes">
              <Button variant="outline">View Recipes</Button>
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
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Your Inventory</h2>
            <p className="text-muted-foreground">Manage your grocery items and track what you have</p>
          </div>
          <AddItemDialog userId={user.id} />
        </div>

        <InventoryList items={groceryItems || []} userId={user.id} />
      </main>
    </div>
  )
}
