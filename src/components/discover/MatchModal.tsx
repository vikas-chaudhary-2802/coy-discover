"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef } from "react";
import type { Match } from "@/lib/api";
import { ChatIcon, HeartIcon } from "../icons";
import ProfilePhoto from "./ProfilePhoto";

const FLOATING_HEARTS = [
  { left: "8%", delay: 0, size: 22 },
  { left: "22%", delay: 0.25, size: 16 },
  { left: "72%", delay: 0.1, size: 20 },
  { left: "86%", delay: 0.35, size: 14 },
  { left: "50%", delay: 0.5, size: 18 },
];

export default function MatchModal({
  match,
  onClose,
  onViewMatches,
}: {
  match: Match | null;
  onClose: () => void;
  onViewMatches: () => void;
}) {
  const primary = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!match) return;
    primary.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [match, onClose]);

  return (
    <AnimatePresence>
      {match && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/45 p-5 backdrop-blur-[2px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="match-title"
            className="relative w-full max-w-[360px] overflow-hidden rounded-[28px] border-2 border-ink bg-pink px-6 pt-8 pb-6 text-center shadow-brut-lg"
            initial={{ scale: 0.6, rotate: -8, y: 40 }}
            animate={{ scale: 1, rotate: -2, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: "spring", stiffness: 380, damping: 22 }}
            onClick={(e) => e.stopPropagation()}
          >
            {FLOATING_HEARTS.map((h, i) => (
              <motion.span
                key={i}
                className="pointer-events-none absolute bottom-0 z-0 text-white/60"
                style={{ left: h.left }}
                initial={{ y: 0, opacity: 0 }}
                animate={{ y: -260, opacity: [0, 1, 0] }}
                transition={{ duration: 2.4, delay: h.delay, repeat: Infinity, repeatDelay: 0.6 }}
              >
                <HeartIcon size={h.size} filled />
              </motion.span>
            ))}

            <div className="relative z-10 flex items-center justify-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-ink bg-peach text-2xl font-extrabold">
                You
              </div>
              <motion.div
                className="z-10 -mx-4 flex h-12 w-12 items-center justify-center rounded-full border-2 border-ink bg-white text-pink-deep"
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.35, 1] }}
                transition={{ delay: 0.25, duration: 0.5 }}
              >
                <HeartIcon size={24} filled />
              </motion.div>
              <div className="relative h-24 w-24 overflow-hidden rounded-full border-2 border-ink bg-sky">
                <ProfilePhoto
                  src={match.profile.photo}
                  name={match.profile.name}
                  sizes="96px"
                  className="h-full w-full"
                  initialClassName="text-4xl"
                />
              </div>
            </div>

            <h2 id="match-title" className="relative z-10 mt-5 text-[40px] leading-none font-extrabold tracking-tight text-ink">
              It&apos;s a match!
            </h2>
            <p className="relative z-10 mx-auto mt-3 max-w-[260px] text-[16px] leading-snug text-ink">
              You and {match.profile.name} liked each other. Only the two of you can see this.
            </p>

            <div className="relative z-10 mt-6 flex flex-col gap-3">
              <button
                ref={primary}
                type="button"
                onClick={onViewMatches}
                className="btn-brut flex h-13 items-center justify-center gap-2 rounded-full bg-whatsapp py-3 text-[17px] font-bold text-ink"
              >
                <ChatIcon size={20} />
                Say hi to {match.profile.name}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="btn-brut rounded-full bg-white py-3 text-[17px] font-bold text-ink"
              >
                Keep swiping
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
