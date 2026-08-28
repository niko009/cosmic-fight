# Cosmic Fight — Game Design Document

**Version:** 0.2 — Modular Combat Direction  
**Status:** Working product specification  
**Primary platforms:** Web first for validation, Android production client later  
**Client direction:** Web = TypeScript/Babylon.js; Android = Godot 4 .NET/C#  
**Genre:** Turn-based tactical PvP / modular starship battler  
**Core mode:** Online 1v1 starship duels

---

## 1. High concept

**Cosmic Fight** is a tactical 1v1 spaceship game where each ship is built from visible, damageable systems. On a turn, the player chooses a weapon or repair action and targets a specific enemy or friendly module. Destroying or damaging systems changes how the ship performs during the battle.

The core fantasy is not simply "reduce one HP bar to zero." It is:

> **Take the enemy ship apart system by system while keeping your own ship alive.**

Players upgrade their ship between battles, experiment with weapon/module combinations, enter the online arena, challenge other pilots, and fight short server-authoritative duels.

### One-line pitch

> Build your ship, target enemy systems, cripple their combat capability, and win short tactical PvP duels.

### Working tagline

> **Target. Break. Adapt. Win.**

---

## 2. Design pillars

### 2.1 Targeted modular combat

The defining mechanic of Cosmic Fight is **aiming at individual ship systems**.

A player should regularly ask:

- Do I destroy the weapons first?
- Do I cripple the engines to reduce accuracy?
- Do I break armor before attacking the protected core?
- Do I attack the power network?
- Do I spend my turn repairing instead of shooting?

Target selection must matter as much as weapon selection.

### 2.2 Systems affect gameplay

Modules are not decorative hit zones. Damage changes battle performance.

Examples:

- damaged/destroyed engines reduce accuracy or firing efficiency;
- destroyed weapons reduce available firepower;
- damaged sensors reduce targeting accuracy;
- destroyed armor exposes connected modules;
- damaged power/core systems can disable connected nodes;
- destroyed structural modules can create cascade/stress damage.

### 2.3 Build crafting and upgrades

The ship is a configurable machine rather than one global stat block.

Players improve systems between battles and later choose different hulls, weapons, armor layouts and support modules.

The desired feeling is:

> "This is my ship, and I understand why it behaves differently from yours."

### 2.4 Short tactical battles

Target battle duration: **2–4 minutes**.

A normal turn should be understandable in seconds:

1. choose weapon/action;
2. choose target module;
3. resolve shot/repair;
4. see immediate system consequences;
5. opponent acts.

No long animation locks or unnecessary waiting.

### 2.5 Readable destruction

Players must visually understand the state of both ships.

Important feedback:

- module HP/state;
- broken module;
- power offline;
- burning;
- electrical short;
- armor coverage;
- weapon impact;
- repair result;
- concise battle log.

### 2.6 Live social PvP

The finished game should feel populated by real pilots:

- online presence;
- direct challenge;
- accept/decline;
- quick match;
- ranked queue;
- rematch;
- later: friends, private rooms, spectators, tournaments.

### 2.7 Fair competition

- Server-authoritative combat.
- Client sends intent, not damage results.
- No direct pay-to-win ranked advantage.
- Matchmaking may consider both rating and ship power where appropriate.

---

## 3. Target audience

Primary:

- players who enjoy short tactical battles;
- sci-fi/spaceship fans;
- players who like upgrades and ship builds;
- players who enjoy disabling enemy systems and adapting mid-battle;
- mobile/web players who want strategy without real-time twitch controls.

Desired session:

```text
Open game
→ inspect/upgrade ship
→ play 2–3 short battles
→ improve or reconfigure systems
→ challenge/rematch another pilot
→ leave with visible progress
```

---

## 4. Core loop

```text
Upgrade / configure ship
        ↓
Enter arena
        ↓
Challenge player or matchmake
        ↓
Choose weapon/action
        ↓
Target a specific ship module
        ↓
Resolve damage / statuses / system failure
        ↓
Opponent turn
        ↓
Battle result
        ↓
Rewards / upgrade points / progression
        ↓
Improve ship
        ↓
Repeat
```

