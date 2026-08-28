import './styles.css';

type UpgradeMap = Record<string, number>;
type PlayerProfile = {
  id: string;
  provider: string;
  displayName: string;
  email?: string | null;
  avatarUrl?: string | null;
  credits: number;
  xp: number;
  rating: number;
  victories: number;
  defeats: number;
  upgrades: UpgradeMap;
  isGuest?: boolean;
};
type ShipModule = {
  id: string;
  name: string;
  type: string;
  hp: number;
  maxHp: number;
  x: number;
  y: number;
  fireTurns: number;
  shortTurns: number;
  powered: boolean;
  condition: string;
};
type ShipState = {
  id: string;
  name: string;
  accent: string;
  modules: ShipModule[];
  repairKits: number;
  integrity: number;
};
type Weapon = { id: string; name: string; damage: number; accuracy: number; splash: number; description: string };
type LogEntry = { turn: number; kind: string; text: string; at: string };
type Battle = {
  id: string;
  turn: number;
  activeSide: string;
  status: string;
  winner?: string | null;
  playerShip: ShipState;
  enemyShip: ShipState;
  weapons: Weapon[];
  log: LogEntry[];
};
type AuthConfig = { googleConfigured: boolean };
type VersionInfo = { version: string; commit: string };

type Mode = { kind: 'fire'; weaponId: string } | { kind: 'repair' };

const app = document.querySelector<HTMLDivElement>('#app')!;
let profile: PlayerProfile | null = null;
let battle: Battle | null = null;
let authConfig: AuthConfig = { googleConfigured: false };
let version: VersionInfo = { version: '0.1.0', commit: 'unknown' };
let online = 0;
let mode: Mode = { kind: 'fire', weaponId: 'laser' };
let busy = false;
let toast = '';

