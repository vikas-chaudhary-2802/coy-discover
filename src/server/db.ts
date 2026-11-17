import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { DEFAULT_SEED, type SeedData } from "./seed";

export type DB = Database.Database;

/** No auth in this assignment: every request acts as this single logged-in user. */
export const CURRENT_USER_ID = "me";

const SCHEMA = `
  CREATE TABLE IF NOT EXISTS profiles (
    id         TEXT PRIMARY KEY,
    name       TEXT    NOT NULL,
    age        INTEGER NOT NULL CHECK (age >= 18),
    photo      TEXT    NOT NULL,
    bio        TEXT    NOT NULL,
    location   TEXT    NOT NULL,
    interests  TEXT    NOT NULL,              -- JSON array of strings
    rank       INTEGER NOT NULL DEFAULT 0     -- curated feed order, never derived from likes
  );

  -- One row per (swiper, target). The primary key is what guarantees a
  -- profile can never be swiped twice, even under concurrent requests.
  CREATE TABLE IF NOT EXISTS swipes (
    swiper_id  TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    target_id  TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    action     TEXT NOT NULL CHECK (action IN ('like', 'pass')),
    created_at TEXT NOT NULL,
    PRIMARY KEY (swiper_id, target_id),
    CHECK (swiper_id <> target_id)
  );
  CREATE INDEX IF NOT EXISTS swipes_by_target ON swipes (target_id, swiper_id, action);

  -- A match is stored once per pair, with ids in sorted order (user_a < user_b).
  CREATE TABLE IF NOT EXISTS matches (
    user_a     TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    user_b     TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL,
    PRIMARY KEY (user_a, user_b),
    CHECK (user_a < user_b)
  );
`;

export function defaultDbPath(): string {
  return process.env.COY_DB_PATH ?? path.join(process.cwd(), "data", "coy.db");
}

/** Open (and create, migrate and seed if needed) a database. Use ":memory:" in tests. */
export function openDb(file: string = defaultDbPath(), seed: SeedData = DEFAULT_SEED): DB {
  if (file !== ":memory:") fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new Database(file);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  db.exec(SCHEMA);
  const { n } = db.prepare("SELECT COUNT(*) AS n FROM profiles").get() as { n: number };
  if (n === 0) seedDb(db, seed);
  return db;
}

/** Insert profiles plus the "already liked you" swipes. Runs in one transaction. */
export function seedDb(db: DB, seed: SeedData = DEFAULT_SEED): void {
  const insertProfile = db.prepare(
    `INSERT OR REPLACE INTO profiles (id, name, age, photo, bio, location, interests, rank)
     VALUES (@id, @name, @age, @photo, @bio, @location, @interests, @rank)`,
  );
  const insertLike = db.prepare(
    `INSERT OR IGNORE INTO swipes (swiper_id, target_id, action, created_at)
     VALUES (?, ?, 'like', ?)`,
  );
  const now = new Date().toISOString();
  db.transaction(() => {
    [seed.me, ...seed.profiles].forEach((p, rank) => {
      insertProfile.run({ ...p, interests: JSON.stringify(p.interests), rank });
    });
    for (const p of seed.profiles) {
      if (p.likedMe) insertLike.run(p.id, seed.me.id, now);
    }
  })();
}

/** Demo helper: forget everything the current user did and restore the seeded state. */
export function resetDemo(db: DB, seed: SeedData = DEFAULT_SEED): void {
  db.transaction(() => {
    db.prepare("DELETE FROM matches").run();
    db.prepare("DELETE FROM swipes").run();
    seedDb(db, seed);
  })();
}

// Keep a single connection per server process (and across dev hot reloads).
const globalForDb = globalThis as unknown as { __coyDb?: DB };

export function getDb(): DB {
  globalForDb.__coyDb ??= openDb();
  return globalForDb.__coyDb;
}
