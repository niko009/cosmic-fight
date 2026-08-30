# Cosmic Fight — Full Game Roadmap

## Product goal

Cosmic Fight is a complete tactical game about designing a modular starship, reading the enemy build and disabling the systems that keep it combat-capable.

The target experience is:

- one meaningful decision before every battle;
- one meaningful target or recovery decision every turn;
- 3–5 minute battles with a normal range of 8–14 turns;
- a solo path that teaches the systems and provides 8–12 hours of authored progression;
- reliable competitive PvP with reconnect, history and fair matchmaking;
- the same authoritative rules on Web and Android.

This document is the delivery plan. Detailed rules live in [GAMEPLAY_2_0.md](GAMEPLAY_2_0.md). Current implementation truth lives in [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md).

## Product principles

1. **Build choices must change combat.** Module placement, mass, energy and adjacency cannot remain cosmetic.
2. **Damage must be readable.** A player should understand why a weapon missed, a module went offline or a battle ended.
3. **Short sessions, deep mastery.** Depth comes from interacting systems, not from 30-turn health attrition.
4. **Fair competition.** Ranked play normalizes permanent power; progression unlocks options and identity, not purchased victories.
5. **Reliability before breadth.** A smaller loop that survives reconnects and deployments is more valuable than unfinished content.
6. **Mobile is a first-class client.** Portrait and landscape each receive an intentional control layout.

## Phase overview

| Phase | Outcome | Exit gate |
|---|---|---|
| 0. Foundation | A battle is recoverable, testable and observable | No lost active PvP match after a server restart; deterministic engine suite passes |
| 1. Builder 2.0 | Ship construction creates real trade-offs | Grid, hardpoints, energy, mass and validation affect combat |
| 2. Combat 2.0 | Duels are shorter, clearer and more tactical | Median battle is 8–14 turns; every defeat has a visible reason |
| 3. Solo game | A complete first-player journey exists | Tutorial, 3 sectors, 3 bosses and 25–30 encounters are playable |
| 4. Multiplayer beta | PvP is convenient and competitive | Quick Match, Ranked, rooms, rematch, history, timer and reconnect are stable |
| 5. Progression | Players have long-term goals without pay-to-win | Sidegrade unlocks, quests, achievements and leagues work end-to-end |
| 6. Presentation | The game feels authored and alive | Final combat VFX/audio/haptics/onboarding pass desktop and mobile QA |
| 7. Android & launch | Shared game ships on Web and Android | Signed Android build, account continuity, telemetry and launch checklist pass |

## Phase 0 — Reliable foundation

### Scope

- persist active PvP battle snapshots in PostgreSQL;
- restore battle ownership and state after server/container restart;
- make PvP settlement atomic for both players;
- add deterministic RNG seeding and replay-friendly action records;
- add unit tests for damage, armor, statuses, power, repair and victory;
- add integration tests for create → act → settle → history;
- add a two-client browser test for challenge, full duel and reconnect;
- introduce turn deadline, surrender and disconnect outcome rules;
- expose structured end reason and server timestamps in battle snapshots;
- add structured logs and minimal battle telemetry;
- split the monolithic Web client into state, API, views and combat presentation modules.

### Exit criteria

- an unfinished PvP duel resumes after a deployment;
- one battle can never grant rewards twice;
- stale and duplicated actions do not corrupt state;
- a match cannot remain active forever;
- core combat rules have automated regression coverage;
- production errors identify battle ID, turn and action without exposing private data.

### First delivery slice

The first implementation slice is active-PvP persistence and atomic settlement. It establishes the storage contract needed by reconnect, rematch, history and ranked play.

## Phase 1 — Modular Builder 2.0

### Scope

- replace free cosmetic dragging with a hull grid and legal hardpoints;
- introduce three hulls: **Scout**, **Vanguard** and **Bastion**;
- give modules size, mass, energy draw, heat and placement rules;
- make power links and adjacency visible and mechanically relevant;
- add local armor arcs and exposed-module rules;
- validate builds on the authoritative server;
- support multiple named saved builds;
- add compare, auto-fix and undo/redo actions;
- design touch placement for both mobile orientations.

### Initial hull identities

| Hull | Strength | Cost |
|---|---|---|
| Scout | speed, evasion, flexible utility | low armor and few large hardpoints |
| Vanguard | balanced energy, armor and weapon layout | no extreme specialization |
| Bastion | armor, heavy weapons and repair capacity | mass, heat and poor evasion |

### Exit criteria

- moving or replacing a module can alter energy, accuracy, protection or survivability;
- every invalid build explains the exact problem and offers a repair path;
- all three hulls support at least two viable archetypes;
- a new player can produce a valid ship on mobile without documentation.

## Phase 2 — Combat 2.0

### Scope

- define per-turn energy and weapon cooldowns;
- add heat and cooling as a visible tactical constraint;
- add limited ammunition where it strengthens weapon identity;
- add active actions: Defend, Scan, Redirect Power and Emergency Repair;
- expand to 8–10 combat systems, including Railgun, EMP, Drone and Ion weaponry;
- add active shield/defensive pulse as a counterplay layer;
- introduce AI archetypes: sniper, missile hunter, tank, saboteur and mechanic;
- tune damage and repair toward 8–14 turns;
- return explicit victory reason: core collapse, no weapons/recovery, structural loss, surrender or timeout;
- add a concise post-battle tactical report.

