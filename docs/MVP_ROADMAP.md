# MVP & Production Roadmap

This file is retained as a short navigation document. The former prototype roadmap became stale after the Web client, authoritative server, accounts, progression and live PvP were implemented.

The canonical plan is now:

- [Full Game Roadmap](FULL_GAME_ROADMAP.md) — phases, scope and exit gates;
- [Gameplay 2.0](GAMEPLAY_2_0.md) — intended rules and player experience;
- [Implementation Status](IMPLEMENTATION_STATUS.md) — what exists in the repository today.

## Current stage

The current build is a playable vertical slice with:

- responsive Web hangar and battle UI;
- modular loadouts and persistent upgrades;
- AI battles;
- ASP.NET Core authoritative combat;
- PostgreSQL player/loadout/result persistence;
- SignalR presence, direct challenges and live PvP;
- reconnect while the current server process remains alive;
- production PWA deployment.

It is not yet a complete game. The first full-game milestone is Phase 0 reliability.

## Delivery phases

1. **Reliable foundation** — persistent active battles, atomic settlement, tests, deadlines and reconnect.
2. **Builder 2.0** — real grid, hardpoints, energy, mass, heat, topology and three hulls.
3. **Combat 2.0** — 8–10 systems, active actions, clear end reasons and 3–5 minute pacing.
4. **Solo campaign** — tutorial, three sectors, 25–30 encounters and three bosses.
5. **Multiplayer beta** — Quick Match, Ranked, rooms, rematch, history and leaderboard.
6. **Progression** — sidegrades, blueprints, quests, achievements, leagues and cosmetics.
7. **Presentation** — production art, audio, VFX, onboarding, accessibility and performance.
8. **Android and launch** — shared Godot client, account continuity, store build and operations.

## Version 1.0 lock

The intended first complete release contains:

- 3 hulls;
- 8–10 weapons and at least 8 utility/defense modules;
- a mechanically meaningful ship builder;
- tutorial and 25–30 encounter solo campaign;
- 3 bosses and 5 AI archetypes;
- Quick Match, Ranked and private rooms;
- reconnect, rematch, match history and leaderboard;
- fair sidegrade/cosmetic progression;
- Web and Android clients;
- complete audio and production combat VFX.

Anything beyond this list must not delay the current phase exit gate unless it fixes a demonstrated player or reliability problem.
