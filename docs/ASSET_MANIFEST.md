# Cosmic Fight Asset Manifest

This is the canonical registry of visual, 3D, VFX, UI, and audio assets required by the game.

Godogen/Codex must use this manifest before generating or wiring production assets.

## Rules

Each asset record should track:

- Asset ID
- canonical path
- type/format
- gameplay purpose
- technical constraints
- visual requirements
- generation prompt
- status
- provider/source
- notes

Allowed statuses:

`MISSING` → `PLACEHOLDER` → `GENERATED` → `APPROVED` → `FINAL`

For implementation, placeholders are preferred over blocking on art.

For production, the canonical path should remain stable so approved files can replace placeholders without gameplay-code changes.

## Canonical folder layout

```text
assets/
├── ships/
│   ├── scout/
│   ├── fighter/
│   └── destroyer/
├── weapons/
│   ├── laser/
│   ├── plasma/
│   ├── missile/
│   └── railgun/
├── vfx/
├── ui/
│   ├── actions/
│   ├── ranks/
│   ├── status/
│   └── portraits/
├── backgrounds/
├── audio/
│   ├── weapons/
│   ├── impacts/
│   ├── ui/
│   └── music/
└── fonts/
```

> Note: Godogen's publish helper may create an `assets` ignore entry for generated runtime material. For Cosmic Fight, approved/final production assets are intended to be version-controlled unless a later repository policy explicitly changes this. Review `.gitignore` after publishing Godogen into this repo.

---

# MVP Ship Assets

## CF-SHIP-001 — Scout Hull

**Path:** `assets/ships/scout/ship.glb`  
**Type:** GLB / glTF 2.0  
**Purpose:** lightweight agile hull; first playable hero ship  
**Status:** `PLACEHOLDER`

Placeholder source: procedural polygon in `scripts/Main.cs`; no external asset generated. The canonical GLB remains missing and will replace this presentation later.

Technical:

- 20k–40k triangle target;
- centered origin;
- clean hierarchy;
- no environment;
- mobile-friendly materials;
- visible engine emitters;
- no weapons permanently modeled into hull where avoidable.

Generation prompt:

> A premium stylized-realistic sci-fi scout starship for the mobile PvP game Cosmic Fight. Compact agile interceptor silhouette, narrow forward profile, swept modular wings, layered gunmetal and brushed titanium armor plates, restrained ceramic-white accent panels, electric-blue emissive engine strips, readable cockpit/core area, two clear modular weapon hardpoints, advanced but believable military technology, clean high-value hero asset, no background, no text, no logos, no resemblance to existing movie or game franchises. Designed to remain readable on a portrait mobile screen. 3D production reference, game-ready proportions.

## CF-SHIP-002 — Fighter Hull

**Path:** `assets/ships/fighter/ship.glb`  
**Type:** GLB  
**Purpose:** balanced baseline hull  
**Status:** `PLACEHOLDER`

Placeholder source: enemy-colored procedural polygon in `scripts/Main.cs`; no external asset generated. The canonical GLB remains missing and will replace this presentation later.

Generation prompt:

> A premium stylized-realistic medium sci-fi fighter starship for Cosmic Fight. Balanced interceptor/gunship silhouette, broader and heavier than a scout but still fast, layered titanium and dark gunmetal armor, electric-blue engine emitters, central cockpit/core, symmetric modular weapon mounts, practical military spacecraft design, clear silhouette at mobile scale, no background, no logos, no franchise resemblance, production-ready 3D concept.

## CF-SHIP-003 — Destroyer Hull

**Path:** `assets/ships/destroyer/ship.glb`  
**Type:** GLB  
**Purpose:** heavy/tank hull  
**Status:** `MISSING`

Generation prompt:

> A heavy premium sci-fi destroyer starship for Cosmic Fight, stylized realism. Broad armored silhouette, thick layered gunmetal/titanium plating, reinforced central hull, visible modular weapon hardpoints, large blue engine emitters, powerful and durable rather than sleek, readable front and side silhouette, advanced believable military technology, mobile-game hero asset, no environment, no text, no logos, no resemblance to existing franchises.

