# Technical Architecture Direction

## Status

Current architecture for the Web-first validation strategy and updated modular-combat model.

## System overview

```text
                     Cosmic Fight
                          |
                 ASP.NET Core Server
              REST + SignalR/WebSocket
                     PostgreSQL
                          |
              +-----------+-----------+
              |                       |
         Web Client              Android Client
   Babylon.js / TypeScript       Godot 4 .NET / C#
```

Web is built/tested first. Android follows after Web PvP and combat rules are validated.

## Web client

Preferred direction:

- TypeScript;
- Vite;
- Babylon.js where battle rendering benefits from it;
- responsive browser UI;
- target deployment at `cosmic-fight.bacus.dev`.

Before networking, the Web prototype may contain local deterministic combat logic solely to validate gameplay.

Once multiplayer is introduced, the Web client must not own competitive outcomes.

## Android client

Existing foundation:

- Godot 4.7.2 .NET;
- C# / .NET 9;
- Godogen-compatible project at repository root.

Android consumes the same backend and battle contracts as Web.

Orientation is no longer technically fixed to portrait; final Android orientation should follow Phase 1 usability findings.

## Server

Preferred stack:

- ASP.NET Core / .NET;
- PostgreSQL;
- SignalR/WebSocket for realtime communication;
- REST/HTTP for non-realtime operations;
- Docker;
- structured logs;
- health/version endpoints.

The authoritative backend handles:

- authentication/session identity;
- presence;
- matchmaking;
- duel invitations;
- battle rooms;
- turn validation;
- target validation;
- weapon resolution;
- RNG;
- armor absorption;
- module damage;
- Fire/Short/Stress effects;
- power-network recalculation;
- repair resource/use;
- reconnect state;
- loadout validation;
- progression/rating/rewards;
- persistence.

## Authoritative modular battle state

Server-side battle aggregate should contain at minimum:

- battle ID;
- player IDs;
- immutable ship/loadout snapshots;
- turn index;
- active player;
- timer/deadline;
- result state;
- deterministic RNG seed/state or event log;
- each player's remaining repair resources;
- each player's ship module graph.

Each module snapshot should contain at minimum:

- module ID;
- module type;
- current HP;
- maximum HP;
- connection IDs;
- powered/functional state;
- temporary status effects;
- any module-specific modifiers required by the validated rules.

Do not reduce the authoritative model back to one global HP bar if the validated gameplay depends on module topology.

## Command model

Attack intent example:

```json
{
  "battleId": "...",
  "turn": 4,
  "action": "fire",
  "weaponId": "plasma",
  "targetModuleId": "enemy-core"
}
```

Repair intent example:

```json
{
  "battleId": "...",
  "turn": 5,
  "action": "repair",
  "targetModuleId": "player-engine-left"
}
```

The client never submits damage, hit results, status results or victory state.

## Server resolution pipeline

Suggested order:

```text
validate player / battle / turn
→ validate weapon/action
→ validate target module
→ resolve accuracy/RNG
→ resolve local armor coverage
→ apply target damage
→ resolve splash
→ resolve Fire/Short/Stress
→ resolve destruction/cascade
→ recalculate power graph/system effectiveness
→ check victory
→ emit authoritative events/snapshot
```

## Shared contracts

Web and Android share/version contracts for:

- player/profile;
- ship/loadout/module definitions;
- battle snapshots;
- fire/repair commands;
- module-damage/status events;
- battle result;
- presence/challenge/matchmaking events;
- error/version semantics.

Client code owns presentation, not competitive truth.

## Realtime communication

Suggested split:

- HTTP/REST for profile, inventory, loadout and static operations;
- SignalR/WebSocket for presence, challenge/matchmaking and battle events.

## Persistence

Persistent entities can include:

- User;
- PlayerProfile;
- InventoryItem;
- ShipLayout / ShipLoadout;
- Module/Equipment ownership;
- Progression;
- Rating;
- MatchSummary;
- EconomyTransaction.

Battle working state can begin in process with snapshots/events, then move to Redis/distributed storage only if scale requires it.

## Database

PostgreSQL is the default durable store.

## Reconnect model

Socket identity and battle identity are separate.

On reconnect:

1. authenticate;
2. resolve active battle;
3. attach new socket/session;
4. send full authoritative modular battle snapshot;
5. continue if grace period has not expired.

Must work for browser refresh and Android background/resume.

## Anti-cheat

Server validates:

- legal loadout;
- legal module topology/data version;
- current player/turn;
- selected weapon availability;
- selected target exists and is targetable;
- repair resource availability;
- damage/status/cascade generated server-side;
- result/reward settled once.

Use idempotency for action submission and reward settlement.

## Hosting direction

Initial production-like hosting supports:

- Web client;
- ASP.NET Core server container;
- PostgreSQL;
- HTTPS/WSS;
- health/version endpoints;
- logs/restart policy.

## Observability

Track at minimum:

- online connections;
- matchmaking wait;
- battle start/end/duration;
- disconnect/reconnect;
- action/target selection;
- weapon usage;
- module destruction frequency;
- armor absorption;
- repair usage;
- invalid commands;
- server exceptions.

These metrics are also valuable for balance decisions.

## Testing layers

### Combat unit tests

- target validation;
- weapon damage;
- armor absorption;
- module state transitions;
- Fire/Short/Stress;
- cascade bounds;
- power graph recalculation;
- repair rules;
- victory conditions;
- deterministic RNG/event replay where implemented.

### Server integration tests

- challenge flow;
- match creation;
- valid/invalid fire command;
- valid/invalid repair command;
- duplicate commands;
- reconnect;
- simultaneous/late messages;
- result/reward idempotency.

### Web QA

- wide desktop battle layout;
- narrow/mobile responsive layout;
- precise tap targeting;
- readable module states;
- browser refresh/reconnect once online;
- representative mobile-browser performance.

### Android QA

- chosen orientation/aspect ratios;
- touch target precision;
- interrupted network;
- background/resume;
- device/export validation.

### E2E

Two automated clients should be able to:

1. obtain identities;
2. appear online;
3. challenge/accept;
4. submit targeted actions;
5. complete an authoritative modular battle;
6. receive identical final results.

## Security basics

- TLS only in production;
- secure auth token storage;
- rate-limit challenge/action spam;
- validate all payloads;
- no secrets in clients;
- moderation/reporting hooks before public scale.
