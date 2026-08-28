import './styles.css';
import './hangar.css';
import './workshop.css';
import * as signalR from '@microsoft/signalr';
import { moduleKindFromId, moduleMeta } from './design/module-catalog';
import { playCombatEffects, type CombatVisualEvent } from './combat/battle-effects';

type Lang = 'ru' | 'en';
type View = 'hangar' | 'arena' | 'battle';
type Profile = { id:string; provider:string; displayName:string; avatarUrl?:string|null; credits:number; xp:number; rating:number; victories:number; defeats:number; upgrades:Record<string,number>; level?:number };
type Place = { id:string; x:number; y:number };
type Loadout = { weapons:string[]; modules:Place[] };
type Mod = { id:string; name:string; type:string; hp:number; maxHp:number; x:number; y:number; fireTurns:number; shortTurns:number; powered:boolean; condition:string };
type Ship = { id:string; name:string; modules:Mod[]; weaponIds:string[]; repairKits:number; integrity:number };
type Weapon = { id:string; name:string; damage:number; accuracy:number; description?:string };
type Log = { turn:number; kind:string; text:string };
type Battle = { id:string; turn:number; activeSide:'player'|'enemy'; status:string; winner?:string|null; playerShip:Ship; enemyShip:Ship; weapons:Weapon[]; log:Log[]; effects:CombatVisualEvent[] };
type Viewer = { ownSide:'player'|'enemy'; battle:Battle };
type Pilot = { id:string; displayName:string; avatarUrl?:string|null; rating:number; level:number; shipPower:number; status:string };
type Challenge = { id:string; fromPlayerId:string; fromName:string; toPlayerId:string; toName:string; expiresAt:string; status:string };
type Mode = { kind:'fire'; weaponId:string } | { kind:'repair' };
type DragState = { id:string; field:HTMLElement; el:HTMLElement; startX:number; startY:number };

const $ = document.querySelector<HTMLDivElement>('#app')!;
const tr = (ru:string, en:string) => lang === 'ru' ? ru : en;
const esc = (s:unknown) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]!));

const defaults:Loadout = { weapons:['laser','missile'], modules:[
  {id:'armor-top',x:50,y:15},{id:'sensor',x:50,y:28},{id:'weapon-left',x:25,y:43},{id:'core',x:50,y:48},{id:'weapon-right',x:75,y:43},
  {id:'armor-left',x:16,y:59},{id:'hull',x:50,y:65},{id:'armor-right',x:84,y:59},{id:'engine-left',x:35,y:82},{id:'engine-right',x:65,y:82}
]};
const moduleTemplates = new Map(defaults.modules.map(module => [module.id, module]));
const weapons = [
  ['laser','Лазер','Laser','╱','Точный мгновенный луч','Precise instant beam'],
  ['missile','Ракета','Missile','➤','Управляемая ракета с взрывом','Guided explosive missile'],
  ['scatter','Дробь','Scatter','✦','Веер кинетических снарядов','Kinetic pellet burst'],
  ['plasma','Плазма','Plasma','●','Медленный энергетический заряд','Slow energy bolt']
] as const;
const mods:Record<string,[string,string,string]> = {
  'armor-top':['Верхняя броня','Top armor','ARM'], sensor:['Навигация','Navigation','NAV'], 'weapon-left':['Левое орудие','Port weapon','WPN'],
  core:['Ядро','Core','CORE'], 'weapon-right':['Правое орудие','Starboard weapon','WPN'], 'armor-left':['Левая броня','Port armor','ARM'],
  hull:['Корпус','Hull','HULL'], 'armor-right':['Правая броня','Starboard armor','ARM'], 'engine-left':['Левый двигатель','Port engine','ENG'],
  'engine-right':['Правый двигатель','Starboard engine','ENG']
};
const defenseUpgrades = [
  ['fire-protection','Огнезащита','Fire protection'],
  ['electrical-shielding','Экранирование','Electrical shielding']
] as const;