---

# Ship UI Assets

For each hull create:

- `assets/ships/<hull>/icon.png` — 512×512 transparent ship icon;
- `assets/ships/<hull>/portrait.png` — 1024×1024 hangar/selection portrait;
- optional `damage_mask.png` only if required by final damage shader workflow.

Prompt pattern:

> Clean premium game UI portrait of the approved Cosmic Fight [HULL] starship, same exact design and proportions as the 3D model, three-quarter view, dark neutral space/hangar lighting, strong silhouette, electric-blue technology accents, transparent or controlled dark background as requested, no text, no logo, consistent with Cosmic Fight Art Bible.

---

# MVP Weapons

## CF-WPN-001 — Laser Cannon

**Model path:** `assets/weapons/laser/weapon.glb`  
**Icon path:** `assets/weapons/laser/icon.png`  
**Status:** `MISSING`

Prompt:

> Modular precision laser cannon for the Cosmic Fight starship universe. Compact military energy weapon, dark gunmetal and titanium casing, cyan-white emitter core, believable mounting point, clean high-tech construction, same material language as Cosmic Fight ships, isolated object, no background, no text, no franchise resemblance.

## CF-WPN-002 — Plasma Cannon

**Model path:** `assets/weapons/plasma/weapon.glb`  
**Icon path:** `assets/weapons/plasma/icon.png`  
**Status:** `MISSING`

Prompt:

> Heavy modular plasma cannon for Cosmic Fight, larger energy chamber, blue-violet glowing containment core, armored gunmetal housing, powerful high-energy silhouette, same technological family as Cosmic Fight ships, isolated production asset, no text, no background, no franchise resemblance.

## CF-WPN-003 — Missile Launcher

**Model path:** `assets/weapons/missile/weapon.glb`  
**Icon path:** `assets/weapons/missile/icon.png`  
**Status:** `MISSING`

Prompt:

> Compact modular starship missile launcher for Cosmic Fight. Armored multi-cell launcher, believable mechanical doors and mounting point, titanium and gunmetal materials, restrained orange warning accents, premium military sci-fi design, isolated object, no background, no text, no franchise resemblance.

## CF-WPN-004 — Railgun

**Model path:** `assets/weapons/railgun/weapon.glb`  
**Icon path:** `assets/weapons/railgun/icon.png`  
**Status:** `MISSING`

Prompt:

> Long modular electromagnetic railgun for Cosmic Fight. Two reinforced acceleration rails, compact magnetic coil structures, titanium and dark gunmetal construction, small white-blue energy accents, precise kinetic weapon identity, premium believable sci-fi engineering, isolated game asset, no text, no background, no franchise resemblance.

---

# MVP Combat VFX

These may begin as procedural Godot effects. External image/video generation is optional.

## CF-VFX-001 — Laser Beam

**Canonical resource:** `assets/vfx/laser_beam.tres` or shader/material resources chosen by implementation  
**Status:** `MISSING`

Visual brief:

- thin white-hot core;
- cyan/blue glow;
- fast, precise;
- minimal smoke.

Reference prompt if generating concept frames:

> Premium sci-fi precision laser beam VFX for Cosmic Fight, narrow white-hot core, electric cyan outer glow, coherent beam, slight particles near impact only, dark space background, readable mobile-game combat effect, no UI, no ship.

## CF-VFX-002 — Plasma Projectile

Visual brief:

- bright blue-violet core;
- larger slower projectile;
- energetic halo;
- heavy impact.

Prompt:

> Heavy blue-violet plasma projectile VFX for Cosmic Fight, bright contained energy core, luminous turbulent halo, subtle trailing particles, premium mobile sci-fi combat effect, dark neutral background, isolated effect.

## CF-VFX-003 — Missile Trail

Visual brief:

- orange-white exhaust;
- short restrained smoke trail;
- physical projectile feel.