The first Web prototype uses a bot instead of real PvP so the combat loop can be validated cheaply.

---

## 5. Ship architecture

A ship is composed of visible combat modules connected into a functional machine.

### 5.1 Core / Power

The central power system.

Responsibilities:

- feeds connected systems;
- high-value tactical target;
- damage can reduce ship effectiveness;
- destruction can trigger severe cascade damage and/or power loss.

The exact victory rule for core destruction is a balance decision. The first prototype should test **severe cascade rather than guaranteed instant victory**, because this produces more interesting crippled-ship states.

### 5.2 Engines

Effects may include:

- weapon accuracy;
- projectile/attack efficiency;
- evasion or future initiative mechanics.

Losing one engine should hurt. Losing all engines should be a major tactical disadvantage without necessarily ending the battle immediately.

### 5.3 Weapons

Weapon modules are firing points.

Destroying them reduces available firepower. A ship with no functioning weapon should be forced to repair, use a special fallback, or eventually lose.

### 5.4 Armor

Armor is physical protection, not just a global percentage.

Armor plates can protect linked/adjacent modules and absorb part of incoming damage.

As armor plates are destroyed, previously protected systems become more vulnerable.

This creates a tactical pattern:

```text
Break armor
→ expose system
→ attack critical system
```

### 5.5 Hull / Structure

Structural modules represent the frame of the ship.

Damage may create structural stress or damage linked systems.

### 5.6 Sensors

Sensors influence targeting/accuracy.

Destroying sensors should make precise attacks less reliable.

### 5.7 Wings / auxiliary structure

Wings or equivalent structural nodes may affect stability/accuracy and serve as additional destructible components.

They are useful visually and mechanically but are not required to be a separate upgrade category in every hull.

### 5.8 Future module families

Possible later additions:

- Shield Generator;
- Reactor variants;
- EMP module;
- repair drone bay;
- jammer;
- targeting computer;
- ammunition module;
- special weapon mounts.

These are expansion layers. The first combat prototype should stay understandable.

---

## 6. Module state model

Every damageable module has at minimum:

- type;
- current HP;
- maximum HP;
- functional/powered state;
- connected module IDs;
- temporary status effects.

Suggested visual states:

- **OK** — healthy;
- **Damaged** — reduced HP;
- **Critical** — very low HP and potentially worse effectiveness;
- **Destroyed** — module no longer performs its normal function.

### Power network

Modules can be connected by a power graph.

If the Core/Power network can no longer reach a module, that module may become **unpowered** even if it still has HP.

This makes ship topology part of tactics rather than merely visual decoration.

---

## 7. Turn model

The game remains turn-based.

### Core turn choice

For the first prototype, the main choices are intentionally direct:

1. **Choose a weapon and fire at a specific enemy module**, or
2. **Use Repair and select one of your own damaged modules**.

This replaces the previous assumption that every turn must be one of five abstract buttons (`Attack / Defend / Charge / Repair / Special`).

Those concepts may return later as modules/abilities if playtests show they deepen the game.

### Turn timer

PvP target: **15 seconds**.

Offline/Web prototype can initially omit or relax the timer during tuning.

### Battle resolution

A turn ends after the selected shot or repair resolves and all immediate effects are applied.

Possible resolution order:

```text
weapon fires
→ accuracy / hit test
→ armor absorption
→ target module damage
→ splash if applicable
→ status effect roll
→ destruction/cascade effects
→ power network recalculation
→ victory check
→ next turn
```

---

## 8. Weapons

The initial direction follows four clearly differentiated weapons.

### 8.1 Laser

Identity: reliable precision weapon.

Characteristics:

- moderate damage;
- high projectile speed / accuracy;
- low splash;
- useful for finishing critical modules.

### 8.2 Missile

Identity: heavy explosive strike.

Characteristics:

- high direct damage;
- splash damage around impact;
- stronger chance of fire;
- slower projectile / possible charge or cooldown later.

### 8.3 Scatter / Shot weapon

