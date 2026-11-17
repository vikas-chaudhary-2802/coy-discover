import { connection } from "next/server";
import { CURRENT_USER_ID, getDb } from "@/server/db";
import { getFeed } from "@/server/discover";
import { handleError, json } from "@/server/http";

/** GET /api/feed?limit=20 → profiles the user hasn't swiped on yet. */
export async function GET(request: Request) {
  await connection(); // always run per request; never prerender user data
  try {
    const limit = Number(new URL(request.url).searchParams.get("limit") ?? 20);
    const profiles = getFeed(getDb(), CURRENT_USER_ID, limit);
    return json({ profiles });
  } catch (err) {
    return handleError(err);
  }
}
