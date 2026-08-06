import Link from "next/link";
import { formatTime, getRecipes } from "@/lib/recipes";
import { categoryMeta } from "./CategoryBadge";

/**
 * Cross-selling shop -> recipe/video.
 * Sits on the product page and leads back to the content the visitor
 * knows the product from.
 */
export default function RelatedRecipes({
  recipeSlugs,
  title = "Used in these recipes",
}: {
  recipeSlugs: string[];
  title?: string;
}) {
  const recipes = getRecipes(recipeSlugs);
  if (recipes.length === 0) return null;

  return (
    <section
      aria-labelledby="related-recipes"
      className="rounded-3xl border-2 border-crust bg-white p-5 sm:p-6"
    >
      <h2 id="related-recipes" className="font-display text-xl font-bold">
        {title}
      </h2>
      <p className="mt-1 text-sm text-mocha">
        Straight to the recipe with video, ingredients and steps.
      </p>

      <ul className="mt-4 divide-y divide-crust/60">
        {recipes.map((recipe) => {
          const meta = categoryMeta[recipe.category];
          return (
            <li key={recipe.slug}>
              <Link
                href={`/recipes/${recipe.slug}`}
                className="flex items-center gap-3 py-3 transition hover:text-brand"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={recipe.image}
                  alt=""
                  loading="lazy"
                  className="h-14 w-14 shrink-0 rounded-xl object-cover"
                />
                <span className="min-w-0 flex-1">
                  <span lang="de" className="block font-semibold leading-snug">
                    {recipe.title}
                  </span>
                  <span className="mt-0.5 flex items-center gap-2 text-sm text-mocha">
                    <meta.Icon className="h-4 w-4" />
                    {formatTime(recipe.prepTimeMinutes)}
                  </span>
                </span>
                <span aria-hidden className="text-mocha">
                  ›
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
