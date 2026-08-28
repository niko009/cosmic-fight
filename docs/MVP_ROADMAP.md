# MVP & Production Roadmap

## Philosophy

Do not build the whole live-service vision before proving that **targeting and disabling ship systems is fun**.

Current implementation order: **Web first → shared authoritative server → Web PvP → Android**.

## Phase 0 — Pre-production and Godot bootstrap — COMPLETE

Delivered:

- GDD baseline and modular-combat revision;
- visual direction;
- Art Bible and Asset Manifest;
- Web-first strategy;
- Godogen/Codex workflow;
- Godot 4.7.2 .NET/C# bootstrap;
- build/import/headless/runtime validation;
- portable NuGet restore.

## Phase 1 — Web modular combat prototype — NEXT

Build in `web/`:

- two modular placeholder ships;
- selectable Core/Power, Engines, Weapons, Armor, Hull and Sensors;
- optional Wings/structural nodes where useful;
- Laser / Missile / Scatter / Plasma;
- target-specific damage;
- local armor absorption;
- module states: OK / Damaged / Critical / Destroyed;
- functional system consequences;
- basic power/offline graph behavior;
- Fire and Electrical Short;
- targeted Repair with limited repair kits;
- simple AI;
- small pre-battle upgrade-point screen;
- battle log;
- Victory / Defeat / Rematch;
- responsive browser QA.

Goal: determine whether **weapon choice + target-system choice** creates enough tactical depth before networking.

Exit criteria:

- target choice materially changes battle outcome;
- weapon identities are understandable;
- armor creates a readable "break protection, then attack system" decision;
- repair creates a meaningful turn tradeoff;
- damaged systems visibly affect performance;
- battles can be tuned toward 2–4 minutes;
- mobile orientation/layout direction is understood.

## Phase 2 — Authoritative server foundation

Build in `server/`:

- ASP.NET Core solution;
- PostgreSQL;
- testing player/session identity;
- shared/versioned battle contracts;
- authoritative modular combat engine;
- module graph/state;
- target and weapon validation;
- armor/status/repair resolution;
- deterministic/loggable RNG;
- REST + SignalR/WebSocket;
- health/version endpoints;
- Docker;
- structured logs;
- unit/integration tests.

Exit criterion: automated clients repeatedly complete deterministic server-side modular battles without divergence.

## Phase 3 — Web PvP alpha

Connect `web/` to the server and build:

- online presence;
- Online Arena;
- direct challenge;
- accept/decline;
- authoritative battle room;
- synchronized turns/timer;
- reconnect;
- rematch;
- Quick Battle after direct challenge is stable;
- basic history;
- production deployment configuration.

Target: browser-accessible Cosmic Fight at `cosmic-fight.bacus.dev`.

Exit criterion: two real remote players repeatedly complete matches without state divergence.

## Phase 4 — Progression / competitive beta

Add after reliable PvP:

- real accounts/profile;
- persistent ship layouts/loadouts;
- upgrades/inventory;
- Credits / XP;
- power score;
- rating/leagues;
- Ranked matchmaking;
- telemetry/balance tools.

## Phase 5 — Android Godot client

Use the existing Godot foundation and shared server protocol:

- modular ship presentation;
- precise module targeting;
- weapon/repair controls;
- realtime PvP;
- reconnect/background-resume;
- shared/final assets;
- Android SDK/export templates;
- signing/AAB;
- device QA;
- Google Play preparation.

The Android client must not duplicate authoritative combat logic.

## Phase 6 — Soft launch / live expansion

After core validation:

- onboarding;
- performance/crash monitoring;
- matchmaking tuning;
- economy tuning;
- moderation/reporting minimums;
- cosmetics;
- friends/private rooms;
- seasonal ranks;
- more hull layouts/weapons/modules;
- tournaments/clans/spectators only when justified.

## MVP feature lock

### Combat

Required for first meaningful online test:

- modular targetable ship systems;
- 4 initial weapons;
- local armor protection;
- system failure consequences;
- repair;
- at least two secondary status types;
- clear victory rule;
- turn timer in PvP.

`Defend`, `Charge`, active Shields, Energy and Special abilities are **not mandatory for the first MVP**. They remain expansion candidates.

### Multiplayer

- test/account identity;
- presence;
- player list;
- challenge;
- accept/decline;
- battle room;
- reconnect;
- rematch.

### Progression

Not required for earliest PvP alpha. Add after combat/network reliability:

- persistent upgrades;
- Credits / XP;
- power score;
- rating/league.

### UI

Early Web prototype/alpha:

- Upgrade prototype;
- Battle;
- Online Arena;
- Result;
- minimum profile/test identity when networking arrives.

## Explicit post-MVP list

- unrestricted chat;
- clans;
- tournaments;
- spectator;
- marketplace/trading;
- 2v2;
- story campaign;
- battle pass;
- deep crafting;
- dozens of ship classes;
- complex energy/shield layers unless testing justifies them.
