import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import VideoEmbed from "@/components/VideoEmbed";
import ShareButtons from "@/components/ShareButtons";
import UsedProducts from "@/components/UsedProducts";
import RecipeCard from "@/components/RecipeCard";
import CategoryBadge, { categoryMeta } from "@/components/CategoryBadge";
import { difficultyLabel, formatTime, getRecipe, recipes } from "@/lib/recipes";

export function generateStaticParams() {
  return recipes.map((recipe) => ({ slug: recipe.slug }));
}

export function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Metadata {
  const recipe = getRecipe(params.slug);
  if (!recipe) return { title: "Recipe not found" };
  return {
    title: recipe.title,
    description: recipe.excerpt,
    openGraph: {
      title: recipe.title,
      description: recipe.excerpt,
      images: [recipe.image],
      type: "article",
    },
  };
}

export default function RecipePage({ params }: { params: { slug: string } }) {
  const recipe = getRecipe(params.slug);
  if (!recipe) notFound();

  const meta = categoryMeta[recipe.category];
  const more = recipes
    .filter((r) => r.category === recipe.category && r.slug !== recipe.slug)
    .slice(0, 3);

  return (
    <article className="container-page py-6">
      <Link
        href="/recipes"
        className="inline-flex min-h-[44px] items-center gap-1 text-sm font-semibold text-mocha hover:text-brand"
      >
        ‹ All recipes
      </Link>

      {/* Head: everything important visible without scrolling */}
      <header className="mt-1">
        <CategoryBadge category={recipe.category} size="md" />
        <h1
          lang="de"
          className="mt-3 font-display text-3xl font-bold leading-tight sm:text-4xl"
        >
          {recipe.title}
        </h1>
        <p lang="de" className="mt-3 max-w-prose text-lg text-mocha">
          {recipe.excerpt}
        </p>

        <dl className="mt-5 grid grid-cols-3 gap-2 rounded-2xl bg-white p-3 shadow-card sm:max-w-md">
          <MetaItem label="Time" value={formatTime(recipe.prepTimeMinutes)} />
          <MetaItem
            label="Servings"
            value={`${recipe.servings}`}
            className="border-x border-crust/60"
          />
          <MetaItem
            label="Effort"
            value={difficultyLabel[recipe.difficulty]}
          />
        </dl>
      </header>

      {/* Video – capped on large screens, the videos are portrait */}
      <div className="mt-6 lg:max-w-3xl">
        <VideoEmbed recipe={recipe} />
      </div>

      <div className="mt-4">
        <ShareButtons title={recipe.title} path={`/recipes/${recipe.slug}`} />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        {/* Ingredients + (desktop) product block */}
        <div className="space-y-6 lg:col-span-1">
          <section
            aria-labelledby="ingredients"
            className="rounded-3xl bg-white p-5 shadow-card"
          >
            <h2 id="ingredients" className="font-display text-xl font-bold">
              Ingredients
            </h2>
            <p className="mt-1 text-sm text-mocha">
              For {recipe.servings}{" "}
              {recipe.servings === 1 ? "serving" : "servings"}
            </p>
            <ul lang="de" className="mt-4 divide-y divide-crust/50">
              {recipe.ingredients.map((ingredient, index) => (
                <li
                  key={`${ingredient.name}-${index}`}
                  className="flex gap-3 py-2.5"
                >
                  <span className="w-20 shrink-0 font-semibold tabular-nums">
                    {ingredient.amount ?? ""}
                  </span>
                  <span>{ingredient.name}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* On large screens the shop block stays visible next to the steps */}
          <div className="hidden lg:block">
            <UsedProducts productSlugs={recipe.linkedProductSlugs} />
          </div>
        </div>

        {/* Method */}
        <section
          aria-labelledby="method"
          className="rounded-3xl bg-white p-5 shadow-card lg:col-span-2"
        >
          <h2 id="method" className="font-display text-xl font-bold">
            Method
          </h2>
          <ol lang="de" className="mt-4 space-y-5">
            {recipe.steps.map((step, index) => (
              <li key={index} className="flex gap-4">
                <span
                  aria-hidden
                  className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-bold text-white ${meta.accent}`}
                >
                  {index + 1}
                </span>
                <p className="pt-1.5 leading-relaxed">{step}</p>
              </li>
            ))}
          </ol>
        </section>
      </div>

      {/* On mobile the shop block comes after the steps */}
      <div className="mt-6 lg:hidden">
        <UsedProducts productSlugs={recipe.linkedProductSlugs} />
      </div>

      <div className="mt-8 border-t border-crust/60 pt-6">
        <ShareButtons title={recipe.title} path={`/recipes/${recipe.slug}`} />
      </div>

      {more.length > 0 && (
        <section className="mt-12">
          <h2 className="font-display text-2xl font-bold">
            More from “{meta.label}”
          </h2>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {more.map((item) => (
              <RecipeCard key={item.slug} recipe={item} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}

function MetaItem({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={`px-2 text-center ${className}`}>
      <dt className="text-xs font-semibold uppercase tracking-wide text-mocha">
        {label}
      </dt>
      <dd className="mt-0.5 text-xs font-bold leading-tight sm:text-base">
        {value}
      </dd>
    </div>
  );
}
