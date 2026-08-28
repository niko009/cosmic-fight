import './battle-effects.css';

export type CombatVisualEvent = {
  id: string;
  turn: number;
  kind: 'fire' | 'repair' | string;
  side: 'player' | 'enemy';
  weaponId?: string | null;
  sourceModuleId?: string | null;
  targetModuleId?: string | null;
  hit: boolean;
  aimSpread: number;
  endX: number;
  endY: number;
  at: string;
};

type Point = { x: number; y: number };

const wait = (ms: number) => new Promise<void>(resolve => window.setTimeout(resolve, ms));

function hashSeed(value: string) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seeded(seed: number) {
  let state = seed || 1;
  return () => {
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;
    return (state >>> 0) / 4294967296;
  };
}

function center(element: Element, root: HTMLElement): Point {
  const r = element.getBoundingClientRect();
  const b = root.getBoundingClientRect();
  return { x: r.left - b.left + r.width / 2, y: r.top - b.top + r.height / 2 };
}

function normalizedPoint(field: HTMLElement, root: HTMLElement, x: number, y: number): Point {
  const r = field.getBoundingClientRect();
  const b = root.getBoundingClientRect();
  return { x: r.left - b.left + r.width * x / 100, y: r.top - b.top + r.height * y / 100 };
}

function shipRoot(side: string, ownSide: string) {
  return side === ownSide ? '.cf-combatship.friend' : '.cf-combatship.enemy';
}

function endpoints(event: CombatVisualEvent, ownSide: string, root: HTMLElement): { start: Point; end: Point } | null {
  const sourceRoot = root.querySelector<HTMLElement>(shipRoot(event.side, ownSide));
  const targetRoot = root.querySelector<HTMLElement>(shipRoot(event.side === 'player' ? 'enemy' : 'player', ownSide));
  if (!sourceRoot || !targetRoot) return null;

  const source = event.sourceModuleId
    ? sourceRoot.querySelector<HTMLElement>(`[data-module="${CSS.escape(event.sourceModuleId)}"]`)
    : null;
  const sourceField = sourceRoot.querySelector<HTMLElement>('.cf-combatfield');
  const targetField = targetRoot.querySelector<HTMLElement>('.cf-combatfield');
  if (!targetField) return null;

  const start = source
    ? center(source, root)
    : sourceField
      ? normalizedPoint(sourceField, root, 50, 50)
      : center(sourceRoot, root);

  let end: Point;
  if (event.hit && event.targetModuleId) {
    const target = targetRoot.querySelector<HTMLElement>(`[data-module="${CSS.escape(event.targetModuleId)}"]`);
    end = target ? center(target, root) : normalizedPoint(targetField, root, event.endX, event.endY);
  } else {
    end = normalizedPoint(targetField, root, event.endX, event.endY);
  }
  return { start, end };
}

function layer(root: HTMLElement) {
  let result = root.querySelector<HTMLElement>(':scope > .cf-projectile-layer');
  if (!result) {
    result = document.createElement('div');
    result.className = 'cf-projectile-layer';
    root.append(result);
  }
  return result;
}

function lineGeometry(start: Point, end: Point) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  return { distance: Math.hypot(dx, dy), angle: Math.atan2(dy, dx) * 180 / Math.PI };
}

async function laser(event: CombatVisualEvent, start: Point, end: Point, host: HTMLElement) {
  const beam = document.createElement('i');
  beam.className = 'cf-shot cf-shot-laser';
  const geo = lineGeometry(start, end);
  beam.style.left = `${start.x}px`;
  beam.style.top = `${start.y}px`;
  beam.style.width = `${geo.distance}px`;
  beam.style.transform = `rotate(${geo.angle}deg) scaleX(0)`;
  host.append(beam);
  const animation = beam.animate([
    { transform: `rotate(${geo.angle}deg) scaleX(0)`, opacity: .2 },
    { transform: `rotate(${geo.angle}deg) scaleX(1)`, opacity: 1, offset: .32 },
    { transform: `rotate(${geo.angle}deg) scaleX(1)`, opacity: 0 }
  ], { duration: 360, easing: 'cubic-bezier(.15,.8,.22,1)' });
  await animation.finished.catch(() => undefined);
  beam.remove();
}

