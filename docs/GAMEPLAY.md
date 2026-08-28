# Combat & Gameplay Specification

## Goal

Define the first implementable Cosmic Fight duel around the updated core mechanic: **choose a weapon, target a specific ship module, and damage the enemy's functional systems**.

The supplied Web reference prototype is the current mechanical inspiration for this direction. It is a reference for interaction and systems, not a final UI/visual design.

## Match structure

1. Both ships spawn with visible modules and current states.
2. Turn owner chooses a weapon or Repair.
3. If attacking, player selects a specific enemy module.
4. If repairing, player selects a specific friendly module.
5. Server/local prototype validates the action.
6. Shot/repair resolves.
7. Armor, splash, statuses, destruction and cascade effects resolve.
8. Power/system effectiveness is recalculated.
9. Battle state is checked.
10. Next turn begins.
11. Repeat until victory, surrender, disconnect timeout, or later sudden-death rule.

## Player-visible combat state

Always readable:

- current turn;
- both ships and selectable modules;
- module HP/state;
- overall ship integrity summary;
- selected weapon;
- remaining repair kits;
- important statuses;
- battle log / last event.

Later PvP additions:

- turn timer;
- rating/player identity;
- reconnect state.

## Core turn actions

The first prototype does **not** use `Attack / Defend / Charge / Repair / Special` as five equal abstract buttons.

The primary interaction is:

### Fire

1. Choose weapon.
2. Choose enemy module.
3. Resolve the weapon against that module.

### Repair

1. Choose Repair mode.
2. Choose one friendly damaged module.
3. Consume repair resource and the turn.

Defend, Charge and Special remain future expansion candidates, preferably attached to equipment/modules rather than added automatically.

## Initial weapons

### Laser

- reliable;
- moderate damage;
- accurate;
- low/no splash;
- good finisher for damaged systems.

### Missile

- high impact;
- slower/heavier feel;
- splash damage;
- stronger fire chance;
- future cooldown/charge candidate.

### Scatter weapon

- several projectiles;
- spread;
- less precise;
- useful against broad/clustered targets.

### Plasma

- strong energy projectile;
- small splash;
- increased electrical-short chance;
- distinct visual identity.

Later candidates: Railgun, Ion, EMP, incendiary and shield-specialist weapons.

## Module set

Initial module families:

- Core / Power;
- Engine;
- Weapon;
- Armor;
- Hull / Structure;
- Sensor;
- Wing / auxiliary structural node when useful for a hull layout.

Each module tracks at minimum:

- ID;
- type;
- HP / max HP;
- connections;
- powered/functional state;
- status effects.

## Damage states

Recommended states:

- `OK`;
- `DAMAGED`;
- `CRITICAL`;
- `DESTROYED`.

The state should be obvious both graphically and in compact HUD information.

## Functional consequences

Module damage must change gameplay.

Suggested first rules:

### Core / Power

- powers connected systems;
- destruction causes major power loss/cascade risk;
- does not have to be an instant win in the first prototype.

### Engines

- reduce accuracy/attack efficiency as they are damaged;
- losing all engines creates a major penalty.

### Weapons

- destroyed weapon mounts reduce offensive capability;
- losing all weapon mounts leaves Repair/special fallback as the only recovery path.

### Armor

- physical armor plates protect linked modules;
- part of incoming damage is absorbed by armor itself;
- destroyed armor exposes previously protected modules.

### Sensors

- affect targeting accuracy;
- damaged sensors make precise subsystem shots less reliable.

### Hull / Structure

- structural damage contributes to overall ship integrity;
- destruction can stress linked systems.

### Wings

- optional stability/accuracy contribution;
- destructible structural targets.

## Power network

The ship can be represented as a graph of linked modules.

Power starts from Core and propagates through surviving connections.

A module that still has HP but loses a valid power connection may become offline or operate at greatly reduced efficiency.

This mechanic is important because it allows players to disable a system indirectly by breaking the network around it.

## Armor model

Armor is ablative and local.

Simplified first rule:

```text
incoming module hit
→ determine linked live armor coverage
→ redirect/absorb part of damage into armor plates
→ remaining damage reaches target
→ armor may break and expose target for later turns
```

Do not hide armor entirely inside a global defense number.

