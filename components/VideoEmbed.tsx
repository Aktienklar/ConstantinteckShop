import type { Recipe } from "@/lib/types";

const platformLabel: Record<string, string> = {
  youtube: "YouTube",
  tiktok: "TikTok",
  instagram: "Instagram Reel",
};

/**
 * Shows the embedded video. As long as no `videoUrl` is set in
 * lib/recipes.ts, a placeholder box with the same aspect ratio appears –
 * so the layout does not jump once real embeds are added.
 */
export default function VideoEmbed({ recipe }: { recipe: Recipe }) {
  const label = recipe.videoPlatform
    ? platformLabel[recipe.videoPlatform]
    : "Video";

  if (!recipe.videoUrl) {
    return (
      <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-crust bg-dough text-center">
        <span className="grid h-14 w-14 place-items-center rounded-full bg-white shadow-card">
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="currentColor"
            className="ml-1 text-brand"
            aria-hidden
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        </span>
        <p className="px-6 text-sm font-medium text-mocha">
          Placeholder for the {label} embed
        </p>
      </div>
    );
  }

  return (
    <div className="aspect-video w-full overflow-hidden rounded-2xl bg-cocoa">
      <iframe
        src={recipe.videoUrl}
        title={`${recipe.title} – video`}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        loading="lazy"
        className="h-full w-full"
      />
    </div>
  );
}
