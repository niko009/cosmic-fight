# Cosmic Fight Development Strategy

## Purpose

This document defines the current implementation order for Cosmic Fight.

The product design is defined by `GDD.md` and `DECISIONS.md`. The current combat direction is **targeted modular ship destruction**, not the older abstract five-button combat model.

## Product targets

Cosmic Fight has three cooperating parts:

1. **Web client** — first testable client.
2. **Authoritative server** — shared backend for Web and Android.
3. **Android client** — Godot 4 .NET / C# production client using the same server and gameplay rules.

```text
                     Cosmic Fight
                          |
                 ASP.NET Core Server
              REST + SignalR/WebSocket
                     PostgreSQL
                          |
              +-----------+-----------+
              |                       |
         Web Client              Android Client
   Babylon.js / TypeScript       Godot 4 .NET / C#
              |                       |
 cosmic-fight.bacus.dev          same backend/API
```

## Why Web first

- no app-store account required;
- testers can open a URL immediately;
- combat/UI iterations are faster to distribute;
- real PvP can be validated before Android packaging;
- server and combat contracts are reused by Android.

The existing Godot work is retained as the Android-client foundation.

## Repository layout

```text
/
├── project.godot
├── CosmicFight.csproj
├── scenes/
├── scripts/
├── assets/
├── web/
├── server/
├── docs/
└── README.md
```

Do not move the Godot project casually because Godogen currently expects it at repository root.

## Technology direction

### Web

- TypeScript;
- Vite;
- Babylon.js where 3D/battle rendering benefits from it;
- responsive browser UI;
- placeholders first.

### Server

- ASP.NET Core;
- PostgreSQL;
- SignalR/WebSocket;
- REST/HTTP for non-realtime operations;
- Docker;
- server-authoritative combat.

### Android

- Godot 4 .NET / C#;
- same battle protocol/backend as Web;
- orientation decided after Web/mobile usability tests;
- Android export/AAB later.

## Current status

Completed:

- GDD and supporting docs;
- visual direction / Art Bible / Asset Manifest;
- Godogen/Codex workflow;
- Godot 4.7.2 .NET bootstrap;
- build/import/headless/runtime validation;
- updated modular-combat direction based on the supplied reference prototype.

Not implemented yet:

- real Web combat loop;
- server;
- real PvP;
- persistent progression;
- production assets;
- Android export pipeline.

## Phase 1 — Web modular combat prototype

Goal: prove the defining combat interaction before networking.

Build in `web/`:

- two modular placeholder ships;
- visible/selectable modules;
- Core/Power, Engines, Weapons, Armor, Hull, Sensors;
- optional Wings/structural nodes where useful;
- Laser;
- Missile;
- Scatter weapon;
- Plasma;
- target-specific damage;
- local armor absorption;
- module states: OK / Damaged / Critical / Destroyed;
- system consequences from damaged Engines/Weapons/Sensors/Core;
- basic power-network/offline behavior;
- at least Fire and Electrical Short as prototype statuses;
- Repair mode selecting a friendly module;
- limited repair kits;
- simple AI that chooses targets and weapons;
- battle log;
- Victory / Defeat / Rematch;
- small pre-battle upgrade screen with simple points;
- responsive desktop/mobile testing.

Do **not** build accounts, permanent economy or real multiplayer in this phase.

The old `Attack / Defend / Charge / Repair / Special` model is no longer the Phase 1 requirement. `Defend`, `Charge`, shields and special abilities remain expansion candidates after targeted module combat is proven.

### Phase 1 validation questions

We specifically need to learn:

1. Is choosing a target module interesting every turn?
2. Is disabling systems more satisfying than simply reducing one HP bar?
3. Do weapons create genuinely different target priorities?
4. Does armor create a readable "break protection, then hit system" decision?
5. Is Repair a meaningful sacrifice of a turn?
6. Can crippled ships still create comeback moments?
7. Which layout works better on phones: portrait-adapted or landscape battle presentation?
8. Are battles close to the intended 2–4 minute duration?

Exit criterion: the combat loop is understandable and fun enough to justify moving it to an authoritative server.

## Phase 2 — Authoritative server foundation

Build in `server/`:

- ASP.NET Core solution;
- health/version endpoints;
- PostgreSQL integration;
- testing identity/session model;
- authoritative modular battle engine based on Phase 1 rules;
- target validation;
- module graph/state;
- weapon resolution;
- armor absorption;
- statuses;
- repair rules;
- deterministic/loggable RNG;
- REST contracts;
- SignalR/WebSocket transport;
- structured logs;
- Docker;
- unit/integration tests.

Exit criterion: automated clients can complete deterministic server-side modular battles.

## Phase 3 — Web PvP alpha

Connect Web to Server:

- online presence;
- Online Arena;
- Challenge;
- Accept / Decline;
- authoritative 1v1 battle room;
- synchronized turns;
- turn timer;
- reconnect;
- rematch;
- Quick Match after direct challenge is stable;
- basic history;
- production deployment configuration.

Exit criterion: two remote players can repeatedly complete battles without state divergence.

## Phase 4 — Progression / competitive beta

Add after reliable PvP:

- accounts/profile;
- persistent upgrade/inventory system;
- credits/XP;
- ship layouts/loadouts;
- rating/leagues;
- ranked matchmaking;
- balance telemetry.

## Phase 5 — Android Godot client

Use the existing Godot foundation and the validated server protocol:

- modular battle rendering;
- target selection;
- weapon/repair UI;
- realtime PvP;
- reconnect/background resume;
- shared assets where technically appropriate;
- Android SDK/export templates;
- signed AAB;
- device QA;
- Google Play preparation.

Do not duplicate authoritative combat logic in the Android client.

## Cross-client rule

Web and Android are two clients of the same game.

Server/shared-contract driven:

- module definitions/state;
- target validation;
- weapon rules;
- armor interaction;
- statuses;
- repair;
- battle lifecycle;
- matchmaking;
- rating/progression settlement.

Client-specific:

- rendering;
- input;
- animation;
- UX;
- audio;
- presentation of authoritative events.

## Asset rule

Continue using:

- `docs/ART_BIBLE.md`;
- `docs/VISUAL_DIRECTION.md`;
- `docs/ASSET_MANIFEST.md`.

Placeholders are preferred while mechanics are being validated.

## Starting a new development chat

Use a request equivalent to:

> Continue `niko009/cosmic-fight`. Read README and all authoritative docs, especially `docs/DEVELOPMENT_STRATEGY.md`, `docs/GDD.md`, `docs/GAMEPLAY.md`, `docs/TECHNICAL_ARCHITECTURE.md`, and `docs/DECISIONS.md`. Inspect the current repository state. Start the next unfinished phase. Preserve the agreed targeted modular combat direction. Implement, test, visually verify, update docs/status, and commit/push the completed work.

## Immediate next phase

**Phase 1 — Web modular combat prototype.**

The supplied Space Busters-style HTML reference informs the mechanics and interaction model, but Cosmic Fight should keep its own art direction, product identity and architecture.
