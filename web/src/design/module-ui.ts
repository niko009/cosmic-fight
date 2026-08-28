import './tokens.css';
import './modules.css';
import { MODULE_KIND_META, MODULE_LINKS, moduleMeta, type ModuleKind } from './module-catalog';

const MODULE_SELECTOR = 'button[data-drag], button[data-module]';
let scheduled = false;

function language(): 'ru' | 'en' {
  return document.documentElement.lang === 'en' ? 'en' : 'ru';
}

function textFor(meta: ReturnType<typeof moduleMeta>) {
  const en = language() === 'en';
  return {
    name: en ? meta.en : meta.ru,
    role: en ? meta.roleEn : meta.roleRu,
    description: en ? meta.descriptionEn : meta.descriptionRu
  };
}

function moduleId(element: HTMLElement): string | null {
  return element.dataset.drag ?? element.dataset.module ?? null;
}

function buildFace(element: HTMLButtonElement, id: string) {
  const isBattle = element.hasAttribute('data-module');
  const signature = `${language()}:${id}:${isBattle ? 'battle' : 'hangar'}`;
  if (element.dataset.moduleUiSignature === signature) return;
  element.dataset.moduleUiSignature = signature;

  const meta = moduleMeta(id);
  const copy = textFor(meta);
  element.classList.add('cf-module-ui');
  element.dataset.moduleKind = meta.kind;
  element.dataset.moduleVisualName = copy.name;
  element.setAttribute('aria-label', `${copy.name}. ${copy.role}. ${copy.description}`);
  element.setAttribute('title', `${copy.name} — ${copy.role}. ${copy.description}`);

  const faceClass = isBattle ? 'cf-hit-face' : 'cf-module-face';
  let face = element.querySelector<HTMLElement>(`:scope > .${faceClass}`);
  if (!face) {
    face = document.createElement('span');
    face.className = faceClass;
    face.innerHTML = `<span class="glyph" aria-hidden="true"></span><span class="copy"></span>`;
    element.prepend(face);
  }

  const glyph = face.querySelector<HTMLElement>('.glyph');
  if (glyph) glyph.textContent = meta.icon;
  const faceCopy = face.querySelector<HTMLElement>('.copy');
  if (faceCopy) {
    if (isBattle) {
      faceCopy.innerHTML = `<strong></strong>`;
      const strong = faceCopy.querySelector('strong');
      if (strong) strong.textContent = copy.name;
    } else {
      faceCopy.innerHTML = `<strong></strong><small></small>`;
      const strong = faceCopy.querySelector('strong');
      const small = faceCopy.querySelector('small');
      if (strong) strong.textContent = copy.name;
      if (small) small.textContent = copy.role;
    }
  }

  if (!isBattle) {
    let tooltip = element.querySelector<HTMLElement>(':scope > .cf-module-tooltip');
    if (!tooltip) {
      tooltip = document.createElement('span');
      tooltip.className = 'cf-module-tooltip';
      tooltip.innerHTML = '<b></b><span></span>';
      element.append(tooltip);
    }
    const title = tooltip.querySelector('b');
    const body = tooltip.querySelector('span');
    if (title) title.textContent = copy.name;
    if (body) body.textContent = `${copy.role}. ${copy.description}`;
  }
}

function enhanceModules(root: ParentNode = document) {
  root.querySelectorAll<HTMLButtonElement>(MODULE_SELECTOR).forEach(element => {
    const id = moduleId(element);
    if (id) buildFace(element, id);
  });
}

function keyItem(kind: ModuleKind) {
  const meta = MODULE_KIND_META[kind];
  const en = language() === 'en';
  const item = document.createElement('span');
  item.style.setProperty('--key-color', `var(--mod-${kind})`);
  const icon = document.createElement('i');
  icon.textContent = meta.icon;
  const label = document.createTextNode(en ? meta.en : meta.ru);
  item.append(icon, label);
  return item;
}

function enhanceLegend() {
  document.querySelectorAll<HTMLElement>('.cf-builder').forEach(builder => {
    let key = builder.querySelector<HTMLElement>(':scope > .cf-module-key');
    if (!key) {
      key = document.createElement('div');
      key.className = 'cf-module-key';
      builder.append(key);
    }
    const signature = `${language()}:core-engine-weapon-armor-sensor-hull`;
    if (key.dataset.signature !== signature) {
      key.dataset.signature = signature;
      key.replaceChildren(...(['core', 'engine', 'weapon', 'armor', 'sensor', 'hull'] as ModuleKind[]).map(keyItem));
    }
  });
}

function positionOf(element: HTMLElement): [number, number] | null {
  const x = Number.parseFloat(element.style.left);
  const y = Number.parseFloat(element.style.top);
  return Number.isFinite(x) && Number.isFinite(y) ? [x, y] : null;
}

function syncLinks(field: HTMLElement, selector: string, idAttribute: 'drag' | 'module') {
  const nodes = new Map<string, HTMLElement>();
  field.querySelectorAll<HTMLElement>(selector).forEach(element => {
    const id = element.dataset[idAttribute];
    if (id) nodes.set(id, element);
  });
  if (nodes.size === 0) return;

  const edges = MODULE_LINKS.flatMap(([from, to]) => {
    const a = nodes.get(from);
    const b = nodes.get(to);
    const pa = a ? positionOf(a) : null;
    const pb = b ? positionOf(b) : null;
    return pa && pb ? [{ from, to, pa, pb }] : [];
  });
  const signature = edges.map(e => `${e.from}:${e.pa.join(',')}>${e.to}:${e.pb.join(',')}`).join('|');

  let svg = field.querySelector<SVGSVGElement>(':scope > svg.cf-module-links');
  if (!svg) {
    svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.classList.add('cf-module-links');
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.setAttribute('preserveAspectRatio', 'none');
    field.prepend(svg);
  }
  if (svg.dataset.signature === signature) return;
  svg.dataset.signature = signature;
  svg.replaceChildren();

  edges.forEach(edge => {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', String(edge.pa[0]));
    line.setAttribute('y1', String(edge.pa[1]));
    line.setAttribute('x2', String(edge.pb[0]));
    line.setAttribute('y2', String(edge.pb[1]));
    line.dataset.hot = edge.from === 'core' ? 'true' : 'false';
    svg?.append(line);
  });
}

function enhanceConnections() {
  document.querySelectorAll<HTMLElement>('.cf-builder').forEach(field => syncLinks(field, 'button[data-drag]', 'drag'));
  document.querySelectorAll<HTMLElement>('.cf-combatfield').forEach(field => syncLinks(field, 'button[data-module]', 'module'));
}

function enhance() {
  scheduled = false;
  enhanceModules();
  enhanceLegend();
  enhanceConnections();
}

function schedule() {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(enhance);
}

const app = document.querySelector('#app');
if (app) {
  new MutationObserver(schedule).observe(app, { childList: true, subtree: true });
}
window.addEventListener('resize', schedule);
document.addEventListener('pointermove', event => {
  if ((event.target as Element | null)?.closest?.('button[data-drag]')) schedule();
}, { passive: true });
document.addEventListener('pointerup', schedule, { passive: true });

schedule();
