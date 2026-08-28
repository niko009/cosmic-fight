# Godogen / Codex Implementation Workflow

This document defines how Godogen/Codex should approach Cosmic Fight.

The product documentation in this repository is authoritative. The agent is an implementation partner, not the product owner.

## Mandatory read order

Before modifying gameplay code or generating assets, read:

1. `README.md`
2. `docs/GDD.md`
3. `docs/GAMEPLAY.md`
4. `docs/MULTIPLAYER.md`
5. `docs/PROGRESSION.md`
6. `docs/TECHNICAL_ARCHITECTURE.md`
7. `docs/MVP_ROADMAP.md`
8. `docs/VISUAL_DIRECTION.md`
9. `docs/ART_BIBLE.md`
10. `docs/ASSET_MANIFEST.md`
11. `docs/DECISIONS.md`

If implementation choices conflict with these documents, prefer the documented product decision unless a later explicit instruction overrides it.

## Phase 0 — Asset and implementation preparation

Before full gameplay implementation:

1. inspect the complete GDD and visual direction;
2. review `ASSET_MANIFEST.md`;
3. expand the manifest only when a genuinely required MVP asset is missing;
4. preserve stable Asset IDs and canonical paths;
5. create lightweight placeholders where practical;
6. do **not** mass-generate final/paid assets;
7. record placeholder state in the manifest;
8. verify the project can replace placeholders with approved assets without major gameplay-code changes.

### Asset prompt responsibility

When a new asset is required, Godogen/Codex should create or refine a generation prompt containing:

- purpose in the game;
- exact visual subject;
- relationship to the Art Bible;
- required style/material/color language;
- camera/view if relevant;
- background/transparency requirements;
- technical constraints;
- mobile-readability constraints;
- negative constraints such as no logo, no text, no franchise resemblance.

Prompts should be stored in `ASSET_MANIFEST.md` next to their corresponding asset records.

## Paid asset generation rule

Do not invoke paid external generation simply because the pipeline supports it.

Before the first paid generation in a work session:

- identify the exact Asset IDs to generate;
- explain which provider/tool is proposed;
- estimate/identify whether generation may incur cost where possible;
- request user confirmation if required by the Godogen runtime.

If paid generation is not approved, use placeholders and continue implementation.

## Placeholder-first development

Placeholders are expected during early phases.

Examples:

- primitive/procedural ship mesh;
- colored material for hull class;
- simple beam for laser;
- simple sphere/projectile for plasma;
- procedural shield ripple;
- vector icon placeholders;
- minimal space background;
- silent or basic temporary audio.

A placeholder is successful when it proves gameplay/layout without locking the code to temporary art.

## Canonical asset path rule

Gameplay and scene code should reference stable logical/canonical paths wherever practical.

Do not scatter hard-coded temporary filenames across gameplay code.

When an approved asset replaces a placeholder, prefer:

```text
same path / same resource contract
```

or one centralized mapping update rather than multiple code edits.

## Art consistency gate

Never mass-produce a full category before validating one representative asset in-game.

Example:

1. create/obtain Scout ship candidate;
2. import into Godot;
3. verify scale, orientation, materials, readability and lighting;
4. compare with `ART_BIBLE.md`;
5. only then use the validated direction for Fighter and Destroyer.

Apply the same pattern to icons, rank badges, VFX and portraits.

## Runtime proof rule

A clean compile is not completion.

For every meaningful gameplay or visual milestone:

1. build;
2. import assets;
3. run the game;
4. inspect visible behavior;
5. identify defects;
6. fix them;
7. run again.

Use Godogen's capture/proof workflow where appropriate.

## Phase 1 implementation target

The first playable milestone should be intentionally small:

- Godot 4 .NET / C# project boots cleanly;
- portrait mobile battle scene;
- one placeholder player ship;
- one placeholder enemy ship;
- HP, Shield, Energy UI;
- Attack / Defend / Charge / Repair / Special actions;
- deterministic local battle state;
- basic AI opponent;
- turn timer;
- victory/defeat;
- simple combat VFX;
- no production multiplayer backend yet;
- no mass asset generation.

Goal: prove that the core combat loop is fun/readable before building the full online layer.

## Phase 2 target

After local combat is proven:

- implement authoritative server foundation;
- online presence;
- online player list;
- direct challenge flow;
- accept/decline;
- battle room;
- synchronized turns;
- reconnect handling;
- rematch;
- battle result persistence.

## Documentation maintenance

The agent must keep documentation synchronized with implementation.

Update when applicable:

- `README.md` — current project status;
- `ASSET_MANIFEST.md` — asset status/source/prompt;
- `DECISIONS.md` — only when a real product/technical decision changes;
- `MVP_ROADMAP.md` — milestone completion/status;
- technical docs — when architecture actually changes.

Do not rewrite the GDD casually just because implementation details differ.

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

For manually supplied assets, record source/ownership notes instead of an AI prompt if applicable.

## Repository rule after Godogen publish

After `publish.sh --engine godot --agent codex` is run, inspect `.gitignore`.

If it ignores the entire `assets/` directory, adjust the repository policy before production assets are added. Cosmic Fight intends to version-control approved/final game assets unless a later explicit storage policy changes that decision.

## Definition of done for any milestone

A milestone is complete only when:

- code builds;
- Godot imports successfully;
- runtime has no blocking errors;
- required gameplay works visibly;
- mobile layout is checked;
- relevant placeholders/production assets are registered;
- documentation reflects current state;
- the running result has been visually verified.