let lang:Lang = localStorage.getItem('cf-language') === 'en' ? 'en' : 'ru';
let view:View = 'hangar';
let profile:Profile|null = null;
let loadout:Loadout = structuredClone(defaults);
let pilots:Pilot[] = [];
let online = 0;
let battle:Battle|null = null;
let own:'player'|'enemy' = 'player';
let pvp = false;
let mode:Mode = { kind:'fire', weaponId:'laser' };
let incoming:Challenge|null = null;
let outgoing:Challenge|null = null;
let busy = false;
let animating = false;
let toast = '';
let version = { version:'0.1.0', commit:'unknown' };
let hub:signalR.HubConnection|null = null;
let drag:DragState|null = null;
let selectedModuleId:string|null = 'core';
const playedEffects = new Set<string>();

async function api<T>(url:string, init?:RequestInit):Promise<T> {
  const response = await fetch(url, { ...init, headers:{ 'Content-Type':'application/json', ...(init?.headers || {}) } });
  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try { const body = await response.json() as { error?:string }; message = body.error || message; } catch { /* noop */ }
    throw new Error(message);
  }
  return response.status === 204 ? undefined as T : response.json();
}
const err = (e:unknown) => e instanceof Error ? e.message : tr('Ошибка','Error');

async function identity() {
  try { profile = await api<Profile>('/api/auth/me'); }
  catch { profile = await api<Profile>('/api/auth/guest', { method:'POST', body:'{}' }); }
}
async function save(show = true) {
  try {
    loadout = await api<Loadout>('/api/loadout', { method:'PUT', body:JSON.stringify(loadout) });
    if (show) toast = tr('Сборка сохранена на сервере','Build saved on server');
  } catch (e) { toast = err(e); }
  render();
}
async function refreshProfile() { profile = await api<Profile>('/api/profile').catch(() => profile); }
async function upgrade(key:string) {
  if (busy) return;
  busy = true; render();
  try {
    profile = await api<Profile>('/api/profile/upgrades', { method:'POST', body:JSON.stringify({ upgrade:key }) });
    toast = tr('Модуль улучшен','Module upgraded');
  } catch (e) { toast = err(e); }
  busy = false; render();
}

