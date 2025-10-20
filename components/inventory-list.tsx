"use client"

import type { GroceryItem } from "@/lib/types"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Trash2, Edit } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { EditItemDialog } from "./edit-item-dialog"

interface InventoryListProps {
  items: GroceryItem[]
  userId: string
}

export function InventoryList({ items, userId }: InventoryListProps) {
  const router = useRouter()
  const [editingItem, setEditingItem] = useState<GroceryItem | null>(null)

  const handleDelete = async (id: string) => {
    const supabase = createClient()
    const { error } = await supabase.from("grocery_items").delete().eq("id", id)

    if (!error) {
      router.refresh()
    }
  }

  const getCategoryColor = (category?: string) => {
    const colors: Record<string, string> = {
      vegetables: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
      fruits: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
      dairy: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
      meat: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
      grains: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
    }
    return colors[category || ""] || "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground text-center">
            No items in your inventory yet. Add your first grocery item to get started!
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => (
          <Card key={item.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{item.name}</h3>
                  <p className="text-2xl font-bold text-primary mt-1">
                    {item.quantity} {item.unit}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => setEditingItem(item)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
              {item.category && (
                <Badge className={getCategoryColor(item.category)} variant="secondary">
                  {item.category}
                </Badge>
              )}
              {item.expiry_date && (
                <p className="text-sm text-muted-foreground mt-2">
                  Expires: {new Date(item.expiry_date).toLocaleDateString()}
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {editingItem && (
        <EditItemDialog
          item={editingItem}
          userId={userId}
          open={!!editingItem}
          onOpenChange={(open) => !open && setEditingItem(null)}
        />
      )}
    </>
  )
}
