import './styles.css';

type UpgradeMap = Record<string, number>;
type PlayerProfile = {
  id: string; provider: string; displayName: string; email?: string | null; avatarUrl?: string | null;
  credits: number; xp: number; rating: number; victories: number; defeats: number; upgrades: UpgradeMap; isGuest?: boolean;
};
type ShipModule = {
  id: string; name: string; type: string; hp: number; maxHp: number; x: number; y: number;
  fireTurns: number; shortTurns: number; powered: boolean; condition: string;
};
type ShipState = { id: string; name: string; accent: string; modules: ShipModule[]; repairKits: number; integrity: number };
type Weapon = { id: string; name: string; damage: number; accuracy: number; splash: number; description: string };
type LogEntry = { turn: number; kind: string; text: string; at: string };
type Battle = {
  id: string; turn: number; activeSide: string; status: string; winner?: string | null;
  playerShip: ShipState; enemyShip: ShipState; weapons: Weapon[]; log: LogEntry[];
};
type AuthConfig = { googleConfigured: boolean };
type VersionInfo = { version: string; commit: string; builtAt?: string };
type Mode = { kind: 'fire'; weaponId: string } | { kind: 'repair' };
type Locale = 'ru' | 'en';

const app = document.querySelector<HTMLDivElement>('#app')!;
const localeKey = 'cosmic-fight.locale';
let locale: Locale = localStorage.getItem(localeKey) === 'en' ? 'en' : 'ru';
let profile: PlayerProfile | null = null;
let battle: Battle | null = null;
let authConfig: AuthConfig = { googleConfigured: false };
let version: VersionInfo = { version: '0.1.0', commit: 'unknown' };
let online = 0;
let mode: Mode = { kind: 'fire', weaponId: 'laser' };
let busy = false;
let toast = '';

