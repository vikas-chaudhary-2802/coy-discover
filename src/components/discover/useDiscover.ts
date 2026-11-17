"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api, ApiError, type Match, type PublicProfile, type SwipeAction } from "@/lib/api";

const PAGE_SIZE = 20;
const REFILL_BELOW = 5;

export type Status = "loading" | "ready" | "error";

interface Loaded {
  profiles: PublicProfile[];
  matches: Match[];
}

async function fetchFeedAndMatches(): Promise<Loaded | null> {
  try {
    const [profiles, matches] = await Promise.all([api.feed(PAGE_SIZE), api.matches()]);
    return { profiles, matches };
  } catch {
    return null;
  }
}

/**
 * Client state for Discover: the card deck, matches, and the "It's a match!" moment.
 * Swipes are optimistic (the card leaves at once). The server is the source of truth
 * for whether a like became a match.
 */
export function useDiscover() {
  const [status, setStatus] = useState<Status>("loading");
  const [deck, setDeck] = useState<PublicProfile[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [newMatch, setNewMatch] = useState<Match | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const swipedIds = useRef(new Set<string>()); // swiped this session; guards refill races
  const serverHasMore = useRef(true);
  const refilling = useRef(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const showToast = useCallback((message: string) => {
    clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  }, []);

  const applyLoaded = useCallback((loaded: Loaded | null) => {
    if (!loaded) return setStatus("error");
    serverHasMore.current = loaded.profiles.length === PAGE_SIZE;
    setDeck(loaded.profiles);
    setMatches(loaded.matches);
    setStatus("ready");
  }, []);

  useEffect(() => {
    fetchFeedAndMatches().then(applyLoaded);
  }, [applyLoaded]);

  const load = useCallback(() => {
    setStatus("loading");
    return fetchFeedAndMatches().then(applyLoaded);
  }, [applyLoaded]);

  const refill = useCallback(async () => {
    if (refilling.current || !serverHasMore.current) return;
    refilling.current = true;
    try {
      const fresh = await api.feed(PAGE_SIZE);
      serverHasMore.current = fresh.length === PAGE_SIZE;
      setDeck((d) => {
        const have = new Set(d.map((p) => p.id));
        return [...d, ...fresh.filter((p) => !have.has(p.id) && !swipedIds.current.has(p.id))];
      });
    } catch {
      /* the next swipe will try again */
    } finally {
      refilling.current = false;
    }
  }, []);

  useEffect(() => {
    if (status === "ready" && deck.length < REFILL_BELOW) refill();
  }, [status, deck.length, refill]);

  const swipe = useCallback(
    (profile: PublicProfile, action: SwipeAction) => {
      // A double-tap or key repeat can fire before React re-renders the next card.
      if (swipedIds.current.has(profile.id)) return;
      swipedIds.current.add(profile.id);
      setDeck((d) => d.filter((p) => p.id !== profile.id));
      navigator.vibrate?.(8);
      showToast(
        action === "like"
          ? `You liked ${profile.name}. If it's mutual, you'll both know.`
          : `Passed on ${profile.name}`,
      );

      api
        .swipe(profile.id, action)
        .then((res) => {
          if (!res.matched) return;
          setMatches((m) => [res.match, ...m.filter((x) => x.profile.id !== res.match.profile.id)]);
          setToast(null);
          setNewMatch(res.match);
        })
        .catch((err) => {
          if (err instanceof ApiError && err.code === "ALREADY_SWIPED") return; // already recorded
          swipedIds.current.delete(profile.id);
          setDeck((d) => [profile, ...d.filter((p) => p.id !== profile.id)]);
          showToast("Couldn't save that swipe. Check your connection and try again.");
        });
    },
    [showToast],
  );

  const resetDemo = useCallback(async () => {
    try {
      await api.resetDemo();
      swipedIds.current.clear();
      serverHasMore.current = true;
      await load();
    } catch {
      showToast("Couldn't reset the demo.");
    }
  }, [load, showToast]);

  return {
    status,
    deck,
    matches,
    newMatch,
    toast,
    swipe,
    retry: load,
    resetDemo,
    dismissMatch: () => setNewMatch(null),
  };
}
