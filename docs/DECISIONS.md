# Product Decisions Log

This file records agreed direction so future implementation agents do not silently redesign the product.

## 2026-08-28 — Name

**Decision:** project/game working name is **Cosmic Fight**.

Repository: `niko009/cosmic-fight`.

## 2026-08-28 — Core game

**Decision:** 1v1 PvP spaceship battles are the product core.

Players build and upgrade modular ships, enter short turn-based duels, and win by making better targeting, weapon and repair decisions than the opponent.

## 2026-08-28 — Combat direction updated from supplied reference prototype

**Decision:** the central combat mechanic is now **targeted modular destruction**, inspired by the supplied Space Busters-style HTML prototype.

This replaces the earlier assumption that the game is primarily five abstract actions (`Attack / Defend / Charge / Repair / Special`).

The defining turn is now:

1. choose a weapon;
2. choose a specific enemy module;
3. resolve damage/status/system consequences;
4. opponent acts.

Or:

1. choose Repair;
2. choose a damaged friendly module;
3. consume repair resource and the turn.

Core module families for the first prototype:

- Core / Power;
- Engines;
- Weapons;
- Armor;
- Hull / Structure;
- Sensors;
- Wings/auxiliary structure where useful.

Damage must be functional:

- Engines affect accuracy/efficiency;
- Weapons affect available offense;
- Sensors affect targeting;
- Armor physically protects linked modules and can be destroyed;
- Core/Power can disable connected systems and cause cascade damage;
- Hull/structure can create stress/cascade consequences.

Initial weapons:

- Laser;
- Missile;
- Scatter weapon;
- Plasma.

Initial secondary effects include Fire and Electrical Short. Structural Stress/cascade effects are also allowed where they remain readable.

Repair is targeted and uses a limited resource/repair-kit concept.

The first prototype should also include a small upgrade-point screen so players can improve Core, Engines, Weapons, Armor, Sensors, Hull, Fire Protection and Electrical Shielding between battles.

`Defend`, `Charge`, active Shields, Energy and Special abilities are **not deleted from the design universe**. They are moved to later expansion candidates and should only be added after targeted module combat is proven fun.

## 2026-08-28 — Victory-rule flexibility

**Decision:** Core destruction is a major tactical event but is not yet locked as an automatic instant win.

Phase 1 should test a more physical "cripple/destroy the ship" rule where Core destruction causes severe power/cascade consequences while a damaged ship can sometimes continue fighting.

If playtests strongly favor a simpler "destroy the Core to win" objective, the rule can be promoted later.

## 2026-08-28 — Orientation no longer hard-locked

**Decision:** mobile-first remains important, but battle orientation is no longer fixed to portrait.

The supplied reference works naturally as a wide left-vs-right modular battlefield, and precise module targeting may benefit from landscape on phones.

Phase 1 Web should test responsive wide/narrow layouts. Android orientation will be chosen after usability testing.

## 2026-08-28 — Match duration

**Decision:** target 2–4 minutes.

A Solar Storm/sudden-death rule remains available only if repair/crippled-ship states make battles too long.

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

**Decision:** combat is server-authoritative. Client sends intent; server calculates outcome.

For modular combat the server owns:

- legal target;
- weapon availability;
- accuracy/RNG;
- local armor absorption;
- module damage;
- Fire/Short/Stress;
- cascade damage;
- repair resource/use;
- power graph/state;
- turn and victory result.

Web and Android clients are presentations of the same authoritative game.

## 2026-08-28 — Web-first validation strategy

**Decision:** implementation order is **Web first → shared authoritative server → Web PvP alpha → Android Godot client**.

Reasoning:

- browser testing does not require a Google Play developer account;
- testers can join immediately from a URL;
- Web iteration is faster to distribute;
- real PvP can be validated before Android packaging/store work;
- server and combat contracts are reused by Android.

The existing Godot project is retained as the Android-client foundation.

Immediate next phase: `docs/DEVELOPMENT_STRATEGY.md` Phase 1 — Web modular combat prototype.

## 2026-08-28 — Shared backend/client architecture

**Decision:** one shared backend serves both Web and Android.

Direction:

- Web: TypeScript + Vite + Babylon.js where useful, responsive/mobile-aware;
- Server: ASP.NET Core + PostgreSQL + SignalR/WebSocket + Docker;
- Android: Godot 4 .NET / C#;
- Web deployment target when ready: `cosmic-fight.bacus.dev`.

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

## 2026-08-28 — Progression fairness

**Decision:** progression may improve/expand builds, but competitive design should avoid pure pay-to-win or massive stat gaps. Matchmaking/rating and power score will guard fairness.

## 2026-08-28 — Platform/engine direction

**Decision:** Cosmic Fight targets both Web and Android.

- Web is the first validation/client track.
- Android remains a primary production platform using Godot 4 .NET / C#.
- Both use the same backend and gameplay contracts.

## 2026-08-28 — Visual direction

**Decision:** keep the premium sci-fi visual target, but do not force the old portrait composition if targeted modular combat reads better in a wider layout.

Important visual goals remain:

- large readable ships;
- dark space battlefield;
- clear friendly/hostile language;
- visible module damage;
- strong weapon/impact feedback;
- readable repair/status feedback;
- premium UI rather than debug-looking modules in final art.

## 2026-08-28 — Asset production workflow

**Decision:** Cosmic Fight uses a manifest-driven, placeholder-first asset workflow.

Required rules:

- `docs/ART_BIBLE.md` defines the shared visual language;
- `docs/ASSET_MANIFEST.md` defines Asset IDs, paths, formats, technical requirements and generation prompts;
- register new required assets before production generation;
- placeholders are preferred during mechanics development;
- use stable paths/contracts so final assets can replace placeholders;
- validate one representative asset in-game before mass-producing a category;
- do not trigger paid generation automatically;
- accepted generated assets record source/provider and prompt/version;
- approved/final assets are intended to be version-controlled unless policy changes.

Asset states:

`MISSING` → `PLACEHOLDER` → `GENERATED` → `APPROVED` → `FINAL`.

Where practical, assets should be reusable across Web and Android.

## 2026-08-28 — Godogen role

**Decision:** Godogen/Codex is primarily an implementation and iteration system for the Godot/Android track, not the owner of product direction.

Godogen is useful for Godot scene generation, build/run/visual-proof loops and asset workflow. Web and ASP.NET Core development do not depend on Godogen.

## 2026-08-28 — Scope control

**Decision:** friends, spectators, private rooms, tournaments, clans, text chat and deep live-service systems are post-MVP unless required for a specific test.

Permanent progression/economy is also postponed until the basic Web combat and PvP loop is proven.