### Exit criteria

- every weapon has a distinct target profile and counter;
- the optimal action changes with enemy state;
- battles rarely exceed five minutes;
- the player always understands why the battle ended;
- AI archetypes are recognizable from behavior, not only labels.

## Phase 3 — Solo campaign: Sectors

### Scope

- interactive tutorial battle and guided first build;
- 3 sectors with 25–30 total encounters;
- branching routes and visible risk/reward choices;
- repair docks, stores, salvage and lightweight random events;
- three AI commanders and three mechanically distinct bosses;
- blueprint rewards that unlock sidegrades and hull options;
- daily expedition with a seeded route and fixed modifiers;
- resumable run state.

### Exit criteria

- a new player learns targeting, armor, power and repair without reading a manual;
- the campaign provides 8–12 hours for a first clear;
- bosses test learned systems instead of only adding HP;
- loss, retry and build revision form a clear loop.

## Phase 4 — Multiplayer beta

### Scope

- Quick Match queue;
- Ranked queue with normalized combat power;
- private room/code for friends;
- turn timer, surrender and disconnect handling;
- reconnect across browser, network and server restart;
- rematch flow;
- match history and tactical recap;
- seasonal leaderboard and league placement;
- matchmaking telemetry and abuse-rate limits.

### Exit criteria

- two remote players repeatedly complete matches without divergence;
- reconnect does not change ownership or rewards;
- queue and private-room flows work on touch devices;
- rating and result settlement are idempotent;
- timeout and disconnect outcomes are predictable and documented.

## Phase 5 — Progression and economy

### Scope

- account level and unlock track;
- hull/module blueprint inventory;
- sidegrade-focused technology tree;
- daily and weekly contracts;
- achievements and collection milestones;
- leagues and seasonal cosmetic rewards;
- ship colors, trails, impact skins, banners and pilot identity;
- economy sinks and telemetry-backed balance controls.

### Fairness rules

- ranked combat power is normalized;
- purchases must not sell direct statistical victory;
- a newly unlocked module has a trade-off, not a strictly superior stat line;
- paid or premium rewards, if introduced, are cosmetic or convenience-only;
- economy changes are versioned and measurable.

### Exit criteria

- players have short-, medium- and long-term goals;
- no mandatory grind blocks the core tactical loop;
- progression expands build variety without invalidating older builds.

## Phase 6 — Presentation and usability

### Visual thesis

**Nebula Foundry:** a dark industrial starship bay where bright system colors, power links and localized destruction communicate function before spectacle.

The signature moment is progressive modular destruction: armor fractures, power paths fail and the defeated ship breaks along its damaged topology. Supporting motion must explain aim, impact, status or state change.

### Scope

- final hull and module art with consistent damage states;
- distinct projectile, impact and destruction language per weapon;
- debris, smoke, electrical arcs, controlled shake and hit-stop;
- music states for hangar, battle pressure and result;
- weapon, damage, UI and warning audio;
- optional haptics on supported mobile devices;
- boss introductions and post-battle reveal;
- complete loading, empty, disabled, error and reconnect states;
- keyboard, touch, reduced-motion and low-quality modes;
- onboarding and contextual help.

### Performance budgets

- readable static baseline without complex effects;
- no required interaction depends on hover or WebGL;
- continuous effects pause when hidden;
- coarse-pointer/mobile starts with reduced particle density;
- reduced-motion mode keeps all state changes legible;
- target is a stable 60 fps on representative mid-range mobile hardware, with a 30 fps safe tier.

## Phase 7 — Android and launch readiness

### Scope

- Godot Android client against the same versioned backend contracts;
- account and saved-build continuity with Web;
- background/resume and mobile reconnect handling;
- final touch controls for portrait and landscape;
- Android SDK, signing, AAB and store assets;
- crash reporting, performance monitoring and analytics consent;
- moderation/reporting minimums and support runbook;
- soft-launch cohort, balance review and release checklist.

### Exit criteria

- Web and Android resolve identical server-authoritative battles;
- one account can continue progression on both clients;
- production dashboards cover crashes, failed actions, match completion and retention;
- rollback and data migration procedures are tested.

## Content target for version 1.0

- 3 hulls;
- 8–10 weapons;
- at least 8 utility/defense modules;
- real grid-based builder;
- tutorial and 25–30 encounter campaign;
- 3 bosses and 5 regular AI archetypes;
- Quick Match, Ranked and private rooms;
- reconnect, rematch, history and leaderboard;
- account progression based on sidegrades and cosmetics;
- Web and Android clients;
- complete audio and production VFX pass.

## Milestone discipline

Each phase is delivered as vertical slices. Every slice must include:

1. documented rule and contract change;
2. server-authoritative implementation;
3. Web UI for all states;
4. automated rule coverage where applicable;
5. desktop and mobile verification;
6. migration and rollback consideration;
7. an update to [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md).

Features do not move to the next phase merely because a screen exists. They move when their exit gate is demonstrated.
