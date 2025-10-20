import { createClient } from "@/lib/supabase/server"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { recipeId } = await request.json()

    if (!recipeId) {
      return NextResponse.json({ error: "Recipe ID is required" }, { status: 400 })
    }

    // Fetch recipe ingredients
    const { data: recipeIngredients, error: fetchError } = await supabase
      .from("recipe_ingredients")
      .select("*")
      .eq("recipe_id", recipeId)

    if (fetchError || !recipeIngredients) {
      return NextResponse.json({ error: "Failed to fetch recipe ingredients" }, { status: 500 })
    }

    // Fetch user's grocery items
    const { data: groceryItems, error: groceryError } = await supabase
      .from("grocery_items")
      .select("*")
      .eq("user_id", user.id)

    if (groceryError) {
      return NextResponse.json({ error: "Failed to fetch grocery items" }, { status: 500 })
    }

    // Check availability and deduct
    const updates = []
    const deletes = []

    for (const ingredient of recipeIngredients) {
      const stockItem = groceryItems?.find(
        (item) => item.name.toLowerCase() === ingredient.ingredient_name.toLowerCase(),
      )

      if (!stockItem || stockItem.quantity < ingredient.quantity) {
        return NextResponse.json(
          {
            error: `Insufficient ${ingredient.ingredient_name}. Required: ${ingredient.quantity} ${ingredient.unit}, Available: ${stockItem?.quantity || 0} ${stockItem?.unit || ""}`,
          },
          { status: 400 },
        )
      }

      const newQuantity = stockItem.quantity - ingredient.quantity

      if (newQuantity <= 0) {
        deletes.push(stockItem.id)
      } else {
        updates.push({
          id: stockItem.id,
          quantity: newQuantity,
        })
      }
    }

    // Perform updates
    for (const update of updates) {
      await supabase
        .from("grocery_items")
        .update({
          quantity: update.quantity,
          updated_at: new Date().toISOString(),
        })
        .eq("id", update.id)
    }

    // Perform deletes
    for (const id of deletes) {
      await supabase.from("grocery_items").delete().eq("id", id)
    }

    // Create meal plan entry
    await supabase.from("meal_plans").insert({
      user_id: user.id,
      recipe_id: recipeId,
      planned_date: new Date().toISOString(),
      status: "completed",
    })

    return NextResponse.json({ success: true, message: "Inventory updated successfully" })
  } catch (error) {
    console.error("Error deducting inventory:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
