import './reference-theme.css';
import * as signalR from '@microsoft/signalr';
import { MODULE_LINKS, moduleKindFromId, moduleMeta } from './design/module-catalog';
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
type UpgradeDef = { key:string; ru:string; en:string; descRu:string; descEn:string; effectRu:(level:number)=>string; effectEn:(level:number)=>string };

const $ = document.querySelector<HTMLDivElement>('#app')!;
const tr = (ru:string, en:string) => lang === 'ru' ? ru : en;
const esc = (s:unknown) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]!));

const defaults:Loadout = { weapons:['laser','missile'], modules:[
  {id:'engine-left',x:20,y:39},{id:'engine-right',x:20,y:61},{id:'hull',x:35,y:50},{id:'armor-top',x:49,y:27},
  {id:'core',x:50,y:50},{id:'armor-left',x:42,y:73},{id:'armor-right',x:58,y:73},{id:'sensor',x:64,y:50},
  {id:'weapon-left',x:69,y:34},{id:'weapon-right',x:69,y:66}
]};
const moduleTemplates = new Map(defaults.modules.map(module => [module.id, module]));
const weaponMeta = [
  {id:'laser',ru:'Лазер',en:'Laser',key:'1',icon:'╱',descRu:'Точный быстрый луч',descEn:'Precise fast beam'},
  {id:'missile',ru:'Ракета',en:'Missile',key:'2',icon:'➤',descRu:'Тяжёлая ракета со взрывом',descEn:'Heavy explosive missile'},
  {id:'scatter',ru:'Дробь',en:'Scatter',key:'3',icon:'✦',descRu:'Веер кинетических снарядов',descEn:'Kinetic pellet burst'},
  {id:'plasma',ru:'Плазма',en:'Plasma',key:'4',icon:'●',descRu:'Энергетический заряд',descEn:'Energy bolt'}
] as const;
const upgradeDefs:UpgradeDef[] = [
  {key:'core',ru:'Ядро',en:'Core',descRu:'Больше HP ядра и устойчивость корабля',descEn:'More core HP and ship resilience',effectRu:l=>`HP +${l*12} · питание стабильнее`,effectEn:l=>`HP +${l*12} · steadier power`},
  {key:'engines',ru:'Двигатели',en:'Engines',descRu:'HP двигателей и стабильность наведения',descEn:'Engine HP and targeting stability',effectRu:l=>`HP +${l*12} · разброс ниже`,effectEn:l=>`HP +${l*12} · lower spread`},
  {key:'weapons',ru:'Орудия',en:'Weapons',descRu:'HP оружейных узлов и бонус к урону',descEn:'Weapon hardpoint HP and damage bonus',effectRu:l=>`HP +${l*12} · урон +${l*4}%`,effectEn:l=>`HP +${l*12} · damage +${l*4}%`},
  {key:'armor',ru:'Броня',en:'Armor',descRu:'Больше HP бронепластин и поглощение урона',descEn:'More armor HP and damage absorption',effectRu:l=>`HP +${l*12} · защита выше`,effectEn:l=>`HP +${l*12} · better protection`},
  {key:'sensors',ru:'Навигация',en:'Navigation',descRu:'HP навигации и точность выстрелов',descEn:'Navigation HP and firing accuracy',effectRu:l=>`HP +${l*12} · точность выше`,effectEn:l=>`HP +${l*12} · accuracy higher`},
  {key:'hull',ru:'Корпус',en:'Hull',descRu:'Структурная прочность и защита от каскада',descEn:'Structural strength and cascade resistance',effectRu:l=>`HP +${l*12} · каркас прочнее`,effectEn:l=>`HP +${l*12} · stronger frame`},
  {key:'fire-protection',ru:'Огнезащита',en:'Fire protection',descRu:'Снижает шанс пожара',descEn:'Reduces fire chance',effectRu:l=>`сопротивление пожару +${l*6}%`,effectEn:l=>`fire resistance +${l*6}%`},
  {key:'electrical-shielding',ru:'Экранирование',en:'Shielding',descRu:'Снижает шанс короткого замыкания',descEn:'Reduces electrical short chance',effectRu:l=>`защита от КЗ +${l*7}%`,effectEn:l=>`short resistance +${l*7}%`}
];

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
    if (show) toast = tr('Сборка сохранена','Build saved');
  } catch (e) { toast = err(e); }
  render();
}
async function refreshProfile() { profile = await api<Profile>('/api/profile').catch(() => profile); }
async function upgrade(key:string) {
  if (busy) return;
  busy = true; render();
  try {
    profile = await api<Profile>('/api/profile/upgrades', { method:'POST', body:JSON.stringify({ upgrade:key }) });
    toast = tr('Улучшение установлено','Upgrade installed');
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
  incoming=outgoing=null; own=viewer.ownSide; battle=viewer.battle; pvp=true; view='battle';
  playedEffects.clear(); viewer.battle.effects?.forEach(effect => playedEffects.add(effect.id));
  mode={kind:'fire',weaponId:myShip()?.weaponIds[0] || 'laser'}; render();
}
async function receiveBattle(viewer:Viewer) {
  own=viewer.ownSide; battle=viewer.battle; busy=false;
  const fresh=(battle.effects||[]).some(effect=>!playedEffects.has(effect.id));
  animating=fresh; render();
  if(fresh){await new Promise<void>(resolve=>requestAnimationFrame(()=>resolve()));await playCombatEffects(battle.effects||[],own,playedEffects);}
  animating=false; render();
}
async function ai() {
  busy=true; render();
  try {
    await save(false); battle=await api<Battle>('/api/battles/ai',{method:'POST',body:'{}'});
    own='player'; pvp=false; view='battle'; playedEffects.clear(); mode={kind:'fire',weaponId:battle.playerShip.weaponIds[0]||'laser'};
  } catch(e){toast=err(e);} busy=false; render();
}
async function action(id:string,friendly:boolean) {
  if(!battle||busy||animating||battle.status!=='active'||battle.activeSide!==own)return;
  if((mode.kind==='repair'&&!friendly)||(mode.kind==='fire'&&friendly))return;
  busy=true;render();
  const request={turn:battle.turn,action:mode.kind,weaponId:mode.kind==='fire'?mode.weaponId:null,targetModuleId:id,clientActionId:crypto.randomUUID()};
  try{
    if(pvp)await hub?.invoke('Act',request);
    else{
      battle=await api<Battle>(`/api/battles/${battle.id}/actions`,{method:'POST',body:JSON.stringify(request)});
      const fresh=(battle.effects||[]).some(effect=>!playedEffects.has(effect.id));busy=false;animating=fresh;render();
      if(fresh){await new Promise<void>(resolve=>requestAnimationFrame(()=>resolve()));await playCombatEffects(battle.effects||[],own,playedEffects);}
      animating=false;if(battle.status==='finished')await refreshProfile();render();
    }
  }catch(e){
    toast=err(e);busy=false;animating=false;
    if(!pvp&&battle){
      const latest=await api<Battle>(`/api/battles/${battle.id}`).catch(()=>null);
      if(latest){battle=latest;if(battle.status==='finished')await refreshProfile();}
    }
    render();
  }
}
const myShip=()=>!battle?null:own==='player'?battle.playerShip:battle.enemyShip;
const enemyShip=()=>!battle?null:own==='player'?battle.enemyShip:battle.playerShip;

function installed(id:string){return loadout.modules.some(module=>module.id===id);}
function template(id:string){return moduleTemplates.get(id);}
function upgradeKey(id:string){const kind=moduleKindFromId(id);return kind==='engine'?'engines':kind==='weapon'?'weapons':kind==='sensor'?'sensors':kind;}
function canRemove(id:string){
  if(id==='core'||id==='hull')return false;
  const kind=moduleKindFromId(id);
  if(kind==='weapon'&&loadout.modules.filter(m=>moduleKindFromId(m.id)==='weapon').length<=1)return false;
  if(kind==='engine'&&loadout.modules.filter(m=>moduleKindFromId(m.id)==='engine').length<=1)return false;
  return true;
}
function removeModule(id:string){
  if(!canRemove(id)){toast=tr('Этот модуль сейчас обязателен','This module is currently required');render();return;}
  loadout.modules=loadout.modules.filter(module=>module.id!==id);selectedModuleId='core';toast=tr('Модуль снят','Module removed');render();
}
function addModule(id:string){
  if(installed(id))return;const source=template(id);if(!source)return;
  loadout.modules.push({...source});selectedModuleId=id;toast=tr('Модуль установлен — можно перетащить','Module installed — drag it into place');render();
}
function migrateLegacyLayout(){
  const engines=loadout.modules.filter(m=>m.id.startsWith('engine-'));
  const core=loadout.modules.find(m=>m.id==='core');
  if(!core||engines.length<2||core.y<42||core.y>55||!engines.every(m=>m.y>74))return false;
  loadout.modules=loadout.modules.map(module=>{const next=template(module.id);return next?{...module,x:next.x,y:next.y}:module;});
  return true;
}

function frame(body:string){
  return `<div class="ref-stars" aria-hidden="true"><i></i><i></i><i></i></div><header class="ref-header"><nav class="ref-nav" aria-label="${tr('Главная навигация','Primary navigation')}"><button data-view="hangar" class="${view==='hangar'?'on':''}"><i>◇</i><span>${tr('ВЕРФЬ','SHIPYARD')}</span></button><button data-view="arena" class="${view==='arena'?'on':''}"><i>⌁</i><span>${tr('АРЕНА','ARENA')}</span><b>${online}</b></button></nav><div class="ref-brand"><button data-view="hangar" aria-label="Cosmic Fight"><span>COSMIC</span><strong>FIGHT</strong></button><small>${tr('тактические корабельные дуэли','tactical starship duels')}</small></div><div class="cf-user ref-user"><div class="ref-pilot-chip"><i></i><span>${esc(profile?.displayName||'Pilot')}</span><b>${profile?.rating||1000}</b></div><div class="ref-language"><button data-lang="ru" class="${lang==='ru'?'on':''}">RU</button><button data-lang="en" class="${lang==='en'?'on':''}">EN</button></div></div></header><main class="ref-page" data-view="${view}">${body}</main><nav class="ref-mobile-nav" aria-label="${tr('Мобильная навигация','Mobile navigation')}"><button data-view="hangar" class="${view==='hangar'?'on':''}"><i>◇</i><span>${tr('Верфь','Shipyard')}</span></button><button data-view="arena" class="${view==='arena'?'on':''}"><i>⌁</i><span>${tr('Арена','Arena')}</span><b>${online}</b></button>${view==='battle'?`<button class="on" disabled><i>⚔</i><span>${tr('Бой','Battle')}</span></button>`:''}</nav>${incoming?modal():''}${toast?`<div class="ref-toast" role="status">${esc(toast)}</div>`:''}<footer class="ref-version">v${esc(version.version)} · ${esc(version.commit)}</footer>`;
}

function hangar(){
  return frame(`<section class="ref-upgrade-screen"><div class="ref-screen-heading"><div><span>${tr('ОРБИТАЛЬНАЯ ВЕРФЬ 07','ORBITAL SHIPYARD 07')}</span><h1>${tr('Собери свой Vanguard','Build your Vanguard')}</h1><p>${tr('Меняй архитектуру корабля, усиливай системы и готовься к дуэли.','Rebuild your ship, reinforce its systems, and prepare for a duel.')}</p></div><div class="ref-resource"><small>${tr('КРЕДИТЫ','CREDITS')}</small><b>${profile?.credits||0}</b><em>${tr('ПОБЕДЫ','WINS')} ${profile?.victories||0}</em></div></div><div class="ref-workshop"><div class="ref-workshop-title"><div><i></i><span>CF–VANGUARD</span><b>${tr('ГОТОВ К МОДИФИКАЦИИ','READY FOR MODIFICATION')}</b></div><small>${tr('Нажми модуль · перетащи · улучши','Tap module · drag · upgrade')}</small></div><div class="ref-workshop-stage">${shipBuilder()}${moduleInspector()}</div>${inventoryStrip()}</div><section class="ref-upgrades"><div class="ref-section-heading"><div><span>02</span><div><b>${tr('СИСТЕМЫ КОРАБЛЯ','SHIP SYSTEMS')}</b><small>${tr('Постоянные улучшения между боями','Permanent upgrades between battles')}</small></div></div><em>${upgradeDefs.filter(def=>(profile?.upgrades[def.key]||0)>0).length}/${upgradeDefs.length}</em></div><div class="ref-up-grid">${upgradeDefs.map(upgradeCard).join('')}</div></section><section class="ref-armory"><div class="ref-armory-title"><span>03</span><div><b>${tr('ОРУЖЕЙНАЯ','ARMORY')}</b><small>${tr('Выбери до двух систем огня','Choose up to two firing systems')}</small></div></div><div class="ref-weapon-list">${weaponMeta.map(w=>`<button data-equip="${w.id}" class="${loadout.weapons.includes(w.id)?'active':''}"><i>${w.icon}</i><span><b>${tr(w.ru,w.en)}</b><small>${tr(w.descRu,w.descEn)}</small></span><em>${loadout.weapons.includes(w.id)?tr('УСТАНОВЛЕНО','EQUIPPED'):tr('В РЕЗЕРВЕ','RESERVE')}</em></button>`).join('')}</div></section><div class="ref-up-footer"><button id="reset" class="secondary"><i>↺</i>${tr('Сбросить','Reset')}</button><button id="save" class="secondary"><i>✓</i>${tr('Сохранить','Save')}</button><button id="go-arena" class="primary"><span>${tr('В АРЕНУ','ENTER ARENA')}</span><i>→</i></button></div></section>`);
}
function shipBuilder(){
  return `<div class="ref-builder"><div class="ref-scan"><i></i></div><div class="ref-ship-backdrop"><i class="engine top"></i><i class="engine bottom"></i></div>${builderLinks()}${loadout.modules.map(place=>moduleButton(place)).join('')}<div class="ref-builder-hint"><i>↔</i>${tr('Перетаскивай модули и меняй их местами','Drag modules and swap their positions')}</div></div>`;
}
function builderLinks(){
  const byId=new Map(loadout.modules.map(m=>[m.id,m]));
  return `<svg class="ref-links" viewBox="0 0 100 100" preserveAspectRatio="none">${MODULE_LINKS.flatMap(([a,b])=>{const from=byId.get(a),to=byId.get(b);return from&&to?[`<line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}"></line>`]:[]}).join('')}</svg>`;
}
function moduleButton(place:Place){
  const meta=moduleMeta(place.id);const level=profile?.upgrades[upgradeKey(place.id)]||0;
  return `<button data-drag="${place.id}" data-select-module="${place.id}" class="ref-module kind-${meta.kind} ${selectedModuleId===place.id?'selected':''}" style="left:${place.x}%;top:${place.y}%" title="${esc(tr(meta.descriptionRu,meta.descriptionEn))}"><i>${meta.icon}</i><span>${esc(tr(meta.ru,meta.en))}</span><small>Lv ${level}</small></button>`;
}
function moduleInspector(){
  const id=selectedModuleId&&installed(selectedModuleId)?selectedModuleId:(loadout.modules[0]?.id||null);if(!id)return '';
  selectedModuleId=id;const meta=moduleMeta(id);const place=loadout.modules.find(m=>m.id===id)!;const key=upgradeKey(id);const level=profile?.upgrades[key]||0;const cost=100*(level+1);
  return `<aside class="ref-selected"><div class="ref-selected-label"><span>${tr('ВЫБРАННЫЙ МОДУЛЬ','SELECTED MODULE')}</span><em>${id.toUpperCase()}</em></div><div class="ref-selected-main"><div class="ref-selected-icon kind-${meta.kind}">${meta.icon}</div><div><b>${esc(tr(meta.ru,meta.en))}</b><small>${esc(tr(meta.roleRu,meta.roleEn))}</small></div></div><p>${esc(tr(meta.descriptionRu,meta.descriptionEn))}</p><div class="ref-selected-stats"><span><small>${tr('УРОВЕНЬ','LEVEL')}</small><b>${level}<i>/5</i></b></span><span><small>${tr('ПОЗИЦИЯ','POSITION')}</small><b>${place.x.toFixed(0)}:${place.y.toFixed(0)}</b></span></div><div class="ref-selected-actions"><button data-upgrade-selected="${key}" ${busy||level>=5?'disabled':''}><span>${level>=5?'MAX':tr('УЛУЧШИТЬ','UPGRADE')}</span><b>${level>=5?'':`${cost} C`}</b></button><button data-remove-module="${id}" ${!canRemove(id)?'disabled':''} title="${tr('Снять модуль','Remove module')}">−</button></div></aside>`;
}
function inventoryStrip(){
  const missing=defaults.modules.filter(module=>!installed(module.id));
  return missing.length?`<div class="ref-inventory"><b>${tr('СНЯТЫЕ МОДУЛИ','REMOVED MODULES')}</b>${missing.map(module=>{const meta=moduleMeta(module.id);return `<button data-add-module="${module.id}">${meta.icon} ${esc(tr(meta.ru,meta.en))} ＋</button>`}).join('')}</div>`:'';
}
function upgradeCard(def:UpgradeDef){
  const level=profile?.upgrades[def.key]||0;const cost=100*(level+1);const effect=lang==='ru'?def.effectRu(level):def.effectEn(level);
  const icon=moduleMeta(def.key==='engines'?'engine-left':def.key==='weapons'?'weapon-left':def.key==='sensors'?'sensor':def.key==='fire-protection'?'armor-top':def.key==='electrical-shielding'?'core':def.key).icon;
  return `<article class="ref-up-card"><div class="ref-up-card-head"><i>${icon}</i><h3>${tr(def.ru,def.en)}<span>${tr('УР.','LV.')} ${level}/5</span></h3></div><p>${tr(def.descRu,def.descEn)}</p><div class="ref-level-track">${Array.from({length:5},(_,index)=>`<i class="${index<level?'on':''}"></i>`).join('')}</div><div class="ref-up-stats">${level>0?`<em>${esc(effect)}</em>`:tr('Базовая конфигурация','Base configuration')}</div><button class="plus" data-upgrade="${def.key}" ${busy||level>=5?'disabled':''}><span>${level>=5?'MAX':tr('УЛУЧШИТЬ','UPGRADE')}</span><b>${level>=5?'':`${cost} C`}</b></button></article>`;
}

