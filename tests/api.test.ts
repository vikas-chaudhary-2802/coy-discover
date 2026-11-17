import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/server", () => ({ connection: async () => {} }));

import { GET as feedGET } from "@/app/api/feed/route";
import { GET as matchesGET } from "@/app/api/matches/route";
import { POST as swipePOST } from "@/app/api/swipe/route";
import { POST as resetPOST } from "@/app/api/demo/reset/route";
import { DEFAULT_SEED } from "@/server/seed";

const likerId = DEFAULT_SEED.profiles.find((p) => p.likedMe)!.id;
const nonLikerId = DEFAULT_SEED.profiles.find((p) => !p.likedMe)!.id;

const swipe = (body: unknown) =>
  swipePOST(
    new Request("http://test/api/swipe", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );

beforeEach(async () => {
  await resetPOST();
});

describe("HTTP API", () => {
  it("GET /feed returns unswiped profiles and is never cached", async () => {
    const res = await feedGET(new Request("http://test/api/feed?limit=5"));
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    const { profiles } = await res.json();
    expect(profiles).toHaveLength(5);
  });

  it("POST /swipe reports a match and GET /matches lists it", async () => {
    const res = await swipe({ profileId: likerId, action: "like" });
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ matched: true, match: { profile: { id: likerId } } });

    const matches = await (await matchesGET()).json();
    expect(matches.matches.map((m: { profile: { id: string } }) => m.profile.id)).toEqual([likerId]);
  });

  it("POST /swipe on a non-liker returns matched: false", async () => {
    expect(await (await swipe({ profileId: nonLikerId, action: "like" })).json()).toEqual({
      matched: false,
    });
  });

  it("swiped profiles disappear from the feed", async () => {
    await swipe({ profileId: nonLikerId, action: "pass" });
    const { profiles } = await (await feedGET(new Request("http://test/api/feed?limit=50"))).json();
    expect(profiles.map((p: { id: string }) => p.id)).not.toContain(nonLikerId);
  });

  it("validates input and maps domain errors to status codes", async () => {
    expect((await swipe("not json")).status).toBe(400);
    expect((await swipe({ profileId: likerId, action: "superlike" })).status).toBe(400);
    expect((await swipe({ action: "like" })).status).toBe(400);
    expect((await swipe({ profileId: "ghost", action: "like" })).status).toBe(404);
    expect((await swipe({ profileId: "me", action: "like" })).status).toBe(400);

    await swipe({ profileId: nonLikerId, action: "pass" });
    const dup = await swipe({ profileId: nonLikerId, action: "like" });
    expect(dup.status).toBe(409);
    expect((await dup.json()).error.code).toBe("ALREADY_SWIPED");
  });
});