async function connect() {
  hub = new signalR.HubConnectionBuilder().withUrl('/hubs/game').withAutomaticReconnect([0,1000,3000,5000]).build();
  hub.on('arenaState', (state:{online:number;players:Pilot[]}) => { online=state.online; pilots=state.players; render(); });
  hub.on('arenaChanged', (state:{online:number}) => { online=state.online; void arena(); });
  hub.on('challengeReceived', (challenge:Challenge) => { incoming=challenge; toast=tr(`${challenge.fromName} вызывает вас на бой`,`${challenge.fromName} challenges you`); render(); });
  hub.on('challengeSent', (challenge:Challenge) => { outgoing=challenge; render(); });
  hub.on('challengeDeclined', () => { outgoing=null; toast=tr('Вызов отклонён','Challenge declined'); render(); });
  hub.on('challengeClosed', () => { incoming=null; render(); });
  hub.on('matchStarted', (viewer:Viewer) => enter(viewer));
  hub.on('battleUpdated', (viewer:Viewer) => { void receiveBattle(viewer); });
  hub.on('profileChanged', () => void refreshProfile().then(render));
  hub.onreconnected(() => void arena());
  try { await hub.start(); await arena(); }
  catch { toast=tr('PvP-соединение временно недоступно','PvP connection unavailable'); render(); }
}
async function arena() {
  if (hub?.state === signalR.HubConnectionState.Connected) {
    try {
      const state = await hub.invoke<{online:number;players:Pilot[]}>('GetArena');
      online=state.online; pilots=state.players;
    } catch { /* noop */ }
  }
  render();
}
async function challenge(id:string) {
  try { await save(false); await hub?.invoke('Challenge',id); }
  catch (e) { toast=err(e); render(); }
}
async function answer(ok:boolean) {
  if (!incoming) return;
  busy=true; render();
  try { await save(false); await hub?.invoke('RespondChallenge',incoming.id,ok); if(!ok) incoming=null; }
  catch(e){ toast=err(e); }
  busy=false; render();
}
function enter(viewer:Viewer) {
  incoming=outgoing=null;
  own=viewer.ownSide;
  battle=viewer.battle;
  pvp=true;
  view='battle';
  playedEffects.clear();
  viewer.battle.effects?.forEach(effect => playedEffects.add(effect.id));
  mode={kind:'fire',weaponId:myShip()?.weaponIds[0] || 'laser'};
  render();
}
async function receiveBattle(viewer:Viewer) {
  own=viewer.ownSide;
  battle=viewer.battle;
  busy=false;
  const fresh = (battle.effects || []).some(effect => !playedEffects.has(effect.id));
  animating=fresh;
  render();
  if (fresh) {
    await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
    await playCombatEffects(battle.effects || [], own, playedEffects);
  }
  animating=false;
  render();
}
async function ai() {
  busy=true; render();
  try {
    await save(false);
    battle=await api<Battle>('/api/battles/ai',{method:'POST',body:'{}'});
    own='player'; pvp=false; view='battle'; playedEffects.clear();
    mode={kind:'fire',weaponId:battle.playerShip.weaponIds[0] || 'laser'};
  } catch(e) { toast=err(e); }
  busy=false; render();
}
async function action(id:string, friendly:boolean) {
  if(!battle || busy || animating || battle.status!=='active' || battle.activeSide!==own) return;
  if((mode.kind==='repair' && !friendly) || (mode.kind==='fire' && friendly)) return;
  busy=true; render();
  const request={turn:battle.turn,action:mode.kind,weaponId:mode.kind==='fire'?mode.weaponId:null,targetModuleId:id,clientActionId:crypto.randomUUID()};
  try {
    if(pvp) {
      await hub?.invoke('Act',request);
    } else {
      const next=await api<Battle>(`/api/battles/${battle.id}/actions`,{method:'POST',body:JSON.stringify(request)});
      battle=next;
      const fresh=(battle.effects||[]).some(effect=>!playedEffects.has(effect.id));
      animating=fresh; busy=false; render();
      if(fresh){await new Promise<void>(resolve=>requestAnimationFrame(()=>resolve()));await playCombatEffects(battle.effects||[],own,playedEffects);}
      animating=false;
      if(battle.status==='finished') await refreshProfile();
      render();
    }
  } catch(e) { toast=err(e); busy=false; animating=false; render(); }
}
const myShip=()=>!battle?null:own==='player'?battle.playerShip:battle.enemyShip;
const enemyShip=()=>!battle?null:own==='player'?battle.enemyShip:battle.playerShip;

function installed(id:string){return loadout.modules.some(module=>module.id===id);}
function template(id:string){return moduleTemplates.get(id);}
function upgradeKey(id:string){
  const kind=moduleKindFromId(id);
  return kind==='engine'?'engines':kind==='weapon'?'weapons':kind==='sensor'?'sensors':kind;
}
function canRemove(id:string){
  if(id==='core'||id==='hull')return false;
  const kind=moduleKindFromId(id);
  if(kind==='weapon'&&loadout.modules.filter(m=>moduleKindFromId(m.id)==='weapon').length<=1)return false;
  if(kind==='engine'&&loadout.modules.filter(m=>moduleKindFromId(m.id)==='engine').length<=1)return false;
  return true;
}
function removeModule(id:string){
  if(!canRemove(id)){toast=tr('Нельзя снять последний обязательный модуль этого типа','Cannot remove the last required module of this type');render();return;}
  loadout.modules=loadout.modules.filter(module=>module.id!==id);
  selectedModuleId=loadout.modules.find(module=>module.id==='core')?.id || loadout.modules[0]?.id || null;
  toast=tr('Модуль снят. Сохраните сборку.','Module removed. Save the build.');
  render();
}
function addModule(id:string){
  if(installed(id))return;
  const source=template(id);if(!source)return;
  loadout.modules.push({...source});selectedModuleId=id;
  toast=tr('Модуль установлен. Перетащите его в нужное место.','Module installed. Drag it into position.');
  render();
}