Identity: multi-projectile pressure.

Characteristics:

- several projectiles;
- spread;
- useful against larger exposed areas;
- less reliable against a tiny specific module.

Working name can change later.

### 8.4 Plasma

Identity: heavy energy/disruption weapon.

Characteristics:

- strong direct damage;
- small splash;
- higher electrical-short chance;
- visually distinctive projectile.

### Later candidates

- Railgun — armor penetration;
- Ion weapon — system disruption;
- EMP launcher;
- incendiary weapon;
- anti-shield weapon if shields become a major layer.

No weapon should dominate all target types.

---

## 9. Damage and secondary effects

### 9.1 Armor absorption

Incoming damage to a protected module can be partially redirected to linked armor plates.

Armor therefore has its own HP and can be physically broken.

### 9.2 Fire

A module may catch fire.

Effects:

- damage over multiple turns;
- possible spread to connected modules;
- visual flame/smoke;
- can be removed by repair or expire naturally depending on balance.

### 9.3 Electrical short

A module may become temporarily shorted.

Effects:

- module disabled or heavily reduced for several turns;
- especially relevant to Core, Weapons and Sensors;
- Plasma/Ion-style weapons are natural sources.

### 9.4 Structural stress

Hull/core destruction may stress linked modules and cause smaller follow-up damage.

### 9.5 Cascade damage

Destroying important systems, especially Core, can damage connected systems.

Cascade damage should be dramatic but bounded so one lucky hit does not routinely decide a full-health match.

### 9.6 Randomness principle

Randomness creates tension but should not dominate strategy.

Prefer:

- predictable base damage;
- bounded status chances;
- visible weapon identities;
- server-seeded/logged RNG in PvP.

---

## 10. Repair

Repair is a targeted tactical action.

Player selects **Repair**, then selects one of their own modules.

Repair may:

- restore module HP;
- extinguish fire;
- clear electrical short;
- remove structural stress.

### Repair kits

The prototype should use a limited number of repair kits per battle.

Candidate rules inspired by the reference prototype:

- normal repair costs 1 kit;
- emergency restoration of a destroyed module may cost 2 kits;
- repaired destroyed module returns at partial HP;
- repair consumes the player's turn.

Exact numbers remain balance parameters.

---

## 11. Ship upgrades between battles

Upgrade decisions should change how systems survive and perform.

Initial upgrade categories:

| Upgrade | Intended effect |
|---|---|
| Core | more Core HP / reduced cascade severity |
| Engines | more engine HP / reduced accuracy penalty |
| Weapons | more weapon HP / damage bonus |
| Armor | more armor HP / stronger protection |
| Sensors | more sensor HP / better targeting |
| Hull | more structure HP / reduced stress |
| Fire Protection | lower fire chance / fire damage |
| Electrical Shielding | lower short-circuit chance/duration |

The first prototype may use simple upgrade points rather than a full economy.

Long-term progression can later map these upgrades into Credits, parts, equipment rarity, unlocks and player inventory.

---

## 12. Victory and defeat

The reference combat concept supports ships continuing to fight while partially crippled.

Preferred prototype rule:

- victory when the opponent's overall ship structural HP/integrity reaches zero or no meaningful combat capability remains;
- Core destruction causes severe consequences but is not automatically guaranteed instant victory unless playtests show that rule is better.

PvP also supports:

- surrender;
- disconnect timeout;
- invalid-match cancellation.

A late anti-stall mechanism such as Solar Storm remains available if repairs create overly long matches.

---

## 13. Battle UI

The battle screen must communicate two things simultaneously:

1. the ships as physical objects;
2. the health/state of individual systems.

Required UI:

- both ships;
- selectable module hit zones;
- per-module health/state;
- overall ship integrity summary;
- current turn;
- selected weapon;
- weapon selector;
- repair mode + remaining kits;
- statuses such as Fire / Short / Power Offline;
- concise battle log;
- Victory / Defeat overlay;
- Rematch / Upgrade flow.

### Orientation

Orientation is **not hard-locked yet**.

