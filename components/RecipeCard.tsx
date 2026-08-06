import Link from "next/link";
import type { Recipe } from "@/lib/types";
import { difficultyLabel, formatTime } from "@/lib/recipes";
import { categoryMeta } from "./CategoryBadge";

export default function RecipeCard({ recipe }: { recipe: Recipe }) {
  const meta = categoryMeta[recipe.category];

  return (
    <Link
      href={`/recipes/${recipe.slug}`}
      className="card lift-3d group flex flex-col"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-dough">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={recipe.image}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover transition duration-500 ease-soft group-hover:scale-[1.06]"
        />
        <span
          className={`absolute left-3 top-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${meta.badge}`}
        >
          <meta.Icon className="h-3.5 w-3.5" />
          {meta.short}
        </span>
      </div>

      {/* Colour strip as a quick visual anchor for the category */}
      <div className={`h-1 w-full ${meta.accent}`} aria-hidden />

      <div className="flex flex-1 flex-col p-4">
        <h3 lang="de" className="font-display text-lg font-bold leading-snug">
          {recipe.title}
        </h3>

        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-mocha">
          <span className="inline-flex items-center gap-1">
            <ClockIcon />
            {formatTime(recipe.prepTimeMinutes)}
          </span>
          <span>{difficultyLabel[recipe.difficulty]}</span>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          {recipe.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-dough px-2.5 py-1 text-xs font-medium text-mocha"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}

function ClockIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}
