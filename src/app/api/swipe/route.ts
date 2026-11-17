import { CURRENT_USER_ID, getDb } from "@/server/db";
import { recordSwipe, type SwipeAction } from "@/server/discover";
import { errorJson, handleError, json } from "@/server/http";

interface SwipeBody {
  profileId: string;
  action: SwipeAction;
}

function parseBody(body: unknown): SwipeBody | null {
  if (typeof body !== "object" || body === null) return null;
  const { profileId, action } = body as Record<string, unknown>;
  if (typeof profileId !== "string" || profileId.length === 0 || profileId.length > 64) return null;
  if (action !== "like" && action !== "pass") return null;
  return { profileId, action };
}

/**
 * POST /api/swipe  { profileId, action: "like" | "pass" }
 * → { matched: false } | { matched: true, match: { profile, matchedAt } }
 */
export async function POST(request: Request) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return errorJson("INVALID_BODY", "Body must be JSON.", 400);
  }
  const body = parseBody(raw);
  if (!body) {
    return errorJson("INVALID_BODY", 'Expected { profileId: string, action: "like" | "pass" }.', 400);
  }
  try {
    return json(recordSwipe(getDb(), CURRENT_USER_ID, body.profileId, body.action));
  } catch (err) {
    return handleError(err);
  }
}
