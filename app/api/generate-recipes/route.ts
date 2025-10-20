import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { groceryItems, mealType = "any" } = await request.json()

    if (!groceryItems || groceryItems.length === 0) {
      return NextResponse.json({ error: "No grocery items provided" }, { status: 400 })
    }

    // Format grocery items for the AI prompt
    const ingredientsList = groceryItems.map((item: any) => `${item.name} (${item.quantity} ${item.unit})`).join(", ")

    const mealTypeContext = mealType !== "any" ? `Generate recipes specifically suitable for ${mealType}. ` : ""

    const prompt = `You are a professional chef and recipe creator. ${mealTypeContext}Based on the following available ingredients, generate 3 creative and delicious recipes that can be made using these ingredients. You can suggest additional common pantry staples if needed.

Available ingredients: ${ingredientsList}
${mealType !== "any" ? `Meal type: ${mealType}` : ""}

For each recipe, provide:
1. A creative and appetizing title
2. A brief description (1-2 sentences)
3. Prep time in minutes
4. Cook time in minutes
5. Number of servings
6. Complete list of ingredients with quantities and units
7. Step-by-step cooking instructions (5-8 steps)

Format your response as a JSON array with this structure:
[
  {
    "title": "Recipe Name",
    "description": "Brief description",
    "prepTime": 15,
    "cookTime": 30,
    "servings": 4,
    "ingredients": [
      {"name": "ingredient name", "quantity": 2, "unit": "cups"}
    ],
    "instructions": ["Step 1", "Step 2", ...],
    "matchedIngredients": ["ingredient1", "ingredient2"]
  }
]

The matchedIngredients array should contain the lowercase names of ingredients from the available list that are used in the recipe.

Return ONLY the JSON array, no additional text.`

    const { text } = await generateText({
      model: openai("gpt-4o-mini"),
      prompt,
      temperature: 0.8,
    })

    // Parse the AI response
    let recipes
    try {
      // Remove markdown code blocks if present
      const cleanedText = text
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim()
      recipes = JSON.parse(cleanedText)
    } catch (parseError) {
      console.error("Failed to parse AI response:", text)
      return NextResponse.json({ error: "Failed to parse recipe data" }, { status: 500 })
    }

    return NextResponse.json({ recipes })
  } catch (error) {
    console.error("Error generating recipes:", error)
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred"
    return NextResponse.json({ error: "Failed to generate recipes", details: errorMessage }, { status: 500 })
  }
}
