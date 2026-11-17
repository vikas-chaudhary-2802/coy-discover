import type { Match, PublicProfile, SwipeAction, SwipeResult } from "@/server/discover";

export type { Match, PublicProfile, SwipeAction, SwipeResult };

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { cache: "no-store", ...init });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new ApiError(
      res.status,
      body?.error?.code ?? "UNKNOWN",
      body?.error?.message ?? "Something went wrong.",
    );
  }
  return body as T;
}

export const api = {
  feed: (limit = 20) =>
    request<{ profiles: PublicProfile[] }>(`/api/feed?limit=${limit}`).then((r) => r.profiles),
  swipe: (profileId: string, action: SwipeAction) =>
    request<SwipeResult>("/api/swipe", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ profileId, action }),
    }),
  matches: () => request<{ matches: Match[] }>("/api/matches").then((r) => r.matches),
  resetDemo: () => request<{ ok: true }>("/api/demo/reset", { method: "POST" }),
};
