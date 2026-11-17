"use client";

import { motion, useMotionValue, useTransform, type PanInfo } from "framer-motion";
import type { PublicProfile, SwipeAction } from "@/lib/api";
import { PinIcon } from "../icons";
import Chip from "./Chip";
import ProfilePhoto from "./ProfilePhoto";

const SWIPE_DISTANCE = 110; // px
const SWIPE_VELOCITY = 600; // px/s, so a quick flick also counts

export const cardExit = {
  exit: (dir: number) => ({
    x: dir * 640,
    y: 40,
    rotate: dir * 24,
    opacity: 0,
    transition: { duration: 0.35, ease: [0.32, 0, 0.67, 0] as const },
  }),
};

export default function SwipeCard({
  profile,
  depth,
  onSwipe,
}: {
  profile: PublicProfile;
  depth: number; // 0 = top card
  onSwipe: (action: SwipeAction) => void;
}) {
  const isTop = depth === 0;
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-260, 260], [-14, 14]);
  const likeOpacity = useTransform(x, [24, SWIPE_DISTANCE], [0, 1]);
  const passOpacity = useTransform(x, [-SWIPE_DISTANCE, -24], [1, 0]);

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x > SWIPE_DISTANCE || info.velocity.x > SWIPE_VELOCITY) onSwipe("like");
    else if (info.offset.x < -SWIPE_DISTANCE || info.velocity.x < -SWIPE_VELOCITY) onSwipe("pass");
  };

  return (
    <motion.article
      aria-label={`${profile.name}, ${profile.age}`}
      aria-hidden={!isTop}
      className="absolute inset-0 touch-pan-y select-none overflow-hidden rounded-[28px] border-2 border-ink bg-surface shadow-brut-lg will-change-transform"
      style={{ x, rotate, zIndex: 10 - depth, cursor: isTop ? "grab" : "default" }}
      initial={{ scale: 0.9, y: 30, opacity: 0 }}
      animate={{ scale: 1 - depth * 0.045, y: depth * 16, opacity: 1 }}
      transition={{ type: "spring", stiffness: 320, damping: 30 }}
      variants={cardExit}
      exit="exit"
      drag={isTop ? "x" : false}
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.9}
      onDragEnd={handleDragEnd}
      whileDrag={{ cursor: "grabbing" }}
    >
      <ProfilePhoto src={profile.photo} name={profile.name} sizes="440px" priority={depth < 2} className="absolute inset-0 h-full w-full" />

      {/* Swipe feedback stamps */}
      <motion.div
        style={{ opacity: likeOpacity }}
        className="absolute top-7 left-6 -rotate-12 rounded-2xl border-[3px] border-ink bg-pink px-4 py-1 text-3xl font-extrabold tracking-tight text-ink shadow-brut"
      >
        LIKE
      </motion.div>
      <motion.div
        style={{ opacity: passOpacity }}
        className="absolute top-7 right-6 rotate-12 rounded-2xl border-[3px] border-ink bg-white px-4 py-1 text-3xl font-extrabold tracking-tight text-ink shadow-brut"
      >
        PASS
      </motion.div>

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink via-ink/75 to-transparent px-5 pt-24 pb-5 text-white">
        <h2 className="text-[32px] leading-none font-extrabold tracking-tight">
          {profile.name}
          <span className="ml-2 font-semibold opacity-90">{profile.age}</span>
        </h2>
        <p className="mt-2 flex items-center gap-1 text-[15px] font-semibold opacity-95">
          <PinIcon size={16} />
          {profile.location}
        </p>
        <p className="mt-2 text-[15px] leading-snug opacity-95">{profile.bio}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {profile.interests.map((i, idx) => (
            <Chip key={i} label={i} index={idx + profile.name.length} />
          ))}
        </div>
      </div>
    </motion.article>
  );
}
