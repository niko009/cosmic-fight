# Cosmic Fight — Game Design Document

**Version:** 0.1 — Pre-production baseline  
**Status:** Working product specification  
**Primary platform:** Android / mobile-first  
**Engine direction:** Godot 4 .NET / C#  
**Genre:** Turn-based tactical PvP / ship-builder battler  
**Core mode:** Online 1v1 starship duels

---

## 1. High concept

**Cosmic Fight** is a fast, readable, competitive 1v1 PvP game where players build and upgrade custom starships, see other pilots online, challenge them directly or enter matchmaking, and fight short tactical turn-based duels.

The game is built around three fantasies:

1. **I built this ship.** The loadout, visual identity, and upgrade path should feel personal.
2. **I outplayed that pilot.** Victory should come from prediction, timing, energy management, and build decisions—not only raw stats.
3. **My ship keeps evolving.** Every few battles should create a meaningful reason to return to the hangar and adjust the build.

### One-line pitch

> Build your ship, challenge live pilots, and outplay them in short tactical space duels.

### Working tagline

> **Fight smart. Upgrade. Conquer.**

---

## 2. Design pillars

### 2.1 Fast tactical combat

- Target battle duration: **2–4 minutes**.
- Typical battle: **6–12 turns**.
- Each turn must create a meaningful choice.
- No long animation locks or waiting without information.
- A late-match anti-stall rule forces resolution.

### 2.2 Build crafting

A ship is a loadout, not a single linear upgrade bar. Players combine systems with strengths, counters, energy costs, cooldowns, and synergies.

### 2.3 Live social PvP

Players should feel that the arena is populated by real people:

- online status;
- direct challenge;
- accept/decline;
- quick match;
- ranked queue;
- rematch;
- later: friends, private rooms, spectators, tournaments.

### 2.4 Readable spectacle

The battle must look dramatic while remaining mechanically clear:

- large ships;
- shield flashes;
- visible hull damage;
- readable projectile/beam origin and target;
- strong color hierarchy;
- concise combat log;
- camera shake used selectively.

### 2.5 Fair competition

- Server-authoritative combat.
- No client-calculated damage.
- No direct pay-to-win competitive advantage.
- Matchmaking considers both rating and ship power where appropriate.

---

## 3. Target audience

Primary:

- mobile players who enjoy short competitive sessions;
- sci-fi / spaceship fans;
- players who like upgrades, builds, and counters;
- players who want PvP depth without real-time twitch controls.

Secondary:

- mid-core strategy players;
- collection/progression players;
- social PvP players who enjoy challenging known opponents.

Desired session behavior:

- open game;
- check hangar / claim small rewards;
- play 2–3 battles;
- upgrade or swap one component;
- challenge/rematch a player;
- leave within 5–10 minutes feeling progress.

---

## 4. Core loop

```text
Build / tune ship
      ↓
Go online
      ↓
Challenge player or matchmaking
      ↓
1v1 battle
      ↓
Rewards + rating result
      ↓
Upgrade / equip / adjust build
      ↓
Repeat
```

Long-term loop:

```text
Battles → resources → upgrades → stronger/more specialized builds
        → higher leagues → seasonal rewards → cosmetics / prestige
```

---

## 5. Player ship

Each active ship has six core loadout slots.

### 5.1 Hull

Determines the base identity of the ship.

Primary stats:

- hull HP;
- base energy;
- base mass/class;
- passive modifiers;
- possible module limits.

Initial hull archetypes:

| Hull | Fantasy | Strength | Weakness |
|---|---|---|---|
| Scout | fast, efficient, tactical | energy / utility | low HP |
| Fighter | balanced | flexible build | no extreme strength |
| Destroyer | heavy brawler | HP / armor / burst | slower energy economy |

### 5.2 Weapon

Primary offensive system.

Initial MVP weapons:

| Weapon | Identity | Example behavior |
|---|---|---|
| Laser | reliable | stable damage, high accuracy |
| Plasma Cannon | burst | high damage, high energy cost |
| Missile Rack | cooldown burst | high impact, longer cooldown / counterplay |
| Railgun | armor penetration | bypasses part of armor |

Post-MVP candidate: Ion Cannon focused on system disruption.

### 5.3 Shield

