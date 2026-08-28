# Product Decisions Log

This file records agreed direction so future implementation agents do not silently redesign the product.

## 2026-08-28 — Name

**Decision:** project/game working name is **Cosmic Fight**.

Repository: `niko009/cosmic-fight`.

## 2026-08-28 — Core game

**Decision:** 1v1 PvP spaceship battles are the product core.

Players spawn opposing ships and take turns attacking/defending while upgrading their ship, weapon, armor, shield/reactor systems, and special modules over time.

## 2026-08-28 — Combat style

**Decision:** tactical turn-based combat rather than pure automatic alternating fire.

Baseline actions:

- Attack
- Defend
- Charge
- Repair
- Special

## 2026-08-28 — Match duration

**Decision:** target 2–4 minutes, roughly 6–12 turns.

A sudden-death/Solar-Storm mechanic prevents endless defensive matches.

## 2026-08-28 — Multiplayer social layer

**Decision:** show live online players and allow direct duel invitations.

Required flow:

- see online players;
- challenge specific opponent;
- accept/decline;
- enter battle;
- reconnect if connection drops;
- rematch after result.

Also planned: Quick Battle and Ranked.

## 2026-08-28 — Server authority

**Decision:** combat is server-authoritative. Client sends action intent; server calculates outcome.

Web and Android clients are presentations of the same authoritative game, not separate competitive implementations.

## 2026-08-28 — Web-first validation strategy

**Decision:** implementation order is now **Web first → shared authoritative server → Web PvP alpha → Android Godot client**.

Reasoning:

- browser testing does not require a Google Play developer account;
- testers can join immediately from a URL;
- Web UI/combat iteration is faster to distribute;
- real PvP can be validated before Android store/export work;
- server, combat contracts, matchmaking and persistence are reused by Android.

The already-created Godot project is retained as the Android-client foundation and is **not** discarded.

Immediate next phase: `docs/DEVELOPMENT_STRATEGY.md` Phase 1 — Web combat prototype.

## 2026-08-28 — Shared backend/client architecture

**Decision:** one shared backend serves both Web and Android.

Direction:

- Web: TypeScript + Vite + Babylon.js, mobile-first;
- Server: ASP.NET Core + PostgreSQL + SignalR/WebSocket + Docker;
- Android: Godot 4 .NET / C#;
- Web deployment target when ready: `cosmic-fight.bacus.dev`.

Competitive truth belongs to the server: action validation, battle resolution, turn state, results, rating and rewards.

Do not create separate authoritative combat rules for Web and Android.

## 2026-08-28 — Repository layout

**Decision:** keep the existing Godot project at repository root for Godogen compatibility. Add Web and server tracks alongside it.

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

Do not reorganize/move the Godot root casually.

## 2026-08-28 — Progression fairness

**Decision:** progression may improve/expand builds, but competitive design should avoid pure pay-to-win or massive stat gaps. Matchmaking/rating and power score will guard fairness.

## 2026-08-28 — Platform/engine direction

**Decision:** Cosmic Fight targets both Web and Android.

- Web is the first validation/client track.
- Android remains a primary production platform using Godot 4 .NET / C#.
- Both use the same backend and gameplay contracts.

## 2026-08-28 — Visual direction

**Decision:** retain the generated premium sci-fi concepts as visual targets:

- large hero ships;
- dark space battlefield;
- blue local-player language;
- red hostile/damage language;
- strong shield/hull impact VFX;
- premium metallic HUD;
- vertically composed mobile battle screen.

## 2026-08-28 — Asset production workflow

**Decision:** Cosmic Fight uses a manifest-driven, placeholder-first asset workflow.

Godogen/Codex must not freely invent and mass-generate final assets during implementation.

Required rules:

- `docs/ART_BIBLE.md` defines the shared visual language;
- `docs/ASSET_MANIFEST.md` defines canonical Asset IDs, paths, formats, technical requirements, and generation prompts;
- new required assets should be registered in the manifest before production generation;
- placeholders are allowed and preferred during early gameplay development;
- gameplay code should use stable paths/resource contracts so approved assets can replace placeholders with minimal code changes;
- one representative asset should be validated in the running game before mass-producing a category;
- paid generation must not be triggered automatically simply because Godogen supports external generators;
- accepted generated assets must record provider/source and prompt/version;
- approved/final production assets are intended to be version-controlled unless a later explicit storage policy changes this.

Asset states:

`MISSING` → `PLACEHOLDER` → `GENERATED` → `APPROVED` → `FINAL`.

Where technically appropriate, assets should be reusable across Web and Android.

## 2026-08-28 — Godogen role

**Decision:** Godogen/Codex is primarily an implementation and iteration system for the Godot/Android track, not the owner of product direction.

Godogen is useful for Godot-specific scene generation, build/run/visual-proof loops and asset workflow. Web and ASP.NET Core development do not depend on Godogen.

Godogen must still read the existing GDD, decisions, visual references, Art Bible and Asset Manifest before Android implementation.

## 2026-08-28 — Scope control

**Decision:** friends, spectators, private rooms, tournaments, clans, text chat, and deep live-service systems are post-MVP unless needed for a specific test.

Progression/economy is also postponed until the basic Web PvP loop and server reliability are proven.
