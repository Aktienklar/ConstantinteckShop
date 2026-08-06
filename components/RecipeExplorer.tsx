"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import RecipeCard from "./RecipeCard";
import { categoryMeta } from "./CategoryBadge";
import { difficultyLabel } from "@/lib/recipes";
import type { Category, Difficulty, Recipe } from "@/lib/types";

type TimeFilter = "all" | "30" | "60" | "60plus";
type CategoryFilter = Category | "all";
type DifficultyFilter = Difficulty | "all";

const timeOptions: { value: TimeFilter; label: string }[] = [
  { value: "all", label: "Any duration" },
  { value: "30", label: "≤ 30 min" },
  { value: "60", label: "≤ 60 min" },
  { value: "60plus", label: "More than 1 h" },
];

const difficultyOptions: { value: DifficultyFilter; label: string }[] = [
  { value: "all", label: "Any level" },
  { value: "einfach", label: difficultyLabel.einfach },
  { value: "mittel", label: difficultyLabel.mittel },
  { value: "anspruchsvoll", label: difficultyLabel.anspruchsvoll },
];

function matchesTime(minutes: number, filter: TimeFilter) {
  if (filter === "30") return minutes <= 30;
  if (filter === "60") return minutes <= 60;
  if (filter === "60plus") return minutes > 60;
  return true;
}

/**
 * Quick search + filters, all in client state: no page reload,
 * results update on every keystroke.
 */
export default function RecipeExplorer({ recipes }: { recipes: Recipe[] }) {
  const searchParams = useSearchParams();
  const initialCategory = searchParams.get("category");

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryFilter>(
    initialCategory === "backen" || initialCategory === "herzhaft"
      ? initialCategory
      : "all"
  );
  const [time, setTime] = useState<TimeFilter>("all");
  const [difficulty, setDifficulty] = useState<DifficultyFilter>("all");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return recipes.filter((recipe) => {
      if (category !== "all" && recipe.category !== category) return false;
      if (!matchesTime(recipe.prepTimeMinutes, time)) return false;
      if (difficulty !== "all" && recipe.difficulty !== difficulty) return false;
      if (!q) return true;

      // Search across title, ingredients and tags
      const haystack = [
        recipe.title,
        recipe.excerpt,
        ...recipe.tags,
        ...recipe.ingredients.map((i) => i.name),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [recipes, query, category, time, difficulty]);

  const filtersActive =
    query !== "" || category !== "all" || time !== "all" || difficulty !== "all";

  function reset() {
    setQuery("");
    setCategory("all");
    setTime("all");
    setDifficulty("all");
  }

  return (
    <div>
      {/* Search field – stays visible while scrolling. Rounded rather than a
          full-width band: against the textured page background a hard-edged
          strip of flat colour reads as a patch. */}
      <div className="sticky top-[104px] z-30 -mx-2 rounded-2xl bg-cream/85 px-2 py-3 shadow-[0_8px_24px_-16px_rgba(59,42,32,.5)] ring-1 ring-crust/40 backdrop-blur sm:top-16">
        <div className="relative">
          <label htmlFor="recipe-search" className="sr-only">
            Search recipes
          </label>
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-mocha">
            <SearchIcon />
          </span>
          <input
            id="recipe-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search a recipe or ingredient …"
            autoComplete="off"
            className="min-h-[52px] w-full rounded-full border-2 border-crust bg-white pl-11 pr-4 text-base placeholder:text-mocha/60 focus:border-brand"
          />
        </div>

        {/* Category switcher */}
        <div className="no-scrollbar mt-3 flex gap-2 overflow-x-auto pb-0.5">
          <FilterChip
            active={category === "all"}
            onClick={() => setCategory("all")}
            label={`All (${recipes.length})`}
          />
          {(["backen", "herzhaft"] as const).map((cat) => {
            const meta = categoryMeta[cat];
            const count = recipes.filter((r) => r.category === cat).length;
            return (
              <FilterChip
                key={cat}
                active={category === cat}
                onClick={() => setCategory(cat)}
                label={
                  <>
                    <meta.Icon className="h-4 w-4" />
                    {meta.label} ({count})
                  </>
                }
                activeClass={
                  cat === "backen"
                    ? "border-sweet bg-sweet text-white"
                    : "border-savory bg-savory text-white"
                }
              />
            );
          })}
        </div>
      </div>

      {/* Time & difficulty as selects – saves space on mobile */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Select
          label="Preparation time"
          value={time}
          onChange={(v) => setTime(v as TimeFilter)}
          options={timeOptions}
        />
        <Select
          label="Difficulty"
          value={difficulty}
          onChange={(v) => setDifficulty(v as DifficultyFilter)}
          options={difficultyOptions}
        />
        {filtersActive && (
          <button
            type="button"
            onClick={reset}
            className="chip border-transparent bg-dough text-mocha hover:bg-crust"
          >
            Reset ✕
          </button>
        )}
      </div>

      <p aria-live="polite" className="mt-4 text-sm text-mocha">
        {results.length === 1
          ? "1 recipe found"
          : `${results.length} recipes found`}
      </p>

      {results.length === 0 ? (
        <div className="mt-6 rounded-3xl border-2 border-dashed border-crust bg-white px-6 py-12 text-center">
          <p className="font-display text-xl font-bold">Nothing found</p>
          <p className="mt-2 text-mocha">
            Try a single ingredient – the recipes are German, so “Schokolade” or
            “Linsen” works better than “chocolate” or “lentils”.
          </p>
          <button type="button" onClick={reset} className="btn-secondary mt-6">
            Reset filters
          </button>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((recipe) => (
            <RecipeCard key={recipe.slug} recipe={recipe} />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  label,
  activeClass = "border-cocoa bg-cocoa text-cream",
}: {
  active: boolean;
  onClick: () => void;
  label: React.ReactNode;
  activeClass?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`chip whitespace-nowrap ${
        active ? activeClass : "border-crust bg-white text-mocha hover:border-cocoa/30"
      }`}
    >
      {label}
    </button>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="flex min-h-[44px] items-center gap-2 rounded-full border-2 border-crust bg-white px-4 text-sm">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-[40px] bg-transparent font-medium focus:outline-none"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function SearchIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden
    >
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  );
}
