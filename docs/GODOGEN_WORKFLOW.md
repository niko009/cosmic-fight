# Godogen / Codex Implementation Workflow

This document defines how Godogen/Codex should approach the **Godot/Android track** of Cosmic Fight.

The product documentation in this repository is authoritative. The agent is an implementation partner, not the product owner.

## Current development order

Read `docs/DEVELOPMENT_STRATEGY.md` first.

```text
Web modular combat prototype
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

Godogen is **not required** for ordinary Web or ASP.NET Core work. Its main role is Godot-specific implementation, scene/build/runtime iteration, asset workflow and visual proof.

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

Prefer the latest documented decision when older docs/examples conflict.

## Combat direction lock

The current authoritative combat direction is **targeted modular ship destruction**.

Do not revert Android implementation to the older abstract five-button model.

When Android implementation resumes, it should support the validated server-driven mechanics, including as applicable:

- visible/selectable ship modules;
- Core/Power, Engines, Weapons, Armor, Hull, Sensors and validated structural nodes;
- weapon selection;
- precise enemy-module targeting;
- targeted friendly-module Repair;
- module HP/state;
- local armor coverage;
- Fire / Electrical Short / validated statuses;
- functional consequences from damaged systems;
- authoritative power/module graph state;
- Victory / Defeat / Rematch.

`Defend`, `Charge`, active Shields, Energy and Special abilities are expansion candidates only if later product decisions add them.

## Do not prematurely continue the Godot combat phase

The Godot project has completed its bootstrap milestone.

Unless explicitly requested, do not build a separate local Android battle engine while the Web-first validation phases are underway.

When Android work resumes, consume the already-validated server rules and shared protocol. Do not create a second authoritative battle engine in the client.

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

For new assets, prompts should describe:

- gameplay purpose;
- visual subject;
- Art Bible relationship;
- style/material/color language;
- camera/view;
- background/transparency requirements;
- technical constraints;
- mobile readability;
- negative constraints such as no logo/text/franchise resemblance.

Store prompts in `ASSET_MANIFEST.md` next to their asset records.

## Paid asset generation rule

Do not invoke paid generation simply because the pipeline supports it.

Before first paid generation in a work session:

- identify exact Asset IDs;
- identify proposed provider/tool;
- identify/estimate possible cost where practical;
- obtain required user confirmation.

If paid generation is not approved, use placeholders and continue.

## Placeholder-first development

Useful placeholders include:

- primitive/procedural modular ship geometry;
- simple module hit regions;
- colored materials by module/state;
- basic beams/projectiles;
- procedural explosion/fire/short effects;
- vector icon placeholders;
- minimal space background;
- temporary/silent audio.

A placeholder succeeds when it proves gameplay/layout without locking code to temporary art.

## Canonical asset path rule

Gameplay/scene code should reference stable logical/canonical paths wherever practical.

When approved art replaces a placeholder, prefer the same resource contract or one centralized mapping change.

## Art consistency gate

Never mass-produce a category before validating one representative asset in-game.

For modular combat specifically, validate not only beauty but also **target readability**: the player must be able to understand and select relevant systems at game camera distance.

## Runtime proof rule

A clean compile is not completion.

For every meaningful Godot milestone:

1. build;
2. import assets;
3. run;
4. inspect visible behavior;
5. identify defects;
6. fix;
7. run again.

Use Godogen capture/proof workflow where appropriate.

## Android implementation target when this track resumes

The Android client should implement the validated game/server contracts rather than the old bootstrap placeholder concept.

Target capabilities:

- Godot 4 .NET / C#;
- battle orientation chosen from Web/mobile usability evidence;
- readable modular ships;
- touch-friendly module targeting;
- weapon selector;
- Repair mode;
- module/status HUD;
- authoritative battle snapshots/events;
- realtime PvP;
- reconnect/background-resume;
- production VFX/assets;
- Android export/AAB/device QA.

## Documentation maintenance

Keep synchronized when applicable:

- `README.md` — current status;
- `DEVELOPMENT_STRATEGY.md` — implementation order;
- `ASSET_MANIFEST.md` — asset status/source/prompt;
- `DECISIONS.md` — actual product/technical decisions;
- `MVP_ROADMAP.md` — milestone status;
- technical docs — architecture changes.

Do not casually rewrite the GDD because implementation details differ.

## Asset source tracking

For accepted generated assets record at minimum:

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

Approved/final game assets are intended to be version-controlled unless a later storage policy changes that decision.

The Godot project remains at repository root for Godogen compatibility while `web/` and `server/` live alongside it.

## Definition of done for a Godot milestone

A Godot milestone is complete only when:

- code builds;
- Godot imports successfully;
- runtime has no blocking errors;
- required gameplay works visibly;
- selected mobile orientation/aspect ratios are checked;
- module targeting is touch-usable;
- relevant assets/placeholders are registered;
- shared server contracts are respected;
- documentation reflects current state;
- the running result has been visually verified.