const copy = {
  ru: {
    tagline: 'Цель · Разрушение · Адаптация · Победа', online: 'онлайн', slice: 'бой против ИИ',
    pilot: 'ПИЛОТ', googleCloud: 'Google-аккаунт · облачное сохранение', guestSave: 'Гостевой пилот · прогресс сохранён на сервере',
    rating: 'рейтинг', credits: 'кредиты', wins: 'победы', losses: 'поражения',
    googleSave: 'Сохранить прогресс через Google', googleWait: 'Google-вход ожидает настройки OAuth', signOut: 'Выйти',
    hangar: 'АНГАР', upgrades: 'Постоянные улучшения', tactical: 'ТАКТИЧЕСКАЯ ДУЭЛЬ', combat: 'Модульный бой',
    turn: 'ХОД', yourMove: 'ВАШ ХОД', complete: 'ЗАВЕРШЕНО', enemyMove: 'ПРОТИВНИК',
    command: 'КОМАНДА', repairTarget: 'Выберите повреждённый модуль своего корабля',
    fireTarget: 'Выберите оружие, затем модуль противника', repair: 'Ремонт', repairHint: 'Расходует ремкомплект и ход',
    newDuel: 'Новый бой с ИИ', tip: 'Совет: сначала разрушайте броню, затем защищённые системы.',
    feed: 'ЖУРНАЛ БОЯ', battleLog: 'События', noEvents: 'Событий пока нет.',
    ok: 'Исправен', damaged: 'Повреждён', critical: 'Критический', destroyed: 'Уничтожен',
    battleComplete: 'БОЙ ЗАВЕРШЁН', victory: 'ПОБЕДА', defeat: 'ПОРАЖЕНИЕ', rematch: 'Реванш',
    victoryReward: '+120 кредитов · +80 XP · +18 рейтинга', defeatReward: '+40 кредитов · +25 XP · рейтинг изменён',
    integrity: 'целостность', systemsOnline: 'систем в строю', repairKits: 'ремкомплектов',
    version: 'Версия', server: 'Web + авторитетный ASP.NET сервер · PostgreSQL',
    resolving: 'Расчёт выстрела…', repairing: 'Ремонт модуля…', repairOwn: 'Ремонт применяется только к своим модулям.',
    fireEnemy: 'Оружием можно атаковать только модули противника.', startError: 'Не удалось начать бой',
    actionError: 'Действие не выполнено', upgradeError: 'Не удалось установить улучшение', upgradeInstalled: 'Улучшение установлено.',
    starting: 'Инициализация боевой телеметрии…', authOk: 'Google-аккаунт подключён. Прогресс привязан к аккаунту.',
    authWait: 'Google OAuth реализован, но серверные ключи ещё не настроены.', authFail: 'Вход через Google не удался. Гостевой прогресс сохранён.',
    startupFail: 'Ошибка запуска', language: 'Язык', level: 'Ур.', max: 'МАКС', damage: 'урона', base: 'база',
    fire: 'ОГОНЬ', short: 'КЗ', offline: 'НЕТ ПИТАНИЯ', guestPilot: 'Гостевой пилот', rogueAi: 'ИИ-рейдер'
  },
  en: {
    tagline: 'Target · Break · Adapt · Win', online: 'online', slice: 'AI vertical slice',
    pilot: 'PILOT', googleCloud: 'Google account · cloud save', guestSave: 'Guest pilot · server-saved progress',
    rating: 'rating', credits: 'credits', wins: 'wins', losses: 'losses',
    googleSave: 'Save progress with Google', googleWait: 'Google save awaiting OAuth config', signOut: 'Sign out',
    hangar: 'HANGAR', upgrades: 'Persistent upgrades', tactical: 'TACTICAL DUEL', combat: 'Modular Combat',
    turn: 'TURN', yourMove: 'YOUR MOVE', complete: 'COMPLETE', enemyMove: 'ENEMY',
    command: 'COMMAND', repairTarget: 'Select a damaged friendly module',
    fireTarget: 'Choose a weapon, then target an enemy module', repair: 'Repair', repairHint: 'Consumes kit + your turn',
    newDuel: 'New AI duel', tip: 'Tip: break armor before attacking protected systems.',
    feed: 'COMBAT FEED', battleLog: 'Battle log', noEvents: 'No combat events yet.',
    ok: 'OK', damaged: 'Damaged', critical: 'Critical', destroyed: 'Destroyed',
    battleComplete: 'BATTLE COMPLETE', victory: 'VICTORY', defeat: 'DEFEAT', rematch: 'Rematch',
    victoryReward: '+120 credits · +80 XP · +18 rating', defeatReward: '+40 credits · +25 XP · rating adjusted',
    integrity: 'integrity', systemsOnline: 'systems online', repairKits: 'repair kits',
    version: 'Version', server: 'Web + ASP.NET authoritative server · PostgreSQL',
    resolving: 'Resolving shot…', repairing: 'Repairing module…', repairOwn: 'Repair targets one of your own modules.',
    fireEnemy: 'Weapons target enemy modules.', startError: 'Unable to start battle',
    actionError: 'Action failed', upgradeError: 'Upgrade failed', upgradeInstalled: 'Upgrade installed.',
    starting: 'Initializing combat telemetry…', authOk: 'Google account connected. Progress is now tied to your account.',
    authWait: 'Google OAuth is implemented but server credentials are not configured yet.', authFail: 'Google sign-in failed. Guest progress is safe.',
    startupFail: 'Startup failed', language: 'Language', level: 'Lv', max: 'MAX', damage: 'dmg', base: 'base',
    fire: 'FIRE', short: 'SHORT', offline: 'OFFLINE', guestPilot: 'Guest Pilot', rogueAi: 'Rogue AI'
  }
} as const;

function t<K extends keyof typeof copy.ru>(key: K): string { return copy[locale][key]; }