async function missile(event: CombatVisualEvent, start: Point, end: Point, host: HTMLElement) {
  const rocket = document.createElement('i');
  rocket.className = 'cf-shot cf-shot-missile';
  const rand = seeded(hashSeed(event.id));
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.max(1, Math.hypot(dx, dy));
  const bend = (18 + event.aimSpread * 65) * (rand() > .5 ? 1 : -1);
  const mx = (start.x + end.x) / 2 - dy / length * bend;
  const my = (start.y + end.y) / 2 + dx / length * bend;
  const startAngle = Math.atan2(my - start.y, mx - start.x) * 180 / Math.PI;
  const endAngle = Math.atan2(end.y - my, end.x - mx) * 180 / Math.PI;
  const midAngle = (startAngle + endAngle) / 2;
  rocket.style.left = `${start.x}px`;
  rocket.style.top = `${start.y}px`;
  rocket.style.transform = `translate(-50%,-50%) rotate(${startAngle}deg) scale(.75)`;
  host.append(rocket);
  const animation = rocket.animate([
    { left: `${start.x}px`, top: `${start.y}px`, transform: `translate(-50%,-50%) rotate(${startAngle}deg) scale(.75)` },
    { left: `${mx}px`, top: `${my}px`, transform: `translate(-50%,-50%) rotate(${midAngle}deg) scale(1.05)`, offset: .55 },
    { left: `${end.x}px`, top: `${end.y}px`, transform: `translate(-50%,-50%) rotate(${endAngle}deg) scale(.9)` }
  ], { duration: 760, easing: 'cubic-bezier(.25,.4,.18,1)' });
  await animation.finished.catch(() => undefined);
  rocket.remove();
}

async function plasma(event: CombatVisualEvent, start: Point, end: Point, host: HTMLElement) {
  const bolt = document.createElement('i');
  bolt.className = 'cf-shot cf-shot-plasma';
  const rand = seeded(hashSeed(event.id));
  const drift = event.aimSpread * 34;
  const mid = {
    x: (start.x + end.x) / 2 + (rand() - .5) * drift,
    y: (start.y + end.y) / 2 + (rand() - .5) * drift
  };
  bolt.style.left = `${start.x}px`;
  bolt.style.top = `${start.y}px`;
  host.append(bolt);
  const animation = bolt.animate([
    { left: `${start.x}px`, top: `${start.y}px`, transform: 'translate(-50%,-50%) scale(.55)', filter: 'brightness(1)' },
    { left: `${mid.x}px`, top: `${mid.y}px`, transform: 'translate(-50%,-50%) scale(1.15)', filter: 'brightness(1.7)', offset: .5 },
    { left: `${end.x}px`, top: `${end.y}px`, transform: 'translate(-50%,-50%) scale(.9)', filter: 'brightness(1.2)' }
  ], { duration: 620, easing: 'ease-in' });
  await animation.finished.catch(() => undefined);
  bolt.remove();
}

async function scatter(event: CombatVisualEvent, start: Point, end: Point, host: HTMLElement) {
  const rand = seeded(hashSeed(event.id));
  const pellets = Array.from({ length: 8 }, (_, index) => {
    const pellet = document.createElement('i');
    pellet.className = 'cf-shot cf-shot-pellet';
    pellet.style.left = `${start.x}px`;
    pellet.style.top = `${start.y}px`;
    host.append(pellet);
    const spread = 6 + event.aimSpread * 46;
    const tx = end.x + (rand() - .5) * spread * (index === 0 && event.hit ? .15 : 1);
    const ty = end.y + (rand() - .5) * spread * (index === 0 && event.hit ? .15 : 1);
    return pellet.animate([
      { left: `${start.x}px`, top: `${start.y}px`, opacity: 1 },
      { left: `${tx}px`, top: `${ty}px`, opacity: .9 }
    ], { duration: 300 + rand() * 160, delay: index * 15, easing: 'cubic-bezier(.1,.75,.2,1)' }).finished
      .catch(() => undefined)
      .finally(() => pellet.remove());
  });
  await Promise.all(pellets);
}