- absorbs damage before hull;
- can have regeneration rules;
- may interact differently with weapon classes.

### 5.4 Armor

- reduces hull damage;
- may reduce critical/system-damage chance;
- persists while the hull remains alive.

### 5.5 Reactor

Defines the tactical energy economy:

- maximum energy;
- energy gained per turn;
- possible charge efficiency;
- vulnerability to system damage.

### 5.6 Special module

Creates build identity.

Examples:

- EMP Burst;
- Emergency Repair;
- Overcharge;
- Reflective Shield;
- Targeting Computer;
- Jammer.

Only a small curated set is needed for MVP.

---

## 6. Battle model

The battle is turn-based and server-authoritative.

### 6.1 Turn actions

Baseline action set:

- **Attack** — use equipped weapon.
- **Defend** — temporary defensive boost / shield reinforcement.
- **Charge** — gain energy or empower a later action.
- **Repair** — restore a limited amount of hull at meaningful cost.
- **Special** — trigger the installed module ability.

Exact values remain balance parameters rather than hard-coded design promises.

### 6.2 Energy

Energy prevents repeated use of the strongest actions.

Each action may have:

- energy cost;
- cooldown;
- charge requirement;
- conditional modifier.

Every turn restores a defined amount of reactor energy.

Energy should create decisions like:

> Fire a safe attack now, or save enough energy for a strong combo next turn?

### 6.3 Shields and hull

Default damage order:

```text
Incoming hit
   ↓
Shield mitigation / absorption
   ↓
Armor mitigation
   ↓
Hull damage
   ↓
Possible critical / system effect
```

Some weapons may override parts of this chain.

### 6.4 Critical hits and system damage

Critical hits should be exciting but controlled.

Possible affected systems:

- weapon;
- shield generator;
- reactor;
- later: engines / targeting.

A damaged system reduces effectiveness instead of instantly removing the player from the match.

Examples:

- reactor damage → lower energy regeneration;
- weapon damage → lower output or higher cost;
- shield damage → weaker regeneration / maximum shield.

System damage must never create an unrecoverable snowball too early in a match.

### 6.5 Targeted shots — candidate, not mandatory MVP

A later layer can allow targeting a specific system with a lower hit chance. This is intentionally outside the first combat implementation until the base duel proves fun.

### 6.6 Turn timer

Target: **15 seconds** per turn.

If time expires, the server chooses a safe fallback action (initially basic attack or defend, depending on balance tests).

### 6.7 Anti-stall / sudden death

If a battle reaches the turn limit, a **Solar Storm** begins.

Suggested baseline:

- starts after turn 10;
- escalating unavoidable damage each subsequent turn;
- prevents infinite repair/defend loops.

### 6.8 Victory conditions

Primary:

- enemy hull reaches zero.

Secondary server outcomes:

- opponent disconnect timeout;
- surrender;
- administrative match cancellation on invalid state.

---

## 7. Multiplayer experience

The main social surface is **Online Arena**.

Players can see:

- online player count;
- player name;
- status;
- league/rating summary;
- ship power;
- challenge button when available.

Statuses:

- Online / Available;
- In Battle;
- Ready;
- Away (later);
- Offline is generally omitted from the live list.

Core flows:

1. Online Arena → Challenge → Accept → Battle Room → Battle → Result → Rematch.
2. Quick Battle → matchmaking → Battle.
3. Ranked → rating-based matchmaking → Battle → rating update.

Detailed multiplayer rules are in [MULTIPLAYER.md](MULTIPLAYER.md).

---

## 8. Game modes

### MVP

#### Quick Battle

Fast unranked or lightly ranked matchmaking designed for low friction.

#### Ranked

Competitive queue with rating and leagues.

#### Direct Challenge

Challenge a specific available player from Online Arena.

### Post-MVP

- Friends / Friendly Duel;
- Private Room with invite code;
- Spectator mode;
- tournaments;
- clans;
- seasonal events;
- replays.

---

## 9. Progression

Primary resources:

- **Credits** — common upgrade/purchase currency earned through play.
- **XP** — account/player progression.
- **Upgrade materials** — used to gate specific equipment upgrades.

Progression targets:

- frequent small progress;
- occasional meaningful unlock;
- build diversity rather than one mandatory upgrade path.

