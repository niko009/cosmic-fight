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

## 2026-08-28 — Scope control

**Decision:** friends, spectators, private rooms, tournaments, clans, text chat, and deep live-service systems are post-MVP unless needed for a specific test.