## Secondary statuses

### Fire

Possible behavior:

- damage over multiple turns;
- increased chance on engines/critical modules;
- possible spread to connected modules;
- repair can extinguish it.

### Electrical Short

Possible behavior:

- module temporarily disabled/reduced;
- relevant to Core, Sensors and Weapons;
- Plasma/Ion-style attacks should have stronger interaction.

### Structural Stress

Possible behavior:

- small delayed damage;
- triggered by destruction of Hull/Core/linked structure;
- should stay bounded and readable.

## Cascade damage

Destruction of important modules can damage linked systems.

Core destruction is the clearest candidate.

Design constraints:

- dramatic visual feedback;
- meaningful tactical reward;
- avoid a single random hit wiping an otherwise healthy ship;
- cascade severity can be upgradeable/reducible.

## Repair model

Repair targets one friendly module and consumes the turn.

Initial candidate:

- limited repair kits per battle;
- standard repair costs 1 kit;
- repair restores a percentage/fixed amount of module HP;
- repair extinguishes Fire;
- repair clears Short/Stress;
- emergency restart of a destroyed module may cost 2 kits and restore only partial HP.

Exact values should be tuned by playtests.

## Upgrades between battles

The reference direction supports a small pre-battle upgrade screen.

Initial categories:

- Core;
- Engines;
- Weapons;
- Armor;
- Sensors;
- Hull;
- Fire Protection;
- Electrical Shielding.

Phase 1 can use a simple upgrade-point budget rather than permanent economy.

Upgrade effects should remain understandable, for example:

- +module HP;
- +weapon damage;
- reduced accuracy penalty;
- stronger armor protection;
- reduced fire/short probability;
- reduced cascade/stress damage.

## Damage formula philosophy

Keep formulas inspectable.

Conceptually:

```text
weapon base damage
× attacker system modifiers
× optional charge/risk modifier
→ hit/accuracy check
→ local armor absorption
→ target module damage
→ splash if applicable
→ Fire/Short/Stress roll
→ destruction/cascade
→ power graph recalculation
```

Do not add dozens of stats before the interaction is fun.

## Accuracy

Accuracy should depend partly on ship condition.

Possible sources:

- engine integrity;
- sensor integrity;
- wing/stability state;
- weapon type;
- later targeting-computer upgrades.

Precision weapons should reward intact targeting systems.

## Victory condition

First prototype should test victory based on **overall ship destruction / loss of meaningful structural integrity**, while allowing severely crippled ships to continue fighting.

Core destruction should cause major consequences but is not automatically locked as instant victory yet.

If testing shows players strongly prefer a clear "kill the Core" objective, that can be promoted later.

## Turn pacing

PvP target:

- decision window: ~15 seconds;
- resolution: near-instant game-state update;
- animation: typically 0.5–2.5 seconds;
- next turn begins quickly.

Offline Phase 1 can be untimed while mechanics are being tuned.

## Anti-stall

Solar Storm remains a candidate rather than a mandatory first-prototype feature.

Use it only if repair/disabled-ship states create excessively long battles.

Potential behavior:

- warning after a turn threshold;
- escalating unavoidable damage;
- reduced repair efficiency.

## PvP server authority

When networking is introduced, server resolves:

- whether module is a legal target;
- current turn;
- weapon availability;
- accuracy;
- RNG seed/results;
- armor absorption;
- module damage;
- status effects;
- cascade damage;
- repair resource/use;
- power graph;
- victory.

Clients only send intent and render authoritative results.

## First balance-test matrix

Test at minimum:

- shoot Core first vs disable Weapons first;
- armor-first strategy vs direct critical-system strategy;
- Laser precision vs Missile splash;
- Plasma disruption vs raw damage;
- repair-heavy play vs sustained aggression;
- upgraded weapons vs upgraded armor;
- engines/sensors crippled vs healthy targeting systems;
- rematches with different target priorities.

Track:

- average turns/duration;
- first-player win rate;
- target-module selection rate;
- weapon usage rate;
- damage absorbed by armor;
- number of destroyed systems per battle;
- Fire/Short frequency;
- repair frequency/value;
- comeback rate after critical damage;
- how often one strategy becomes obviously dominant.
