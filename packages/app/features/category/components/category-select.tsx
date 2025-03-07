import React from "react";
import {
  Select as BaseSelect,
  SelectItem,
  SelectTrigger,
  SelectContent,
  SelectValue,
} from "@dishify/ui";
import { useRouter } from "solito/navigation";
import type { Category } from "@dishify/api/schemas/category";
import { categories } from "@dishify/api/schemas/category";

interface CategorySelectProps {
  currentCategory: Category;
}

export function CategorySelect({ currentCategory }: CategorySelectProps) {
  const router = useRouter();

  const handleCategoryChange = (option: { value: string; label: string } | undefined) => {
    if (option?.value) {
      router.push(`/category/${option.value}`);
    }
  };

  const categoryOptions = categories.map((cat) => ({
    value: cat.id,
    label: cat.name,
  }));

  return (
    <BaseSelect
      value={{ value: currentCategory.id, label: currentCategory.name }}
      onValueChange={handleCategoryChange}
      className="min-w-[120px] sm:min-w-[140px] flex-grow sm:flex-grow-0"
    >
      <SelectTrigger className="h-10">
        <SelectValue placeholder="Category" />
      </SelectTrigger>
      <SelectContent>
        {categoryOptions.map((option) => (
          <SelectItem key={option.value} value={option.value} label={option.label} />
        ))}
      </SelectContent>
    </BaseSelect>
  );
}