The supplied gameplay reference works naturally in a wide left-vs-right battlefield. Mobile targeting may also benefit from landscape orientation.

Phase 1 Web prototype should therefore validate responsive layouts rather than force the old portrait assumption. Desktop/wide layouts can use left-vs-right ships; narrow/mobile layouts can stack or adapt. Android orientation will be chosen after real usability tests.

---

## 14. Multiplayer experience

The social layer remains unchanged.

Main surface: **Online Arena**.

Players can:

- see who is online;
- challenge a specific available pilot;
- accept or decline duel invitation;
- enter an authoritative battle room;
- rematch;
- use Quick Match;
- later use Ranked.

The server owns:

- module state;
- target validation;
- accuracy/RNG;
- damage;
- armor absorption;
- statuses;
- repair validation;
- turn state;
- victory result.

Web and Android clients present the same battle rules.

---

## 15. Progression and ranking

Long-term progression remains:

- Credits;
- XP;
- equipment/upgrades;
- rating;
- leagues;
- cosmetics.

Initial leagues:

- Bronze;
- Silver;
- Gold;
- Platinum;
- Diamond;
- Master.

The first Web combat prototype should **not** build the full economy. Simple upgrade points are enough to test whether upgrading systems creates interesting choices.

---

## 16. Monetization direction

Competitive integrity remains a product pillar.

Preferred monetization:

- ship skins;
- projectile/VFX variants;
- engine trails;
- avatars;
- banners;
- emotes;
- victory effects;
- seasonal cosmetics later.

Avoid selling direct ranked combat superiority.

---

## 17. MVP implementation order

### Phase 1 — Web combat prototype

Must prove:

- two modular ships;
- selectable enemy modules;
- Laser / Missile / Scatter / Plasma;
- module HP and destruction;
- armor protection;
- at least basic power/system consequences;
- Fire and/or Electrical Short;
- targeted Repair;
- simple AI opponent;
- upgrade screen with a small point budget;
- battle log;
- Victory / Defeat / Rematch;
- responsive browser usability.

### Phase 2 — Server

Move the validated combat model into an ASP.NET Core authoritative battle engine.

### Phase 3 — Web PvP

Presence → Challenge → Accept → authoritative modular duel → reconnect/rematch.

### Phase 4 — Progression / Ranked

Persistent upgrades, inventory, rating and balance telemetry.

### Phase 5 — Android Godot client

Implement the validated battle model in Godot using the same server protocol and assets where appropriate.

---

## 18. MVP success criteria

The combat direction is successful if:

1. Players understand that individual modules are targets.
2. Target choice changes the outcome of battle.
3. Different weapons create different target priorities.
4. Destroying a system visibly changes ship performance.
5. Repair creates a meaningful tradeoff because it consumes a turn/resource.
6. A badly damaged ship can still create interesting comeback situations.
7. Battles remain roughly 2–4 minutes after tuning.
8. The upgrade screen changes subsequent battle strategy.
9. The battle is readable on both Web and later Android.
10. Real PvP can move the same deterministic/authoritative rules to the server.

---

## 19. Explicitly out of the first prototype

Do not block Phase 1 on:

- accounts;
- real multiplayer;
- ranked leagues;
- final economy;
- final 3D ships;
- clans;
- chat;
- tournaments;
- spectators;
- dozens of weapons;
- complex crafting;
- battle pass.

---

## 20. Expansion space

The design intentionally leaves room for later features without committing to them now.

Candidates:

- active shields;
- energy management;
- Defend action;
- Charge/overcharge;
- special modules;
- alternate ammunition;
- crew/officers;
- directional armor;
- drones;
- environmental hazards;
- more complex power routing;
- ship layouts with different module topology.

Any expansion should strengthen the core decision:

> **What do I target now, and what system can I afford to lose?**

---

## 21. Product principle

When a new feature conflicts with the core combat loop, prefer the core combat loop.

**Cosmic Fight is first a game about building a modular starship, choosing the right weapon, targeting the right enemy system, and adapting as both ships are physically dismantled during a short duel.**
