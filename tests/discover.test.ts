import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { openPglite, resetDemo, type DB } from "@/server/db";
import { DiscoverError, getFeed, getMatches, recordSwipe } from "@/server/discover";
import { DEFAULT_SEED } from "@/server/seed";
import { FIXTURE } from "./fixtures";

const ME = "me";
let db: DB;

beforeEach(async () => {
  db = await openPglite("memory://", FIXTURE);
});
afterEach(async () => {
  await db.close();
});

const feedIds = async (d: DB = db) => (await getFeed(d, ME)).map((p) => p.id);
const matchIds = async (d: DB = db) => (await getMatches(d, ME)).map((m) => m.profile.id);

describe("seed data", () => {
  it("ships at least 30 complete profiles, some of which already like the user", async () => {
    const real = await openPglite("memory://");
    const feed = await getFeed(real, ME, 50);
    expect(feed.length).toBeGreaterThanOrEqual(30);
    for (const p of feed) {
      expect(p.name && p.photo && p.bio && p.location).toBeTruthy();
      expect(p.age).toBeGreaterThanOrEqual(18);
      expect(p.interests.length).toBeGreaterThan(0);
    }
    expect(DEFAULT_SEED.profiles.filter((p) => p.likedMe).length).toBeGreaterThan(0);
    await real.close();
  });
});

describe("getFeed", () => {
  it("returns every other profile in a stable order and never the user themself", async () => {
    expect(await feedIds()).toEqual(["alice", "bob", "carol", "dave"]);
  });

  it("never returns a profile the user has swiped on, whether liked or passed", async () => {
    await recordSwipe(db, ME, "alice", "pass");
    await recordSwipe(db, ME, "bob", "like");
    expect(await feedIds()).toEqual(["carol", "dave"]);
  });

  it("is empty once everything has been swiped", async () => {
    for (const id of await feedIds()) await recordSwipe(db, ME, id, "pass");
    expect(await getFeed(db, ME)).toEqual([]);
  });

  it("clamps the limit to a sane range", async () => {
    expect(await getFeed(db, ME, 2)).toHaveLength(2);
    expect(await getFeed(db, ME, 0)).toHaveLength(1);
    expect(await getFeed(db, ME, -5)).toHaveLength(1);
    expect(await getFeed(db, ME, Number.NaN)).toHaveLength(1);
  });
});

describe("recordSwipe", () => {
  it("creates a match when liking someone who already liked the user", async () => {
    const result = await recordSwipe(db, ME, "alice", "like", new Date("2026-11-17T10:00:00Z"));
    expect(result).toEqual({
      matched: true,
      match: {
        profile: expect.objectContaining({ id: "alice", name: "ALICE" }),
        matchedAt: "2026-11-17T10:00:00.000Z",
      },
    });
  });

  it("does not match on a one-sided like", async () => {
    expect(await recordSwipe(db, ME, "bob", "like")).toEqual({ matched: false });
    expect(await getMatches(db, ME)).toEqual([]);
  });

  it("does not match when passing on someone who liked the user", async () => {
    expect(await recordSwipe(db, ME, "alice", "pass")).toEqual({ matched: false });
    expect(await getMatches(db, ME)).toEqual([]);
  });

  it("matches later if the other person likes back after the user", async () => {
    await recordSwipe(db, ME, "bob", "like");
    expect((await recordSwipe(db, "bob", ME, "like")).matched).toBe(true);
    expect(await matchIds()).toEqual(["bob"]);
  });

  it("creates exactly one match when both people like each other at the same moment", async () => {
    const [mine, theirs] = await Promise.all([
      recordSwipe(db, ME, "dave", "like"),
      recordSwipe(db, "dave", ME, "like"),
    ]);
    expect([mine.matched, theirs.matched]).toContain(true);
    expect(await matchIds()).toEqual(["dave"]);
  });

  it("rejects a second swipe on the same profile and keeps the first one", async () => {
    await recordSwipe(db, ME, "alice", "pass");
    await expect(recordSwipe(db, ME, "alice", "like")).rejects.toMatchObject({ code: "ALREADY_SWIPED" });
    expect(await getMatches(db, ME)).toEqual([]); // the pass stood; no sneaky match
  });

  it("rejects unknown profiles and swiping on yourself", async () => {
    await expect(recordSwipe(db, ME, "nobody", "like")).rejects.toBeInstanceOf(DiscoverError);
    await expect(recordSwipe(db, ME, "nobody", "like")).rejects.toMatchObject({ code: "PROFILE_NOT_FOUND" });
    await expect(recordSwipe(db, ME, ME, "like")).rejects.toMatchObject({ code: "CANNOT_SWIPE_SELF" });
  });
});

describe("getMatches", () => {
  it("lists only mutual matches, newest first", async () => {
    await recordSwipe(db, ME, "alice", "like", new Date("2026-11-17T10:00:00Z"));
    await recordSwipe(db, ME, "bob", "like", new Date("2026-11-17T11:00:00Z"));
    await recordSwipe(db, ME, "carol", "like", new Date("2026-11-17T12:00:00Z"));
    expect(await matchIds()).toEqual(["carol", "alice"]);
  });
});

describe("privacy: never reveal who liked the user unless it's mutual", () => {
  it("feed items expose only public fields, nothing about likes", async () => {
    for (const p of await getFeed(db, ME)) {
      expect(Object.keys(p).sort()).toEqual(["age", "bio", "id", "interests", "location", "name", "photo"]);
    }
  });

  it("feed order does not depend on who liked the user", async () => {
    const noLikes = await openPglite("memory://", {
      ...FIXTURE,
      profiles: FIXTURE.profiles.map((p) => ({ ...p, likedMe: false })),
    });
    expect(await feedIds(noLikes)).toEqual(await feedIds());
    await noLikes.close();
  });

  it("a pass response is identical whether or not the other person liked the user", async () => {
    const onLiker = await recordSwipe(db, ME, "alice", "pass");
    const onNonLiker = await recordSwipe(db, ME, "bob", "pass");
    expect(JSON.stringify(onLiker)).toBe(JSON.stringify(onNonLiker));
  });

  it("other people's one-sided likes never show up in matches", async () => {
    expect(await getMatches(db, ME)).toEqual([]); // alice and carol liked me, but I haven't liked them
  });

  it("a stray match row without both likes is not reported", async () => {
    await db.query("INSERT INTO matches (user_a, user_b) VALUES ('bob', 'me')");
    expect(await getMatches(db, ME)).toEqual([]);
  });
});

describe("persistence", () => {
  it("swipes and matches survive closing and reopening the database", async () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "coy-"));
    try {
      const first = await openPglite(dir, FIXTURE);
      await recordSwipe(first, ME, "alice", "like");
      await recordSwipe(first, ME, "bob", "pass");
      await first.close();

      const second = await openPglite(dir, FIXTURE);
      expect(await feedIds(second)).toEqual(["carol", "dave"]);
      expect(await matchIds(second)).toEqual(["alice"]);
      await second.close();
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("resetDemo restores the seeded state", async () => {
    await recordSwipe(db, ME, "alice", "like");
    await resetDemo(db, FIXTURE);
    expect(await feedIds()).toEqual(["alice", "bob", "carol", "dave"]);
    expect(await getMatches(db, ME)).toEqual([]);
    expect((await recordSwipe(db, ME, "carol", "like")).matched).toBe(true); // seeded likes are back
  });
});
