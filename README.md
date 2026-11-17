# Coy · Discover

A swipe-based **Discover** tab for [Coy](https://getcoy.com), built for the Coy SDE Intern assignment (Part B).
It is a standalone Next.js app with a bottom tab bar: a blank **Home** tab that stands in for Coy's existing
experience, and the new **Discover** tab.

The look matches Coy's own site and web app: the same wordmark and favicon, Bricolage Grotesque type, ink
`#15121D`, Coy pink `#FF3D81`, pastel accents, 2px ink borders and hard offset shadows.

## Run it

Needs Node 20+ (tested on Node 24).

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # 24 backend tests (Vitest)
```

The SQLite database is created and seeded on first request at `data/coy.db`. Point `COY_DB_PATH` somewhere
else to move it. To start the demo over, use **Reset demo data** on the "All caught up" screen, or
`curl -X POST localhost:3000/api/demo/reset`.

**Demo tip:** Kabir, Meera, Rohan, Karan, Riya, Kavya, Zoya, Sneha and Naina have already liked you. Swipe right
on any of them for an instant "It's a match!".

## What's built

| Requirement | Where |
| --- | --- |
| 32 seeded profiles (name, age, photo, bio, city/college, interests); 9 have already liked the user | `src/server/seed.ts` |
| One card at a time; drag on mobile, buttons + ← → keys on desktop | `src/components/discover/SwipeCard.tsx`, `SwipeDeck.tsx` |
| Smooth spring animations, LIKE / PASS stamps while dragging, a toast after every swipe, haptic tick on mobile | same |
| A swiped profile never appears again | DB primary key + feed query + client guard |
| Clear empty state | `DeckStates.tsx` |
| "It's a match!" screen at the moment of a mutual like | `MatchModal.tsx` |
| Matches view listing mutual matches | `MatchesList.tsx` |
| `GET /feed`, `POST /swipe`, `GET /matches` | `src/app/api/*/route.ts` (also served at `/feed`, `/swipe` and `/matches` through rewrites) |
| Swipes and matches persist across reloads | SQLite (`better-sqlite3`) |

## API

All responses are JSON with `Cache-Control: no-store`. There is no auth: every request acts as the single
logged-in user (`me`).

```http
GET /feed?limit=20
→ 200 { "profiles": [ { "id", "name", "age", "photo", "bio", "location", "interests": [] } ] }

POST /swipe   { "profileId": "p02", "action": "like" | "pass" }
→ 200 { "matched": false }
→ 200 { "matched": true, "match": { "profile": { … }, "matchedAt": "2026-11-17T10:00:00.000Z" } }
→ 400 INVALID_BODY | CANNOT_SWIPE_SELF    404 PROFILE_NOT_FOUND    409 ALREADY_SWIPED

GET /matches
→ 200 { "matches": [ { "profile": { … }, "matchedAt": "…" } ] }   // newest first
```

## Privacy: "never reveal who liked you unless it's mutual"

This is Coy's core promise, so it's enforced on the server rather than left to the UI:

1. **Feed items carry only public fields.** The query selects an explicit column allow-list (never `SELECT *`),
   and a test asserts the exact key set, so nothing like `likedYou` can leak into the payload.
2. **Feed order ignores likes.** Profiles come back in a fixed curated order (`rank`). If likers were sorted
   first, the order alone would give them away. A test checks the order is identical with and without
   inbound likes.
3. **A swipe response says nothing until it's a match.** A pass always returns `{ "matched": false }`, and so
   does a like that isn't mutual, whether or not the other person liked you. A test compares the responses
   byte for byte.
4. **Matches require both likes.** The match row is written only when both likes exist, and `getMatches`
   re-checks both likes when reading (defence in depth), so a stray or partial row can never surface someone.
5. **No caching of user data.** GET routes call `connection()` so Next.js never prerenders them, and every
   response is sent with `no-store`.

## Design decisions

- **Next.js App Router + Route Handlers.** One deployable app with no separate server. All the logic lives in
  `src/server/discover.ts` as plain functions that take a `db`, so it's tested without HTTP or Next.js. The
  route handlers are thin: parse, call, map errors to status codes.
- **SQLite over a JSON file.** Constraints do the heavy lifting. `PRIMARY KEY (swiper_id, target_id)` makes
  "never swipe twice" impossible to violate, even across tabs or concurrent requests. `CHECK (user_a < user_b)`
  stores each match exactly once. Each swipe runs in a `BEGIN IMMEDIATE` transaction, so "insert like → check
  reciprocal like → insert match" can't race.
- **Optimistic UI.** The card leaves instantly. The server decides whether it was a match, and if the request
  fails the card comes back with an error toast.
- **Paginated feed.** The client loads 20 profiles and refills when fewer than 5 remain, skipping anything
  swiped this session to avoid races with in-flight requests.
- **Accessible.** Real buttons with labels, keyboard swiping, `role="dialog"` with focus and Escape on the
  match screen, and support for `prefers-reduced-motion`.

## Project structure

```
src/
  server/            db.ts (schema, seed, connection) · discover.ts (feed/swipe/matches) · http.ts · seed.ts
  app/api/           feed · swipe · matches · demo/reset   (route handlers)
  components/        AppShell · TabBar · CoyLogo · icons
  components/discover/  DiscoverView · SwipeDeck · SwipeCard · MatchModal · MatchesList · DeckStates · useDiscover
tests/               discover.test.ts (domain + privacy + persistence) · api.test.ts (HTTP layer)
```

## Deploying

SQLite needs a writable, persistent disk, so run it anywhere you can keep a file: `npm run build && npm start`
on a VM, Railway, Render or Fly.io with a volume. On serverless hosts such as Vercel the filesystem is
temporary, so swap `src/server/db.ts` for a hosted database (Turso/libSQL or Postgres). The rest of the code
stays the same.

## Credits

Profile photos are from [Unsplash](https://unsplash.com) under the Unsplash License. All names and bios are
fictional. The Coy wordmark and colours belong to Coy and are used only to match the product for this
assignment.