const upgradeDefinitions = [
  ['core', 'Ядро', 'Core', 'Прочность ядра и живучесть', 'Core HP and survivability'],
  ['engines', 'Двигатели', 'Engines', 'Прочность двигателей и стабильность наведения', 'Engine HP and targeting stability'],
  ['weapons', 'Оружие', 'Weapons', 'Прочность оружия и наносимый урон', 'Weapon HP and damage output'],
  ['armor', 'Броня', 'Armor', 'Прочность брони и поглощение урона', 'Armor HP and absorption'],
  ['sensors', 'Сенсоры', 'Sensors', 'Прочность сенсоров и точность', 'Sensor HP and precision'],
  ['hull', 'Корпус', 'Hull', 'Прочность конструкции', 'Structural HP'],
  ['fire-protection', 'Пожарозащита', 'Fire Protection', 'Снижает шанс возгорания', 'Reduces ignition chance'],
  ['electrical-shielding', 'Электрозащита', 'Electrical Shielding', 'Снижает шанс короткого замыкания', 'Reduces short-circuit chance']
] as const;

const moduleNamesRu: Record<string, string> = {
  'armor-top': 'Верхняя броня', sensor: 'Сенсоры', 'weapon-left': 'Левое орудие', core: 'Энергетическое ядро',
  'weapon-right': 'Правое орудие', 'armor-left': 'Левая броня', hull: 'Корпус', 'armor-right': 'Правая броня',
  'engine-left': 'Левый двигатель', 'engine-right': 'Правый двигатель'
};
const weaponNamesRu: Record<string, string> = { laser: 'Лазер', missile: 'Ракета', scatter: 'Дробовик', plasma: 'Плазма' };

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) } });
  if (!response.ok) {
    let message = `${response.status} ${response.statusText}`;
    try { const body = await response.json() as { error?: string; title?: string }; message = body.error || body.title || message; } catch { /* noop */ }
    throw new Error(message);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

async function ensureIdentity() {
  try { profile = await api<PlayerProfile>('/api/auth/me'); }
  catch { profile = await api<PlayerProfile>('/api/auth/guest', { method: 'POST', body: '{}' }); }
}
async function startBattle() {
  busy = true; toast = ''; render();
  try { battle = await api<Battle>('/api/battles/ai', { method: 'POST', body: '{}' }); mode = { kind: 'fire', weaponId: 'laser' }; }
  catch (error) { toast = error instanceof Error ? error.message : t('startError'); }
  finally { busy = false; render(); }
}
async function act(targetModuleId: string, friendly: boolean) {
  if (!battle || battle.status !== 'active' || busy || battle.activeSide !== 'player') return;
  if (mode.kind === 'repair' && !friendly) { toast = t('repairOwn'); render(); return; }
  if (mode.kind === 'fire' && friendly) { toast = t('fireEnemy'); render(); return; }
  busy = true; toast = mode.kind === 'repair' ? t('repairing') : t('resolving'); render();
  try {
    battle = await api<Battle>(`/api/battles/${battle.id}/actions`, {
      method: 'POST',
      body: JSON.stringify({ turn: battle.turn, action: mode.kind, weaponId: mode.kind === 'fire' ? mode.weaponId : null, targetModuleId, clientActionId: crypto.randomUUID() })
    });
    toast = '';
    if (battle.status === 'finished') profile = await api<PlayerProfile>('/api/profile');
  } catch (error) { toast = error instanceof Error ? error.message : t('actionError'); }
  finally { busy = false; render(); }
}
async function buyUpgrade(key: string) {
  if (!profile || busy) return;
  busy = true; toast = locale === 'ru' ? 'Установка улучшения…' : `Upgrading ${key}…`; render();
  try {
    profile = await api<PlayerProfile>('/api/profile/upgrades', { method: 'POST', body: JSON.stringify({ upgrade: key }) });
    toast = t('upgradeInstalled');
  } catch (error) { toast = error instanceof Error ? error.message : t('upgradeError'); }
  finally { busy = false; render(); }
}
async function logout() {
  busy = true; render();
  await api<void>('/api/auth/logout', { method: 'POST', body: '{}' }).catch(() => undefined);
  profile = null; battle = null; await ensureIdentity(); await startBattle(); busy = false; render();
}
function setLocale(next: Locale) {
  locale = next; localStorage.setItem(localeKey, locale); document.documentElement.lang = locale; toast = ''; render();
}

function conditionClass(module: ShipModule) {
  const condition = String(module.condition).toLowerCase();
  if (condition.includes('destroy')) return 'destroyed';
  if (condition.includes('critical')) return 'critical';
  if (condition.includes('damage')) return 'damaged';
  return 'ok';
}
function moduleBadge(module: ShipModule) {
  const status = [module.fireTurns > 0 ? t('fire') : '', module.shortTurns > 0 ? t('short') : '', !module.powered && module.hp > 0 ? t('offline') : ''].filter(Boolean).join(' · ');
  return status ? `<span class="module-status">${status}</span>` : '';
}
function displayShipName(ship: ShipState, friendly: boolean) {
  if (friendly && profile?.provider !== 'google' && /^Guest Pilot/i.test(ship.name)) return t('guestPilot');
  if (!friendly && ship.name === 'Rogue AI') return t('rogueAi');
  return ship.name;
}
function shipMarkup(ship: ShipState, friendly: boolean) {
  return `
    <section class="ship-card ${friendly ? 'friendly' : 'enemy'}">
      <div class="ship-meta"><div><span class="eyebrow">${friendly ? (locale === 'ru' ? 'ВАШ КОРАБЛЬ' : 'YOUR SHIP') : (locale === 'ru' ? 'КОРАБЛЬ ПРОТИВНИКА' : 'ENEMY SHIP')}</span><h2>${escapeHtml(displayShipName(ship, friendly))}</h2></div>
      <div class="integrity"><b>${ship.integrity}%</b><span>${t('integrity')}</span></div></div>
      <div class="integrity-track"><span style="width:${Math.max(0, ship.integrity)}%"></span></div>
      <div class="ship-field" aria-label="${friendly ? 'Your modular ship' : 'Enemy modular ship'}">
        <div class="ship-silhouette"></div><div class="engine-glow left"></div><div class="engine-glow right"></div>
        ${ship.modules.map(module => {
          const pct = Math.max(0, Math.round(module.hp / module.maxHp * 100));
          const name = locale === 'ru' ? (moduleNamesRu[module.id] || module.name) : module.name;
          return `<button class="module ${conditionClass(module)}" data-module="${module.id}" data-friendly="${friendly}" style="--x:${module.x}%;--y:${module.y}%" ${module.hp <= 0 ? 'disabled' : ''} title="${escapeAttribute(name)}: ${module.hp}/${module.maxHp}">
            <span class="module-name">${shortName(module)}</span><span class="module-hp"><i style="width:${pct}%"></i></span>${moduleBadge(module)}
          </button>`;
        }).join('')}
      </div>
      <div class="ship-footer"><span>${ship.modules.filter(m => m.hp > 0).length}/${ship.modules.length} ${t('systemsOnline')}</span><span>${ship.repairKits} ${t('repairKits')}</span></div>
    </section>`;
}
function shortName(module: ShipModule) {
  const names: Record<string, string> = { 'armor-top': 'ARM', sensor: 'SNS', 'weapon-left': 'WPN', core: 'CORE', 'weapon-right': 'WPN', 'armor-left': 'ARM', hull: 'HULL', 'armor-right': 'ARM', 'engine-left': 'ENG', 'engine-right': 'ENG' };
  return names[module.id] || module.type.slice(0, 4).toUpperCase();
}
function weaponMarkup(weapon: Weapon) {
  const selected = mode.kind === 'fire' && mode.weaponId === weapon.id;
  const name = locale === 'ru' ? (weaponNamesRu[weapon.id] || weapon.name) : weapon.name;
  return `<button class="action-card ${selected ? 'selected' : ''}" data-weapon="${weapon.id}" ${busy ? 'disabled' : ''}>
    <span class="weapon-icon ${weapon.id}"></span><span><b>${escapeHtml(name)}</b><small>${weapon.damage} ${t('damage')} · ${Math.round(weapon.accuracy * 100)}% ${t('base')}</small></span></button>`;
}
function upgradeMarkup(key: string, ruLabel: string, enLabel: string, ruDescription: string, enDescription: string) {
  const level = profile?.upgrades?.[key] ?? 0, cost = 100 * (level + 1), maxed = level >= 5;
  return `<button class="upgrade-row" data-upgrade="${key}" ${busy || maxed ? 'disabled' : ''}><span><b>${locale === 'ru' ? ruLabel : enLabel}</b><small>${locale === 'ru' ? ruDescription : enDescription}</small></span>
    <span class="upgrade-buy"><em>${t('level')} ${level}</em><strong>${maxed ? t('max') : `${cost} C`}</strong></span></button>`;
}
function profileMarkup() {
  if (!profile) return '';
  const google = profile.provider === 'google';
  const shownName = !google && /^Guest Pilot/i.test(profile.displayName) ? t('guestPilot') : profile.displayName;
  return `<aside class="profile-panel panel"><div class="profile-head">
    ${profile.avatarUrl ? `<img src="${escapeAttribute(profile.avatarUrl)}" alt="" referrerpolicy="no-referrer">` : `<span class="pilot-avatar">${escapeHtml(shownName.slice(0, 1).toUpperCase())}</span>`}
    <div><span class="eyebrow">${t('pilot')}</span><h3>${escapeHtml(shownName)}</h3><small>${google ? t('googleCloud') : t('guestSave')}</small></div></div>
    <div class="stats-grid"><div><b>${profile.rating}</b><span>${t('rating')}</span></div><div><b>${profile.credits}</b><span>${t('credits')}</span></div>
    <div><b>${profile.victories}</b><span>${t('wins')}</span></div><div><b>${profile.defeats}</b><span>${t('losses')}</span></div></div>
    <div class="account-actions">${!google && authConfig.googleConfigured ? `<a class="google-button" href="/auth/google">${t('googleSave')}</a>` : ''}
    ${!google && !authConfig.googleConfigured ? `<button class="google-button muted" disabled>${t('googleWait')}</button>` : ''}
    ${google ? `<button id="logout" class="text-button">${t('signOut')}</button>` : ''}</div></aside>`;
}

function translateModuleText(value: string) {
  if (locale !== 'ru') return value;
  let result = value.replaceAll('Rogue AI', 'ИИ-рейдер').replaceAll('Guest Pilot', 'Гостевой пилот');
  const pairs: Array<[string, string]> = [
    ['Top Armor', 'Верхняя броня'], ['Sensors', 'Сенсоры'], ['Port Weapon', 'Левое орудие'], ['Power Core', 'Энергетическое ядро'],
    ['Starboard Weapon', 'Правое орудие'], ['Port Armor', 'Левая броня'], ['Hull', 'Корпус'], ['Starboard Armor', 'Правая броня'],
    ['Port Engine', 'Левый двигатель'], ['Starboard Engine', 'Правый двигатель'], ['Laser', 'Лазер'], ['Missile', 'Ракета'], ['Scatter', 'Дробовик'], ['Plasma', 'Плазма']
  ];
  for (const [from, to] of pairs) result = result.replaceAll(from, to);
  return result;
}
function translateLog(value: string) {
  if (locale !== 'ru') return value;
  if (value === 'Combat link established. Choose a weapon and target a module.') return 'Боевая связь установлена. Выберите оружие и модуль противника.';
  let text = translateModuleText(value);
  text = text
    .replace(' missed ', ' промахивается по ')
    .replace('Splash hit ', 'Осколочный урон по ')
    .replace(' caught fire.', ' загорелся.')
    .replace(' suffered an electrical short.', ' получил короткое замыкание.')
    .replace(' destroyed.', ' уничтожен.')
    .replace(' broke while protecting ', ' разрушена, защищая ')
    .replace('Cascade damage: ', 'Каскадный урон: ')
    .replace('Fire damaged ', 'Огонь повредил ')
    .replace(' repaired ', ' отремонтировал ')
    .replace(' HP using ', ' HP, использовано ')
    .replace(' kit.', ' ремкомплект.')
    .replace(' kits.', ' ремкомплекта.')
    .replace(' hit ', ' попадает в ')
    .replace(' for ', ' на ')
    .replace(' absorbed by armor', ' поглощено бронёй');
  return text;
}

function render() {
  document.documentElement.lang = locale;
  const weapons = battle?.weapons ?? [];
  const result = battle?.status === 'finished'
    ? `<div class="result-overlay"><div class="result-card"><span class="eyebrow">${t('battleComplete')}</span><h2>${battle.winner === 'player' ? t('victory') : t('defeat')}</h2><p>${battle.winner === 'player' ? t('victoryReward') : t('defeatReward')}</p><button id="rematch" class="primary-button">${t('rematch')}</button></div></div>`
    : '';

  app.innerHTML = `
    <div class="space-bg"><div class="nebula one"></div><div class="nebula two"></div><div class="stars"></div></div>
    <header class="topbar">
      <div class="brand"><span class="brand-mark"></span><div><b>COSMIC FIGHT</b><small>${t('tagline')}</small></div></div>
      <div class="top-status"><span class="online-dot"></span><b>${online}</b><span>${t('online')}</span><span class="divider"></span><span>${t('slice')}</span>
        <span class="divider"></span><div aria-label="${t('language')}" style="display:flex;gap:3px">
          <button id="lang-ru" style="border:0;background:${locale === 'ru' ? 'rgba(82,220,255,.18)' : 'transparent'};color:${locale === 'ru' ? '#dff8ff' : '#7692a8'};border-radius:6px;padding:5px 7px;cursor:pointer">RU</button>
          <button id="lang-en" style="border:0;background:${locale === 'en' ? 'rgba(82,220,255,.18)' : 'transparent'};color:${locale === 'en' ? '#dff8ff' : '#7692a8'};border-radius:6px;padding:5px 7px;cursor:pointer">EN</button>
        </div>
      </div>
    </header>
    <main class="layout">
      <div class="left-rail">${profileMarkup()}
        <section class="panel upgrade-panel"><div class="section-title"><div><span class="eyebrow">${t('hangar')}</span><h3>${t('upgrades')}</h3></div><span>${profile?.credits ?? 0} C</span></div>
        <div class="upgrade-list">${upgradeDefinitions.map(([key, ruLabel, enLabel, ruDescription, enDescription]) => upgradeMarkup(key, ruLabel, enLabel, ruDescription, enDescription)).join('')}</div></section>
      </div>
      <section class="battle-shell panel">
        <div class="battle-header"><div><span class="eyebrow">${t('tactical')}</span><h1>${t('combat')}</h1></div>
          <div class="turn-chip"><span>${t('turn')}</span><b>${battle?.turn ?? '—'}</b><small>${battle?.activeSide === 'player' ? t('yourMove') : battle?.status === 'finished' ? t('complete') : t('enemyMove')}</small></div></div>
        ${battle ? `<div class="battlefield">${shipMarkup(battle.enemyShip, false)}<div class="versus-line"><span></span><b>VS</b><span></span></div>${shipMarkup(battle.playerShip, true)}</div>` : `<div class="loading-battle">${t('starting')}</div>`}
        <div class="action-zone"><div class="mode-copy"><span class="eyebrow">${t('command')}</span><b>${mode.kind === 'repair' ? t('repairTarget') : t('fireTarget')}</b></div>
          <div class="actions">${weapons.map(weaponMarkup).join('')}<button class="action-card repair ${mode.kind === 'repair' ? 'selected' : ''}" id="repair-mode" ${busy ? 'disabled' : ''}><span class="weapon-icon repair-icon"></span><span><b>${t('repair')}</b><small>${t('repairHint')}</small></span></button></div>
          <div class="battle-controls"><button id="new-battle" class="secondary-button" ${busy ? 'disabled' : ''}>${t('newDuel')}</button><span class="hint">${t('tip')}</span></div>
        </div>${result}
      </section>
      <aside class="right-rail panel"><div class="section-title"><div><span class="eyebrow">${t('feed')}</span><h3>${t('battleLog')}</h3></div></div>
        <div class="battle-log">${battle?.log?.slice().reverse().map(entry => `<div class="log-entry ${entry.kind}"><span>T${entry.turn}</span><p>${escapeHtml(translateLog(entry.text))}</p></div>`).join('') || `<p class="muted-copy">${t('noEvents')}</p>`}</div>
        <div class="legend"><span><i class="legend-dot ok"></i>${t('ok')}</span><span><i class="legend-dot damaged"></i>${t('damaged')}</span><span><i class="legend-dot critical"></i>${t('critical')}</span><span><i class="legend-dot destroyed"></i>${t('destroyed')}</span></div>
      </aside>
    </main>
    ${toast ? `<div class="toast ${busy ? 'working' : ''}">${escapeHtml(toast)}</div>` : ''}
    <footer><span>${t('version')} Cosmic Fight v${escapeHtml(version.version)}${version.commit && version.commit !== 'unknown' ? ` · ${escapeHtml(version.commit)}` : ''}</span><span>${t('server')}</span></footer>`;

  document.querySelectorAll<HTMLButtonElement>('[data-weapon]').forEach(button => button.addEventListener('click', () => { mode = { kind: 'fire', weaponId: button.dataset.weapon! }; toast = ''; render(); }));
  document.querySelector<HTMLButtonElement>('#repair-mode')?.addEventListener('click', () => { mode = { kind: 'repair' }; toast = ''; render(); });
  document.querySelectorAll<HTMLButtonElement>('[data-module]').forEach(button => button.addEventListener('click', () => void act(button.dataset.module!, button.dataset.friendly === 'true')));
  document.querySelectorAll<HTMLButtonElement>('[data-upgrade]').forEach(button => button.addEventListener('click', () => void buyUpgrade(button.dataset.upgrade!)));
  document.querySelector<HTMLButtonElement>('#new-battle')?.addEventListener('click', () => void startBattle());
  document.querySelector<HTMLButtonElement>('#rematch')?.addEventListener('click', () => void startBattle());
  document.querySelector<HTMLButtonElement>('#logout')?.addEventListener('click', () => void logout());
  document.querySelector<HTMLButtonElement>('#lang-ru')?.addEventListener('click', () => setLocale('ru'));
  document.querySelector<HTMLButtonElement>('#lang-en')?.addEventListener('click', () => setLocale('en'));
}

const htmlEntities: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' };
function escapeHtml(value: string) { return value.replace(/[&<>'"]/g, c => htmlEntities[c] ?? c); }
function escapeAttribute(value: string) { return escapeHtml(value); }

async function boot() {
  render();
  const params = new URLSearchParams(location.search);
  if (params.has('auth')) history.replaceState({}, '', '/');
  try {
    [authConfig, version] = await Promise.all([
      api<AuthConfig>('/api/auth/config').catch(() => ({ googleConfigured: false })),
      api<VersionInfo>('/version.json?ts=' + Date.now()).catch(() => ({ version: '0.1.0', commit: 'unknown' }))
    ]);
    await ensureIdentity();
    online = (await api<{ online: number }>('/api/arena/status').catch(() => ({ online: 0 }))).online;
    if (params.get('auth') === 'success') toast = t('authOk');
    if (params.get('auth') === 'not-configured') toast = t('authWait');
    if (params.get('auth') === 'failed' || params.get('auth') === 'cancelled') toast = t('authFail');
    await startBattle();
  } catch (error) { toast = error instanceof Error ? error.message : t('startupFail'); render(); }
}
if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => undefined));
void boot();