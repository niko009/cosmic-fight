# Godogen / Codex Implementation Workflow

This document defines how Godogen/Codex should approach the **Godot/Android track** of Cosmic Fight.

The product documentation in this repository is authoritative. The agent is an implementation partner, not the product owner.

## Current development order

Read `docs/DEVELOPMENT_STRATEGY.md` first.

The current project order is:

```text
Web combat prototype
        ↓
Authoritative ASP.NET Core server
        ↓
Web PvP alpha
        ↓
Progression / competitive beta
        ↓
Android Godot client using the same backend
```

The existing Godot bootstrap is intentionally retained while Web/server development proceeds.

Godogen is **not required** for ordinary Web or ASP.NET Core development. Its main role is Godot-specific implementation, scene/build/runtime iteration, asset workflow and visual proof.

## Mandatory read order for Godot work

Before modifying Godot gameplay code or generating assets, read:

1. `README.md`
2. `docs/DEVELOPMENT_STRATEGY.md`
3. `docs/GDD.md`
4. `docs/GAMEPLAY.md`
5. `docs/MULTIPLAYER.md`
6. `docs/PROGRESSION.md`
7. `docs/TECHNICAL_ARCHITECTURE.md`
8. `docs/MVP_ROADMAP.md`
9. `docs/VISUAL_DIRECTION.md`
10. `docs/ART_BIBLE.md`
11. `docs/ASSET_MANIFEST.md`
12. `docs/DECISIONS.md`

If implementation choices conflict with these documents, prefer the latest documented decision unless a later explicit user instruction overrides it.

## Do not prematurely continue the Godot combat phase

The Godot project has completed its bootstrap milestone.

Unless explicitly requested, do **not** spend significant effort implementing a separate local Godot combat system while the Web-first validation phases are underway.

When Android implementation resumes, use the already-validated server combat rules and shared protocol. Do not create a second authoritative battle engine in the Android client.

## Asset and implementation preparation

Before production Godot asset work:

1. inspect the complete GDD and visual direction;
2. review `ASSET_MANIFEST.md`;
3. expand the manifest only when a genuinely required asset is missing;
4. preserve stable Asset IDs and canonical paths;
5. create lightweight placeholders where practical;
6. do **not** mass-generate final/paid assets;
7. record placeholder state in the manifest;
8. verify approved assets can replace placeholders without major gameplay-code changes.

### Asset prompt responsibility

When a new asset is required, create/refine a generation prompt containing:

- purpose in the game;
- exact visual subject;
- relationship to the Art Bible;
- style/material/color language;
- camera/view if relevant;
- background/transparency requirements;
- technical constraints;
- mobile-readability constraints;
- negative constraints such as no logo, no text, no franchise resemblance.

Prompts belong in `ASSET_MANIFEST.md` next to their asset records.

## Paid asset generation rule

Do not invoke paid external generation simply because the pipeline supports it.

Before first paid generation in a work session:

- identify exact Asset IDs;
- identify proposed provider/tool;
- identify/estimate possible cost where practical;
- obtain required user confirmation.

If paid generation is not approved, use placeholders and continue.

## Placeholder-first development

Useful placeholders include:

- primitive/procedural ship mesh;
- colored material by hull class;
- simple beam/projectile;
- procedural shield ripple;
- vector icon placeholders;
- minimal space background;
- temporary/silent audio.

A placeholder is successful when it proves gameplay/layout without locking code to temporary art.

## Canonical asset path rule

Gameplay and scene code should reference stable logical/canonical paths wherever practical.

Do not scatter hard-coded temporary filenames across gameplay code.

When an approved asset replaces a placeholder, prefer the same path/resource contract or one centralized mapping change.

## Art consistency gate

Never mass-produce a full category before validating one representative asset in-game.

Example:

1. create/obtain Scout candidate;
2. import into Godot;
3. verify scale, orientation, materials, readability and lighting;
4. compare with `ART_BIBLE.md`;
5. only then use the validated direction for additional ships.

Apply the same pattern to icons, badges, VFX and portraits.

## Runtime proof rule

A clean compile is not completion.

For every meaningful Godot gameplay/visual milestone:

1. build;
2. import assets;
3. run the game;
4. inspect visible behavior;
5. identify defects;
6. fix them;
7. run again.

Use Godogen capture/proof workflow where appropriate.

## Android implementation target when this track resumes

The Android client should implement the already-validated game and server contracts:

- Godot 4 .NET / C#;
- portrait/mobile-first battle scene;
- HP / Shield / Energy UI;
- Attack / Defend / Charge / Repair / Special;
- server-authoritative battle snapshot/events;
- realtime PvP;
- reconnect/background-resume;
- Victory / Defeat / Rematch;
- validated production VFX/assets;
- Android export/AAB/device QA.

Do not duplicate server authority inside the client.

## Documentation maintenance

Keep documentation synchronized when applicable:

- `README.md` — current status;
- `DEVELOPMENT_STRATEGY.md` — current implementation order only when strategy changes;
- `ASSET_MANIFEST.md` — asset status/source/prompt;
- `DECISIONS.md` — real product/technical decisions;
- `MVP_ROADMAP.md` — milestone completion/status;
- technical docs — when architecture actually changes.

Do not casually rewrite the GDD because implementation details differ.

## Asset source tracking

For every accepted externally generated asset, record at minimum:

```text
Asset ID
Status
Provider/tool
Prompt or prompt version
Generation date
License/usage notes if known
Technical notes
```

For manually supplied assets, record source/ownership notes instead.

## Repository rule

Approved/final game assets are intended to be version-controlled unless a later explicit storage policy changes that decision.

The Godot project remains at repository root for Godogen compatibility while `web/` and `server/` are added alongside it.

## Definition of done for a Godot milestone

A Godot milestone is complete only when:

- code builds;
- Godot imports successfully;
- runtime has no blocking errors;
- required gameplay works visibly;
- mobile layout is checked;
- relevant placeholders/production assets are registered;
- shared server contracts are respected where applicable;
- documentation reflects current state;
- the running result has been visually verified.
