import { connection } from "next/server";
import { CURRENT_USER_ID, getDb } from "@/server/db";
import { getMatches } from "@/server/discover";
import { handleError, json } from "@/server/http";

/** GET /api/matches → the user's mutual matches, newest first. */
export async function GET() {
  await connection();
  try {
    return json({ matches: getMatches(getDb(), CURRENT_USER_ID) });
  } catch (err) {
    return handleError(err);
  }
}
