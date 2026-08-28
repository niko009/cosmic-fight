# Visual Direction

## Target

Cosmic Fight should feel like a premium competitive sci-fi game, not a generic dashboard with spaceship art behind it.

The UI and battlefield share one visual language:

- deep black/navy space;
- metallic framed panels;
- electric blue for player/neutral systems;
- red for enemy/danger/damage;
- gold for rank/reward/important progression;
- purple for special/rare abilities;
- green for healing/positive state.

## Battle screen

![Battle concept](images/battle-screen.jpg)

Key composition:

- enemy information at top;
- enemy ship occupies upper combat field;
- local ship occupies lower combat field;
- ships face each other along the vertical axis;
- dramatic projectiles/beams travel through a large central space;
- current-turn banner sits near the action rather than hidden in a corner;
- local stats and energy live immediately above the action bar;
- five large action buttons remain thumb-readable;
- combat log is concise and high-value.

Desired feedback:

- shield forms a visible energy shell on impact;
- hull hits throw sparks/debris;
- critical hit has stronger camera/audio treatment;
- low-hull ship shows persistent damage/smoke;
- weapon identity is recognizable by VFX.

## Online Arena

![Online Arena concept](images/online-arena.jpg)

Key UX:

- online player count visible near title;
- available opponents scan quickly;
- `Challenge` is the dominant row action;
- status is visually obvious;
- player card can expose more profile/ship information;
- bottom navigation provides direct access to Hangar/Arena/etc.

MVP simplification:

- spectator button can remain disabled/hidden until implemented;
- friends/private room can be visually reserved but not required in the first build.

## Hangar / ship loadout

![Hangar concept](images/hangar.jpg)

Key composition:

- ship is the hero object;
- equipped systems are spatially associated around it;
- current HP/shield/energy/power summarized under ship;
- Upgrade / Equip / Battle are high-priority actions;
- inventory cards use consistent rarity/type language;
- hangar lighting should make upgrades feel tangible.

## GDD concept boards

These generated boards are retained as visual references for product intent, not as literal final UI specifications.

![GDD overview](images/gdd-overview.jpg)

![Gameplay and progression board](images/gdd-gameplay-progression.jpg)

![Multiplayer roadmap board](images/gdd-multiplayer-roadmap.jpg)

## Typography

Target qualities:

- condensed/technical headline family;
- highly legible body/UI family;
- uppercase labels used selectively;
- numeric combat data must be immediately readable.

Avoid tiny decorative sci-fi fonts for functional information.

## Motion

Motion priorities:

1. weapon fire;
2. shield response;
3. hull impact;
4. ship idle motion / engine glow;
5. panel transitions;
6. reward reveal.

Do not over-animate every UI panel. Combat motion should have more visual weight than menu chrome.

## Mobile rules

- portrait-first;
- primary actions within comfortable lower-screen reach;
- no critical text below comfortable minimum size;
- safe areas respected;
- important combat state visible without scrolling;
- action icons plus text labels—do not rely on icons only;
- maintain contrast in bright displays and dim environments.

## Asset production direction

For prototype:

- generated concept art is acceptable;
- ships may start from generated/model assets;
- VFX can be procedural/simple;
- prioritize consistent art direction over asset quantity.

Before public launch:

- normalize ship scale/material language;
- ensure commercial rights for all assets;
- establish reusable VFX palette;
- produce original logo and store-safe marketing art.