function arenaView(){
  return frame(`<section class="ref-arena-screen"><div class="ref-screen-heading arena"><div><span>${tr('СЕКТОР ДУЭЛЕЙ 12','DUEL SECTOR 12')}</span><h1>${tr('Онлайн-арена','Online Arena')}</h1><p>${tr('Выбери пилота или проведи тренировочный бой с AI.','Challenge a pilot or run an AI training duel.')}</p></div><div class="ref-online-count"><i></i><small>${tr('ПИЛОТОВ В СЕТИ','PILOTS ONLINE')}</small><b>${online}</b></div></div><div class="ref-arena-radar"><div><i></i><i></i><i></i><span>${tr('ПОИСК СИГНАЛОВ','SCANNING SIGNALS')}</span></div></div><div class="ref-pilot-list">${pilots.length?pilots.map(pilotRow).join(''):`<div class="ref-empty"><i>⌁</i><b>${tr('Свободных пилотов пока нет','No pilots are currently available')}</b><p>${tr('Проверь радар ещё раз или начни тренировочный бой.','Scan again or start a training battle.')}</p></div>`}</div><div class="ref-up-footer arena-actions"><button data-view="hangar" class="secondary">${tr('← ВЕРФЬ','← SHIPYARD')}</button><button id="refresh" class="secondary">↻ ${tr('СКАНИРОВАТЬ','SCAN')}</button><button id="ai" class="primary"><span>${tr('БОЙ С AI','FIGHT AI')}</span><i>→</i></button></div>${outgoing?`<div class="ref-wait"><i></i>${tr('Ждём ответ от','Waiting for')} <b>${esc(outgoing.toName)}</b>…</div>`:''}</section>`);
}
function pilotRow(p:Pilot){const available=p.status==='online_available';return `<article class="ref-pilot"><div class="ref-pilot-avatar">${esc(p.displayName.slice(0,1).toUpperCase())}<span class="dot ${available?'ok':'busy'}"></span></div><div class="ref-pilot-info"><b>${esc(p.displayName)}</b><small>LV ${p.level} · ${p.rating} ELO</small></div><div class="ref-pilot-power"><small>${tr('МОЩЬ КОРАБЛЯ','SHIP POWER')}</small><b>${p.shipPower}</b></div><em class="${available?'ok':'busy'}">${available?tr('ГОТОВ','READY'):tr('В БОЮ','IN BATTLE')}</em><button data-challenge="${p.id}" ${!available||!!outgoing?'disabled':''}><span>${tr('ВЫЗВАТЬ','CHALLENGE')}</span><i>⚔</i></button></article>`;}

