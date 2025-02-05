import type { RecipeResponse } from "@dishify/api/schemas/recipe-response";
import { useMemo } from "react";
import { match } from "ts-pattern";
import { cn } from "../utils";

export default function CuisineLabel({ cuisine }: { cuisine: RecipeResponse["cuisine"] }) {
  const backgroundColor = useMemo(
    () =>
      match(cuisine)
        .with("Mexican", () => "bg-red-100")
        .with("Italian", () => "bg-orange-100")
        .with("Japanese", () => "bg-yellow-100")
        .with("Chinese", () => "bg-green-100")
        .with("Indian", () => "bg-blue-100")
        .with("French", () => "bg-purple-100")
        .with("Spanish", () => "bg-pink-100")
        .with("German", () => "bg-gray-100")
        .with("American", () => "bg-red-100")
        .with("Thai", () => "bg-green-100")
        .with("Vietnamese", () => "bg-blue-100")
        .with("Brazilian", () => "bg-yellow-100")
        .with("Moroccan", () => "bg-purple-100")
        .with("Turkish", () => "bg-red-100")
        .with("Russian", () => "bg-red-100")
        .with("Korean", () => "bg-red-100")
        .with("Greek", () => "bg-yellow-100")
        .with("Dutch", () => "bg-blue-100")
        .with("Portuguese", () => "bg-pink-100")
        .with("Belgian", () => "bg-gray-100")
        .with("Swedish", () => "bg-green-100")
        .with("Norwegian", () => "bg-blue-100")
        .with("Danish", () => "bg-red-100")
        .with("Finnish", () => "bg-blue-100")
        .with("Czech", () => "bg-green-100")
        .with("Polish", () => "bg-red-100")
        .with("Hungarian", () => "bg-blue-100")
        .with("Other", () => "bg-gray-100")
        .with("Unknown", () => "bg-gray-100")
        .exhaustive(),
    [cuisine],
  );

  return (
    <span
      className={cn(
        "rounded-full px-3 py-1.5 w-fit text-xs font-medium text-foreground",
        backgroundColor,
      )}
    >
      {cuisine}
    </span>
  );
}
