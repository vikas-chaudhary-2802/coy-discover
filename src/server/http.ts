import { DiscoverError, type DiscoverErrorCode } from "./discover";

const NO_STORE = { "Cache-Control": "no-store" };

export function json(data: unknown, status = 200): Response {
  return Response.json(data, { status, headers: NO_STORE });
}

export function errorJson(code: string, message: string, status: number): Response {
  return json({ error: { code, message } }, status);
}

const STATUS: Record<DiscoverErrorCode, number> = {
  PROFILE_NOT_FOUND: 404,
  CANNOT_SWIPE_SELF: 400,
  ALREADY_SWIPED: 409,
};

/** Map known domain errors to HTTP; anything else is a 500 without internals. */
export function handleError(err: unknown): Response {
  if (err instanceof DiscoverError) return errorJson(err.code, err.message, STATUS[err.code]);
  console.error(err);
  return errorJson("INTERNAL", "Something went wrong. Please try again.", 500);
}
