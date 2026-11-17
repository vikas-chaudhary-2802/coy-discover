import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { openDb, resetDemo, type DB } from "@/server/db";
import { DiscoverError, getFeed, getMatches, recordSwipe } from "@/server/discover";
import { DEFAULT_SEED } from "@/server/seed";
import { FIXTURE } from "./fixtures";

const ME = "me";
let db: DB;

beforeEach(() => {
  db = openDb(":memory:", FIXTURE);
});

const feedIds = () => getFeed(db, ME).map((p) => p.id);

describe("seed data", () => {
  it("ships at least 30 complete profiles, some of which already like the user", () => {
    const real = openDb(":memory:");
    const feed = getFeed(real, ME, 50);
    expect(feed.length).toBeGreaterThanOrEqual(30);
    for (const p of feed) {
      expect(p.name && p.photo && p.bio && p.location).toBeTruthy();
      expect(p.age).toBeGreaterThanOrEqual(18);
      expect(p.interests.length).toBeGreaterThan(0);
    }
    expect(DEFAULT_SEED.profiles.filter((p) => p.likedMe).length).toBeGreaterThan(0);
  });
});

describe("getFeed", () => {
  it("returns every other profile in a stable order and never the user themself", () => {
    expect(feedIds()).toEqual(["alice", "bob", "carol", "dave"]);
  });

  it("never returns a profile the user has swiped on, whether liked or passed", () => {
    recordSwipe(db, ME, "alice", "pass");
    recordSwipe(db, ME, "bob", "like");
    expect(feedIds()).toEqual(["carol", "dave"]);
  });

  it("is empty once everything has been swiped", () => {
    for (const id of feedIds()) recordSwipe(db, ME, id, "pass");
    expect(getFeed(db, ME)).toEqual([]);
  });

  it("clamps the limit to a sane range", () => {
    expect(getFeed(db, ME, 2)).toHaveLength(2);
    expect(getFeed(db, ME, 0)).toHaveLength(1);
    expect(getFeed(db, ME, -5)).toHaveLength(1);
    expect(getFeed(db, ME, Number.NaN)).toHaveLength(1);
  });
});

describe("recordSwipe", () => {
  it("creates a match when liking someone who already liked the user", () => {
    const result = recordSwipe(db, ME, "alice", "like", new Date("2026-11-17T10:00:00Z"));
    expect(result).toEqual({
      matched: true,
      match: {
        profile: expect.objectContaining({ id: "alice", name: "ALICE" }),
        matchedAt: "2026-11-17T10:00:00.000Z",
      },
    });
  });

  it("does not match on a one-sided like", () => {
    expect(recordSwipe(db, ME, "bob", "like")).toEqual({ matched: false });
    expect(getMatches(db, ME)).toEqual([]);
  });

  it("does not match when passing on someone who liked the user", () => {
    expect(recordSwipe(db, ME, "alice", "pass")).toEqual({ matched: false });
    expect(getMatches(db, ME)).toEqual([]);
  });

  it("matches later if the other person likes back after the user", () => {
    recordSwipe(db, ME, "bob", "like");
    const back = recordSwipe(db, "bob", ME, "like");
    expect(back.matched).toBe(true);
    expect(getMatches(db, ME).map((m) => m.profile.id)).toEqual(["bob"]);
  });

  it("rejects a second swipe on the same profile and keeps the first one", () => {
    recordSwipe(db, ME, "alice", "pass");
    expect(() => recordSwipe(db, ME, "alice", "like")).toThrowError(
      expect.objectContaining({ code: "ALREADY_SWIPED" }),
    );
    expect(getMatches(db, ME)).toEqual([]); // the pass stood; no sneaky match
  });

  it("rejects unknown profiles and swiping on yourself", () => {
    expect(() => recordSwipe(db, ME, "nobody", "like")).toThrow(DiscoverError);
    expect(() => recordSwipe(db, ME, "nobody", "like")).toThrowError(
      expect.objectContaining({ code: "PROFILE_NOT_FOUND" }),
    );
    expect(() => recordSwipe(db, ME, ME, "like")).toThrowError(
      expect.objectContaining({ code: "CANNOT_SWIPE_SELF" }),
    );
  });
});

describe("getMatches", () => {
  it("lists only mutual matches, newest first", () => {
    recordSwipe(db, ME, "alice", "like", new Date("2026-11-17T10:00:00Z"));
    recordSwipe(db, ME, "bob", "like", new Date("2026-11-17T11:00:00Z"));
    recordSwipe(db, ME, "carol", "like", new Date("2026-11-17T12:00:00Z"));
    expect(getMatches(db, ME).map((m) => m.profile.id)).toEqual(["carol", "alice"]);
  });
});

describe("privacy: never reveal who liked the user unless it's mutual", () => {
  it("feed items expose only public fields, nothing about likes", () => {
    for (const p of getFeed(db, ME)) {
      expect(Object.keys(p).sort()).toEqual(
        ["age", "bio", "id", "interests", "location", "name", "photo"],
      );
    }
  });

  it("feed order does not depend on who liked the user", () => {
    const withLikes = feedIds();
    const noLikes = openDb(":memory:", {
      ...FIXTURE,
      profiles: FIXTURE.profiles.map((p) => ({ ...p, likedMe: false })),
    });
    expect(getFeed(noLikes, ME).map((p) => p.id)).toEqual(withLikes);
  });

  it("a pass response is identical whether or not the other person liked the user", () => {
    const onLiker = recordSwipe(db, ME, "alice", "pass");
    const onNonLiker = recordSwipe(db, ME, "bob", "pass");
    expect(JSON.stringify(onLiker)).toBe(JSON.stringify(onNonLiker));
  });

  it("other people's one-sided likes never show up in matches", () => {
    expect(getMatches(db, ME)).toEqual([]); // alice and carol liked me, but I haven't liked them
  });

  it("a stray match row without both likes is not reported", () => {
    db.prepare("INSERT INTO matches (user_a, user_b, created_at) VALUES ('bob', 'me', 'x')").run();
    expect(getMatches(db, ME)).toEqual([]);
  });
});

describe("persistence", () => {
  it("swipes and matches survive closing and reopening the database", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "coy-"));
    const file = path.join(dir, "test.db");
    try {
      const first = openDb(file, FIXTURE);
      recordSwipe(first, ME, "alice", "like");
      recordSwipe(first, ME, "bob", "pass");
      first.close();

      const second = openDb(file, FIXTURE);
      expect(getFeed(second, ME).map((p) => p.id)).toEqual(["carol", "dave"]);
      expect(getMatches(second, ME).map((m) => m.profile.id)).toEqual(["alice"]);
      second.close();
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("resetDemo restores the seeded state", () => {
    recordSwipe(db, ME, "alice", "like");
    resetDemo(db, FIXTURE);
    expect(feedIds()).toEqual(["alice", "bob", "carol", "dave"]);
    expect(getMatches(db, ME)).toEqual([]);
    expect(recordSwipe(db, ME, "carol", "like").matched).toBe(true); // seeded likes are back
  });
});
