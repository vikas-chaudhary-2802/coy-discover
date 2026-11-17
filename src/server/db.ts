import fs from "node:fs";
import path from "node:path";
import { DEFAULT_SEED, type SeedData } from "./seed";

/**
 * Database access.
 *
 * Production uses real Postgres (Supabase) through `pg`, configured by DATABASE_URL.
 * Local dev and tests use PGlite: the same Postgres engine compiled to WASM,
 * running in-process. So the exact SQL that ships is the SQL that's tested,
 * and nobody needs Docker or a database server to run the project.
 */

export interface Queryable {
  query<T = Record<string, unknown>>(text: string, params?: unknown[]): Promise<T[]>;
}

export interface DB extends Queryable {
  /** Run `fn` in a single transaction; rolls back if it throws. */
  transaction<T>(fn: (tx: Queryable) => Promise<T>): Promise<T>;
  close(): Promise<void>;
}

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
    interests  JSONB   NOT NULL DEFAULT '[]',
    rank       INTEGER NOT NULL DEFAULT 0      -- curated feed order, never derived from likes
  );

  -- One row per (swiper, target). The primary key is what guarantees a
  -- profile can never be swiped twice, even under concurrent requests.
  CREATE TABLE IF NOT EXISTS swipes (
    swiper_id  TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    target_id  TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    action     TEXT NOT NULL CHECK (action IN ('like', 'pass')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (swiper_id, target_id),
    CHECK (swiper_id <> target_id)
  );
  CREATE INDEX IF NOT EXISTS swipes_by_target ON swipes (target_id, swiper_id, action);

  -- A match is stored once per pair, with ids in sorted order (user_a < user_b).
  CREATE TABLE IF NOT EXISTS matches (
    user_a     TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    user_b     TEXT NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (user_a, user_b),
    CHECK (user_a < user_b)
  );

  -- Supabase exposes the public schema over its REST API. Row Level Security with
  -- no policies blocks that path entirely, so swipes (who liked whom) are only
  -- reachable through this server. The server connects as the table owner, which
  -- RLS doesn't apply to.
  ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
  ALTER TABLE swipes   ENABLE ROW LEVEL SECURITY;
  ALTER TABLE matches  ENABLE ROW LEVEL SECURITY;
`;

/** Serialises schema setup and seeding across concurrent cold starts. */
const INIT_LOCK = 7_291_001;

/** Create tables if needed and seed if empty. Safe to call from many instances at once. */
export async function migrate(db: DB, seed: SeedData = DEFAULT_SEED): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.query("SELECT pg_advisory_xact_lock($1)", [INIT_LOCK]);
    for (const stmt of SCHEMA.split(";").map((s) => s.trim()).filter(Boolean)) {
      await tx.query(stmt);
    }
    const [{ n }] = await tx.query<{ n: number }>("SELECT COUNT(*)::int AS n FROM profiles");
    if (n === 0) await seedWith(tx, seed);
  });
}

async function seedWith(tx: Queryable, seed: SeedData): Promise<void> {
  const all = [seed.me, ...seed.profiles];
  for (const [rank, p] of all.entries()) {
    await tx.query(
      `INSERT INTO profiles (id, name, age, photo, bio, location, interests, rank)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8)
       ON CONFLICT (id) DO UPDATE SET
         name = EXCLUDED.name, age = EXCLUDED.age, photo = EXCLUDED.photo, bio = EXCLUDED.bio,
         location = EXCLUDED.location, interests = EXCLUDED.interests, rank = EXCLUDED.rank`,
      [p.id, p.name, p.age, p.photo, p.bio, p.location, JSON.stringify(p.interests), rank],
    );
  }
  for (const p of seed.profiles) {
    if (!p.likedMe) continue;
    await tx.query(
      `INSERT INTO swipes (swiper_id, target_id, action) VALUES ($1, $2, 'like')
       ON CONFLICT DO NOTHING`,
      [p.id, seed.me.id],
    );
  }
}

/** Demo helper: forget everything and restore the seeded state. */
export async function resetDemo(db: DB, seed: SeedData = DEFAULT_SEED): Promise<void> {
  await db.transaction(async (tx) => {
    await tx.query("SELECT pg_advisory_xact_lock($1)", [INIT_LOCK]);
    await tx.query("DELETE FROM matches");
    await tx.query("DELETE FROM swipes");
    await seedWith(tx, seed);
  });
}

// ─── Drivers ─────────────────────────────────────────────────────────────────

/** PGlite: in-memory ("memory://") or persisted to a local directory. */
export async function openPglite(dataDir = "memory://", seed: SeedData = DEFAULT_SEED): Promise<DB> {
  const { PGlite } = await import("@electric-sql/pglite");
  if (!dataDir.startsWith("memory://")) fs.mkdirSync(dataDir, { recursive: true });
  const pg = new PGlite(dataDir);
  const wrap = (q: Pick<typeof pg, "query">): Queryable => ({
    query: async <T,>(text: string, params?: unknown[]) => (await q.query<T>(text, params)).rows,
  });
  const db: DB = {
    ...wrap(pg),
    transaction: (fn) => pg.transaction((tx) => fn(wrap(tx))),
    close: () => pg.close(),
  };
  await migrate(db, seed);
  return db;
}

/** node-postgres pool for a real Postgres server (Supabase in production). */
export async function openPostgres(connectionString: string): Promise<DB> {
  const { Pool } = await import("pg");
  const pool = new Pool({
    connectionString,
    // Serverless functions are short-lived: keep the pool tiny and let Supabase's pooler fan in.
    max: 3,
    idleTimeoutMillis: 10_000,
    ssl: /localhost|127\.0\.0\.1/.test(connectionString) ? undefined : { rejectUnauthorized: false },
  });
  const db: DB = {
    query: async <T,>(text: string, params?: unknown[]) =>
      (await pool.query(text, params)).rows as T[],
    async transaction(fn) {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        const result = await fn({
          query: async <T,>(text: string, params?: unknown[]) =>
            (await client.query(text, params)).rows as T[],
        });
        await client.query("COMMIT");
        return result;
      } catch (err) {
        await client.query("ROLLBACK").catch(() => {});
        throw err;
      } finally {
        client.release();
      }
    },
    close: () => pool.end(),
  };
  await migrate(db);
  return db;
}

export function defaultPgliteDir(): string {
  return process.env.COY_PGLITE_DIR ?? path.join(process.cwd(), "data", "pglite");
}

// Keep one connection per server process (and across dev hot reloads).
const globalForDb = globalThis as unknown as { __coyDb?: Promise<DB> };

export function getDb(): Promise<DB> {
  globalForDb.__coyDb ??= (
    process.env.DATABASE_URL
      ? openPostgres(process.env.DATABASE_URL)
      : openPglite(defaultPgliteDir())
  ).catch((err) => {
    globalForDb.__coyDb = undefined; // let the next request retry
    throw err;
  });
  return globalForDb.__coyDb;
}
