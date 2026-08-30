# Implementation Status

## 2026-08-30 — Full-game plan and Phase 0

The project has moved from prototype planning to a phased full-game roadmap.

Documentation added:

- [FULL_GAME_ROADMAP.md](FULL_GAME_ROADMAP.md) — delivery phases, exit gates and version 1.0 content target;
- [GAMEPLAY_2_0.md](GAMEPLAY_2_0.md) — builder, combat, campaign, multiplayer, progression and interface rules.

Phase 0 starts with active-PvP persistence and atomic two-player settlement. This removes the current container-restart failure mode before Quick Match, Ranked or campaign state are added.

The next Phase 0 slices are:

1. deterministic combat-engine tests and replay-friendly RNG/action records;
2. structured battle-end reason and match/turn deadlines;
3. surrender, disconnect forfeit, rematch and match-history UI;
4. two-client browser E2E coverage;
5. Web client state/view decomposition.

## 2026-08-28 — Web + authoritative server

Implemented baseline:

- responsive TypeScript/Vite Web client;
- ASP.NET Core 9 authoritative server;
- PostgreSQL persistence;
- guest identity + Google OAuth account linking;
- credits, XP, rating, wins/losses and persistent upgrades;
- modular combat with Core, Engines, Weapons, Armor, Hull and Sensors;
- Laser, Missile, Scatter and Plasma;
- armor absorption, Fire, Electrical Short, targeted Repair and power consequences;
- health/version endpoints, Docker/Bacus deployment and PWA.

## 2026-08-28 — Hangar builder + live PvP alpha

The Web flow is now aligned with the supplied `space_busters.html` reference while keeping Cosmic Fight's own visual direction.

### Hangar

- Hangar is the default gameplay screen.
- Player can drag all visible ship modules around the ship body with pointer/touch input.
- Module positions are saved to PostgreSQL as the player's `loadout`.
- Player selects up to two equipped weapons from Laser / Missile / Scatter / Plasma.
- Equipped weapons and module placement are snapshotted into the authoritative battle state.
- Persistent upgrades remain server-backed.

### Online Arena

- SignalR presence tracks distinct online pilots, not browser tabs.
- Arena lists currently connected opponents and their availability.
- Direct Challenge creates a 30-second server-side invitation.
- Target player receives the invitation in real time.
- Target can Accept or Decline.
- Accept creates one shared authoritative PvP battle and marks both players `in_battle`.
- Both devices receive viewer-specific snapshots of the same canonical battle.
- Reconnecting a player reattaches them to an in-memory active battle while that server process still owns it.

### PvP authority

Clients submit only action intent:

```text
turn + fire/repair + equipped weapon + target module + client action id
```

The server owns:

- current turn and actor;
- equipped-weapon validation;
- target validation;
- hit/accuracy RNG;
- armor absorption;
- module damage;
- splash;
- Fire / Electrical Short;
- power recalculation;
- repairs;
- victory;
- rewards and rating settlement.

A PvP result is settled for both players once.

### Reliability status

Normal browser/network reconnect is supported. Phase 0 adds PostgreSQL-backed active-battle restoration so an unfinished PvP duel can also survive a server/container restart. Remaining competitive reliability work includes turn deadlines, disconnect forfeits and automated two-client coverage.

## Google OAuth production configuration

Google cloud identity requires server-side credentials:

```text
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=https://cosmic-fight.bacus.dev/auth/google/callback
```

With Google enabled, the same account on multiple devices receives the same player profile/loadout. Multiple devices signed into the **same** Google account count as one pilot; different accounts/guest sessions are separate pilots.

## Canonical next steps

See [FULL_GAME_ROADMAP.md](FULL_GAME_ROADMAP.md). Phase order is now:

`reliability → real builder → deeper combat → solo campaign → multiplayer beta → progression → presentation → Android`.