const upgrades = [
  ['core', 'Core', 'Core HP and survivability'],
  ['engines', 'Engines', 'Engine HP and targeting stability'],
  ['weapons', 'Weapons', 'Weapon HP and damage output'],
  ['armor', 'Armor', 'Armor HP and absorption'],
  ['sensors', 'Sensors', 'Sensor HP and precision'],
  ['hull', 'Hull', 'Structural HP'],
  ['fire-protection', 'Fire Protection', 'Reduces ignition chance'],
  ['electrical-shielding', 'Electrical Shielding', 'Reduces short-circuit chance']
] as const;

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) }
  });
  if (!response.ok) {
    let message = `${response.status} ${response.statusText}`;
    try {
      const body = await response.json() as { error?: string; title?: string };
      message = body.error || body.title || message;
    } catch { /* ignore */ }
    throw new Error(message);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

async function ensureIdentity() {
  try {
    profile = await api<PlayerProfile>('/api/auth/me');
  } catch {
    profile = await api<PlayerProfile>('/api/auth/guest', { method: 'POST', body: '{}' });
  }
}

async function startBattle() {
  busy = true;
  toast = '';
  render();
  try {
    battle = await api<Battle>('/api/battles/ai', { method: 'POST', body: '{}' });
    mode = { kind: 'fire', weaponId: 'laser' };
  } catch (error) {
    toast = error instanceof Error ? error.message : 'Unable to start battle';
  } finally {
    busy = false;
    render();
  }
}

async function act(targetModuleId: string, friendly: boolean) {
  if (!battle || battle.status !== 'active' || busy || battle.activeSide !== 'player') return;
  if (mode.kind === 'repair' && !friendly) {
    toast = 'Repair targets one of your own modules.';
    render();
    return;
  }
  if (mode.kind === 'fire' && friendly) {
    toast = 'Weapons target enemy modules.';
    render();
    return;
  }

  busy = true;
  toast = mode.kind === 'repair' ? 'Repairing module…' : 'Resolving shot…';
  render();
  try {
    battle = await api<Battle>(`/api/battles/${battle.id}/actions`, {
      method: 'POST',
      body: JSON.stringify({
        turn: battle.turn,
        action: mode.kind,
        weaponId: mode.kind === 'fire' ? mode.weaponId : null,
        targetModuleId,
        clientActionId: crypto.randomUUID()
      })
    });
    toast = '';
    if (battle.status === 'finished') profile = await api<PlayerProfile>('/api/profile');
  } catch (error) {
    toast = error instanceof Error ? error.message : 'Action failed';
  } finally {
    busy = false;
    render();
  }
}

async function buyUpgrade(key: string) {
  if (!profile || busy) return;
  busy = true;
  toast = `Upgrading ${key}…`;
  render();
  try {
    profile = await api<PlayerProfile>('/api/profile/upgrades', {
      method: 'POST',
      body: JSON.stringify({ upgrade: key })
    });
    toast = 'Upgrade installed.';
  } catch (error) {
    toast = error instanceof Error ? error.message : 'Upgrade failed';
  } finally {
    busy = false;
    render();
  }
}

async function logout() {
  busy = true;
  render();
  await api<void>('/api/auth/logout', { method: 'POST', body: '{}' }).catch(() => undefined);
  profile = null;
  battle = null;
  await ensureIdentity();
  await startBattle();
  busy = false;
  render();
}

function conditionClass(module: ShipModule) {
  const condition = String(module.condition).toLowerCase();
  if (condition.includes('destroy')) return 'destroyed';
  if (condition.includes('critical')) return 'critical';
  if (condition.includes('damage')) return 'damaged';
  return 'ok';
}

function moduleBadge(module: ShipModule) {
  const status = [
    module.fireTurns > 0 ? 'FIRE' : '',
    module.shortTurns > 0 ? 'SHORT' : '',
    !module.powered && module.hp > 0 ? 'OFFLINE' : ''
  ].filter(Boolean).join(' · ');
  return status ? `<span class="module-status">${status}</span>` : '';
}

function shipMarkup(ship: ShipState, friendly: boolean) {
  return `
    <section class="ship-card ${friendly ? 'friendly' : 'enemy'}">
      <div class="ship-meta">
        <div>
          <span class="eyebrow">${friendly ? 'YOUR SHIP' : 'ENEMY SHIP'}</span>
          <h2>${escapeHtml(ship.name)}</h2>
        </div>
        <div class="integrity"><b>${ship.integrity}%</b><span>integrity</span></div>
      </div>
      <div class="integrity-track"><span style="width:${Math.max(0, ship.integrity)}%"></span></div>
      <div class="ship-field" aria-label="${friendly ? 'Your modular ship' : 'Enemy modular ship'}">
        <div class="ship-silhouette"></div>
        <div class="engine-glow left"></div><div class="engine-glow right"></div>
        ${ship.modules.map(module => {
          const pct = Math.max(0, Math.round(module.hp / module.maxHp * 100));
          const disabled = module.hp <= 0 ? 'disabled' : '';
          return `<button class="module ${conditionClass(module)}" data-module="${module.id}" data-friendly="${friendly}" style="--x:${module.x}%;--y:${module.y}%" ${disabled} title="${escapeHtml(module.name)}: ${module.hp}/${module.maxHp}">
            <span class="module-name">${shortName(module)}</span>
            <span class="module-hp"><i style="width:${pct}%"></i></span>
            ${moduleBadge(module)}
          </button>`;
        }).join('')}
      </div>
      <div class="ship-footer"><span>${ship.modules.filter(m => m.hp > 0).length}/${ship.modules.length} systems online</span><span>${ship.repairKits} repair kits</span></div>
    </section>`;
}

function shortName(module: ShipModule) {
  const names: Record<string, string> = {
    'armor-top': 'ARM', sensor: 'SNS', 'weapon-left': 'WPN', core: 'CORE', 'weapon-right': 'WPN',
    'armor-left': 'ARM', hull: 'HULL', 'armor-right': 'ARM', 'engine-left': 'ENG', 'engine-right': 'ENG'
  };
  return names[module.id] || module.type.slice(0, 4).toUpperCase();
}

function weaponMarkup(weapon: Weapon) {
  const selected = mode.kind === 'fire' && mode.weaponId === weapon.id;
  return `<button class="action-card ${selected ? 'selected' : ''}" data-weapon="${weapon.id}" ${busy ? 'disabled' : ''}>
    <span class="weapon-icon ${weapon.id}"></span>
    <span><b>${weapon.name}</b><small>${weapon.damage} dmg · ${Math.round(weapon.accuracy * 100)}% base</small></span>
  </button>`;
}

function upgradeMarkup(key: string, label: string, description: string) {
  const level = profile?.upgrades?.[key] ?? 0;
  const cost = 100 * (level + 1);
  const maxed = level >= 5;
  return `<button class="upgrade-row" data-upgrade="${key}" ${busy || maxed ? 'disabled' : ''}>
    <span><b>${label}</b><small>${description}</small></span>
    <span class="upgrade-buy"><em>Lv ${level}</em><strong>${maxed ? 'MAX' : `${cost} C`}</strong></span>
  </button>`;
}

function profileMarkup() {
  if (!profile) return '';
  const google = profile.provider === 'google';
  return `<aside class="profile-panel panel">
    <div class="profile-head">
      ${profile.avatarUrl ? `<img src="${escapeAttribute(profile.avatarUrl)}" alt="" referrerpolicy="no-referrer">` : `<span class="pilot-avatar">${escapeHtml(profile.displayName.slice(0, 1).toUpperCase())}</span>`}
      <div><span class="eyebrow">PILOT</span><h3>${escapeHtml(profile.displayName)}</h3><small>${google ? 'Google account · cloud save' : 'Guest pilot · local cookie identity'}</small></div>
    </div>
    <div class="stats-grid">
      <div><b>${profile.rating}</b><span>rating</span></div><div><b>${profile.credits}</b><span>credits</span></div>
      <div><b>${profile.victories}</b><span>wins</span></div><div><b>${profile.defeats}</b><span>losses</span></div>
    </div>
    <div class="account-actions">
      ${!google && authConfig.googleConfigured ? `<a class="google-button" href="/auth/google">Save progress with Google</a>` : ''}
      ${!google && !authConfig.googleConfigured ? `<button class="google-button muted" disabled>Google save awaiting OAuth config</button>` : ''}
      ${google ? `<button id="logout" class="text-button">Sign out</button>` : ''}
    </div>
  </aside>`;
}

function render() {
  const weapons = battle?.weapons ?? [];
  const result = battle?.status === 'finished'
    ? `<div class="result-overlay"><div class="result-card"><span class="eyebrow">BATTLE COMPLETE</span><h2>${battle.winner === 'player' ? 'VICTORY' : 'DEFEAT'}</h2><p>${battle.winner === 'player' ? '+120 credits · +80 XP · +18 rating' : '+40 credits · +25 XP · rating adjusted'}</p><button id="rematch" class="primary-button">Rematch</button></div></div>`
    : '';

  app.innerHTML = `
    <div class="space-bg"><div class="nebula one"></div><div class="nebula two"></div><div class="stars"></div></div>
    <header class="topbar">
      <div class="brand"><span class="brand-mark"></span><div><b>COSMIC FIGHT</b><small>Target · Break · Adapt · Win</small></div></div>
      <div class="top-status"><span class="online-dot"></span><b>${online}</b><span>online</span><span class="divider"></span><span>AI vertical slice</span></div>
    </header>
    <main class="layout">
      <div class="left-rail">
        ${profileMarkup()}
        <section class="panel upgrade-panel">
          <div class="section-title"><div><span class="eyebrow">HANGAR</span><h3>Persistent upgrades</h3></div><span>${profile?.credits ?? 0} C</span></div>
          <div class="upgrade-list">${upgrades.map(([key, label, description]) => upgradeMarkup(key, label, description)).join('')}</div>
        </section>
      </div>

      <section class="battle-shell panel">
        <div class="battle-header">
          <div><span class="eyebrow">TACTICAL DUEL</span><h1>Modular Combat</h1></div>
          <div class="turn-chip"><span>TURN</span><b>${battle?.turn ?? '—'}</b><small>${battle?.activeSide === 'player' ? 'YOUR MOVE' : battle?.status === 'finished' ? 'COMPLETE' : 'ENEMY'}</small></div>
        </div>
        ${battle ? `<div class="battlefield">${shipMarkup(battle.enemyShip, false)}<div class="versus-line"><span></span><b>VS</b><span></span></div>${shipMarkup(battle.playerShip, true)}</div>` : `<div class="loading-battle">Initializing combat telemetry…</div>`}
        <div class="action-zone">
          <div class="mode-copy"><span class="eyebrow">COMMAND</span><b>${mode.kind === 'repair' ? 'Select a damaged friendly module' : 'Choose a weapon, then target an enemy module'}</b></div>
          <div class="actions">
            ${weapons.map(weaponMarkup).join('')}
            <button class="action-card repair ${mode.kind === 'repair' ? 'selected' : ''}" id="repair-mode" ${busy ? 'disabled' : ''}><span class="weapon-icon repair-icon"></span><span><b>Repair</b><small>Consumes kit + your turn</small></span></button>
          </div>
          <div class="battle-controls"><button id="new-battle" class="secondary-button" ${busy ? 'disabled' : ''}>New AI duel</button><span class="hint">Tip: break armor before attacking protected systems.</span></div>
        </div>
        ${result}
      </section>

      <aside class="right-rail panel">
        <div class="section-title"><div><span class="eyebrow">COMBAT FEED</span><h3>Battle log</h3></div></div>
        <div class="battle-log">${battle?.log?.slice().reverse().map(entry => `<div class="log-entry ${entry.kind}"><span>T${entry.turn}</span><p>${escapeHtml(entry.text)}</p></div>`).join('') || '<p class="muted-copy">No combat events yet.</p>'}</div>
        <div class="legend"><span><i class="legend-dot ok"></i>OK</span><span><i class="legend-dot damaged"></i>Damaged</span><span><i class="legend-dot critical"></i>Critical</span><span><i class="legend-dot destroyed"></i>Destroyed</span></div>
      </aside>
    </main>
    ${toast ? `<div class="toast ${busy ? 'working' : ''}">${escapeHtml(toast)}</div>` : ''}
    <footer><span>Cosmic Fight v${escapeHtml(version.version)}</span><span>Web + ASP.NET authoritative server · PostgreSQL</span></footer>
  `;

  document.querySelectorAll<HTMLButtonElement>('[data-weapon]').forEach(button => button.addEventListener('click', () => {
    mode = { kind: 'fire', weaponId: button.dataset.weapon! };
    toast = '';
    render();
  }));
  document.querySelector<HTMLButtonElement>('#repair-mode')?.addEventListener('click', () => { mode = { kind: 'repair' }; toast = ''; render(); });
  document.querySelectorAll<HTMLButtonElement>('[data-module]').forEach(button => button.addEventListener('click', () => act(button.dataset.module!, button.dataset.friendly === 'true')));
  document.querySelectorAll<HTMLButtonElement>('[data-upgrade]').forEach(button => button.addEventListener('click', () => buyUpgrade(button.dataset.upgrade!)));
  document.querySelector<HTMLButtonElement>('#new-battle')?.addEventListener('click', startBattle);
  document.querySelector<HTMLButtonElement>('#rematch')?.addEventListener('click', startBattle);
  document.querySelector<HTMLButtonElement>('#logout')?.addEventListener('click', logout);
}

const htmlEntities: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' };
function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, c => htmlEntities[c] ?? c);
}
function escapeAttribute(value: string) { return escapeHtml(value); }

async function boot() {
  render();
  const params = new URLSearchParams(location.search);
  if (params.has('auth')) history.replaceState({}, '', '/');
  try {
    [authConfig, version] = await Promise.all([
      api<AuthConfig>('/api/auth/config').catch(() => ({ googleConfigured: false })),
      api<VersionInfo>('/version.json').catch(() => ({ version: '0.1.0', commit: 'unknown' }))
    ]);
    await ensureIdentity();
    const arena = await api<{ online: number }>('/api/arena/status').catch(() => ({ online: 0 }));
    online = arena.online;
    if (params.get('auth') === 'success') toast = 'Google account connected. Progress is now tied to your account.';
    if (params.get('auth') === 'not-configured') toast = 'Google OAuth is implemented but server credentials are not configured yet.';
    if (params.get('auth') === 'failed') toast = 'Google sign-in failed. Guest progress is safe.';
    await startBattle();
  } catch (error) {
    toast = error instanceof Error ? error.message : 'Startup failed';
    render();
  }
}

if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => undefined));
void boot();
