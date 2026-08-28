# Technical Architecture Direction

## Status

Current implementation architecture for the Web-first validation strategy. Product rules remain defined by the GDD/Decisions; this document defines the shared technical shape.

## System overview

Cosmic Fight will have one authoritative backend and two clients:

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

The Web client is built/tested first. The Android/Godot client follows after Web PvP and combat rules are validated.

## Web client

Preferred direction:

- TypeScript;
- Vite;
- Babylon.js for battle rendering/animation;
- mobile-first responsive browser UI;
- target deployment at `cosmic-fight.bacus.dev`.

Responsibilities:

- rendering;
- input;
- UI;
- animation/VFX/audio;
- local prototype logic before networking is introduced;
- realtime transport once connected to the server;
- presentation of authoritative state.

Once multiplayer is introduced, the Web client must **not** own competitive outcomes.

## Android client

Existing foundation:

- Godot 4.7.2 .NET;
- C# / .NET 9;
- portrait/mobile-first;
- Godogen-compatible project at repository root.

Responsibilities match the Web client: rendering, input, UX, audio/VFX and authoritative-state presentation.

Android must consume the same backend and battle contracts as Web. Do not create a second authoritative combat implementation in the mobile client.

Godogen is primarily an Android/Godot implementation aid, not a requirement for Web/server development.

## Server

Preferred stack:

- ASP.NET Core / .NET;
- PostgreSQL;
- SignalR/WebSocket for realtime communication;
- REST/HTTP for non-realtime operations;
- Docker for deployment;
- structured logging and health/version endpoints.

The dedicated authoritative backend handles:

- authentication/session identity;
- presence;
- matchmaking;
- duel invitations;
- battle rooms;
- turn validation;
- combat resolution;
- RNG/deterministic resolution;
- reconnect state;
- inventory/loadout validation;
- progression rewards;
- rating;
- persistence.

## Realtime communication

Suggested split:

- HTTP/REST for account/profile/inventory/static operations;
- SignalR/WebSocket for presence, invitations, matchmaking status and battle events.

Both Web and Android clients use the same semantic event/contracts even if transport-client libraries differ.

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
- deterministic RNG seed/state or event log;
- result state.

## Suggested command model

Client sends intent only:

```json
{
  "battleId": "...",
  "turn": 4,
  "action": "attack",
  "weaponSlot": "primary"
}
```

Server responds with authoritative outcome events, not a client-supplied damage value.

## Shared contracts

Web and Android are two clients of the same game. Shared/versioned contracts should cover:

- player/profile DTOs;
- loadout snapshot;
- battle snapshot;
- action commands;
- battle events/results;
- presence/challenge events;
- matchmaking state;
- error/version semantics.

Avoid client-specific combat rules. Client code may predict/animate harmless presentation, but server results always win.

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

Battle working state can begin in-process with persisted snapshots, then move to Redis/distributed storage if horizontal scale requires it.

## Database

PostgreSQL is the default durable store.

Use appendable transaction/history records for economy-sensitive changes where practical.

## Reconnect model

Socket identity and battle identity must be separate.

A player can lose a network connection without losing the server-side battle. On reconnect:

1. authenticate;
2. resolve active battle;
3. attach new socket/session;
4. send full battle snapshot;
5. continue if grace period not expired.

This must work for both browser refresh/reconnect and Android background/resume cases.

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

## Hosting direction

Initial production-like hosting should support:

- Web static/client deployment;
- ASP.NET Core server container;
- PostgreSQL;
- HTTPS/WSS;
- health/version endpoints;
- logs and restart policy.

The Web client should be deployable at `cosmic-fight.bacus.dev` once the PvP alpha is ready.

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

### Web QA

- portrait/mobile browser layout;
- desktop responsive layout;
- readable combat state;
- reconnect/browser refresh;
- touch input;
- performance on representative mobile browsers.

### Android QA

- portrait mobile layout;
- multiple aspect ratios;
- interrupted network;
- background/resume;
- reconnect after app focus changes;
- device/export validation.

### E2E

Two automated clients should be able to:

1. login or obtain test identity;
2. appear online;
3. challenge;
4. accept;
5. complete a deterministic authoritative battle;
6. receive correct results/rewards.

Run E2E against Web first, then repeat contract/parity checks for Android.

## Security basics

- TLS only in production;
- secure auth token storage;
- rate-limit challenge spam and action endpoints;
- validate all client payloads;
- no secrets in clients;
- abuse/reporting hooks planned before public scale.