function frame(body:string){return `<div class="cf-space"></div><header class="cf-top"><button class="cf-logo" data-view="hangar">✦ <b>COSMIC FIGHT</b></button><nav><button data-view="hangar" class="${view==='hangar'?'on':''}">${tr('АНГАР','HANGAR')}</button><button data-view="arena" class="${view==='arena'?'on':''}">${tr('АРЕНА','ARENA')} <em>${online}</em></button></nav><div class="cf-user"><button data-lang="ru" class="${lang==='ru'?'on':''}">RU</button><button data-lang="en" class="${lang==='en'?'on':''}">EN</button><span>${esc(profile?.displayName||'Pilot')} · ${profile?.rating||1000}</span></div></header><main class="cf-main">${body}</main>${incoming?modal():''}${toast?`<div class="cf-toast">${esc(toast)}</div>`:''}<footer class="cf-footer">Cosmic Fight v${esc(version.version)} · ${esc(version.commit)} <span>ASP.NET Core · PostgreSQL · SignalR</span></footer>`}

function hangar(){
  const power=100+(profile?Object.values(profile.upgrades).reduce((a,b)=>a+b,0)*18:0)+loadout.modules.length*7;
  return frame(`<section class="cf-hero"><div><small>${tr('КОНСТРУКТОР КОРАБЛЯ','SHIP CONSTRUCTOR')}</small><h1>${tr('Соберите корабль перед боем','Build your ship before battle')}</h1><p>${tr('Выбирайте узлы прямо на корабле: улучшайте, снимайте, возвращайте со склада и меняйте местами.','Select systems directly on the ship: upgrade, remove, reinstall and swap them.')}</p></div><strong>${tr('МОЩЬ','POWER')}<b>${power}</b></strong></section><section class="cf-hangar cf-workshop-layout"><article class="cf-panel"><div class="cf-title"><div><small>${tr('ВАШ КОРАБЛЬ','YOUR SHIP')}</small><h2>CF–Vanguard</h2></div><div><button id="reset">${tr('Сброс','Reset')}</button><button id="save">${tr('Сохранить','Save')}</button></div></div>${shipBuilder()}</article><aside>${moduleInspector()}${armoryPanel()}${inventoryPanel()}${defensePanel()}</aside></section><div class="cf-launch"><span><b>${tr('Корабль готов?','Ship ready?')}</b>${tr(' Сборка и позиции модулей сохраняются на сервере.',' Build and module positions are stored on the server.')}</span><button id="go-arena">${tr('В ОНЛАЙН-АРЕНУ','ENTER ONLINE ARENA')} →</button></div>`);
}
function shipBuilder(){
  return `<div class="cf-builder"><div class="cf-hull"><i class="nose"></i><i class="body"></i><i class="wing l"></i><i class="wing r"></i><i class="engine l"></i><i class="engine r"></i></div>${loadout.modules.map(p=>`<button data-drag="${p.id}" data-select-module="${p.id}" class="cf-module ${kind(p.id)} ${selectedModuleId===p.id?'selected':''}" style="left:${p.x}%;top:${p.y}%"><b>${mods[p.id]?.[2]||'MOD'}</b><span>${tr(mods[p.id]?.[0]||p.id,mods[p.id]?.[1]||p.id)}</span></button>`).join('')}<div class="cf-dragtip">↔ ${tr('ПЕРЕТАЩИТЕ · БРОСЬТЕ НА ДРУГОЙ МОДУЛЬ ДЛЯ ОБМЕНА','DRAG · DROP ON ANOTHER MODULE TO SWAP')}</div></div>`;
}
function kind(id:string){return moduleKindFromId(id);}
function moduleInspector(){
  const id=selectedModuleId&&installed(selectedModuleId)?selectedModuleId:loadout.modules[0]?.id;
  if(!id)return `<section class="cf-panel cf-inspector"><div class="cf-title"><h2>${tr('Модуль','Module')}</h2></div></section>`;
  selectedModuleId=id;
  const meta=moduleMeta(id);const place=loadout.modules.find(module=>module.id===id)!;const key=upgradeKey(id);const level=profile?.upgrades[key]||0;const cost=100*(level+1);const removable=canRemove(id);
  const name=tr(meta.ru,meta.en);const role=tr(meta.roleRu,meta.roleEn);const description=tr(meta.descriptionRu,meta.descriptionEn);
  return `<section class="cf-panel cf-inspector"><div class="cf-title"><div><small>${tr('ВЫБРАННЫЙ МОДУЛЬ','SELECTED MODULE')}</small><h2>${meta.icon} ${esc(name)}</h2></div><b>Lv ${level}/5</b></div><div class="cf-inspector-body"><strong>${esc(role)}</strong><p>${esc(description)}</p><div class="cf-module-coords"><span>X <b>${place.x.toFixed(1)}%</b></span><span>Y <b>${place.y.toFixed(1)}%</b></span><span>${tr('Тип','Type')} <b>${esc(meta.short)}</b></span></div><button data-upgrade-selected="${key}" ${busy||level>=5?'disabled':''}>⬆ ${level>=5?tr('МАКСИМАЛЬНЫЙ УРОВЕНЬ','MAX LEVEL'):tr(`УЛУЧШИТЬ · ${cost} C`,`UPGRADE · ${cost} C`)}</button><button data-remove-module="${id}" class="danger" ${!removable?'disabled':''}>− ${removable?tr('СНЯТЬ МОДУЛЬ','REMOVE MODULE'):tr('ОБЯЗАТЕЛЬНЫЙ МОДУЛЬ','REQUIRED MODULE')}</button></div></section>`;
}
function armoryPanel(){return `<section class="cf-panel cf-armory"><div class="cf-title"><h2>${tr('Боекомплект · 2 типа','Loadout · 2 weapon types')}</h2><b>${loadout.weapons.length}/2</b></div>${weapons.map(w=>`<button data-equip="${w[0]}" class="${loadout.weapons.includes(w[0])?'on':''}"><i>${w[3]}</i><span><b>${tr(w[1],w[2])}</b><small>${tr(w[4],w[5])}</small></span></button>`).join('')}</section>`}
function inventoryPanel(){
  const missing=defaults.modules.filter(module=>!installed(module.id));
  return `<section class="cf-panel cf-inventory"><div class="cf-title"><h2>${tr('Склад модулей','Module inventory')}</h2><b>${missing.length}</b></div><div class="cf-inventory-list">${missing.length?missing.map(module=>{const meta=moduleMeta(module.id);return `<button data-add-module="${module.id}"><i>${meta.icon}</i><span><b>${esc(tr(meta.ru,meta.en))}</b><small>${esc(tr(meta.roleRu,meta.roleEn))}</small></span><em>＋</em></button>`}).join(''):`<p>${tr('Все доступные модули установлены.','All available modules are installed.')}</p>`}</div></section>`;
}
function defensePanel(){return `<section class="cf-panel cf-upgrades"><div class="cf-title"><h2>${tr('Защита систем','System protection')}</h2><b>${profile?.credits||0} C</b></div>${defenseUpgrades.map(u=>{const lv=profile?.upgrades[u[0]]||0,c=100*(lv+1);return `<button data-upgrade="${u[0]}" ${lv>=5||busy?'disabled':''}><span><b>${tr(u[1],u[2])}</b><small>Lv ${lv}/5</small></span><em>${lv>=5?'MAX':`+ ${c} C`}</em></button>`}).join('')}</section>`}

