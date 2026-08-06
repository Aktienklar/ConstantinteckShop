import type { Metadata } from "next";
import { Suspense } from "react";
import RecipeExplorer from "@/components/RecipeExplorer";
import { recipesByDate } from "@/lib/recipes";

export const metadata: Metadata = {
  title: "All recipes",
  description:
    "Every recipe from the videos: sweet bakes and savoury everyday dishes. Search by ingredient, filter by time and difficulty.",
};

export default function RecipesPage() {
  return (
    <div className="container-page py-8">
      <h1 className="font-display text-3xl font-bold sm:text-4xl">
        All recipes
      </h1>
      <p className="mt-2 max-w-prose text-mocha">
        Search for a title or an ingredient – the list filters as you type.
        Recipes are written in German, the way they are in the videos.
      </p>

      <div className="mt-6">
        <Suspense fallback={<p className="text-mocha">Loading recipes …</p>}>
          <RecipeExplorer recipes={recipesByDate} />
        </Suspense>
      </div>
    </div>
  );
}
