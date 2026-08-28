# Combat & Gameplay Specification

## Goal

Define the first implementable version of the Cosmic Fight duel without prematurely locking final balance numbers.

## Match structure

1. Match created by server.
2. Both players lock their loadouts.
3. Server publishes initial combat state.
4. Turn owner receives a 15-second action window.
5. Player submits one action.
6. Server validates cost/cooldown/state.
7. Server resolves outcome.
8. Both clients receive the same authoritative result event.
9. Animation/VFX play from that event.
10. Next turn begins.
11. Repeat until victory, surrender, disconnect timeout, or sudden death resolution.

## Player-visible combat state

Always visible:

- current turn;
- turn timer;
- both hull HP values;
- both shield values;
- local energy;
- local cooldowns;
- important status effects;
- concise last-event text.

Optional/conditional:

- enemy energy should not necessarily be exact; decide after playtests whether hidden information improves prediction.

## Baseline actions

### Attack

Uses equipped weapon.

Data fields:

- base damage;
- energy cost;
- cooldown;
- accuracy if used;
- armor penetration;
- shield modifier;
- critical chance/modifier;
- system-effect chance.

### Defend

Provides short-lived mitigation or shield reinforcement.

Design requirement: Defend must not be optimal every second turn. Use energy cost, diminishing value, cooldown, or predictable counterplay.

### Charge

Restores or banks energy. Can also become a future hook for charged attacks.

Design requirement: Charge creates vulnerability because it sacrifices immediate pressure.

### Repair

Restores hull under strict constraints.

Possible constraints:

- high energy cost;
- cooldown;
- limited uses per battle;
- reduced efficiency in Solar Storm.

### Special

Delegates to installed module.

Examples:

- EMP Burst: temporary reactor/weapon disruption;
- Emergency Shield: immediate shield injection;
- Overcharge: next weapon attack gets bonus damage for additional energy;
- Emergency Repair: one strong limited heal.

## Damage model — initial formula shape

The first prototype should use simple, inspectable formulas.

Conceptually:

```text
weapon raw damage
  × offensive modifiers
  × target-type modifier
  → shield absorption
  → armor reduction for hull portion
  → final hull damage
  → critical/system roll
```

Do not bury MVP combat under dozens of multiplicative stats.

## Randomness

Randomness should create tension, not decide the entire battle.

Guideline:

- low variance on standard attacks;
- higher variance reserved for explicit high-risk weapons/actions;
- critical effects bounded;
- all RNG resolved server-side with a match seed logged for debugging.

## System damage

MVP implementation can use three damageable systems:

1. Weapon
2. Shield Generator
3. Reactor

Suggested effect style:

- Weapon damaged: temporary/remainder-of-match output penalty.
- Shield Generator damaged: lower max shield or regeneration efficiency.
- Reactor damaged: lower energy generation.

System damage should be visible both in HUD and on the ship model/VFX where practical.

## Build counters

Desired relationships, not hard rock-paper-scissors:

- Railgun pressures armor-heavy builds.
- Missile burst pressures shield timing/cooldowns.
- Plasma punishes greedy charge/repair windows.
- Laser provides consistent baseline reliability.
- Disruption modules punish high-energy combo builds.

No build should have a hard auto-win matchup.

## Turn pacing

Target:

- action selection: 15 seconds maximum;
- server resolution: perceived near-instant;
- animation: typically 1–2.5 seconds;
- next decision becomes available quickly.

Do not force players to watch 6–8 second repeated weapon cinematics.

## Disconnect behavior

- brief network interruption → reconnect grace period;
- player rejoins the same battle state;
- server can replay latest authoritative snapshot/events;
- if grace period expires → loss by disconnect;
- client must never locally declare victory before server confirmation.

Initial grace target: 30 seconds, subject to test.

## Surrender

Allow surrender from the battle UI with confirmation. Server records the result as a loss and closes the match cleanly.

## Solar Storm

Purpose: stop defensive loops.

Baseline candidate:

- begins after turn 10;
- unavoidable environmental damage increases every full round;
- repair effectiveness may be reduced;
- clear visual warning 1–2 turns before activation.

## Battle result

Show:

- Victory / Defeat;
- opponent;
- rating delta where relevant;
- credits / XP / materials;
- notable progress/unlock;
- Rematch;
- Return to Arena;
- Upgrade Ship shortcut.

## First balance-test matrix

Test at minimum:

- balanced vs balanced;
- tank vs burst;
- shield vs penetration;
- repair-heavy mirror;
- energy combo vs disruption;
- strongest starter item vs weakest starter item;
- equal-skill rematches with swapped loadouts.

Track:

- average turns;
- average duration;
- first-player/second-player win rate;
- action pick rates;
- damage by source;
- repair/defend frequency;
- surrender/disconnect rate.
