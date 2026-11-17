import type { SeedData, SeedProfile } from "@/server/seed";

const profile = (id: string, extra: Partial<SeedProfile> = {}): SeedProfile => ({
  id,
  name: id.toUpperCase(),
  age: 22,
  photo: `https://example.com/${id}.jpg`,
  bio: `bio ${id}`,
  location: "Gurgaon",
  interests: ["x"],
  ...extra,
});

/** Small seed: "alice" and "carol" have already liked the user, "bob" and "dave" haven't. */
export const FIXTURE: SeedData = {
  me: profile("me"),
  profiles: [
    profile("alice", { likedMe: true }),
    profile("bob"),
    profile("carol", { likedMe: true }),
    profile("dave"),
  ],
};
