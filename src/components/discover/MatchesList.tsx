"use client";

import { motion } from "framer-motion";
import type { Match } from "@/lib/api";
import { timeAgo } from "@/lib/time";
import { HeartIcon, LockIcon, PinIcon } from "../icons";
import Chip from "./Chip";
import ProfilePhoto from "./ProfilePhoto";

export default function MatchesList({ matches, onDiscover }: { matches: Match[]; onDiscover: () => void }) {
  return (
    <div className="h-full overflow-y-auto px-5 pb-6">
      <div className="mt-1 flex items-start gap-3 rounded-2xl border-2 border-ink bg-mint p-3.5">
        <LockIcon size={20} className="mt-0.5 shrink-0" />
        <p className="text-[14px] leading-snug">
          <span className="font-bold">Only mutual likes show up here.</span> Nobody finds out you liked them
          unless they liked you too.
        </p>
      </div>

      {matches.length === 0 ? (
        <div className="flex flex-col items-center px-4 pt-14 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full border-2 border-ink bg-pink-soft text-pink-deep shadow-brut">
            <HeartIcon size={36} />
          </div>
          <h2 className="mt-5 text-2xl font-extrabold tracking-tight">No matches yet</h2>
          <p className="mt-2 max-w-[280px] text-[15px] text-muted">
            Keep swiping. When someone you like likes you back, they&apos;ll show up here.
          </p>
          <button
            type="button"
            onClick={onDiscover}
            className="btn-brut mt-6 rounded-full bg-pink px-6 py-3 text-[16px] font-bold"
          >
            Start swiping
          </button>
        </div>
      ) : (
        <ul className="mt-4 flex flex-col gap-3.5">
          {matches.map((m, i) => (
            <motion.li
              key={m.profile.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i, 8) * 0.04 }}
              className="flex gap-3.5 rounded-2xl border-2 border-ink bg-white p-3 shadow-brut"
            >
              <div className="relative h-[84px] w-[84px] shrink-0 overflow-hidden rounded-xl border-2 border-ink">
                <ProfilePhoto
                  src={m.profile.photo}
                  name={m.profile.name}
                  sizes="84px"
                  className="h-full w-full"
                  initialClassName="text-3xl"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="truncate text-[19px] font-extrabold tracking-tight">
                    {m.profile.name}, <span className="font-semibold">{m.profile.age}</span>
                  </h3>
                  <span className="shrink-0 text-[12px] font-semibold text-muted">{timeAgo(m.matchedAt)}</span>
                </div>
                <p className="mt-0.5 flex items-center gap-1 truncate text-[13px] text-muted">
                  <PinIcon size={13} className="shrink-0" />
                  {m.profile.location}
                </p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {m.profile.interests.slice(0, 3).map((t, idx) => (
                    <Chip key={t} label={t} index={idx} />
                  ))}
                </div>
              </div>
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  );
}
