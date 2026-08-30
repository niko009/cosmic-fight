# Cosmic Fight

**Cosmic Fight** is a tactical 1v1 PvP game about building, upgrading, and dismantling modular starships in short turn-based duels.

> Choose a weapon. Target a system. Break the enemy ship apart.

## Core fantasy

Each ship is made from visible, damageable systems such as Core/Power, Engines, Weapons, Armor, Hull and Sensors. On a turn, the player chooses a weapon and targets a specific enemy module, or spends the turn repairing one of their own damaged modules.

Damage is functional, not cosmetic: broken engines hurt accuracy, destroyed weapons reduce firepower, damaged sensors hurt targeting, broken armor exposes protected systems, and power-network failures can disable modules that still have HP.

The finished game remains a short online 1v1 PvP experience with direct challenges, matchmaking, upgrades and progression. Web is the first validation client; Android/Godot follows on the same authoritative backend.

## Project status

**Stage:** playable Web vertical slice / authoritative PvP alpha / full-game Phase 0 in progress.

Current strategy:

```text
Playable Web combat + hangar + AI + PvP alpha
        ↓
Reliable persisted battles and automated coverage
        ↓
Builder 2.0 + Combat 2.0
        ↓
Solo campaign + competitive beta
        ↓
Godot Android client + launch readiness
```

The existing Godot 4.7.2 .NET/C# project is retained as the Android-client foundation.

## Documentation

### Start here

- [Development Strategy](docs/DEVELOPMENT_STRATEGY.md)
- [Full Game Roadmap](docs/FULL_GAME_ROADMAP.md)
- [Gameplay 2.0](docs/GAMEPLAY_2_0.md)
- [Game Design Document](docs/GDD.md)
- [Combat & Gameplay](docs/GAMEPLAY.md)
- [Product Decisions](docs/DECISIONS.md)

### Supporting docs

- [Multiplayer & Social PvP](docs/MULTIPLAYER.md)
- [Progression & Economy](docs/PROGRESSION.md)
- [MVP & Roadmap](docs/MVP_ROADMAP.md)
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
              |                       |
 cosmic-fight.bacus.dev          same backend/API
```

Web and Android are two clients of the same authoritative game. The server owns target validation, RNG, armor absorption, module damage, statuses, repair, battle state, rating and rewards.

## Repository layout direction

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

## Immediate phase

**Phase 0 — Reliable foundation.**

The playable slice already includes the Web hangar, modular AI combat, accounts, progression, presence, direct challenges and authoritative PvP. The next gate is reliability:

- persist active PvP battles across server restarts;
- make two-player settlement atomic and idempotent;
- add deterministic combat tests and two-client E2E coverage;
- add reconnect deadlines, surrender, rematch and history;
- expose explicit battle-end reasons;
- split the Web client into maintainable game-state modules.

The complete phase plan and version 1.0 scope are defined in [FULL_GAME_ROADMAP.md](docs/FULL_GAME_ROADMAP.md).

## Asset production policy

Asset states:

`MISSING` → `PLACEHOLDER` → `GENERATED` → `APPROVED` → `FINAL`

Placeholders are preferred during mechanics development. Final art follows `ART_BIBLE.md`, `VISUAL_DIRECTION.md` and `ASSET_MANIFEST.md`.

## Godogen role

Godogen remains useful primarily for the **Godot/Android track**: scene generation, build/run/visual-proof loops and asset iteration. Web and ASP.NET Core development do not depend on Godogen.
