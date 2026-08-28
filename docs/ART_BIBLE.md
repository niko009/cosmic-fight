# Cosmic Fight Art Bible

This document defines the visual language for all production and generated assets. It is authoritative for Godogen/Codex and for any external image/3D/audio generation workflow.

## 1. Core visual identity

Cosmic Fight must feel like a premium competitive mobile sci-fi game, not generic stock-space art.

Keywords:

- premium;
- tactical;
- readable;
- cinematic;
- metallic;
- high-tech;
- dangerous but not horror;
- stylized realism rather than photorealism.

The player should immediately understand which object is theirs, which is hostile, what was damaged, and what action is available.

## 2. Color language

Use colors semantically and consistently:

- **Electric blue / cyan** — local player, shields, neutral technology, navigation.
- **Red / orange-red** — enemy, danger, hull damage, critical hit.
- **Gold / amber** — rank, rewards, valuable progression, important confirmation.
- **Purple / violet** — special abilities, rare/advanced technology.
- **Green** — repair, healing, positive recovery state.
- **Dark navy / black** — primary environment and UI base.

Avoid rainbow UI and arbitrary per-screen color changes.

## 3. Ships

### Silhouette

Every hull class must be identifiable from silhouette alone.

- **Scout** — compact, narrow, agile, forward-swept form.
- **Fighter** — balanced military interceptor, medium width and mass.
- **Destroyer** — larger, heavier, broad armored silhouette.

### Shared design language

All player ships should look like they come from the same technological universe:

- layered metallic hull plating;
- readable cockpit/core region;
- visible engine emitters;
- modular weapon hardpoints;
- restrained panel-line detail;
- no random decorative antenna forests;
- no fantasy wings unless mechanically plausible;
- no copyrighted franchise resemblance.

### Materials

Primary materials:

- dark gunmetal;
- brushed titanium;
- ceramic white/gray panels;
- emissive blue/cyan technology strips.

Enemy variants may use darker metal and red/orange emissions, but should remain visually compatible with the same universe.

### Technical model rules

Prototype/MVP targets:

- GLB/glTF 2.0;
- mobile-friendly geometry;
- target 20k–50k triangles per hero ship for early production;
- sensible mesh hierarchy;
- centered origin;
- forward axis documented and consistent;
- separate obvious emissive areas where practical;
- no baked environment/background;
- avoid unnecessary internal geometry;
- primitive-friendly collision bounds.

## 4. Weapons

Weapon identity must be readable in less than one second.

### Laser

- clean coherent beam;
- blue/cyan or hot white core;
- precise, technological;
- low visual clutter.

### Plasma Cannon

- slower, heavier energy projectile;
- bright blue-violet core;
- strong bloom/glow;
- larger impact than laser.

### Missile

- physical projectile;
- orange engine trail;
- smoke/debris on impact;
- distinct from energy weapons.

### Railgun

- extremely fast projectile/readable line event;
- white/blue kinetic flash;
- sharp metallic impact;
- armor-penetration visual language.

## 5. Damage and combat feedback

Damage must be visually progressive.

### Shield impact

- translucent hex/energy shell or localized ripple;
- bright blue/cyan flash;
- no hull debris while shield fully absorbs damage.

### Hull impact

- sparks;
- fragments;
- short orange-red flash;
- localized smoke when meaningful.

### Critical hit

- larger impact flash;
- brief camera shake;
- stronger sound layer;
- critical UI callout;
- optional short slow-motion emphasis only if it does not hurt PvP pacing.

### Low hull

Persistent but restrained indicators:

- smoke;
- intermittent sparks;
- damaged emissive strips;
- small fire only for severe hull damage.

## 6. Battlefield

The battlefield exists to showcase the ships and combat, not compete with them.

Preferred:

- dark deep-space field;
- colored nebula clouds used sparingly;
- distant planet/moon;
- subtle asteroid/debris elements;
- strong depth separation;
- readable central combat corridor.

Avoid overly bright backgrounds behind HUD text or weapon impacts.

## 7. Camera and composition

Mobile portrait is the primary design target.

Battle composition:

- enemy ship in upper combat region;
- player ship in lower combat region;
- clear firing corridor between them;
- enough empty space for beams/projectiles and effects;
- HUD does not obscure primary ship silhouettes.

Ships should feel large and valuable, not tiny icons floating in a huge empty scene.

## 8. UI language

UI qualities:

- dark metallic panels;
- thin luminous edge accents;
- strong hierarchy;
- large readable numbers;
- touch-friendly buttons;
- restrained sci-fi decoration.

Functional UI must always win over decoration.

Do not use tiny fictional glyphs where users need to read real information.

### Action buttons

Five baseline combat actions must have both icon and label:

- Attack — red;
- Defend — blue;
- Charge — gold/yellow;
- Repair — green;
- Special — purple.

### Rank language

Bronze, Silver, Gold, Platinum, Diamond, Master should share one badge family with increasingly prestigious material and silhouette treatment.

## 9. Icon style

Icons should be:

- bold;
- single-concept;
- readable at small mobile size;
- consistent stroke/volume language;
- not overly detailed;
- delivered with transparent background when raster.

## 10. Audio identity

Audio should support weapon recognition and tactical clarity.

- Laser: precise high-energy snap/hum.
- Plasma: charging swell + heavy energy release.
- Missile: launch ignition + physical impact.
- Railgun: magnetic charge + violent kinetic crack.
- Shield: crystalline/electric resonance.
- Hull hit: metallic impact + debris.
- UI: short clean futuristic clicks, not arcade beeps everywhere.

Music should be atmospheric and tense but should not mask combat cues.

## 11. Asset generation rules

When generating new art, models, textures, VFX references, portraits, or audio:

1. Read this Art Bible first.
2. Read `VISUAL_DIRECTION.md` and the relevant reference images.
3. Use the exact Asset ID and path from `ASSET_MANIFEST.md`.
4. Preserve the shared visual language across generations.
5. Generate/review one representative asset before mass-producing a category.
6. Do not silently accept style drift.
7. Do not use copyrighted characters, logos, ships, or obvious franchise lookalikes.
8. Record generator/provider and prompt version in the manifest when an asset is accepted.

## 12. Approval states

Every production asset uses one of these states:

- `MISSING` — required but not created.
- `PLACEHOLDER` — temporary asset used for implementation.
- `GENERATED` — candidate produced but not approved.
- `APPROVED` — accepted for current build.
- `FINAL` — launch-ready, rights/technical quality verified.

Godogen/Codex must not treat `PLACEHOLDER` or `GENERATED` as final art.
