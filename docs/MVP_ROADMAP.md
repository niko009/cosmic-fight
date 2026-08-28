# MVP & Production Roadmap

## Philosophy

Do not build the whole live-service vision before proving the duel is fun and real remote players can complete matches reliably.

The current implementation order is **Web first → shared server → Web PvP → Android**. The existing Godot bootstrap is retained for the later Android track.

## Phase 0 — Pre-production and Godot bootstrap — COMPLETE

Delivered:

- GDD baseline;
- visual direction;
- combat rules;
- data model sketch;
- prototype scope;
- Art Bible and Asset Manifest;
- Godogen/Codex workflow;
- Godot 4.7.2 .NET/C# bootstrap;
- portrait scene with procedural placeholders;
- build/import/headless/runtime validation;
- portable NuGet restore.

Exit criterion met: the project has a documented product direction and a validated Android/Godot foundation.

## Phase 1 — Web combat prototype — NEXT

Build in `web/`:

- mobile-first portrait battle screen;
- player ship + enemy ship placeholders;
- HP / Shield / Energy;
- Attack / Defend / Charge / Repair / Special;
- deterministic local battle state;
- basic AI opponent;
- turn timer;
- battle log;
- victory/defeat/restart;
- simple combat VFX;
- desktop/mobile browser QA.

Goal: determine whether the turn loop is readable and fun before networking complexity.

Exit criteria:

- repeated 2–4 minute battles;
- all five actions have meaningful use;
- no obvious dominant always-correct action;
- battle state is understandable without debug text;
- acceptable browser/mobile UX.

## Phase 2 — Authoritative server foundation

Build in `server/`:

- ASP.NET Core solution;
- PostgreSQL persistence foundation;
- test player/session identity;
- shared/versioned battle contracts;
- authoritative combat engine;
- REST endpoints;
- SignalR/WebSocket transport;
- health/version endpoints;
- Docker configuration;
- structured logs;
- combat/server unit and integration tests.

Move competitive outcomes from the local prototype into the server.

Exit criterion: automated clients can repeatedly create and complete deterministic server-side battles without divergence.

## Phase 3 — Web PvP alpha

Connect `web/` to the server and build:

- online presence;
- Online Arena list;
- direct challenge;
- accept/decline;
- authoritative battle room;
- synchronized turns/timer;
- reconnect;
- rematch;
- Quick Battle after direct challenge is stable;
- basic match history;
- production-like deployment.

Target: deploy browser-accessible Cosmic Fight at `cosmic-fight.bacus.dev` for real remote testing.

Exit criterion: two real remote players can repeatedly complete matches without state divergence.

## Phase 4 — Progression / competitive beta

Build only after reliable PvP:

- real accounts/profile;
- inventory/loadouts;
- credits/XP;
- upgrades;
- power score;
- rating/leagues;
- Ranked matchmaking;
- telemetry;
- balance iteration;
- starter economy.

Exit criterion: enough systems exist to test retention and competitive balance.

## Phase 5 — Android Godot client

Use the already bootstrapped Godot 4 .NET/C# project and connect it to the same backend.

Build/polish:

- production battle UI and VFX;
- parity with validated Web core gameplay;
- shared server/API contracts;
- realtime PvP;
- reconnect and background/resume;
- gradual production asset replacement;
- Android SDK/export templates;
- signing/AAB;
- device QA;
- Google Play preparation.

The Android client must not duplicate authoritative combat logic.

Exit criterion: Android players can play against Web/Android players through the same authoritative backend and core game rules.

## Phase 6 — Soft launch / live expansion

Build/polish:

- onboarding;
- performance/crash monitoring;
- content polish;
- improved matchmaking;
- economy tuning;
- moderation/reporting minimums;
- store listing assets;
- limited release if appropriate.

Measure:

- D1/D7 retention;
- match completion;
- average queue time;
- battles/session;
- battle duration;
- disconnect rate;
- loadout diversity;
- ranked distribution.

Candidate later features:

- friends;
- private rooms;
- spectator mode;
- seasonal ranks;
- cosmetic store;
- tournaments;
- clans;
- additional hulls/weapons/modules;
- events;
- replays;
- iOS / other platforms.

## MVP feature lock

Required for first meaningful online Web test:

### Combat
- 3 hulls in data/design direction
- 4 weapons in data/design direction
- shield/armor/reactor model
- special module system
- 5 turn actions
- critical/system damage
- sudden death

### Multiplayer
- test/account identity
- presence
- player list
- challenge
- accept/decline
- battle room
- reconnect
- rematch
- quick match
- ranked rating can arrive after first alpha

### Progression
Progression is **not required for the earliest Web PvP alpha**. Add after combat/network reliability is proven:

- credits
- XP
- equipment upgrades
- power score
- rating/league

### UI
Early Web alpha:

- Battle
- Online Arena
- Result
- minimum profile/test identity

Later beta:

- Home
- Hangar
- Profile/settings
- inventory/upgrade screens

## Explicit post-MVP list

- unrestricted chat
- clans
- tournaments
- spectator
- marketplace/trading
- 2v2
- story campaign
- battle pass
- deep crafting
- dozens of ship classes