function arenaView(){return frame(`<section class="cf-hero"><div><small>${tr('ОНЛАЙН-АРЕНА','ONLINE ARENA')}</small><h1>${tr('Выберите живого соперника','Choose a live opponent')}</h1><p>${tr('Вызов приходит мгновенно. После подтверждения сервер создаёт один общий бой для двух устройств.','The challenge arrives instantly. After acceptance the server creates one shared battle for both devices.')}</p></div><strong class="live">● <b>${online}</b>${tr('ОНЛАЙН','ONLINE')}</strong></section><section class="cf-arena"><article class="cf-panel"><div class="cf-title"><h2>${tr('Пилоты в сети','Pilots online')}</h2><button id="refresh">↻</button></div><div class="cf-pilots">${pilots.length?pilots.map(pilot).join(''):`<div class="cf-empty">${tr('Откройте игру на другом устройстве под другим аккаунтом или гостевой сессией.','Open the game on another device with another account or guest session.')}</div>`}</div></article><aside class="cf-panel cf-help"><h2>${tr('Как начинается PvP','How PvP starts')}</h2><ol><li>1. ${tr('Выберите пилота','Choose a pilot')}</li><li>2. ${tr('Он получит запрос','They receive a request')}</li><li>3. ${tr('Он принимает бой','They accept')}</li><li>4. ${tr('Сервер синхронизирует ходы и снаряды','Server syncs turns and projectiles')}</li></ol><button id="ai">${tr('Тестовый бой с AI','Test battle vs AI')}</button>${outgoing?`<div class="cf-wait">${tr('Ждём ответ от','Waiting for')} <b>${esc(outgoing.toName)}</b>…</div>`:''}</aside></section>`)}
function pilot(p:Pilot){const ok=p.status==='online_available';return `<div class="cf-pilot"><span class="cf-avatar">${p.avatarUrl?`<img src="${esc(p.avatarUrl)}">`:esc(p.displayName[0])}<i class="${ok?'ok':'busy'}"></i></span><div><b>${esc(p.displayName)}</b><small>Lv ${p.level} · ${p.rating} ELO · ${tr('мощь','power')} ${p.shipPower}</small></div><em>${ok?tr('ГОТОВ','READY'):tr('В БОЮ','IN BATTLE')}</em><button data-challenge="${p.id}" ${!ok||!!outgoing?'disabled':''}>⚔ ${tr('ВЫЗВАТЬ','CHALLENGE')}</button></div>`}

