"use client";

import { useEffect, useState } from "react";
import { site } from "@/lib/site";

export default function ShareButtons({
  title,
  path,
}: {
  title: string;
  /** e.g. "/recipes/schoko-babka" */
  path: string;
}) {
  const [copied, setCopied] = useState(false);
  // Server and first client render use the same base URL (no hydration
  // warning); after that the real origin takes over.
  const [origin, setOrigin] = useState<string>(site.url);

  useEffect(() => setOrigin(window.location.origin), []);

  const url = () => `${origin}${path}`;

  async function nativeShare() {
    const shareUrl = url();
    if (navigator.share) {
      try {
        await navigator.share({ title, url: shareUrl });
        return;
      } catch {
        // User cancelled – then simply do nothing
        return;
      }
    }
    copy();
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(url());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard not available
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm font-semibold text-mocha">Share:</span>

      <button
        type="button"
        onClick={nativeShare}
        className="chip border-crust bg-white text-cocoa hover:border-cocoa/30"
      >
        <ShareIcon /> Share
      </button>

      <a
        href={`https://wa.me/?text=${encodeURIComponent(`${title} ${url()}`)}`}
        target="_blank"
        rel="noreferrer"
        className="chip border-crust bg-white text-cocoa hover:border-cocoa/30"
      >
        WhatsApp
      </a>

      <button
        type="button"
        onClick={copy}
        className="chip border-crust bg-white text-cocoa hover:border-cocoa/30"
      >
        {copied ? "Link copied ✓" : "Copy link"}
      </button>
    </div>
  );
}

function ShareIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <path d="M16 6l-4-4-4 4" />
      <path d="M12 2v14" />
    </svg>
  );
}
