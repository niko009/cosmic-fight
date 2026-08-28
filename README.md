# Cosmic Fight

**Cosmic Fight** is a tactical 1v1 PvP game about building, upgrading, and commanding a custom starship in short turn-based online duels.

> Build your ship. Challenge live players. Outplay your rival.

## Core fantasy

Players assemble a ship from hull, weapon, shield, armor, reactor, and special-module systems, then enter the online arena. They can see available pilots, challenge a specific player, accept or decline invitations, use quick matchmaking, and fight authoritative server-controlled battles.

Matches target **2–4 minutes** and focus on readable tactical decisions rather than twitch execution. Each turn a player chooses between **Attack, Defend, Charge, Repair, and Special** while managing energy, shields, cooldowns, critical hits, and system damage.

## Project status

**Stage:** pre-production complete / Godot bootstrap validated / Web-first implementation next.

The repository contains the authoritative design documentation plus a validated Godot 4.7.2 .NET/C# Android-client foundation. The Godot portrait scene boots with procedural player/enemy placeholders and passes build/import/headless/runtime validation.

The current development strategy is now:

```text
Web combat prototype
        ↓
ASP.NET Core authoritative server
        ↓
Web PvP alpha on cosmic-fight.bacus.dev
        ↓
Progression / competitive beta
        ↓
Godot Android client using the same backend
```

The existing Godot work is retained and becomes the Android client track. We are validating gameplay and real PvP in the browser first because it is faster to distribute and does not require an app-store developer account.

## Documentation

### Start here

- [Development Strategy — current implementation order](docs/DEVELOPMENT_STRATEGY.md)
- [Game Design Document](docs/GDD.md)
- [Product Decisions](docs/DECISIONS.md)

### Product and gameplay

- [Combat & Gameplay](docs/GAMEPLAY.md)
- [Multiplayer & Social PvP](docs/MULTIPLAYER.md)
- [Progression & Economy](docs/PROGRESSION.md)
- [MVP & Roadmap](docs/MVP_ROADMAP.md)

### Production and implementation

- [Technical Architecture](docs/TECHNICAL_ARCHITECTURE.md)
- [Godogen / Codex Workflow](docs/GODOGEN_WORKFLOW.md)
- [Asset Manifest + Generation Prompts](docs/ASSET_MANIFEST.md)
- [Art Bible](docs/ART_BIBLE.md)
- [Visual Direction](docs/VISUAL_DIRECTION.md)

## Target architecture

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

Web and Android are two clients of the same game. Competitive outcomes, matchmaking, battle state, rating and rewards must remain server-authoritative.

## Repository layout direction

The Godot project remains at repository root for Godogen compatibility. New tracks are added alongside it:

```text
/
├── project.godot
├── CosmicFight.csproj
├── scenes/
├── scripts/
├── assets/
├── web/
├── server/
└── docs/
```

## Current implementation status

Completed:

- full GDD and supporting design docs;
- visual direction / Art Bible / Asset Manifest;
- Godogen/Codex integration;
- Godot 4.7.2 .NET bootstrap;
- portrait Godot scene and procedural placeholders;
- portable NuGet restore;
- build/import/headless/runtime validation.

Not implemented yet:

- real combat loop;
- Web client;
- authoritative server;
- accounts/persistence;
- online presence/matchmaking;
- real PvP;
- production assets;
- Android export/AAB pipeline.

## Immediate next phase

**Phase 1 — Web combat prototype.**

Build a mobile-first browser battle in `web/` with placeholders and the documented five actions. Use a deterministic local model and AI only long enough to validate readability and the turn loop. Do not build full progression or networking before the basic fight feels worthwhile.

After the Web combat loop is validated, build the shared authoritative ASP.NET Core server and connect real Web PvP. Android then connects to that same backend rather than inventing a second game implementation.

## Asset production policy

The project uses these states:

`MISSING` → `PLACEHOLDER` → `GENERATED` → `APPROVED` → `FINAL`

The visual source of truth is:

1. `docs/ART_BIBLE.md`
2. `docs/VISUAL_DIRECTION.md`
3. approved references under `docs/images/`
4. per-asset specification/prompt in `docs/ASSET_MANIFEST.md`

Placeholders are preferred during mechanics development. Godogen/Codex should validate one representative asset in the running game before mass-producing the rest of a category. Paid generation must not be triggered automatically.

## Godogen role

Godogen remains useful primarily for the **Godot/Android track**: Godot-specific agent instructions, build/run/visual-proof workflow, scene generation and asset iteration. Ordinary Web and ASP.NET Core development does not depend on Godogen.

## Working tagline

**Fight smart. Upgrade. Conquer.**
