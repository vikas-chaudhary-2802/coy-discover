"use client";

import Image from "next/image";
import { useState } from "react";

const FALLBACK_BG = ["bg-peach", "bg-lavender", "bg-mint", "bg-sky", "bg-pink-soft", "bg-yellow"];

/** Profile photo with an initial-letter fallback if the image fails to load. */
export default function ProfilePhoto({
  src,
  name,
  sizes,
  priority,
  className = "",
  initialClassName = "text-7xl",
}: {
  src: string;
  name: string;
  sizes: string;
  priority?: boolean;
  className?: string;
  initialClassName?: string;
}) {
  const [failed, setFailed] = useState(!src);
  if (failed) {
    const bg = FALLBACK_BG[name.charCodeAt(0) % FALLBACK_BG.length];
    return (
      <div className={`flex items-center justify-center ${bg} ${className}`} aria-label={name} role="img">
        <span className={`font-extrabold text-ink ${initialClassName}`}>{name[0]}</span>
      </div>
    );
  }
  return (
    <Image
      src={src}
      alt={name}
      fill
      sizes={sizes}
      priority={priority}
      // Unsplash already serves a face-cropped, compressed JPEG/WebP at the right size,
      // so skip a second round of optimisation (it only adds latency to the first swipe).
      unoptimized
      draggable={false}
      onError={() => setFailed(true)}
      className={`pointer-events-none object-cover ${className}`}
    />
  );
}
