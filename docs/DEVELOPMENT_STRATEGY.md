# Cosmic Fight Development Strategy

## Purpose

This document is the current implementation order for Cosmic Fight and should be read before starting a new development phase.

The product design remains defined by the GDD and Decisions log. This document defines **how we will build and validate it**.

## Product targets

Cosmic Fight will have three cooperating parts:

1. **Web client** — first public/testable client, playable from a browser without an app-store account.
2. **Authoritative server** — shared backend for both Web and Android clients.
3. **Android client** — Godot 4 .NET / C# production mobile client using the same server/API and gameplay rules.

Target architecture:

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
   browser / mobile-first        Google Play later
              |                       |
 cosmic-fight.bacus.dev          same backend/API
```

## Why Web first

The Web client is the fastest way to validate the game with real players:

- no Google Play developer account is required;
- testers can open a URL immediately;
- UI/combat iterations can be deployed quickly;
- real PvP can be tested before Android packaging/store work;
- the server, combat model, matchmaking and persistence built for Web are reused by Android.

The Godot work already completed is **not discarded**. It remains the foundation for the Android client.

## Repository layout direction

Do not move the existing Godot project unless there is a strong reason. Godogen currently expects the Godot project at repository root.

Planned layout:

```text
/
├── project.godot             # Android/Godot client foundation
├── CosmicFight.csproj
├── scenes/
├── scripts/
├── assets/
├── web/                      # Web client
├── server/                   # ASP.NET Core authoritative backend
├── docs/
└── README.md
```

Shared protocol/contracts should be documented and versioned. Avoid coupling gameplay rules to one client implementation.

## Technology direction

### Web client

Preferred initial stack:

- TypeScript;
- Vite;
- Babylon.js for battle rendering/animation;
- mobile-first responsive UI;
- browser deployment at `cosmic-fight.bacus.dev` when ready.

The first Web version may use procedural/placeholders. Production assets are introduced through the Asset Manifest workflow.

### Server

Preferred stack:

- ASP.NET Core / .NET;
- PostgreSQL;
- SignalR/WebSocket for realtime presence, invitations and battles;
- REST/HTTP for profile, inventory and non-realtime operations;
- Docker for deployment;
- server-authoritative combat.

The server owns competitive truth: turn validation, damage, energy, cooldowns, battle result, rating and rewards.

### Android client

- Godot 4 .NET / C#;
- portrait/mobile-first;
- same gameplay protocol and backend as Web;
- Android export/AAB and Google Play preparation only after Web/PvP validation is strong enough.

Godogen is primarily used for the Godot/Android track: scene generation, game-runtime iteration, asset workflow and visual proof. It is not required for ordinary ASP.NET Core or Web development.

## Current status

Completed:

- product GDD and supporting documentation;
- visual direction, Art Bible and Asset Manifest;
- Godogen/Codex workflow;
- Godot 4.7.2 .NET bootstrap;
- portrait Godot scene;
- procedural player/enemy placeholders;
- build/import/headless/runtime validation;
- portable NuGet restore configuration.

Not yet implemented:

- real combat loop;
- Web client;
- server;
- accounts/persistence;
- presence/matchmaking;
- real PvP;
- production assets;
- Android export pipeline.

## Development phases

### Phase 1 — Web combat prototype

Goal: prove the battle loop and mobile browser UX as cheaply and quickly as possible.

Build in `web/`:

- portrait/mobile-first battle screen;
- player/enemy placeholder ships;
- HP / Shield / Energy;
- Attack / Defend / Charge / Repair / Special;
- deterministic local battle model;
- simple AI opponent;
- turn timer;
- battle log;
- Victory / Defeat / Restart;
- simple combat VFX;
- responsive desktop/mobile testing.

Do **not** build accounts, progression or full multiplayer during the first combat iteration.

Exit criterion: repeated short battles are readable and mechanically interesting enough to justify network implementation.

### Phase 2 — Authoritative server foundation

Build in `server/`:

- ASP.NET Core solution;
- health/version endpoints;
- PostgreSQL integration;
- player/session identity suitable for testing;
- authoritative combat engine based on validated combat rules;
- REST contracts;
- SignalR/WebSocket transport;
- structured logs;
- Docker setup;
- unit/integration tests.

Move competitive battle resolution to the server. Client becomes a presenter of authoritative state.

Exit criterion: automated clients can create and complete deterministic server-side battles.

### Phase 3 — Web PvP alpha

Connect `web/` to `server/` and implement:

- online presence;
- Online Arena player list;
- Challenge;
- Accept / Decline;
- authoritative 1v1 battle room;
- turn synchronization/timer;
- reconnect;
- rematch;
- Quick Match when direct challenge is stable;
- basic battle history;
- deployable Docker/production configuration.

Target deployment: browser-accessible Cosmic Fight on the project domain/server.

Exit criterion: two remote real players can repeatedly complete battles without state divergence.

### Phase 4 — Progression and competitive beta

Add only after PvP works reliably:

- accounts/profile;
- inventory/loadouts;
- upgrades;
- credits/XP;
- power score;
- rating/leagues;
- ranked matchmaking;
- telemetry/balance tools.

### Phase 5 — Android Godot client

Return to the existing Godot project and implement the validated game using the same backend/protocol:

- production battle UI;
- Web parity for core gameplay;
- shared server contracts;
- realtime PvP;
- reconnect/background-resume handling;
- asset replacement via Asset Manifest;
- Android SDK/export templates;
- signed AAB;
- device QA;
- Google Play preparation.

Do not duplicate authoritative combat logic in the Android client.

## Cross-client rule

Web and Android are two clients of the same game, not separate games.

The following must remain server/shared-contract driven:

- combat rules;
- action validation;
- authoritative outcomes;
- player/loadout data contracts;
- matchmaking and battle lifecycle;
- rating/progression settlement.

Client-specific code should focus on rendering, input, animation, UX and network presentation.

## Asset rule

Continue using:

- `docs/ART_BIBLE.md`;
- `docs/VISUAL_DIRECTION.md`;
- `docs/ASSET_MANIFEST.md`.

Placeholders are preferred during mechanics development. Final assets should be generated/approved gradually and reused across Web and Android where technically appropriate.

## Starting a new development chat

A new implementation chat should begin with a request equivalent to:

> Continue `niko009/cosmic-fight`. Read README and all authoritative docs, especially `docs/DEVELOPMENT_STRATEGY.md`, `docs/GDD.md`, `docs/GAMEPLAY.md`, `docs/TECHNICAL_ARCHITECTURE.md`, and `docs/DECISIONS.md`. Inspect the current repository state. Start the next unfinished phase from `DEVELOPMENT_STRATEGY.md`. Do not redesign agreed product decisions. Implement, test, visually verify where applicable, update docs/status, and commit/push the completed phase.

## Immediate next phase

**Next work: Phase 1 — Web combat prototype.**

The existing Godot bootstrap should remain intact while the Web prototype is developed.