function targetingState(ship:Ship){
  const sensor=ship.modules.find(module=>module.id==='sensor');const engines=ship.modules.filter(module=>moduleKindFromId(module.id)==='engine');
  const sensorRatio=sensor?Math.max(0,sensor.hp/sensor.maxHp)*(sensor.powered?1:.35)*(sensor.shortTurns>0?.3:1):.18;
  const engineRatio=engines.length?engines.reduce((sum,module)=>sum+Math.max(0,module.hp/module.maxHp)*(module.powered?1:.35)*(module.shortTurns>0?.3:1),0)/engines.length:.35;
  const value=Math.round(Math.max(0,Math.min(1,.65*sensorRatio+.35*engineRatio))*100);
  return {value,bad:value<55,critical:value<30};
}
function battleView(){
  if(!battle)return hangar();const me=myShip()!,foe=enemyShip()!;const turn=battle.status==='active'&&battle.activeSide===own&&!animating;const targeting=targetingState(me);
  return frame(`<section class="cf-battle-head"><div><small>${pvp?'PVP · LIVE':tr('ТРЕНИРОВКА · AI','TRAINING · AI')}</small><h1>${esc(me.name)} <em>VS</em> ${esc(foe.name)}</h1></div><div class="cf-battle-statuses"><span class="cf-targeting ${targeting.bad?'bad':''} ${targeting.critical?'critical':''}">${tr('НАВЕДЕНИЕ','TARGETING')} <b>${targeting.value}%</b></span><strong class="${turn?'mine':''}">${tr('ХОД','TURN')} ${battle.turn}<b>${battle.status==='finished'?tr('БОЙ ЗАВЕРШЁН','BATTLE OVER'):animating?tr('СНАРЯД В ПОЛЁТЕ','PROJECTILE IN FLIGHT'):turn?tr('ВАШ ХОД','YOUR TURN'):tr('ХОД СОПЕРНИКА','OPPONENT TURN')}</b></strong></div></section><section class="cf-panel cf-battle"><div class="cf-battlefield">${combatShip(foe,false)}<div class="cf-vs">VS</div>${combatShip(me,true)}</div><div class="cf-weapons">${battle.weapons.filter(w=>me.weaponIds.includes(w.id)).map(w=>`<button data-weapon="${w.id}" class="${mode.kind==='fire'&&mode.weaponId===w.id?'on':''}" ${!turn||busy?'disabled':''}><i>${weapons.find(x=>x[0]===w.id)?.[3]||'•'}</i><b>${weaponName(w.id)}</b><small>${w.damage} DMG · ${Math.round(w.accuracy*100)}%</small></button>`).join('')}<button id="repair" class="${mode.kind==='repair'?'on':''}" ${!turn||busy?'disabled':''}>✚ <b>${tr('Ремонт','Repair')}</b><small>${me.repairKits} kits</small></button></div><p class="cf-command">${targeting.critical?tr('Навигация критически повреждена: траектория сильно нестабильна.','Navigation critically damaged: projectile trajectory is highly unstable.'):mode.kind==='repair'?tr('Выберите повреждённый модуль своего корабля','Select a damaged friendly module'):tr('Выберите модуль противника — снаряд полетит от реальной оружейной точки.','Select an enemy module — the projectile launches from an actual weapon hardpoint.')}</p></section><section class="cf-battle-bottom"><article class="cf-panel"><h2>${tr('Журнал боя','Battle log')}</h2>${battle.log.slice(-8).reverse().map(x=>`<p><b>T${x.turn}</b> ${esc(x.text)}</p>`).join('')}</article><aside class="cf-panel"><h2>${tr('Серверный контроль','Server authority')}</h2><p>${tr('Сервер решает попадание, разброс и точку промаха. Поэтому оба игрока видят одинаковый полёт снаряда.','Server decides hit, spread and miss point, so both players see the same projectile flight.')}</p>${battle.status==='finished'?`<button id="back">${tr('ВЕРНУТЬСЯ В АРЕНУ','BACK TO ARENA')}</button>`:''}</aside></section>`);
}
function combatShip(ship:Ship,friendly:boolean){return `<div class="cf-combatship ${friendly?'friend':'enemy'}"><div class="cf-shipname"><b>${esc(ship.name)}</b><strong>${ship.integrity}%</strong></div><div class="cf-integrity"><i style="width:${ship.integrity}%"></i></div><div class="cf-combatfield"><div class="cf-hull"><i class="nose"></i><i class="body"></i><i class="wing l"></i><i class="wing r"></i><i class="engine l"></i><i class="engine r"></i></div>${ship.modules.map(module=>`<button data-module="${module.id}" data-friendly="${friendly}" class="cf-hit ${kind(module.id)} ${String(module.condition).toLowerCase()}" style="left:${module.x}%;top:${module.y}%" ${module.hp<=0?'disabled':''}><b>${mods[module.id]?.[2]||'MOD'}</b><i><span style="width:${Math.max(0,module.hp/module.maxHp*100)}%"></span></i>${module.fireTurns?'🔥':''}${module.shortTurns?'⚡':''}</button>`).join('')}</div></div>`}
const weaponName=(id:string)=>{const weapon=weapons.find(item=>item[0]===id);return weapon?tr(weapon[1],weapon[2]):id;};
function modal(){return `<div class="cf-modal"><div><small>${tr('ВХОДЯЩИЙ ВЫЗОВ','INCOMING CHALLENGE')}</small><strong>⚔</strong><h2>${esc(incoming?.fromName)}</h2><p>${tr('вызывает вас на дуэль','challenges you to a duel')}</p><button id="decline">${tr('Отклонить','Decline')}</button><button id="accept">${tr('ПРИНЯТЬ БОЙ','ACCEPT DUEL')}</button></div></div>`}

