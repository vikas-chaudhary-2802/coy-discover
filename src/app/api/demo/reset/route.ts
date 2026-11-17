import { getDb, resetDemo } from "@/server/db";
import { handleError, json } from "@/server/http";

/** POST /api/demo/reset → clear all swipes/matches and restore seed data (demo only). */
export async function POST() {
  try {
    resetDemo(getDb());
    return json({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