Detailed economy is in [PROGRESSION.md](PROGRESSION.md).

---

## 10. Ranking and leagues

Initial league ladder:

- Bronze;
- Silver;
- Gold;
- Platinum;
- Diamond;
- Master.

Ranked matchmaking should primarily use player rating. Ship power may be included as a guardrail during early population growth to reduce extreme stat mismatches.

The exact rating system can start with Elo-like logic and evolve later.

---

## 11. Fairness and monetization

Competitive integrity is a product pillar.

Preferred monetization:

- ship skins;
- weapon VFX;
- laser colors;
- engine trails;
- avatars / portraits;
- banners;
- emotes;
- victory animations;
- seasonal cosmetic pass later.

Avoid:

- selling direct ranked combat advantage;
- exclusive paid weapons with superior competitive stats;
- paid repair/energy buttons inside a duel.

---

## 12. UX / screen map

Primary screens:

```text
Launch
  ↓
Login / Account
  ↓
Home
  ├── Hangar / My Ship
  │     ├── Equip
  │     └── Upgrade
  │
  ├── Online Arena
  │     ├── Direct Challenge
  │     ├── Quick Battle
  │     └── Ranked
  │
  ├── Battle
  │     └── Result / Rematch
  │
  ├── Profile / Rating
  └── Settings
```

Post-MVP navigation can include missions, store, friends, news, seasons, and tournaments.

---

## 13. Visual identity

Visual direction:

- premium military sci-fi;
- dark space backgrounds;
- metallic blue UI as neutral/player language;
- red as hostile/danger language;
- gold for progression/rank/reward;
- purple for special/rare systems;
- green for repair/positive status.

Battle composition:

- opponent ship upper half;
- player ship lower half;
- large central combat space;
- bottom action bar with five clear choices;
- player/enemy HP and shields always visible;
- energy visible near the local-player panel;
- combat event line visible without covering the action.

See [VISUAL_DIRECTION.md](VISUAL_DIRECTION.md).

---

## 14. Audio direction

MVP audio should prioritize feedback rather than quantity.

Required categories:

- UI tap / confirm;
- challenge received / accepted;
- weapon fire per weapon family;
- shield hit;
- hull hit;
- critical hit;
- repair;
- charge;
- victory;
- defeat;
- low-hull warning.

Music:

- ambient hangar theme;
- restrained battle tension loop;
- no constant high-intensity track that exhausts mobile sessions.

---

## 15. MVP success criteria

The first version is successful if:

1. A new player understands how to start a battle without explanation.
2. Two online players can reliably see each other and complete a duel.
3. A typical duel resolves in 2–4 minutes.
4. The player makes at least one non-trivial tactical decision per battle.
5. Different starter loadouts feel meaningfully different.
6. Disconnect/reconnect does not corrupt a match.
7. The server remains the source of truth for combat.
8. Players can immediately rematch or return to the arena.
9. Visual feedback makes hits, shields, energy, and current turn obvious.
10. Progression gives a reason to return to the hangar after a small number of matches.

---

## 16. Explicitly out of MVP

To protect scope, the first playable online release does **not** require:

- clans;
- tournaments;
- spectator mode;
- text chat;
- open-world navigation;
- story campaign;
- dozens of hulls;
- hundreds of items;
- marketplace/trading;
- complex crafting;
- 2v2 / team combat;
- replay editor;
- battle pass;
- live seasonal events.

These are expansion options only after the core duel proves retention.

---

## 17. Key product risk

The largest design risk is **stat progression overpowering tactical skill**.

Mitigation:

- narrow power bands;
- build counters;
- rating + power-aware matchmaking during early phases;
- server-side telemetry;
- avoid exponential stat growth;
- make sidegrades and specializations more valuable than raw +damage.

The second major risk is waiting time in a low-population PvP game. Mitigation includes quick matchmaking, direct challenges, asynchronous population-growth strategies, bots clearly labeled for early testing if needed, and keeping matches short.

---

## 18. Product principle

When a new feature conflicts with the core loop, prefer the core loop.

**Cosmic Fight is first a game about building a ship and outplaying another pilot in a short duel.** Everything else exists to make that loop deeper, more social, or more rewarding.
