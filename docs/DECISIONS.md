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

## 2026-08-28 — Progression fairness

**Decision:** progression may improve/expand builds, but competitive design should avoid pure pay-to-win or massive stat gaps. Matchmaking/rating and power score will guard fairness.

## 2026-08-28 — Platform/engine direction

**Decision:** mobile-first, Android first; Godot 4 .NET / C# is the current implementation direction.

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

## 2026-08-28 — Godogen role

**Decision:** Godogen/Codex is primarily an implementation and iteration system, not the owner of product direction.

It must read the existing GDD, decisions, visual references, Art Bible and Asset Manifest before full implementation.

The first implementation milestone is a local playable battle against basic AI using placeholders where needed. Full online PvP comes after the core combat loop is visually and mechanically proven.

## 2026-08-28 — Scope control

**Decision:** friends, spectators, private rooms, tournaments, clans, text chat, and deep live-service systems are post-MVP unless needed for a specific test.