function unstableAim(event: CombatVisualEvent, start: Point, end: Point, host: HTMLElement) {
  if (event.aimSpread < .16) return;
  const rand = seeded(hashSeed(`${event.id}:chaos`));
  const count = Math.min(5, 1 + Math.ceil(event.aimSpread * 5));
  for (let i = 0; i < count; i++) {
    const ghost = document.createElement('i');
    ghost.className = 'cf-aim-ghost';
    const offX = (rand() - .5) * (40 + event.aimSpread * 130);
    const offY = (rand() - .5) * (40 + event.aimSpread * 130);
    const ghostEnd = { x: end.x + offX, y: end.y + offY };
    const geo = lineGeometry(start, ghostEnd);
    ghost.style.left = `${start.x}px`;
    ghost.style.top = `${start.y}px`;
    ghost.style.width = `${geo.distance}px`;
    ghost.style.transform = `rotate(${geo.angle}deg) scaleX(0)`;
    host.append(ghost);
    ghost.animate([
      { transform: `rotate(${geo.angle}deg) scaleX(0)`, opacity: 0 },
      { transform: `rotate(${geo.angle}deg) scaleX(1)`, opacity: .45 },
      { transform: `rotate(${geo.angle}deg) scaleX(1)`, opacity: 0 }
    ], { duration: 420 + rand() * 220, delay: i * 35 }).finished.finally(() => ghost.remove()).catch(() => undefined);
  }

  const warning = document.createElement('div');
  warning.className = 'cf-aim-warning';
  warning.textContent = document.documentElement.lang === 'en' ? 'TARGETING UNSTABLE' : 'НАВЕДЕНИЕ НЕСТАБИЛЬНО';
  host.append(warning);
  warning.animate([{ opacity: 0, transform: 'translate(-50%,5px)' }, { opacity: 1 }, { opacity: 0 }], { duration: 850 }).finished.finally(() => warning.remove()).catch(() => undefined);
}

async function impact(event: CombatVisualEvent, end: Point, host: HTMLElement) {
  const fx = document.createElement('i');
  fx.className = event.hit ? `cf-impact weapon-${event.weaponId ?? 'generic'}` : 'cf-miss';
  fx.style.left = `${end.x}px`;
  fx.style.top = `${end.y}px`;
  if (!event.hit) fx.textContent = 'MISS';
  host.append(fx);
  const animation = event.hit
    ? fx.animate([
        { transform: 'translate(-50%,-50%) scale(.2)', opacity: .2 },
        { transform: 'translate(-50%,-50%) scale(1.35)', opacity: 1, offset: .35 },
        { transform: 'translate(-50%,-50%) scale(2.2)', opacity: 0 }
      ], { duration: 420, easing: 'ease-out' })
    : fx.animate([
        { transform: 'translate(-50%,-50%) scale(.8)', opacity: 0 },
        { transform: 'translate(-50%,-50%) scale(1)', opacity: 1, offset: .25 },
        { transform: 'translate(-50%,-80%) scale(1)', opacity: 0 }
      ], { duration: 650 });
  await animation.finished.catch(() => undefined);
  fx.remove();
}

async function repair(event: CombatVisualEvent, ownSide: string, root: HTMLElement, host: HTMLElement) {
  const targetRoot = root.querySelector<HTMLElement>(shipRoot(event.side, ownSide));
  const target = event.targetModuleId ? targetRoot?.querySelector<HTMLElement>(`[data-module="${CSS.escape(event.targetModuleId)}"]`) : null;
  if (!target) return;
  const point = center(target, root);
  const ring = document.createElement('i');
  ring.className = 'cf-repair-fx';
  ring.style.left = `${point.x}px`;
  ring.style.top = `${point.y}px`;
  host.append(ring);
  await ring.animate([
    { transform: 'translate(-50%,-50%) scale(.3)', opacity: 0 },
    { transform: 'translate(-50%,-50%) scale(1)', opacity: 1, offset: .4 },
    { transform: 'translate(-50%,-50%) scale(1.45)', opacity: 0 }
  ], { duration: 560 }).finished.catch(() => undefined);
  ring.remove();
}

async function playOne(event: CombatVisualEvent, ownSide: string) {
  const root = document.querySelector<HTMLElement>('.cf-battlefield');
  if (!root) return;
  const host = layer(root);
  if (event.kind === 'repair') {
    await repair(event, ownSide, root, host);
    return;
  }
  if (event.kind !== 'fire') return;
  const points = endpoints(event, ownSide, root);
  if (!points) return;

  unstableAim(event, points.start, points.end, host);
  switch (event.weaponId) {
    case 'missile': await missile(event, points.start, points.end, host); break;
    case 'scatter': await scatter(event, points.start, points.end, host); break;
    case 'plasma': await plasma(event, points.start, points.end, host); break;
    default: await laser(event, points.start, points.end, host); break;
  }
  await impact(event, points.end, host);
}

export async function playCombatEffects(events: CombatVisualEvent[], ownSide: string, played: Set<string>) {
  const fresh = events.filter(event => !played.has(event.id)).sort((a, b) => a.turn - b.turn || a.at.localeCompare(b.at));
  for (const event of fresh) {
    played.add(event.id);
    await playOne(event, ownSide);
    await wait(80);
  }
}
