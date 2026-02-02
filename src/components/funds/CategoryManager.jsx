import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, X } from "lucide-react";

const DEFAULT_CATEGORIES = [
  "Tuition/Fees",
  "Books/Supplies",
  "Housing",
  "Food",
  "Transportation",
  "Medical",
  "Technology",
  "Other"
];

export default function CategoryManager({ categories, onCategoriesChange }) {
  const [newCategory, setNewCategory] = useState("");

  const addCategory = () => {
    if (!newCategory.trim()) return;
    if (categories.includes(newCategory.trim())) {
      alert("This category already exists");
      return;
    }
    onCategoriesChange([...categories, newCategory.trim()]);
    setNewCategory("");
  };

  const removeCategory = (category) => {
    onCategoriesChange(categories.filter(c => c !== category));
  };

  const useDefaultCategories = () => {
    onCategoriesChange(DEFAULT_CATEGORIES);
  };

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="text-base">Application Categories</CardTitle>
        <CardDescription>Define categories students can select from</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {categories.length === 0 && (
          <div className="text-center py-4">
            <p className="text-sm text-slate-500 mb-3">No categories defined</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={useDefaultCategories}
            >
              Use Default Categories
            </Button>
          </div>
        )}

        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <Badge
                key={category}
                variant="outline"
                className="pl-3 pr-1 py-1 bg-indigo-50 border-indigo-200 text-indigo-700"
              >
                {category}
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-auto p-1 ml-1 hover:bg-indigo-100"
                  onClick={() => removeCategory(category)}
                >
                  <X className="w-3 h-3" />
                </Button>
              </Badge>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <Input
            placeholder="Add custom category..."
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addCategory())}
          />
          <Button
            type="button"
            onClick={addCategory}
            disabled={!newCategory.trim()}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {categories.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={useDefaultCategories}
            className="text-xs"
          >
            Reset to Default Categories
          </Button>
        )}
      </CardContent>
    </Card>
  );
}