## CF-VFX-004 — Railgun Shot

Visual brief:

- near-instant white/blue kinetic streak;
- magnetic flash at muzzle;
- sharp impact debris.

## CF-VFX-005 — Shield Hit

**Status:** `MISSING`

Prompt:

> Localized starship shield impact effect for Cosmic Fight. Transparent blue-cyan energy shell appears only around the hit region, subtle hexagonal field structure, bright ripple at impact point, premium readable sci-fi game VFX, dark background, no ship required.

## CF-VFX-006 — Hull Hit

Visual brief:

- sparks;
- small fragments;
- orange-red flash;
- brief localized smoke.

## CF-VFX-007 — Critical Hit

Visual brief:

- stronger flash;
- larger debris burst;
- distinctive red/orange accent;
- supports camera shake.

## CF-VFX-008 — Repair

Visual brief:

- green/cyan controlled energy particles;
- technology, not magic;
- visible restoration pulse.

## CF-VFX-009 — Charge

Visual brief:

- gold/blue reactor energy buildup;
- energy channels converge toward ship core/weapon system.

## CF-VFX-010 — Explosion / Ship Destruction

Prompt:

> Cinematic but mobile-readable sci-fi starship destruction VFX for Cosmic Fight: bright orange-white core flash, metal debris fragments, sparks, short smoke expansion, restrained fireball scale, premium tactical game style, dark space background, no giant Hollywood cloud obscuring the whole screen.

---

# MVP UI Action Icons

Paths:

- `assets/ui/actions/attack.svg`
- `assets/ui/actions/defend.svg`
- `assets/ui/actions/charge.svg`
- `assets/ui/actions/repair.svg`
- `assets/ui/actions/special.svg`

**Status:** `MISSING`

Shared prompt:

> Create a bold clean futuristic mobile game UI icon for Cosmic Fight representing [ACTION]. Strong single-concept silhouette, readable at 48–64 px, premium sci-fi HUD style, consistent icon family, transparent background, no text, no decorative clutter.

Semantic colors:

- Attack: red;
- Defend: blue;
- Charge: gold/yellow;
- Repair: green;
- Special: purple.

---

# Status UI Icons

Initial paths:

- `assets/ui/status/hp.svg`
- `assets/ui/status/shield.svg`
- `assets/ui/status/energy.svg`
- `assets/ui/status/power.svg`
- `assets/ui/status/critical.svg`
- `assets/ui/status/reactor.svg`
- `assets/ui/status/weapon_damage.svg`

**Status:** `MISSING`

Use the same icon-family rules as action icons.

---

# Rank Badges

Paths:

- `assets/ui/ranks/bronze.png`
- `assets/ui/ranks/silver.png`
- `assets/ui/ranks/gold.png`
- `assets/ui/ranks/platinum.png`
- `assets/ui/ranks/diamond.png`
- `assets/ui/ranks/master.png`

**Status:** `MISSING`

Prompt:

> Cohesive set of six competitive rank badges for the sci-fi PvP game Cosmic Fight: Bronze, Silver, Gold, Platinum, Diamond, Master. Same badge family and silhouette language with increasing prestige, metallic futuristic military-emblem design, strong readability at mobile size, transparent background, no text inside badges, premium game UI quality.

---

# Player Portraits

MVP can use a small set of neutral pilot portraits.

Paths:

- `assets/ui/portraits/pilot_01.png`
- `assets/ui/portraits/pilot_02.png`
- `assets/ui/portraits/pilot_03.png`
- `assets/ui/portraits/pilot_04.png`

**Status:** `MISSING`

Prompt pattern:

> Original futuristic starship pilot portrait for Cosmic Fight, helmeted commander, premium stylized-realistic mobile game art, dark metallic suit, controlled colored visor lighting, neutral sci-fi background, shoulders/head composition, no text, no logo, no resemblance to known characters or franchises.

---

# MVP Backgrounds

## CF-BG-001 — Battle Space Arena

