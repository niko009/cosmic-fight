# Implementation Status

## 2026-08-28 — Web + server vertical slice

The repository now contains a production-shaped Web-first vertical slice that intentionally advances the previous phase order at the product owner's request.

Implemented:

- responsive TypeScript/Vite Web client in `web/`;
- ASP.NET Core 9 server in `server/`;
- server-authoritative AI duel flow;
- modular ships with Core, Engines, Weapons, Armor, Hull and Sensors;
- Laser, Missile, Scatter and Plasma;
- local armor absorption;
- Fire and Electrical Short statuses;
- targeted Repair with limited kits;
- module damage states and functional consequences;
- persistent player credits, XP, rating, W/L and upgrades;
- PostgreSQL persistence;
- guest identity stored through a secure server cookie;
- Google OAuth account linking, including migration of an existing guest profile;
- SignalR realtime/presence foundation for later PvP;
- health and version endpoints;
- Docker Compose deployment compatible with the Bacus Agent standard profile;
- PWA shell/manifest and network-first service worker.

## Runtime architecture

```text
cosmic-fight.bacus.dev
        |
        v
ASP.NET Core :8080
  |-- static Vite build
  |-- /api/*
  |-- /auth/google*
  |-- /hubs/game
        |
        v
PostgreSQL 16
```

The browser never submits damage or battle outcomes. It submits action intent (`fire` / `repair`, weapon, target, turn). The server validates and resolves the battle.

## Google OAuth production configuration

The implementation is complete, but Google still requires credentials for this domain. Set server-side environment values:

```text
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=https://cosmic-fight.bacus.dev/auth/google/callback
```

The corresponding Google OAuth Web Client must include this exact authorized redirect URI. Until credentials are configured, guest profiles remain fully playable and persistent in PostgreSQL; the UI reports that Google cloud-save configuration is pending.

## Next recommended slice

1. Replace AI-only arena with real two-player challenge/accept flow over SignalR.
2. Persist active battle snapshots/reconnect state.
3. Add deterministic battle-engine tests and two-client E2E tests.
4. Add matchmaking/rematch/history UI.
5. Tune module/weapon balance from real play sessions.
6. After Web PvP is stable, connect the Godot Android client to the same contracts.
