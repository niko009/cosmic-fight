# Multiplayer & Social PvP

## Product goal

Cosmic Fight should feel populated even before it becomes a large game. The player must be able to see who is online, identify available opponents, and invite a specific pilot into a duel.

## Online Arena

The Online Arena is a first-class screen, not a hidden matchmaking menu.

Each visible player card may show:

- display name;
- avatar;
- level;
- league;
- ship power;
- availability status;
- action button.

Actions by status:

| Status | Primary action |
|---|---|
| Available | Challenge |
| Ready | Challenge |
| In Battle | Spectate later / disabled in MVP |
| Away | Disabled or challenge with lower priority |
| Offline | normally hidden from live arena |

## Presence

Presence states are server-owned.

Suggested states:

- `online_available`
- `online_queueing`
- `in_battle`
- `away`
- `offline`

The client should receive push presence updates rather than repeatedly polling the entire list.

## Transport

Use persistent bidirectional communication for live events, e.g. WebSocket/SignalR-style architecture.

Event families:

```text
PRESENCE_CHANGED
DUEL_CHALLENGE_RECEIVED
DUEL_CHALLENGE_CANCELLED
DUEL_CHALLENGE_ACCEPTED
DUEL_CHALLENGE_DECLINED
MATCH_CREATED
TURN_STARTED
ACTION_RESOLVED
BATTLE_STATE_SNAPSHOT
BATTLE_ENDED
REMATCH_REQUESTED
REMATCH_ACCEPTED
```

Names are illustrative; final implementation should use versioned message contracts.

## Direct challenge flow

```text
Player A opens Arena
  ↓
Selects Player B
  ↓
Server validates both available
  ↓
Challenge created with expiry
  ↓
Player B receives invitation
  ├── Decline → both return available
  └── Accept
       ↓
Server locks both players
       ↓
Battle room created
       ↓
Loadouts snapshotted
       ↓
Match starts
```

Invitation should expire automatically after a short interval.

## Quick Battle

Goal: one tap to get a fight.

Queue inputs may include:

- rating;
- ship power band;
- region/latency if population allows;
- queue duration.

Search criteria can widen gradually with waiting time.

## Ranked

Ranked differs from direct challenge:

- hidden/locked final opponent loadout before match;
- rating update on result;
- anti-abuse rules for repeated matches between the same pair;
- tighter server validation and telemetry.

## Rematch

After a duel either player may request a rematch.

Rules:

- both must accept;
- new match ID;
- loadout-change policy should be explicit;
- ranked rematch can be disabled or limited if exploitation appears.

## Reconnect

Server keeps authoritative battle state independent of the socket connection.

Reconnect flow:

```text
socket drops
  ↓
server marks reconnect grace
  ↓
client reconnects + authenticates
  ↓
server reattaches player to active match
  ↓
full battle snapshot sent
  ↓
turn/timer resumes from server truth
```

## Anti-cheat principles

The client may request actions but never decide outcomes.

Server owns:

- legal action validation;
- energy;
- cooldowns;
- damage;
- RNG;
- criticals;
- system damage;
- turn order;
- victory;
- rewards;
- rating.

Never trust client values for damage, inventory, power score, or match result.

## Accounts

MVP account data:

- immutable user ID;
- display name;
- authentication identity;
- selected avatar;
- inventory;
- active loadout;
- progression;
- rating / league;
- match history summary.

## Friends — post-MVP

Planned capabilities:

- send/accept friend request;
- online status;
- direct duel;
- rematch/history shortcut;
- invite to private room.

## Spectator mode — post-MVP

Spectators subscribe read-only to a battle stream.

Requirements:

- no gameplay commands;
- optional delay for competitive integrity;
- bounded spectator count initially;
- no exposure of hidden tactical data.

## Communication

Do **not** ship unrestricted text chat in MVP.

Use curated emotes/phrases first:

- GG
- Nice shot!
- Oops!
- Ready?
- 🔥
- 👍

Reason: avoids moderation, harassment, spam, and reporting infrastructure during core validation.

## Low-population strategy

A PvP-only product is vulnerable to empty queues.

Mitigations:

- direct challenge list;
- quick match;
- clear online count;
- short battles;
- widening matchmaking bands;
- optional clearly labeled bots for internal/closed-alpha testing;
- scheduled community play windows during earliest tests.
