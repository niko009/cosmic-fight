# MVP & Production Roadmap

## Philosophy

Do not build the whole live-service vision before proving the duel is fun.

## Phase 0 — Pre-production

Deliverables:

- GDD baseline;
- visual direction;
- combat rules;
- data model sketch;
- prototype scope;
- Godot/Codex/Godogen development environment.

Exit criterion: team can describe the exact first playable duel and screens.

## Phase 1 — Offline combat prototype

Build:

- one arena;
- one player ship + one enemy ship presentation;
- three hull archetypes represented in data;
- four weapons in data;
- shield, armor, reactor, one special-module path;
- Attack / Defend / Charge / Repair / Special;
- energy;
- HP/shield;
- critical/system damage prototype;
- simple AI opponent;
- battle result;
- mobile portrait UI.

Goal: determine whether the turn loop is fun before networking.

Exit criteria:

- repeated 2–4 minute battles;
- no dominant always-correct action;
- at least 3 distinct viable builds;
- visual state is understandable without debug text.

## Phase 2 — Online foundation / closed alpha

Build:

- accounts;
- server persistence;
- realtime connection;
- online presence;
- Online Arena list;
- direct challenge;
- accept/decline;
- authoritative battle room;
- reconnect;
- rematch;
- basic match history.

Exit criterion: two real remote players can repeatedly complete matches without state divergence.

## Phase 3 — PvP beta

Build:

- Quick Battle;
- Ranked matchmaking;
- rating;
- leagues;
- progression rewards;
- upgrade flow;
- inventory/equip UX;
- starter economy;
- telemetry;
- balance iteration.

Exit criterion: enough systems exist to test retention and competitive balance.

## Phase 4 — Soft launch

Build/polish:

- onboarding;
- performance and Android compatibility;
- crash/analytics monitoring;
- content polish;
- improved matchmaking;
- economy tuning;
- moderation/reporting minimums;
- store listing assets;
- limited-region release if appropriate.

Measure:

- D1/D7 retention;
- match completion;
- average queue time;
- average battles/session;
- battle duration;
- disconnect rate;
- loadout diversity;
- ranked distribution.

## Phase 5 — Live expansion

Candidate features only after core validation:

- friends;
- private rooms;
- spectator mode;
- seasonal ranks;
- cosmetic store;
- tournaments;
- clans;
- additional hulls/weapons/modules;
- events;
- replays;
- iOS / other platforms.

## MVP feature lock

Required for first meaningful online test:

### Combat
- 3 hulls
- 4 weapons
- shield/armor/reactor
- special module system
- 5 turn actions
- critical/system damage
- sudden death

### Multiplayer
- account
- presence
- player list
- challenge
- accept/decline
- battle room
- reconnect
- rematch
- quick match
- ranked rating (can arrive shortly after first closed alpha)

### Progression
- credits
- XP
- equipment upgrades
- power score
- rating/league

### UI
- Home
- Hangar
- Online Arena
- Battle
- Result
- Profile/basic settings

## Explicit post-MVP list

- unrestricted chat
- clans
- tournaments
- spectator
- marketplace/trading
- 2v2
- story campaign
- battle pass
- deep crafting
- dozens of ship classes
