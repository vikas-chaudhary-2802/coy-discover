"use client";

import { AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import type { PublicProfile, SwipeAction } from "@/lib/api";
import { HeartIcon, XIcon } from "../icons";
import SwipeCard from "./SwipeCard";

const VISIBLE = 3;

export default function SwipeDeck({
  deck,
  active,
  onSwipe,
}: {
  deck: PublicProfile[];
  active: boolean; // only listen to the keyboard while Discover is on screen
  onSwipe: (profile: PublicProfile, action: SwipeAction) => void;
}) {
  const [exitDir, setExitDir] = useState(1);
  const top = deck[0];

  const swipeTop = (action: SwipeAction) => {
    if (!top) return;
    setExitDir(action === "like" ? 1 : -1);
    onSwipe(top, action);
  };

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && e.target.closest("input, textarea, [role=dialog]")) return;
      if (e.key === "ArrowRight") swipeTop("like");
      if (e.key === "ArrowLeft") swipeTop("pass");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const visible = deck.slice(0, VISIBLE);

  return (
    <div className="flex h-full flex-col">
      <div className="relative mx-5 mt-2 mb-6 flex-1">
        <AnimatePresence custom={exitDir} initial={false}>
          {visible
            .map((p, depth) => <SwipeCard key={p.id} profile={p} depth={depth} onSwipe={swipeTop} />)
            .reverse()}
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-center gap-6 pb-4">
        <button
          type="button"
          onClick={() => swipeTop("pass")}
          disabled={!top}
          aria-label={top ? `Pass on ${top.name}` : "Pass"}
          className="btn-brut flex h-16 w-16 items-center justify-center rounded-full bg-white text-ink hover:bg-surface"
        >
          <XIcon size={28} />
        </button>
        <button
          type="button"
          onClick={() => swipeTop("like")}
          disabled={!top}
          aria-label={top ? `Like ${top.name}` : "Like"}
          className="btn-brut flex h-[72px] w-[72px] items-center justify-center rounded-full bg-pink text-ink hover:bg-[#ff5a94]"
        >
          <HeartIcon size={32} filled />
        </button>
      </div>
      <p className="hidden pb-3 text-center text-[13px] text-muted sm:block">
        Drag the card, or use <kbd className="font-semibold text-ink">←</kbd> and{" "}
        <kbd className="font-semibold text-ink">→</kbd>
      </p>
    </div>
  );
}