function render(){document.documentElement.lang=lang;$.innerHTML=view==='hangar'?hangar():view==='arena'?arenaView():battleView();bind();}
function bind(){
  document.querySelectorAll<HTMLButtonElement>('[data-view]').forEach(button=>button.onclick=()=>{view=button.dataset.view as View;if(view==='arena')void arena();else render();});
  document.querySelectorAll<HTMLButtonElement>('[data-lang]').forEach(button=>button.onclick=()=>{lang=button.dataset.lang as Lang;localStorage.setItem('cf-language',lang);render();});
  document.querySelector('#save')?.addEventListener('click',()=>void save());
  document.querySelector('#reset')?.addEventListener('click',()=>{loadout=structuredClone(defaults);selectedModuleId='core';render();});
  document.querySelector('#go-arena')?.addEventListener('click',()=>void save(false).then(()=>{view='arena';void arena();}));
  document.querySelectorAll<HTMLButtonElement>('[data-equip]').forEach(button=>button.onclick=()=>{const id=button.dataset.equip!;if(loadout.weapons.includes(id)){if(loadout.weapons.length>1)loadout.weapons=loadout.weapons.filter(x=>x!==id);}else loadout.weapons=loadout.weapons.length>=2?[loadout.weapons[1],id]:[...loadout.weapons,id];render();});
  document.querySelectorAll<HTMLButtonElement>('[data-upgrade]').forEach(button=>button.onclick=()=>void upgrade(button.dataset.upgrade!));
  document.querySelectorAll<HTMLButtonElement>('[data-upgrade-selected]').forEach(button=>button.onclick=()=>void upgrade(button.dataset.upgradeSelected!));
  document.querySelectorAll<HTMLButtonElement>('[data-remove-module]').forEach(button=>button.onclick=()=>removeModule(button.dataset.removeModule!));
  document.querySelectorAll<HTMLButtonElement>('[data-add-module]').forEach(button=>button.onclick=()=>addModule(button.dataset.addModule!));
  document.querySelectorAll<HTMLElement>('[data-drag]').forEach(element=>element.onpointerdown=event=>{const field=element.closest('.cf-builder') as HTMLElement;const place=loadout.modules.find(module=>module.id===element.dataset.drag!)!;selectedModuleId=place.id;drag={id:place.id,field,el:element,startX:place.x,startY:place.y};element.setPointerCapture?.(event.pointerId);element.classList.add('selected');});
  document.querySelector('#refresh')?.addEventListener('click',()=>void arena());
  document.querySelector('#ai')?.addEventListener('click',()=>void ai());
  document.querySelectorAll<HTMLButtonElement>('[data-challenge]').forEach(button=>button.onclick=()=>void challenge(button.dataset.challenge!));
  document.querySelector('#accept')?.addEventListener('click',()=>void answer(true));
  document.querySelector('#decline')?.addEventListener('click',()=>void answer(false));
  document.querySelectorAll<HTMLButtonElement>('[data-weapon]').forEach(button=>button.onclick=()=>{mode={kind:'fire',weaponId:button.dataset.weapon!};render();});
  document.querySelector('#repair')?.addEventListener('click',()=>{mode={kind:'repair'};render();});
  document.querySelectorAll<HTMLButtonElement>('[data-module]').forEach(button=>button.onclick=()=>void action(button.dataset.module!,button.dataset.friendly==='true'));
  document.querySelector('#back')?.addEventListener('click',()=>{battle=null;pvp=false;view='arena';void arena();});
}

