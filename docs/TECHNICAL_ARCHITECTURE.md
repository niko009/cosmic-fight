# Technical Architecture Direction

## Status

Architecture direction for implementation. Exact services and hosting are intentionally not over-specified before the gameplay prototype is validated.

## Client

Preferred direction:

- Godot 4 .NET;
- C#;
- Android first;
- desktop/editor build for development and QA.

Client responsibilities:

- rendering;
- input;
- UI;
- animation/VFX/audio;
- local prediction only where harmless;
- networking transport;
- authoritative state presentation.

Client must **not** own competitive outcomes.

## Server

A dedicated authoritative backend handles:

- authentication/session identity;
- presence;
- matchmaking;
- duel invitations;
- battle rooms;
- turn validation;
- combat resolution;
- RNG;
- reconnect state;
- inventory/loadout validation;
- progression rewards;
- rating;
- persistence.

Given the project's C# direction, ASP.NET Core is a natural candidate, but implementation should optimize for reliability and iteration speed rather than ideological stack purity.

## Realtime communication

Use WebSocket-style persistent connections. SignalR is a strong candidate for a .NET backend.

Suggested split:

- HTTP/REST for account/profile/inventory/static operations;
- WebSocket/SignalR for presence, invitations, matchmaking status, and battle events.

## Authoritative battle state

Server-side battle aggregate should contain at minimum:

- battle ID;
- player IDs;
- immutable loadout snapshots;
- turn index;
- active player;
- timer/deadline;
- hull HP;
- shield;
- energy;
- cooldowns;
- status/system effects;
- RNG seed/state or deterministic event log;
- result state.

## Suggested command model

Client sends intent:

```json
{
  "battleId": "...",
  "turn": 4,
  "action": "attack",
  "weaponSlot": "primary"
}
```

Server responds with authoritative outcome events, not a client-supplied damage value.

## Persistence

Persistent entities:

- User
- PlayerProfile
- InventoryItem
- ShipLoadout
- Progression
- Rating
- MatchSummary
- EconomyTransaction

Battle working state can begin in process + persisted snapshots, then move to Redis/distributed storage if horizontal scale requires it.

## Database

PostgreSQL is a sensible default for durable data.

Use appendable transaction/history records for economy-sensitive changes where practical.

## Reconnect model

Socket identity and battle identity must be separate.

A player can lose a network connection without losing the server-side battle. On reconnect:

1. authenticate;
2. resolve active battle;
3. attach new socket/session;
4. send full battle snapshot;
5. continue if grace period not expired.

## Anti-cheat

Server validates:

- player owns selected item;
- item version/level is legal;
- loadout was locked before battle;
- action belongs to current player/turn;
- enough energy;
- cooldown available;
- effect allowed;
- damage/result generated server-side;
- reward only granted once.

Use idempotency for action submission and reward settlement.

## Observability

MVP needs structured logs and metrics for:

- connection count;
- online players;
- matchmaking wait;
- battle create/start/end;
- battle duration;
- disconnect/reconnect;
- invalid command attempts;
- server exceptions;
- reward settlement failures.

## Testing layers

### Combat unit tests

- damage calculations;
- energy/cooldown validation;
- shield/armor interaction;
- critical/system effects;
- sudden death;
- victory conditions.

### Server integration tests

- challenge flow;
- match creation;
- reconnect;
- duplicate commands;
- simultaneous messages;
- reward idempotency.

### Client tests / QA

- portrait mobile layout;
- multiple aspect ratios;
- readable combat state;
- interrupted network;
- background/resume on Android;
- reconnect after app focus changes.

### E2E

Two automated clients should be able to:

1. login;
2. appear online;
3. challenge;
4. accept;
5. complete a deterministic battle;
6. receive correct results/rewards.

## Security basics

- TLS only in production;
- secure auth token storage;
- rate-limit challenge spam and action endpoints;
- validate all client payloads;
- no secrets in client binary;
- abuse/reporting hooks planned before public scale.
