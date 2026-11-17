import { connection } from "next/server";
import { getDb } from "@/server/db";
import { json } from "@/server/http";

/**
 * GET /api/health: is the database reachable?
 * Reports only the driver and an error code, never the connection string or credentials.
 */
export async function GET() {
  await connection();
  const driver = process.env.DATABASE_URL?.trim() ? "postgres" : "pglite";
  try {
    const db = await getDb();
    const [row] = await db.query<{ profiles: number }>("SELECT COUNT(*)::int AS profiles FROM profiles");
    return json({ ok: true, driver, profiles: row.profiles });
  } catch (err) {
    const e = err as { code?: string; message?: string };
    const reason =
      e.code ?? (e.message?.startsWith("DATABASE_URL is not set") ? "DATABASE_URL_MISSING" : "UNKNOWN");
    return json({ ok: false, driver, reason }, 503);
  }
}