window.addEventListener('pointermove',event=>{
  if(!drag)return;
  const rect=drag.field.getBoundingClientRect();
  const x=Math.max(6,Math.min(94,(event.clientX-rect.left)/rect.width*100));
  const y=Math.max(8,Math.min(92,(event.clientY-rect.top)/rect.height*100));
  const place=loadout.modules.find(module=>module.id===drag!.id);
  if(place){place.x=+x.toFixed(1);place.y=+y.toFixed(1);}
  drag.el.style.left=`${x}%`;drag.el.style.top=`${y}%`;
});
window.addEventListener('pointerup',()=>{
  if(!drag)return;
  const moved=loadout.modules.find(module=>module.id===drag!.id);
  if(moved){
    const other=loadout.modules.filter(module=>module.id!==moved.id).map(module=>({module,distance:Math.hypot(module.x-moved.x,module.y-moved.y)})).sort((a,b)=>a.distance-b.distance)[0];
    if(other&&other.distance<9){const ox=other.module.x,oy=other.module.y;other.module.x=drag.startX;other.module.y=drag.startY;moved.x=ox;moved.y=oy;toast=tr('Модули поменялись местами — сохраните сборку','Modules swapped — save the build');}
    else toast=tr('Позиция изменена — сохраните сборку','Position changed — save the build');
  }
  drag=null;render();
});

async function boot(){
  render();const query=new URLSearchParams(location.search);
  try{
    version=await fetch('/version.json',{cache:'no-store'}).then(response=>response.json()).catch(()=>version);
    await identity();
    loadout=await api<Loadout>('/api/loadout').catch(()=>structuredClone(defaults));
    selectedModuleId=loadout.modules.some(module=>module.id==='core')?'core':loadout.modules[0]?.id||null;
    if(query.get('auth')==='success')toast=tr('Google подключён: профиль синхронизируется между устройствами','Google connected: profile syncs across devices');
    if(query.has('auth'))history.replaceState({},'',location.pathname);
    await connect();render();
  }catch(e){toast=err(e);render();}
}
if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}));
void boot();
