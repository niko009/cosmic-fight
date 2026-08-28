# Cosmic Fight — Visual Design System

## Goal

The game UI must be easy to reskin without changing combat, PvP, persistence, or server contracts.

The current reference direction comes from `space_busters.html`: modules must be understood primarily by **shape + icon + color + readable name**, not by engineering abbreviations alone.

Stable visual grammar:

| Module | Icon | Meaning |
|---|---:|---|
| Core | ◎ | power source |
| Engine | ▲ | mobility / targeting stability |
| Weapon | ◆ | firing hardpoint |
| Armor | ▣ | damage absorption / protection |
| Hull | ▭ | structural frame |
| Sensor | ◉ | targeting |

## Architecture

```text
server / gameplay contracts
        ↓
web/src/app.ts
  semantic DOM only
  data-drag="core"
  data-module="weapon-left"
        ↓
web/src/design/module-catalog.ts
  module names / roles / icons / semantic kinds
        ↓
web/src/design/module-ui.ts
  presentation-only progressive enhancement
  module labels / tooltips / connection lines / legend
        ↓
web/src/design/tokens.css
  palette / surfaces / semantic module colors / geometry tokens
        ↓
web/src/design/modules.css
  current visual skin
```

`module-ui.ts` must not decide damage, legal actions, upgrades, rewards, matchmaking, or persistence. It is a presentation adapter only.

## Redesign rules

For a normal visual redesign, prefer changing files in this order:

1. `tokens.css` — global palette, module colors, radii, shadows.
2. `modules.css` — module shapes, label treatment, hover/focus states, connection-line presentation.
3. Existing layout CSS (`hangar.css`) only when composition/layout itself changes.
4. `module-catalog.ts` only when terminology or visual semantics change.

Do **not** rename server module IDs (`core`, `weapon-left`, `armor-top`, etc.) just to redesign the UI. IDs are gameplay/persistence contracts.

## Module readability requirements

Every module must remain identifiable without reading a short code such as `ARM`, `ENG`, or `WPN`.

Required cues:

- a unique icon;
- a stable semantic color;
- visibly different geometry where practical;
- full localized name in the Hangar;
- full localized name on battle targets where space allows;
- tooltip/accessible description;
- visible system connections when they improve comprehension;
- state overlays (damaged / critical / destroyed / fire / short) must not erase module identity.

## Responsive rule

Desktop can show full labels and roles. Mobile may simplify secondary text, but icon + color + module name must stay readable.

## Future themes

A future theme should be implementable as another token/skin layer (for example `industrial`, `holographic`, `retro-terminal`) while retaining the same semantic module catalog and gameplay DOM.
