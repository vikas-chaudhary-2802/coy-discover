"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import CoyLogo from "../CoyLogo";
import { DeckEmpty, DeckError, DeckSkeleton } from "./DeckStates";
import MatchesList from "./MatchesList";
import MatchModal from "./MatchModal";
import SwipeDeck from "./SwipeDeck";
import { useDiscover } from "./useDiscover";

type View = "swipe" | "matches";

export default function DiscoverView({ active }: { active: boolean }) {
  const [view, setView] = useState<View>("swipe");
  const d = useDiscover();

  return (
    <div className="flex h-full flex-col">
      <header className="flex h-16 shrink-0 items-center justify-between px-5">
        <CoyLogo />
        <div role="tablist" aria-label="Discover views" className="flex rounded-full border-2 border-ink bg-surface p-1">
          {(["swipe", "matches"] as const).map((v) => (
            <button
              key={v}
              role="tab"
              type="button"
              aria-selected={view === v}
              onClick={() => setView(v)}
              className={`flex h-8 items-center gap-1.5 rounded-full px-3.5 text-[14px] font-bold transition-colors ${
                view === v ? "bg-ink text-white" : "text-ink hover:bg-line"
              }`}
            >
              {v === "swipe" ? "Discover" : "Matches"}
              {v === "matches" && d.matches.length > 0 && (
                <span
                  className={`min-w-5 rounded-full px-1.5 text-center text-[12px] leading-5 ${
                    view === v ? "bg-pink text-ink" : "bg-pink text-ink"
                  }`}
                >
                  {d.matches.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </header>

      <div className="relative min-h-0 flex-1">
        {view === "matches" ? (
          <MatchesList matches={d.matches} onDiscover={() => setView("swipe")} />
        ) : d.status === "loading" ? (
          <DeckSkeleton />
        ) : d.status === "error" ? (
          <DeckError onRetry={d.retry} />
        ) : d.deck.length === 0 ? (
          <DeckEmpty matchCount={d.matches.length} onViewMatches={() => setView("matches")} onReset={d.resetDemo} />
        ) : (
          <SwipeDeck deck={d.deck} active={active && view === "swipe" && !d.newMatch} onSwipe={d.swipe} />
        )}

        <AnimatePresence>
          {d.toast && view === "swipe" && (
            <motion.div
              key={d.toast}
              role="status"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="pointer-events-none absolute inset-x-0 top-0 z-30 flex justify-center px-6"
            >
              <span className="rounded-full bg-ink px-4 py-2 text-center text-[13px] font-semibold text-white shadow-brut">
                {d.toast}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <MatchModal
        match={d.newMatch}
        onClose={d.dismissMatch}
        onViewMatches={() => {
          d.dismissMatch();
          setView("matches");
        }}
      />
    </div>
  );
}
