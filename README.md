# Cosmic Fight

**Cosmic Fight** is a mobile-first tactical 1v1 PvP game about building, upgrading, and commanding a custom starship in short turn-based online duels.

> Build your ship. Challenge live players. Outplay your rival.

## Core fantasy

Players assemble a ship from hull, weapon, shield, armor, reactor, and special-module systems, then enter the online arena. They can see available pilots, challenge a specific player, accept or decline invitations, use quick matchmaking, and fight authoritative server-controlled battles.

Matches target **2–4 minutes** and focus on readable tactical decisions rather than twitch execution. Each turn a player chooses between actions such as **Attack, Defend, Charge, Repair, and Special** while managing energy, shields, cooldowns, critical hits, and system damage.

## Project status

**Stage:** pre-production / game-design lock / Godogen preparation.

The repository contains the initial Game Design Document, gameplay rules, multiplayer design, progression/economy, technical architecture, MVP roadmap, visual direction, Art Bible, canonical MVP Asset Manifest, and the required Godogen/Codex implementation workflow.

## Documentation

### Product and gameplay

- [Game Design Document](docs/GDD.md)
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
- [Product Decisions](docs/DECISIONS.md)

## Mandatory agent workflow

Godogen/Codex should **not** immediately mass-generate assets or jump into full multiplayer implementation.

Required sequence:

```text
Read GDD and decisions
        ↓
Read Visual Direction + Art Bible
        ↓
Review/extend Asset Manifest
        ↓
Create stable asset paths + placeholders
        ↓
Build first local playable battle
        ↓
Run and visually verify in Godot
        ↓
Replace placeholders with approved assets gradually
        ↓
Only after core combat is proven: build online PvP layer
```

Every required MVP asset should have a stable Asset ID/path and, where generation is appropriate, a reusable generation prompt in `docs/ASSET_MANIFEST.md`.

Placeholders are preferred over blocking development on final art. Approved assets should be replaceable without rewriting gameplay code.

External paid generation must not be triggered automatically merely because Godogen supports it.

## Asset production policy

The project uses these states:

`MISSING` → `PLACEHOLDER` → `GENERATED` → `APPROVED` → `FINAL`

The visual source of truth is:

1. `docs/ART_BIBLE.md`
2. `docs/VISUAL_DIRECTION.md`
3. the approved reference images under `docs/images/`
4. the per-asset specification and prompt in `docs/ASSET_MANIFEST.md`

Godogen/Codex should validate one representative asset in the running game before mass-producing the rest of the category.

## Current product direction

- Genre: tactical turn-based spaceship PvP
- Primary platform: Android / mobile-first
- Engine direction: Godot 4 .NET / C#
- Match format: 1v1
- Session length: 5–10 minutes
- Match length: 2–4 minutes
- Multiplayer: live presence, direct challenges, quick match, ranked
- Monetization direction: cosmetic-first, no pay-to-win competitive advantage
- Art production: placeholder-first, manifest-driven, consistent prompts and stable paths

## First implementation milestone

The first playable build should prove the combat loop before backend complexity:

- portrait battle scene;
- one player ship and one enemy ship using placeholders if needed;
- HP / Shield / Energy;
- Attack / Defend / Charge / Repair / Special;
- deterministic local state;
- basic AI opponent;
- turn timer;
- victory/defeat;
- simple VFX;
- runtime visual verification.

Then the project moves into multiplayer infrastructure and live challenge flow.

## Visual target

The approved concept direction is a premium dark sci-fi presentation with high-contrast blue/red combat readability, large hero ships, readable mobile HUD, impactful weapon VFX, visible shield/hull damage, and a polished hangar/online-arena interface. See [docs/VISUAL_DIRECTION.md](docs/VISUAL_DIRECTION.md).

## Important Godogen repository note

After publishing Godogen into this repository, inspect `.gitignore`. Godogen's helper may ignore `assets/` by default. Cosmic Fight intends to version-control approved/final production assets unless a later explicit asset-storage policy changes that decision.

## Working tagline

**Fight smart. Upgrade. Conquer.**
