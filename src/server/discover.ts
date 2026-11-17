import type { DB, Queryable } from "./db";

/**
 * Core Discover logic: feed, swipes and matches.
 *
 * Coy's core promise: you never learn that someone liked you unless you
 * like them back. Everything here is written so that nothing the client
 * receives depends on inbound likes, except a match:
 *   - Feed items carry only public profile fields, in an order that ignores likes.
 *   - A swipe response is `{ matched: false }` for every pass, and for every like
 *     that isn't mutual. A like on someone who liked you and a like on someone who
 *     didn't look exactly the same until it turns into a match.
 *   - Matches are only returned when both sides have liked each other.
 */

export type SwipeAction = "like" | "pass";

export interface PublicProfile {
  id: string;
  name: string;
  age: number;
  photo: string;
  bio: string;
  location: string;
  interests: string[];
}

export interface Match {
  profile: PublicProfile;
  matchedAt: string;
}

export type SwipeResult = { matched: false } | { matched: true; match: Match };

export type DiscoverErrorCode = "PROFILE_NOT_FOUND" | "CANNOT_SWIPE_SELF" | "ALREADY_SWIPED";

export class DiscoverError extends Error {
  constructor(
    public readonly code: DiscoverErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "DiscoverError";
  }
}

interface ProfileRow {
  id: string;
  name: string;
  age: number;
  photo: string;
  bio: string;
  location: string;
  interests: string[]; // JSONB comes back already parsed
}

/** Explicit allow-list of public columns. Never add `SELECT *` here. */
const PUBLIC_COLUMNS = "p.id, p.name, p.age, p.photo, p.bio, p.location, p.interests";

function toPublic(row: ProfileRow): PublicProfile {
  return {
    id: row.id,
    name: row.name,
    age: row.age,
    photo: row.photo,
    bio: row.bio,
    location: row.location,
    interests: row.interests,
  };
}

const iso = (d: Date | string) => new Date(d).toISOString();
const orderedPair = (a: string, b: string): [string, string] => (a < b ? [a, b] : [b, a]);

export const FEED_MAX_LIMIT = 50;

/** Profiles the user has not swiped on yet, excluding themselves. */
export async function getFeed(db: Queryable, userId: string, limit = 20): Promise<PublicProfile[]> {
  const safeLimit = Math.min(Math.max(Math.trunc(limit) || 1, 1), FEED_MAX_LIMIT);
  const rows = await db.query<ProfileRow>(
    `SELECT ${PUBLIC_COLUMNS}
       FROM profiles p
      WHERE p.id <> $1
        AND NOT EXISTS (
              SELECT 1 FROM swipes s
               WHERE s.swiper_id = $1 AND s.target_id = p.id)
      ORDER BY p.rank, p.id
      LIMIT $2`,
    [userId, safeLimit],
  );
  return rows.map(toPublic);
}

/**
 * Record a like or pass. If it's a like and the other person already liked
 * the user, create the match in the same transaction and return it.
 */
export async function recordSwipe(
  db: DB,
  userId: string,
  targetId: string,
  action: SwipeAction,
  now: Date = new Date(),
): Promise<SwipeResult> {
  if (userId === targetId) {
    throw new DiscoverError("CANNOT_SWIPE_SELF", "You can't swipe on yourself.");
  }

  return db.transaction(async (tx): Promise<SwipeResult> => {
    // Lock this pair for the rest of the transaction. Without it, if both people
    // like each other at the same instant, each transaction could miss the other's
    // uncommitted like and the match would never be created.
    const [a, b] = orderedPair(userId, targetId);
    await tx.query("SELECT pg_advisory_xact_lock(hashtext($1))", [`${a}|${b}`]);

    const [target] = await tx.query<ProfileRow>(
      `SELECT ${PUBLIC_COLUMNS} FROM profiles p WHERE p.id = $1`,
      [targetId],
    );
    if (!target) throw new DiscoverError("PROFILE_NOT_FOUND", "That profile doesn't exist.");

    const inserted = await tx.query(
      `INSERT INTO swipes (swiper_id, target_id, action, created_at)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (swiper_id, target_id) DO NOTHING
       RETURNING 1`,
      [userId, targetId, action, now],
    );
    if (inserted.length === 0) {
      throw new DiscoverError("ALREADY_SWIPED", "You've already swiped on this profile.");
    }

    if (action === "pass") return { matched: false };

    const likedBack = await tx.query(
      `SELECT 1 FROM swipes WHERE swiper_id = $1 AND target_id = $2 AND action = 'like'`,
      [targetId, userId],
    );
    if (likedBack.length === 0) return { matched: false };

    await tx.query(
      `INSERT INTO matches (user_a, user_b, created_at) VALUES ($1, $2, $3)
       ON CONFLICT (user_a, user_b) DO NOTHING`,
      [a, b, now],
    );
    return { matched: true, match: { profile: toPublic(target), matchedAt: iso(now) } };
  });
}

/** Mutual matches only, newest first. */
export async function getMatches(db: Queryable, userId: string): Promise<Match[]> {
  const rows = await db.query<ProfileRow & { matched_at: Date }>(
    `SELECT ${PUBLIC_COLUMNS}, m.created_at AS matched_at
       FROM matches m
       JOIN profiles p
         ON p.id = CASE WHEN m.user_a = $1 THEN m.user_b ELSE m.user_a END
      WHERE (m.user_a = $1 OR m.user_b = $1)
        -- defence in depth: a row only counts if both likes really exist
        AND EXISTS (SELECT 1 FROM swipes s WHERE s.swiper_id = $1
                       AND s.target_id = p.id AND s.action = 'like')
        AND EXISTS (SELECT 1 FROM swipes s WHERE s.swiper_id = p.id
                       AND s.target_id = $1 AND s.action = 'like')
      ORDER BY m.created_at DESC, p.id`,
    [userId],
  );
  return rows.map((r) => ({ profile: toPublic(r), matchedAt: iso(r.matched_at) }));
}