**Path:** `assets/backgrounds/battle_space_01.png` or implementation-specific cubemap/panorama  
**Status:** `PLACEHOLDER`

Placeholder source: procedural dark gradient-like circles and deterministic star points in `scripts/Main.cs`; no external asset generated. The canonical production background remains missing.

Prompt:

> Portrait-composed deep-space battle environment for Cosmic Fight. Dark navy starfield, restrained blue-purple nebula, distant planet edge and small moon, sparse asteroid/debris silhouettes, clear dark central combat corridor, premium cinematic sci-fi lighting, background must support strong HUD readability, no ships, no text, no logos.

## CF-BG-002 — Hangar Environment

**Path:** `assets/backgrounds/hangar_01.png` or 3D environment if selected  
**Status:** `MISSING`

Prompt:

> Premium futuristic starship hangar for Cosmic Fight, dark metallic docking bay, blue-white technical lighting, holographic maintenance elements, central empty platform designed to showcase one hero ship, clean mobile-game composition, no people required, no logos, no text, consistent with high-tech military space setting.

## CF-BG-003 — Online Arena / Command Deck

**Path:** `assets/backgrounds/online_arena_01.png`  
**Status:** `MISSING`

Prompt:

> Futuristic multiplayer command-deck background for Cosmic Fight, subtle holographic star map, deep navy metallic environment, cyan interface glow, designed as unobtrusive background behind an online player list, premium mobile sci-fi UI atmosphere, no readable embedded text, no logos.

---

# MVP Audio

Initial canonical paths:

```text
assets/audio/weapons/laser_fire.ogg
assets/audio/weapons/plasma_fire.ogg
assets/audio/weapons/missile_launch.ogg
assets/audio/weapons/railgun_fire.ogg
assets/audio/impacts/shield_hit.ogg
assets/audio/impacts/hull_hit.ogg
assets/audio/impacts/critical_hit.ogg
assets/audio/impacts/explosion.ogg
assets/audio/ui/button.ogg
assets/audio/ui/challenge_received.ogg
assets/audio/ui/victory.ogg
assets/audio/ui/defeat.ogg
assets/audio/music/battle_theme.ogg
assets/audio/music/menu_theme.ogg
```

**Status:** `MISSING`

Audio generation prompt patterns:

Laser:
> Short precise futuristic laser cannon fire sound, powerful but clean, high-energy snap with a brief electrical tail, no retro arcade pew, suitable for premium tactical mobile sci-fi combat.

Plasma:
> Heavy futuristic plasma cannon shot with brief energy charge-up and deep powerful release, blue-energy technological character, no fantasy magic tone, premium game SFX.

Shield:
> Futuristic energy shield impact, sharp electric-crystalline resonance with a controlled low-frequency pulse, short duration, readable tactical game feedback.

Hull:
> Heavy metallic spacecraft armor impact with sparks/debris texture and compact low-frequency hit, no giant explosion, premium sci-fi combat SFX.

---

# Placeholder Policy

Godogen/Codex may create placeholders to keep development moving.

Preferred placeholders:

- simple procedural meshes for ships/weapons;
- primitive collision shapes;
- basic shader VFX;
- simple vector action icons;
- flat gradient/space backgrounds;
- generated tones or silence for missing audio.

Rules:

1. Placeholder paths should match or map cleanly to canonical production paths.
2. Placeholder use must be recorded in this manifest.
3. Gameplay must not depend on temporary visual dimensions if avoidable.
4. Swapping a placeholder for an approved asset should require minimal or no gameplay-code change.

---

# Asset Acceptance Checklist

Before changing status to `APPROVED`:

- matches `ART_BIBLE.md`;
- visibly fits existing accepted assets;
- technically imports into Godot;
- correct orientation/scale;
- acceptable mobile performance;
- correct transparency/background;
- no obvious copyrighted IP resemblance;
- source/provider recorded;
- prompt/version recorded if AI-generated;
- visually inspected in the running game, not only in isolation.

`FINAL` additionally requires launch-level rights/licensing and final technical QA.