function battleView(){
  if(!battle)return hangar();const me=myShip()!,foe=enemyShip()!;const myTurn=battle.status==='active'&&battle.activeSide===own&&!animating;
  return frame(`<section class="ref-game-wrap"><div class="ref-battle-heading"><div><span>${pvp?tr('РЕЙТИНГОВАЯ ДУЭЛЬ','RANKED DUEL'):tr('ТРЕНИРОВОЧНЫЙ БОЙ','TRAINING BATTLE')}</span><b>${esc(me.name)} <i>VS</i> ${esc(foe.name)}</b></div><div class="ref-battle-signal"><i></i>${pvp?tr('СИНХРОНИЗАЦИЯ','SYNCHRONIZED'):tr('СИМУЛЯЦИЯ','SIMULATION')}</div></div><div class="cf-battlefield ref-game-canvas"><div class="ref-hint"><i>${mode.kind==='repair'?'✚':'⌖'}</i><span>${mode.kind==='repair'?tr('Выбери повреждённый модуль своего корабля','Choose a damaged module on your ship'):tr('Выбери систему противника для атаки','Choose an enemy system to attack')}</span></div><div class="ref-ships">${combatShip(me,true)}<div class="ref-space-gap"><i></i><span>VS</span></div>${combatShip(foe,false)}</div><div class="ref-log">${battle.log.slice(-8).reverse().map(entry=>`<div class="${logClass(entry.text)}"><b>T${entry.turn}</b><span>${esc(entry.text)}</span></div>`).join('')}</div>${battle.status==='finished'?endOverlay(battle,me,foe):''}</div><div class="ref-hud">${shipHud(me,tr('ТЫ','YOU'),false)}<div class="ref-turn-box ${myTurn?'player':'bot'}"><i></i><span>${battle.status==='finished'?tr('БОЙ ОКОНЧЕН','BATTLE OVER'):animating?tr('СНАРЯД В ПОЛЁТЕ','PROJECTILE IN FLIGHT'):myTurn?tr('ТВОЙ ХОД','YOUR TURN'):tr('ХОД СОПЕРНИКА','OPPONENT TURN')}</span><small>${tr('ХОД','TURN')} ${battle.turn}</small></div>${shipHud(foe,pvp?tr('СОПЕРНИК','OPPONENT'):tr('БОТ','BOT'),true)}</div><div class="ref-weapons">${battle.weapons.filter(w=>me.weaponIds.includes(w.id)).map(w=>{const meta=weaponMeta.find(x=>x.id===w.id);return `<button data-weapon="${w.id}" class="${mode.kind==='fire'&&mode.weaponId===w.id?'active':''}" ${!myTurn||busy?'disabled':''}><i>${meta?.icon||'◆'}</i><span><b>${meta?tr(meta.ru,meta.en):esc(w.name)}</b><small>${tr('ОРУЖИЕ','WEAPON')} · ${meta?.key||''}</small></span></button>`}).join('')}<button id="repair" class="repair ${mode.kind==='repair'?'active':''}" ${!myTurn||busy?'disabled':''}><i>✚</i><span><b>${tr('РЕМОНТ','REPAIR')}</b><small>${me.repairKits} ${tr('КОМПЛ.','KITS')}</small></span></button></div><div class="ref-controls"><span>${tr('Один ход','One turn')}</span><b>${tr('выстрел ИЛИ ремонт','fire OR repair')}</b><i>🔥 ${tr('пожар','fire')}</i><i>⚡ ${tr('КЗ','short')}</i></div></section>`);
}
function combatShip(ship:Ship,friendly:boolean){
  const sideClass=friendly?'friend':'enemy';
  return `<div class="cf-combatship ${sideClass} ref-combatship"><div class="ref-ship-caption"><span>${friendly?tr('СОЮЗНЫЙ КОРАБЛЬ','ALLIED SHIP'):tr('ВРАЖЕСКИЙ КОРАБЛЬ','HOSTILE SHIP')}</span><b>${esc(ship.name)}</b><em>${ship.integrity}%</em></div><div class="cf-combatfield ref-combatfield"><div class="ref-ship-frame"><i class="engine top"></i><i class="engine bottom"></i></div>${combatLinks(ship,friendly)}${ship.modules.map(module=>combatModule(module,friendly)).join('')}</div></div>`;
}
function combatLinks(ship:Ship,friendly:boolean){
  const byId=new Map(ship.modules.map(m=>[m.id,m]));const x=(value:number)=>friendly?value:100-value;
  return `<svg class="ref-links combat" viewBox="0 0 100 100" preserveAspectRatio="none">${MODULE_LINKS.flatMap(([a,b])=>{const from=byId.get(a),to=byId.get(b);return from&&to?[`<line x1="${x(from.x)}" y1="${from.y}" x2="${x(to.x)}" y2="${to.y}"></line>`]:[]}).join('')}</svg>`;
}
function combatModule(module:Mod,friendly:boolean){
  const meta=moduleMeta(module.id);const left=friendly?module.x:100-module.x;const ratio=Math.max(0,module.hp/module.maxHp*100);
  return `<button data-module="${module.id}" data-friendly="${friendly}" class="ref-node kind-${meta.kind} ${String(module.condition).toLowerCase()} ${module.fireTurns?'burning':''} ${module.shortTurns?'shorted':''}" style="left:${left}%;top:${module.y}%" ${module.hp<=0?'disabled':''} title="${esc(tr(meta.ru,meta.en))} · ${Math.round(ratio)}%"><i>${meta.icon}</i><strong>${esc(tr(meta.ru,meta.en))}</strong><span><em style="width:${ratio}%"></em></span>${module.fireTurns?'<b>🔥</b>':''}${module.shortTurns?'<b>⚡</b>':''}</button>`;
}
function shipHud(ship:Ship,label:string,enemy:boolean){
  const ratios=systemRatios(ship);
  return `<div class="ref-side ${enemy?'enemy-side':''}"><span class="label">${label}</span><div class="ref-hp"><i style="width:${ship.integrity}%"></i></div>${hudBar(tr('Питание','Power'),ratios.power,'pwr')}${hudBar(tr('Двигатели','Engines'),ratios.engines,'eng')}${hudBar(tr('Орудия','Weapons'),ratios.weapons,'wpn')}${hudBar(tr('Броня','Armor'),ratios.armor,'arm')}<div class="ref-tags">${statusTags(ship)}</div></div>`;
}
function hudBar(label:string,value:number,kind:string){return `<div class="ref-mod-label">${label}</div><div class="ref-mod-bar"><i class="${kind}" style="width:${Math.round(value*100)}%"></i></div>`;}
function systemRatios(ship:Ship){
  const ratio=(predicate:(m:Mod)=>boolean,missing=0)=>{const list=ship.modules.filter(predicate);if(!list.length)return missing;return list.reduce((sum,m)=>sum+(m.hp<=0?0:(m.hp/m.maxHp)*(m.powered?1:.2)*(m.shortTurns>0?.25:1)),0)/list.length;};
  return {power:ratio(m=>moduleKindFromId(m.id)==='core'),engines:ratio(m=>moduleKindFromId(m.id)==='engine'),weapons:ratio(m=>moduleKindFromId(m.id)==='weapon'),armor:ratio(m=>moduleKindFromId(m.id)==='armor')};
}
function statusTags(ship:Ship){
  const tags:string[]=[];if(ship.modules.some(m=>m.fireTurns>0))tags.push('<span class="fire">🔥 ПОЖАР</span>');if(ship.modules.some(m=>m.shortTurns>0))tags.push('<span class="short">⚡ КЗ</span>');if(ship.modules.some(m=>m.hp<=0))tags.push(`<span class="dead">${tr('ЕСТЬ ПОТЕРИ','SYSTEMS LOST')}</span>`);if(!tags.length)tags.push(`<span class="ok">${tr('СИСТЕМЫ В НОРМЕ','SYSTEMS OK')}</span>`);return tags.join('');
}
function logClass(text:string){if(/destroy|уничтож|critical|крит/i.test(text))return 'crit';if(/fire|пожар|short|замык/i.test(text))return 'effect';if(/hit|попал|miss|промах/i.test(text))return 'hit';return 'sys';}
function endOverlay(current:Battle,me:Ship,foe:Ship){
  const won=current.winner===own;return `<div class="ref-end"><h2>${won?tr('ПОБЕДА','VICTORY'):tr('ПОРАЖЕНИЕ','DEFEAT')}</h2><p>${esc(me.name)} · ${me.integrity}% &nbsp; / &nbsp; ${esc(foe.name)} · ${foe.integrity}%</p><button id="back" class="primary">${tr('В АРЕНУ','TO ARENA')}</button></div>`;
}
function modal(){return `<div class="ref-modal"><div><small>${tr('ВХОДЯЩИЙ ВЫЗОВ','INCOMING CHALLENGE')}</small><h2>⚔ ${esc(incoming?.fromName)}</h2><p>${tr('вызывает вас на дуэль','challenges you to a duel')}</p><button id="decline">${tr('Отклонить','Decline')}</button><button id="accept" class="primary">${tr('ПРИНЯТЬ БОЙ','ACCEPT DUEL')}</button></div></div>`;}

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
  document.querySelectorAll<HTMLElement>('[data-drag]').forEach(element=>element.onpointerdown=event=>{const field=element.closest('.ref-builder') as HTMLElement;const place=loadout.modules.find(module=>module.id===element.dataset.drag!)!;selectedModuleId=place.id;drag={id:place.id,field,el:element,startX:place.x,startY:place.y};element.setPointerCapture?.(event.pointerId);element.classList.add('selected');});
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
  if(!drag)return;const rect=drag.field.getBoundingClientRect();const x=Math.max(8,Math.min(92,(event.clientX-rect.left)/rect.width*100));const y=Math.max(12,Math.min(88,(event.clientY-rect.top)/rect.height*100));const place=loadout.modules.find(module=>module.id===drag!.id);if(place){place.x=+x.toFixed(1);place.y=+y.toFixed(1);}drag.el.style.left=`${x}%`;drag.el.style.top=`${y}%`;
});
window.addEventListener('pointerup',()=>{
  if(!drag)return;const moved=loadout.modules.find(module=>module.id===drag!.id);if(moved){const other=loadout.modules.filter(module=>module.id!==moved.id).map(module=>({module,distance:Math.hypot(module.x-moved.x,module.y-moved.y)})).sort((a,b)=>a.distance-b.distance)[0];if(other&&other.distance<8){const ox=other.module.x,oy=other.module.y;other.module.x=drag.startX;other.module.y=drag.startY;moved.x=ox;moved.y=oy;toast=tr('Модули поменялись местами','Modules swapped');}else toast=tr('Позиция изменена','Position changed');}drag=null;render();
});
window.addEventListener('keydown',event=>{
  if(view!=='battle'||!battle)return;const key=event.key.toLowerCase();const match=weaponMeta.find(w=>w.key===key);if(match&&myShip()?.weaponIds.includes(match.id)){mode={kind:'fire',weaponId:match.id};render();}if(key==='r'){mode={kind:'repair'};render();}
});

async function boot(){
  render();const query=new URLSearchParams(location.search);
  try{
    version=await fetch('/version.json',{cache:'no-store'}).then(response=>response.json()).catch(()=>version);await identity();loadout=await api<Loadout>('/api/loadout').catch(()=>structuredClone(defaults));
    const migrated=migrateLegacyLayout();selectedModuleId=loadout.modules.some(module=>module.id==='core')?'core':loadout.modules[0]?.id||null;if(migrated)void api<Loadout>('/api/loadout',{method:'PUT',body:JSON.stringify(loadout)}).catch(()=>undefined);
    if(query.get('auth')==='success')toast=tr('Google подключён','Google connected');if(query.has('auth'))history.replaceState({},'',location.pathname);await connect();render();
  }catch(e){toast=err(e);render();}
}
if('serviceWorker'in navigator)window.addEventListener('load',()=>navigator.serviceWorker.register('/sw.js').catch(()=>{}));
void boot();
